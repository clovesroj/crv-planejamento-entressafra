/* ================== CUSTO OPERACIONAL x CUSTO CONTÁBIL ==================
   Duas perguntas diferentes sobre o mesmo plano:

   - quanto custa FAZER a operação — o custo efetivo: diesel, operadores,
     manutenção das máquinas, insumos e terceirização das atividades da
     operação, e em tratos a irrigação (energia, água, materiais);
   - quanto a operação CARREGA na contabilidade — o custo operacional mais os
     rateios: diesel dos equipamentos de apoio, arrendamento, administrativo,
     depreciação e os demais custos gerais do plano.

   Nada aqui é conta nova: tudo sai do que calculo/index.js já apurou, com os
   mesmos critérios de rateio. O que este módulo faz é abrir o custo por
   operação e separar tratos entre cana planta e cana soca.

   Planta x soca. O motor guarda tratosCult sem a irrigação — por isso as duas
   culturas somavam R$ 2,6 mi menos que a etapa. Aqui a irrigação entra em cada
   cultura pela modalidade ("... socaria" é soca, "... plantio" é planta), e a
   parte de tratos no rateio geral é dividida pelo custo direto de cada cultura,
   que é o critério com que o motor reparte esse rateio entre as etapas. Assim
   planta + soca fecha com tratos no centavo. */
import { num } from '../nucleo/formato.js';
import { baseOperacao, comAlternativa, premissaBase } from './base-fisica.js';

/* As operações do painel, na ordem do ciclo da cana. `formacao` marca as que
   põem o canavial de pé — preparo de solo, plantio e tratos de cana planta:
   é a formação do canavial, e é o que o custo por hectare plantado mede. */
const OPERACOES = [
  {id:"preparo",  nome:"Preparo de solo",                etapa:"PREPARO DE SOLO", formacao:true},
  {id:"plantio",  nome:"Plantio",                        etapa:"PLANTIO", formacao:true},
  {id:"planta",   nome:"Tratos culturais — cana planta", etapa:"TRATOS CULTURAIS", cultura:"Planta", formacao:true},
  {id:"soca",     nome:"Tratos culturais — cana soca",   etapa:"TRATOS CULTURAIS", cultura:"Soca"},
  {id:"colheita", nome:"Colheita",                       etapa:"COLHEITA"},
];
// o resto do plano, para o total fechar com o custo do plano
const OUTRAS = [
  {id:"apoio",   nome:"Apoio e conservação", etapa:"APOIO E CONSERVAÇÃO"},
];

// cultura de uma atividade de tratos; sem cultura, o motor conta como soca
const culturaDe = a => a.cultura || "Soca";
// cultura de uma modalidade de irrigação, pelo nome
const culturaIrr = nome => /plantio/i.test(nome) ? "Planta" : /socaria/i.test(nome) ? "Soca" : null;

function custoPorOperacao(R){
  const dep = num(R.depT), diretoSum = R.diretoSum || 1;

  // irrigação por cultura; modalidade sem cultura no nome divide pela área tratada
  const irr = {Planta:0, Soca:0};
  let irrSemCultura = 0;
  (R.IR && R.IR.linhas || []).forEach(l=>{
    const c = culturaIrr(l.nome);
    if(c) irr[c] += num(l.total); else irrSemCultura += num(l.total);
  });
  if(irrSemCultura){
    const haP = (R.tratosCult.Planta||{}).ha||0, haS = (R.tratosCult.Soca||{}).ha||0;
    const f = haP+haS>0 ? haP/(haP+haS) : 0.5;
    irr.Planta += irrSemCultura*f; irr.Soca += irrSemCultura*(1-f);
  }

  function linha(op){
    const d = R.etapas[op.etapa];
    if(!d) return null;
    const naEtapa = R.L.filter(r=>r.a.etapa===op.etapa);
    const ativs = op.cultura ? naEtapa.filter(r=>culturaDe(r.a)===op.cultura) : naEtapa;
    const s = k => ativs.reduce((t,r)=>t+(num(r[k])||0), 0);

    // --- custo operacional: o que a operação consome ---
    const o = {diesel:s("cDiesel"), mdo:s("cMDO"), manut:s("cManut"), insumo:s("cInsumo"),
               terc:s("cTerc"), irrig: op.cultura ? irr[op.cultura] : (d.irrig||0)};
    o.total = o.diesel+o.mdo+o.manut+o.insumo+o.terc+o.irrig;

    // --- rateios da etapa, e a parte desta operação neles ---
    // diesel dos equipamentos de apoio: o motor rateia pelos litros de cada etapa
    const dieselAtivEtapa = naEtapa.reduce((t,r)=>t+r.cDiesel, 0);
    const apoioEtapa = d.diesel - dieselAtivEtapa;
    const litrosEtapa = naEtapa.reduce((t,r)=>t+(num(r.litros)||0), 0);
    const fLitros = op.cultura ? (litrosEtapa>0 ? s("litros")/litrosEtapa : 0) : 1;
    const apoio = apoioEtapa*fLitros;
    // arrendamento e administrativo: o motor já divide tratos por cultura
    const cult = op.cultura ? R.tratosCult[op.cultura] : null;
    const arrend = cult ? (cult.arrend||0) : (d.arrend||0);
    const admin  = cult ? (cult.admin||0)  : (d.admin||0);
    // depreciação e demais custos gerais: o rateio geral vai para as etapas pelo
    // custo direto; dentro de tratos, a mesma regra entre as culturas
    const diretoOp = o.total + apoio;
    const fDireto = op.cultura ? (d.direto>0 ? diretoOp/d.direto : 0) : 1;
    const deprec = dep*(d.direto/diretoSum)*fDireto;
    const gerais = d.indireto*fDireto - deprec;
    const contabil = diretoOp + arrend + admin + deprec + gerais;

    // base física: as premissas do bloco "Base física dos custos" (aba
    // Premissas), via calculo/base-fisica.js. Sem premissa, a soma das
    // atividades — dez passadas no mesmo talhão contam dez hectares, por isso a
    // tela marca quando a base veio daí.
    const ha  = ativs.filter(r=>r.ehHa).reduce((t,r)=>t+r.total, 0);
    const ton = ativs.filter(r=>r.ehTon).reduce((t,r)=>t+r.total, 0);
    const estimado = ha>0 ? {q:ha, un:"ha", rot:"ha operados"} : {q:ton, un:"t", rot:"t"};
    // preparo de solo é feito na área que vai ser plantada: divide pela área de plantio
    const idBase = {preparo:"plantio", plantio:"plantio", planta:"planta", soca:"soca", colheita:"colheita"}[op.id];
    let base = idBase ? baseOperacao(idBase, estimado) : {...estimado, fonte:"atividades"};
    if(op.id==="colheita") base = comAlternativa(base);
    base.haOper = ha;

    return {...op, oper:o, rateio:{apoio, arrend, admin, deprec, gerais,
            total: apoio+arrend+admin+deprec+gerais}, contabil, base};
  }

  const principais = OPERACOES.map(linha).filter(Boolean);
  const outras = OUTRAS.map(linha).filter(Boolean);
  const todas = principais.concat(outras);
  const soma = (lista, f) => lista.reduce((t,l)=>t+f(l), 0);

  /* Formação do canavial = preparo de solo + plantio + tratos de cana planta:
     o que se gasta para pôr o canavial de pé, por hectare plantado. É subtotal,
     não linha a mais — as três operações seguem na tabela e na soma do plano. */
  const partes = principais.filter(l=>l.formacao);
  const somaObj = campo => Object.fromEntries(Object.keys(partes[0]?partes[0][campo]:{})
    .map(k=>[k, soma(partes, l=>l[campo][k])]));
  // a formação divide pela área de plantio: é o canavial que foi posto de pé
  const formacao = partes.length ? {
    id:"formacao", nome:"Formação do canavial", partes: partes.map(l=>l.nome),
    oper: somaObj("oper"), rateio: somaObj("rateio"), contabil: soma(partes, l=>l.contabil),
    base: baseOperacao("plantio", {q:soma(partes, l=>l.base.haOper||0), un:"ha", rot:"ha operados"}),
  } : null;

  return {
    principais, outras, formacao,
    // conferência: a soma de todas as operações tem de ser o custo do plano
    totalOper: soma(todas, l=>l.oper.total),
    totalContabil: soma(todas, l=>l.contabil),
    diferenca: R.total - soma(todas, l=>l.contabil),
    soma,
  };
}

/* Custo por hectare plantado: a formação do canavial — preparo de solo,
   plantio e tratos de cana planta — dividida pela área de plantio. Cana soca,
   colheita e apoio não formam canavial e ficam fora deste indicador. */
/* Custo por hectare plantado: o custo TOTAL da formação do canavial (operação
   + rateios) pela área de plantio. Leva junto as duas parcelas -- a
   operacional (o que custa fazer) e a dos rateios (arrendamento, administração,
   depreciação, apoio e gerais) --, para toda tela mostrar de onde vem o
   número e não confundir com o custo operacional por hectare. */
function custoHaPlantado(R){
  const F = custoPorOperacao(R).formacao;
  const ha = F && F.base && F.base.q>0 ? F.base.q : 0;
  return {valor: ha ? F.contabil/ha : 0, total: F ? F.contabil : 0, ha,
          oper: ha ? F.oper.total/ha : 0, rateio: ha ? F.rateio.total/ha : 0,
          nota: "preparo + plantio + tratos de cana planta"};
}
/* Base de uma operação em hectare que veio da soma das atividades (nenhuma
   premissa de área): dez passadas no mesmo talhão contam dez hectares, e o
   R$/ha sai subestimado. Texto do aviso, ou "" quando a base é premissa. */
function avisoBase(l){
  const b = l && l.base;
  if(!b || b.fonte!=="atividades" || b.un!=="ha" || !(b.q>0)) return "";
  return "⚠ base = soma das passadas: informe a área em Premissas › Base física";
}

/* ---------- custo de colheita, so o corte ----------
   O cartao "Custo de colheita" do Painel e o rastro dele liam a conta cada um
   por si, e os dois somavam A01 + A02. A A02 (colheita de muda) e PLANTIO desde
   a 2.36: misturava muda na colheita e repartia o arrendamento da colheita por
   uma proporcao que incluia uma atividade de fora dela. E deixava de fora a
   parte do administrativo da etapa.

   Agora: corte = atividades da etapa COLHEITA que nao sao transporte nem
   transbordo; o custo dele e o direto mais a parte dele em TODO o custo nao
   direto da etapa (arrendamento, administrativo e indireto), pela participacao
   no custo direto da etapa -- o mesmo criterio com que a etapa recebe os
   rateios. Base: o volume colhido da premissa, ou as toneladas cortadas. */
function custoCorte(R){
  const colh = R.etapas["COLHEITA"] || null;
  const ativs = R.L.filter(r=>r.a.etapa==="COLHEITA" && r.a.tipo!=="transp");
  const direto = ativs.reduce((s,r)=>s+r.direto,0);
  const f = colh && colh.direto>0 ? direto/colh.direto : 0;
  const rat = {arrend:(colh?colh.arrend||0:0)*f, admin:(colh?colh.admin||0:0)*f, indireto:(colh?colh.indireto||0:0)*f};
  const total = direto + rat.arrend + rat.admin + rat.indireto;
  const tonPrem = premissaBase("colheita"), ton = ativs.reduce((s,r)=>s+r.total,0);
  const base = tonPrem ? {q:tonPrem, un:"t", rot:"t colhidas", fonte:"premissa"}
                       : {q:ton, un:"t", rot:"t cortadas", fonte:"atividades"};
  return {ativs, direto, rat, total, fracao:f, base, cods: ativs.map(r=>r.a.cod)};
}

/* Natureza fina do custo total. Mora aqui para a aba Custos, o Painel, o
   relatório e o rastro lerem a mesma lista: natureza nova entra num lugar só. */
function comps(R){
  return [["Mão de obra direta",R.mdoDireta],["MDO equipamentos de apoio",R.mdoApoio],["MDO quadro ADM agrícola",R.mdoIndirT],
    ["MDO quadro da oficina",R.mdoManut],["MDO apoio operacional",R.mdoApoioOper],["FAT (contrato suspenso)",R.mdoFat],
    ["Combustível (diesel)",R.dieselT],
    ["Manutenção e materiais",R.manutT],["Insumos agronômicos",R.insumoT],
    ["Irrigação e fertirrigação",R.irrT],["Transporte de pessoal",R.tpessT],["Terceirização de aplicações",R.tercAtivT],["Terceirizações (contratos)",R.tercT],
    ["Custos esporádicos",R.espT],["Arrendamento",R.arrT],
    ["Administração",R.admT],["Depreciação",R.depT]];
}

/* ---------- aderência à referência setorial ----------
   Os quatro grupos do Painel e o peso de referência de cada um. Têm de somar o
   custo total: antes a terceirização de aplicações e o transporte de pessoal
   não entravam em grupo nenhum, e o percentual projetado não fechava 100%.
   Cada grupo guarda as partes (com a chave do rastro de cada uma): a tabela, o
   gráfico e o rastro bench:<grupo> leem a mesma conta. */
function referenciaSetorial(R){
  const g = (id, nome, curto, ref, partes) => {
    const v = partes.reduce((s,p)=>s+num(p.v),0);
    const pct = R.total>0 ? v/R.total*100 : 0, desvio = pct - ref;
    const leitura = Math.abs(desvio)<=5 ? "Aderente" : desvio>5 ? "Acima" : "Abaixo";
    return {id, nome, curto, ref, v, pct, desvio, leitura, partes};
  };
  const grupos = [
    g("oper", "Operações (MDO + manutenção + diesel + aplicações terceirizadas)", "Operações", 52, [
      {rot:"Mão de obra", v:R.mdoTotal, ir:"cat:mdo"}, {rot:"Manutenção e materiais", v:R.manutT, ir:"cat:manut"},
      {rot:"Diesel", v:R.dieselT, ir:"cat:diesel"}, {rot:"Aplicações terceirizadas", v:R.tercAtivT, ir:"nat:terc"}]),
    g("insumos", "Insumos (agronômicos + irrigação)", "Insumos", 25, [
      {rot:"Insumos agronômicos", v:R.insumoT, ir:"cat:insumo"}, {rot:"Irrigação e fertirrigação", v:R.irrT, ir:"cat:irrig"}]),
    g("arrend", "Arrendamento", "Arrendamento", 17, [{rot:"Arrendamento", v:R.arrT, ir:"cat:arrend"}]),
    g("outros", "Outros (admin + depreciação + contratos de terceiros + transporte de pessoal + esporádicos)", "Outros", 6, [
      {rot:"Administração", v:R.admT, ir:"nat:admin"}, {rot:"Depreciação", v:R.depT, ir:"cat:fixo"},
      {rot:"Contratos de terceiros", v:R.tercT, ir:"cat:terc"}, {rot:"Transporte de pessoal", v:R.tpessT, ir:"cat:tpess"},
      {rot:"Esporádicos", v:R.espT, ir:"cat:espor"}]),
  ];
  return {grupos, total: grupos.reduce((s,x)=>s+x.v,0)};
}

export { OPERACOES, OUTRAS, avisoBase, comps, culturaIrr, custoCorte, custoHaPlantado, custoPorOperacao, referenciaSetorial };

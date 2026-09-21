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

// as operações do painel, na ordem do ciclo da cana
const OPERACOES = [
  {id:"plantio",  nome:"Plantio",                        etapa:"PLANTIO"},
  {id:"planta",   nome:"Tratos culturais — cana planta", etapa:"TRATOS CULTURAIS", cultura:"Planta"},
  {id:"soca",     nome:"Tratos culturais — cana soca",   etapa:"TRATOS CULTURAIS", cultura:"Soca"},
  {id:"colheita", nome:"Colheita",                       etapa:"COLHEITA"},
];
// o resto do plano, para o total fechar com o custo do plano
const OUTRAS = [
  {id:"preparo", nome:"Preparo de solo",     etapa:"PREPARO DE SOLO"},
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

    // base física: hectares operados ou toneladas, como na tabela de custo por etapa
    const ha  = ativs.filter(r=>r.ehHa).reduce((t,r)=>t+r.total, 0);
    const ton = ativs.filter(r=>!r.ehHa && r.a.tipo!=="transp").reduce((t,r)=>t+r.total, 0);
    const base = ha>0 ? {q:ha, un:"ha"} : {q:ton, un:"t"};

    return {...op, oper:o, rateio:{apoio, arrend, admin, deprec, gerais,
            total: apoio+arrend+admin+deprec+gerais}, contabil, base};
  }

  const principais = OPERACOES.map(linha).filter(Boolean);
  const outras = OUTRAS.map(linha).filter(Boolean);
  const todas = principais.concat(outras);
  const soma = (lista, f) => lista.reduce((t,l)=>t+f(l), 0);
  return {
    principais, outras,
    // conferência: a soma de todas as operações tem de ser o custo do plano
    totalOper: soma(todas, l=>l.oper.total),
    totalContabil: soma(todas, l=>l.contabil),
    diferenca: R.total - soma(todas, l=>l.contabil),
    soma,
  };
}

export { OPERACOES, OUTRAS, custoPorOperacao };

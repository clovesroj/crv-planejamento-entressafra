import { ADM_CRITERIOS } from '../dados/administrativo.js';
import { CFG } from '../dados/cfg.js';
import { ESCALAS } from '../dados/escalas.js';
import { CAT_LBL, MESES, NM, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { P, insLista } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { ETAPAS_ORD, arrRat } from './arrendamento.js';
import { criterioMensal, diretoNoMes, frotaDaAtividade, pessoasDaAtividade, premissasDe, tarifaTerc } from './atividade.js';
import { composicao, doseBase, tratCusto, tratamentosDaLinha } from './insumos.js';
import { comps, custoCorte, custoPorOperacao, referenciaSetorial } from './custo-operacao.js';
import { CONTA_COMBINADA, SEM_CONTA, contasOrigens, contasValores, totaisContas } from './contas.js';
import { demandas, demandasInsumos, demandasMateriais } from './demandas.js';
import { baseEtapa, custoUnit, premissaBase, rotuloBase } from './base-fisica.js';
import { reforma, itensReforma, orcamentoProdutos, qtdProdutos } from './reforma.js';
import { desdeUltimoAno, janelaGastoReal, janelaVazia, produtosDoEquipamento } from './gasto-real.js';
import { tagsBiDoConjunto } from '../dados/reforma-bi-map.js';
import { fontesDaConta } from './fontes.js';
import { dieselOrcado } from './diesel.js';
import { filtrarPessoas, grupoIdx } from './pessoas.js';
import { confrontoQuadro, linhaNoPeriodo, somarConfronto } from './quadro.js';
import { codExibir } from '../nucleo/codigo-atividade.js';

// soma um array de NM meses respeitando o filtro de período (mesmo critério de R.PER)
const somaPeriodo = (arr, periodo) => !arr ? 0
  : periodo==="todos" ? arr.reduce((s,v)=>s+num(v),0)
  : arr.reduce((s,v,i)=>s+(periodoMes(i)===periodo?num(v):0),0);

/* ================== RASTRO DOS CÁLCULOS ==================
   Monta a explicação de um custo, descendo a cadeia:

     custo total -> centro de custo -> etapa -> atividade -> área -> horas
     -> equipamento -> consumo -> preço -> premissa

   Função pura: recebe o resultado consolidado e uma chave, devolve o que a
   tela precisa desenhar. Nada de DOM aqui.

   Chave: "total" | "etapa:COLHEITA" | "ativ:A01" | "nat:diesel" | "mes:3"
   Cada linha pode trazer `ir`, que é a chave do nível de baixo. */

const NAT = {
  diesel: "Combustível (diesel)", mdo: "Mão de obra", manut: "Manutenção (CRM)",
  insumo: "Insumos agronômicos", terc: "Terceirização de aplicações",
  arrend: "Arrendamento", admin: "Administração",
};

/* Premissas de UMA atividade: o transporte roda com jornada e disponibilidade
   proprias, e o rastro que explica o numero dele tem de citar as que o motor
   usou -- citar 16,8 h para um caminhao que foi dimensionado com 20 h era
   explicar a conta com o dado errado. */
function premissasDaAtividade(a){
  const pr = premissasDe(a);
  return premissasGerais().map(l =>
    l.rot === "Horas efetivas por dia"   ? {...l, val: fmt(pr.hDia,1)+" h"+(pr.transp?" (transporte)":"")} :
    l.rot === "Disponibilidade mecânica" ? {...l, val: fmt(pr.disp*100,0)+"%"+(pr.transp?" (transporte)":"")} : l);
}
/* R do rastro que está sendo montado: as premissas gerais leem dele o diesel
   orçado (a aba Combustível), sem precisar receber R em cada chamada. */
let R_ATUAL = null;
function premissaDiesel(){
  const D = dieselOrcado(R_ATUAL && R_ATUAL.CB);
  return {rot:"Diesel orçado (aba Combustível)", val:brl(D.medio,2)+"/L",
    sub: "preço médio ponderado pelos litros de cada mês"
      + (D.variaNoAno ? " · de "+brl(D.min,2)+" a "+brl(D.max,2)+"/L nos meses" : " · o mesmo preço em todos os meses")};
}
function premissasGerais(){
  return [
    {rot:"Dias efetivos por mês",        val:fmt(P.dias)},
    {rot:"Horas efetivas por dia",       val:fmt(P.hdia,1)+" h"},
    {rot:"Disponibilidade mecânica",     val:fmt(P.disp,0)+"%"},
    {rot:"Eficiência operacional",       val:fmt(num(P.efic)>0?num(P.efic):100,0)+"%"},
    {rot:"Meses do orçamento",           val:NM+" ("+MESES[0]+" a "+MESES[NM-1]+")"},
    premissaDiesel(),
  ];
}
// premissas do que é gente: escala, turno e de onde vem cada quadro
function premissasPessoas(R){
  return [
    {rot:"Dias de operação por semana",  val:fmt(P.diasOper)},
    {rot:"Dias trabalhados por colaborador", val:fmt(P.diasTrab), sub:"6 no 6x1 · 5 no 5x2"},
    {rot:"Fator de rodízio (escala)",    val:fmt(R.MP.fatorEscala,2), sub:"dias de operação ÷ dias trabalhados"},
    {rot:"Horas por turno",              val:fmt(P.hTurno)+" h"},
    {rot:"Quadro ADM agrícola e oficina", val:"previsto da controladoria", sub:"lançado de dez/26 a mar/27 (aba Mão de Obra)"},
    {rot:"Meses do orçamento",           val:NM+" ("+MESES[0]+" a "+MESES[NM-1]+")"},
  ];
}

/* ---------- nível 1: custo total ---------- */
function rastroTotal(R){
  const etapas = Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total);
  const somaEtapas = etapas.reduce((s,[,d])=>s+d.total,0);
  const fora = R.total - somaEtapas;
  return {
    titulo: "Custo total projetado",
    subtitulo: "Todo o plano, por centro de custo",
    valor: brl(R.total),
    blocos: [
      {titulo:"Centros de custo (etapas do plano)", linhas: etapas.map(([e,d])=>({
        rot:e, val:brl(d.total), ir:"etapa:"+e,
        sub:`${d.ha>0?fmt(d.ha)+" ha · ":""}${d.ton>0?fmt(d.ton)+" t · ":""}${fmt(d.horas||0)} h de máquina`}))
        .concat(Math.abs(fora)>1 ? [{rot:"Sem etapa com custo direto para absorver",
          val:brl(fora), sub:"aparece só nas grandes contas"}] : [])},
      {titulo:"Por natureza", linhas:[
        {rot:NAT.diesel, val:brl(R.dieselT), ir:"nat:diesel"},
        {rot:NAT.mdo,    val:brl(R.mdoTotal), ir:"nat:mdo"},
        {rot:NAT.manut,  val:brl(R.manutT), ir:"nat:manut"},
        {rot:NAT.insumo, val:brl(R.insumoT), ir:"nat:insumo"},
        {rot:NAT.terc,   val:brl(R.tercAtivT+R.tercT)},
        {rot:NAT.arrend, val:brl(R.arrT), ir:"nat:arrend"},
        {rot:NAT.admin,  val:brl(R.admT), ir:"nat:admin"},
        {rot:"Depreciação", val:brl(R.depT), sub:brl(P.imob)+" de imobilizado a "+fmt(P.dep,0)+"% ao ano"},
      ]},
      {titulo:"Por período", linhas:[
        {rot:"Safra (abr a nov)",        val:brl(R.PER.safra.total)},
        {rot:"Entressafra (dez a mar)",  val:brl(R.PER.entressafra.total)},
      ]},
    ],
    premissas: premissasGerais(),
  };
}

/* ---------- custo por hectare plantado ----------
   O cartão mostra custo total ÷ área de plantio; o rastro tem de explicar essa
   divisão, e não o custo total — era o que abria antes. Segue o filtro de
   período da barra de cima, como o cartão. */
// custo das atividades de muda (colheita, transbordo e transporte), com a parte
// delas nos rateios da colheita — o mesmo critério da tabela do modelo PECEGE
function custoDaMuda(R){
  const ehMuda = a => a.cod==="A02" || a.src==="A02";
  const colh = custoPorOperacao(R).principais.find(l=>l.id==="colheita");
  const dirMuda = R.L.filter(r=>r.a.etapa==="COLHEITA" && ehMuda(r.a)).reduce((s,r)=>s+r.direto,0);
  const dirColh = R.L.filter(r=>r.a.etapa==="COLHEITA").reduce((s,r)=>s+r.direto,0);
  const rat = colh ? colh.rateio.apoio+colh.rateio.admin+colh.rateio.deprec+colh.rateio.gerais : 0;
  return dirMuda + (dirColh>0 ? rat*dirMuda/dirColh : 0);
}
function rastroCustoHa(R){
  const ha = num(P.plantio);
  const C = custoPorOperacao(R);
  const F = C.formacao;
  const partes = C.principais.filter(l=>l.formacao);
  const porHa = v => ha>0 ? brl(v/ha)+"/ha" : "—";
  const tot = F ? F.contabil : 0;
  const S = R.SEL;
  const blocos = [
    {titulo:"A conta", linhas:[
      {rot:"Formação do canavial", val:brl(tot), ir:"op:formacao",
       sub:"preparo de solo + plantio + tratos culturais de cana planta"},
      {rot:"Área de plantio", val:fmt(ha)+" ha", sub:"premissa, aba Premissas"},
      {rot:"Custo por hectare plantado", val:porHa(tot), sub:"formação do canavial ÷ área de plantio"},
    ]},
    {titulo:"As etapas que formam o canavial", linhas: partes.map(l=>({
      rot:l.nome, val:porHa(l.contabil), ir:"op:"+l.id,
      sub:brl(l.contabil)+" · "+fmt(tot>0?l.contabil/tot*100:0,1)+"% da formação"}))},
    {titulo:"O que entra no hectare plantado", linhas: F ? [
      {rot:"Operação — máquinas, mão de obra e insumos", val:porHa(F.oper.total), sub:brl(F.oper.total)},
      {rot:"Rateios — apoio, arrendamento, administrativo, depreciação e gerais",
       val:porHa(F.rateio.total), sub:brl(F.rateio.total)},
    ] : []},
    /* O que a cana soca, a colheita e o apoio custam não forma canavial: fica
       fora deste indicador, e aparece aqui para a conta do plano fechar. A muda
       é o caso de fronteira: no Plano Operacional a colheita e o transporte de
       muda estão na etapa Colheita, e é lá que este indicador os deixa; a
       tabela do modelo PECEGE, no Painel, os conta como insumo do plantio. */
    {titulo:"Fora do hectare plantado (o resto do plano)", linhas: C.principais.concat(C.outras)
      .filter(l=>!l.formacao).map(l=>({rot:l.nome, val:brl(l.contabil), ir:"op:"+l.id}))
      .concat(custoDaMuda(R)>0.5 ? [{rot:"↳ dentro da colheita: mudas (colheita, transbordo e transporte)",
        val:brl(custoDaMuda(R)), sub:(ha>0?brl(custoDaMuda(R)/ha)+"/ha · ":"")+"na tabela de custo por hectare do Painel entra no plantio"}] : [])
      .concat([{rot:"Custo total do plano"+(S.parcial?" — "+S.rotulo:""), val:brl(S.total), ir:"total",
        sub:ha>0 ? brl(S.total/ha)+"/ha de plantio, com o plano inteiro" : ""}])},
  ];
  return {
    titulo:"Custo por hectare plantado",
    subtitulo:"formação do canavial ÷ área de plantio",
    valor: porHa(tot),
    blocos,
    premissas:[{rot:"Área de plantio", val:fmt(ha)+" ha"}].concat(premissasGerais()),
    voltar:"total",
  };
}

/* ---------- uma operação: plantio, cana planta, cana soca, colheita, formação ----------
   Os cartões de tratos por cultura abriam a etapa inteira de tratos, e o de
   formação do canavial abriria o custo por hectare do plano. Aqui a própria
   operação: custo operacional aberto por natureza, cada rateio, e as
   atividades — com a mesma base física do cartão. */
function rastroOperacao(R, id, modo){
  const C = custoPorOperacao(R);
  const l = id==="formacao" ? C.formacao : C.principais.concat(C.outras).find(x=>x.id===id);
  if(!l) return rastroTotal(R);
  const b = l.base, porUn = v => custoUnit(v, b);
  const rotBase = rotuloBase(b);
  const o = l.oper, r = l.rateio;
  const OPER = [["diesel","Diesel das máquinas da operação"],["mdo","Mão de obra"],["manut","Manutenção (CRM)"],
                ["insumo","Insumos"],["irrig","Irrigação (energia, água, materiais)"],["terc","Terceirização"]];
  const RAT = [["apoio","Diesel dos equipamentos de apoio","pelos litros da operação"],
               ["arrend","Arrendamento","percentual de referência da aba Arrendamentos"],
               ["admin","Administrativo","critério de cada linha, aba Custos Administrativos"],
               ["deprec","Depreciação","pelo custo direto da operação"],
               ["gerais","Demais custos gerais","apoio, quadro ADM e oficina, transporte de pessoal…"]];
  const blocos = [
    {titulo:"A conta", linhas:[
      {rot:"Custo operacional", val:brl(o.total), sub:porUn(o.total)+" · o que custa fazer a operação"},
      {rot:"Rateios", val:brl(r.total), sub:porUn(r.total)+(o.total>0?" · +"+fmt(r.total/o.total*100,1)+"% sobre o operacional":"")},
      {rot:"Custo contábil", val:brl(l.contabil), sub:porUn(l.contabil)+" · ÷ "+rotBase},
    ]},
    {titulo:"Custo operacional por natureza", linhas: OPER.filter(([k])=>o[k]>0.5)
      .map(([k,n])=>({rot:n, val:brl(o[k]), sub:porUn(o[k])}))},
    {titulo:"Rateios", linhas: RAT.filter(([k])=>Math.abs(r[k])>0.5)
      .map(([k,n,como])=>({rot:n, val:brl(r[k]), sub:porUn(r[k])+" · "+como}))},
  ];
  // de onde vem: as partes da formação, ou as atividades da operação
  if(id==="formacao"){
    blocos.push({titulo:"Partes da formação do canavial", linhas: C.principais.filter(x=>x.formacao)
      .map(x=>({rot:x.nome, val:brl(x.contabil), sub:porUn(x.contabil)+" · operacional "+brl(x.oper.total),
                ir:"op:"+x.id}))});
  } else {
    const culturaDe = a => a.cultura || "Soca";
    const ativs = R.L.filter(x=>x.a.etapa===l.etapa && x.total>0 && (!l.cultura || culturaDe(x.a)===l.cultura))
      .sort((x,y)=>y.direto-x.direto);
    blocos.push({titulo:"Atividades da operação (custo operacional)", linhas: ativs.map(x=>({
      rot:codExibir(x.a.cod)+" · "+x.a.nome, val:brl(x.direto), ir:"ativ:"+x.a.cod,
      sub:fmt(x.total)+" "+x.a.un.split("/")[0]+" · "+fmt(x.horas)+" h"}))});
  }
  const premBase = [{rot:"Base física", val:rotBase,
    sub: b.fonte==="premissa" ? "premissa, bloco Base física dos custos" : "premissa em branco — soma das atividades"}];
  return {
    titulo: l.nome,
    subtitulo: id==="formacao" ? "preparo de solo + plantio + tratos de cana planta · por hectare plantado"
                               : "custo operacional e rateios · base "+rotBase,
    // o número de cabeça é o do cartão que abriu: custo operacional, custo
    // contábil ou o custo contábil por unidade (Painel)
    valor: modo==="oper" ? brl(o.total) : modo==="contabil" ? brl(l.contabil) : porUn(l.contabil),
    blocos,
    premissas: premBase.concat(premissasGerais()),
    voltar: l.etapa ? "etapa:"+l.etapa : "custoha",
  };
}

/* ---------- custo de colheita, só o corte ----------
   O cartão do Painel é o corte (A01+A02), sem transporte nem transbordo, com
   a parte do corte no indireto e no arrendamento da colheita. Abria a etapa
   inteira; aqui a mesma conta do cartão. */
function rastroCorte(R){
  // a mesma conta do cartão do Painel (calculo/custo-operacao.js, custoCorte)
  const CC = custoCorte(R), corte = CC.ativs, colh = R.etapas["COLHEITA"];
  const dir = CC.direto, ton = CC.base.q;
  const ind = CC.rat.indireto, arr = CC.rat.arrend, adm = CC.rat.admin;
  const tot = CC.total;
  const porT = v => ton>0 ? brl(v/ton,2)+"/t" : "—";
  const pct = fmt(CC.fracao*100,1)+"% do custo direto da colheita";
  return {
    titulo:"Custo de colheita — só o corte",
    subtitulo:"corte ("+(CC.cods.map(codExibir).join(", ")||"—")+"), sem transporte nem transbordo · por tonelada",
    valor: porT(tot),
    blocos:[
      {titulo:"A conta", linhas:[
        {rot:"Custo direto do corte", val:brl(dir), sub:porT(dir)+" · "+pct},
        {rot:"Parte do corte no arrendamento da colheita", val:brl(arr), sub:"pelo custo direto · "+porT(arr)},
        {rot:"Parte do corte no administrativo da colheita", val:brl(adm), sub:"pelo custo direto · "+porT(adm)},
        {rot:"Parte do corte no custo indireto da colheita", val:brl(ind), sub:"pelo custo direto · "+porT(ind)},
        {rot:"Custo do corte", val:brl(tot), sub:porT(tot)+" · "+fmt(ton)+(CC.base.fonte==="premissa"?" t colhidas (premissa)":" t cortadas nas atividades")},
      ]},
      {titulo:"Atividades", linhas: corte.map(r=>({rot:codExibir(r.a.cod)+" · "+r.a.nome, val:brl(r.direto),
        ir:"ativ:"+r.a.cod, sub:fmt(r.total)+" t · "+(r.total>0?brl(r.direto/r.total,2)+"/t":"—")}))},
      {titulo:"A etapa inteira", linhas:[{rot:"Colheita com transporte e transbordo",
        val: colh ? custoUnit(colh.total, baseEtapa(R,"COLHEITA")) : "—", ir:"etapa:COLHEITA",
        sub: colh ? brl(colh.total) : ""}]},
    ],
    premissas: premissasGerais(),
    voltar:"etapa:COLHEITA",
  };
}

/* ---------- custo variável e custo fixo ----------
   Os cartões da aba Custos abriam o custo total. Fixo = administrativo +
   depreciação + arrendamento; variável = o resto. No filtro de período, o
   cartão aplica ao ano a parcela do período (fixo pelos meses, variável pelo
   custo) — aqui a mesma conta, para o número bater. */
function rastroFixoVariavel(R, qual){
  const S = R.SEL, n = S.meses.length;
  const somaMes = arr => S.meses.reduce((t,i)=>t+num((arr||[])[i]), 0);
  // no período, cada parte pela sua série mensal; no ano, os totais do motor
  const fixo = [["Administrativo", S.parcial ? R.admT*n/NM : R.admT, "nat:admin"],
                ["Depreciação", S.parcial ? R.depT*n/NM : R.depT, null],
                ["Arrendamento", S.parcial ? somaMes(R.mesesCat.arrend) : R.arrT, "nat:arrend"]];
  const fixoSet = new Set(["Arrendamento","Administração","Depreciação"]);
  const itens = qual==="fixo" ? fixo
    : S.parcial
      ? ["mdo","manut","diesel","insumo","irrig","terc","tpess","espor"].map(k=>[CAT_LBL[k]||k, somaMes(R.mesesCat[k]), "cat:"+k])
      : comps(R).filter(([n2])=>!fixoSet.has(n2)).map(([n2,v])=>[n2,v,null]);
  const tot = qual==="fixo" ? S.fixo : S.variavel;
  return {
    titulo: qual==="fixo" ? "Custo fixo" : "Custo variável",
    subtitulo: (S.parcial ? S.rotulo+" · " : "")+(qual==="fixo"
      ? "administrativo, depreciação e arrendamento" : "o que varia com o volume do plano"),
    valor: brl(tot),
    blocos:[
      {titulo:"Composição"+(S.parcial?" no período":""), linhas: itens.filter(([,v])=>v>0.5)
        .sort((a,b)=>b[1]-a[1]).map(([n2,v,ir])=>({rot:n2, val:brl(v), ir:ir||undefined,
          sub:fmt(tot>0?v/tot*100:0,1)+"% do "+(qual==="fixo"?"fixo":"variável")}))},
      {titulo:"No custo", linhas:[{rot:"Peso no custo"+(S.parcial?" do período":""), val:fmt(S.total>0?tot/S.total*100:0,1)+"%",
        ir:"total", sub:brl(S.total)+(S.parcial?" no período":" no ano")}]},
    ],
    premissas: premissasGerais(),
    voltar:"total",
  };
}


/* ---------- custo de um período (safra ou entressafra) ----------
   Os cartões "Custo na safra" e "Custo na entressafra" abriam o rastro do custo
   total. Aqui o custo do período, pela mesma distribuição mensal (R.PER). */
function rastroPeriodo(R, p){
  const o = R.PER && R.PER[p];
  if(!o) return rastroTotal(R);
  const etapas = Object.entries(o.etapa).filter(([,v])=>v>0.5).sort((a,b)=>b[1]-a[1]);
  const cats = Object.entries(o.cat).filter(([,v])=>v>0.5).sort((a,b)=>b[1]-a[1]);
  const meses = MESES.map((m,i)=>i).filter(i=>periodoMes(i)===p);
  return {
    titulo:"Custo na "+(p==="safra"?"safra":"entressafra"),
    subtitulo:PERIODOS[p]+" · "+meses.length+" meses no orçamento",
    valor: brl(o.total),
    blocos:[
      {titulo:"Mês a mês", linhas: meses.map(i=>({rot:MESES[i], val:brl(R.meses[i]), ir:"mes:"+i}))},
      {titulo:"Por etapa", linhas: etapas.map(([e,v])=>({rot:e, val:brl(v), ir:"etapa:"+e,
        sub:fmt(o.total>0?v/o.total*100:0,1)+"% do período"}))},
      {titulo:"Por grande conta", linhas: cats.map(([k,v])=>({rot:CAT_LBL[k]||k, val:brl(v), ir:"cat:"+k+":"+p,
        sub:fmt(o.total>0?v/o.total*100:0,1)+"% do período"}))},
      {titulo:"No ano", linhas:[{rot:"Participação no custo total", val:fmt(R.total>0?o.total/R.total*100:0,1)+"%",
        ir:"total", sub:brl(R.total)+" no ano"}]},
    ],
    premissas: premissasGerais(),
    voltar:"total",
  };
}

/* ---------- grande conta, no ano ou num período ----------
   Cada número da tabela de grandes contas abre aqui: de onde vem o valor
   (calculo/fontes.js, fonte a fonte, com o critério que levou cada uma para
   cada mês) e o valor de cada mês do período. */
const NAT_DA_CONTA = {mdo:"nat:mdo", manut:"nat:manut", diesel:"nat:diesel", insumo:"nat:insumo",
  terc:"nat:terc", tpess:"tpess", arrend:"nat:arrend", fixo:"fixo"};
function mesesDoPeriodo(p){ return MESES.map((m,i)=>i).filter(i=>p==="todos" || periodoMes(i)===p); }
function rastroConta(R, k, p){
  if(!R.mesesCat[k]) return null;
  const idx = mesesDoPeriodo(p);
  const noP = arr => idx.reduce((s,i)=>s+num(arr[i]),0);
  const tot = noP(R.mesesCat[k]);
  const totConta = R.mesesCat[k].reduce((s,x)=>s+num(x),0);
  const totPer = noP(R.meses);
  const fontes = fontesDaConta(R, k).map(f=>({...f, v:noP(f.mes)})).filter(f=>Math.abs(f.v)>0.5).sort((a,b)=>b.v-a.v);
  const nomeP = p==="todos" ? "no ano" : "na "+p;
  return {
    titulo: (CAT_LBL[k]||k) + (p==="todos" ? "" : " — "+p),
    subtitulo: "Grande conta · "+(p==="todos" ? "ano todo" : PERIODOS[p]),
    valor: brl(tot), temPeriodo:true,
    blocos:[
      {titulo:"De onde vem", linhas: fontes.length ? fontes.map(f=>({rot:f.rot, val:brl(f.v), ir:f.ir||undefined,
          sub:fmt(tot>0?f.v/tot*100:0,1)+"% da conta · "+f.crit})) : [{rot:"Nada "+nomeP, val:"—"}]},
      {titulo:"Mês a mês", linhas: idx.map(i=>({rot:MESES[i], val:brl(R.mesesCat[k][i]), ir:"mes:"+i,
          sub:(R.meses[i]>0?fmt(R.mesesCat[k][i]/R.meses[i]*100,1)+"% do custo do mês · ":"")+(periodoMes(i)==="safra"?"safra":"entressafra")}))},
      {titulo:"Peso", linhas:[
        {rot:"Na conta do ano", val: totConta>0 ? fmt(tot/totConta*100,1)+"%" : "—", sub:brl(totConta)+" no ano"},
        {rot:"No custo "+nomeP, val: totPer>0 ? fmt(tot/totPer*100,1)+"%" : "—", ir: p==="todos" ? "total" : "periodo:"+p,
         sub:brl(totPer)+" "+nomeP},
      ].concat(NAT_DA_CONTA[k] ? [{rot:"Detalhe da natureza, no ano", val:"›", ir:NAT_DA_CONTA[k]}] : [])},
    ],
    nota: "A soma das fontes de cada mês é o valor da conta naquele mês — a mesma distribuição da tabela de custo mensal.",
    premissas: premissasGerais(), voltar: p==="todos" ? "total" : "periodo:"+p};
}

/* ---------- subtotal das operações ----------
   Linhas de subtotal e total das tabelas de custo operacional e contábil:
   a soma, operação a operação, com o caminho para cada uma. */
function rastroSomaOperacoes(R, modo, quais){
  const C = custoPorOperacao(R);
  const lista = quais==="todas" ? C.principais.concat(C.outras) : C.principais;
  const val = l => modo==="oper" ? l.oper.total : l.contabil;
  const tot = lista.reduce((s,l)=>s+val(l),0);
  return {
    titulo: (quais==="todas" ? (modo==="oper" ? "Total operacional do plano" : "Custo total do plano")
                             : "Subtotal das operações principais") + (modo==="oper" ? " — operacional" : " — contábil"),
    subtitulo: modo==="oper" ? "O que custa fazer cada operação, sem rateios" : "Operação mais a parte dela nos rateios",
    valor: brl(tot),
    blocos:[{titulo:"Soma, operação a operação", linhas: lista.filter(l=>Math.abs(val(l))>0.5).map(l=>({
      rot:l.nome, val:brl(val(l)), ir:"op:"+l.id+":"+modo, sub:fmt(tot>0?val(l)/tot*100:0,1)+"% da soma"}))}]
      .concat(modo==="contabil" && quais==="todas" ? [{titulo:"No custo total", linhas:[{rot:"Custo total do plano", val:brl(R.total), ir:"total",
        sub: Math.abs(R.total-tot)>1 ? "diferença de "+brl(R.total-tot)+": custos gerais sem operação para absorvê-los" : "confere"}]}] : []),
    premissas: premissasGerais(), voltar:"total"};
}

/* ---------- etapa num período ----------
   A tabela de etapas por período abre aqui: o custo da etapa em cada mês do
   período (direto das atividades mais a parte dela nos rateios) e o caminho
   para a composição completa da etapa. */
function rastroEtapaPeriodo(R, etapa, p){
  const serie = (R.etapaMes||{})[etapa];
  if(!serie) return null;
  const idx = mesesDoPeriodo(p);
  const tot = idx.reduce((s,i)=>s+num(serie[i]),0), totAno = serie.reduce((s,x)=>s+num(x),0);
  const totPer = idx.reduce((s,i)=>s+num(R.meses[i]),0);
  const ativs = R.L.filter(r=>r.a.etapa===etapa && r.total>0).map(r=>{
      const v = idx.reduce((s,i)=>s+diretoNoMes(r, i),0);
      return {r, v}; }).filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  const direto = ativs.reduce((s,x)=>s+x.v,0);
  return {
    titulo: etapa+(p==="todos" ? "" : " — "+p), subtitulo:"Etapa · "+(p==="todos" ? "ano todo" : PERIODOS[p]),
    valor: brl(tot), temPeriodo:true,
    blocos:[
      {titulo:"Como se chega nele", linhas:[
        {rot:"Custo direto das atividades no período", val:brl(direto), sub:"diesel e equipe do mês, o resto pelo volume do mês"},
        {rot:"Parte da etapa nos rateios do período", val:brl(tot-direto), sub:"arrendamento, administrativo e custos gerais do mês, pelo custo direto da etapa"},
        {rot:"Custo da etapa no período", val:brl(tot), ir:"etapa:"+etapa, sub:fmt(totPer>0?tot/totPer*100:0,1)+"% do custo do período · composição completa ›"},
      ]},
      {titulo:"Atividades com lançamento no período", linhas: ativs.length ? ativs.map(x=>({rot:`${codExibir(x.r.a.cod)} · ${x.r.a.nome}`,
          val:brl(x.v), ir:"ativ:"+x.r.a.cod})) : [{rot:"Nenhuma atividade lançada no período", val:"—"}]},
      {titulo:"Mês a mês", linhas: idx.map(i=>({rot:MESES[i], val:brl(serie[i]), ir:"mes:"+i}))},
      {titulo:"No ano", linhas:[{rot:"Parte do ano da etapa", val: totAno>0 ? fmt(tot/totAno*100,1)+"%" : "—", sub:brl(totAno)+" no ano"}]},
    ],
    premissas: premissasGerais(), voltar: p==="todos" ? "total" : "periodo:"+p};
}

/* ---------- nível 2: etapa (centro de custo) ---------- */
function rastroEtapa(R, etapa){
  const d = R.etapas[etapa];
  if(!d) return null;
  const ativs = R.L.filter(r=>r.a.etapa===etapa && r.direto>0).sort((a,b)=>b.direto-a.direto);
  const base = baseEtapa(R, etapa);
  const admLinhas = (R.ADM.linhas||[]).filter((l,i)=>l.total>0 && (R.AD.porLinha[i]||{}).rateado>0);
  const somaPct = ETAPAS_ORD.reduce((s,e)=>s+arrRat(e),0);

  const blocos = [
    {titulo:"Atividades da etapa (custo direto)", linhas: ativs.length ? ativs.map(r=>({
      rot:`${codExibir(r.a.cod)} · ${r.a.nome}`, val:brl(r.direto), ir:"ativ:"+r.a.cod,
      sub:`${fmt(r.total)} ${r.a.un.split("/")[0]} · ${fmt(r.horas)} h · ${r.frotaR||0} equip.`}))
      : [{rot:"Nenhuma atividade com custo", val:"—"}]},
    {titulo:"Custo direto por natureza", linhas:[
      {rot:NAT.diesel, val:brl(d.diesel), sub:fmt(d.litros||0)+" L"},
      {rot:NAT.mdo,    val:brl(d.mdo)},
      {rot:NAT.manut,  val:brl(d.manut)},
      {rot:NAT.insumo, val:brl(d.insumo+(d.irrig||0))},
      {rot:NAT.terc,   val:brl(d.terc)},
      {rot:"Soma do direto", val:brl(d.direto)},
    ]},
    {titulo:"Rateios que a etapa recebe", linhas:[
      {rot:"Arrendamento", val:brl(d.arrend||0),
       sub:somaPct>0 ? `${fmt(arrRat(etapa)/somaPct*100,1)}% do arrendamento, pela referência setorial` : "sem percentual informado"},
      {rot:"Administrativo", val:brl(d.admin||0),
       sub:admLinhas.length ? admLinhas.length+" linha(s) administrativa(s) rateada(s)" : "nada rateado"},
      {rot:"Indireto do plano", val:brl(d.indireto||0),
       sub:`${fmt(R.diretoSum>0?d.direto/R.diretoSum*100:0,1)}% do custo direto total`},
      {rot:"TOTAL DA ETAPA", val:brl(d.total)},
    ]},
  ];
  if(base.q>0) blocos.push({titulo:"Custo unitário", linhas:[
    {rot:`Base física`, val:rotuloBase(base),
     sub: base.fonte==="premissa" ? "premissa, bloco Base física dos custos" : "premissa em branco — soma das atividades"},
    {rot:`Custo por ${base.un}`, val:custoUnit(d.total, base)},
  ]});

  return {titulo:etapa, subtitulo:"Centro de custo · etapa do plano", valor:brl(d.total), blocos,
          premissas:premissasGerais(), voltar:"total"};
}

/* ---------- nível 3: atividade, descendo até a premissa ---------- */
/* ===== Abertura de apresentacao da atividade =====
   O que um diretor precisa ver antes da memoria de calculo: os numeros de
   decisao em destaque e o mes a mes da execucao.

   O custo do mes segue o mesmo criterio do motor: diesel entra pelo preco de
   cada mes, e o resto do custo direto pela fracao da quantidade -- e o rateio
   que index.js usa para distribuir o custo no tempo. */
function apresentacao(r, un){
  const total = r.total || 0;
  const custo = r.direto || 0;
  const naoDiesel = custo - (r.cDiesel || 0);
  const linhas = [], acum = {q:0, h:0, c:0, l:0};

  MESES.forEach((m, i)=>{
    const q = num(r.meses[i]);
    if(!(q > 0)) return;
    const fr = total > 0 ? q/total : 0;
    const h  = r.rend > 0 ? q/r.rend : 0;
    const c  = naoDiesel*fr + (r.dieselMes[i] || 0);
    const l  = r.litrosMes[i] || 0;
    acum.q += q; acum.h += h; acum.c += c; acum.l += l;
    linhas.push([m, fmt(q)+" "+un, fmt(h)+" h", fmt(l)+" L", brl(c),
                 q > 0 ? brl(c/q, 2) : "—"]);
  });

  const tabela = linhas.length ? {
    titulo: "Execução mês a mês",
    cab: ["Mês", "Área ou volume", "Horas", "Diesel", "Custo", "Custo/"+un],
    linhas,
    rodape: ["TOTAL", fmt(acum.q)+" "+un, fmt(acum.h)+" h", fmt(acum.l)+" L", brl(acum.c),
             acum.q > 0 ? brl(acum.c/acum.q, 2) : "—"],
    nota: "Diesel entra pelo preço de cada mês; o restante do custo direto acompanha a quantidade lançada — o mesmo critério que distribui o custo no tempo em Custos.",
  } : null;

  const pr = premissasDe(r.a);
  const dias = num(P.dias) * r.janela.meses;
  const efic = pr.efic;
  // dias de calendario da janela, contra os dias de operacao acima
  const diasCal = r.janela.dias > 0 ? r.janela.dias : dias;

  /* Meta por equipamento. O plano fala em frota e total; quem opera precisa
     saber o que UMA maquina entrega por dia, por mes e no periodo -- e e esse
     o numero que vira meta de acompanhamento no campo. */
  const n = r.frotaR || 0;
  const hPeriodo = n > 0 ? r.horas/n : 0;
  const qPeriodo = n > 0 ? total/n : 0;
  const jm = r.janela.meses || 0;
  const porEquip = n > 0 && dias > 0 && jm > 0 ? {
    titulo: `Meta por equipamento · ${n} ${n>1?"equipamentos":"equipamento"} a ${fmt(r.rend,2)} ${un}/h`,
    cab: ["Ritmo", "Horas por equipamento", "Produção por equipamento", "Horas da frota", "Produção da frota"],
    linhas: [
      [`Por dia efetivo (÷ ${fmt(dias,0)})`,
                       fmt(hPeriodo/dias,1)+" h", fmt(qPeriodo/dias,1)+" "+un,
                       fmt(r.horas/dias,1)+" h",  fmt(total/dias,1)+" "+un],
      [`Por dia corrido (÷ ${fmt(diasCal,0)})`,
                       fmt(hPeriodo/diasCal,1)+" h", fmt(qPeriodo/diasCal,1)+" "+un,
                       fmt(r.horas/diasCal,1)+" h",  fmt(total/diasCal,1)+" "+un],
      [`Por mês (÷ ${fmt(jm,1)})`,
                       fmt(hPeriodo/jm,0)+" h",   fmt(qPeriodo/jm,0)+" "+un,
                       fmt(r.horas/jm,0)+" h",    fmt(total/jm,0)+" "+un],
    ],
    rodape: ["No período", fmt(hPeriodo,0)+" h", fmt(qPeriodo,0)+" "+un,
             fmt(r.horas,0)+" h", fmt(total,0)+" "+un],
    nota: `Hora produtiva é o tempo de máquina efetivamente operando: ${un} ÷ rendimento de ${fmt(r.rend,2)} ${un}/h. `+
          `Cabe nas ${fmt(pr.hDia*pr.disp*efic,1)} h efetivas por dia — ${fmt(pr.hDia,1)} h de jornada${pr.transp?" de transporte":""} × ${pct(pr.disp)} de disponibilidade mecânica × ${pct(efic)} de eficiência operacional. `+
          `A folga é a utilização de ${pct(r.util)} premissada mais o arredondamento da frota, e é ela que absorve chuva, quebra e deslocamento. `+
          `As duas leituras de "por dia": a efetiva divide pelos ${fmt(dias,0)} dias de operação da janela `+
          `(${fmt(P.dias)} por mês × ${fmt(jm,1)} meses) e é a meta; a corrida divide pelos ${fmt(diasCal,0)} dias `+
          `de calendário e é o termômetro de prazo.`,
  } : null;

  /* Criterio por mes: o mesmo calculo do modal de rendimento, vindo de
     criterioMensal(). Duas telas mostrando a mesma meta nao podem ter duas
     contas -- a reuniao acabaria com dois numeros para o mesmo mes. */
  const C = criterioMensal(r).filter(c => c.temVolume);
  const apertados = C.filter(c => !c.cabe).length;
  const tabCriterio = C.length ? {
    titulo: "Critério por mês · o que cada mês exige",
    cab: ["Mês", "Produção", "Por dia efetivo", "Por dia corrido", "Horas de máquina", "h/dia por equip.",
          "Rendimento necessário", "Disponib. mecânica necessária", "Utilização necessária",
          "Eficiência operacional necessária"],
    linhas: C.map(c=>[c.mes + (c.parcial ? " (parcial)" : ""), fmt(c.q)+" "+un,
      fmt(c.qDia,1)+" "+un+" (÷"+fmt(c.dias,1)+")",
      fmt(c.qDiaCorrido,1)+" "+un+" (÷"+fmt(c.diasCorridos)+")",
      fmt(c.horas)+" h", fmt(c.hDiaEquip,1)+" h",
      fmt(c.rendNec,2)+" "+un+"/h",
      pct(c.dispNec)+(c.dispNec > c.disp ? " ⚠" : ""),
      pct(c.utilNec)+(c.utilNec > c.util ? " ⚠" : ""),
      pct(c.eficNec)+(c.eficNec > c.efic ? " ⚠" : "")]),
    nota: `As quatro últimas colunas são alternativas, não se somam: cada uma mostra o que aquele `+
      `critério teria de ser sozinho, com os outros dois parados na premissa do mês. `+
      `São duas leituras da mesma produção: por dia efetivo divide pelos ${fmt(num(P.dias))} dias de operação `+
      `do mês, de ${fmt(pr.hDia,1)} h cada, e é a meta; por dia corrido divide pelos dias do calendário, `+
      `e é o termômetro de prazo. Os dias de cada mês saem da janela da atividade — mês marcado `+
      `como parcial é o que a janela corta no meio, e vale só os dias cobertos. `+
      (apertados
        ? `${apertados} ${apertados>1?"meses pedem":"mês pede"} mais do que o critério entrega (⚠): é aí que entra `+
          `frota extra, turno a mais ou volume remanejado para outro mês. O critério de cada mês se ajusta no `+
          `botão "mês" do Dimensionamento.`
        : `Nenhum mês pede mais do que o critério entrega.`),
  } : null;

  const FR = frotaDaAtividade(r);
  const PES = pessoasDaAtividade(r);
  const destaques = [
    {rot: r.ehHa ? "Área" : "Volume", val: fmt(total)+" "+un,
     sub: r.janela.fonte==="datas" ? `de ${r.janela.ini} a ${r.janela.fim}`
        : `${fmt(r.janela.meses,1)} meses de execução`},
    {rot: "Custo por "+un, val: total > 0 ? brl(custo/total, 2) : "—",
     sub: brl(custo)+" no total"},
    // junto de outra atividade (A39 e A19 na plantadora): maquina e equipe sao dela
    r.junto ? {rot: "Frota", val: "na "+codExibir(r.junto), ir: "ativ:"+r.junto,
     sub: "mesma passada da "+codExibir(r.junto)+": a máquina, o diesel e a manutenção são dela"} :
    {rot: "Frota", val: (FR.pico || 0)+" equip.",
     sub: (r.frotaAlvo ? "frota fixada · rendimento veio dela — " : "")
        + (FR.difere ? `média da janela ${fmt(FR.media)} · ` : "") + (r.maqEfetiva || "—")},
    {rot: "Meta por dia efetivo", val: dias > 0 ? fmt(total/dias, 1)+" "+un : "—",
     sub: dias > 0 ? `${fmt(dias,0)} dias de operação · ${fmt(total/diasCal,1)} ${un} por dia corrido (${fmt(diasCal,0)} dias)`
                   : "sem janela definida"},
    r.junto ? {rot: "Efetivo", val: "na "+codExibir(r.junto), ir: "ativ:"+r.junto,
     sub: "a equipe da plantadora faz as três operações"} :
    {rot: "Efetivo", val: fmt(PES.pico)+" pessoas",
     sub: (PES.difere ? `média da janela ${fmt(PES.media)} · ` : "")
        + (r.partes[0] ? r.partes[0].turnosEf : r.a.turnos)+" turno(s) · fator "+fmt(r.fator,2)},
  ];
  return {destaques, tabelas: [porEquip, tabCriterio, tabela].filter(Boolean)};
}

/* ===== Meta diaria da atividade =====
   Traduz o dimensionamento no ritmo que o campo tem de manter: quantas horas
   cada equipamento roda por dia e quanto entrega por dia, sozinho e em frota.

   A meta sempre cabe na jornada, por construcao -- a frota sai dessa mesma
   conta. O que interessa e o quanto ela ocupa do dia: a sobra e a taxa de
   utilizacao ja premissada mais o arredondamento da frota para cima, e e essa
   sobra que absorve chuva, quebra e deslocamento. */
function metaDiaria(r, un){
  if(!(r.total > 0) || !(r.frotaR > 0)) return null;
  const pr = premissasDe(r.a);
  const diasJanela = num(P.dias) * r.janela.meses;        // dias efetivos na janela
  if(!(diasJanela > 0)) return null;
  const hDisp = pr.hDia * pr.disp * pr.efic;              // hora efetiva por dia
  if(!(hDisp > 0)) return null;
  const hEquipDia  = r.horas / r.frotaR / diasJanela;
  const unDia      = r.total / diasJanela;
  const unEquipDia = unDia / r.frotaR;
  const ocupa = hEquipDia / hDisp;
  const sobra = Math.max(0, hDisp - hEquipDia);
  return {titulo:"Meta para acompanhamento", linhas:[
    {rot:"Cada equipamento precisa rodar", val:fmt(hEquipDia,1)+" h/dia",
     sub:`${pct(ocupa)} das ${fmt(hDisp,1)} h disponíveis por dia · ${fmt(sobra,1)} h de folga`},
    {rot:"Cada equipamento precisa entregar", val:fmt(unEquipDia,1)+" "+un+"/dia",
     sub:`${fmt(r.rend,2)} ${un}/h × ${fmt(hEquipDia,1)} h/dia`},
    {rot:"A frota inteira, por dia", val:fmt(unDia,1)+" "+un+"/dia",
     sub:`${r.frotaR} equipamento${r.frotaR>1?"s":""} × ${fmt(unEquipDia,1)} ${un}/dia`},
    {rot:"Dias efetivos na janela", val:fmt(diasJanela,0)+" dias",
     sub:`${fmt(P.dias)} dias/mês × ${fmt(r.janela.meses,1)} meses`},
    {rot:"Ritmo a manter", val:fmt(r.total)+" "+un+" em "+fmt(diasJanela,0)+" dias efetivos",
     sub:`a folga de ${fmt(sobra,1)} h/dia é a taxa de utilização de ${pct(r.util)} mais o arredondamento da frota — é ela que absorve chuva, quebra e deslocamento`},
  ]};
}

function rastroAtividade(R, cod){
  const r = R.L.find(x=>x.a.cod===cod);
  if(!r) return null;
  const un = r.a.un.split("/")[0];
  const mesesComQtd = r.meses.map((q,i)=>({i, q:num(q)})).filter(x=>x.q>0);
  const escala = r.escala ? (ESCALAS[r.escala]||{}).nome || r.escala : "padrão das premissas";
  const trat = r.trat ? tratCusto(r.trat) : 0;
  const FRa = frotaDaAtividade(r);
  const PESa = pessoasDaAtividade(r);
  const meta = metaDiaria(r, un);
  const apres = apresentacao(r, un);

  const blocos = [
    {titulo:"Onde entra", linhas:[
      {rot:"Centro de custo · etapa", val:r.a.etapa, ir:"etapa:"+r.a.etapa},
      {rot:"Cultura", val:r.a.cultura||"—"},
      {rot:"Unidade de lançamento", val:r.a.un},
    ]},
    {titulo:"Área ou volume lançado", linhas: mesesComQtd.length
      ? mesesComQtd.map(x=>({rot:MESES[x.i], val:fmt(x.q)+" "+un}))
          .concat([{rot:"Total", val:fmt(r.total)+" "+un}])
      : [{rot:"Nada lançado no Plano Operacional", val:"—"}]},
    // A conta abaixo diz quanta maquina a atividade precisa. Este bloco diz o
    // que essa maquina precisa entregar por dia -- que e o numero que o campo
    // acompanha e que a diretoria cobra.
    ...(meta ? [meta] : []),
    {titulo:"Horas e frota", linhas:[
      {rot:"Rendimento operacional", val:fmt(r.rend,2)+" "+un+"/h"},
      {rot:"Taxa de utilização", val:pct(r.util)},
      {rot:"Horas = volume ÷ rendimento", val:fmt(r.horas)+" h"},
      {rot:"Capacidade por equipamento/mês", val:fmt(r.capMes||0)+" "+un},
      {rot:"Janela de execução", val:fmt(r.janela.meses,1)+" meses",
       sub: r.janela.fonte==="datas" ? `de ${r.janela.ini} a ${r.janela.fim} · ${fmt(r.janela.dias,0)} dias`
          : r.janela.fonte==="meses do plano" ? "meses com volume lançado; defina datas para ajustar"
          : "sem data nem volume: dimensionado sobre o ano"},
      {rot:"Capacidade de 1 equipamento na janela", val:fmt((r.capMes||0)*r.janela.meses)+" "+un},
      {rot:"Frota média da janela", val:(r.frotaR||0)+" equip.",
       sub:`${fmt(r.horas)} h ÷ (${fmt(r.capMes||0)} ${un}/mês × ${fmt(r.janela.meses,1)} meses) = ${fmt(r.frota||0,2)}, arredondado para cima. É a que rateia o custo.`},
      {rot:"Frota a ter no pátio", val:(FRa.pico||0)+" equip.",
       sub: FRa.difere
         ? `o mês que mais pede${FRa.mes?" ("+FRa.mes+")":""} — média não estaciona no pátio. É este o número que aparece no Plano e no Dimensionamento.`
         : `todo mês pede o mesmo; é também a média da janela`},
      {rot:"Turnos", val:(r.partes[0]?r.partes[0].turnosEf:r.a.turnos)+"t"},
      {rot:"Escala", val:escala+" · fator "+fmt(r.fator,2)},
      {rot:"Efetivo médio — o que paga a folha", val:fmt(r.efetivo)+" pessoas"},
      {rot:"Equipe a ter", val:fmt(PESa.pico)+" pessoas",
       sub: PESa.difere ? `o mês que mais pede${PESa.mes?" ("+PESa.mes+")":""}` : "todo mês pede o mesmo"},
    ]},
    {titulo:"Equipamento e consumo, por frente", linhas: r.partes.map(p=>p.terc
      ? {rot:(p.modo||"Terceiro")+" · prestador de serviço", val:brl(p.cTerc),
         sub:`${fmt(p.area)} ${un} × ${brl(tarifaTerc(cod),2)}/ha de tarifa`}
      : {rot:`${p.modo?p.modo+" · ":""}${p.maq}${p.imp&&p.imp!=="----"?" + "+p.imp:""}`,
         val:brl(p.cDiesel+p.cManut+p.cMDO),
         sub:`${fmt(p.horas)} h · ${p.consumoUn==="km"
             ? fmt(p.km)+" km"+(p.fonteKm==="viagens"?" (viagens)":" (horas × velocidade)")+" × "+fmt(p.consumoLkm,3)+" L/km"
             : fmt(p.consumoLh,1)+" L/h"} = ${fmt(p.litros)} L · diesel ${brl(p.cDiesel)} · MDO ${brl(p.cMDO)} · CRM ${brl(p.cManut)}`})},
    {titulo:"Preços e custos aplicados", linhas:[
      {rot:"Diesel", val:brl(r.cDiesel),
       sub:`${fmt(r.litros)} L · preço médio ${r.litros>0?brl(r.cDiesel/r.litros,2):brl(P.diesel,2)}/L, ponderado pelos meses`},
      {rot:"Mão de obra", val:brl(r.cMDO),
       sub:`${r.fcod} · ${r.fnome} · ${fmt(r.efetivo)} pessoas × ${fmt((r.mdoMes||[]).filter(x=>x>0).length)} meses com volume × ${
         brl((R.MP.custoFuncao[r.fcod]||{}).mensal||0)}/mês (salário, encargos e benefícios)`},
      {rot:"Manutenção (CRM)", val:brl(r.cManut), sub:"taxa por hora da frota prevista, da aba Manutenção de Frota"},
      {rot:"Insumos", val:brl(r.cInsumo),
       sub:r.trat ? `tratamento ${r.trat} a ${brl(trat,2)}/ha × ${fmt(r.total)} ${un}` : "sem tratamento vinculado"},
      {rot:"Terceirização", val:brl(r.cTerc)},
      {rot:"CUSTO DIRETO DA ATIVIDADE", val:brl(r.direto)},
    ]},
  ];

  /* Atividade que vai junto de outra (A39 e A19 na plantadora da A10): nao
     ha horas, frota, meta nem consumo proprios para explicar -- e a mesma
     passada da outra. Fica o que e dela: onde entra, a area e o tratamento. */
  if(r.junto){
    const rj = R.L.find(x=>x.a.cod===r.junto);
    const codJunto = codExibir(r.junto);
    blocos.splice(2, blocos.length-2,
      {titulo:"Mecanização — na "+codJunto, linhas:[
        {rot:"Executada junto com", val:codJunto+(rj?" · "+rj.a.nome:""), ir:"ativ:"+r.junto,
         sub:"mesma passada: a área é a dela, mês a mês, e a máquina, a equipe, o diesel e a manutenção também"},
        {rot:"Custo da mecanização na "+codJunto, val:rj?brl(rj.direto-rj.cInsumo):"—",
         sub:"contado uma vez só, na atividade que executa"},
      ]},
      {titulo:"Custo desta linha", linhas:[
        {rot:"Insumos", val:brl(r.cInsumo),
         sub:r.trat ? `tratamento ${r.trat} a ${brl(trat,2)}/ha × ${fmt(r.total)} ${un}` : "sem tratamento vinculado"},
        {rot:"CUSTO DIRETO DA ATIVIDADE", val:brl(r.direto)},
      ]});
    return {largo:true, destaques:apres.destaques, tabelas:[],
      titulo:`${codExibir(r.a.cod)} · ${r.a.nome}`, subtitulo:"Tratamento aplicado na plantadora, junto da "+codJunto,
      valor:brl(r.direto), blocos,
      premissas: premissasGerais().concat([{rot:"Atualização de preço de insumos", val:fmt(P.ipreco,0)+"%"}]),
      voltar:"etapa:"+r.a.etapa};
  }
  const cf = R.MP.custoFuncao[r.fcod] || {};
  return {
    largo:true, destaques:apres.destaques, tabelas:apres.tabelas,
    titulo:`${codExibir(r.a.cod)} · ${r.a.nome}`, subtitulo:"Atividade do Plano Operacional",
    valor:brl(r.direto), blocos,
    premissas: premissasGerais().concat([
      {rot:"Salário do cargo "+(cf.nome||r.fcod), val:brl(cf.salCad||cf.sal||0,2)},
      {rot:"Custo mensal do cargo, com encargos e benefícios", val:brl(cf.mensal||0,2)},
      {rot:"Encargos sobre a folha", val:fmt((R.MP.encTot||0)*100,1)+"%"},
      {rot:"Atualização de preço de insumos", val:fmt(P.ipreco,0)+"%"},
      {rot:"Valor de terceirização", val:brl(tarifaTerc(cod),2)+"/ha"},
    ]),
    voltar:"etapa:"+r.a.etapa};
}

/* ---------- natureza: soma a mesma conta em todas as atividades ---------- */
function rastroNatureza(R, nat){
  const campo = {diesel:"cDiesel", mdo:"cMDO", manut:"cManut", insumo:"cInsumo", terc:"cTerc"}[nat];
  if(campo){
    const itens = R.L.filter(r=>r[campo]>0).sort((a,b)=>b[campo]-a[campo]);
    const soma = itens.reduce((s,r)=>s+r[campo],0);
    const blocos = [{titulo:"Atividades que geram este custo", linhas: itens.length
      ? itens.map(r=>({rot:`${codExibir(r.a.cod)} · ${r.a.nome}`, val:brl(r[campo]), ir:"ativ:"+r.a.cod,
          sub:r.a.etapa}))
      : [{rot:"Nenhuma atividade com este custo", val:"—"}]}];
    if(nat==="diesel") blocos.push({titulo:"Preço do diesel por mês", linhas:
      MESES.map((m,i)=>({rot:m, val:brl(R.CB.preco[i],2)+"/L"}))});
    if(nat==="mdo") blocos.push({titulo:"Fora das atividades", linhas:[
      {rot:"Equipamentos de apoio", val:brl(R.mdoApoio)},
      {rot:"Quadro ADM agrícola", val:brl(R.mdoIndirT), sub:"previsto da controladoria, folha + contribuições + benefícios"},
      {rot:"Quadro da oficina", val:brl(R.mdoManut), sub:"previsto da controladoria, folha + contribuições + benefícios"},
      {rot:"Apoio operacional", val:brl(R.mdoApoioOper||0), sub:"lançado no Dimensionamento, nos meses marcados"},
      {rot:"FAT — contrato suspenso", val:brl(R.mdoFat||0), sub:"benefício por pessoa nos meses marcados; fora da operação"},
    ]});
    return {titulo:NAT[nat]||nat, subtitulo:"Natureza de custo, somada no plano",
            valor: brl(nat==="mdo" ? R.mdoTotal : soma), blocos,
            premissas:premissasGerais(), voltar:"total"};
  }
  if(nat==="arrend"){
    const A = R.AR;
    return {titulo:"Arrendamento", subtitulo:"Custo da terra arrendada", valor:brl(R.arrT),
      blocos:[
        {titulo:"Fazendas", linhas:A.linhas.map(l=>({rot:l.faz+(l.grupo?" · "+l.grupo:""),
          val:brl(l.periodo),
          sub:`${fmt(l.area)} ha × ${brl(l.rsHaAno,2)}/ha/ano · ${l.pag.toLowerCase()}, ${
            l.nParc||0}× ${brl(l.parcela)}: ${l.agenda}`}))},
        {titulo:"Rateio entre as etapas", linhas:ETAPAS_ORD.filter(e=>R.etapas[e]).map(e=>({
          rot:e, val:brl(R.etapas[e].arrend||0), ir:"etapa:"+e, sub:fmt(arrRat(e),1)+"% de referência"}))},
      ],
      premissas:[{rot:"ATR médio", val:fmt(num(R.AR.linhas.length?135:135),0)+" kg/t"},
                 {rot:"Meses do orçamento", val:NM}],
      voltar:"total"};
  }
  if(nat==="admin"){
    const A = R.ADM;
    return {titulo:"Administração", subtitulo:"Custos administrativos rateados", valor:brl(R.admT),
      blocos:[
        {titulo:"Linhas lançadas", linhas:A.linhas.filter(l=>l.total>0).map(l=>({
          rot:l.desc, val:brl(l.total),
          sub:`${brl(l.mensal)}/mês · rateio por ${(ADM_CRITERIOS[l.crit]||{}).nome||l.crit}`}))},
        {titulo:"Rateio entre as etapas", linhas:Object.keys(R.etapas).map(e=>({
          rot:e, val:brl(R.etapas[e].admin||0), ir:"etapa:"+e}))
          .concat(R.AD.semRateio>0?[{rot:"Sem base para rateio", val:brl(R.AD.semRateio),
            sub:"volta para o rateio indireto geral"}]:[])},
      ],
      premissas:premissasGerais(), voltar:"total"};
  }
  return null;
}

/* ---------- mês ---------- */
function rastroMes(R, i){
  const idx = +i;
  // mesmo critério do motor: MDO pela equipe do mês, diesel pelo litro do mês, o resto pelo volume
  const itens = R.L.map(r=>({r, v:diretoNoMes(r, idx)}))
    .filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const matMes = (R.MT.linhas||[]).filter(l=>l.mes===idx && l.total>0);
  return {titulo:MESES[idx], subtitulo:"Custo do mês", valor:brl(R.meses[idx]),
    blocos:[
      {titulo:"Grandes contas do mês", linhas:Object.entries(R.mesesCat).filter(([,a])=>Math.abs(a[idx])>0.5)
        .map(([k,a])=>({rot:CAT_LBL[k]||k, val:brl(a[idx]), ir:"cat:"+k,
          sub:fmt(R.meses[idx]>0?a[idx]/R.meses[idx]*100:0,1)+"% do mês"}))},
      {titulo:"Atividades com lançamento no mês", linhas: itens.length
        ? itens.map(x=>({rot:`${codExibir(x.r.a.cod)} · ${x.r.a.nome}`, val:brl(x.v), ir:"ativ:"+x.r.a.cod,
            sub:`${fmt(num(x.r.meses[idx]))} ${x.r.a.un.split("/")[0]} no mês`}))
        : [{rot:"Nenhuma atividade lançada neste mês", val:"—"}]},
    ].concat(matMes.length || (R.MT.mes && R.MT.mes[idx]>0.5) ? [{titulo:"Materiais de manutenção no mês", linhas:
        matMes.map(l=>({rot:l.cat+" · "+l.item, val:brl(l.total), sub:"alocado neste mês"}))
        .concat(R.MT.distribuido>0.5 ? [{rot:"Materiais sem mês, pela área operada", val:brl(R.MT.mes[idx]-matMes.reduce((s,l)=>s+l.total,0))}] : [])}] : []),
    premissas:premissasGerais(), voltar:"total"};
}

/* ---------- pessoas: efetivo dimensionado pelo plano ---------- */
function rastroPessoasTotal(R){
  const PS = R.PS;
  const porDept = Object.entries(PS.porDept).sort((a,b)=>b[1].qtd-a[1].qtd);
  const porFun  = Object.entries(PS.porFun).sort((a,b)=>b[1].qtd-a[1].qtd);
  const somaDept = porDept.reduce((s,[,d])=>s+d.qtd,0);
  const fora = R.efetivoTotal - somaDept;
  return {titulo:"Efetivo total", subtitulo:"Pessoas dimensionadas pelo plano inteiro", valor:fmt(R.efetivoTotal)+" pessoas",
    blocos:[
      {titulo:"Por departamento", linhas: porDept.map(([d,o])=>({rot:d, val:fmt(o.qtd)+" pessoas", ir:"pessoas:dept:"+d,
          sub:`pico de ${fmt(o.pico)} em algum mês`}))
        // fora < 0 não é "pessoa negativa": o detalhamento soma os operadores de
        // apoio, que o efetivo da Capa deixa de fora de propósito (ver ui/pessoas.js)
        .concat(fora>0.5 ? [{rot:"Fora do detalhamento por departamento", val:fmt(fora)+" pessoas"}]
          : fora<-0.5 ? [{rot: Math.abs(-fora-(PS.apoio||0))<0.5
                ? "Operadores de apoio — no detalhamento, fora do efetivo total"
                : "Contados no detalhamento e fora do efetivo total", val:fmt(-fora)+" pessoas"}]
          : [])},
      {titulo:"Por função", linhas: porFun.map(([f,o])=>({rot:(PS.itens.find(i=>i.fcod===f)||{}).fnome||f,
          val:fmt(o.qtd)+" pessoas", ir:"pessoas:fun:"+f}))},
    ],
    premissas:premissasGerais()};
}
function rastroPessoasDept(R, dept){
  const o = R.PS.porDept[dept]; if(!o) return null;
  const itens = R.PS.itens.filter(i=>i.dept===dept);
  return {titulo:dept, subtitulo:"Departamento · efetivo dimensionado", valor:fmt(o.qtd)+" pessoas",
    blocos:[{titulo:"Origem do efetivo", linhas: itens.map(i=>({rot:i.origem, val:fmt(i.qtd)+" pessoas", sub:i.fnome}))},
      blocoMesAMes(o.qtdMes, i=>"pessoas:mes:"+i+":todos:"+dept)].filter(Boolean),
    premissas:premissasGerais(), voltar:"pessoas:total"};
}
function rastroPessoasFun(R, fcod){
  const o = R.PS.porFun[fcod]; if(!o) return null;
  const itens = R.PS.itens.filter(i=>i.fcod===fcod);
  return {titulo:(itens[0]||{}).fnome||fcod, subtitulo:"Função · efetivo dimensionado", valor:fmt(o.qtd)+" pessoas",
    blocos:[{titulo:"Onde esta função é usada", linhas: itens.map(i=>({rot:i.origem, val:fmt(i.qtd)+" pessoas", sub:i.dept}))},
      blocoQuadroDaFuncao(R, fcod), blocoMesAMes(o.qtdMes, i=>"pessoas:mes:"+i)].filter(Boolean),
    premissas:premissasGerais(), voltar:"pessoas:total"};
}
/* Pico de mobilização: o mês em que mais gente trabalha ao mesmo tempo --
   operacional das atividades, ADM agrícola e oficina somados; o FAT fica fora,
   porque não opera. É o número que diz quanta gente tem de estar no campo e na
   oficina junto; a contratação se decide por função, no confronto com o
   quadro ativo. Mês a mês com a abertura por quadro, e o mês de pico por
   departamento e função. */
function rastroPessoasPico(R, periodo){
  const PS = R.PS;
  const idxs = MESES.map((m,i)=>i).filter(i=>periodo==="todos"||periodoMes(i)===periodo);
  const pico = idxs.length ? Math.max(0,...idxs.map(i=>PS.qtdMes[i])) : 0;
  const iPico = idxs.find(i=>PS.qtdMes[i]===pico);
  const operam = PS.itens.filter(it=>!it.fora);
  const GR = ["OPERACIONAL","ADM AGRÍCOLA","OFICINA"], CURTO = {"OPERACIONAL":"operacional","ADM AGRÍCOLA":"ADM","OFICINA":"oficina"};
  const doGrupo = (g, i) => operam.filter(it=>it.grupo===g).reduce((s,it)=>s+(+it.qtdMes[i]||0),0);
  const abre = i => GR.map(g=>fmt(doGrupo(g,i),0)+" "+CURTO[g]).join(" · ");
  const fatMes = i => PS.fat ? (+PS.fat.qtdMes[i]||0) : 0;
  // no mês de pico: de onde vem a gente (departamento ou etapa), do maior para o menor
  const deps = {};
  if(iPico!=null) operam.forEach(it=>{ const v = +it.qtdMes[iPico]||0; if(!v) return;
    const d = deps[it.dept] = deps[it.dept] || {dept:it.dept, grupo:it.grupo, v:0}; d.v += v; });
  const topo = Object.values(deps).sort((a,b)=>b.v-a.v);
  const mostra = topo.slice(0,12), resto = topo.slice(12).reduce((s,d)=>s+d.v,0);
  return {titulo:"Pico de mobilização", subtitulo:"Maior número de pessoas trabalhando ao mesmo tempo, num mês",
    valor:fmt(pico)+" pessoas", temPeriodo:true,
    blocos:[
      {titulo:"O que é", linhas:[
        {rot:"Pessoas na operação no mês que mais pede", val:fmt(pico)+" pessoas",
         sub:"operacional das atividades + ADM agrícola + oficina, no mesmo mês; o FAT fica fora (não opera)"},
        {rot:"Mês de pico", val:iPico!=null&&pico>0 ? MESES[iPico] : "—", ir: iPico!=null ? "mes:"+iPico : undefined,
         sub: iPico!=null&&pico>0 ? abre(iPico) : ""},
        {rot:"Para contratar", val:"por função", ir:"pessoas:total",
         sub:"o confronto com o quadro ativo (Resumo de Pessoas) decide quanto falta em cada função"},
      ]},
      {titulo:"Pessoas na operação, por mês", linhas: idxs.map(i=>({rot:MESES[i], val:fmt(PS.qtdMes[i])+" pessoas",
        sub: abre(i) + (fatMes(i) ? " · +"+fmt(fatMes(i),0)+" no FAT (fora)" : "")}))},
      {titulo: iPico!=null&&pico>0 ? "No mês de pico ("+MESES[iPico]+"), de onde vem a gente" : "No mês de pico",
       linhas: mostra.length ? mostra.map(d=>({rot:d.dept, val:fmt(d.v,0)+" pessoas", ir:"pessoas:dept:"+d.dept,
           sub:(CURTO[d.grupo]||d.grupo)+" · "+fmt(pico>0?d.v/pico*100:0,1)+"% do pico"}))
         .concat(resto>0.5 ? [{rot:"Demais departamentos", val:fmt(resto,0)+" pessoas"}] : [])
         : [{rot:"Sem gente lançada no período", val:"—"}]},
    ],
    nota: iPico!=null&&pico>0 ? `Pico em ${MESES[iPico]}: ${fmt(pico)} pessoas trabalhando ao mesmo tempo.` : "",
    premissas:premissasPessoas(R)};
}

/* ---------- Resumo geral de pessoas: mês, quadro, tipo de função e quadro atual ----------
   Chaves do painel do Resumo de Pessoas (ui/pessoas.js). As de recorte levam o
   filtro da tela no fim -- quadro e departamento, "todos" quando não filtra --,
   para a dica de um gráfico filtrado falar do mesmo recorte que ele mostra:
     pessoas:mes:<i>[:<quadro>[:<departamento>]]
     pessoas:grupo:<quadro>[:<departamento>]
     pessoas:tipo:<tipo de função>[:<quadro>[:<departamento>]]
     pessoas:quadro[:<quadro>]      necessidade × quadro ativo do ERP
   Média e pico seguem o período do rastro (ano, safra ou entressafra). */
const CURTO_GR = {"OPERACIONAL":"Operacional", "ADM AGRÍCOLA":"ADM agrícola", "OFICINA":"Oficina", "FAT":"FAT (fora da operação)"};
const semFiltro = v => !v || v==="todos";
const nomeRecorte = (g, d) => [semFiltro(g) ? "" : (CURTO_GR[g]||g), semFiltro(d) ? "" : d].filter(Boolean).join(" › ") || "Todos os quadros";
const idxPeriodo = p => MESES.map((m,i)=>i).filter(i=>p==="todos"||periodoMes(i)===p);
const nomePeriodo = p => p==="safra" ? "na safra" : p==="entressafra" ? "na entressafra" : "no ano";
const casasQtd = v => v>0 && v<10 && Math.abs(v-Math.round(v))>0.05 ? 1 : 0;
const qtdP = v => fmt(v, casasQtd(v)) + (Math.abs(v-1)<1e-9 ? " pessoa" : " pessoas");
const pctDe = (v, t) => t>0 ? fmt(v/t*100,1)+"%" : "—";
// soma de uma lista de itens de pessoas por uma chave, com média e pico nos meses idx
function juntarPessoas(itens, chave, idx){
  const g = {};
  itens.forEach(it=>{ const k = chave(it);
    const o = g[k] = g[k] || {k, grupo:it.grupo, fnome:it.fnome, dept:it.dept, qtdMes:Array(NM).fill(0)};
    it.qtdMes.forEach((v,i)=>{ o.qtdMes[i] += +v||0; }); });
  const n = Math.max(1, idx.length);
  return Object.values(g).map(o=>{ const pico = Math.max(0, ...idx.map(i=>o.qtdMes[i]));
    return {...o, media: idx.reduce((s,i)=>s+o.qtdMes[i],0)/n, pico, iPico: idx.find(i=>o.qtdMes[i]===pico)}; })
    .filter(o=>o.pico>0);
}
function blocoMesAMes(qtdMes, irDe, idx){
  const ls = (idx || MESES.map((m,i)=>i)).filter(i=>(+qtdMes[i]||0)>0)
    .map(i=>({rot:MESES[i], val:qtdP(+qtdMes[i]||0), ir:irDe(i)}));
  return ls.length ? {titulo:"Mês a mês", linhas:ls} : null;
}
// o confronto com o quadro ativo de uma função (primeira página do Resumo de Pessoas)
function blocoQuadroDaFuncao(R, fcod){
  const l = confrontoQuadro(R.PS).linhas.find(x=>x.fcod===fcod); if(!l) return null;
  return {titulo:"Quadro atual", linhas:[
    {rot:"Ativo no ERP", val:fmt(l.ativo), sub: l.ajuste!=null ? "ajustado no Resumo de Pessoas (ERP: "+fmt(l.base)+")" : "base do ERP"},
    {rot:"Férias e demissões programadas", val:fmt(l.ferias+l.demis)},
    {rot:"Disponível", val:fmt(l.disp), sub:"ativo − férias − demissões"},
    {rot:"Pico mensal da função", val:fmt(l.pico), sub:(l.pico>0 ? MESES[l.iPico] : "")+(l.fatPico ? " · e "+fmt(l.fatPico)+" no FAT no pico do FAT" : "")},
    {rot: l.contratar>0 ? "A contratar" : l.exced>0 ? "Excedente" : "Situação",
     val: l.contratar>0 ? "+"+fmt(l.contratar) : l.exced>0 ? fmt(l.exced) : "em dia", ir:"pessoas:quadro",
     sub:"no mês que mais ocupa a função (operação + FAT)"}]};
}

function rastroPessoasMes(R, i, g, d){
  i = +i; if(!(i>=0 && i<NM)) return null;
  const S = filtrarPessoas(R.PS, semFiltro(g) ? "todos" : g, semFiltro(d) ? "todos" : d);
  const um = [i], v = it => +it.qtdMes[i]||0;
  const itens = S.itens.filter(it=>v(it)>0);
  const naOper = itens.filter(it=>!it.fora).reduce((s,it)=>s+v(it),0), noFat = itens.filter(it=>it.fora).reduce((s,it)=>s+v(it),0);
  const tot = naOper + noFat, dd = semFiltro(d) ? "todos" : d;
  const porGrupo = juntarPessoas(itens, it=>it.grupo, um).sort((a,b)=>grupoIdx(a.k)-grupoIdx(b.k));
  const porDept  = juntarPessoas(itens, it=>it.dept, um).sort((a,b)=>b.media-a.media);
  const porFun   = juntarPessoas(itens, it=>it.fcod, um).sort((a,b)=>b.media-a.media);
  const blocos = [];
  if(porGrupo.length>1) blocos.push({titulo:"Por quadro", linhas: porGrupo.map(o=>({rot:CURTO_GR[o.k]||o.k, val:qtdP(o.media),
    ir:`pessoas:mes:${i}:${o.k}:${dd}`, sub: o.k==="FAT" ? "contrato suspenso: é do quadro, mas não opera" : pctDe(o.media, tot)+" do mês"}))});
  blocos.push({titulo:"Por departamento", linhas: porDept.length ? porDept.map(o=>({rot:o.k, val:qtdP(o.media), ir:"pessoas:dept:"+o.k,
    sub:(CURTO_GR[o.grupo]||o.grupo)+" · "+pctDe(o.media, tot)+" do mês"})) : [{rot:"Ninguém neste mês", val:"—"}]});
  if(porFun.length) blocos.push({titulo:"Por função", linhas: porFun.map(o=>({rot:o.fnome||o.k, val:qtdP(o.media),
    ir: R.PS.porFun[o.k] ? "pessoas:fun:"+o.k : undefined, sub:"função "+o.k})) });
  // o quadro ativo do ERP é por função, sem departamento: com departamento filtrado não há confronto
  if(semFiltro(d)){
    const C = confrontoQuadro(R.PS), ls = C.linhas.filter(l=>semFiltro(g) || l.grupo===g);
    if(C.temQuadro && ls.length){ const t = somarConfronto(ls);
      blocos.push({titulo:"Quadro atual no mês", linhas:[
        {rot:"Disponível no mês", val:qtdP(t.dispMes[i]), sub:"ativo do ERP − férias − demissões − quem está no FAT no mês"},
        {rot:"A contratar no mês", val: t.faltaMes[i]>0 ? "+"+fmt(t.faltaMes[i]) : "—", ir:"pessoas:quadro"+(semFiltro(g) ? "" : ":"+g),
         sub:"função por função: sobra numa função não cobre falta em outra"}]}); }
  }
  return {titulo:MESES[i]+" — pessoas", subtitulo:nomeRecorte(g, d)+" · "+(periodoMes(i)==="safra" ? "safra" : "entressafra"),
    valor: naOper>0 || !noFat ? qtdP(naOper)+" na operação"+(noFat ? " + "+fmt(noFat)+" no FAT" : "")
                               : qtdP(noFat)+" no FAT (fora da operação)", blocos,
    nota: tot>0 ? "Pessoas trabalhando neste mês: as equipes das atividades com volume no Plano Operacional, o quadro ADM agrícola e o da oficina (dez/26 a mar/27)." : "",
    premissas:premissasPessoas(R), voltar:"pessoas:pico"};
}

function rastroPessoasGrupo(R, G, d, p){
  const S = filtrarPessoas(R.PS, semFiltro(G) ? "todos" : G, semFiltro(d) ? "todos" : d);
  if(!S.itens.length) return null;
  const idx = idxPeriodo(p), n = Math.max(1, idx.length), dd = semFiltro(d) ? "todos" : d;
  const serie = MESES.map((m,i)=>S.itens.reduce((s,it)=>s+(+it.qtdMes[i]||0),0));
  const media = idx.reduce((s,i)=>s+serie[i],0)/n, pico = Math.max(0, ...idx.map(i=>serie[i]));
  const iPico = idx.find(i=>serie[i]===pico), custo = idx.reduce((s,i)=>s+(+S.custoMes[i]||0),0);
  const deps = juntarPessoas(S.itens, it=>it.dept, idx).sort((a,b)=>b.media-a.media);
  const funs = juntarPessoas(S.itens, it=>it.fcod, idx).sort((a,b)=>b.media-a.media);
  const resumo = [
    {rot:"Média mensal", val:qtdP(media), sub:nomePeriodo(p)+" ("+idx.length+" meses)"},
    {rot:"Pico no mês", val:qtdP(pico), sub: pico>0 ? MESES[iPico] : "", ir: pico>0 ? `pessoas:mes:${iPico}:${G}:${dd}` : undefined},
    {rot:"Custo de mão de obra", val:brl(custo), sub:nomePeriodo(p)},
  ];
  if(semFiltro(d) && G!=="FAT"){
    const ls = confrontoQuadro(R.PS).linhas.filter(l=>semFiltro(G) || l.grupo===G);
    if(ls.length){ const t = somarConfronto(ls, idx);
      const kq = "pessoas:quadro:"+(semFiltro(G) ? "todos" : G)+(p==="todos" ? "" : ":"+p);
      resumo.push({rot:"Quadro atual (ativo no ERP)", val:qtdP(t.ativo), sub:"disponível "+fmt(t.disp)+" · "+t.n+" funções", ir:kq},
                  {rot:"A contratar", val: t.contratar>0 ? "+"+fmt(t.contratar) : "—", ir:kq,
                   sub:"pelo pico de cada função "+nomePeriodo(p)+(t.exced>0 ? " · excedente de "+fmt(t.exced)+" em outras funções" : "")}); }
  }
  return {titulo:nomeRecorte(G, d), subtitulo:"Pessoas · média mensal "+nomePeriodo(p),
    valor:qtdP(media)+"/mês", temPeriodo:true,
    blocos:[{titulo:"Resumo", linhas:resumo},
      {titulo:"Por departamento — média mensal", linhas: deps.map(o=>({rot:o.k, val:qtdP(o.media), ir:"pessoas:dept:"+o.k,
        sub:"pico "+fmt(o.pico,0)+" em "+MESES[o.iPico]+" · "+pctDe(o.media, media)}))},
      {titulo:"Por função — média mensal", linhas: funs.map(o=>({rot:o.fnome||o.k, val:qtdP(o.media),
        ir: R.PS.porFun[o.k] ? "pessoas:fun:"+o.k : undefined, sub:"função "+o.k+" · pico "+fmt(o.pico,0)}))},
      blocoMesAMes(serie, i=>`pessoas:mes:${i}:${G}:${dd}`, idx)].filter(Boolean),
    premissas:premissasPessoas(R), voltar:"pessoas:total"};
}

function rastroPessoasTipo(R, cat, g, d, p){
  const S = filtrarPessoas(R.PS, semFiltro(g) ? "todos" : g, semFiltro(d) ? "todos" : d);
  const itens = S.itens.filter(it=>it.categoria===cat);
  if(!itens.length) return null;
  const idx = idxPeriodo(p), n = Math.max(1, idx.length);
  const serie = MESES.map((m,i)=>itens.reduce((s,it)=>s+(+it.qtdMes[i]||0),0));
  const media = idx.reduce((s,i)=>s+serie[i],0)/n;
  const funs = juntarPessoas(itens, it=>it.fcod, idx).sort((a,b)=>b.media-a.media);
  const grs  = juntarPessoas(itens, it=>it.grupo, idx).sort((a,b)=>grupoIdx(a.k)-grupoIdx(b.k));
  const deps = juntarPessoas(itens, it=>it.dept, idx).sort((a,b)=>b.media-a.media);
  return {titulo:cat, subtitulo:"Tipo de função · "+nomeRecorte(g, d)+" · média mensal "+nomePeriodo(p),
    valor:qtdP(media)+"/mês", temPeriodo:true,
    blocos:[
      {titulo:"Por função — média mensal", linhas: funs.map(o=>({rot:o.fnome||o.k, val:qtdP(o.media),
        ir: R.PS.porFun[o.k] ? "pessoas:fun:"+o.k : undefined, sub:"função "+o.k+" · pico "+fmt(o.pico,0)+" em "+MESES[o.iPico]}))},
      {titulo:"Por quadro", linhas: grs.map(o=>({rot:CURTO_GR[o.k]||o.k, val:qtdP(o.media), sub:pctDe(o.media, media)}))},
      {titulo:"Por departamento", linhas: deps.map(o=>({rot:o.k, val:qtdP(o.media), ir:"pessoas:dept:"+o.k, sub:"pico "+fmt(o.pico,0)}))},
      blocoMesAMes(serie, i=>`pessoas:mes:${i}:${semFiltro(g)?"todos":g}:${semFiltro(d)?"todos":d}`, idx)].filter(Boolean),
    nota:"O tipo sai do nome do cargo (operador, motorista, mecânico, trabalhador rural, liderança...).",
    premissas:premissasPessoas(R), voltar:"pessoas:total"};
}

function rastroPessoasQuadro(R, g, p){
  const C = confrontoQuadro(R.PS), idx = idxPeriodo(p);
  const ls = C.linhas.filter(l=>semFiltro(g) || l.grupo===g).map(l=>linhaNoPeriodo(l, idx));
  const t = somarConfronto(ls), nome = f => (R.PS.nomeFun && R.PS.nomeFun[f]) || f;
  const irF = f => R.PS.porFun[f] ? "pessoas:fun:"+f : undefined;
  const falta = ls.filter(l=>l.contratar>0).sort((a,b)=>b.contratar-a.contratar);
  const sobra = ls.filter(l=>l.exced>0).sort((a,b)=>b.exced-a.exced);
  const resumo = [
    {rot:"Ativo no ERP", val:qtdP(t.ativo), sub:"com os ajustes do Resumo de Pessoas, nas "+t.n+" funções que o plano usa"},
    {rot:"Férias e demissões programadas", val:fmt(t.ferias+t.demis)},
    {rot:"Disponível", val:qtdP(t.disp), sub:"ativo − férias − demissões"},
    {rot:"Pico somado das funções", val:qtdP(t.ocupa), sub:"cada função no seu mês de pico "+nomePeriodo(p)+", com quem está no FAT"},
    {rot:"A contratar", val: t.contratar>0 ? "+"+fmt(t.contratar) : "—", sub:falta.length+" funções"},
    {rot:"Excedente", val: t.exced>0 ? fmt(t.exced) : "—", sub:sobra.length+" funções"},
  ];
  if(semFiltro(g)) resumo.push(
    {rot:"Afastados no ERP", val:fmt(C.afastados), sub:"contam no quadro da empresa, fora do disponível"},
    {rot:"Em funções que o plano não usa", val:fmt(C.foraDoPlanoQtd), sub:C.foraDoPlano.map(x=>nome(x.fcod)+" "+fmt(x.ativo)).join(" · ")});
  const blocos = [{titulo:"Resumo", linhas:resumo}];
  if(semFiltro(g)) blocos.push({titulo:"Por quadro", linhas:["OPERACIONAL","ADM AGRÍCOLA","OFICINA","FAT"].map(G=>{
      const lg = ls.filter(l=>l.grupo===G); if(!lg.length) return null; const tg = somarConfronto(lg);
      return {rot:CURTO_GR[G], val: tg.contratar>0 ? "+"+fmt(tg.contratar)+" a contratar" : "em dia", ir:"pessoas:quadro:"+G+(p==="todos" ? "" : ":"+p),
        sub:"ativo "+fmt(tg.ativo)+" · disponível "+fmt(tg.disp)+" · pico "+fmt(tg.ocupa)+(tg.exced>0 ? " · excedente "+fmt(tg.exced) : "")}; }).filter(Boolean)});
  blocos.push({titulo:"Funções a contratar", linhas: falta.length ? falta.map(l=>({rot:nome(l.fcod), val:"+"+fmt(l.contratar), ir:irF(l.fcod),
      sub:"pico "+fmt(l.ocupa)+(l.pico>0 ? " em "+MESES[l.iPico] : "")+" · disponível "+fmt(l.disp)})) : [{rot:"Nenhuma", val:"—"}]});
  if(sobra.length) blocos.push({titulo:"Funções com excedente", linhas: sobra.map(l=>({rot:nome(l.fcod), val:fmt(l.exced), ir:irF(l.fcod),
      sub:"disponível "+fmt(l.disp)+" · pico "+fmt(l.ocupa)}))});
  return {titulo:"Quadro atual × projetado"+(semFiltro(g) ? "" : " — "+(CURTO_GR[g]||g)),
    subtitulo:"Necessidade do plano × quadro ativo do ERP, por função · pico "+nomePeriodo(p), temPeriodo:true,
    valor: t.contratar>0 ? "+"+fmt(t.contratar)+" a contratar" : "Quadro cobre o plano", blocos,
    nota:"A contratar soma função por função, cada uma no seu mês de pico do período: sobra numa função não cobre falta em outra. "+
         "O ADM agrícola e a oficina vêm do quadro previsto da controladoria; o ativo do ERP só tem as funções que ele cadastra.",
    premissas:premissasPessoas(R), voltar:"pessoas:total"};
}

/* ---------- frota: horas, equipamentos, CRM ---------- */
function rastroFrotaHoras(R){
  const ativs = R.L.filter(r=>r.horas>0).sort((a,b)=>b.horas-a.horas);
  return {titulo:"Horas-máquina", subtitulo:"Horas de uso da frota, todas as atividades", valor:fmt(R.horasT)+" h",
    blocos:[{titulo:"Atividades que mais usam frota", linhas: ativs.slice(0,25).map(r=>({
      rot:`${codExibir(r.a.cod)} · ${r.a.nome}`, val:fmt(r.horas)+" h", ir:"ativ:"+r.a.cod, sub:(r.frotaR||0)+" equip."}))}],
    premissas:premissasGerais()};
}
function rastroFrotaOper(R){
  const itens = [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=>b.qtd-a.qtd);
  // O valor conta CONJUNTOS (máquina + implemento de cada frente = 1); a lista
  // conta cada máquina e cada implemento em separado, por isso soma mais.
  return {titulo:"Frota operacional", subtitulo:"Conjuntos necessários pelo plano — máquina e implemento contam como um", valor:fmt(R.frotaT)+" un",
    blocos:[{titulo:"Por item de frota — máquinas e implementos contados separadamente", linhas: itens.map(l=>({rot:l.item, val:fmt(l.qtd)+" un",
      sub:`${fmt(l.hTotPlano)} ${l.unidade==="km"?"km":"h"} de uso pelo plano`}))}],
    premissas:premissasGerais()};
}
function rastroFrotaApoioFixo(R){
  const itens = R.AP.linhas.filter(l=>l.nec>0.01).sort((a,b)=>b.nec-a.nec);
  return {titulo:"Frota de apoio", subtitulo:"Utilização fixa, fora do CRM por horas do plano", valor:fmt(Math.ceil(R.AP.total))+" un",
    blocos:[{titulo:"Itens", linhas: itens.map(l=>({rot:l.nome||l.item, val:fmt(l.nec,1)+" un",
      sub:`${l.ativ?l.ativ+" · ":""}disponibilidade ${fmt((l.disp||0)*100,0)}%, utilização ${fmt((l.util||0)*100,0)}%`}))}],
    premissas:premissasGerais()};
}
function rastroTransbordo(R){
  const TR = R.TR;
  const blocos = ["camSafra","camMuda","trbSafra","trbMuda"].map(k=>TR[k])
    .filter(b=>b.frotaR>0).map(b=>({rot:b.nome, val:fmt(b.frotaR)+" un",
      sub:`${fmt(b.ton)} t · ciclo de ${fmt(b.ciclo,1)} min · ${fmt(b.viagens,0)} viagens`}));
  return {titulo:"Transbordos", subtitulo:"Frota de transporte e transbordo de cana", valor:fmt(TR.frota)+" un",
    blocos:[{titulo:"Por bloco (colheita/muda × caminhão/transbordo)", linhas: blocos.length?blocos:[{rot:"Nada dimensionado", val:"—"}]}],
    premissas: premissasGerais().concat([
      {rot:"Raio médio — safra", val:fmt(P.raioSafra)+" km"}, {rot:"Raio médio — muda", val:fmt(P.raioMuda)+" km"},
    ])};
}
function rastroApoio(R){
  const AE = R.AE;
  const itens = [...AE.linhas].sort((a,b)=>b.total-a.total);
  const estr = x => x.qtd>0 ? fmt(x.qtd)+" un × "+fmt(x.hmes)+" h" : "parado";
  const perRot = l => "safra "+estr(l.s)+" · entressafra "+estr(l.e);
  return {titulo:"Equipamentos de apoio", subtitulo:"Por número de equipamentos e horas, nos meses do período de cada um", valor:fmt(AE.equip)+" un",
    blocos:[{titulo:"Equipamentos", linhas: itens.map(l=>({rot:l.nome, val:fmt(num(l.qtd))+" un",
      sub:`${perRot(l)} · ${fmt(l.horas)} h · ${fmt(l.litros)} L · ${l.efetivo} pessoas · ${brl(l.total)}`}))},
      {titulo:"Mês a mês", linhas: MESES.map((m,i)=>({rot:m, val:brl(AE.dieselMes[i]+AE.mdoMes[i]+AE.manutMes[i]), ir:"mes:"+i,
        sub:`${fmt(AE.horasMes[i])} h · ${fmt(AE.litrosMes[i])} L de diesel`})).filter((x,i)=>AE.horasMes[i]>0)}],
    premissas:premissasGerais()};
}
function rastroCRM(R){
  const itens = [...R.crmFrotaL].filter(l=>l.total>0.01).sort((a,b)=>b.total-a.total);
  return {titulo:"CRM total projetado", subtitulo:"Manutenção — peças, terceiros, materiais e lubrificantes", valor:brl(R.crmTotal),
    blocos:[
      {titulo:"Por componente", linhas: CRM_COMP_LBL.map(([k,n])=>({rot:n, val:brl(R.crmComp[k])}))},
      {titulo:"Por item de frota", linhas: itens.slice(0,25).map(l=>({rot:l.item, val:brl(l.total),
        sub:`${fmt(l.baseUso)} ${l.unidade} a ${brl(l.rh,2)}/${l.unidade}`}))},
    ],
    premissas:premissasGerais()};
}
function rastroCRMExced(R){
  const itens = [...R.crmFrotaL].filter(l=>l.crmExced>0.01).sort((a,b)=>b.crmExced-a.crmExced);
  return {titulo:"CRM de frota excedente", subtitulo:"Frota prevista além do que o plano efetivamente usa", valor:brl(R.crmExtra),
    blocos:[{titulo:"Itens com excedente", linhas: itens.length ? itens.map(l=>({rot:l.item, val:brl(l.crmExced),
      sub:`${fmt(l.horasExced)} ${l.unidade} não usados pelo plano`})) : [{rot:"Nenhum excedente", val:"—"}]}],
    premissas:premissasGerais()};
}
function rastroReforma(){
  const R = reforma();
  const conj = Object.entries(R.porConjunto||{}).sort((a,b)=>b[1]-a[1]);
  return {titulo:"Provisionamento de reforma", subtitulo:"Orçamento de reforma por conjunto/especialidade", valor:brl(R.total),
    blocos:[
      {titulo:"Por especialidade", linhas: (R.esps||[]).filter(e=>e.total>0).sort((a,b)=>b.total-a.total).map(e=>({
        rot:e.esp, val:brl(e.total), sub:`${e.unidades} equip. · ${e.orcadas} orçados · média ${brl(e.media||0)}`}))},
      {titulo:"Onde concentra o gasto (conjunto)", linhas: conj.length ? conj.map(([c,v])=>({rot:c, val:brl(v)}))
        : [{rot:"Nenhum conjunto orçado ainda", val:"—"}]},
    ],
    nota:"Marque o destino de cada equipamento em Manutenção de Frota — botão + do modelo, opção \"Vai reformar\".",
    premissas:premissasGerais()};
}

/* ---------- gasto real (ERP/Power BI) de um equipamento num conjunto ----------
   Lista o que conta hoje (mapeado por tag, ou incluido a mao) com checkbox pra
   desmarcar, e devolve buscaAdicionar pra ui/rastro.js montar a caixa de busca
   que inclui outro lancamento deste equipamento -- de qualquer tag, nao so a
   mapeada pro conjunto (e o caminho pra "inserir item na celula do Power BI"). */
function rastroReformaBiItem(familia, cod, conjunto){
  const {itens, total} = itensReforma(cod, conjunto, familia);
  itens.sort((a,b)=>b.valor-a.valor);
  /* Produtos deste SISTEMA no ultimo ano, classificados pelo produto e nao pela
     tag do ERP: a mangueira hidraulica lancada em ADMISSAO aparece aqui, no
     compartimento de hidraulica, que e onde ela vai ser orcada. Cada um com a
     quantidade que a proxima reforma vai usar; quantidade x valor medio do ano
     e o orcamento daquele produto. */
  // mesma janela do painel de filtros da aba; sem "De" lançado, o último ano
  // de dado que a extração trouxe
  const jan = janelaGastoReal();
  const desde = jan.inicio || desdeUltimoAno();
  const sistemas = [conjunto].concat(tagsBiDoConjunto(familia, conjunto) || []);
  const prods = produtosDoEquipamento(cod, {sistemas});
  const q = qtdProdutos(cod, conjunto);
  const orc = orcamentoProdutos(cod, conjunto, familia);
  const linhasProd = prods.map(p=>({
    rot: p.produto,
    val: brl(p.media),
    sub: `${p.vezes}× no período · ${brl(p.total)} no total · ${p.porProduto
      ? "classificado pelo produto" : "pela tag do ERP ("+p.tags.join(", ")+")"}`,
    qtd: {cod, conjunto, produto: p.produto, valor: num(q[p.produto]) || "", media: p.media},
  }));
  return {
    titulo: conjunto,
    subtitulo: `Gasto real no ERP — equipamento ${cod}`,
    valor: brl(orc.total || total),
    largo: true,
    blocos: [
      {titulo:"Lançamentos — desmarque o que não deve entrar no orçamento", linhas: itens.length ? itens.map(it=>({
        rot: it.desc, val: brl(it.valor), sub: fmtDataCurta(it.data)+(it.origem==="manual"?" · incluído à mão":""),
        flag: {cod, conjunto, chave: it.chave, ligado: it.ligado, origem: it.origem}}))
        : [{rot: janelaVazia() ? "Nenhum lançamento neste compartimento ainda"
                               : "Nenhum lançamento neste compartimento dentro da janela do painel de filtros", val:"—"}]},
      {titulo:`Produtos deste sistema — quantidade que a reforma vai usar${
        desde ? " (de "+fmtDataCurta(desde)+(jan.fim ? " a "+fmtDataCurta(jan.fim) : " para cá")+")" : ""}`,
       linhas: linhasProd.length ? linhasProd
        : [{rot: janelaVazia() ? "Nenhum produto deste sistema no período extraído"
                               : "Nenhum produto deste sistema na janela do painel de filtros", val:"—"}]},
    ],
    buscaAdicionar: {cod, conjunto},
    nota: (orc.total
      ? `Orçamento por produto: ${brl(orc.total)} em ${orc.itens.length} produto(s) — é ele que vale para esta unidade, no lugar do gasto real. `
      : "")
      + (itens.length ? `${itens.length} lançamento${itens.length>1?"s":""} de gasto real neste compartimento. `+
      `Desmarque o que não deve entrar` : `Nada contando ainda nesta unidade.`)+
      ` — busque abaixo pra incluir outro lançamento do ERP deste equipamento, mesmo de outra tag.`,
  };
}
function fmtDataCurta(iso){
  const [a,m,d] = String(iso||"").split("-");
  return a ? `${d}/${m}/${a}` : "";
}

/* ---------- diesel ---------- */
function rastroDiesel(R, periodo){
  const CB = R.CB;
  const idxs = MESES.map((m,i)=>i).filter(i=>periodo==="todos"||periodoMes(i)===periodo);
  const litros = somaPeriodo(idxs.map(i=>CB.litrosOperMes[i]+CB.litrosApoioMes[i]), "todos");
  const custo  = somaPeriodo(idxs.map(i=>CB.custoOperMes[i]+CB.custoApoioMes[i]), "todos");
  return {titulo:"Volume de diesel necessário", subtitulo:"Combustível projetado pela frota do plano", valor:fmt(litros)+" L",
    blocos:[{titulo:"Litros, por mês", linhas: idxs.map(i=>({rot:MESES[i],
      val:fmt(CB.litrosOperMes[i]+CB.litrosApoioMes[i])+" L", sub:brl(CB.preco[i],2)+"/L"}))}],
    nota: litros>0 ? `Custo no período: ${brl(custo)}.` : "",
    premissas: premissasGerais(), temPeriodo:true};
}

/* ---------- insumos ---------- */
function rastroInsumos(R){
  const lista = insLista();
  const itens = lista.slice().sort((a,b)=>(R.volDem[b.prod]||0)-(R.volDem[a.prod]||0));
  return {titulo:"Produtos cadastrados", subtitulo:"Insumos agronômicos no cadastro", valor:fmt(lista.length),
    blocos:[{titulo:"Com maior volume demandado no plano", linhas: itens.filter(i=>(R.volDem[i.prod]||0)>0).slice(0,20).map(i=>({
      rot:i.prod, val:fmt(R.volDem[i.prod],1)+" "+(i.un||""), sub:brl(i.preco,2)+"/"+(i.un||"un")}))
      .concat(itens.some(i=>(R.volDem[i.prod]||0)>0)?[]:[{rot:"Nenhum volume demandado ainda", val:"—"}])}],
    premissas:premissasGerais()};
}

/* ---------- fornecedores / matéria-prima ---------- */
function rastroForn(R){
  const F = R.FORN;
  const origens = Object.entries(F.origens||{}).sort((a,b)=>b[1].custo-a[1].custo);
  return {titulo:"Matéria-prima", subtitulo:"Custo médio ponderado por tonelada, todas as origens", valor: F.tonTotal>0?brl(F.rsTMedio,2)+"/t":"—",
    blocos:[{titulo:"Por origem", linhas: origens.map(([nome,o])=>({rot:o.nome||nome, val:o.ton>0?brl(o.rsT,2)+"/t":"—",
      sub:`${fmt(o.ton)} t · ${brl(o.custo)} · ${o.nat}`}))}],
    premissas: premissasGerais().concat([{rot:"ATR médio ponderado", val:fmt(F.atrMedio,1)+" kg/t"}])};
}

/* ---------- transporte de pessoal ---------- */
function rastroTPess(R){
  const TP = R.TP;
  const itens = [...TP.linhas].sort((a,b)=>b.total-a.total);
  return {titulo:"Transporte de pessoal", subtitulo:"Rotas de ônibus/van dos colaboradores", valor:brl(TP.total),
    blocos:[{titulo:"Por rota", linhas: itens.map(l=>({rot:l.rota, val:brl(l.total),
      sub:`${fmt(num(l.qtd))} veíc. · ${fmt(l.lugares)} lugares · ${fmt(l.kmRota+l.kmEx)} km`}))}],
    premissas:premissasGerais()};
}

/* ---------- plano de contas ---------- */
function rastroContas(R){
  const CV = contasValores(R);
  const {mapeado, semConta} = totaisContas(CV);
  const linhas = CFG.contas.filter(c=>CV[c.conta]>0).sort((a,b)=>CV[b.conta]-CV[a.conta]);
  return {titulo:"Plano de Contas", subtitulo:"Custo projetado mapeado às contas contábeis", valor:brl(mapeado),
    blocos:[{titulo:"Contas com maior valor", linhas: linhas.slice(0,20).map(c=>({rot:c.conta+" · "+c.desc,
      val:brl(CV[c.conta]), sub:c.grupo}))}].concat(semConta>0.5 ? [{titulo:"Sem conta no plano de contas",
      linhas: Object.entries(SEM_CONTA).filter(([k])=>(CV[k]||0)>0.5).map(([k,rot])=>({rot, val:brl(CV[k])}))}] : []),
    nota:`${CFG.contas.length} contas cadastradas · ${fmt(R.total>0?mapeado/R.total*100:0,0)}% do custo total mapeado.`,
    premissas:premissasGerais()};
}

/* ---------- Plano de Contas: uma conta e um grupo de contas ----------
   conta:<código> abre de onde vem cada real da conta (a origem que
   contasOrigens guarda na apuração: etapa, quadro, produto...);
   contas:grupo:<grupo> abre as contas do grupo. As linhas "sem conta"
   (__insumos, __espor, __fat) também abrem por conta:<chave>. */
const GRUPO_SEM_CONTA = "Sem conta no plano";
function irDaOrigem(R, cod, rot){
  if(/^(INS-0[1-4]|__insumos)$/.test(cod) && (R.volDem||{})[rot]) return "demanda:"+rot;
  const m = /^Equipes das atividades — (.+)$/.exec(rot);
  if(m){ const e = Object.keys(R.etapas||{}).find(x=>x.toLowerCase()===m[1].toLowerCase()); return e ? "etapa:"+e : undefined; }
  if(/^Diesel/.test(rot)) return "nat:diesel";
  if(/^CRM da frota/.test(rot)) return "nat:manut";
  if(/^Quadro (ADM|da oficina)/.test(rot)) return "cat:mdo";
  return undefined;
}
function rastroContaContabil(R, cod){
  const c = CFG.contas.find(x=>x.conta===cod), semRot = SEM_CONTA[cod];
  if(!c && !semRot) return null;
  const CV = contasValores(R), {total} = totaisContas(CV);
  const v = CV[cod]||0, combinada = CONTA_COMBINADA[cod];
  const OR = contasOrigens(R)[cod] || [];
  const mostra = OR.slice(0,25), resto = OR.slice(25).reduce((s,x)=>s+x.v,0);
  const origem = mostra.length
    ? mostra.map(o=>({rot:o.rot, val:brl(o.v), sub:pctDe(o.v, v)+" da conta", ir:irDaOrigem(R, cod, o.rot)}))
        .concat(resto>0.5 ? [{rot:"Demais origens ("+(OR.length-25)+")", val:brl(resto)}] : [])
    : [{rot: combinada ? "O valor desta conta está somado na "+combinada : "Sem valor no plano",
        val:"—", ir: combinada ? "conta:"+combinada : undefined}];
  return {titulo: c ? c.conta+" · "+c.desc : semRot,
    subtitulo: c ? c.grupo+" · "+c.nat : GRUPO_SEM_CONTA,
    valor: combinada ? "incluído em "+combinada : brl(v),
    blocos:[{titulo:"De onde vem", linhas:origem},
      c ? {titulo:"Cadastro da conta", linhas:[
        {rot:"Grupo", val:c.grupo, ir:"contas:grupo:"+c.grupo},
        {rot:"Natureza", val:c.nat},
        {rot:"Classificação", val:c.cls},
        {rot:"Custo ou despesa", val:c.cd},
        {rot:"Direcionador", val:c.dir},
        {rot:"Participação no custo do plano", val:pctDe(v, total)}]}
        : {titulo:"Por que não tem conta", linhas:[{rot:"O plano de contas não tem conta própria para este item; ele soma no total para o total fechar com o custo do plano.", val:pctDe(v, total)+" do custo"}]}],
    premissas:premissasGerais(), voltar:"contas:grupo:"+(c ? c.grupo : GRUPO_SEM_CONTA)};
}
function rastroContasGrupo(R, g){
  const CV = contasValores(R), {total} = totaisContas(CV);
  const semConta = g===GRUPO_SEM_CONTA;
  const itens = semConta
    ? Object.entries(SEM_CONTA).map(([k,rot])=>({k, rot, v:CV[k]||0, cls:"", cd:""}))
    : CFG.contas.filter(c=>c.grupo===g).map(c=>({k:c.conta, rot:c.conta+" · "+c.desc, v:CONTA_COMBINADA[c.conta] ? 0 : (CV[c.conta]||0),
        cls:c.cls, cd:c.cd, comb:CONTA_COMBINADA[c.conta]}));
  if(!itens.length) return null;
  const tot = itens.reduce((s,x)=>s+x.v,0);
  const com = itens.filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v), sem = itens.filter(x=>!(x.v>0.5));
  const porCls = k => itens.filter(x=>x.cls===k).reduce((s,x)=>s+x.v,0), porCd = k => itens.filter(x=>x.cd===k).reduce((s,x)=>s+x.v,0);
  const blocos = [{titulo:"Contas do grupo, da maior para a menor", linhas: com.length
    ? com.map(x=>({rot:x.rot, val:brl(x.v), sub:pctDe(x.v, tot)+" do grupo"+(x.cls ? " · "+x.cls+" · "+x.cd : ""), ir:"conta:"+x.k}))
    : [{rot:"Nenhuma conta com valor no plano", val:"—"}]}];
  if(!semConta) blocos.push({titulo:"Composição do grupo", linhas:[
    {rot:"Variável", val:brl(porCls("Variável")), sub:pctDe(porCls("Variável"), tot)},
    {rot:"Fixo", val:brl(porCls("Fixo")), sub:pctDe(porCls("Fixo"), tot)},
    {rot:"Custo", val:brl(porCd("Custo")), sub:pctDe(porCd("Custo"), tot)},
    {rot:"Despesa", val:brl(porCd("Despesa")), sub:pctDe(porCd("Despesa"), tot)}]});
  if(sem.length) blocos.push({titulo:"Sem valor no plano", linhas: sem.map(x=>({rot:x.rot, val: x.comb ? "em "+x.comb : "—",
    ir: x.comb ? "conta:"+x.comb : "conta:"+x.k}))});
  return {titulo:g, subtitulo:"Grupo do plano de contas", valor:brl(tot), blocos,
    nota: pctDe(tot, total)+" do custo do plano.", premissas:premissasGerais(), voltar:"contas"};
}

/* ---------- Demandas de insumos e materiais ---------- */
const nomeMes = i => i==null ? "—" : MESES[i];
function rastroDemanda(R, prod){
  const l = demandasInsumos(R).linhas.find(x=>x.prod===prod); if(!l) return null;
  const un = l.un ? " "+l.un : "";
  const usos = [];
  R.L.forEach(r=>tratamentosDaLinha(r).forEach(t=>composicao(t.trat).forEach(c=>{
    if(c.prod!==prod) return; const d = doseBase(c);
    usos.push({rot:codExibir(r.a.cod)+" · "+r.a.nome, v:t.area*d, ir:"ativ:"+r.a.cod,
      sub:"tratamento "+t.trat+" · "+fmt(t.area)+" ha × "+fmt(d, d<1?3:2)+un+"/ha"+(c.compra===false ? " · só consome estoque" : "")});
  })));
  usos.sort((a,b)=>b.v-a.v);
  return {titulo:prod, subtitulo:"Demanda de insumo · "+l.famNome, valor: l.comprar>1e-9 ? "comprar "+fmt(l.comprar, l.comprar<10?2:0)+un : "estoque cobre o plano",
    blocos:[
      {titulo:"Necessidade × estoque", linhas:[
        {rot:"Volume do plano", val:fmt(l.vol, l.vol<10?2:0)+un, sub:"tratamentos lançados no Plano Operacional"},
        {rot:"Estoque", val:fmt(l.est, l.est<10?2:0)+un, sub:l.estData ? "saldo em "+l.estData : "aba Insumos"},
        {rot:"Saldo após o plano", val:fmt(l.saldo, Math.abs(l.saldo)<10?2:0)+un, sub: l.saldo<0 ? "falta" : "sobra"},
        {rot:"A comprar", val:fmt(l.comprar, l.comprar<10?2:0)+un, sub: l.soEstoque ? "sem as linhas marcadas para só consumir estoque" : ""},
        {rot:"Valor a comprar", val:brl(l.valor), sub:l.preco>0 ? brl(l.preco,2)+"/"+(l.un||"un")+" (preço corrigido)" : "produto sem preço"},
        {rot:"Estoque acaba em", val:nomeMes(l.acaba), sub: l.acaba!=null ? "a compra tem de chegar antes" : "o estoque cobre o ano"}]},
      {titulo:"Onde é usado", linhas: usos.length ? usos.map(u=>({rot:u.rot, val:fmt(u.v, u.v<10?2:0)+un, sub:u.sub, ir:u.ir})) : [{rot:"—", val:"—"}]},
      {titulo:"Mês a mês", linhas: MESES.map((m,i)=>({i, m})).filter(x=>l.mes[x.i]>0).map(x=>({rot:x.m,
        val:fmt(l.mes[x.i], l.mes[x.i]<10?2:0)+un, sub: l.faltaMes[x.i]>1e-9 ? "comprar "+fmt(l.faltaMes[x.i], l.faltaMes[x.i]<10?2:0)+un : "coberto pelo estoque"}))}],
    premissas:premissasGerais(), voltar:"demandas"};
}
function rastroDemandaMaterial(R, ix){
  const l = demandasMateriais(R).linhas.find(x=>x.ix===+ix); if(!l) return null;
  const un = l.un ? " "+l.un : "";
  return {titulo:l.item, subtitulo:"Demanda de material · "+l.cat, valor: l.comprar>0 ? "comprar "+fmt(l.comprar)+un : "estoque cobre o plano",
    blocos:[{titulo:"Necessidade × estoque", linhas:[
      {rot:"Quantidade anual", val:fmt(l.qtd)+un, sub:"lista de materiais (aba Insumos)"},
      {rot:"Estoque", val:fmt(l.est)+un, sub:"informado na aba Demandas"},
      {rot:"A comprar", val:fmt(l.comprar)+un},
      {rot:"Valor a comprar", val:brl(l.valor), sub:brl(l.preco,2)+"/"+(l.un||"un")},
      {rot:"Mês de compra", val:nomeMes(l.mes), sub: l.mes!=null ? "mês de alocação do material" : "sem mês marcado: o custo vai pela área operada"}]}],
    premissas:premissasGerais(), voltar:"demandas"};
}
function rastroDemandas(R){
  const D = demandas(R);
  const top = D.ins.linhas.filter(l=>l.valor>0.5).slice(0,15);
  return {titulo:"Demandas de insumos e materiais", subtitulo:"O que o plano pede, o que há em estoque e o que falta comprar",
    valor:brl(D.valor)+" a comprar",
    blocos:[
      {titulo:"Resumo", linhas:[
        {rot:"Insumos a comprar", val:brl(D.ins.valor), sub:D.ins.nComprar+" de "+D.ins.n+" produtos"},
        {rot:"Materiais a comprar", val:brl(D.mat.valor), sub:D.mat.nComprar+" de "+D.mat.n+" itens"},
        {rot:"Consumo do plano (preço de compra)", val:brl(D.consumo), sub:"insumos e materiais"},
        {rot:"Coberto pelo estoque", val:brl(D.usoEstoque)}]},
      {titulo:"Insumos com maior valor a comprar", linhas: top.length ? top.map(l=>({rot:l.prod, val:brl(l.valor),
        sub:"comprar "+fmt(l.comprar, l.comprar<10?2:0)+" "+l.un+(l.acaba!=null ? " · estoque acaba em "+MESES[l.acaba] : ""), ir:"demanda:"+l.prod}))
        : [{rot:"O estoque cobre todos os insumos do plano", val:"—"}]}],
    premissas:premissasGerais()};
}
/* ---------- aderência à referência setorial (Painel) ---------- */
function rastroBench(R, id){
  const B = referenciaSetorial(R), g = B.grupos.find(x=>x.id===id);
  if(!g) return null;
  return {titulo:g.curto+" — referência setorial", subtitulo:g.nome, valor:brl(g.v),
    blocos:[
      {titulo:"O que compõe o grupo", linhas: (g.partes.some(p=>p.v>0.5) ? g.partes.filter(p=>p.v>0.5) : g.partes).map(p=>({rot:p.rot, val:brl(p.v), ir:p.ir,
        sub:(g.v>0 ? fmt(p.v/g.v*100,1) : "0")+"% do grupo"}))},
      {titulo:"Leitura", linhas:[
        {rot:"Peso no custo do plano", val:fmt(g.pct,1)+"%", ir:"total"},
        {rot:"Peso de referência do setor", val:fmt(g.ref,0)+"%"},
        {rot:"Desvio", val:(g.desvio>0?"+":"")+fmt(g.desvio,1)+" p.p.", sub:g.leitura+" (aderente até ±5 p.p.)"}]}],
    nota:"Os quatro grupos somam o custo do plano; a comparação só é significativa com o plano preenchido.",
    premissas:premissasGerais(), voltar:"total"};
}
/* ---------- hectares operados ---------- */
function rastroHectares(R){
  const ativs = R.L.filter(r=>r.ehHa && r.total>0).sort((a,b)=>b.total-a.total);
  return {titulo:"Hectares operados", subtitulo:"Área lançada no Plano Operacional, atividades em ha", valor:fmt(R.haOp)+" ha",
    blocos:[{titulo:"Por atividade", linhas: ativs.map(r=>({rot:`${codExibir(r.a.cod)} · ${r.a.nome}`, val:fmt(r.total)+" ha",
      ir:"ativ:"+r.a.cod, sub:r.a.etapa}))}],
    premissas:premissasGerais()};
}

const CRM_COMP_LBL = [["pecas","Peças"],["terc","Serviços de terceiros"],["consumo","Materiais de uso e consumo"],["lubrif","Lubrificantes"]];

function rastro(R, chave, periodo){
  R_ATUAL = R;
  const s = String(chave||"total");
  const i = s.indexOf(":");
  const tipo = i<0 ? s : s.slice(0,i);
  const arg  = i<0 ? "" : s.slice(i+1);
  const p = periodo || "todos";
  if(tipo==="total") return rastroTotal(R);
  if(tipo==="custoha") return rastroCustoHa(R);
  if(tipo==="op"){ const [id, modo] = arg.split(":"); return rastroOperacao(R, id, modo); }
  if(tipo==="corte") return rastroCorte(R);
  if(tipo==="fixo" || tipo==="variavel") return rastroFixoVariavel(R, tipo);
  if(tipo==="periodo") return rastroPeriodo(R, arg);
  if(tipo==="etapa") return rastroEtapa(R, arg);
  // grande conta e etapa por período: o período da chave já abriu filtrado
  // (ui/rastro.js); daqui em diante manda o filtro do modal
  if(tipo==="cat") return rastroConta(R, arg.split(":")[0], p);
  if(tipo==="opsoma"){ const [modo, quais] = arg.split(":"); return rastroSomaOperacoes(R, modo||"oper", quais||"principais"); }
  if(tipo==="etapaper") return rastroEtapaPeriodo(R, arg.replace(/:(safra|entressafra|todos)$/,""), p);
  if(tipo==="ativ")  return rastroAtividade(R, arg);
  if(tipo==="nat")   return rastroNatureza(R, arg);
  if(tipo==="mes")   return rastroMes(R, arg);
  if(tipo==="pessoas"){
    if(arg==="total" || !arg) return rastroPessoasTotal(R);
    if(arg==="pico") return rastroPessoasPico(R, p);
    if(arg.startsWith("dept:")) return rastroPessoasDept(R, arg.slice(5));
    if(arg.startsWith("fun:"))  return rastroPessoasFun(R, arg.slice(4));
    // painel do Resumo geral; o sufixo de período (:safra/:entressafra) já veio em p
    const a = arg.replace(/:(safra|entressafra)$/, "");
    if(a.startsWith("mes:")){ const [i, g, ...d] = a.slice(4).split(":"); return rastroPessoasMes(R, i, g, d.join(":")); }
    if(a.startsWith("grupo:")){ const [g, ...d] = a.slice(6).split(":"); return rastroPessoasGrupo(R, g, d.join(":"), p); }
    if(a.startsWith("tipo:")){ const [c, g, ...d] = a.slice(5).split(":"); return rastroPessoasTipo(R, c, g, d.join(":"), p); }
    if(a==="quadro" || a.startsWith("quadro:")) return rastroPessoasQuadro(R, a.slice(7), p);
  }
  if(tipo==="frota"){
    if(arg==="horas") return rastroFrotaHoras(R);
    if(arg==="oper") return rastroFrotaOper(R);
    if(arg==="apoiofixo") return rastroFrotaApoioFixo(R);
    if(arg==="transbordo") return rastroTransbordo(R);
    if(arg==="apoio") return rastroApoio(R);
    if(arg==="crm") return rastroCRM(R);
    if(arg==="crmexced") return rastroCRMExced(R);
    if(arg==="reforma") return rastroReforma();
  }
  if(tipo==="reformabi"){
    const [familia, cod, conjunto] = arg.split("|");
    return rastroReformaBiItem(familia, cod, conjunto);
  }
  if(tipo==="diesel") return rastroDiesel(R, p);
  if(tipo==="insumos") return rastroInsumos(R);
  if(tipo==="forn") return rastroForn(R);
  if(tipo==="tpess") return rastroTPess(R);
  if(tipo==="bench") return rastroBench(R, arg);
  if(tipo==="contas") return arg.startsWith("grupo:") ? rastroContasGrupo(R, arg.slice(6)) : rastroContas(R);
  if(tipo==="conta") return rastroContaContabil(R, arg);
  if(tipo==="demandas") return rastroDemandas(R);
  if(tipo==="demanda") return arg.startsWith("mat:") ? rastroDemandaMaterial(R, arg.slice(4)) : rastroDemanda(R, arg);
  if(tipo==="hect") return rastroHectares(R);
  return rastroTotal(R);
}

export { rastro };

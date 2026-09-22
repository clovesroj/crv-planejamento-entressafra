import { ADM_CRITERIOS } from '../dados/administrativo.js';
import { CFG } from '../dados/cfg.js';
import { ESCALAS } from '../dados/escalas.js';
import { CAT_LBL, MESES, NM, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { P, insLista } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { ETAPAS_ORD, arrRat } from './arrendamento.js';
import { criterioMensal, tarifaTerc } from './atividade.js';
import { tratCusto } from './insumos.js';
import { comps, custoPorOperacao } from './custo-operacao.js';
import { SEM_CONTA, contasValores, totaisContas } from './contas.js';
import { baseEtapa, custoUnit, premissaBase, rotuloBase } from './base-fisica.js';
import { reforma } from './reforma.js';
import { GASTO_REFORMA_BI } from '../dados/gasto-reforma-bi.js';
import { tagsBiDoConjunto } from '../dados/reforma-bi-map.js';

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

function premissasGerais(){
  return [
    {rot:"Dias efetivos por mês",        val:fmt(P.dias)},
    {rot:"Horas efetivas por dia",       val:fmt(P.hdia,1)+" h"},
    {rot:"Disponibilidade mecânica",     val:fmt(P.disp,0)+"%"},
    {rot:"Eficiência operacional",       val:fmt(num(P.efic)>0?num(P.efic):100,0)+"%"},
    {rot:"Meses do orçamento",           val:NM+" ("+MESES[0]+" a "+MESES[NM-1]+")"},
    {rot:"Preço base do diesel",         val:brl(P.diesel,2)+"/L"},
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
        val:brl(custoDaMuda(R)), sub:(ha>0?brl(custoDaMuda(R)/ha)+"/ha · ":"")+"na tabela do modelo PECEGE entra no plantio"}] : [])
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
               ["arrend","Arrendamento","percentual PECEGE/USP da aba Arrendamentos"],
               ["admin","Administrativo","critério de cada linha, aba Custos Administrativos"],
               ["deprec","Depreciação","pelo custo direto da operação"],
               ["gerais","Demais custos gerais","apoio, estrutura indireta, manutenção, transporte de pessoal…"]];
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
      rot:x.a.cod+" · "+x.a.nome, val:brl(x.direto), ir:"ativ:"+x.a.cod,
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
  const colh = R.etapas["COLHEITA"];
  const corte = R.L.filter(r=>r.a.cod==="A01"||r.a.cod==="A02");
  const dir = corte.reduce((s,r)=>s+r.direto,0);
  // pelo volume colhido informado em Premissas; sem ele, as toneladas do corte
  const ton = premissaBase("colheita") || corte.reduce((s,r)=>s+r.total,0);
  const ind = R.indiretoPool*(dir/(R.diretoSum||1));
  const arr = colh && colh.direto>0 ? colh.arrend*(dir/colh.direto) : 0;
  const tot = dir+ind+arr;
  const porT = v => ton>0 ? brl(v/ton,2)+"/t" : "—";
  return {
    titulo:"Custo de colheita — só o corte",
    subtitulo:"corte (A01 e A02), sem transporte nem transbordo · por tonelada cortada",
    valor: porT(tot),
    blocos:[
      {titulo:"A conta", linhas:[
        {rot:"Custo direto do corte", val:brl(dir), sub:porT(dir)},
        {rot:"Parte do corte no custo indireto", val:brl(ind), sub:"pelo custo direto · "+porT(ind)},
        {rot:"Parte do corte no arrendamento da colheita", val:brl(arr), sub:"pelo custo direto · "+porT(arr)},
        {rot:"Custo do corte", val:brl(tot), sub:porT(tot)+" · "+fmt(ton)+(premissaBase("colheita")?" t colhidas (premissa)":" t cortadas nas atividades")},
      ]},
      {titulo:"Atividades", linhas: corte.map(r=>({rot:r.a.cod+" · "+r.a.nome, val:brl(r.direto),
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
      ? ["mdo","manut","diesel","insumo","terc","espor"].map(k=>[CAT_LBL[k]||k, somaMes(R.mesesCat[k]), null])
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
      {titulo:"Por grande conta", linhas: cats.map(([k,v])=>({rot:CAT_LBL[k]||k, val:brl(v),
        sub:fmt(o.total>0?v/o.total*100:0,1)+"% do período"}))},
      {titulo:"No ano", linhas:[{rot:"Participação no custo total", val:fmt(R.total>0?o.total/R.total*100:0,1)+"%",
        ir:"total", sub:brl(R.total)+" no ano"}]},
    ],
    premissas: premissasGerais(),
    voltar:"total",
  };
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
      rot:`${r.a.cod} · ${r.a.nome}`, val:brl(r.direto), ir:"ativ:"+r.a.cod,
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
       sub:somaPct>0 ? `${fmt(arrRat(etapa)/somaPct*100,1)}% do arrendamento, pela referência PECEGE/USP` : "sem percentual informado"},
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

  const dias = num(P.dias) * r.janela.meses;
  const efic = num(P.efic) > 0 ? num(P.efic)/100 : 1;
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
          `Cabe nas ${fmt(num(P.hdia)*(num(P.disp)/100)*efic,1)} h efetivas por dia — ${fmt(P.hdia,1)} h de jornada × ${pct(num(P.disp)/100)} de disponibilidade mecânica × ${pct(efic)} de eficiência operacional. `+
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
      `do mês, de ${fmt(num(P.hdia),1)} h cada, e é a meta; por dia corrido divide pelos dias do calendário, `+
      `e é o termômetro de prazo. Os dias de cada mês saem da janela da atividade — mês marcado `+
      `como parcial é o que a janela corta no meio, e vale só os dias cobertos. `+
      (apertados
        ? `${apertados} ${apertados>1?"meses pedem":"mês pede"} mais do que o critério entrega (⚠): é aí que entra `+
          `frota extra, turno a mais ou volume remanejado para outro mês. O critério de cada mês se ajusta no `+
          `botão "mês" do Dimensionamento.`
        : `Nenhum mês pede mais do que o critério entrega.`),
  } : null;

  const destaques = [
    {rot: r.ehHa ? "Área" : "Volume", val: fmt(total)+" "+un,
     sub: r.janela.fonte==="datas" ? `de ${r.janela.ini} a ${r.janela.fim}`
        : `${fmt(r.janela.meses,1)} meses de execução`},
    {rot: "Custo por "+un, val: total > 0 ? brl(custo/total, 2) : "—",
     sub: brl(custo)+" no total"},
    {rot: "Frota", val: (r.frotaR || 0)+" equip.",
     sub: (r.frotaAlvo ? "frota fixada · rendimento veio dela — " : "") + (r.maqEfetiva || "—")},
    {rot: "Meta por dia efetivo", val: dias > 0 ? fmt(total/dias, 1)+" "+un : "—",
     sub: dias > 0 ? `${fmt(dias,0)} dias de operação · ${fmt(total/diasCal,1)} ${un} por dia corrido (${fmt(diasCal,0)} dias)`
                   : "sem janela definida"},
    {rot: "Efetivo", val: fmt(r.efetivo)+" pessoas",
     sub: (r.partes[0] ? r.partes[0].turnosEf : r.a.turnos)+" turno(s) · fator "+fmt(r.fator,2)},
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
  const diasJanela = num(P.dias) * r.janela.meses;        // dias efetivos na janela
  if(!(diasJanela > 0)) return null;
  const hDisp = num(P.hdia) * (num(P.disp)/100) * (num(P.efic)>0?num(P.efic)/100:1);   // hora efetiva por dia
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
      {rot:"Frota necessária", val:(r.frotaR||0)+" equip.",
       sub:`${fmt(r.horas)} h ÷ (${fmt(r.capMes||0)} ${un}/mês × ${fmt(r.janela.meses,1)} meses) = ${fmt(r.frota||0,2)}, arredondado para cima`},
      {rot:"Turnos", val:(r.partes[0]?r.partes[0].turnosEf:r.a.turnos)+"t"},
      {rot:"Escala", val:escala+" · fator "+fmt(r.fator,2)},
      {rot:"Efetivo", val:fmt(r.efetivo)+" pessoas"},
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

  const cf = R.MP.custoFuncao[r.fcod] || {};
  return {
    largo:true, destaques:apres.destaques, tabelas:apres.tabelas,
    titulo:`${r.a.cod} · ${r.a.nome}`, subtitulo:"Atividade do Plano Operacional",
    valor:brl(r.direto), blocos,
    premissas: premissasGerais().concat([
      {rot:"Salário do cargo "+(cf.nome||r.fcod), val:brl(cf.salCad||cf.sal||0,2)},
      {rot:"Custo mensal do cargo, com encargos e benefícios", val:brl(cf.mensal||0,2)},
      {rot:"Encargos sobre a folha", val:fmt((R.MP.encTot||0)*100,1)+"%"},
      {rot:"Atualização de preço de insumos", val:fmt(P.ipreco,0)+"%"},
      {rot:"Tarifa de terceirização", val:brl(tarifaTerc(cod),2)+"/ha"},
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
      ? itens.map(r=>({rot:`${r.a.cod} · ${r.a.nome}`, val:brl(r[campo]), ir:"ativ:"+r.a.cod,
          sub:r.a.etapa}))
      : [{rot:"Nenhuma atividade com este custo", val:"—"}]}];
    if(nat==="diesel") blocos.push({titulo:"Preço do diesel por mês", linhas:
      MESES.map((m,i)=>({rot:m, val:brl(R.CB.preco[i],2)+"/L"}))});
    if(nat==="mdo") blocos.push({titulo:"Fora das atividades", linhas:[
      {rot:"Equipamentos de apoio", val:brl(R.mdoApoio)},
      {rot:"Estrutura indireta", val:brl(R.mdoIndirT)},
      {rot:"Equipe de manutenção", val:brl(R.mdoManut)},
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
  const itens = R.L.map(r=>({r, v:(r.direto-r.cDiesel-r.cMDO)*(r.total>0?num(r.meses[idx])/r.total:0)
      + r.dieselMes[idx] + ((r.mdoMes||[])[idx]||0)}))
    .filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const matMes = (R.MT.linhas||[]).filter(l=>l.mes===idx && l.total>0);
  return {titulo:MESES[idx], subtitulo:"Custo do mês", valor:brl(R.meses[idx]),
    blocos:[
      {titulo:"Grandes contas do mês", linhas:Object.entries(R.mesesCat)
        .map(([k,a])=>({rot:k, val:brl(a[idx])}))},
      {titulo:"Atividades com lançamento no mês", linhas: itens.length
        ? itens.map(x=>({rot:`${x.r.a.cod} · ${x.r.a.nome}`, val:brl(x.v), ir:"ativ:"+x.r.a.cod,
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
    blocos:[{titulo:"Origem do efetivo", linhas: itens.map(i=>({rot:i.origem, val:fmt(i.qtd)+" pessoas", sub:i.fnome}))}],
    premissas:premissasGerais(), voltar:"pessoas:total"};
}
function rastroPessoasFun(R, fcod){
  const o = R.PS.porFun[fcod]; if(!o) return null;
  const itens = R.PS.itens.filter(i=>i.fcod===fcod);
  return {titulo:(itens[0]||{}).fnome||fcod, subtitulo:"Função · efetivo dimensionado", valor:fmt(o.qtd)+" pessoas",
    blocos:[{titulo:"Onde esta função é usada", linhas: itens.map(i=>({rot:i.origem, val:fmt(i.qtd)+" pessoas", sub:i.dept}))}],
    premissas:premissasGerais(), voltar:"pessoas:total"};
}
function rastroPessoasPico(R, periodo){
  const PS = R.PS;
  const idxs = MESES.map((m,i)=>i).filter(i=>periodo==="todos"||periodoMes(i)===periodo);
  const pico = idxs.length ? Math.max(0,...idxs.map(i=>PS.qtdMes[i])) : 0;
  const iPico = idxs.find(i=>PS.qtdMes[i]===pico);
  return {titulo:"Pico de mobilização", subtitulo:"Maior necessidade simultânea de pessoas", valor:fmt(pico)+" pessoas",
    blocos:[{titulo:"Pessoas mobilizadas, por mês", linhas: idxs.map(i=>({rot:MESES[i], val:fmt(PS.qtdMes[i])+" pessoas"}))}],
    nota: iPico!=null&&pico>0 ? `Pico em ${MESES[iPico]}.` : "",
    premissas:premissasGerais(), temPeriodo:true};
}

/* ---------- frota: horas, equipamentos, CRM ---------- */
function rastroFrotaHoras(R){
  const ativs = R.L.filter(r=>r.horas>0).sort((a,b)=>b.horas-a.horas);
  return {titulo:"Horas-máquina", subtitulo:"Horas de uso da frota, todas as atividades", valor:fmt(R.horasT)+" h",
    blocos:[{titulo:"Atividades que mais usam frota", linhas: ativs.slice(0,25).map(r=>({
      rot:`${r.a.cod} · ${r.a.nome}`, val:fmt(r.horas)+" h", ir:"ativ:"+r.a.cod, sub:(r.frotaR||0)+" equip."}))}],
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
  return {titulo:"Equipamentos de apoio", subtitulo:"Utilização fixa, por número de equipamentos e horas", valor:fmt(AE.equip)+" un",
    blocos:[{titulo:"Equipamentos", linhas: itens.map(l=>({rot:l.nome, val:fmt(num(l.qtd))+" un",
      sub:`${fmt(l.horas)} h · ${l.efetivo} pessoas · ${brl(l.total)}`}))}],
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

/* ---------- gasto real (ERP/Power BI) de um equipamento num conjunto ---------- */
function rastroReformaBiItem(familia, cod, conjunto){
  const porFrota = GASTO_REFORMA_BI.porFrota[cod] || {};
  const tags = tagsBiDoConjunto(familia, conjunto);
  let total = 0;
  const itens = [];
  for(const tag of tags){
    const dado = porFrota[tag];
    if(!dado) continue;
    total += dado.total;
    itens.push(...dado.itens);
  }
  itens.sort((a,b)=>b.valor-a.valor);
  return {
    titulo: conjunto,
    subtitulo: `Gasto real no ERP — equipamento ${cod}`,
    valor: brl(total),
    largo: true,
    blocos: [{titulo:"Lançamentos", linhas: itens.length ? itens.map(it=>({
      rot: it.desc, val: brl(it.valor), sub: fmtDataCurta(it.data)}))
      : [{rot:"Nenhum lançamento neste compartimento", val:"—"}]}],
    nota: itens.length ? `${itens.length} lançamento${itens.length>1?"s":""} do ERP, extraídos do Power BI.` : "",
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
/* ---------- hectares operados ---------- */
function rastroHectares(R){
  const ativs = R.L.filter(r=>r.ehHa && r.total>0).sort((a,b)=>b.total-a.total);
  return {titulo:"Hectares operados", subtitulo:"Área lançada no Plano Operacional, atividades em ha", valor:fmt(R.haOp)+" ha",
    blocos:[{titulo:"Por atividade", linhas: ativs.map(r=>({rot:`${r.a.cod} · ${r.a.nome}`, val:fmt(r.total)+" ha",
      ir:"ativ:"+r.a.cod, sub:r.a.etapa}))}],
    premissas:premissasGerais()};
}

const CRM_COMP_LBL = [["pecas","Peças"],["terc","Serviços de terceiros"],["consumo","Materiais de uso e consumo"],["lubrif","Lubrificantes"]];

function rastro(R, chave, periodo){
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
  if(tipo==="ativ")  return rastroAtividade(R, arg);
  if(tipo==="nat")   return rastroNatureza(R, arg);
  if(tipo==="mes")   return rastroMes(R, arg);
  if(tipo==="pessoas"){
    if(arg==="total" || !arg) return rastroPessoasTotal(R);
    if(arg==="pico") return rastroPessoasPico(R, p);
    if(arg.startsWith("dept:")) return rastroPessoasDept(R, arg.slice(5));
    if(arg.startsWith("fun:"))  return rastroPessoasFun(R, arg.slice(4));
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
  if(tipo==="contas") return rastroContas(R);
  if(tipo==="hect") return rastroHectares(R);
  return rastroTotal(R);
}

export { rastro };

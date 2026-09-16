import { ADM_CRITERIOS } from '../dados/administrativo.js';
import { CFG } from '../dados/cfg.js';
import { ESCALAS } from '../dados/escalas.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { ETAPAS_ORD, arrRat } from './arrendamento.js';
import { tarifaTerc } from './atividade.js';
import { tratCusto } from './insumos.js';

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
    valor: R.total,
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

/* ---------- nível 2: etapa (centro de custo) ---------- */
function rastroEtapa(R, etapa){
  const d = R.etapas[etapa];
  if(!d) return null;
  const ativs = R.L.filter(r=>r.a.etapa===etapa && r.direto>0).sort((a,b)=>b.direto-a.direto);
  const base = d.ha>0 ? {q:d.ha, un:"ha"} : {q:d.ton, un:"t"};
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
    {rot:`Base física`, val:fmt(base.q)+" "+base.un},
    {rot:`Custo por ${base.un}`, val:brl(d.total/base.q,2)+"/"+base.un},
  ]});

  return {titulo:etapa, subtitulo:"Centro de custo · etapa do plano", valor:d.total, blocos,
          premissas:premissasGerais(), voltar:"total"};
}

/* ---------- nível 3: atividade, descendo até a premissa ---------- */
function rastroAtividade(R, cod){
  const r = R.L.find(x=>x.a.cod===cod);
  if(!r) return null;
  const un = r.a.un.split("/")[0];
  const mesesComQtd = r.meses.map((q,i)=>({i, q:num(q)})).filter(x=>x.q>0);
  const escala = r.escala ? (ESCALAS[r.escala]||{}).nome || r.escala : "padrão das premissas";
  const trat = r.trat ? tratCusto(r.trat) : 0;

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
    {titulo:"Horas e frota", linhas:[
      {rot:"Rendimento operacional", val:fmt(r.rend,2)+" "+un+"/h"},
      {rot:"Taxa de utilização", val:pct(r.util)},
      {rot:"Horas = volume ÷ rendimento", val:fmt(r.horas)+" h"},
      {rot:"Capacidade por equipamento/mês", val:fmt(r.capMes||0)+" "+un},
      {rot:"Frota necessária", val:(r.frotaR||0)+" equip."},
      {rot:"Turnos", val:(r.partes[0]?r.partes[0].turnosEf:r.a.turnos)+"t"},
      {rot:"Escala", val:escala+" · fator "+fmt(r.fator,2)},
      {rot:"Efetivo", val:fmt(r.efetivo)+" pessoas"},
    ]},
    {titulo:"Equipamento e consumo, por frente", linhas: r.partes.map(p=>p.terc
      ? {rot:(p.modo||"Terceiro")+" · prestador de serviço", val:brl(p.cTerc),
         sub:`${fmt(p.area)} ${un} × ${brl(tarifaTerc(cod),2)}/ha de tarifa`}
      : {rot:`${p.modo?p.modo+" · ":""}${p.maq}${p.imp&&p.imp!=="----"?" + "+p.imp:""}`,
         val:brl(p.cDiesel+p.cManut+p.cMDO),
         sub:`${fmt(p.horas)} h · ${fmt(p.litros)} L a ${fmt(p.consumoLh,1)} L/h · diesel ${brl(p.cDiesel)} · MDO ${brl(p.cMDO)} · CRM ${brl(p.cManut)}`})},
    {titulo:"Preços e custos aplicados", linhas:[
      {rot:"Diesel", val:brl(r.cDiesel),
       sub:`${fmt(r.litros)} L · preço médio ${r.litros>0?brl(r.cDiesel/r.litros,2):brl(P.diesel,2)}/L, ponderado pelos meses`},
      {rot:"Mão de obra", val:brl(r.cMDO),
       sub:`${r.fcod} · ${r.fnome} · ${brl((R.MP.custoFuncao[r.fcod]||{}).hora||0,2)}/h × ${fmt(r.horas)} h × fator ${fmt(r.fator,2)}`},
      {rot:"Manutenção (CRM)", val:brl(r.cManut), sub:"taxa por hora da frota prevista, da aba Manutenção de Frota"},
      {rot:"Insumos", val:brl(r.cInsumo),
       sub:r.trat ? `tratamento ${r.trat} a ${brl(trat,2)}/ha × ${fmt(r.total)} ${un}` : "sem tratamento vinculado"},
      {rot:"Terceirização", val:brl(r.cTerc)},
      {rot:"CUSTO DIRETO DA ATIVIDADE", val:brl(r.direto)},
    ]},
  ];

  const cf = R.MP.custoFuncao[r.fcod] || {};
  return {titulo:`${r.a.cod} · ${r.a.nome}`, subtitulo:"Atividade do Plano Operacional",
    valor:r.direto, blocos,
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
            valor: nat==="mdo" ? R.mdoTotal : soma, blocos,
            premissas:premissasGerais(), voltar:"total"};
  }
  if(nat==="arrend"){
    const A = R.AR;
    return {titulo:"Arrendamento", subtitulo:"Custo da terra arrendada", valor:R.arrT,
      blocos:[
        {titulo:"Fazendas", linhas:A.linhas.map(l=>({rot:l.faz+(l.grupo?" · "+l.grupo:""),
          val:brl(l.periodo), sub:`${fmt(l.area)} ha × ${brl(l.rsHa,2)}/ha/ano`}))},
        {titulo:"Rateio entre as etapas", linhas:ETAPAS_ORD.filter(e=>R.etapas[e]).map(e=>({
          rot:e, val:brl(R.etapas[e].arrend||0), ir:"etapa:"+e, sub:fmt(arrRat(e),1)+"% de referência"}))},
      ],
      premissas:[{rot:"ATR médio", val:fmt(num(R.AR.linhas.length?135:135),0)+" kg/t"},
                 {rot:"Meses do orçamento", val:NM}],
      voltar:"total"};
  }
  if(nat==="admin"){
    const A = R.ADM;
    return {titulo:"Administração", subtitulo:"Custos administrativos rateados", valor:R.admT,
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
  const itens = R.L.map(r=>({r, v:(r.direto-r.cDiesel)*(r.total>0?num(r.meses[idx])/r.total:0)+r.dieselMes[idx]}))
    .filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  return {titulo:MESES[idx], subtitulo:"Custo do mês", valor:R.meses[idx],
    blocos:[
      {titulo:"Grandes contas do mês", linhas:Object.entries(R.mesesCat)
        .map(([k,a])=>({rot:k, val:brl(a[idx])}))},
      {titulo:"Atividades com lançamento no mês", linhas: itens.length
        ? itens.map(x=>({rot:`${x.r.a.cod} · ${x.r.a.nome}`, val:brl(x.v), ir:"ativ:"+x.r.a.cod,
            sub:`${fmt(num(x.r.meses[idx]))} ${x.r.a.un.split("/")[0]} no mês`}))
        : [{rot:"Nenhuma atividade lançada neste mês", val:"—"}]},
    ],
    premissas:premissasGerais(), voltar:"total"};
}

function rastro(R, chave){
  const [tipo, arg] = String(chave||"total").split(":");
  if(tipo==="total") return rastroTotal(R);
  if(tipo==="etapa") return rastroEtapa(R, arg);
  if(tipo==="ativ")  return rastroAtividade(R, arg);
  if(tipo==="nat")   return rastroNatureza(R, arg);
  if(tipo==="mes")   return rastroMes(R, arg);
  return rastroTotal(R);
}

export { rastro };

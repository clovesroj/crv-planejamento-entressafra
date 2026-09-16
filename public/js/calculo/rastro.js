import { ADM_CRITERIOS } from '../dados/administrativo.js';
import { CFG } from '../dados/cfg.js';
import { ESCALAS } from '../dados/escalas.js';
import { MESES, NM, periodoMes } from '../nucleo/calendario.js';
import { P, insLista } from '../nucleo/estado.js';
import { brl, fmt, num, pct } from '../nucleo/formato.js';
import { ETAPAS_ORD, arrRat } from './arrendamento.js';
import { tarifaTerc } from './atividade.js';
import { tratCusto } from './insumos.js';
import { reforma } from './reforma.js';

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

  return {titulo:etapa, subtitulo:"Centro de custo · etapa do plano", valor:brl(d.total), blocos,
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
  const itens = R.L.map(r=>({r, v:(r.direto-r.cDiesel)*(r.total>0?num(r.meses[idx])/r.total:0)+r.dieselMes[idx]}))
    .filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  return {titulo:MESES[idx], subtitulo:"Custo do mês", valor:brl(R.meses[idx]),
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
        .concat(Math.abs(fora)>0.5 ? [{rot:"Fora do detalhamento por departamento", val:fmt(fora)+" pessoas"}] : [])},
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
  return {titulo:"Frota operacional", subtitulo:"Equipamentos necessários pelo plano", valor:fmt(R.frotaT)+" un",
    blocos:[{titulo:"Por item de frota", linhas: itens.map(l=>({rot:l.item, val:fmt(l.qtd)+" un",
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
  const CV = contasValoresRastro(R);
  const mapeado = CFG.contas.reduce((s,c)=>s+(CV[c.conta]||0),0);
  const linhas = CFG.contas.filter(c=>CV[c.conta]>0).sort((a,b)=>CV[b.conta]-CV[a.conta]);
  return {titulo:"Plano de Contas", subtitulo:"Custo projetado mapeado às contas contábeis", valor:brl(mapeado),
    blocos:[{titulo:"Contas com maior valor", linhas: linhas.slice(0,20).map(c=>({rot:c.conta+" · "+c.desc,
      val:brl(CV[c.conta]), sub:c.grupo}))}],
    nota:`${CFG.contas.length} contas cadastradas · ${fmt(R.total>0?mapeado/R.total*100:0,0)}% do custo total mapeado.`,
    premissas:premissasGerais()};
}
// versão local, sem depender de ui/contas.js (calculo/ não importa de ui/)
function contasValoresRastro(R){
  const efet = R.efetivoTotal||0, encTot = R.MP.encTot, benTot = R.MP.benTot;
  const totalBenef = benTot*efet*NM;
  const totalBase = (1+encTot)>0 ? (R.mdoTotal-totalBenef)/(1+encTot) : 0;
  const totalEnc = totalBase*encTot;
  const encPctNome = nome => (CFG.encargos.find(e=>e.nome.includes(nome))||{pct:0}).pct;
  const encVal = nome => encTot>0 ? totalEnc*(encPctNome(nome)/encTot) : 0;
  const benVal = conta => { const b=CFG.beneficios.find(x=>x.conta===conta); return b? b.valor*efet*NM : 0; };
  const mdoMaq   = R.L.filter(r=>r.a.maq!=="Equipe manual").reduce((s,r)=>s+r.cMDO,0);
  const mdoManual= R.L.filter(r=>r.a.maq==="Equipe manual").reduce((s,r)=>s+r.cMDO,0);
  const tc = cod => (R.TC.itens.find(i=>i.cod===cod)||{total:0}).total;
  return {
    "200-15": R.mdoIndirT, "200-16": R.mdoManut, "200-17": mdoMaq, "200-18": mdoManual,
    "200-35": encVal("INSS"), "200-36": encVal("FGTS"),
    "200-51": benVal("200-51 / 200-52"), "200-53": benVal("200-53"),
    "200-54": benVal("200-54"), "200-55": benVal("200-55"),
    "200-72": benVal("200-72 / 200-73"), "200-77": benVal("200-79 / 200-77"),
    "200-93": R.crmComp.pecas, "200-94": R.crmComp.terc,
    "200-95": R.crmComp.consumo+R.MT.total, "200-98": R.crmComp.lubrif,
    "200-110": R.dieselT, "200-124": tc("T02")+tc("T03")+R.tercAtivT, "200-126": tc("T01"), "200-127": R.tpessT,
    "INS-05": R.irrT, "DEP-01": R.depT, "EST-01": R.admT, "ARR-01": R.arrT,
  };
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
  if(tipo==="diesel") return rastroDiesel(R, p);
  if(tipo==="insumos") return rastroInsumos(R);
  if(tipo==="forn") return rastroForn(R);
  if(tipo==="tpess") return rastroTPess(R);
  if(tipo==="contas") return rastroContas(R);
  if(tipo==="hect") return rastroHectares(R);
  return rastroTotal(R);
}

export { rastro };

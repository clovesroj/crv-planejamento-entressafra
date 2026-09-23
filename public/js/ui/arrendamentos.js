import { custoPorOperacao } from '../calculo/custo-operacao.js';
import { baseEtapa, custoUnit, rotuloBase } from '../calculo/base-fisica.js';
import { ARR_FORMAS, ARR_PAG, ETAPAS_ORD, PAG_LIVRE, arrPar, arrRat } from '../calculo/arrendamento.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { barras, serieDoPeriodo, kpi, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* Meses de pagamento na própria linha do contrato: uma caixa por mês da janela.
   Contrato paga em meses seguidos ou não, e é aqui que isso se configura —
   marcar ou desmarcar leva a periodicidade para "Meses específicos" e a série
   passa a ser a que está marcada. A grade Distribuição mensal marca os mesmos
   meses, com o valor de cada pagamento à vista. */
function celulaMeses(l, i){
  const caixas = MESES.map((m,j)=>{
    const on = l.pmes.includes(j);
    // sem a classe do mes de proposito: o filtro de periodo esconde `.m<i>`, e a
    // celula de configuracao precisa dos doze meses a mao, em qualquer filtro
    return `<label class="etq${on?" on":""}" title="${on?"Pagamento em ":"Marcar pagamento em "}${m}">
      <input type="checkbox" data-arrpm="${i}" data-m="${j}" ${on?"checked":""}>
      <span>${m.slice(0,3)}</span></label>`;}).join("");
  const nota = l.nParc
    ? `<div class="hint">${esc(l.agenda)}</div>`
    : `<div class="hint"><span class="badge b-warn">sem pagamento na janela</span></div>`;
  return `<div class="etqs">${caixas}</div>${nota}`;
}

/* ---------- ARRENDAMENTOS ---------- */
function pintarArrend(R){
  const A = R.AR;
  $("#k_arr").innerHTML =
    kpi("Área arrendada","",fmt(A.area)+" ha", A.linhas.length+" fazenda(s) cadastrada(s)","nat:arrend") +
    kpi("Custo anual","t",brl(A.anual), A.area>0?brl(A.anual/A.area,2)+"/ha/ano":"","nat:arrend") +
    kpi("Custo no orçamento","g",brl(A.total), NM+" meses · "+(arrPar("criterio")==="caixa"?"regime de caixa":"competência"),"nat:arrend") +
    kpi("Peso no custo total","a",R.total>0?fmt(A.total/R.total*100,1)+"%":"—","conta ARR-01","nat:arrend");
  ["atr","precoAtr","tchParc"].forEach(k=>{ $("#arp_"+k).value = +num(arrPar(k)).toFixed(4); });
  $("#arp_criterio").value = arrPar("criterio");

  const mesOpts = sel => `<option value="-1" ${sel===-1?"selected":""}>Fora do período</option>`+
    MESES.map((m,i)=>`<option value="${i}" ${sel===i?"selected":""}>${m}</option>`).join("");
  $("#t_arr").innerHTML = th([["Fazenda"],["Grupo"],["Área (ha)",1],["Forma de pagamento"],
    ["Qtd por ha em cada pagamento",1],["Un."],["Periodicidade"],["1º pagamento"],
    ["Meses de pagamento"],["Parcela",1],["R$/ha/ano",1],["Custo anual",1],["No orçamento",1],[""]])+"<tbody>"+
    (A.linhas.length ? A.linhas.map((l,i)=>`<tr>
      <td><input data-arr="${i}" data-f="faz" value="${esc(l.faz)}" style="text-align:left;min-width:170px"></td>
      <td><input data-arr="${i}" data-f="grupo" value="${esc(l.grupo)}" style="text-align:left;min-width:110px"></td>
      <td class="num"><input data-arr="${i}" data-f="area" value="${num(l.area)}" inputmode="decimal"></td>
      <td><select data-arr="${i}" data-f="forma">${Object.entries(ARR_FORMAS).map(([k,f])=>
        `<option value="${k}" ${k===l.forma?"selected":""}>${f.nome}</option>`).join("")}</select></td>
      <td class="num"><input data-arr="${i}" data-f="qtd" value="${num(l.qtd)}" inputmode="decimal"></td>
      <td class="calc">${(ARR_FORMAS[l.forma]||{un:""}).un}</td>
      <td><select data-arr="${i}" data-f="pag">${ARR_PAG.map(p=>`<option ${p===l.pag?"selected":""}>${p}</option>`).join("")}</select></td>
      <td><select data-arr="${i}" data-f="mes" ${l.pag==="Mensal"||l.pag===PAG_LIVRE?"disabled":""}>${mesOpts(l.mes0)}</select></td>
      <td style="min-width:232px">${celulaMeses(l, i)}</td>
      <td class="num ${l.nParc?"tot":"calc"}">${l.nParc ? l.nParc+"× "+brl(l.parcela) : "—"}
        <span class="hint">${l.pagsAno} pagamento(s) por ano</span></td>
      <td class="num calc">${brl(l.rsHaAno,2)}</td><td class="num">${brl(l.anual)}</td>
      <td class="num tot">${brl(l.periodo)}</td>
      <td><button class="btn d" data-arrm="${i}">Remover</button></td></tr>`).join("")
    : `<tr><td colspan="14" class="calc">Nenhuma fazenda cadastrada.</td></tr>`)+
    `<tr><td class="tot" colspan="2">TOTAL</td><td class="num tot">${fmt(A.area)}</td><td colspan="7"></td>
     <td class="num tot">${A.area>0?brl(A.anual/A.area,2):"—"}</td><td class="num tot">${brl(A.anual)}</td>
     <td class="num tot">${brl(A.total)}</td><td></td></tr></tbody>`;

  const G = {};
  A.linhas.forEach(l=>{ const k=String(l.grupo||"").trim()||"Sem grupo";
    const g=G[k]=G[k]||{n:0,area:0,anual:0,periodo:0}; g.n++; g.area+=l.area; g.anual+=l.anual; g.periodo+=l.periodo; });
  $("#t_arr_grupo").innerHTML = th([["Grupo"],["Fazendas",1],["Área (ha)",1],["% da área",1],["R$/ha/ano",1],
    ["Custo anual",1],["No orçamento",1]])+"<tbody>"+
    Object.entries(G).sort((a,b)=>b[1].periodo-a[1].periodo).map(([k,g])=>`<tr><td>${esc(k)}</td>
      <td class="num calc">${g.n}</td><td class="num">${fmt(g.area)}</td>
      <td class="num calc">${A.area>0?fmt(g.area/A.area*100,1)+"%":"—"}</td>
      <td class="num calc">${g.area>0?brl(g.anual/g.area,2):"—"}</td><td class="num">${brl(g.anual)}</td>
      <td class="num tot">${brl(g.periodo)}</td></tr>`).join("")+"</tbody>";

  const ratSoma = ETAPAS_ORD.reduce((s,e)=>s+arrRat(e),0);
  $("#t_arr_rat").innerHTML = th([["Etapa"],["% referência",1],["% aplicado",1],["Arrendamento",1],
    ["Base física",1],["R$ por unidade",1]])+"<tbody>"+
    ETAPAS_ORD.map(e=>{
      const d=R.etapas[e]||{}, v=d.arrend||0, b=baseEtapa(R, e);
      let h=`<tr><td>${e}</td>
        <td class="num"><input data-arrat="${e}" value="${+arrRat(e).toFixed(4)}" inputmode="decimal"></td>
        <td class="num calc">${ratSoma>0?fmt(arrRat(e)/ratSoma*100,1)+"%":"—"}</td>
        <td class="num tot">${brl(v)}</td><td class="num calc">${b.q>0?rotuloBase(b):"—"}</td>
        <td class="num calc">${v>0?custoUnit(v, b):"—"}</td></tr>`;
      // cana planta e soca: o arrendamento de cada cultura sobre a área dela (Premissas)
      if(e==="TRATOS CULTURAIS") [["soca","Soca"],["planta","Planta"]].forEach(([id,c])=>{
        const x = custoPorOperacao(R).principais.find(l=>l.id===id); if(!x) return;
        h+=`<tr class="sub"><td class="calc">↳ Cana ${c.toLowerCase()}</td><td></td><td></td>
          <td class="num calc">${brl(x.rateio.arrend)}</td><td class="num calc">${rotuloBase(x.base)}</td>
          <td class="num calc">${x.rateio.arrend>0?custoUnit(x.rateio.arrend, x.base):"—"}</td></tr>`; });
      return h; }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(ratSoma,1)}%${Math.abs(ratSoma-100)>0.01?' <span class="badge b-bad">≠ 100%</span>':""}</td>
     <td class="num tot">${ratSoma>0?"100,0%":"—"}</td>
     <td class="num tot">${brl(ETAPAS_ORD.reduce((s,e)=>s+((R.etapas[e]||{}).arrend||0),0))}</td><td colspan="2"></td></tr></tbody>`;

  const SEL = R.SEL;
  // cada célula é um mês de pagamento do contrato: clicar marca ou desmarca, e o
  // contrato passa a valer pelos meses marcados, seguidos ou não
  $("#t_arr_mes").innerHTML = th([["Fazenda"],...thMeses(),["Parcelas",1],
    [SEL.parcial?"Total do período":"Total",1]])+"<tbody>"+
    (A.linhas.length ? A.linhas.map((l,i)=>`<tr><td>${esc(l.faz)}</td>`+
      l.mes.map((v,j)=>{ const on = l.pmes.includes(j);
        return `<td class="num pmes${on?" on":""} ${clsMes(j)}"><label title="${
          on?"Pagamento em ":"Marcar pagamento em "}${MESES[j]}">
          <input type="checkbox" data-arrpm="${i}" data-m="${j}" ${on?"checked":""}>
          <span>${v>0?brl(v):"—"}</span></label></td>`; }).join("")+
      `<td class="num calc">${l.nParc||"—"}</td>
       <td class="num">${brl(somaSel(l.mes, SEL))}</td></tr>`).join("")
    : `<tr><td colspan="${NM+3}" class="calc">Nenhuma fazenda cadastrada.</td></tr>`)+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(A.mes, v=>brl(v), "num tot")+
    `<td class="num tot">${A.linhas.reduce((s,l)=>s+l.nParc,0)}</td>
     <td class="num tot">${brl(somaSel(A.mes, SEL))}</td></tr></tbody>`;
  barras($("#ch_arr"), serieDoPeriodo(A.mes, SEL), "#2A57A0");
}


export { pintarArrend };

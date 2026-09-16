import { NM, NM_PER, PERIODO_MESES } from '../nucleo/calendario.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- TRANSPORTE DE PESSOAL ---------- */
function pintarTPess(R){
  const T = R.TP;
  const cobertura = R.efetivoTotal>0 ? T.lugares/R.efetivoTotal*100 : 0;
  $("#k_tp").innerHTML =
    kpi("Custo total","",brl(T.total),"","tpess:total") +
    kpi("Veículos / lugares","t",fmt(T.veic)+" / "+fmt(T.lugares), "no mês de pico","tpess:total") +
    kpi("Safra","g",brl(T.porPeriodo.safra), NM_PER.safra+" meses · "+PERIODO_MESES.safra,"tpess:total") +
    kpi("Entressafra","a",brl(T.porPeriodo.entressafra),
        NM_PER.entressafra+" meses · "+PERIODO_MESES.entressafra,"tpess:total");

  // Cada rota ocupa três linhas: a identificação e o preço de contrato ficam na
  // linha-mãe, e a operação — quantos veículos, quantos km, quantos dias —
  // aparece uma vez por período, porque é isso que muda entre safra e parada.
  $("#t_tp").innerHTML = th([["Rota / período"],["Veículo"],["Lugares",1],["Qtd",1],["Km/dia",1],
    ["Dias/mês",1],["R$/km",1],["Diária ônibus",1],["Km extra/mês",1],["R$/km extra",1],
    ["Custo km",1],["Custo diárias",1],["Custo km extra",1],["Total",1],[""]])+"<tbody>"+
    T.linhas.map((l,i)=>
      `<tr>
        <td><input data-tp="${i}" data-f="rota" value="${l.rota}" style="text-align:left;min-width:210px"></td>
        <td><input data-tp="${i}" data-f="veic" value="${l.veic}" style="text-align:left;min-width:180px"></td>
        <td class="num"><input data-tp="${i}" data-f="cap" value="${l.cap}" inputmode="decimal"></td>
        <td colspan="3"></td>
        <td class="num"><input data-tp="${i}" data-f="rsKm" value="${l.rsKm}" inputmode="decimal"></td>
        <td class="num"><input data-tp="${i}" data-f="diaria" value="${l.diaria}" inputmode="decimal"></td>
        <td></td>
        <td class="num"><input data-tp="${i}" data-f="rsKmExtra" value="${l.rsKmExtra}" inputmode="decimal"></td>
        <td class="num calc">${brl(l.cKm)}</td><td class="num calc">${brl(l.cDiaria)}</td>
        <td class="num calc">${brl(l.cExtra)}</td><td class="num tot">${brl(l.total)}</td>
        <td><button class="btn d" data-tprm="${i}">Remover</button></td></tr>`
      + linhaPeriodo(l, i, "safra")
      + linhaPeriodo(l, i, "entressafra")
    ).join("")+
    `<tr><td class="tot">TOTAL</td><td></td><td class="num tot">${fmt(T.lugares)}</td>
     <td class="num tot">${fmt(T.veic)}</td><td colspan="6"></td>
     <td class="num tot">${brl(T.cKm)}</td><td class="num tot">${brl(T.cDiaria)}</td>
     <td class="num tot">${brl(T.cExtra)}</td><td class="num tot">${brl(T.total)}</td><td></td></tr></tbody>`;

  $("#t_tp_comp").innerHTML = th([["Componente"],["Safra",1],["Entressafra",1],["Total",1],
    ["% do transporte",1],["R$/colaborador/mês",1],["Peso"]])+"<tbody>"+
    [["Quilometragem das rotas","cKm"],["Diárias de ônibus","cDiaria"],["Quilometragem extra","cExtra"]]
      .map(([n,k])=>{
        const sf = T.linhas.reduce((s,l)=>s+l.bSafra[k],0);
        const en = T.linhas.reduce((s,l)=>s+l.bEnt[k],0);
        const v = sf+en, pp = T.total ? v/T.total*100 : 0;
        return `<tr><td>${n}</td><td class="num calc">${brl(sf)}</td><td class="num calc">${brl(en)}</td>
          <td class="num">${brl(v)}</td><td class="num calc">${fmt(pp,1)}%</td>
          <td class="num calc">${R.efetivoTotal>0?brl(v/R.efetivoTotal/NM,2):"—"}</td>
          <td><div class="bar"><i style="width:${Math.min(pp,100)}%"></i></div></td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL</td>
     <td class="num tot">${brl(T.porPeriodo.safra)}</td>
     <td class="num tot">${brl(T.porPeriodo.entressafra)}</td>
     <td class="num tot">${brl(T.total)}</td><td class="num tot">100,0%</td>
     <td class="num tot">${R.efetivoTotal>0?brl(T.total/R.efetivoTotal/NM,2):"—"}</td><td></td></tr></tbody>`;
}

/** Linha de operação de uma rota num período. */
function linhaPeriodo(l, i, per){
  const safra = per === "safra";
  const b = safra ? l.bSafra : l.bEnt;
  // Na safra o campo é o da rota. Na entressafra é o override: em branco herda a
  // safra, e o placeholder mostra o valor herdado para não parecer zero.
  const campo = f => safra
    ? `<input data-tp="${i}" data-f="${f}" value="${l[f]}" inputmode="decimal">`
    : `<input data-tpe="${i}" data-f="${f}" value="${((l.ent||{})[f] ?? "")}" placeholder="${fmt(l[f])}" inputmode="decimal">`;
  return `<tr class="sub">
    <td class="calc" style="padding-left:22px">↳ ${safra ? "Safra" : "Entressafra"}
      <span class="per per-${per}">${b.meses} meses</span></td>
    <td></td><td class="num calc">${fmt(b.lugares)}</td>
    <td class="num">${campo("qtd")}</td>
    <td class="num">${campo("kmDia")}</td>
    <td class="num">${campo("diasMes")}</td>
    <td></td><td></td>
    <td class="num">${campo("kmExtra")}</td>
    <td></td>
    <td class="num calc">${brl(b.cKm)}</td><td class="num calc">${brl(b.cDiaria)}</td>
    <td class="num calc">${brl(b.cExtra)}</td><td class="num calc">${brl(b.total)}</td>
    <td></td></tr>`;
}

export { pintarTPess };

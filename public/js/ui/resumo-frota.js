import { $, fmt, num, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- RESUMO DE FROTA ---------- */
function pintarResumoFrota(R){
  const oper = [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=> a.cat===b.cat ? b.qtd-a.qtd : a.cat.localeCompare(b.cat));
  const apoioFixo = R.AP.linhas.filter(l=>l.nec>0);
  const tpess = R.TP.linhas.filter(l=>num(l.qtd)>0);
  const irrig = R.IR.linhas.filter(l=>l.area>0);

  const totOper = oper.reduce((s,l)=>s+l.qtd,0);
  const totApoio = Math.ceil(R.AP.total);
  const totIrrig = irrig.reduce((s,l)=>s+l.nConj,0);

  $("#k_resfrota").innerHTML =
    kpi("Frota operacional + apoio","",fmt(totOper)+" un","máquinas e implementos") +
    kpi("Apoio de utilização fixa","t",fmt(totApoio)+" un") +
    kpi("Transporte de pessoal","g",fmt(R.TP.veic)+" un",fmt(R.TP.lugares)+" lugares") +
    kpi("Conjuntos de irrigação","a",fmt(totIrrig)+" un");

  $("#t_rf_oper").innerHTML = th([["Categoria"],["Item"],["Horas do plano",1],["Qtd necessária",1],["Situação"]])+"<tbody>"+
    oper.map(l=>`<tr><td class="calc">${l.cat}</td><td>${l.item}</td>
      <td class="num calc">${fmt(l.hTotPlano)}</td><td class="num tot">${fmt(l.qtd)}</td>
      <td>${l.extra>0?`<span class="badge b-warn">+${fmt(l.extra)} frota adicional</span>`:'<span class="calc">—</span>'}</td></tr>`).join("")+
    "</tbody>";

  $("#t_rf_apoio").innerHTML = th([["Veículo / Máquina"],["Utilização",1],["Disponib.",1],["Necessidade",1],["Atividade"]])+"<tbody>"+
    apoioFixo.map(a=>`<tr><td>${a.nome}</td><td class="num calc">${pct(a.util)}</td>
      <td class="num calc">${pct(a.disp)}</td><td class="num tot">${a.nec.toFixed(2)}</td>
      <td class="calc">${a.ativ}</td></tr>`).join("")+
    "</tbody>";

  $("#t_rf_tpess").innerHTML = th([["Rota"],["Veículo"],["Qtd",1],["Lugares",1]])+"<tbody>"+
    tpess.map(t=>`<tr><td>${t.rota}</td><td class="calc">${t.veic}</td>
      <td class="num tot">${fmt(t.qtd)}</td><td class="num calc">${fmt(t.lugares)}</td></tr>`).join("")+
    "</tbody>";

  $("#t_rf_irrig").innerHTML = th([["Modalidade"],["Área",1],["Potência (CV)",1],["Conjuntos necessários",1]])+"<tbody>"+
    irrig.map(l=>`<tr><td>${l.nome}</td><td class="num calc">${fmt(l.area)} ha</td>
      <td class="num calc">${fmt(l.potCV,1)}</td><td class="num tot">${l.nConj}</td></tr>`).join("")+
    "</tbody>";
}


export { pintarResumoFrota };

import { CFG } from '../dados/cfg.js';
import { FROTA_ESP, contaOrigem, rotuloItem } from '../calculo/crm.js';
import { FROTA_ORIG } from '../nucleo/estado.js';
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
    kpi("Conjuntos de irrigação","a",fmt(totIrrig)+" un") +
    kpi("Frota cadastrada (base)","t",
        fmt((CFG.frota_base||[]).reduce((s,e)=>s+contaOrigem(e.prop,e.terc),0))+" un",
        FROTA_ORIG==="todos" ? "próprias e de terceiros"
        : FROTA_ORIG==="proprio" ? "somente próprias" : "somente de terceiros");

  $("#t_rf_oper").innerHTML = th([["Agrupamento"],["Especialidade"],["Item"],["Horas do plano",1],
      ["Qtd necessária",1],["Cadastrada",1],["Situação"]])+"<tbody>"+
    oper.map(l=>{ const e = l.esp && FROTA_ESP[l.esp];
      const un = contaOrigem(l.baseProp, l.baseTerc);
      return `<tr><td class="calc">${e?e.ag:"—"}</td><td class="calc">${l.esp||"—"}</td>
      <td>${rotuloItem(l.item)}</td>
      <td class="num calc">${fmt(l.hTotPlano)}</td><td class="num tot">${fmt(l.qtd)}</td>
      <td class="num calc">${un||"—"}</td>
      <td>${l.extra>0?`<span class="badge b-warn">+${fmt(l.extra)} frota adicional</span>`:'<span class="calc">—</span>'}</td></tr>`;}).join("")+
    "</tbody>";

  // O plano dimensiona arquétipos, a base registra o que existe. Somar os dois
  // na especialidade é o que torna a comparação possível.
  const nec = {};
  R.crmFrotaL.forEach(l=>{ if(l.esp && l.qtd>0) nec[l.esp] = (nec[l.esp]||0) + l.qtd; });
  const espsBase = (CFG.frota_base||[]).filter(e=> contaOrigem(e.prop,e.terc)>0 || nec[e.esp]>0)
    .sort((a,b)=> a.ag.localeCompare(b.ag) || a.grp.localeCompare(b.grp) || a.esp.localeCompare(b.esp));
  let agAtual = "";
  $("#t_rf_base").innerHTML = th([["Agrupamento / especialidade"],["Modelos",1],["Próprios",1],["Terceiros",1],
      ["Cadastrada",1],["Exigida pelo plano",1],["Folga",1]])+"<tbody>"+
    espsBase.map(e=>{
      const cab = e.ag!==agAtual ? (agAtual=e.ag, `<tr style="background:var(--bg)"><td class="tot" colspan="7">${e.ag}</td></tr>`) : "";
      const cad = contaOrigem(e.prop, e.terc), n = nec[e.esp]||0, folga = cad-n;
      return cab+`<tr><td style="padding-left:20px">${e.esp} <span class="badge">${e.grp}</span></td>
        <td class="num calc">${e.mods.length}</td>
        <td class="num calc">${e.prop||"—"}</td><td class="num calc">${e.terc||"—"}</td>
        <td class="num tot">${cad||"—"}</td><td class="num tot">${n?fmt(n):"—"}</td>
        <td class="num ${folga<0?"tot":"calc"}" style="${folga<0?"color:var(--red)":""}">${n?fmt(folga):"—"}</td></tr>`;
    }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.mods.length,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.prop,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.terc,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+contaOrigem(e.prop,e.terc),0))}</td>
     <td class="num tot">${fmt(Object.values(nec).reduce((a,b)=>a+b,0))}</td><td></td></tr></tbody>`;

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

import { CFG } from '../dados/cfg.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { optFuncao } from './plano.js';

/* ---------- APOIO ---------- */
function pintarApoio(R){
  const A=R.AE;
  $("#k_apoio").innerHTML =
    kpi("Equipamentos","",fmt(A.equip)+" un","","frota:apoio") +
    kpi("Horas no período","t",fmt(A.horas),"","frota:apoio") +
    kpi("Efetivo","g",fmt(A.efetivo)+" pessoas","","pessoas:total") +
    kpi("Custo total","a",brl(A.total),"","frota:apoio");

  $("#sel_ap_maq").innerHTML = Object.keys(CFG.maquinas).sort()
    .map(m=>`<option value="${m}">${m}</option>`).join("");

  $("#t_apoio_eq").innerHTML = th([["Equipamento"],["Máquina base"],["Qtd",1],["Horas/mês",1],
    ["Função"],["Horas totais",1],["Diesel",1],["Manutenção",1],["MDO",1],["Total",1],[""]])+"<tbody>"+
    A.linhas.map((l,i)=>`<tr>
      <td><input data-ap="${i}" data-f="nome" value="${esc(l.nome)}" style="text-align:left;min-width:170px"></td>
      <td><select data-ap="${i}" data-f="maq" style="min-width:170px">${
        Object.keys(CFG.maquinas).sort().map(m=>`<option ${m===l.maq?"selected":""}>${m}</option>`).join("")}</select></td>
      <td class="num"><input data-ap="${i}" data-f="qtd" value="${l.qtd}" inputmode="decimal"></td>
      <td class="num"><input data-ap="${i}" data-f="hmes" value="${l.hmes}" inputmode="decimal"></td>
      <td><select data-ap="${i}" data-f="fcod">${optFuncao(l.fcod)}</select></td>
      <td class="num calc">${fmt(l.horas)}</td><td class="num calc">${brl(l.diesel)}</td>
      <td class="num calc">${brl(l.manut)}</td><td class="num calc">${brl(l.mdo)}</td>
      <td class="num tot">${brl(l.total)}</td>
      <td><button class="btn d" data-aprm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td></td><td class="num tot">${fmt(A.equip)}</td><td></td><td colspan="2"></td>
     <td class="num tot">${fmt(A.horas)}</td><td class="num tot">${brl(A.diesel)}</td>
     <td class="num tot">${brl(A.manut)}</td><td class="num tot">${brl(A.mdo)}</td>
     <td class="num tot">${brl(A.total)}</td><td></td></tr></tbody>`;
}


export { pintarApoio };

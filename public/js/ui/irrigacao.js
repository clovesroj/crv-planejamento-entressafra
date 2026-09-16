import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { th } from './componentes.js';

/* ---------- IRRIGAÇÃO ---------- */
function pintarIrrig(R){
  $("#t_irrig").innerHTML = th([["Modalidade"],["Método"],["Ea",1],["Lâmina bruta",1],["Área projetada (ha)",1],
    ["Volume (m³)",1],["Vazão (m³/h)",1],["AMT",1],["Pot. (CV)",1],["Conj.",1],["Energia",1],["Total",1]])+"<tbody>"+
    R.IR.linhas.map(l=>`<tr><td>${l.nome}</td><td class="calc">${l.metodo}</td>
      <td class="num calc">${pct(l.Ea)}</td><td class="num calc">${fmt(l.lamBruta,1)}</td>
      <td class="num">${l.cod?`<input data-c="${l.cod}" data-m="0" value="${l.area||""}" inputmode="decimal">`
        :`<span class="calc">${fmt(l.area)}</span>`}</td>
      <td class="num calc">${fmt(l.volume)}</td>
      <td class="num calc">${fmt(l.vazao,1)}</td><td class="num calc">${fmt(l.amt,1)}</td>
      <td class="num calc">${fmt(l.potCV,1)}</td><td class="num tot">${l.area>0?l.nConj:"—"}</td>
      <td class="num calc">${brl(l.energia)}</td><td class="num tot">${brl(l.total)}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="10">TOTAL</td><td class="num tot">${brl(R.IR.energia)}</td>
     <td class="num tot">${brl(R.IR.total)}</td></tr></tbody>`;
}


export { pintarIrrig };

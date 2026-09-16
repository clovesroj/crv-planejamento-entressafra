import { $, brl, fmt } from '../nucleo/formato.js';
import { th } from './componentes.js';

/* ---------- TRANSPORTE ---------- */
function pintarTransp(R){
  $("#t_transp").innerHTML = th([["Modalidade"],["Toneladas",1],["Capac./viagem",1],["Ciclo (h)",1],
    ["Cap./dia",1],["t/dia pico",1],["Viagens",1],["Frota",1],["Horas",1],["Custo",1]])+"<tbody>"+
    R.TR.blocos.map(b=>`<tr><td>${b.nome||"—"}</td>
      <td class="num calc">${fmt(b.ton)}</td><td class="num calc">${fmt(b.cap||0)} t</td>
      <td class="num calc">${b.ciclo.toFixed(2)}</td><td class="num calc">${fmt(b.capDia,1)}</td>
      <td class="num calc">${fmt(b.tonDia,1)}</td><td class="num calc">${fmt(b.viagens)}</td>
      <td class="num tot">${b.frotaR}</td><td class="num calc">${fmt(b.horas)}</td>
      <td class="num tot">${brl(b.total)}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td colspan="6"></td><td class="num tot">${R.TR.frota}</td>
     <td class="num tot">${fmt(R.TR.horas)}</td><td class="num tot">${brl(R.TR.total)}</td></tr></tbody>`;
}


export { pintarTransp };

import { $, brl, esc, fmt } from '../nucleo/formato.js';
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

  /* Consumo por composição, em km/L, editável. O campo vem com o km/L em uso
     (o informado ou o equivalente da máquina); apagar volta ao da máquina. */
  const dieselT = R.dieselT || 0, T = R.TR;
  $("#t_transp_cons").innerHTML = th([["Composição"],["Km rodados",1],["Consumo (km/L)",1],["Litros",1],
      ["L/t",1],["Diesel",1],["% do diesel total",1]])+"<tbody>"+
    T.blocos.filter(b=>b.cod).map(b=>`<tr><td>${esc(b.nome||b.cod)}<div class="calc" style="font-size:10px">${esc(b.maq||"")}${b.imp?" + "+esc(b.imp):""}</div></td>
      <td class="num calc">${fmt(b.km)}</td>
      <td class="num"><input data-kmltr="${esc(b.cod)}" value="${b.kmL>0 ? +b.kmL.toFixed(2) : (b.kmLInf||"")}" placeholder="km/L"
          inputmode="decimal" style="width:70px" title="Consumo da composição em km/L — digite para mudar; apagar volta ao da máquina">
        <div class="calc" style="font-size:10px">${b.kmLInf>0 ? "informado" : "da máquina"}</div></td>
      <td class="num tot">${fmt(b.litros)}</td><td class="num calc">${b.ton>0 ? fmt(b.lPorT,2) : "—"}</td>
      <td class="num">${brl(b.diesel)}</td><td class="num calc">${dieselT>0 ? fmt(b.diesel/dieselT*100,1)+"%" : "—"}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL DO TRANSPORTE</td><td class="num tot">${fmt(T.km)}</td>
      <td class="num calc">${T.litros>0 ? fmt(T.km/T.litros,2)+" média" : "—"}</td><td class="num tot">${fmt(T.litros)}</td><td></td>
      <td class="num tot">${brl(T.diesel)}</td><td class="num tot">${dieselT>0 ? fmt(T.diesel/dieselT*100,1)+"%" : "—"}</td></tr></tbody>`;
}


export { pintarTransp };

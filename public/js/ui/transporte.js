import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { CAMPOS_TRB, parTransp } from '../calculo/transporte.js';

/* Parâmetros do transbordo: o campo mostra o número em uso -- o do transbordo
   ou, sem ele, o do caminhão ("igual ao caminhão"). Só o campo digitado é
   gravado (P.trb); apagar volta a seguir o caminhão. */
const ROT_TRB = {velC:["Velocidade carregado (km/h)",1], velV:["Velocidade vazio (km/h)",1],
  tCarga:["Tempo de carga (min)",1], tDesc:["Tempo de descarga (min)",1], hDia:["Horas de operação/dia",1],
  disp:["Disponibilidade (%)",1], raioSafra:["Distância média safra (km)",0.1], raioMuda:["Distância média muda (km)",0.1]};
function pintarParTrb(){
  const el = $("#trb_par"); if(!el) return;
  const p = parTransp({modo:"transbordo"});
  el.innerHTML = CAMPOS_TRB.map(k=>`<div><label>${ROT_TRB[k][0]}</label>
    <input type="number" data-trb="${k}" step="${ROT_TRB[k][1]}" value="${+num0(p[k]).toFixed(2)}">
    <div class="hint">${p.herdado(k) ? "igual ao caminhão" : "do transbordo"}</div></div>`).join("");
}
const num0 = v => isFinite(+v) ? +v : 0;

/* ---------- TRANSPORTE ---------- */
function pintarTransp(R){
  pintarParTrb();
  $("#t_transp").innerHTML = th([["Modalidade"],["Toneladas",1],["Capac./viagem",1],["Distância (km)",1],["Ciclo (h)",1],
    ["Cap./dia",1],["t/dia pico",1],["Viagens",1],["Frota",1],["Horas",1],["Custo",1]])+"<tbody>"+
    R.TR.blocos.map(b=>`<tr><td>${b.nome||"—"}${b.tipo ? `<div class="calc" style="font-size:10px">${b.tipo==="transbordo"?"transbordo (trator)":"caminhão canavieiro"}</div>` : ""}</td>
      <td class="num calc">${fmt(b.ton)}</td><td class="num calc">${fmt(b.cap||0)} t</td>
      <td class="num calc">${fmt(b.raio||0,1)}</td>
      <td class="num calc">${b.ciclo.toFixed(2)}</td><td class="num calc">${fmt(b.capDia,1)}</td>
      <td class="num calc">${fmt(b.tonDia,1)}</td><td class="num calc">${fmt(b.viagens)}</td>
      <td class="num tot">${b.frotaR}</td><td class="num calc">${fmt(b.horas)}</td>
      <td class="num tot">${brl(b.total)}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td colspan="7"></td><td class="num tot">${R.TR.frota}</td>
     <td class="num tot">${fmt(R.TR.horas)}</td><td class="num tot">${brl(R.TR.total)}</td></tr></tbody>`;

  /* Consumo por composição, editável: caminhão canavieiro em km/L, transbordo
     (trator) em L/h. O campo vem com o valor em uso (o informado ou o da
     máquina); apagar volta ao da máquina. */
  const dieselT = R.dieselT || 0, T = R.TR;
  const celCons = b => b.unCons==="h"
    ? `<input data-lhtrb="${esc(b.cod)}" value="${b.lh>0 ? +b.lh.toFixed(2) : (b.lhInf||"")}" placeholder="L/h"
          inputmode="decimal" style="width:70px" title="Consumo do trator com o transbordo em L/h — digite para mudar; apagar volta ao da máquina"> L/h
        <div class="calc" style="font-size:10px">${b.lhInf>0 ? "informado" : "da máquina"}</div>`
    : `<input data-kmltr="${esc(b.cod)}" value="${b.kmL>0 ? +b.kmL.toFixed(2) : (b.kmLInf||"")}" placeholder="km/L"
          inputmode="decimal" style="width:70px" title="Consumo do caminhão em km/L — digite para mudar; apagar volta ao da máquina"> km/L
        <div class="calc" style="font-size:10px">${b.kmLInf>0 ? "informado" : "da máquina"}</div>`;
  $("#t_transp_cons").innerHTML = th([["Composição"],["Km rodados",1],["Horas",1],["Consumo",1],["Litros",1],
      ["L/t",1],["Diesel",1],["% do diesel total",1]])+"<tbody>"+
    T.blocos.filter(b=>b.cod).map(b=>`<tr><td>${esc(b.nome||b.cod)}<div class="calc" style="font-size:10px">${esc(b.maq||"")}${b.imp?" + "+esc(b.imp):""}</div></td>
      <td class="num calc">${fmt(b.km)}</td><td class="num calc">${fmt(b.horas)}</td>
      <td class="num">${celCons(b)}</td>
      <td class="num tot">${fmt(b.litros)}</td><td class="num calc">${b.ton>0 ? fmt(b.lPorT,2) : "—"}</td>
      <td class="num">${brl(b.diesel)}</td><td class="num calc">${dieselT>0 ? fmt(b.diesel/dieselT*100,1)+"%" : "—"}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL DO TRANSPORTE</td><td class="num tot">${fmt(T.km)}</td><td class="num tot">${fmt(T.horas)}</td>
      <td></td><td class="num tot">${fmt(T.litros)}</td><td></td>
      <td class="num tot">${brl(T.diesel)}</td><td class="num tot">${dieselT>0 ? fmt(T.diesel/dieselT*100,1)+"%" : "—"}</td></tr></tbody>`;
}


export { pintarTransp };

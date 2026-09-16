import { NM } from '../nucleo/calendario.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- TRANSPORTE DE PESSOAL ---------- */
function pintarTPess(R){
  const T=R.TP;
  const cobertura = R.efetivoTotal>0 ? T.lugares/R.efetivoTotal*100 : 0;
  $("#k_tp").innerHTML =
    kpi("Custo total","",brl(T.total)) +
    kpi("Veículos / lugares","t",fmt(T.veic)+" / "+fmt(T.lugares)) +
    kpi("Quilometragem no período","g",fmt(T.km)+" km") +
    kpi("Cobertura do efetivo", cobertura>=100?"g":"a", fmt(cobertura,0)+"%",
        fmt(R.efetivoTotal)+" colaboradores");

  $("#t_tp").innerHTML = th([["Rota"],["Veículo"],["Lugares",1],["Qtd",1],["Km/dia",1],["Dias/mês",1],
    ["R$/km",1],["Diária ônibus",1],["Km extra/mês",1],["R$/km extra",1],
    ["Custo km",1],["Custo diárias",1],["Custo km extra",1],["Total",1],[""]])+"<tbody>"+
    T.linhas.map((l,i)=>`<tr>
      <td><input data-tp="${i}" data-f="rota" value="${l.rota}" style="text-align:left;min-width:210px"></td>
      <td><input data-tp="${i}" data-f="veic" value="${l.veic}" style="text-align:left;min-width:180px"></td>
      <td class="num"><input data-tp="${i}" data-f="cap" value="${l.cap}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="qtd" value="${l.qtd}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="kmDia" value="${l.kmDia}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="diasMes" value="${l.diasMes}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="rsKm" value="${l.rsKm}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="diaria" value="${l.diaria}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="kmExtra" value="${l.kmExtra}" inputmode="decimal"></td>
      <td class="num"><input data-tp="${i}" data-f="rsKmExtra" value="${l.rsKmExtra}" inputmode="decimal"></td>
      <td class="num calc">${brl(l.cKm)}</td><td class="num calc">${brl(l.cDiaria)}</td>
      <td class="num calc">${brl(l.cExtra)}</td><td class="num tot">${brl(l.total)}</td>
      <td><button class="btn d" data-tprm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td></td><td class="num tot">${fmt(T.lugares)}</td>
     <td class="num tot">${fmt(T.veic)}</td><td colspan="6"></td>
     <td class="num tot">${brl(T.cKm)}</td><td class="num tot">${brl(T.cDiaria)}</td>
     <td class="num tot">${brl(T.cExtra)}</td><td class="num tot">${brl(T.total)}</td><td></td></tr></tbody>`;

  $("#t_tp_comp").innerHTML = th([["Componente"],["Valor",1],["% do transporte",1],["R$/colaborador/mês",1],["Peso"]])+"<tbody>"+
    [["Quilometragem das rotas",T.cKm],["Diárias de ônibus",T.cDiaria],["Quilometragem extra",T.cExtra]]
      .map(([n,v])=>{const pp=T.total?v/T.total*100:0;
        return `<tr><td>${n}</td><td class="num">${brl(v)}</td><td class="num calc">${fmt(pp,1)}%</td>
          <td class="num calc">${R.efetivoTotal>0?brl(v/R.efetivoTotal/NM,2):"—"}</td>
          <td><div class="bar"><i style="width:${Math.min(pp,100)}%"></i></div></td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(T.total)}</td><td class="num tot">100,0%</td>
     <td class="num tot">${R.efetivoTotal>0?brl(T.total/R.efetivoTotal/NM,2):"—"}</td><td></td></tr></tbody>`;
}


export { pintarTPess };

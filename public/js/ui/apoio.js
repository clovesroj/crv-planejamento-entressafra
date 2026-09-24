import { PERIODOS_APOIO } from '../calculo/apoio.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { celulaBusca, kpi, ligarBuscaSelect, registrarCombo, th } from './componentes.js';
import { funcaoItens, funcaoRotulo, funcaoValor } from './plano.js';

/* ---------- APOIO ---------- */
// "Máquina base" do novo equipamento e transitorio (escolhe, clica Adicionar,
// limpa) -- mesmo padrao do "Adicionar produto" de Insumos.
const buscaMaq = ligarBuscaSelect("#busca_ap_maq", "#lista_ap_maq", "#sel_ap_maq",
  () => Object.keys(CFG.maquinas).sort(), m => m);
registrarCombo("maquina", () => Object.keys(CFG.maquinas).sort(), m => m);
registrarCombo("funcao", funcaoItens, funcaoRotulo, funcaoValor);

/* Período de trabalho de cada equipamento: ano todo, safra, entressafra ou
   meses escolhidos (calculo/apoio.js, mesesDoApoio). Os botões acima da
   tabela aplicam um período a todos de uma vez; o seletor da linha, a um só.
   Em "meses escolhidos" aparecem os doze meses para marcar. */
function celPeriodo(l, i){
  const sel = `<select data-apper="${i}" style="min-width:150px">${Object.entries(PERIODOS_APOIO).map(([k,v])=>
    `<option value="${k}"${k===l.per?" selected":""}>${v}</option>`).join("")}</select>`;
  const meses = l.per==="meses"
    ? `<div class="ap-meses">${MESES.map((m,j)=>`<label class="${clsMes(j)}" title="${m}"><input type="checkbox" data-apm="${i}" data-m="${j}"${l.on[j]?" checked":""}>${m.slice(0,3)}</label>`).join("")}</div>`
    : "";
  return sel + meses + `<div class="calc" style="font-size:11px;margin-top:2px">${l.nMeses} ${l.nMeses===1?"mês":"meses"}</div>`;
}

function pintarApoio(R){
  const A=R.AE;
  const nTodos = k => A.linhas.filter(l=>l.per===k).length;
  const soPeriodo = A.linhas.length && A.linhas.every(l=>l.per===A.linhas[0].per) ? A.linhas[0].per : null;
  $("#k_apoio").innerHTML =
    kpi("Equipamentos","",fmt(A.equip)+" un","","frota:apoio") +
    kpi("Horas no período","t",fmt(A.horas), soPeriodo ? PERIODOS_APOIO[soPeriodo] : "períodos diferentes por equipamento","frota:apoio") +
    kpi("Efetivo","g",fmt(A.efetivo)+" pessoas","no mês em que trabalham","pessoas:total") +
    kpi("Custo total","a",brl(A.total),"diesel "+brl(A.diesel)+" · "+fmt(A.litros)+" L","frota:apoio");

  // botões: um período para todos os equipamentos
  $("#ap_periodo_todos").innerHTML = `<span class="calc" style="margin-right:6px">Período de todos os equipamentos:</span>` +
    ["ano","safra","entressafra"].map(k=>`<button type="button" class="btn${soPeriodo===k?" p":""}" data-aptodos="${k}"
      title="Projetar todos os equipamentos de apoio em: ${PERIODOS_APOIO[k]}">${PERIODOS_APOIO[k]}</button>`).join("") +
    (soPeriodo ? "" : `<span class="calc" style="margin-left:8px">${["ano","safra","entressafra","meses"].filter(nTodos)
      .map(k=>nTodos(k)+" em "+PERIODOS_APOIO[k].toLowerCase()).join(" · ")}</span>`);

  buscaMaq && buscaMaq.limpar();

  $("#t_apoio_eq").innerHTML = th([["Equipamento"],["Máquina base"],["Qtd",1],["Horas/mês",1],["Período"],
    ["Função"],["Horas totais",1],["Litros",1],["Diesel",1],["Manutenção",1],["MDO",1],["Total",1],[""]])+"<tbody>"+
    A.linhas.map((l,i)=>`<tr>
      <td><input data-ap="${i}" data-f="nome" value="${esc(l.nome)}" style="text-align:left;min-width:170px"></td>
      <td>${celulaBusca("maquina", l.maq, `data-ap="${i}" data-f="maq"`)}</td>
      <td class="num"><input data-ap="${i}" data-f="qtd" value="${l.qtd}" inputmode="decimal"></td>
      <td class="num"><input data-ap="${i}" data-f="hmes" value="${l.hmes}" inputmode="decimal"></td>
      <td>${celPeriodo(l, i)}</td>
      <td>${celulaBusca("funcao", l.fcod, `data-ap="${i}" data-f="fcod"`)}</td>
      <td class="num calc">${fmt(l.horas)}</td><td class="num calc">${fmt(l.litros)}</td><td class="num calc">${brl(l.diesel)}</td>
      <td class="num calc">${brl(l.manut)}</td><td class="num calc">${brl(l.mdo)}</td>
      <td class="num tot">${brl(l.total)}</td>
      <td><button class="btn d" data-aprm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td></td><td class="num tot">${fmt(A.equip)}</td><td></td><td></td><td></td>
     <td class="num tot">${fmt(A.horas)}</td><td class="num tot">${fmt(A.litros)}</td><td class="num tot">${brl(A.diesel)}</td>
     <td class="num tot">${brl(A.manut)}</td><td class="num tot">${brl(A.mdo)}</td>
     <td class="num tot">${brl(A.total)}</td><td></td></tr></tbody>`;

  // projeção mês a mês: horas, litros e diesel do apoio em cada mês
  const lin = (rot, arr, f, cls) => `<tr><td class="${cls||""}">${rot}</td>`+
    arr.map((v,j)=>`<td class="num ${clsMes(j)} ${cls||""}" data-rastro="mes:${j}">${v>0.005?f(v):"—"}</td>`).join("")+
    `<td class="num tot">${f(arr.reduce((s,x)=>s+x,0))}</td></tr>`;
  $("#t_apoio_mes").innerHTML = th([["Mês a mês"],...MESES.map((m,j)=>[m,1,clsMes(j)]),["Total",1]])+"<tbody>"+
    lin("Horas", A.horasMes, v=>fmt(v)) + lin("Litros de diesel", A.litrosMes, v=>fmt(v)) +
    lin("Diesel (R$)", A.dieselMes, v=>brl(v)) + lin("Operadores (R$)", A.mdoMes, v=>brl(v)) +
    lin("Manutenção — CRM (R$)", A.manutMes, v=>brl(v)) +
    lin("Custo do apoio", MESES.map((m,j)=>A.dieselMes[j]+A.mdoMes[j]+A.manutMes[j]), v=>brl(v), "tot") + "</tbody>";
}


export { pintarApoio };

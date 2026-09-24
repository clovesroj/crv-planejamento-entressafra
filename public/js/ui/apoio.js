import { ROT_PER_APOIO, chaveDoMes, estruturaApoio } from '../calculo/apoio.js';
import { CFG } from '../dados/cfg.js';
import { MESES, clsMes } from '../nucleo/calendario.js';
import { APOIO_PER } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { celulaBusca, kpi, ligarBuscaSelect, registrarCombo, th } from './componentes.js';
import { funcaoItens, funcaoRotulo, funcaoValor } from './plano.js';

/* ---------- APOIO ---------- */
// "Máquina base" do novo equipamento e transitorio (escolhe, clica Adicionar,
// limpa) -- mesmo padrao do "Adicionar produto" de Insumos.
const buscaMaq = ligarBuscaSelect("#busca_ap_maq", "#lista_ap_maq", "#sel_ap_maq",
  () => Object.keys(CFG.maquinas).sort(), m => m);
registrarCombo("maquina", () => Object.keys(CFG.maquinas).sort(), m => m);
registrarCombo("funcao", funcaoItens, funcaoRotulo, funcaoValor);

/* Safra e entressafra são estruturas independentes (calculo/apoio.js): a
   chave no alto escolhe qual delas a tabela mostra e edita. Nome, máquina e
   função são do equipamento (valem nos dois períodos); quantidade, horas/mês
   e os meses são do período escolhido. A coluna "Na <outro período>" mostra o
   que o mesmo equipamento tem lá, só para comparar. */
const OUTRO = {s:"e", e:"s"};
const NOME_CURTO = {s:"safra", e:"entressafra"};

function pintarApoio(R){
  const A = R.AE, c = APOIO_PER, o = OUTRO[c];
  const noPer = (arr, k) => (arr||[]).reduce((s,x,i)=>s+(chaveDoMes(i)===k ? +x||0 : 0), 0);
  const maxPer = (arr, k) => Math.max(0, ...(arr||[]).filter((x,i)=>chaveDoMes(i)===k));
  const custoMes = i => A.dieselMes[i]+A.mdoMes[i]+A.manutMes[i];
  const custoPer = k => noPer(A.dieselMes,k)+noPer(A.mdoMes,k)+noPer(A.manutMes,k);
  const efetivoPer = k => A.linhas.reduce((s,l)=>s+maxPer(l.efetivoMes,k),0);
  const equipPer = {s:A.equipS, e:A.equipE};

  $("#k_apoio").innerHTML =
    kpi("Equipamentos — "+NOME_CURTO[c],"",fmt(equipPer[c])+" un", "safra "+fmt(A.equipS)+" · entressafra "+fmt(A.equipE),"frota:apoio") +
    kpi("Horas — "+NOME_CURTO[c],"t",fmt(noPer(A.horasMes,c)), "no ano "+fmt(A.horas)+" h","frota:apoio") +
    kpi("Efetivo — "+NOME_CURTO[c],"g",fmt(efetivoPer(c))+" pessoas","safra "+fmt(efetivoPer("s"))+" · entressafra "+fmt(efetivoPer("e")),"pessoas:total") +
    kpi("Custo do apoio no ano","a",brl(A.total),"safra "+brl(custoPer("s"))+" · entressafra "+brl(custoPer("e")),"frota:apoio");

  // chave de período e ações sobre a estrutura inteira
  $("#ap_periodo_todos").innerHTML = `<span class="calc" style="margin-right:4px">Estrutura do período:</span>
    <div class="ap-seg" role="tablist">` + ["s","e"].map(k=>`<button type="button" role="tab" aria-selected="${k===c}"
      class="btn${k===c?" p":""}" data-apvis="${k}">${ROT_PER_APOIO[k]} · ${fmt(equipPer[k])} un</button>`).join("") + `</div>
    <button type="button" class="btn" data-apcopia="${c}" title="Substitui a estrutura da ${NOME_CURTO[o]} pela da ${NOME_CURTO[c]}">Copiar esta estrutura para a ${NOME_CURTO[o]}</button>
    <button type="button" class="btn" data-apzera="${c}" title="Zera a quantidade de todos os equipamentos na ${NOME_CURTO[c]}">Nenhum apoio na ${NOME_CURTO[c]}</button>`;
  const add = $("#btn_ap_add"); if(add) add.textContent = "Adicionar à "+NOME_CURTO[c];

  buscaMaq && buscaMaq.limpar();

  // tabela do período escolhido
  const mesesDoPer = MESES.map((m,j)=>j).filter(j=>chaveDoMes(j)===c);
  $("#t_apoio_eq").innerHTML = th([["Equipamento"],["Máquina base"],["Função"],["Qtd na "+NOME_CURTO[c],1],["Horas/mês",1],
    ["Meses"],["Horas",1],["Litros",1],["Diesel",1],["Operadores",1],["Manutenção",1],["Total na "+NOME_CURTO[c],1],
    ["Na "+NOME_CURTO[o]],[""]])+"<tbody>"+
    A.linhas.map((l,i)=>{
      const E = estruturaApoio(l), x = E[c], y = E[o];
      const chk = mesesDoPer.map(j=>`<label class="${clsMes(j)}" title="${MESES[j]}"><input type="checkbox" data-apm="${i}" data-m="${j}"${
        !E.m || E.m[j] ? " checked" : ""}>${MESES[j].slice(0,3)}</label>`).join("");
      const tot = noPer(l.dieselMes,c)+noPer(l.mdoMes,c)+noPer(l.manutMes,c);
      return `<tr${x.qtd>0 ? "" : ' class="ap-parado"'}>
      <td><input data-ap="${i}" data-f="nome" value="${esc(l.nome)}" style="text-align:left;min-width:170px"></td>
      <td>${celulaBusca("maquina", l.maq, `data-ap="${i}" data-f="maq"`)}</td>
      <td>${celulaBusca("funcao", l.fcod, `data-ap="${i}" data-f="fcod"`)}</td>
      <td class="num"><input data-apq="${i}" data-per="${c}" data-f="qtd" value="${x.qtd||""}" placeholder="0" inputmode="decimal"></td>
      <td class="num"><input data-apq="${i}" data-per="${c}" data-f="hmes" value="${x.hmes||""}" placeholder="0" inputmode="decimal"></td>
      <td><div class="ap-meses">${chk}</div></td>
      <td class="num calc">${fmt(noPer(l.horasMes,c))}</td><td class="num calc">${fmt(noPer(l.litrosMes,c))}</td>
      <td class="num calc">${brl(noPer(l.dieselMes,c))}</td><td class="num calc">${brl(noPer(l.mdoMes,c))}</td>
      <td class="num calc">${brl(noPer(l.manutMes,c))}</td><td class="num tot">${brl(tot)}</td>
      <td class="calc">${y.qtd>0 ? `${fmt(y.qtd)} un × ${fmt(y.hmes)} h/mês` : "não trabalha"}</td>
      <td><button class="btn d" data-aprm="${i}">Remover</button></td></tr>`; }).join("")+
    `<tr><td class="tot" colspan="3">TOTAL NA ${NOME_CURTO[c].toUpperCase()}</td><td class="num tot">${fmt(equipPer[c])}</td><td></td><td></td>
     <td class="num tot">${fmt(noPer(A.horasMes,c))}</td><td class="num tot">${fmt(noPer(A.litrosMes,c))}</td>
     <td class="num tot">${brl(noPer(A.dieselMes,c))}</td><td class="num tot">${brl(noPer(A.mdoMes,c))}</td>
     <td class="num tot">${brl(noPer(A.manutMes,c))}</td><td class="num tot">${brl(custoPer(c))}</td><td></td><td></td></tr></tbody>`;

  // safra × entressafra lado a lado
  const linhaPer = (rot, k) => `<tr><td>${rot}</td><td class="num">${fmt(equipPer[k])}</td>
    <td class="num">${fmt(noPer(A.horasMes,k))}</td><td class="num">${fmt(noPer(A.litrosMes,k))}</td>
    <td class="num">${brl(noPer(A.dieselMes,k))}</td><td class="num">${brl(noPer(A.mdoMes,k))}</td>
    <td class="num">${brl(noPer(A.manutMes,k))}</td><td class="num tot">${brl(custoPer(k))}</td></tr>`;
  $("#t_apoio_per").innerHTML = th([["Período"],["Equipamentos",1],["Horas",1],["Litros",1],["Diesel",1],["Operadores",1],
      ["Manutenção",1],["Custo",1]])+"<tbody>"+
    linhaPer(ROT_PER_APOIO.s, "s") + linhaPer(ROT_PER_APOIO.e, "e") +
    `<tr class="cc-tot"><td>Ano</td><td class="num tot" title="O que tem de existir no pátio: o maior dos dois períodos, equipamento a equipamento">${fmt(A.equip)}</td>
     <td class="num tot">${fmt(A.horas)}</td><td class="num tot">${fmt(A.litros)}</td><td class="num tot">${brl(A.diesel)}</td>
     <td class="num tot">${brl(A.mdo)}</td><td class="num tot">${brl(A.manut)}</td><td class="num tot">${brl(A.total)}</td></tr></tbody>`;

  // projeção mês a mês: equipamentos, horas, litros e custo do apoio em cada mês
  const eqMes = MESES.map((m,j)=>A.linhas.reduce((s,l)=>s+l.qtdMes[j],0));
  const lin = (rot, arr, f, cls, fimTxt) => `<tr><td class="${cls||""}">${rot}</td>`+
    arr.map((v,j)=>`<td class="num ${clsMes(j)} ${cls||""}" data-rastro="mes:${j}">${v>0.005?f(v):"—"}</td>`).join("")+
    `<td class="num tot">${fimTxt!=null ? fimTxt : f(arr.reduce((s,x)=>s+x,0))}</td></tr>`;
  $("#t_apoio_mes").innerHTML = th([["Mês a mês"],...MESES.map((m,j)=>[m,1,clsMes(j)]),["Ano",1]])+"<tbody>"+
    // equipamentos no ano não é soma de meses: vale o maior mês
    lin("Equipamentos", eqMes, v=>fmt(v), "", fmt(Math.max(0, ...eqMes))+" no pico") +
    lin("Horas", A.horasMes, v=>fmt(v)) + lin("Litros de diesel", A.litrosMes, v=>fmt(v)) +
    lin("Diesel (R$)", A.dieselMes, v=>brl(v)) + lin("Operadores (R$)", A.mdoMes, v=>brl(v)) +
    lin("Manutenção — CRM (R$)", A.manutMes, v=>brl(v)) +
    lin("Custo do apoio", MESES.map((m,j)=>custoMes(j)), v=>brl(v), "tot") + "</tbody>";
}


export { pintarApoio };

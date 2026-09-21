import { composicao, doseBase, precoInsumo } from '../calculo/insumos.js';
import { TERC_TAR, insLista } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- MANEJO FITOSSANITÁRIO (Broca e Cigarrinha) ----------
   Painel de leitura: não edita nada de novo. Área e tratamento de cada onda
   se lançam no Plano Operacional (o mesmo PLANO[cod] que esta tela lê),
   composição e dose na aba Insumos — aqui só agrupa Broca e Cigarrinha
   separado do resto do Plano Operacional e soma o que cada praga custa,
   igual à planilha de origem ("Plano Inseticida": Resumo de Insumos e
   Serviços de Terceiros). Números vêm de R.L (o mesmo calculado pra toda
   a aba Plano Operacional) — nada recalculado aqui. */
const BROCA  = ["A44","A45","A46","A47","A48","A49"];
const CIGARRINHA = ["A50","A51","A52","A53"];

function linhasDe(R, cods){
  return cods.map(cod => R.L.find(r => r.a.cod === cod)).filter(Boolean);
}

function tabelaOndas(linhas){
  if(!linhas.length) return '<p class="calc">Nenhuma atividade cadastrada.</p>';
  return th([["Atividade"],["Tratamento"],["Área/ano (ha)",1],["Insumo (R$)",1],["Serviço terceiro (R$)",1],["Custo total (R$)",1],["Valor/ha (R$)",1]]) +
    "<tbody>" + linhas.map(r => `<tr>
      <td>${esc(r.a.cod)} — ${esc(r.a.nome)}</td>
      <td class="calc">${esc(r.trat || "—")}</td>
      <td class="num">${fmt(r.total)}</td>
      <td class="num">${brl(r.cInsumo)}</td>
      <td class="num">${brl(r.cTerc)}</td>
      <td class="num tot">${brl(r.direto + r.cInsumo)}</td>
      <td class="num">${r.total>0 ? brl((r.cInsumo + r.cTerc) / r.total, 2) : "—"}</td></tr>`).join("") + "</tbody>";
}

// soma, por produto, o volume usado nas atividades da lista (dose já na
// unidade do cadastro × área do ano de cada atividade que usa o produto)
function resumoInsumos(linhas){
  const porProduto = {};
  linhas.forEach(r => {
    if(!r.trat) return;
    composicao(r.trat).forEach(l => {
      const vol = doseBase(l) * r.total;
      if(!(l.prod in porProduto)) porProduto[l.prod] = 0;
      porProduto[l.prod] += vol;
    });
  });
  return Object.entries(porProduto).map(([prod, vol]) => {
    const reg = insLista().find(i => i.prod === prod) || {};
    const preco = precoInsumo(prod);
    const valor = vol * preco;
    const estoque = reg.est || 0;
    const comprar = Math.max(0, vol - estoque);
    return {prod, un: reg.un || "", vol, preco, valor, estoque, comprar, valorInvestir: comprar * preco};
  }).sort((a, b) => b.valor - a.valor);
}

function tabelaResumo(linhas){
  const dados = resumoInsumos(linhas);
  if(!dados.length) return '<p class="calc">Nenhum tratamento lançado ainda.</p>';
  const totalValor = dados.reduce((s, d) => s + d.valor, 0);
  const totalInvestir = dados.reduce((s, d) => s + d.valorInvestir, 0);
  return th([["Produto"],["Un."],["Volume necessário",1],["Preço unit.",1],["Valor total (R$)",1],
    ["Estoque",1],["Volume a comprar",1],["Valor a investir (R$)",1]]) +
    "<tbody>" + dados.map(d => `<tr>
      <td>${esc(d.prod)}</td>
      <td class="calc">${esc(d.un)}</td>
      <td class="num">${fmt(d.vol, 2)}</td>
      <td class="num calc">${d.preco > 0 ? brl(d.preco, 2) : '<span class="badge b-warn">sem preço</span>'}</td>
      <td class="num tot">${brl(d.valor)}</td>
      <td class="num calc">${fmt(d.estoque, 2)}</td>
      <td class="num">${fmt(d.comprar, 2)}</td>
      <td class="num tot">${brl(d.valorInvestir)}</td></tr>`).join("") +
    `<tr><td class="tot" colspan="4">TOTAL</td><td class="num tot">${brl(totalValor)}</td>
      <td></td><td></td><td class="num tot">${brl(totalInvestir)}</td></tr></tbody>`;
}

function pintarFito(R){
  const alvo = $("#fito");
  if(!alvo) return;
  const linhasBroca = linhasDe(R, BROCA);
  const linhasCig = linhasDe(R, CIGARRINHA);
  const todas = [...linhasBroca, ...linhasCig];

  const areaBroca = linhasBroca.reduce((s, r) => s + r.total, 0);
  const areaCig = linhasCig.reduce((s, r) => s + r.total, 0);
  const custoInsumo = todas.reduce((s, r) => s + r.cInsumo, 0);
  const custoTerc = todas.reduce((s, r) => s + r.cTerc, 0);

  $("#k_fito").innerHTML =
    kpi("Área Broca", "", fmt(areaBroca), "ha/ano") +
    kpi("Área Cigarrinha", "", fmt(areaCig), "ha/ano") +
    kpi("Custo de insumos", "g", brl(custoInsumo)) +
    kpi("Serviço de terceiro", "a", brl(custoTerc));

  $("#t_fito_broca").innerHTML = tabelaOndas(linhasBroca);
  $("#t_fito_cig").innerHTML = tabelaOndas(linhasCig);
  $("#t_fito_resumo").innerHTML = tabelaResumo(todas);

  const tercLinhas = todas.filter(r => r.cTerc > 0);
  $("#t_fito_terc").innerHTML = !tercLinhas.length ? '<p class="calc">Nenhum serviço de terceiro lançado.</p>' :
    th([["Atividade"],["Área/ano (ha)",1],["Tarifa (R$/ha)",1],["Valor (R$)",1]]) + "<tbody>" +
    tercLinhas.map(r => `<tr><td>${esc(r.a.cod)} — ${esc(r.a.nome)}</td><td class="num">${fmt(r.total)}</td>
      <td class="num calc">${brl(TERC_TAR[r.a.cod] != null ? TERC_TAR[r.a.cod] : 0, 2)}</td>
      <td class="num tot">${brl(r.cTerc)}</td></tr>`).join("") +
    `<tr><td class="tot" colspan="3">TOTAL</td><td class="num tot">${brl(custoTerc)}</td></tr></tbody>`;
}

export { pintarFito };

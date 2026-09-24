import { composicao, doseBase, precoInsumo } from '../calculo/insumos.js';
import { tarifaTercDe } from '../calculo/atividade.js';
import { TERC_MODOS } from '../dados/modos.js';
import { FITO_ABERTO, INSUMO, TERC_SUB, atividadesLista, insLista } from '../nucleo/estado.js';
import { codExibir } from '../nucleo/codigo-atividade.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- MANEJO FITOSSANITÁRIO (Broca e Cigarrinha) ----------
   Painel de leitura: não edita nada de novo. Área e tratamento de cada onda
   se lançam no Plano Operacional (o mesmo PLANO[cod] que esta tela lê),
   composição e dose na aba Insumos — aqui só agrupa Broca e Cigarrinha
   separado do resto do Plano Operacional e soma o que cada praga custa,
   igual à planilha de origem ("Plano Inseticida": Resumo de Insumos e
   Serviços de Terceiros). Números vêm de R.L (o mesmo calculado pra toda
   a aba Plano Operacional) — nada recalculado aqui. */
/* Antes uma lista fixa de códigos no código-fonte -- só um programador
   conseguia incluir atividade nova aqui. Agora vem do campo "Manejo" do
   Cadastro de Atividades (a.manejo): quem cadastra a atividade escolhe lá se
   ela é Broca, Cigarrinha ou nenhuma das duas, sem etapa nem rateio novos.
   Função (não array fixo) porque o cadastro muda em tempo de execução. */
const BROCA  = () => atividadesLista().filter(a=>a.manejo==="broca").map(a=>a.cod);
const CIGARRINHA = () => atividadesLista().filter(a=>a.manejo==="cigarrinha").map(a=>a.cod);

function linhasDe(R, cods){
  return cods.map(cod => R.L.find(r => r.a.cod === cod)).filter(Boolean);
}

/* Custo total da atividade: r.direto já vem com o insumo somado (mesma
   convenção usada em todo o motor — Plano Operacional, rastro, relatórios,
   ver calculo/atividade.js). Somar r.cInsumo de novo aqui contava o insumo
   em dobro; foi o que fazia "Custo total" descolar de "Valor/ha × Área". */
const custoTotal = r => r.direto;
const valorHa = r => r.total>0 ? custoTotal(r)/r.total : 0;

/* Estratifica uma atividade por modo de execução (r.partes: Trator, Drone,
   Terceiro...), e o Terceiro por sub-modo (Avião/Drone/Terrestre — TERC_SUB)
   quando detalhado. Insumo é R$/ha uniforme (mesma dose em qualquer modo),
   então rateia exato pela área de cada linha — não é aproximação. */
function linhasModo(r){
  const tarifaIns = r.total>0 ? r.cInsumo/r.total : 0;
  // volume tambem e R$/ha-equivalente (dose uniforme por hectare), entao
  // rateia pela mesma fracao de area que o custo de insumo
  const volumeBase = volumeInsumo(r);
  const volumeFrac = area => r.total>0 ? volumeBase.map(v=>({...v, vol:v.vol*(area/r.total)})) : [];
  const linhas = [];
  r.partes.forEach(p => {
    if(p.terc){
      const sub = TERC_SUB[r.a.cod];
      const chaves = sub ? TERC_MODOS.filter(m => sub[m] && num(sub[m].pct)>0) : [];
      if(chaves.length){
        const soma = chaves.reduce((s,m)=>s+num(sub[m].pct),0);
        chaves.forEach(m => {
          const area = p.area * (num(sub[m].pct)/soma);
          const terc = area * num(sub[m].tar);
          const insumo = area * tarifaIns;
          linhas.push({rot:`Terceiro — ${m}`, area, insumo, terc, total:insumo+terc, volume:volumeFrac(area)});
        });
        return;
      }
      const insumo = p.area * tarifaIns;
      linhas.push({rot:"Terceiro", area:p.area, insumo, terc:p.direto, total:insumo+p.direto, volume:volumeFrac(p.area)});
      return;
    }
    const insumo = p.area * tarifaIns;
    linhas.push({rot:p.modo || "Padrão", area:p.area, insumo, terc:0, total:insumo+p.direto, volume:volumeFrac(p.area)});
  });
  return linhas;
}

// tratamentos que a atividade usa, cada um com a area propria dele — cobre o
// caso de dois tratamentos na mesma atividade (ver PLANO[cod].trats em
// calculo/atividade.js: tratsDetalhe traz principal + extras, cada um com
// area exclusiva). Sem extras, cai no unico tratamento de sempre.
function tratsDe(r){
  if(Array.isArray(r.tratsDetalhe))
    return r.tratsDetalhe.filter(d=>d.trat).map(d=>({trat:d.trat, area:d.area}));
  return r.trat ? [{trat:r.trat, area:r.total}] : [];
}

// volume físico de cada produto usado pela atividade, somado entre os
// tratamentos dela (principal e extras, cada um com a área própria) — antes
// so olhava r.trat/r.total e um produto que so existisse num tratamento
// extra sumia do "Volume de insumo" e do Resumo de Insumos
function volumeInsumo(r){
  const porProduto = {};
  tratsDe(r).forEach(({trat, area}) => {
    composicao(trat).forEach(l => {
      const reg = insLista().find(i => i.prod === l.prod) || {};
      if(!(l.prod in porProduto)) porProduto[l.prod] = {prod: l.prod, un: reg.un || "", vol: 0};
      porProduto[l.prod].vol += doseBase(l) * area;
    });
  });
  return Object.values(porProduto);
}
const fmtVolume = vs => vs.length
  ? vs.map(v => `${fmt(v.vol, 2)} ${esc(v.un)} ${esc(v.prod)}`).join(" · ")
  : "—";

function tabelaOndas(linhas){
  if(!linhas.length) return '<p class="calc">Nenhuma atividade cadastrada.</p>';
  return th([["",0,"fito-seta"],["Atividade"],["Tratamento"],["Área/ano (ha)",1],["Volume de insumo"],["Insumo (R$)",1],
      ["Serviço terceiro (R$)",1],["Custo total (R$)",1],["Valor/ha (R$)",1]]) +
    "<tbody>" + linhas.map(r => {
      const aberto = !!FITO_ABERTO[r.a.cod];
      const estratificavel = r.partes && r.partes.length>0;
      const principal = `<tr class="fito-linha"${estratificavel?` data-fitoabre="${esc(r.a.cod)}" role="button" tabindex="0"`:""}>
        <td class="fito-seta">${estratificavel?(aberto?"▾":"▸"):""}</td>
        <td>${esc(codExibir(r.a.cod))} — ${esc(r.a.nome)}</td>
        <td class="calc">${esc(r.trat || "—")}</td>
        <td class="num">${fmt(r.total)}</td>
        <td class="calc">${fmtVolume(volumeInsumo(r))}</td>
        <td class="num">${brl(r.cInsumo)}</td>
        <td class="num">${brl(r.cTerc)}</td>
        <td class="num tot">${brl(custoTotal(r))}</td>
        <td class="num">${r.total>0 ? brl(valorHa(r), 2) : "—"}</td></tr>`;
      if(!aberto || !estratificavel) return principal;
      const subs = linhasModo(r).map(s => `<tr class="sub">
        <td></td><td colspan="2" class="calc">${esc(s.rot)}</td>
        <td class="num calc">${fmt(s.area)}</td>
        <td class="calc">${fmtVolume(s.volume)}</td>
        <td class="num calc">${brl(s.insumo)}</td>
        <td class="num calc">${s.terc>0?brl(s.terc):"—"}</td>
        <td class="num calc">${brl(s.total)}</td>
        <td class="num calc">${s.area>0?brl(s.total/s.area,2):"—"}</td></tr>`).join("");
      return principal + subs;
    }).join("") + "</tbody>";
}

// soma, por produto, o volume e a área usados nas atividades da lista (dose já
// na unidade do cadastro × área do ano de cada atividade que usa o produto —
// mesma área que gera o volume, por isso soma junto)
function resumoInsumos(linhas){
  const porProduto = {};
  linhas.forEach(r => {
    tratsDe(r).forEach(({trat, area}) => {
      composicao(trat).forEach(l => {
        const vol = doseBase(l) * area;
        if(!(l.prod in porProduto)) porProduto[l.prod] = {vol:0, area:0};
        porProduto[l.prod].vol += vol;
        porProduto[l.prod].area += area;
      });
    });
  });
  return Object.entries(porProduto).map(([prod, {vol, area}]) => {
    const reg = insLista().find(i => i.prod === prod) || {};
    const preco = precoInsumo(prod);
    const valor = vol * preco;
    // estoque aceita ajuste na aba Insumos sem mudar o cadastro base (INSUMO[prod].est,
    // mesma sobreposição que já vale para o preço) — sem isso o Resumo ficava preso
    // no estoque do cadastro, mesmo depois de o usuário atualizar na tela
    const ov = INSUMO[prod] || {};
    const estoque = ov.est != null ? num(ov.est) : num(reg.est);
    const comprar = Math.max(0, vol - estoque);
    return {prod, un: reg.un || "", vol, area, preco, valor, estoque, comprar, valorInvestir: comprar * preco};
  }).sort((a, b) => b.valor - a.valor);
}

function tabelaResumo(linhas){
  const dados = resumoInsumos(linhas);
  if(!dados.length) return '<p class="calc">Nenhum tratamento lançado ainda.</p>';
  const totalValor = dados.reduce((s, d) => s + d.valor, 0);
  const totalInvestir = dados.reduce((s, d) => s + d.valorInvestir, 0);
  return th([["Produto"],["Un."],["Área/ano (ha)",1],["Volume necessário",1],["Preço unit.",1],["Valor total (R$)",1],
    ["Estoque",1],["Volume a comprar",1],["Valor a investir (R$)",1]]) +
    "<tbody>" + dados.map(d => `<tr>
      <td>${esc(d.prod)}</td>
      <td class="calc">${esc(d.un)}</td>
      <td class="num calc">${fmt(d.area)}</td>
      <td class="num">${fmt(d.vol, 2)}</td>
      <td class="num calc">${d.preco > 0 ? brl(d.preco, 2) : '<span class="badge b-warn">sem preço</span>'}</td>
      <td class="num tot">${brl(d.valor)}</td>
      <td class="num calc">${fmt(d.estoque, 2)}</td>
      <td class="num">${fmt(d.comprar, 2)}</td>
      <td class="num tot">${brl(d.valorInvestir)}</td></tr>`).join("") +
    `<tr><td class="tot" colspan="5">TOTAL</td><td class="num tot">${brl(totalValor)}</td>
      <td></td><td></td><td class="num tot">${brl(totalInvestir)}</td></tr></tbody>`;
}

function pintarFito(R){
  const alvo = $("#fito");
  if(!alvo) return;
  const linhasBroca = linhasDe(R, BROCA());
  const linhasCig = linhasDe(R, CIGARRINHA());
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
    th([["Atividade"],["Área/ano (ha)",1],["Valor (R$/ha)",1],["Valor (R$)",1]]) + "<tbody>" +
    tercLinhas.map(r => `<tr><td>${esc(codExibir(r.a.cod))} — ${esc(r.a.nome)}</td><td class="num">${fmt(r.total)}</td>
      <td class="num calc">${brl(tarifaTercDe(r.a.cod), 2)}</td>
      <td class="num tot">${brl(r.cTerc)}</td></tr>`).join("") +
    `<tr><td class="tot" colspan="3">TOTAL</td><td class="num tot">${brl(custoTerc)}</td></tr></tbody>`;
}

export { pintarFito, BROCA, CIGARRINHA, linhasDe, custoTotal, valorHa, volumeInsumo, fmtVolume, resumoInsumos };

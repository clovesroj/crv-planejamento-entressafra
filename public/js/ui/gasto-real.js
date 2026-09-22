import { agruparPor, filtrarLancamentos, opcoesDe } from '../calculo/gasto-real.js';
import { GR_INICIO, GR_FIM, GR_EMPRESA, GR_ESP, GR_AG, GR_COMP, GR_FROTA, GR_PROP, GR_REFORMA } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- ANÁLISE DO GASTO REAL (ERP) ----------
   Mini-BI dentro do app: agrupa e filtra os lançamentos que
   scripts/gasto-reforma-bi.mjs extraiu, nos mesmos eixos do relatório de
   origem (Data, Empresa, Especialidade, Agrupamento, Compartimento, Frota,
   Próprio, Reforma). Tudo client-side, sobre o que já está carregado -- sem
   ida ao servidor a cada filtro.

   Reforma (SIM/NAO) só existe por lançamento em extrações feitas com a
   versão do script que rola em duas passadas (ver REFORMA SIM/NAO POR
   LANCAMENTO no cabeçalho de scripts/gasto-reforma-bi.mjs) -- item de uma
   extração mais antiga vem com reforma:null e cai fora quando esse filtro
   está ativo. */

const CAP_DETALHE = 200; // detalhe cru pode ter milhares de linhas; mostra só os maiores

function popularSelect(id, valores, atual, rotuloTodos) {
  const sel = $(id);
  if (!sel) return;
  const chave = valores.join("|");
  if (sel.dataset.opcoes !== chave) {
    sel.innerHTML = `<option value="">${rotuloTodos}</option>` +
      valores.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    sel.dataset.opcoes = chave;
  }
  sel.value = atual;
}

function pintarGastoReal() {
  const kEl = $("#k_gasto_real");
  if (!kEl) return; // painel não está nesta versão do index.html

  popularSelect("#sel_gr_empresa", opcoesDe("empresa"), GR_EMPRESA, "Todas");
  popularSelect("#sel_gr_esp", opcoesDe("esp"), GR_ESP, "Todas");
  popularSelect("#sel_gr_ag", opcoesDe("ag"), GR_AG, "Todos");
  popularSelect("#sel_gr_comp", opcoesDe("compartimento"), GR_COMP, "Todos");
  const propEl = $("#sel_gr_prop"); if (propEl) propEl.value = GR_PROP;
  const reformaEl = $("#sel_gr_reforma"); if (reformaEl) reformaEl.value = GR_REFORMA;
  const inicioEl = $("#gr_inicio"); if (inicioEl && inicioEl.value !== GR_INICIO) inicioEl.value = GR_INICIO;
  const fimEl = $("#gr_fim"); if (fimEl && fimEl.value !== GR_FIM) fimEl.value = GR_FIM;
  const frotaEl = $("#gr_frota"); if (frotaEl && frotaEl.value !== GR_FROTA) frotaEl.value = GR_FROTA;

  const lista = filtrarLancamentos({
    inicio: GR_INICIO || null, fim: GR_FIM || null, empresa: GR_EMPRESA || null,
    esp: GR_ESP || null, ag: GR_AG || null, compartimento: GR_COMP || null,
    frota: GR_FROTA || null, prop: GR_PROP || null, reforma: GR_REFORMA || null,
  });

  const total = lista.reduce((s, l) => s + l.valor, 0);
  const frotasDistintas = new Set(lista.map(l => l.frota)).size;
  const espsDistintas = new Set(lista.map(l => l.esp).filter(Boolean)).size;

  kEl.innerHTML =
    kpi("Gasto real filtrado", "", brl(total), `${fmt(lista.length)} lançamento${lista.length === 1 ? "" : "s"}`) +
    kpi("Frotas distintas", "t", fmt(frotasDistintas)) +
    kpi("Especialidades distintas", "a", fmt(espsDistintas)) +
    kpi("Ticket médio", "g", lista.length ? brl(total / lista.length) : "—");

  // Agrupado por compartimento -- é o "juntar serviço e peça no mesmo saco"
  // que motivou o painel: no ERP eles vêm em linhas separadas, aqui somam.
  const porComp = agruparPor(lista, "compartimento");
  const totComp = porComp.reduce((s, c) => s + c.total, 0) || 1;
  $("#t_gr_comp").innerHTML = th([["Compartimento"], ["Lançamentos", 1], ["Total R$", 1], ["% do filtrado", 1]]) + "<tbody>" +
    (porComp.length ? porComp.map(c => `<tr><td>${esc(c.chave)}</td><td class="num calc">${fmt(c.qtd)}</td>
      <td class="num tot">${brl(c.total)}</td><td class="num calc">${fmt(c.total / totComp * 100, 1)}%</td></tr>`).join("")
      : `<tr><td colspan="4" class="calc">Nenhum lançamento com esse filtro.</td></tr>`) + "</tbody>";

  const porEsp = agruparPor(lista, "esp");
  $("#t_gr_esp").innerHTML = th([["Especialidade"], ["Lançamentos", 1], ["Total R$", 1]]) + "<tbody>" +
    (porEsp.length ? porEsp.map(e => `<tr><td>${esc(e.chave)}</td><td class="num calc">${fmt(e.qtd)}</td>
      <td class="num tot">${brl(e.total)}</td></tr>`).join("")
      : `<tr><td colspan="3" class="calc">Nenhum lançamento com esse filtro.</td></tr>`) + "</tbody>";

  const ordenado = lista.slice().sort((a, b) => b.valor - a.valor);
  const mostrados = ordenado.slice(0, CAP_DETALHE);
  $("#t_gr_detalhe").innerHTML = th([["Frota"], ["Especialidade"], ["Compartimento"], ["Descrição"], ["Empresa"], ["Reforma"], ["Data"], ["Valor R$", 1]]) + "<tbody>" +
    (mostrados.length ? mostrados.map(l => `<tr><td>${esc(l.frota)}</td><td>${esc(l.esp || "—")}</td>
      <td>${esc(l.compartimento)}</td><td>${esc(l.desc)}</td><td>${esc(l.empresa || "—")}</td>
      <td class="calc">${esc(l.reforma || "—")}</td>
      <td class="calc">${fmtDataISO(l.data)}</td><td class="num tot">${brl(l.valor)}</td></tr>`).join("")
      : `<tr><td colspan="8" class="calc">Nenhum lançamento com esse filtro.</td></tr>`) + "</tbody>";

  const notaEl = $("#gr_detalhe_nota");
  if (notaEl) notaEl.textContent = ordenado.length > CAP_DETALHE
    ? `Mostrando os ${CAP_DETALHE} maiores lançamentos de ${fmt(ordenado.length)} — refine o filtro para ver os demais.`
    : ordenado.length ? `${fmt(ordenado.length)} lançamento${ordenado.length === 1 ? "" : "s"}.` : "";
}

function fmtDataISO(iso) {
  const [a, m, d] = (iso || "").split("-");
  return a ? `${d}/${m}/${a}` : "—";
}

export { pintarGastoReal };

import { agruparPor, filtrarLancamentos, opcoesDe } from '../calculo/gasto-real.js';
import { GR_INICIO, GR_FIM, GR_EMPRESA, GR_ESP, GR_AG, GR_COMP, GR_FROTA, GR_PROP, GR_REFORMA } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { th } from './componentes.js';

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
  const tEl = $("#t_gr_esp");
  if (!tEl) return; // painel não está nesta versão do index.html

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

  const porEsp = agruparPor(lista, "esp");
  const total = porEsp.reduce((s, e) => s + e.total, 0) || 1;
  tEl.innerHTML = th([["Especialidade"], ["Lançamentos", 1], ["Total R$", 1], ["% do filtrado", 1]]) + "<tbody>" +
    (porEsp.length ? porEsp.map(e => `<tr><td>${esc(e.chave)}</td><td class="num calc">${fmt(e.qtd)}</td>
      <td class="num tot">${brl(e.total)}</td><td class="num calc">${fmt(e.total / total * 100, 1)}%</td></tr>`).join("")
      : `<tr><td colspan="4" class="calc">Nenhum lançamento com esse filtro.</td></tr>`) +
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(lista.length)}</td>
     <td class="num tot">${brl(porEsp.reduce((s, e) => s + e.total, 0))}</td>
     <td class="num tot">${porEsp.length ? "100,0%" : "—"}</td></tr></tbody>`;
}

export { pintarGastoReal };

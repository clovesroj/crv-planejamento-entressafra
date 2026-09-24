import { agruparPor, coberturaBI, faltaExtrair, filtrarLancamentos, janelaGastoReal, janelaVazia, opcoesDe, setDadosBI } from '../calculo/gasto-real.js';
import { GR_INICIO, GR_FIM, GR_EMPRESA, GR_ESP, GR_AG, GR_COMP, GR_FROTA, GR_PROP, GR_REFORMA } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { destinoDoGasto } from '../calculo/reforma.js';
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

/** "2026-04-01" -> "01/04/2026" */
function dataBR(iso) {
  const [a, m, d] = String(iso || "").split("-");
  return a ? `${d}/${m}/${a}` : "—";
}

/* O aviso que faltava: com um período maior do que o extraído, o filtro
   parece quebrado -- ele filtra certo, só não existe lançamento fora do que
   a extração trouxe. Aqui a tela diz o que o arquivo cobre, o que foi pedido
   e o comando que traz o resto, já com as datas digitadas. */
function pintarAviso(nFiltrado) {
  const el = $("#gr_aviso");
  if (!el) return;
  const c = coberturaBI(), j = janelaGastoReal(), falta = faltaExtrair(j);
  const esp = c.todasEspecialidades ? "todas as especialidades"
    : c.especialidades.length ? c.especialidades.join(", ") : "especialidade não registrada";
  const cobertura = c.inicio
    ? `O arquivo extraído do ERP cobre <b>${dataBR(c.inicio)} a ${dataBR(c.fim)}</b> (${esc(esp)}), ${fmt(c.lancamentos)} lançamentos.`
    : "Nenhuma extração do ERP no arquivo ainda.";
  const janela = janelaVazia(j)
    ? "Sem filtro: a tela usa tudo o que foi extraído."
    : `Janela em vigor: <b>${j.inicio ? dataBR(j.inicio) : "início livre"} a ${j.fim ? dataBR(j.fim) : "fim livre"}</b>` +
      (j.empresa ? ` · ${esc(j.empresa)}` : "") +
      (j.prop ? ` · ${j.prop === "proprio" ? "só próprios" : "só de terceiros"}` : "") +
      (j.reforma ? ` · Reforma=${esc(j.reforma)}` : "") +
      ` — vale também para o gasto real de cada conjunto na grade abaixo, para os produtos do orçamento e para o rastro.`;
  const aviso = falta
    ? `<br><span class="badge b-warn">período pedido além do extraído</span> Você pediu
       ${falta.antes ? `de ${dataBR(falta.inicio)} ` : ""}${falta.depois ? `até ${dataBR(falta.fim)}` : ""} —
       fora de ${dataBR(c.inicio)}–${dataBR(c.fim)} não existe lançamento no arquivo, então o filtro não tem o que trazer.
       Rode <code>${esc(falta.comando)}</code> para extrair o período inteiro e recarregue a página.`
    : (nFiltrado === 0 && !janelaVazia(j)
        ? `<br><span class="badge b-warn">nada nesta janela</span> O período está dentro do extraído, mas nenhum
           lançamento bate com os outros filtros.` : "");
  el.innerHTML = cobertura + " " + janela + aviso;
}

/* O elo que faltava entre a analise e a grade: o filtro traz R$ X, mas so
   parte disso PODE aparecer numa celula de conjunto. Aqui a tela mostra quanto
   caiu em cada destino e o que fazer com o resto -- era a pergunta "mudei o
   periodo e a tabela de baixo nao encheu". */
function pintarDestino(lista) {
  const tEl = $("#t_gr_destino");
  if (!tEl) return;
  const D = destinoDoGasto(lista);
  const pct = v => D.total ? fmt(v / D.total * 100, 1) + "%" : "—";
  const linha = (rot, o, detalhe) => `<tr><td>${rot}</td><td class="num calc">${fmt(o.n)}</td>
    <td class="num tot">${brl(o.valor)}</td><td class="num calc">${pct(o.valor)}</td>
    <td class="calc">${detalhe}</td></tr>`;
  const lista10 = (arr, rotulo) => arr.length
    ? arr.slice(0, 6).map(([k, v]) => `${esc(k)} (${brl(v)})`).join(" · ") +
      (arr.length > 6 ? ` … +${arr.length - 6} ${rotulo}` : "")
    : "—";
  tEl.innerHTML = th([["Destino"], ["Lançamentos", 1], ["Total R$", 1], ["% do filtrado", 1], ["O que é / o que fazer"]]) + "<tbody>" +
    linha("Aparece na grade", D.naGrade, "equipamento cadastrado, marcado <b>vai reformar</b> e com coluna para a tag") +
    linha("Equipamento não vai reformar", D.semDestino,
      "a tag tem coluna, mas a unidade está marcada para rodar — mude o destino em <b>Manutenção de Frota</b>") +
    linha("Tag sem coluna na família", D.semColuna,
      D.semColuna.n ? "mapeie em <code>dados/reforma-bi-map.js</code>: " + lista10(D.semColuna.tags, "tags") : "—") +
    (D.repetido.n ? linha("Repetido no extrato", D.repetido,
      "lançamento idêntico duas vezes na extração — a grade conta uma vez só") : "") +
    linha("Frota fora do cadastro", D.semCadastro,
      D.semCadastro.n ? "código que não existe em <code>dados/frota-base.js</code> (normalmente outra unidade): " +
        lista10(D.semCadastro.frotas, "códigos") : "—") +
    `<tr><td class="tot">TOTAL FILTRADO</td><td class="num tot">${fmt(lista.length)}</td>
     <td class="num tot">${brl(D.total)}</td><td class="num tot">${D.total ? "100,0%" : "—"}</td><td></td></tr></tbody>`;
  const dica = $("#gr_destino_dica");
  if (dica) dica.innerHTML = D.total
    ? `A análise acima conta <b>todo</b> lançamento do filtro; a grade de conjuntos só consegue mostrar o que tem
       equipamento cadastrado, destino <b>vai reformar</b> e coluna para a tag do ERP. Esta tabela diz quanto de cada
       real filtrado chega lá — e o que falta para o resto chegar.`
    : "";
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

  pintarAviso(lista.length);
  pintarDestino(lista);

  const porEsp = agruparPor(lista, "esp");
  const total = porEsp.reduce((s, e) => s + e.total, 0) || 1;
  tEl.innerHTML = th([[`Especialidade`], ["Lançamentos", 1], ["Total R$", 1], ["% do filtrado", 1]]) + "<tbody>" +
    (porEsp.length ? porEsp.map(e => `<tr><td>${esc(e.chave)}</td><td class="num calc">${fmt(e.qtd)}</td>
      <td class="num tot">${brl(e.total)}</td><td class="num calc">${fmt(e.total / total * 100, 1)}%</td></tr>`).join("")
      : `<tr><td colspan="4" class="calc">Nenhum lançamento com esse filtro.</td></tr>`) +
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(lista.length)}</td>
     <td class="num tot">${brl(porEsp.reduce((s, e) => s + e.total, 0))}</td>
     <td class="num tot">${porEsp.length ? "100,0%" : "—"}</td></tr></tbody>`;
}

/* ─── Busca ao vivo ─────────────────────────────────────────────
   Consulta o banco de dados do servidor via API para trazer lançamentos 
   do período selecionado. */

let _buscaAtiva = null; // AbortController em andamento

/**
 * Inicia (ou aborta e reinicia) uma busca ao vivo no ERP/Banco.
 * Exibe loading animado no painel; ao terminar, carrega os dados e re-renderiza.
 * @param {Function} renderFn - função render() do ciclo principal
 */
async function buscarDoBI(renderFn) {
  // Cancela busca anterior se ainda estiver em andamento
  if (_buscaAtiva) { _buscaAtiva.abort(); _buscaAtiva = null; }

  const inicio = GR_INICIO || null;
  const fim    = GR_FIM    || null;
  if (!inicio || !fim) {
    alert('Preencha os campos De e Até antes de buscar.');
    return;
  }

  const overlay = $('#gr_loading');
  const msgEl   = $('#gr_loading_msg');
  if (overlay) overlay.hidden = false;
  if (msgEl)   msgEl.textContent = 'Consultando banco de dados…';

  const params = new URLSearchParams({ inicio, fim });
  if (GR_EMPRESA) params.set('empresas', GR_EMPRESA);
  if (GR_FROTA) params.set('frotas', GR_FROTA);

  const ctrl = new AbortController();
  _buscaAtiva = ctrl;

  try {
    const res = await fetch(`/api/reforma/gasto-real?${params}`, { signal: ctrl.signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ msg: 'Erro HTTP ' + res.status }));
      throw new Error(err.msg || 'Falha na requisição');
    }
    const dados = await res.json();
    if (overlay) overlay.hidden = true;
    setDadosBI(dados);
    if (renderFn) renderFn();
  } catch (e) {
    if (e.name === 'AbortError') return; // abortada intencionalmente
    console.error(e);
    if (overlay) overlay.hidden = true;
    alert(`Falha ao buscar do ERP:\n${e.message || 'Erro desconhecido'}`);
  } finally {
    if (_buscaAtiva === ctrl) _buscaAtiva = null;
  }
}

export { pintarGastoReal, buscarDoBI };


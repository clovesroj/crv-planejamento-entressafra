// public/js/ui/planejamento-ctt.js
//
// Planejamento Entressafra CTT — relatório com cronograma de atividades
// (gráfico em cascata), mão de obra e frota mês a mês, e balanço entre
// efetivo ativo hoje e a necessidade de cada função. Tela só de leitura:
// os filtros (mês, categoria, função, modo de contagem) são visão, não dado
// — não entram em `estado()`/`aplicar()` (ver invariante nº7 do CLAUDE.md).
// Os dados vêm prontos de `dados/planejamento-ctt.js`; o cálculo mês a mês é
// todo em `calculo/planejamento-ctt.js`, puro e sem DOM.

import { $, esc, fmt } from '../nucleo/formato.js';
import { kpi } from './componentes.js';
import { PLANO_CTT_CATEGORIAS as CATS, PLANO_CTT_CATEGORIAS_ORDEM as CAT_ORDEM, PLANO_CTT_FUNCOES as FUNCOES,
  PLANO_CTT_ATIVOS as ATIVOS, PLANO_CTT_OPERADORES as OPERADORES, PLANO_CTT_MOTORISTAS as MOTORISTAS } from '../dados/planejamento-ctt.js';
import { PREPARO, FRENTES_PLANTIO, mesesDoPlano, calcularMes, totalAtividade, atividadesVisiveis,
  indicePico, balancoEfetivo, diasEntre } from '../calculo/planejamento-ctt.js';

const MES_NOME = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MES3 = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const N = v => fmt(Math.round(v), 0);
const fmtCurta = t => { const d = new Date(t); return `${String(d.getUTCDate()).padStart(2,"0")}/${MES3[d.getUTCMonth()]}`; };
const fmtLonga = t => { const d = new Date(t); return `${String(d.getUTCDate()).padStart(2,"0")} de ${MES_NOME[d.getUTCMonth()]} de ${d.getUTCFullYear()}`; };

const FAMILIAS = [
  { key: "Operadores", cor: "var(--leaf)" },
  { key: "Motoristas", cor: "var(--ok)" },
  { key: "Auxiliares", cor: "var(--straw)" },
];
const COR_CAT = { preparo: "var(--leaf)", muda: "var(--sky)", plantio: "var(--ok)", tratos: "var(--straw)", apoio: "var(--soil)" };

let ESTADO = { modo: "pico", mes: "", cat: "", func: "", pagina: 0, sn: "" };
let MESES = [], CALC = [], CALC_REF = [], CALC_CHEIO = [], PICO = 0, REF = 0, REF_CHEIO = 0;

function recalcular() {
  MESES = mesesDoPlano();
  const opts = { modo: ESTADO.modo };
  CALC = MESES.map(m => calcularMes(m, { ...opts, categoria: ESTADO.cat, funcao: ESTADO.func }));
  CALC_REF = MESES.map(m => calcularMes(m, { ...opts, categoria: ESTADO.cat }));
  CALC_CHEIO = MESES.map(m => calcularMes(m, opts));
  PICO = indicePico(CALC);
  REF = ESTADO.mes ? Math.max(0, MESES.findIndex(m => m.key === ESTADO.mes)) : PICO;
  REF_CHEIO = ESTADO.mes ? Math.max(0, MESES.findIndex(m => m.key === ESTADO.mes)) : indicePico(CALC_CHEIO);
}

function refLabel() {
  const m = MESES[REF];
  return `${cap(MES_NOME[m.m])} de ${m.y}${ESTADO.mes ? "" : " (mês de pico)"}`;
}
function delta(i) {
  if (i === 0) return "mobilização inicial";
  const d = CALC[i].total - CALC[i - 1].total;
  if (d === 0) return "sem variação";
  return `${d > 0 ? "+" : "−"}${N(Math.abs(d))} em relação a ${MES3[MESES[i - 1].m]}`;
}

/* ---------- componentes visuais (SVG/HTML autocontidos, sem dependência externa) ---------- */

function legendaHTML(itens, dataAttr, atual) {
  return `<div class="pctt-lgd">${itens.map(it => {
    const on = atual === it.key;
    return `<button type="button"${dataAttr ? ` data-${dataAttr}="${on ? "" : it.key}" aria-pressed="${on}"` : ""}><i class="pctt-sw" style="background:${it.cor}"></i>${esc(it.label ?? it.key)}</button>`;
  }).join("")}</div>`;
}

function graficoEmpilhado({ id, H, series, valorDe }) {
  let max = 1;
  MESES.forEach((mo, i) => { let t = 0; series.forEach(s => t += valorDe(i, s.key) || 0); if (t > max) max = t; });
  let passo = max <= 60 ? 10 : (max <= 120 ? 20 : (max <= 300 ? 50 : 100));
  if (H < 160) passo *= 2;
  const topo = Math.ceil(max / passo) * passo;
  const BASE = 50, TOPO = 24;
  let h = `<div class="pctt-stk" style="height:${H + BASE + TOPO}px">`;
  for (let t = 0; t <= topo; t += passo) h += `<div class="pctt-gl" style="bottom:${BASE + t / topo * H}px"><span>${t}</span></div>`;
  h += `<div class="pctt-slots">`;
  MESES.forEach((mo, i) => {
    let tot = 0, segs = "";
    series.forEach(s => {
      const v = valorDe(i, s.key) || 0; if (!v) return; tot += v;
      const hh = Math.max(3, v / topo * H);
      segs += `<span class="pctt-sg" style="height:${hh}px;background:${s.cor}" title="${esc(s.label ?? s.key)}, ${cap(MES3[mo.m])}: ${N(v)} pessoas">${hh >= 17 ? N(v) : ""}</span>`;
    });
    const on = ESTADO.mes === mo.key, dim = ESTADO.mes && !on;
    h += `<button type="button" class="pctt-slot${on ? " on" : ""}${dim ? " dim" : ""}" data-pctt-mes="${on ? "" : mo.key}" title="${cap(MES_NOME[mo.m])} de ${mo.y}: ${N(tot)} pessoas — clique para filtrar">` +
      `<span class="pctt-ct">${N(tot)}</span><span class="pctt-cs">${segs}</span><span class="pctt-cx">${cap(MES3[mo.m])}/${String(mo.y).slice(2)}</span><span class="pctt-cd">${esc(delta(i))}</span></button>`;
  });
  h += `</div></div>`;
  return h;
}

function tabelaMatriz(linhas, rotuloPrimeira, rotuloFim, linhaTotal, classe) {
  let mx = 1; linhas.forEach(r => r.v.forEach(x => { if (x > mx) mx = x; }));
  let h = `<table class="pctt-mx${classe ? " " + classe : ""}"><thead><tr><th>${esc(rotuloPrimeira)}</th>`;
  MESES.forEach(mo => h += `<th${ESTADO.mes === mo.key ? ' class="sel"' : ""}>${cap(MES3[mo.m])}/${String(mo.y).slice(2)}</th>`);
  h += `<th>${esc(rotuloFim)}</th></tr></thead><tbody>`;
  linhas.forEach(r => {
    h += `<tr><td>${esc(r.label)}</td>`;
    r.v.forEach((x, i) => {
      const a = x ? (x / mx * 0.42 + 0.06) : 0;
      h += `<td class="${ESTADO.mes === MESES[i].key ? "sel" : ""}${x ? "" : " vz"}" style="${x ? `background:rgba(var(--pctt-heat),${a.toFixed(2)})` : ""}">${x ? N(x) : "–"}</td>`;
    });
    h += `<td class="tot">${N(Math.max(...r.v))}</td></tr>`;
  });
  if (linhaTotal) {
    h += `<tr class="tot"><td>Total</td>`;
    linhaTotal.forEach((x, i) => h += `<td${ESTADO.mes === MESES[i].key ? ' class="sel"' : ""}>${N(x)}</td>`);
    h += `<td>${N(Math.max(...linhaTotal))}</td></tr>`;
  }
  return h + `</tbody></table>`;
}

function barrasHorizontais(itens, dataAttr, atual, unidade, denso) {
  let mx = 1; itens.forEach(x => { if (x.v > mx) mx = x.v; });
  return `<div class="pctt-hbs${denso ? " denso" : ""}">${itens.map(x => {
    const on = atual && atual === x.key, dim = atual && !on;
    const miolo = `<span class="l">${esc(x.label)}</span><span class="t"><i style="width:${x.v / mx * 100}%;background:${x.cor || "var(--leaf)"}"></i></span><b>${N(x.v)}</b>`;
    const tip = `title="${esc(x.label)}: ${N(x.v)} ${unidade}"`;
    if (dataAttr) return `<button type="button" class="pctt-hb${on ? " on" : ""}${dim ? " dim" : ""}" data-${dataAttr}="${on ? "" : x.key}" ${tip}>${miolo}</button>`;
    return `<div class="pctt-hb" ${tip}>${miolo}</div>`;
  }).join("")}</div>`;
}

function graficoRosca() {
  const c = CALC_REF[REF];
  const vals = FAMILIAS.map(f => c.porFamilia[f.key] || 0);
  const tot = vals.reduce((a, b) => a + b, 0) || 1;
  const R = 46, C = 2 * Math.PI * R; let acc = 0, arcos = "";
  FAMILIAS.forEach((f, i) => {
    const len = vals[i] / tot * C;
    arcos += `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${f.cor}" stroke-width="24" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${esc(f.key)}: ${N(vals[i])} pessoas (${Math.round(vals[i] / tot * 100)}%)</title></circle>`;
    acc += len;
  });
  const t = vals.reduce((a, b) => a + b, 0);
  return `<div class="pctt-donutw"><svg width="150" height="150" viewBox="0 0 140 140" role="img" aria-label="Composição por família de função">${arcos}` +
    `<text x="70" y="68" text-anchor="middle" font-family="var(--f-display)" font-weight="700" font-size="26" fill="var(--ink)">${N(t)}</text>` +
    `<text x="70" y="86" text-anchor="middle" font-size="11" fill="var(--ink)" opacity=".65">pessoas</text></svg>` +
    `<div class="pctt-dl">${FAMILIAS.map((f, i) => `<div><i class="pctt-sw" style="background:${f.cor}"></i>${esc(f.key)}<b>${N(vals[i])}</b><span class="pctt-pc">${Math.round(vals[i] / tot * 100)}%</span></div>`).join("")}</div></div>`;
}

function graficoCascata({ lw, hh, rh, fh, semDeltaMes, inline }) {
  const T0 = MESES[0].t0, T1 = MESES[MESES.length - 1].t1, span = diasEntre(T0, T1);
  const L = t => ((t - T0) / 86400000) / span * 100;
  const W = (a, b) => diasEntre(a, b) / span * 100;
  let hm = "", fm = "", vl = "", sh = "";
  MESES.forEach((mo, i) => {
    const left = L(mo.t0), w = mo.dias / span * 100, on = ESTADO.mes === mo.key;
    hm += `<button type="button" class="pctt-gm${on ? " on" : ""}" data-pctt-mes="${on ? "" : mo.key}" style="left:${left}%;width:${w}%" title="${cap(MES_NOME[mo.m])} de ${mo.y} — ${mo.dias} dias — clique para filtrar">${cap(MES3[mo.m])} ${mo.y}</button>`;
    fm += `<button type="button" class="pctt-gm${on ? " on" : ""}" data-pctt-mes="${on ? "" : mo.key}" style="left:${left}%;width:${w}%" title="${cap(MES_NOME[mo.m])} de ${mo.y}: ${N(CALC[i].total)} pessoas"><span class="pctt-fn">${N(CALC[i].total)}</span><span class="pctt-fd">${esc(delta(i))}</span></button>`;
    if (i > 0) vl += `<div class="pctt-gt-vl" style="left:${left}%"></div>`;
    if (on) sh = `<div class="pctt-gt-sh" style="left:${left}%;width:${w}%"></div>`;
  });
  const kids = FRENTES_PLANTIO.filter(k => !ESTADO.cat || k.cat === ESTADO.cat);
  const mostrarPreparo = !ESTADO.cat || ESTADO.cat === "preparo";
  let overlap = "";
  if (mostrarPreparo && kids.length) {
    const kmin = Math.min(...kids.map(a => a.i)), kmax = Math.max(...kids.map(a => a.f));
    const os = Math.max(PREPARO.i, kmin), oe = Math.min(PREPARO.f, kmax);
    if (oe >= os) overlap = `<div class="pctt-gt-op" title="Preparo e plantio em paralelo: ${fmtLonga(os)} a ${fmtLonga(oe)} (${diasEntre(os, oe)} dias)" style="left:${L(os)}%;width:${W(os, oe)}%"></div>`;
  }
  let idx = 0, linhas = "";
  const linha = (a, filha) => {
    const tot = totalAtividade(a, ESTADO.func), rot = tot ? `${N(tot)} pessoas` : "sem esta função";
    return `<div class="pctt-gt-r${filha ? " k" : ""}"><div class="pctt-gt-l"><b>${esc(a.nome)}</b><i>${fmtCurta(a.i)} a ${fmtCurta(a.f)}</i></div>` +
      `<div class="pctt-gt-t"><div class="pctt-bar${tot ? "" : " z"}" style="--i:${idx++};left:${L(a.i)}%;width:${W(a.i, a.f)}%;background:${COR_CAT[a.cat]}" title="${esc(a.nome)}: ${fmtLonga(a.i)} a ${fmtLonga(a.f)} (${diasEntre(a.i, a.f)} dias) — ${rot}">${rot}</div></div></div>`;
  };
  if (mostrarPreparo) linhas += linha(PREPARO, false);
  if (kids.length) {
    let pico = 0;
    MESES.forEach(mo => { let s = 0; kids.forEach(k => { if (CALC_REF.length) s += totalAtividade(k, ESTADO.func); }); if (s > pico) pico = s; });
    const gs = Math.min(...kids.map(a => a.i)), ge = Math.max(...kids.map(a => a.f));
    const picoTxt = pico ? `até ${N(pico)} pessoas` : "sem esta função";
    linhas += `<div class="pctt-gt-r g"><div class="pctt-gt-l"><b>Plantio</b><i>${kids.length} atividades, ${fmtCurta(gs)} a ${fmtCurta(ge)}</i></div><div class="pctt-gt-t"><div class="pctt-bar sum" style="--i:${idx++};left:${L(gs)}%;width:${W(gs, ge)}%" title="Total do grupo Plantio: até ${N(pico)} pessoas">${picoTxt}</div></div></div>`;
    kids.forEach(k => linhas += linha(k, true));
  }
  const estilo = `--lw:${lw}px;--hh:${hh}px;--rh:${rh}px;--fh:${fh}px`;
  const legenda = `<div class="pctt-lgd">${CAT_ORDEM.map(c => `<button type="button" data-pctt-cat="${ESTADO.cat === c ? "" : c}" aria-pressed="${ESTADO.cat === c}"><i class="pctt-sw" style="background:${COR_CAT[c]}"></i>${esc(CATS[c])}</button>`).join("")}<span><i class="pctt-sw s"></i>Total do grupo Plantio</span>${overlap ? '<span><i class="pctt-sw h"></i>Preparo e plantio em paralelo</span>' : ""}</div>`;
  return `<div class="pctt-gt${semDeltaMes ? " nod" : ""}${inline ? " inl" : ""}" style="${estilo}"><div class="pctt-gt-h"><div class="pctt-gt-c">Atividade</div><div class="pctt-gt-hm">${hm}</div></div>` +
    `<div class="pctt-gt-b"><div class="pctt-gt-ov">${sh}${vl}${overlap}</div>${linhas}</div>` +
    `<div class="pctt-gt-f"><div class="pctt-gt-c"><b>Mão de obra no mês</b><span>${ESTADO.modo === "pico" ? "pico do mês" : "proporcional aos dias"}</span></div><div class="pctt-gt-fm">${fm}</div></div></div>${legenda}`;
}

/* ---------- balanço: efetivo ativo x necessidade ---------- */

function balTable(B) {
  const cov = (a, n) => { if (!a || !n) return ""; const p = n / a * 100; return `<span class="pctt-cov${p > 100 ? " bad" : ""}"><i style="width:${Math.min(100, p)}%"></i></span><span class="pctt-cp">${Math.round(p)}%</span>`; };
  const dash = x => x ? N(x) : "–";
  const tr = (label, a, n, s, f, cls) => `<tr class="${cls || ""}"><td>${label}</td><td class="r">${a == null ? "–" : N(a)}</td><td class="r">${dash(n)}</td><td class="r sb">${s == null ? "–" : dash(s)}</td><td class="r${f ? " bad" : ""}">${f == null ? "–" : dash(f)}</td><td class="cv">${a == null ? "" : cov(a, n)}</td></tr>`;
  const lvl = r => tr(esc(r), ATIVOS[r], B.need[r], Math.max(0, ATIVOS[r] - B.need[r]), Math.max(0, B.need[r] - ATIVOS[r]));
  let h = `<table class="dt pctt-bl"><thead><tr><th>Função</th><th class="r">Ativos hoje</th><th class="r">Necessário</th><th class="r">Sem escala</th><th class="r">Falta</th><th>Uso do efetivo</th></tr></thead><tbody>`;
  OPERADORES.forEach(r => h += lvl(r));
  if (B.pendente) h += tr('Operador (sem nível)<small>nível a definir</small>', null, B.pendente, null, null, "pend");
  h += tr("Total operadores", B.operadores.ativos, B.operadores.necessario, B.operadores.sobra, B.operadores.falta, "tot");
  MOTORISTAS.forEach(r => h += lvl(r));
  h += tr("Total motoristas", B.motoristas.ativos, B.motoristas.necessario, B.motoristas.sobra, B.motoristas.falta, "tot");
  h += tr('Auxiliar<small>sem efetivo informado</small>', null, B.auxiliares, null, null, "");
  return h + `</tbody></table>`;
}

function monthBal(kind) {
  const Bs = CALC_CHEIO.map(c => balancoEfetivo(c, ESTADO.sn));
  const lv = kind === "op" ? OPERADORES : MOTORISTAS;
  const dash = x => x ? N(x) : "–";
  const cel = (fn, cls) => MESES.map((m, i) => { const v = fn(Bs[i]); return `<td class="${ESTADO.mes === m.key ? "sel " : ""}${cls && v ? cls : ""}">${dash(v)}</td>`; }).join("");
  let linhas = "";
  lv.forEach(r => { if (Math.max(...Bs.map(b => b.need[r])) > 0) linhas += `<tr><td>${esc(r)}</td>${cel(b => b.need[r])}</tr>`; });
  if (kind === "op" && Math.max(...Bs.map(b => b.pendente)) > 0) linhas += `<tr><td>Sem nível definido</td>${cel(b => b.pendente)}</tr>`;
  const g = b => kind === "op" ? b.operadores : b.motoristas;
  linhas += `<tr class="tot"><td>Total necessários</td>${cel(b => g(b).necessario)}</tr>`;
  linhas += `<tr><td>Ativos hoje</td>${cel(b => g(b).ativos)}</tr>`;
  linhas += `<tr class="hl"><td>Sem escala</td>${cel(b => g(b).sobra)}</tr>`;
  if (Math.max(...Bs.map(b => g(b).falta)) > 0) linhas += `<tr class="fal"><td>Falta</td>${cel(b => g(b).falta)}</tr>`;
  const cab = `<th>${kind === "op" ? "Operadores" : "Motoristas"}</th>` + MESES.map(m => `<th${ESTADO.mes === m.key ? ' class="sel"' : ""}>${cap(MES3[m.m])}/${String(m.y).slice(2)}</th>`).join("");
  return `<table class="pctt-mx denso"><thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody></table>`;
}

/* ---------- KPIs e páginas ---------- */

function kpiCards() {
  const c = CALC[PICO], mo = MESES[PICO];
  const kids = FRENTES_PLANTIO.filter(k => !ESTADO.cat || k.cat === ESTADO.cat);
  let overlapKpi = "";
  if ((!ESTADO.cat || ESTADO.cat === "preparo") && kids.length) {
    const kmin = Math.min(...kids.map(a => a.i)), kmax = Math.max(...kids.map(a => a.f));
    const os = Math.max(PREPARO.i, kmin), oe = Math.min(PREPARO.f, kmax);
    if (oe >= os) overlapKpi = kpi("Preparo e plantio em paralelo", "", `${diasEntre(os, oe)}`, `${fmtCurta(os)} a ${fmtCurta(oe)}`);
  }
  if (!overlapKpi) overlapKpi = kpi("Preparo e plantio em paralelo", "", "–", "fora do filtro atual");
  let ultimo;
  if (ESTADO.mes) {
    ultimo = kpi(`Mão de obra em ${MES3[MESES[REF].m]}/${String(MESES[REF].y).slice(2)}`, "", N(CALC[REF].total), `${N(CALC[REF].unidades)} equipamentos`);
  } else {
    const ini = Math.min(...FRENTES_PLANTIO.concat(PREPARO).map(a => a.i)), fim = Math.max(...FRENTES_PLANTIO.concat(PREPARO).map(a => a.f));
    ultimo = kpi("Período total", "", `${diasEntre(ini, fim)}`, `${fmtCurta(ini)} a ${fmtCurta(fim)}`);
  }
  const B = balancoEfetivo(CALC_CHEIO[REF_CHEIO], ESTADO.sn);
  const ativos = B.operadores.ativos + B.motoristas.ativos, semEscala = B.operadores.sobra + B.motoristas.sobra, falta = B.operadores.falta + B.motoristas.falta;
  return kpi("Pico de mão de obra", "", N(c.total), `${cap(MES_NOME[mo.m])} de ${mo.y}`) +
    kpi("Colaboradores ativos hoje", "", N(ativos), `${N(B.operadores.ativos)} operadores e ${N(B.motoristas.ativos)} motoristas`) +
    kpi("Colaboradores sem escala", "a", N(semEscala), `${N(B.operadores.sobra)} operadores e ${N(B.motoristas.sobra)} motoristas${falta ? `, faltam ${N(falta)}` : ""}`) +
    overlapKpi + ultimo;
}

function paginaVisaoGeral() {
  const catSeries = CAT_ORDEM.map(c => ({ key: c, label: CATS[c], cor: COR_CAT[c] }));
  return `<div class="grid" style="grid-template-rows:78px minmax(0,1fr)">` +
    `<div class="grid g5">${kpiCards()}</div>` +
    `<div class="grid pctt-cols-1332">` +
    `<section class="pctt-v"><div class="pctt-v-t">Programação em cascata<small>clique em um mês para filtrar</small></div><div class="pctt-v-b">${graficoCascata({ lw: 190, hh: 28, rh: 22, fh: 46, semDeltaMes: true })}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Mão de obra mês a mês<small>pessoas por grupo de atividade</small></div><div class="pctt-v-b">${legendaHTML(catSeries, "pctt-cat", ESTADO.cat)}${graficoEmpilhado({ id: "a", H: 262, series: catSeries, valorDe: (i, k) => CALC_REF[i].porCategoria[k] })}</div></section>` +
    `</div></div>`;
}

function paginaCronograma() {
  return `<div class="grid"><section class="pctt-v"><div class="pctt-v-t">Cronograma em cascata por atividade<small>preparo de solo, depois plantio e demais atividades</small></div><div class="pctt-v-b">${graficoCascata({ lw: 340, hh: 34, rh: 25, fh: 56, inline: true })}</div></section></div>`;
}

function paginaMaoDeObraMes() {
  const catSeries = CAT_ORDEM.map(c => ({ key: c, label: CATS[c], cor: COR_CAT[c] }));
  const acts = atividadesVisiveis(MESES, CALC[REF], { categoria: ESTADO.cat, funcao: ESTADO.func, mesChave: ESTADO.mes });
  const linhas = acts.map(a => ({ label: a.nome, v: MESES.map((m, i) => CALC[i].porAtividade[a.id] || 0) }));
  const tot = CALC.map(c => c.total);
  return `<div class="grid pctt-cols-95-105">` +
    `<section class="pctt-v"><div class="pctt-v-t">Pessoas por mês e grupo<small>${ESTADO.modo === "pico" ? "pico do mês" : "proporcional aos dias"}</small></div><div class="pctt-v-b">${legendaHTML(catSeries, "pctt-cat", ESTADO.cat)}${graficoEmpilhado({ id: "b", H: 392, series: catSeries, valorDe: (i, k) => CALC_REF[i].porCategoria[k] })}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Matriz de atividades por mês<small>pessoas, cor mais forte = mais pessoas</small></div><div class="pctt-v-b pctt-scroll">${linhas.length ? tabelaMatriz(linhas, "Atividade", "Máx.", tot, "roomy") : '<div class="pctt-vazio">Nenhuma atividade para o filtro atual.</div>'}</div></section></div>`;
}

function paginaFuncoes() {
  const c = CALC_REF[REF];
  const items = FUNCOES.map(r => ({ key: r, label: r, v: c.porFuncao[r] || 0 })).filter(x => x.v > 0 || ESTADO.func === x.key);
  const rrows = FUNCOES.map(r => ({ label: r, v: MESES.map((m, i) => CALC_REF[i].porFuncao[r] || 0) })).filter(r => Math.max(...r.v) > 0);
  const rtot = CALC_REF.map(x => x.total);
  return `<div class="grid pctt-cols-9-11-2rows">` +
    `<section class="pctt-v"><div class="pctt-v-t">Pessoas por função<small>${esc(refLabel())}</small></div><div class="pctt-v-b">${barrasHorizontais(items, "pctt-func", ESTADO.func, "pessoas")}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Matriz de funções por mês<small>clique em um mês para filtrar</small></div><div class="pctt-v-b pctt-scroll">${tabelaMatriz(rrows, "Função", "Máx.", rtot)}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Composição da equipe<small>${esc(refLabel())}</small></div><div class="pctt-v-b">${graficoRosca()}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Operadores, motoristas e auxiliares por mês</div><div class="pctt-v-b">${legendaHTML(FAMILIAS, "", null)}${graficoEmpilhado({ id: "c", H: 140, series: FAMILIAS, valorDe: (i, k) => CALC_REF[i].porFamilia[k] })}</div></section>` +
    `</div>`;
}

function paginaResumoPorFuncao() {
  const i = REF_CHEIO, B = balancoEfetivo(CALC_CHEIO[i], ESTADO.sn), mo = MESES[i];
  const lab = `${cap(MES_NOME[mo.m])} de ${mo.y}${ESTADO.mes ? "" : ", pico"}`;
  const mp = B.motoristas, op = B.operadores;
  const kp = (cls, l, n, s, ruim) => kpi(l, cls, N(n), s) .replace('<div class="s">', ruim ? '<div class="s" style="color:var(--bad)">' : '<div class="s">');
  const kpis = kp("", "Motoristas necessários", mp.necessario, lab) +
    kp("", "Motoristas ativos hoje", mp.ativos, `I: ${ATIVOS["Motorista I"]}, II: ${ATIVOS["Motorista II"]}, III: ${ATIVOS["Motorista III"]}`) +
    kp("a", "Motoristas sem escala", mp.sobra, mp.falta ? `faltam ${N(mp.falta)} motoristas` : "ativos menos necessários", !!mp.falta) +
    kp("", "Operadores necessários", op.necessario, B.pendente ? `inclui ${N(B.pendente)} sem nível definido` : "todos os níveis") +
    kp("", "Operadores sem escala", op.sobra, op.falta ? `faltam ${N(op.falta)} operadores` : `de ${N(op.ativos)} ativos`, !!op.falta);
  const temSemNivel = CALC_CHEIO.some(c => (c.porFuncao["Operador"] || 0) > 0);
  const seletor = !temSemNivel ? "" : `<label class="pctt-sn">Operador sem nível como <select id="pctt-sn"><option value="">a definir</option>${OPERADORES.map(r => `<option value="${r}"${ESTADO.sn === r ? " selected" : ""}>${r}</option>`).join("")}</select></label>`;
  return `<div class="grid" style="grid-template-rows:88px minmax(0,1fr)">` +
    `<div class="grid g5">${kpis}</div>` +
    `<div class="grid pctt-cols-105-95">` +
    `<section class="pctt-v"><div class="pctt-v-t">Efetivo ativo x necessidade por função${seletor}</div><div class="pctt-v-b pctt-scroll">${balTable(B)}<p class="pctt-nota">${esc(lab)}. Sem escala = ativos menos necessários em cada nível. Considera todas as atividades, sem os filtros de grupo e função.</p></div></section>` +
    `<div class="grid pctt-rows-2">` +
    `<section class="pctt-v"><div class="pctt-v-t">Motoristas mês a mês<small>${ESTADO.modo === "pico" ? "pico do mês" : "proporcional aos dias"}</small></div><div class="pctt-v-b pctt-scroll">${monthBal("mot")}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Operadores mês a mês<small>${ESTADO.modo === "pico" ? "pico do mês" : "proporcional aos dias"}</small></div><div class="pctt-v-b pctt-scroll">${monthBal("op")}</div></section>` +
    `</div></div></div>`;
}

function paginaFrota() {
  const c = CALC[REF];
  const todos = {};
  CALC.forEach(x => Object.keys(x.porEquipamento).forEach(k => { todos[k] = Math.max(todos[k] || 0, x.porEquipamento[k]); }));
  const chaves = Object.keys(todos).sort((a, b) => todos[b] - todos[a] || a.localeCompare(b, "pt-BR"));
  const items = chaves.map(k => ({ key: k, label: k, v: c.porEquipamento[k] || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const linhas = chaves.map(k => ({ label: k, v: MESES.map((m, i) => CALC[i].porEquipamento[k] || 0) }));
  const tot = CALC.map(x => x.unidades);
  return `<div class="grid pctt-cols-9-11">` +
    `<section class="pctt-v"><div class="pctt-v-t">Equipamentos em operação<small>${esc(refLabel())}</small></div><div class="pctt-v-b">${items.length ? barrasHorizontais(items, "", null, "unidades", true) : '<div class="pctt-vazio">Sem equipamentos para o filtro atual.</div>'}</div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Matriz de equipamentos por mês<small>unidades</small></div><div class="pctt-v-b pctt-scroll">${linhas.length ? tabelaMatriz(linhas, "Equipamento", "Máx.", tot, "denso") : '<div class="pctt-vazio">Sem equipamentos para o filtro atual.</div>'}</div></section></div>`;
}

function paginaDetalhamento() {
  const acts = atividadesVisiveis(MESES, CALC[REF], { categoria: ESTADO.cat, funcao: ESTADO.func, mesChave: ESTADO.mes });
  let t = `<table class="dt"><thead><tr><th>Atividade / equipamento</th><th class="r">Qtd</th><th>Função</th><th class="r">Pessoas</th></tr></thead><tbody>`;
  let gp = 0, gq = 0;
  acts.forEach(a => {
    const its = a.itens.filter(it => !ESTADO.func || it.role === ESTADO.func);
    const p = its.reduce((s, it) => s + it.p, 0), q = its.reduce((s, it) => s + it.q, 0);
    gp += p; gq += q;
    t += `<tr class="a"><td>${esc(a.nome)}<br><small class="pctt-nota" style="margin:0">${fmtCurta(a.i)} a ${fmtCurta(a.f)}</small></td><td class="r">${q || "–"}</td><td></td><td class="r">${N(p)}</td></tr>`;
    its.forEach(it => t += `<tr class="i"><td>${esc(it.eq)}</td><td class="r">${it.q || "–"}</td><td>${esc(it.role)}</td><td class="r">${it.p}</td></tr>`);
  });
  t += `</tbody></table>`;
  const items = acts.map(a => ({ key: a.id, label: a.nome, v: totalAtividade(a, ESTADO.func), cor: COR_CAT[a.cat] }));
  return `<div class="grid pctt-cols-15-1">` +
    `<section class="pctt-v"><div class="pctt-v-t">Equipes por atividade<small>${ESTADO.mes ? esc(refLabel()) : "todas as atividades"}</small></div><div class="pctt-v-b pctt-flex-col"><div class="pctt-scroll" style="flex:1;min-height:0">${acts.length ? t : '<div class="pctt-vazio">Nenhuma atividade para o filtro atual.</div>'}</div><div class="pctt-totbar"><span>Total</span><span>${gq} equipamentos</span><b>${N(gp)} pessoas</b></div></div></section>` +
    `<section class="pctt-v"><div class="pctt-v-t">Total de pessoas por atividade<small>equipe completa</small></div><div class="pctt-v-b">${items.length ? barrasHorizontais(items, "", null, "pessoas") : '<div class="pctt-vazio">Nenhuma atividade para o filtro atual.</div>'}</div></section></div>`;
}

const PAGINAS = [
  { nome: "Visão geral", render: paginaVisaoGeral },
  { nome: "Cronograma", render: paginaCronograma },
  { nome: "Mão de obra por mês", render: paginaMaoDeObraMes },
  { nome: "Funções", render: paginaFuncoes },
  { nome: "Resumo por função", render: paginaResumoPorFuncao },
  { nome: "Frota e equipamentos", render: paginaFrota },
  { nome: "Detalhamento", render: paginaDetalhamento },
];

/* ---------- montagem ---------- */

function montarSlicers() {
  let h = `<div class="pctt-sl"><span>Contagem</span><div class="pctt-seg" role="group"><button type="button" data-pctt-modo="pico" aria-pressed="${ESTADO.modo === "pico"}">Pico do mês</button><button type="button" data-pctt-modo="prop" aria-pressed="${ESTADO.modo === "prop"}">Proporcional</button></div></div>`;
  h += `<div class="pctt-sl"><span>Mês</span><div class="pctt-seg" role="group"><button type="button" data-pctt-mes="" aria-pressed="${!ESTADO.mes}">Todos</button>${MESES.map(mo => `<button type="button" data-pctt-mes="${mo.key}" aria-pressed="${ESTADO.mes === mo.key}">${cap(MES3[mo.m])}/${String(mo.y).slice(2)}</button>`).join("")}</div></div>`;
  h += `<div class="pctt-sl"><label for="pctt-f-cat">Grupo</label><select id="pctt-f-cat"><option value="">Todos</option>${CAT_ORDEM.map(c => `<option value="${c}"${ESTADO.cat === c ? " selected" : ""}>${esc(CATS[c])}</option>`).join("")}</select></div>`;
  h += `<div class="pctt-sl"><label for="pctt-f-func">Função</label><select id="pctt-f-func"><option value="">Todas</option>${FUNCOES.map(r => `<option value="${r}"${ESTADO.func === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></div>`;
  h += `<button type="button" class="btn" id="pctt-limpar">Limpar filtros</button>`;
  return h;
}

function montarAbas() {
  let h = `<button type="button" class="pctt-arr" data-pctt-passo="-1" aria-label="Página anterior">‹</button>`;
  PAGINAS.forEach((p, i) => h += `<button type="button" data-pctt-pagina="${i}"${i === ESTADO.pagina ? ' aria-current="page"' : ""}>${esc(p.nome)}</button>`);
  h += `<button type="button" class="pctt-arr" data-pctt-passo="1" aria-label="Próxima página">›</button>`;
  return h;
}

function pintar() {
  const el = document.getElementById("planejamento-ctt");
  if (!el) return;
  recalcular();
  el.innerHTML = `<h2>Planejamento Entressafra CTT</h2>
    <p class="lead">Cronograma de atividades, mão de obra e frota da entressafra — Corte, Transbordo e Transporte.</p>
    <div class="pctt-slicers">${montarSlicers()}</div>
    <div class="pctt-tabs" role="navigation" aria-label="Páginas do relatório">${montarAbas()}</div>
    <div class="pctt-page" id="pctt-stage">${PAGINAS[ESTADO.pagina].render()}</div>`;
}

let LISTENERS_PRONTOS = false;
function wireEventos() {
  if (LISTENERS_PRONTOS) return;
  LISTENERS_PRONTOS = true;
  document.addEventListener("click", e => {
    if (!document.getElementById("planejamento-ctt")) return;
    const t = e.target;
    let el;
    if ((el = t.closest("[data-pctt-pagina]"))) { ESTADO.pagina = +el.dataset.pcttPagina; pintar(); return; }
    if ((el = t.closest("[data-pctt-passo]"))) { ESTADO.pagina = (ESTADO.pagina + (+el.dataset.pcttPasso) + PAGINAS.length) % PAGINAS.length; pintar(); return; }
    if ((el = t.closest("[data-pctt-modo]"))) { ESTADO.modo = el.dataset.pcttModo; pintar(); return; }
    if ((el = t.closest("[data-pctt-mes]"))) { ESTADO.mes = el.dataset.pcttMes; pintar(); return; }
    if ((el = t.closest("[data-pctt-cat]"))) { ESTADO.cat = el.dataset.pcttCat; pintar(); return; }
    if ((el = t.closest("[data-pctt-func]"))) { ESTADO.func = el.dataset.pcttFunc; pintar(); return; }
    if (t.closest("#pctt-limpar")) { ESTADO = { ...ESTADO, mes: "", cat: "", func: "" }; pintar(); return; }
  });
  document.addEventListener("change", e => {
    if (!document.getElementById("planejamento-ctt")) return;
    if (e.target.id === "pctt-f-cat") { ESTADO.cat = e.target.value; pintar(); return; }
    if (e.target.id === "pctt-f-func") { ESTADO.func = e.target.value; pintar(); return; }
    if (e.target.id === "pctt-sn") { ESTADO.sn = e.target.value; pintar(); return; }
  });
}

export function pintarPlanoCTT() {
  wireEventos();
  pintar();
}

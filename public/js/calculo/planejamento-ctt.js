// public/js/calculo/planejamento-ctt.js
//
// Cálculo puro (sem DOM/IO) do Planejamento Entressafra CTT: monta a linha do
// tempo em meses a partir das atividades, soma mão de obra/equipamentos por
// mês (pico do mês ou proporcional aos dias ativos) e faz o balanço entre
// efetivo ativo hoje e a necessidade de cada função.

import { PLANO_CTT_ATIVIDADES, PLANO_CTT_ATIVOS, PLANO_CTT_OPERADORES, PLANO_CTT_MOTORISTAS } from '../dados/planejamento-ctt.js';

const DIA_MS = 86400000;

function familiaDe(funcao) {
  if (funcao.indexOf("Operador") === 0) return "Operadores";
  if (funcao.indexOf("Motorista") === 0) return "Motoristas";
  return "Auxiliares";
}

function parseISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

const ATIVIDADES = PLANO_CTT_ATIVIDADES.map(a => ({ ...a, i: parseISO(a.ini), f: parseISO(a.fim) }));
export const PREPARO = ATIVIDADES[0];
export const FRENTES_PLANTIO = ATIVIDADES.filter(a => a.id !== "preparo" && a.cat !== "apoio" && a.cat !== "tratos");

export function diasEntre(a, b) { return Math.round((b - a) / DIA_MS) + 1; }

/** Meses (calendário) cobertos pelas atividades, do 1º dia do mês da 1ª atividade até o fim da última. */
export function mesesDoPlano() {
  const fim = Math.max(...ATIVIDADES.map(a => a.f));
  const out = [];
  let y = 2026, m = 11; // dezembro/2026
  while (Date.UTC(y, m, 1) <= fim) {
    const t0 = Date.UTC(y, m, 1), t1 = Date.UTC(y, m + 1, 0);
    out.push({ key: `${y}-${String(m + 1).padStart(2, "0")}`, y, m, t0, t1, dias: diasEntre(t0, t1) });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}

function fracaoNoMes(atividade, mes) {
  const s = Math.max(atividade.i, mes.t0), e = Math.min(atividade.f, mes.t1);
  return e < s ? 0 : diasEntre(s, e) / mes.dias;
}

/**
 * Soma mão de obra/equipamentos de um mês, filtrando por categoria/função.
 * `modo==="pico"` conta o efetivo cheio de qualquer atividade ativa no mês;
 * `modo==="prop"` pondera pela fração de dias do mês em que ela roda.
 */
export function calcularMes(mes, { modo = "pico", categoria = "", funcao = "" } = {}) {
  const r = { total: 0, unidades: 0, porAtividade: {}, porCategoria: {}, porFuncao: {}, porFamilia: {}, porEquipamento: {}, ativas: [] };
  ATIVIDADES.forEach(a => {
    if (categoria && a.cat !== categoria) return;
    const fr = fracaoNoMes(a, mes);
    if (fr <= 0) return;
    const fator = modo === "pico" ? 1 : fr;
    let n = 0;
    r.ativas.push(a.id);
    a.itens.forEach(it => {
      if (funcao && it.role !== funcao) return;
      const p = it.p * fator;
      n += p;
      r.porFuncao[it.role] = (r.porFuncao[it.role] || 0) + p;
      r.porFamilia[familiaDe(it.role)] = (r.porFamilia[familiaDe(it.role)] || 0) + p;
      if (it.q) { r.porEquipamento[it.eq] = (r.porEquipamento[it.eq] || 0) + it.q; r.unidades += it.q; }
    });
    r.porAtividade[a.id] = n;
    r.porCategoria[a.cat] = (r.porCategoria[a.cat] || 0) + n;
    r.total += n;
  });
  ["porAtividade", "porCategoria", "porFuncao", "porFamilia"].forEach(k => {
    Object.keys(r[k]).forEach(x => { r[k][x] = Math.round(r[k][x]); });
  });
  r.total = Math.round(r.total);
  return r;
}

export function totalAtividade(atividade, funcao) {
  return atividade.itens.reduce((s, it) => s + ((!funcao || it.role === funcao) ? it.p : 0), 0);
}

export function atividadesVisiveis(meses, calcsRef, { categoria = "", funcao = "", mesChave = "" } = {}) {
  return ATIVIDADES.filter(a => {
    if (categoria && a.cat !== categoria) return false;
    if (funcao && totalAtividade(a, funcao) === 0) return false;
    if (mesChave && calcsRef.ativas.indexOf(a.id) < 0) return false;
    return true;
  });
}

/** índice do mês de pico (maior total) dentre os calcs dados. */
export function indicePico(calcs) {
  let p = 0;
  calcs.forEach((c, i) => { if (c.total > calcs[p].total) p = i; });
  return p;
}

export function balancoEfetivo(calcMesCheio, operadorSemNivel) {
  const need = {}, semNivel = calcMesCheio.porFuncao["Operador"] || 0, auxiliares = calcMesCheio.porFuncao["Auxiliar"] || 0;
  let pendente = 0;
  PLANO_CTT_OPERADORES.concat(PLANO_CTT_MOTORISTAS).forEach(r => { need[r] = calcMesCheio.porFuncao[r] || 0; });
  if (operadorSemNivel) need[operadorSemNivel] += semNivel; else pendente = semNivel;
  const grupo = (lista, pend) => {
    let ativos = 0, necessario = 0, sobra = 0, falta = 0;
    lista.forEach(r => {
      ativos += PLANO_CTT_ATIVOS[r]; necessario += need[r];
      sobra += Math.max(0, PLANO_CTT_ATIVOS[r] - need[r]);
      falta += Math.max(0, need[r] - PLANO_CTT_ATIVOS[r]);
    });
    return { ativos, necessario: necessario + pend, sobra: Math.max(0, sobra - pend), falta: falta + Math.max(0, pend - sobra) };
  };
  return { need, pendente, auxiliares, operadores: grupo(PLANO_CTT_OPERADORES, pendente), motoristas: grupo(PLANO_CTT_MOTORISTAS, 0) };
}

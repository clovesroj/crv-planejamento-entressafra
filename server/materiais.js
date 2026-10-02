'use strict';
/**
 * Cadastro de Materiais (catálogo do ERP) — o que é comum aos dois armazenamentos.
 *
 * O catálogo tem mais de 120 mil itens e por isso NÃO mora no documento do plano
 * (que o navegador carrega e regrava inteiro): fica numa tabela própria, lida
 * por busca (server/api.js, /api/materiais). O plano guarda só o código e a
 * descrição do material que uma linha de Custos Administrativos usa, então ele
 * continua funcionando mesmo com o catálogo vazio.
 */

const LIMITE_LOTE = 5000;       // itens por chamada de importação
const LIMITE_BUSCA = 100;       // itens por busca
const MAX = { codigo: 40, descricao: 200, compl: 200, grupo: 40, un: 12, tipo: 60, utiliza: 4, nbm: 20 };

const txt = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

/** Item do cadastro como o servidor grava, ou null se não der para aproveitar (sem código). */
function normalizarMaterial(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;
  const codigo = txt(bruto.codigo, MAX.codigo);
  if (!codigo) return null;
  const saldo = Number(bruto.saldo);
  return {
    codigo,
    descricao: txt(bruto.descricao, MAX.descricao),
    compl1: txt(bruto.compl1, MAX.compl),
    compl2: txt(bruto.compl2, MAX.compl),
    grupo: txt(bruto.grupo, MAX.grupo),
    un: txt(bruto.un, MAX.un),
    saldo: Number.isFinite(saldo) ? saldo : 0,
    tipo: txt(bruto.tipo, MAX.tipo),
    utiliza_custo: txt(bruto.utiliza_custo, MAX.utiliza),
    nbm: txt(bruto.nbm, MAX.nbm),
  };
}

/** Lote de importação já limpo e sem códigos repetidos (o primeiro vence). */
function normalizarLote(lista) {
  const vistos = new Set();
  const itens = [];
  for (const b of Array.isArray(lista) ? lista : []) {
    const m = normalizarMaterial(b);
    if (!m || vistos.has(m.codigo)) continue;
    vistos.add(m.codigo);
    itens.push(m);
  }
  return itens;
}

/** Termos de busca em minúsculas, sem espaço sobrando; "filtro ar" busca os dois em qualquer ordem. */
function termosDeBusca(q) {
  return String(q == null ? '' : q).toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, 6);
}

function limiteDeBusca(v) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, LIMITE_BUSCA) : 30;
}

module.exports = { LIMITE_LOTE, LIMITE_BUSCA, normalizarMaterial, normalizarLote, termosDeBusca, limiteDeBusca };

'use strict';
/**
 * Migração da janela do orçamento (9 → 12 meses) do lado do servidor.
 *
 * Quem migra é o navegador, ao abrir o plano (migrarJanela em
 * public/js/io/persistencia.js): PLANO, DIESEL_MES e ARREND passam juntos do
 * vetor de 9 meses (Out/26 a Jun/27) para o de 12 (Abr/26 a Mar/27). O
 * navegador só reconhece o formato antigo pelo PLANO — DIESEL_MES e ARREND
 * guardam índices de mês, que não dizem de qual janela são.
 *
 * Por isso as três chaves precisam chegar ao banco JUNTAS, e com perfis não
 * chegavam: quem edita a Irrigação grava PLANO (já migrado) e tem ARREND e
 * DIESEL_MES descartados. Na abertura seguinte o PLANO está em 12 meses, a
 * migração não roda mais, e o índice antigo do arrendamento (0 = Out/26) passa
 * a ser lido como Abr/26. No caso inverso (grava ARREND, não grava PLANO) o
 * arrendamento era migrado de novo a cada abertura.
 *
 * Aqui o servidor completa, na primeira gravação que chega no formato novo, a
 * migração das chaves que o perfil não grava — com a mesma regra do navegador.
 * Mudou a regra lá, mude aqui.
 */

// posição no vetor de 9 meses → posição no de 12. Abr/27, Mai/27 e Jun/27 não
// existem na janela nova e vão para Abr/26, Mai/26 e Jun/26, como no navegador.
const MES_9_PARA_12 = [6, 7, 8, 9, 10, 11, 0, 1, 2];
const NM = 12;
const CHAVES = ['PLANO', 'DIESEL_MES', 'ARREND'];

// mesmo num() de public/js/nucleo/formato.js
const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : 0; };

/** true se o documento ainda tem o PLANO em 9 meses (o mesmo teste do navegador). */
function de9Meses(doc) {
  return Object.values((doc && doc.PLANO) || {}).some(v => v && Array.isArray(v.m) && v.m.length === 9);
}

/** Cópia do documento com PLANO, DIESEL_MES e ARREND em 12 meses. */
function migrar(doc) {
  const d = JSON.parse(JSON.stringify(doc || {}));
  Object.values(d.PLANO || {}).forEach(v => {
    if (!v || !Array.isArray(v.m) || v.m.length !== 9) return;
    const novo = Array(NM).fill(0);
    v.m.forEach((q, i) => { novo[MES_9_PARA_12[i]] += num(q); });
    v.m = novo;
  });
  if (d.DIESEL_MES) {
    const dm = {};
    Object.entries(d.DIESEL_MES).forEach(([k, v]) => {
      const j = MES_9_PARA_12[+k];
      if (j !== undefined) dm[j] = v;
    });
    d.DIESEL_MES = dm;
  }
  (d.ARREND || []).forEach(a => {
    if (!a) return;
    if (a.mes != null && +a.mes >= 0 && +a.mes < 9) {
      const j = MES_9_PARA_12[+a.mes];
      a.mes = j === undefined ? -1 : j;
    }
    if (Array.isArray(a.pmes)) {
      a.pmes = a.pmes.map(i => MES_9_PARA_12[+i]).filter(i => i !== undefined).sort((x, y) => x - y);
    }
  });
  return d;
}

module.exports = { CHAVES, de9Meses, migrar };

import { CFG } from '../dados/cfg.js';
import { GASTO_REFORMA_BI } from '../dados/gasto-reforma-bi.js';

/**
 * Gasto real (ERP, via Power BI) achatado em lançamentos individuais e
 * cruzado com o cadastro de frota -- é o que dá pra Especialidade, Agrupamento,
 * Frota e Próprio funcionarem como filtro sobre o gasto, do mesmo jeito que
 * funcionam no relatório de origem (BI). Função pura: só lê CFG e o arquivo
 * gerado pela extração, sem DOM.
 */

// cod -> {esp, ag, grp, mod, marca, ano, prop}, construído uma vez a partir
// do cadastro (mesma fonte de FROTA_ESP em calculo/crm.js, indexada por cod
// em vez de por especialidade -- é o sentido que falta pra cruzar com o BI).
const INFO_COD = {};
(CFG.frota_base || []).forEach(e => {
  e.mods.forEach(m => {
    (m.un || []).forEach(([cod, ano, prop]) => {
      INFO_COD[cod] = { esp: e.esp, ag: e.ag, grp: e.grp, mod: m.m, marca: m.marca, ano, prop };
    });
  });
});

const infoDeCod = cod => INFO_COD[cod] || null;

// Achata uma vez por render e reaproveita — GASTO_REFORMA_BI não muda em
// tempo de execução (só quando o script de extração roda de novo e recarrega
// a página), não precisa recalcular a cada tecla do filtro.
let cache = null;
function lancamentos() {
  if (cache) return cache;
  const out = [];
  for (const [cod, porComp] of Object.entries(GASTO_REFORMA_BI.porFrota || {})) {
    const info = infoDeCod(cod);
    for (const [compartimento, dado] of Object.entries(porComp)) {
      for (const it of dado.itens || []) {
        out.push({
          frota: cod, compartimento, desc: it.desc, valor: it.valor, data: it.data, empresa: it.empresa || null,
          reforma: it.reforma || null, // "SIM" | "NAO" | null (extração antiga, sem a 2ª passada)
          esp: info?.esp || null, ag: info?.ag || null, grp: info?.grp || null,
          mod: info?.mod || null, prop: info?.prop,
        });
      }
    }
  }
  cache = out;
  return out;
}

/** Todos os lançamentos que batem com o filtro (todo campo é opcional). */
function filtrarLancamentos(f = {}) {
  const frotaNorm = (f.frota || '').trim().toLowerCase();
  return lancamentos().filter(l =>
    (!f.inicio || l.data >= f.inicio) &&
    (!f.fim || l.data <= f.fim) &&
    (!f.empresa || l.empresa === f.empresa) &&
    (!f.esp || l.esp === f.esp) &&
    (!f.ag || l.ag === f.ag) &&
    (!f.compartimento || l.compartimento === f.compartimento) &&
    (!frotaNorm || String(l.frota).toLowerCase().includes(frotaNorm) || (l.mod || '').toLowerCase().includes(frotaNorm)) &&
    (!f.prop || (f.prop === 'proprio' ? l.prop === 1 : l.prop === 0)) &&
    (!f.reforma || l.reforma === f.reforma));
}

/** Agrupa uma lista de lançamentos por um campo (compartimento, esp, frota...), somando valor. */
function agruparPor(lista, campo) {
  const m = new Map();
  for (const l of lista) {
    const k = l[campo] ?? '—';
    const acc = m.get(k) || { chave: k, total: 0, qtd: 0 };
    acc.total += l.valor; acc.qtd++;
    m.set(k, acc);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

/** Valores distintos de um campo em TODOS os lançamentos (pra montar os <select> do filtro). */
function opcoesDe(campo) {
  return [...new Set(lancamentos().map(l => l[campo]).filter(Boolean))].sort();
}

export { lancamentos, filtrarLancamentos, agruparPor, opcoesDe, infoDeCod };

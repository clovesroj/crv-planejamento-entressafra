import { conjuntosDe, familiaReforma } from '../dados/reforma.js';
import { CFG } from '../dados/cfg.js';
import { FROTA_UN } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { destinoDe } from './crm.js';

/* ================== REFORMA DE FROTA ==================
   Provisionamento da reforma de entressafra. Orcado por unidade de frota,
   aberto nos conjuntos mecanicos que vao a bancada, e consolidado por modelo e
   especialidade -- o mesmo caminho de baixo para cima do CRM.

   Entra aqui a unidade marcada como "vai reformar" na Manutencao de Frota. A
   que vai rodar carrega CRM de safra, nao reforma: sao dois destinos
   excludentes para o mesmo equipamento. */

/** Orcamento lancado numa unidade, por conjunto. */
function refDe(cod){ return (FROTA_UN[cod] || {}).ref || {}; }

/** Total orcado de uma unidade. */
function totalUnidade(cod, conjuntos){
  const r = refDe(cod);
  return conjuntos.reduce((s, c) => s + (r[c] != null ? num(r[c]) : 0), 0);
}

/**
 * Consolida a reforma por especialidade > modelo > unidade.
 * Percorre so o que esta marcado para reformar; o resto nem aparece.
 */
function reforma(){
  const esps = [];
  let total = 0, unidades = 0, orcadas = 0;

  (CFG.frota_base || []).forEach(e=>{
    const conjuntos = conjuntosDe(e.esp);
    const mods = [];
    let totEsp = 0, nEsp = 0, nOrcEsp = 0;

    e.mods.forEach(m=>{
      const un = (m.un || []).filter(u => destinoDe(u[0]) === "reforma");
      if(!un.length) return;
      const linhas = un.map(([cod, ano, prop])=>{
        const t = totalUnidade(cod, conjuntos);
        if(t > 0) nOrcEsp++;
        return {cod, ano, prop, total: t, ref: refDe(cod)};
      });
      const totMod = linhas.reduce((s,l)=>s+l.total, 0);
      totEsp += totMod; nEsp += linhas.length;
      mods.push({mod: m.m, marca: m.marca, linhas, total: totMod,
                 media: linhas.length ? totMod/linhas.length : 0});
    });

    if(!mods.length) return;
    total += totEsp; unidades += nEsp; orcadas += nOrcEsp;
    esps.push({esp: e.esp, grp: e.grp, ag: e.ag, familia: familiaReforma(e.esp),
               conjuntos, mods, total: totEsp, unidades: nEsp, orcadas: nOrcEsp,
               media: nEsp ? totEsp/nEsp : 0});
  });

  esps.sort((a,b)=> b.total-a.total || a.ag.localeCompare(b.ag) || a.esp.localeCompare(b.esp));

  // Peso de cada conjunto no total, para mostrar onde a reforma concentra gasto
  const porConjunto = {};
  esps.forEach(e=> e.mods.forEach(m=> m.linhas.forEach(l=>{
    e.conjuntos.forEach(c=>{
      const v = l.ref[c] != null ? num(l.ref[c]) : 0;
      if(v) porConjunto[c] = (porConjunto[c] || 0) + v;
    });
  })));

  return {esps, total, unidades, orcadas, porConjunto,
          media: unidades ? total/unidades : 0};
}

export { reforma, refDe, totalUnidade };

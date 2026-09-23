import { conjuntosDe, familiaReforma } from '../dados/reforma.js';
import { tagsBiDoConjunto } from '../dados/reforma-bi-map.js';
import { GASTO_REFORMA_BI } from '../dados/gasto-reforma-bi.js';
import { CFG } from '../dados/cfg.js';
import { FROTA_UN } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { destinoDe } from './crm.js';
import { itensDoEquipamento } from './gasto-real.js';

/* ================== REFORMA DE FROTA ==================
   Provisionamento da reforma de entressafra. Orcado por unidade de frota,
   aberto nos conjuntos mecanicos que vao a bancada, e consolidado por modelo e
   especialidade -- o mesmo caminho de baixo para cima do CRM.

   Entra aqui a unidade marcada como "vai reformar" na Manutencao de Frota. A
   que vai rodar carrega CRM de safra, nao reforma: sao dois destinos
   excludentes para o mesmo equipamento. */

/** Orcamento lancado numa unidade, por conjunto. */
function refDe(cod){ return (FROTA_UN[cod] || {}).ref || {}; }

/**
 * Chave estavel de um lancamento do ERP, pra guardar exclusao sem duplicar o
 * dado extraido. Nao precisa ser reversivel -- so serve pra comparar igualdade
 * (Set.has()), entao concatenar os campos que identificam o lancamento (tag,
 * descricao, valor, data, empresa) chega.
 */
function chaveItemReforma(cod, tag, it){
  return `${cod}|${tag}|${it.desc}|${it.valor}|${it.data}|${it.empresa || ""}`;
}

/** Lancamentos que o usuario desmarcou pra nao contar no orcamento da unidade
 *  (tira do mapeamento automatico por tag -- nao mexe no que foi incluido a mao). */
function itensExcluidosReforma(cod){
  return new Set((FROTA_UN[cod] || {}).reformaExcl || []);
}

/** Lancamentos que o usuario incluiu a mao num conjunto especifico -- de
 *  qualquer tag deste equipamento, nao so das que o mapeamento aponta pra ele
 *  (ver ui/rastro.js, a busca dentro do rastro do conjunto). */
function itensIncluidosReforma(cod, conjunto){
  return new Set(((FROTA_UN[cod] || {}).reformaIncl || {})[conjunto] || []);
}

// cod -> Map(chave -> item), pra resolver o que foi incluido a mao (a chave
// nao guarda o item, so identifica -- o item mora em GASTO_REFORMA_BI, sob a
// tag onde o ERP realmente lancou, que pode ser diferente do conjunto).
const mapaItensCache = new Map();
function mapaItensPorChave(cod){
  let m = mapaItensCache.get(cod);
  if(!m){
    m = new Map();
    itensDoEquipamento(cod).forEach(it => m.set(chaveItemReforma(cod, it.compartimento, it), it));
    mapaItensCache.set(cod, m);
  }
  return m;
}

/**
 * Lancamentos que contam no orcamento de uma unidade num conjunto -- os que o
 * mapeamento de tag aponta pra ele (menos os desmarcados) mais os incluidos a
 * mao (de qualquer tag), sem repetir o mesmo lancamento duas vezes. Usada
 * tanto pra somar (realDe) quanto pra listar no rastro do conjunto
 * (rastroReformaBiItem, em calculo/rastro.js) -- uma conta so, uma lista so.
 */
function itensReforma(cod, conjunto, familia){
  const porFrota = GASTO_REFORMA_BI.porFrota[cod] || {};
  const tags = tagsBiDoConjunto(familia, conjunto);
  const excl = itensExcluidosReforma(cod);
  const incl = itensIncluidosReforma(cod, conjunto);
  const vistos = new Set();
  let total = 0;
  const itens = [];
  tags.forEach(tag=>{
    const dado = porFrota[tag];
    if(!dado) return;
    dado.itens.forEach(it=>{
      const chave = chaveItemReforma(cod, tag, it);
      if(vistos.has(chave)) return;
      vistos.add(chave);
      const ligado = !excl.has(chave);
      if(ligado) total += it.valor;
      itens.push({...it, chave, ligado, origem:"auto"});
    });
  });
  if(incl.size){
    const porChave = mapaItensPorChave(cod);
    incl.forEach(chave=>{
      if(vistos.has(chave)) return; // ja contado pelo mapeamento automatico
      const it = porChave.get(chave);
      if(!it) return;
      vistos.add(chave);
      total += it.valor;
      itens.push({...it, chave, ligado:true, origem:"manual"});
    });
  }
  return {itens, total};
}

/**
 * Gasto real (ERP, via Power BI) de uma unidade num conjunto -- soma item a
 * item (nao o total pronto da extracao) pra respeitar o que o usuario
 * desmarcou ou incluiu a mao no rastro do conjunto. 0 sem nada contando.
 */
function realDe(cod, conjunto, familia){
  return itensReforma(cod, conjunto, familia).total;
}

/**
 * Valor de uma unidade num conjunto: o gasto real do ERP quando existe --
 * nesse caso o campo na tela fica travado, nao dá pra digitar por cima --
 * senao o que a pessoa lancou a mao. Nunca soma os dois: e a mesma regra de
 * "um ou outro" que a celula mostra (ver gastoRealDe() em ui/reforma.js).
 */
function valorConjunto(cod, conjunto, familia){
  const real = realDe(cod, conjunto, familia);
  if(real) return real;
  const r = refDe(cod);
  return r[conjunto] != null ? num(r[conjunto]) : 0;
}

/** Total (real do ERP + digitado, sem repetir conjunto nenhum) de uma unidade. */
function totalUnidade(cod, conjuntos, familia){
  return conjuntos.reduce((s, c) => s + valorConjunto(cod, c, familia), 0);
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
    const familia = familiaReforma(e.esp);
    const mods = [];
    let totEsp = 0, nEsp = 0, nOrcEsp = 0;

    e.mods.forEach(m=>{
      const un = (m.un || []).filter(u => destinoDe(u[0]) === "reforma");
      if(!un.length) return;
      const linhas = un.map(([cod, ano, prop])=>{
        const t = totalUnidade(cod, conjuntos, familia);
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
    esps.push({esp: e.esp, grp: e.grp, ag: e.ag, familia,
               conjuntos, mods, total: totEsp, unidades: nEsp, orcadas: nOrcEsp,
               media: nEsp ? totEsp/nEsp : 0});
  });

  esps.sort((a,b)=> b.total-a.total || a.ag.localeCompare(b.ag) || a.esp.localeCompare(b.esp));

  // Peso de cada conjunto no total, para mostrar onde a reforma concentra gasto
  const porConjunto = {};
  esps.forEach(e=> e.mods.forEach(m=> m.linhas.forEach(l=>{
    e.conjuntos.forEach(c=>{
      const v = valorConjunto(l.cod, c, e.familia);
      if(v) porConjunto[c] = (porConjunto[c] || 0) + v;
    });
  })));

  return {esps, total, unidades, orcadas, porConjunto,
          media: unidades ? total/unidades : 0};
}

export { reforma, refDe, totalUnidade, valorConjunto, realDe, chaveItemReforma,
  itensExcluidosReforma, itensIncluidosReforma, itensReforma };

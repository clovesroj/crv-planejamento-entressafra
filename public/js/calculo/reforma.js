import { conjuntosDe, familiaReforma } from '../dados/reforma.js';
import { tagsBiDoConjunto } from '../dados/reforma-bi-map.js';
import { CFG } from '../dados/cfg.js';
import { FROTA_UN } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { destinoDe } from './crm.js';
import { itensDoEquipamentoNaJanela, janelaGastoReal, normTag, produtosDoEquipamento } from './gasto-real.js';

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
  return `${cod}|${normTag(tag)}|${it.desc}|${it.valor}|${it.data}|${it.empresa || ""}`;
}
/* Chave gravada antes da normalizacao da tag traz o espaco nao-separavel do
   ERP ("CORTE BASE"); normalizar os dois lados faz a exclusao/inclusao
   antiga continuar valendo depois da correcao. */
const normChave = k => String(k).split("|").map((p,i)=> i===1 ? normTag(p) : p).join("|");

/** Lancamentos que o usuario desmarcou pra nao contar no orcamento da unidade
 *  (tira do mapeamento automatico por tag -- nao mexe no que foi incluido a mao). */
function itensExcluidosReforma(cod){
  return new Set(((FROTA_UN[cod] || {}).reformaExcl || []).map(normChave));
}

/** Lancamentos que o usuario incluiu a mao num conjunto especifico -- de
 *  qualquer tag deste equipamento, nao so das que o mapeamento aponta pra ele
 *  (ver ui/rastro.js, a busca dentro do rastro do conjunto). */
function itensIncluidosReforma(cod, conjunto){
  return new Set((((FROTA_UN[cod] || {}).reformaIncl || {})[conjunto] || []).map(normChave));
}

// cod -> Map(chave -> item), pra resolver o que foi incluido a mao (a chave
// nao guarda o item, so identifica -- o item mora em GASTO_REFORMA_BI, sob a
// tag onde o ERP realmente lancou, que pode ser diferente do conjunto).
const mapaItensCache = new Map();
let janelaCache = "";
function mapaItensPorChave(cod){
  // a janela do painel (periodo, empresa, proprio, reforma) muda o que conta;
  // o cache e por equipamento, entao ele cai inteiro quando a janela muda
  const jc = JSON.stringify(janelaGastoReal());
  if(jc !== janelaCache){ mapaItensCache.clear(); janelaCache = jc; }
  let m = mapaItensCache.get(cod);
  if(!m){
    m = new Map();
    itensDoEquipamentoNaJanela(cod).forEach(it => m.set(chaveItemReforma(cod, it.compartimento, it), it));
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
  const tags = (tagsBiDoConjunto(familia, conjunto) || []).map(normTag);
  const excl = itensExcluidosReforma(cod);
  const incl = itensIncluidosReforma(cod, conjunto);
  // uma fonte so: os lancamentos ja achatados e normalizados (e ja recortados
  // pela janela do painel de filtros) -- antes isto lia GASTO_REFORMA_BI.
  // porFrota[cod][tag] direto, e a tag crua do ERP com espaco nao-separavel
  // nunca batia com o nome do conjunto
  const doEquip = itensDoEquipamentoNaJanela(cod);
  const vistos = new Set();
  let total = 0;
  const itens = [];
  doEquip.forEach(it=>{
    if(!tags.includes(it.compartimento)) return;
    const chave = chaveItemReforma(cod, it.compartimento, it);
    if(vistos.has(chave)) return;
    vistos.add(chave);
    const ligado = !excl.has(chave);
    if(ligado) total += it.valor;
    itens.push({...it, chave, ligado, origem:"auto"});
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

/* ===== Orcamento por produto =====
   Quantidade que a pessoa lanca para cada produto do sistema, vezes o valor
   medio que aquele produto custou no ultimo ano. E o orcamento "por sistema e
   produto": o gasto real diz o que FOI gasto, isto diz o que se PRETENDE
   gastar, item a item. Zero enquanto ninguem lancar quantidade. */
function qtdProdutos(cod, conjunto){
  return (((FROTA_UN[cod] || {}).refQtd || {})[conjunto]) || {};
}
function orcamentoProdutos(cod, conjunto, familia){
  const q = qtdProdutos(cod, conjunto);
  const chaves = Object.keys(q).filter(k => num(q[k]) > 0);
  if(!chaves.length) return {total:0, itens:[]};
  const prods = produtosDoEquipamento(cod, {
    sistemas: [conjunto].concat(tagsBiDoConjunto(familia, conjunto) || [])});
  const porNome = Object.fromEntries(prods.map(p=>[p.produto, p]));
  const itens = chaves.map(k=>{
    const p = porNome[k] || {media:0, vezes:0};
    const qtd = num(q[k]);
    return {produto:k, qtd, media:p.media, total: qtd * p.media, vezes:p.vezes};
  }).sort((a,b)=>b.total-a.total);
  return {total: itens.reduce((s,x)=>s+x.total,0), itens};
}

/**
 * Valor de uma unidade num conjunto: o gasto real do ERP quando existe --
 * nesse caso o campo na tela fica travado, nao dá pra digitar por cima --
 * senao o que a pessoa lancou a mao. Nunca soma os dois: e a mesma regra de
 * "um ou outro" que a celula mostra (ver gastoRealDe() em ui/reforma.js).
 */
function valorConjunto(cod, conjunto, familia){
  // orcamento por produto manda quando existe: e a previsao explicita do que a
  // proxima reforma vai usar, lancada item a item sobre o historico
  const orc = orcamentoProdutos(cod, conjunto, familia).total;
  if(orc) return orc;
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
 * PARA ONDE FOI O DINHEIRO FILTRADO: por que um lancamento da analise chega
 * (ou nao chega) na grade de conjuntos. Sao quatro destinos possiveis, e cada
 * um tem uma acao diferente -- e a resposta para "mudei o periodo e a tabela
 * de baixo nao encheu".
 *
 *   naGrade      equipamento no cadastro, marcado pra reformar e tag com
 *                coluna na familia dele: aparece na celula
 *   semDestino   equipamento no cadastro e tag com coluna, mas a unidade nao
 *                esta marcada "vai reformar" (Manutencao de Frota)
 *   semColuna    equipamento no cadastro, mas a tag do ERP nao corresponde a
 *                conjunto nenhum da familia (mapear em dados/reforma-bi-map.js)
 *   semCadastro  codigo de frota que nao existe em dados/frota-base.js --
 *                normalmente equipamento de outra unidade (CRV-GO); filtrar
 *                por empresa resolve, ou cadastrar a frota
 *   repetido     lancamento identico (mesmo equipamento, tag, descricao,
 *                valor, data e empresa) que aparece duas vezes no extrato: a
 *                grade conta uma vez so (itensReforma deduplica), a analise
 *                conta as duas. Fica em linha propria pra soma bater dos dois
 *                lados em vez de virar diferenca inexplicada
 */
function destinoDoGasto(lista){
  const grupo = {naGrade:[], semDestino:[], semColuna:[], semCadastro:[], repetido:[]};
  const vistos = new Set();
  lista.forEach(l=>{
    if(!l.esp){ grupo.semCadastro.push(l); return; }
    const fam = familiaReforma(l.esp);
    const temColuna = (conjuntosDe(l.esp) || []).some(c => (tagsBiDoConjunto(fam, c) || []).map(normTag).includes(l.compartimento));
    if(!temColuna){ grupo.semColuna.push(l); return; }
    if(destinoDe(l.frota) !== "reforma"){ grupo.semDestino.push(l); return; }
    const chave = chaveItemReforma(l.frota, l.compartimento, l);
    if(vistos.has(chave)){ grupo.repetido.push(l); return; }
    vistos.add(chave);
    grupo.naGrade.push(l);
  });
  const resumo = k => ({n: grupo[k].length, valor: grupo[k].reduce((s,l)=>s+l.valor,0)});
  const porChave = (lista, f) => {
    const m = new Map();
    lista.forEach(l=>{ const k = f(l); m.set(k, (m.get(k) || 0) + l.valor); });
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  };
  return {
    total: lista.reduce((s,l)=>s+l.valor,0),
    naGrade: resumo("naGrade"), semDestino: resumo("semDestino"), repetido: resumo("repetido"),
    semColuna: {...resumo("semColuna"), tags: porChave(grupo.semColuna, l=>l.esp+" · "+l.compartimento)},
    semCadastro: {...resumo("semCadastro"), frotas: porChave(grupo.semCadastro, l=>String(l.frota))},
  };
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

export { reforma, refDe, totalUnidade, valorConjunto, realDe, chaveItemReforma, destinoDoGasto, orcamentoProdutos, qtdProdutos,
  itensExcluidosReforma, itensIncluidosReforma, itensReforma };

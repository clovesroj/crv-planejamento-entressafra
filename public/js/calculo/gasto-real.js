import { CFG } from '../dados/cfg.js';
import { GASTO_REFORMA_BI } from '../dados/gasto-reforma-bi.js';
import { PRODUTO_GENERICO, SISTEMAS_PRODUTO } from '../dados/sistemas-manutencao.js';

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

// Índice cod -> seus próprios lançamentos (todo compartimento), pra busca por
// equipamento (ex.: preencher à mão um conjunto sem gasto real mapeado,
// olhando os lançamentos do próprio equipamento em outras tags do ERP).
let porFrotaIdx = null;
function itensDoEquipamento(cod) {
  if (!porFrotaIdx) {
    porFrotaIdx = new Map();
    for (const l of lancamentos()) {
      const k = String(l.frota);
      const arr = porFrotaIdx.get(k);
      if (arr) arr.push(l); else porFrotaIdx.set(k, [l]);
    }
  }
  return porFrotaIdx.get(String(cod)) || [];
}

/* ================== PRODUTO E SISTEMA ==================
   A descricao do ERP vem com a tag no fim (*RODANTE*, *HIDRAULICA*) e com
   espaco nao-separavel no lugar do espaco. `produtoDe` devolve o nome do
   produto limpo, que e o que se agrupa para orcar; `sistemaDoProduto` diz de
   que sistema aquele produto e, pela descricao — e nao pela tag, que e de quem
   apontou e as vezes erra (mangueira hidraulica lancada em ADMISSAO). */
const semAcento = t => String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const normaliza = t => semAcento(t).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toUpperCase();

/** Nome do produto, sem a tag do ERP no fim e sem espaco duplicado. */
function produtoDe(desc){
  return normaliza(String(desc||"").replace(/\*[^*]*\*\s*$/, ""));
}
/** Sistema do PRODUTO, ou null quando o nome nao decide (parafuso, porca...). */
function sistemaDoProduto(desc){
  const n = produtoDe(desc);
  if(!n) return null;
  const achado = SISTEMAS_PRODUTO.find(s => s.tem.some(t => n.includes(t)));
  if(achado) return achado.sistema;
  return null;
}
/** true quando o nome do produto e generico demais para dizer o sistema. */
function produtoGenerico(desc){
  const n = produtoDe(desc);
  return PRODUTO_GENERICO.some(g => n.startsWith(g));
}
/** Sistema que vale para o lancamento: o do produto quando ele decide, senao a tag do ERP. */
function sistemaDoLancamento(l){
  return sistemaDoProduto(l.desc) || normaliza(l.compartimento);
}

/**
 * Produtos que um equipamento usou num periodo, agrupados pelo NOME do produto.
 * `desde` recorta a janela (padrao: os ultimos 12 meses de dado disponivel, que
 * e o que se usa para orcar a proxima safra). `sistema`, quando vem, filtra
 * pelo sistema DO PRODUTO — e por isso que a mangueira lancada em ADMISSAO
 * aparece no compartimento de hidraulica.
 */
function produtosDoEquipamento(cod, {desde = null, sistema = null, sistemas = null} = {}){
  // `sistemas` aceita a lista de tags do conjunto (ver tagsBiDoConjunto): na
  // frota geral o nome do conjunto e da planilha e a tag e do ERP, entao
  // comparar so pelo nome do conjunto nao acharia nada
  const alvo = sistemas ? sistemas.map(normaliza) : sistema ? [normaliza(sistema)] : null;
  const m = new Map();
  itensDoEquipamento(cod).forEach(l=>{
    if(desde && l.data < desde) return;
    const sis = sistemaDoLancamento(l);
    if(alvo && !alvo.includes(sis)) return;
    const nome = produtoDe(l.desc);
    const o = m.get(nome) || {produto:nome, sistema:sis, porProduto: sistemaDoProduto(l.desc) != null,
                              tags:new Set(), vezes:0, total:0, ultima:"", generico: produtoGenerico(l.desc)};
    o.vezes++; o.total += l.valor; o.tags.add(l.compartimento);
    if(l.data > o.ultima) o.ultima = l.data;
    m.set(nome, o);
  });
  return [...m.values()]
    .map(o=>({...o, tags:[...o.tags], media: o.vezes > 0 ? o.total / o.vezes : 0}))
    .sort((a,b)=> b.total - a.total);
}

/** Data de corte dos ultimos 12 meses de dado disponivel na extracao. */
function desdeUltimoAno(){
  const datas = lancamentos().map(l=>l.data).filter(Boolean);
  if(!datas.length) return null;
  const fim = datas.reduce((a,b)=> a > b ? a : b);
  const d = new Date(fim + "T00:00:00");
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0,10);
}

export { lancamentos, filtrarLancamentos, agruparPor, opcoesDe, infoDeCod, itensDoEquipamento,
         produtoDe, produtoGenerico, produtosDoEquipamento, sistemaDoLancamento, sistemaDoProduto, desdeUltimoAno };

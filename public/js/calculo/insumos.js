import { CFG } from '../dados/cfg.js';
import { INSUMO, P, TRATC, insLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== INSUMOS E TRATAMENTOS ================== */
function precoInsumo(prod){
  const ov = INSUMO[prod];
  const base = ov && ov.preco!=null ? num(ov.preco)
             : num((insLista().find(i=>i.prod===prod)||{preco:0}).preco);
  return base * (1 + P.ipreco/100);
}
function tratCodigos(){
  const s = new Set(CFG.trat_det.map(t=>t.trat));
  Object.keys(TRATC).forEach(c=>s.add(c));
  return [...s].sort();
}
// composição de um tratamento: a customizada, se existir; senão a base do cadastro
function composicao(cod){
  if(TRATC[cod]) return TRATC[cod];
  return CFG.trat_det.filter(t=>t.trat===cod).map(t=>({prod:t.prod,dose:num(t.dose),un:t.un||""}));
}
// destrava a composição para edição (copia a base uma única vez)
function destravar(cod){
  if(!TRATC[cod]) TRATC[cod] = composicao(cod).map(l=>({...l}));
  return TRATC[cod];
}
let _tratCache = null, _tratKey = "";
function tratTabela(){
  // A chave precisa ter tudo que o cálculo lê. precoInsumo() cai no cadastro
  // editável (insLista) quando não há preço sobrescrito em INSUMO — sem ele na
  // chave, renomear um produto e desfazer deixava o custo velho preso no cache.
  const key = P.ipreco + "|" + JSON.stringify(INSUMO) + "|" + JSON.stringify(TRATC)
            + "|" + JSON.stringify(insLista());
  if(_tratCache && _tratKey===key) return _tratCache;
  const m = {};
  tratCodigos().forEach(cod=>{
    m[cod] = composicao(cod).reduce((s,l)=>s + num(l.dose)*precoInsumo(l.prod), 0);
  });
  _tratCache = m; _tratKey = key;
  return m;
}
function tratCusto(cod){ return cod ? (tratTabela()[cod]||0) : 0; }
function tratLista(){
  const m = tratTabela();
  return Object.entries(m).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([cod,v])=>({cod, custo_ha:v}));
}
// volume de cada produto projetado pela alocação real dos tratamentos no plano operacional
function volumeDemandado(L){
  const v = {};
  L.forEach(r=>{
    if(!r.trat || !r.ehHa || r.total<=0) return;
    composicao(r.trat).forEach(l=>{ v[l.prod]=(v[l.prod]||0)+r.total*num(l.dose); });
  });
  return v;
}


export { _tratCache, _tratKey, composicao, destravar, precoInsumo, tratCodigos, tratCusto, tratLista, tratTabela, volumeDemandado };

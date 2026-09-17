import { CFG } from '../dados/cfg.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { INSUMO, P, PLANO, TRATC, TRAT_DEL, TRAT_ETAPA, TRAT_NOME, insLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== INSUMOS E TRATAMENTOS ================== */

/* ---------- cadastro de insumos: mesclar o que veio da base ----------
   O cadastro de insumos e editavel, entao mora no documento salvo (INSX). Isso
   tem um efeito: documento gravado antes de a base crescer nunca ve os produtos
   novos, porque o documento manda. Daí esta mesclagem, chamada na leitura do
   documento e pelo botao da aba Insumos.

   A regra e a do cadastro: produto que falta entra; produto que ja esta recebe
   so o campo tecnico que estiver vazio; nome, preco e estoque que o usuario
   ajustou ficam como estao; produto que existe no documento e nao existe na
   base fica onde esta. */
const CAMPOS_TEC = ["pa","cod","un","conc","classe","categ","form","modo","mec","grupo",
                    "fab","tox","culturas","estadio","status","obs","base"];
// compara nome de produto sem depender de acento, caixa ou pontuacao
function chaveProd(v){
  return String(v==null?"":v).normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^A-Za-z0-9]+/g," ").trim().toUpperCase();
}
function mesclarBaseInsumos(){
  const lista = insLista();
  const jaTem = new Map(lista.map(i=>[chaveProd(i.prod), i]));
  let novos = 0, completados = 0;
  CFG.insumos.forEach(base=>{
    const atual = jaTem.get(chaveProd(base.prod));
    if(!atual){ lista.push({...base}); novos++; return; }
    let mudou = false;
    CAMPOS_TEC.forEach(k=>{ if(base[k] && !atual[k]){ atual[k]=base[k]; mudou=true; } });
    if(mudou) completados++;
  });
  return {novos, completados, total:lista.length};
}
function precoInsumo(prod){
  const ov = INSUMO[prod];
  const base = ov && ov.preco!=null ? num(ov.preco)
             : num((insLista().find(i=>i.prod===prod)||{preco:0}).preco);
  return base * (1 + P.ipreco/100);
}
function tratCodigos(){
  const s = new Set(CFG.trat_det.map(t=>t.trat));
  Object.keys(TRATC).forEach(c=>s.add(c));
  // tratamento removido some da lista, inclusive quando vinha do cadastro base
  return [...s].filter(c=>!TRAT_DEL[c]).sort();
}
// composição de um tratamento: a customizada, se existir; senão a base do cadastro
function composicao(cod){
  if(TRAT_DEL[cod]) return [];
  if(TRATC[cod]) return TRATC[cod];
  return CFG.trat_det.filter(t=>t.trat===cod).map(t=>({prod:t.prod,dose:num(t.dose),un:t.un||""}));
}

/* ---------- etapas do tratamento ----------
   Em que etapa do plano o tratamento é usado. É marcação do usuário; quando
   não há marca, quem usa a informação cai na etapa das atividades que
   carregam o tratamento no Plano Operacional. */
function tratEtapas(cod){
  const v = TRAT_ETAPA[cod];
  return Array.isArray(v) ? v.filter(e=>TRAT_ETAPAS[e]) : [];
}
// etapa de uma atividade no vocabulário dos tratamentos
function etapaTrat(a){
  if(a.etapa==="PREPARO DE SOLO") return "preparo";
  if(a.etapa==="PLANTIO")         return "plantio";
  if(a.etapa==="TRATOS CULTURAIS")return a.cultura==="Planta" ? "planta" : "soca";
  if(a.etapa==="COLHEITA")        return "colheita";
  return "apoio";
}
// etapas em que o plano de fato usa o tratamento
function etapasNoPlano(cod){
  const s = new Set();
  CFG.atividades.forEach(a=>{ const p=PLANO[a.cod];
    if(p && p.trat===cod) s.add(etapaTrat(a)); });
  return [...s];
}
function marcarEtapa(cod, etapa, ligada){
  if(!TRAT_ETAPAS[etapa]) return;
  const atual = new Set(tratEtapas(cod));
  if(ligada) atual.add(etapa); else atual.delete(etapa);
  TRAT_ETAPA[cod] = Object.keys(TRAT_ETAPAS).filter(e=>atual.has(e));
}

/* ---------- cadastro de tratamentos: incluir, remover, renomear ---------- */
// atividades do plano que usam o tratamento
function usosTrat(cod){
  return CFG.atividades.filter(a=>{ const p=PLANO[a.cod]; return p && p.trat===cod; }).map(a=>a.cod);
}
function criarTrat(cod){
  const c = String(cod||"").trim();
  if(!c || tratCodigos().includes(c)) return false;
  delete TRAT_DEL[c];
  TRATC[c] = [];          // existe como código, ainda sem produtos
  return true;
}
function removerTrat(cod){
  delete TRATC[cod]; delete TRAT_NOME[cod]; delete TRAT_ETAPA[cod];
  // código que vem do cadastro base precisa de marca para deixar de existir
  if(CFG.trat_det.some(t=>t.trat===cod)) TRAT_DEL[cod] = true;
  Object.values(PLANO).forEach(p=>{ if(p.trat===cod) p.trat = ""; });
}
// renomear leva composição, nome, etapas e as atividades que já apontavam para o código
function renomearTrat(de, para){
  const novo = String(para||"").trim();
  if(!novo || novo===de) return false;
  if(tratCodigos().includes(novo)) return false;
  TRATC[novo] = composicao(de).map(l=>({...l}));
  delete TRATC[de]; delete TRAT_DEL[novo];
  if(TRAT_NOME[de]!=null){ TRAT_NOME[novo]=TRAT_NOME[de]; delete TRAT_NOME[de]; }
  if(TRAT_ETAPA[de]){ TRAT_ETAPA[novo]=TRAT_ETAPA[de]; delete TRAT_ETAPA[de]; }
  if(CFG.trat_det.some(t=>t.trat===de)) TRAT_DEL[de] = true;
  Object.values(PLANO).forEach(p=>{ if(p.trat===de) p.trat = novo; });
  return true;
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
            + "|" + JSON.stringify(TRAT_DEL) + "|" + JSON.stringify(insLista());
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
/* Todos os tratamentos, inclusive os que ainda não têm produto: é o que o
   cadastro precisa mostrar, e o que o Plano Operacional precisa oferecer para
   um tratamento recém-criado poder ser vinculado a uma atividade. */
function tratListaTodos(){
  const m = tratTabela();
  return tratCodigos().map(cod=>({cod, custo_ha:m[cod]||0}))
    .sort((a,b)=>b.custo_ha-a.custo_ha || a.cod.localeCompare(b.cod));
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


export { _tratCache, _tratKey, composicao, criarTrat, destravar, etapaTrat, etapasNoPlano, mesclarBaseInsumos,
  marcarEtapa, precoInsumo, removerTrat, renomearTrat, tratCodigos, tratCusto, tratEtapas,
  tratLista, tratListaTodos, tratTabela, usosTrat, volumeDemandado };

import { CFG } from '../dados/cfg.js';
import { CLASSES_GRUPO, FAMILIAS_INSUMO, TRAT_ETAPAS } from '../dados/insumos.js';
import { FAM_CLASSE, FAM_NOME, INSUMO, P, PLANO, TRATC, TRAT_DEL, TRAT_ETAPA, TRAT_NOME, insLista, gruposInsLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { fatorParaBase } from '../nucleo/unidades.js';

/* ================== INSUMOS E TRATAMENTOS ================== */

/* ---------- familia de um insumo ----------
   Reduz o texto livre de `classe` a uma das familias de FAMILIAS_INSUMO. Vale o
   primeiro termo que casar, na ordem do catalogo -- e la que a ordem do
   desempate esta documentada. Classe vazia ou desconhecida cai em "outros", que
   e o bloco que pede cadastro, nao um erro. */
/* Familia de um produto, ja com a escolha manual.
   `fam` e uma escolha do usuario e vence a deducao pela classe: a classe e texto
   livre vindo da planilha, e vai haver produto cujo texto nao diz a familia que
   a usina usa. Vazio volta a deduzir, que e o padrao -- assim o produto novo
   entra no bloco certo sem ninguem ter de escolher. */
// aplica nome e classe que o usuário ajustou num grupo FIXO do cadastro
function comNomeFixo(f){
  const nome = FAM_NOME[f.id] || f.nome;
  const classeGrupo = FAM_CLASSE[f.id] != null ? FAM_CLASSE[f.id] : f.classeGrupo;
  return (nome===f.nome && classeGrupo===f.classeGrupo) ? f : {...f, nome, classeGrupo};
}

function familiaDoInsumo(i){
  const esc = (i && i.fam || "").trim();
  if(esc){
    const f = FAMILIAS_INSUMO.find(x => x.id === esc);
    if(f) return comNomeFixo(f);
    const g = gruposInsLista().find(x => x.id === esc);
    if(g) return g;
  }
  return familiaDe(i && i.classe);
}

function familiaDe(classe){
  const c = (classe || "").toLowerCase();
  const f = !c ? FAMILIAS_INSUMO[FAMILIAS_INSUMO.length - 1]
    : FAMILIAS_INSUMO.find(f => f.termos.some(t => c.includes(t))) || FAMILIAS_INSUMO[FAMILIAS_INSUMO.length - 1];
  return comNomeFixo(f);
}

/* Todos os grupos que um insumo pode receber: os fixos do cadastro (com
   "outros" por último, o bloco que pede cadastro) e os criados pelo usuário na
   aba Configurações, encaixados antes de "outros" -- um grupo novo é sempre
   uma escolha manual, nunca o destino automático de uma classe. */
function todasFamilias(){
  const base = FAMILIAS_INSUMO.slice(0, -1).map(comNomeFixo);
  const outros = comNomeFixo(FAMILIAS_INSUMO[FAMILIAS_INSUMO.length - 1]);
  return [...base, ...gruposInsLista(), outros];
}

// identificador do grupo a partir do nome digitado: minúsculo, sem acento nem espaço
function idDeGrupo(nome){
  return String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
/* "Cada Palavra Maiúscula", exceto preposição/conjunção curta no meio da
   frase (regra usual de título em português) -- assim "fertilizantes
   foliares" e "FERTILIZANTES FOLIARES" viram o mesmo "Fertilizantes
   Foliares", não importa como a pessoa digitou. */
const PREPOSICOES_GRUPO = new Set(["e","de","da","do","das","dos","a","o","as","os","em","com","para","ou"]);
function tituloGrupo(nome){
  return String(nome || "").trim().split(/\s+/).map((p,i)=>{
    const baixo = p.toLowerCase();
    if(i>0 && PREPOSICOES_GRUPO.has(baixo)) return baixo;
    return baixo.charAt(0).toUpperCase()+baixo.slice(1);
  }).join(" ");
}
/** Cria um grupo de insumo novo. Falha se o nome estiver vazio ou já existir
    entre os grupos fixos ou os já criados. */
function criarGrupoInsumo(nome){
  const n = tituloGrupo(nome);
  if(!n) return {ok:false, erro:"informe um nome para o grupo"};
  const id = idDeGrupo(n);
  if(!id) return {ok:false, erro:"o nome precisa ter letras ou números"};
  if(FAMILIAS_INSUMO.some(f=>f.id===id) || gruposInsLista().some(f=>f.id===id)){
    return {ok:false, erro:"já existe um grupo com este nome"};
  }
  gruposInsLista().push({id, nome:n, classeGrupo:""});
  return {ok:true};
}
/** Renomeia qualquer grupo — fixo do cadastro ou criado pelo usuário. O
    identificador não muda — é por ele que cada insumo aponta para o grupo
    (campo `fam`) e que a classificação automática por classe agronômica
    funciona, então renomear não desvincula ninguém nem muda o que cai em
    cada bloco. Grupo fixo guarda o nome novo em FAM_NOME; grupo criado
    guarda no próprio registro, como sempre. */
function renomearGrupoInsumo(id, novoNome){
  const n = tituloGrupo(novoNome);
  if(!n) return {ok:false, erro:"informe um nome para o grupo"};
  if(FAMILIAS_INSUMO.some(f=>f.id===id)){
    FAM_NOME[id] = n;
    return {ok:true};
  }
  const g = gruposInsLista().find(f=>f.id===id);
  if(!g) return {ok:false, erro:"grupo não encontrado"};
  g.nome = n;
  return {ok:true};
}
/** Ajusta a classe (natureza) de um grupo — Químico, Mineral, Biológico...
    "" limpa e volta para "ainda não classificado". Mesma regra do nome: fixo
    guarda em FAM_CLASSE, criado guarda no próprio registro. */
function setClasseGrupo(id, classeGrupo){
  const c = String(classeGrupo || "").trim();
  if(c && !CLASSES_GRUPO.includes(c)) return {ok:false, erro:"classe inválida"};
  if(FAMILIAS_INSUMO.some(f=>f.id===id)){
    FAM_CLASSE[id] = c;
    return {ok:true};
  }
  const g = gruposInsLista().find(f=>f.id===id);
  if(!g) return {ok:false, erro:"grupo não encontrado"};
  g.classeGrupo = c;
  return {ok:true};
}
/** Remove um grupo criado pelo usuário. Os fixos do cadastro não saem daqui —
    removê-los deixaria produtos sem para onde ir. Grupo em uso por algum
    insumo também não sai: mude o grupo dos produtos antes. */
function removerGrupoInsumo(id){
  if(FAMILIAS_INSUMO.some(f=>f.id===id)){
    return {ok:false, erro:"este grupo é fixo do cadastro e não pode ser removido"};
  }
  const emUso = insLista().some(i=>(i.fam||"")===id);
  if(emUso) return {ok:false, erro:"grupo em uso — mude o grupo dos produtos antes de remover"};
  const lista = gruposInsLista();
  const ix = lista.findIndex(f=>f.id===id);
  if(ix<0) return {ok:false, erro:"grupo não encontrado"};
  lista.splice(ix,1);
  return {ok:true};
}

/* Cadastro de insumos quebrado por familia, e dentro dela em ordem alfabetica de
   principio ativo.

   Cada item carrega o `ix`, que e a posicao ORIGINAL em insLista(): e por ele
   que a edicao e a remocao acham a linha. Reordenar a exibicao sem carregar o
   indice faria o usuario editar um produto e mudar outro.

   Produto sem principio ativo vai para o fim do bloco, ordenado pelo nome
   comercial -- ordenar "" como se fosse um nome jogaria os incompletos para o
   topo, que e onde eles menos ajudam a achar o produto. */
function insumosPorFamilia(){
  const porFam = {};
  insLista().forEach((i, ix)=>{
    const f = familiaDoInsumo(i);
    (porFam[f.id] = porFam[f.id] || []).push({i, ix, pa: (i.pa || "").trim()});
  });
  const ord = (a, b) => {
    if(!a.pa !== !b.pa) return a.pa ? -1 : 1;          // sem princípio ativo por último
    const x = a.pa || a.i.prod || "", y = b.pa || b.i.prod || "";
    return x.localeCompare(y, "pt-BR", {sensitivity:"base", numeric:true})
        || (a.i.prod || "").localeCompare(b.i.prod || "", "pt-BR", {sensitivity:"base"});
  };
  return todasFamilias()
    .map(f => ({...f, itens: (porFam[f.id] || []).sort(ord)}))
    .filter(f => f.itens.length);
}

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
/* O código vira texto de tela, valor de <option>, atributo data-* e rótulo de
   relatório em quase cem lugares, quase todos sem escape. Os da base são letras,
   números, espaço e hífen; aceita-se também . _ / + ( ) % , — nada que feche
   aspa ou abra marcação. Até o código ser editável isso não importava. */
const COD_TRAT_OK = /^[\p{L}\p{N} ._\/+()%,-]{1,60}$/u;
function codigoTratValido(cod){ return COD_TRAT_OK.test(String(cod||"").trim()); }
function criarTrat(cod){
  const c = String(cod||"").trim();
  if(!codigoTratValido(c) || tratCodigos().includes(c)) return false;
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
  if(!novo || novo===de || !codigoTratValido(novo)) return false;
  if(tratCodigos().includes(novo)) return false;
  TRATC[novo] = composicao(de).map(l=>({...l}));
  delete TRATC[de]; delete TRAT_DEL[novo];
  if(TRAT_NOME[de]!=null){ TRAT_NOME[novo]=TRAT_NOME[de]; delete TRAT_NOME[de]; }
  if(TRAT_ETAPA[de]){ TRAT_ETAPA[novo]=TRAT_ETAPA[de]; delete TRAT_ETAPA[de]; }
  if(CFG.trat_det.some(t=>t.trat===de)) TRAT_DEL[de] = true;
  Object.values(PLANO).forEach(p=>{ if(p.trat===de) p.trat = novo; });
  return true;
}
/** Dose de uma linha de composição, convertida pra unidade do cadastro do
    insumo — a que o preço usa (precoInsumo). É o que permite dosar em kg/ha
    um produto comprado em ton (ou g/ha, ml/ha...) sem mexer no preço nem na
    dose que a pessoa lançou: o custo por hectare sai igual, só muda a unidade
    de digitação. Linha sem unidade própria, ou unidade igual à do cadastro,
    não converte — é o caso de toda linha de hoje, então nenhum custo já
    calculado muda com isto. */
function doseBase(l){
  const reg = insLista().find(i => i.prod === l.prod);
  return num(l.dose) * fatorParaBase(l.un, reg && reg.un);
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
    m[cod] = composicao(cod).reduce((s,l)=>s + doseBase(l)*precoInsumo(l.prod), 0);
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
    composicao(r.trat).forEach(l=>{ v[l.prod]=(v[l.prod]||0)+r.total*doseBase(l); });
  });
  return v;
}


export { _tratCache, _tratKey, codigoTratValido, composicao, criarGrupoInsumo, criarTrat, destravar, doseBase, etapaTrat, etapasNoPlano, familiaDe,
  familiaDoInsumo, insumosPorFamilia, mesclarBaseInsumos,
  marcarEtapa, precoInsumo, removerGrupoInsumo, removerTrat, renomearGrupoInsumo, renomearTrat, setClasseGrupo, todasFamilias, tratCodigos, tratCusto, tratEtapas,
  tratLista, tratListaTodos, tratTabela, usosTrat, volumeDemandado };

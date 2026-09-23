import { CFG } from '../dados/cfg.js';
import { APOIO, APOIO_FIXO, ARREND, ARR_PAR, ARR_RAT, ATVX, ATVX_V, BEN, CRM, DIESEL_MES, DIM, EDITADO, ENC, ESPOR, FAM_NOME, FAM_CLASSE, FORN, FORN_PAR, FROTA, CRM_ESP, MAQ, FROTA_UN, REAL, GRAT, GRUPOS_INS, INSUMO, INSX, INSX_V, MATX, NIV, P, PLANO, QUADRO, ADM, ADM_RAT, TERC_TAR, TERC_SUB, TPESS, TRATC, TRAT_ATIVO, TRAT_DEL, TRAT_ETAPA, TRAT_NOME, TRAT_OBS } from '../nucleo/estado.js';
import { setAPOIO, setAPOIO_FIXO, setARREND, setARR_PAR, setARR_RAT, setATVX, setATVX_V, setBEN, setCRM,
         setDIESEL_MES, setDIM, setEDITADO, setFAM_NOME, setFAM_CLASSE, setFORN, setFORN_PAR, setENC, setESPOR, setFROTA, setCRM_ESP, setMAQ, setFROTA_UN, setREAL, setGRAT, setGRUPOS_INS, setINSUMO,
         setINSX, setMATX, setNIV, setP, setPLANO, setQUADRO, setADM, setADM_RAT, setTERC_TAR, setTERC_SUB, setTPESS, setTRATC,
         setTRAT_ATIVO, setTRAT_DEL, setTRAT_ETAPA, setTRAT_NOME, setTRAT_OBS, setINSX_V } from '../nucleo/estado.js';
import { mesclarBaseInsumos } from '../calculo/insumos.js';
import { mesclarBaseAtividades } from '../calculo/atividade.js';
import { $, num } from '../nucleo/formato.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { claudeUse } from './arquivo.js';
import { PADRAO } from '../dados/padroes.js';


/* Locais deste modulo: o destino remoto em uso e o timer do debounce de gravacao. */
let REMOTO = null, saveTimer = null;
/* ---------- persistência ---------- */
// Todas as chaves do documento, sempre no valor atual desta sessão -- inclusive
// as que ela nunca tocou (nula ou vazia). Só estado() e alteracoes() leem isto
// direto; o resto do app usa estado().
function estadoCru(){
  return {P,PLANO,DIM,INSUMO,ESPOR,TRATC,TRAT_NOME,TRAT_OBS,TRAT_ETAPA,TRAT_DEL,TRAT_ATIVO,DIESEL_MES,ARREND,ARR_PAR,ARR_RAT,FORN,FORN_PAR,ENC,BEN,NIV,GRAT,APOIO,APOIO_FIXO,
          TERC_TAR,TERC_SUB,CRM,CRM_ESP,MAQ,FROTA_UN,REAL,MATX,INSX,INSX_V,ATVX,ATVX_V,FROTA,TPESS,QUADRO,ADM,ADM_RAT,GRUPOS_INS,FAM_NOME,FAM_CLASSE,FUN:CFG.funcoes.map(f=>f.sal),v:10};
}
const vazia = v => v==null || (typeof v==="object" && !Array.isArray(v) && Object.keys(v).length===0);
function estado(){
  const s = estadoCru();
  // Campos que esta sessão nunca tocou ficam nulos ou vazios em memória. Enviá-los
  // apagava no servidor o que outra sessão já tinha preenchido — por isso são omitidos.
  Object.keys(s).forEach(k=>{ if(vazia(s[k])) delete s[k]; });
  return s;
}
function setStatus(t,c){ $("#stxt").textContent=t; $("#sdot").className="dot "+(c||""); }

// Toast de confirmação: o chip "Salvo no servidor" no topo é discreto demais
// pra quem quer ter certeza de que aquela gravação específica chegou no
// banco -- aparece um instante e some sozinho, sem interromper nada. Só pra
// gravação de verdade no servidor (não pro rascunho no localStorage nem pro
// "sem permissão", que já tem aviso persistente próprio).
const MAX_TOASTS = 4;
function mostrarToast(texto){
  const cont = $("#toasts");
  if(!cont) return;
  while(cont.children.length >= MAX_TOASTS) cont.firstElementChild.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="dot"></span><span>${texto}</span>`;
  cont.appendChild(el);
  setTimeout(()=>{
    el.classList.add("toast-saindo");
    el.addEventListener("animationend", ()=>el.remove(), {once:true});
  }, 2600);
}

/* Base de gravação — o estado logo depois da primeira pintura com o plano
   carregado, e reajustada a cada gravação aceita (ver atualizarBaseComEnviado).
   Ao abrir, o app cria ou normaliza listas (arrendamentos, fornecedores,
   administrativo, salário de função nova) que ficam diferentes do documento
   salvo. Para um perfil que não edita essas abas, o servidor descarta e as
   devolve como ignoradas; isso não é tentativa do usuário e não pode virar
   aviso de "sem permissão". Só avisa do que mudou depois da base.

   A mesma base decide o que sai no fio (ver alteracoes()): só a chave que esta
   sessão de fato alterou desde a última gravação. O merge do servidor
   substitui a chave inteira, não mescla por dentro (o `||` do jsonb é só no
   primeiro nível — ver server/store/postgres.js) — mandar uma chave que a aba
   nunca tocou, só porque ela ficou não-vazia em algum momento (ex.: INSX
   carregado com o cadastro base assim que a tela precisa dele, mesmo sem abrir
   Insumos), apagava por cima o que outra sessão tivesse gravado nela depois.
   Foi assim que um cadastro de insumos inteiro se perdeu em 2026-09-22, com
   várias pessoas editando o mesmo plano ao mesmo tempo. */
let BASE_GRAVACAO = null;
const canonJSON = v => v===null || typeof v!=="object" ? JSON.stringify(v===undefined?null:v)
  : Array.isArray(v) ? "["+v.map(canonJSON).join(",")+"]"
  : "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonJSON(v[k])).join(",")+"}";
function valorDaChave(doc, k){ return k.startsWith("P.") ? (doc.P||{})[k.slice(2)] : doc[k]; }
function marcarBaseGravacao(){
  const e = estado(), base = {};
  Object.keys(e).forEach(k=>{
    if(k==="P") Object.keys(e.P).forEach(c=>{ base["P."+c] = canonJSON(e.P[c]); });
    else base[k] = canonJSON(e[k]);
  });
  BASE_GRAVACAO = base;
}
// sem base marcada (antes da primeira pintura), qualquer ignorado conta
const mudouDesdeBase = (doc, k) => !BASE_GRAVACAO || canonJSON(valorDaChave(doc,k)) !== (k in BASE_GRAVACAO ? BASE_GRAVACAO[k] : canonJSON(undefined));

/* Documento com só o que esta sessão de fato alterou desde a última gravação
   (ou desde a abertura, se ainda não gravou nada) -- é o que vai pro servidor
   a cada salvar(). Sem base marcada ainda (carregando), manda o estado
   inteiro: não há com o que comparar, e é a mesma situação de sempre no
   primeiro carregamento. */
function alteracoes(){
  if(!BASE_GRAVACAO) return estado();
  const cru = estadoCru(), doc = {v: cru.v};
  Object.keys(cru).forEach(k=>{
    if(k==="v") return;
    if(k==="P"){
      const pMudou = Object.keys(cru.P).some(c =>
        canonJSON(cru.P[c]) !== (("P."+c) in BASE_GRAVACAO ? BASE_GRAVACAO["P."+c] : canonJSON(undefined)));
      if(pMudou) doc.P = cru.P;
      return;
    }
    const base = k in BASE_GRAVACAO ? BASE_GRAVACAO[k] : canonJSON(undefined);
    // normaliza vazio (null, {} ou []) como "nunca tocado" pra comparar igual
    // à base — mas manda o valor cru quando muda, mesmo vazio: é a pessoa
    // esvaziando de propósito um campo que tinha conteúdo (ex.: apagar a
    // composição customizada de um tratamento), e isso precisa chegar.
    if(canonJSON(vazia(cru[k]) ? undefined : cru[k]) !== base) doc[k] = cru[k];
  });
  return doc;
}
/* Depois de uma gravação aceita, a base avança para o que foi de fato
   persistido -- assim a próxima só manda o que mudar dali pra frente, não a
   mesma chave de novo. Chave que o servidor ignorou (sem permissão) fica de
   fora: continua "diferente da base" de propósito, pra seguir tentando (e
   avisando) nas próximas gravações, em vez de desistir em silêncio. */
function atualizarBaseComEnviado(doc, ignorados){
  if(!BASE_GRAVACAO) return;
  const ignor = new Set(ignorados || []);
  Object.keys(doc).forEach(k=>{
    if(k==="v") return;
    if(k==="P"){
      Object.keys(doc.P).forEach(c=>{ if(!ignor.has("P."+c)) BASE_GRAVACAO["P."+c] = canonJSON(doc.P[c]); });
      return;
    }
    if(!ignor.has(k)) BASE_GRAVACAO[k] = canonJSON(doc[k]);
  });
}

/* Dois destinos remotos possíveis, mesma interface: a API deste servidor
   (hospedagem própria, ex.: Render) e o banco do Artifact da Claude. Falhando
   os dois, sobra o localStorage — que de todo modo já é gravado sempre como
   rascunho. */

async function pedirAPI(metodo, corpo){
  const r = await fetch("/api/plano", {
    method: metodo,
    headers: corpo ? {"content-type":"application/json"} : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if(!r.ok) throw new Error("/api/plano respondeu "+r.status);
  return r.json();
}

async function abrirServidor(){
  // Aberto como arquivo local (file://), não há servidor nenhum para consultar.
  if(location.protocol === "file:") return null;
  const r = await fetch("/api/health",{cache:"no-store"});
  if(!r.ok) return null;
  // Exigir a assinatura no corpo distingue o servidor de verdade de uma
  // hospedagem estática que devolve o index.html em toda rota, com status 200.
  const h = await r.json();
  if(!h || h.servico !== "crv-planejamento-entressafra") return null;
  return {
    duravel: h.duravel !== false,
    async ler(){ const d = await pedirAPI("GET"); return d.existe ? d.data : null; },
    mesclar: e => pedirAPI("PATCH", e),
    substituir: e => pedirAPI("PUT", e),
    // fetch() é abortado quando a aba fecha; o sendBeacon o navegador entrega
    // depois, e é por isso que a API aceita POST além de PATCH.
    beacon(e){
      if(!navigator.sendBeacon) return false;
      return navigator.sendBeacon("/api/plano",
        new Blob([JSON.stringify(e)],{type:"application/json"}));
    }
  };
}

async function abrirArtifact(){
  const ns = await claudeUse("db");
  if(!ns) return null;
  const doc = ns.doc("plano/atual");
  return {
    duravel: true,
    async ler(){ const d = await doc.get(); return d && d.exists ? d.data() : null; },
    // update() mescla campo a campo; se o documento ainda não existe, set() o cria.
    async mesclar(e){ try{ await doc.update(e); }catch(err){ await doc.set(e); } },
    substituir: e => doc.set(e)
  };
}

function statusRemoto(texto){
  setStatus(REMOTO.duravel ? texto : texto+" (temporário)", REMOTO.duravel ? "" : "warn");
}

async function carregar(){
  for(const abrir of [abrirServidor, abrirArtifact]){
    try{
      REMOTO = await abrir();
      if(!REMOTO) continue;
      const d = await REMOTO.ler();
      // se o usuário já começou a editar enquanto isto ainda carregava, não pisar na edição dele
      if(d && !EDITADO) aplicar(d);
      if(!EDITADO) await recuperarPendente(d);
      statusRemoto(d ? "Salvo no servidor" : "Pronto — salva no servidor");
      return;
    }catch(e){ REMOTO = null; }
  }
  try{
    const raw = localStorage.getItem("crv_plano_v10");
    const local = raw ? JSON.parse(raw) : null;
    if(!EDITADO && local) aplicar(local);
    if(!EDITADO) await recuperarPendente(local);
    setStatus("Salvo neste navegador","warn");
  }catch(e){ setStatus("Sem salvamento","off"); }
}
function aplicar(d){
  if(!d) return;
  // o banco entrega o documento congelado (somente leitura): editar direto nele falhava
  // em silêncio e toda alteração "voltava ao original" — trabalhar sempre numa cópia
  d = JSON.parse(JSON.stringify(d));
  d = migrarJanela(d);   // documento de 9 meses -> janela de 12 meses
  // setX() em vez de X=... : um modulo nao pode atribuir a um binding importado.
  // O efeito e o mesmo — quem importa X passa a enxergar o valor novo.
  if(d.P) setP({...PADRAO,...d.P});
  if(d.PLANO) setPLANO(d.PLANO);
  if(d.DIM) setDIM(d.DIM);
  if(d.INSUMO) setINSUMO(d.INSUMO);
  if(d.ESPOR) setESPOR(d.ESPOR);
  if(d.TRATC) setTRATC(d.TRATC);
  if(d.TRAT_NOME) setTRAT_NOME(d.TRAT_NOME);
  if(d.TRAT_OBS) setTRAT_OBS(d.TRAT_OBS);
  if(d.TRAT_ETAPA) setTRAT_ETAPA(d.TRAT_ETAPA);
  if(d.TRAT_DEL) setTRAT_DEL(d.TRAT_DEL);
  if(d.TRAT_ATIVO) setTRAT_ATIVO(d.TRAT_ATIVO);
  if(d.DIESEL_MES) setDIESEL_MES(d.DIESEL_MES);
  if(d.ARREND) setARREND(d.ARREND);
  if(d.ARR_PAR) setARR_PAR(d.ARR_PAR);
  if(d.ARR_RAT) setARR_RAT(d.ARR_RAT);
  if(d.FORN) setFORN(d.FORN);
  if(d.FORN_PAR) setFORN_PAR(d.FORN_PAR);
  if(d.ENC) setENC(d.ENC);
  if(d.BEN) setBEN(d.BEN);
  if(d.NIV) setNIV(d.NIV);
  if(d.GRAT) setGRAT(d.GRAT);
  if(d.APOIO) setAPOIO(d.APOIO);
  if(d.APOIO_FIXO) setAPOIO_FIXO(d.APOIO_FIXO);
  if(d.TERC_TAR) setTERC_TAR(d.TERC_TAR);
  if(d.TERC_SUB) setTERC_SUB(d.TERC_SUB);
  if(d.CRM) setCRM(d.CRM);
  if(d.CRM_ESP) setCRM_ESP(d.CRM_ESP);
  if(d.MAQ) setMAQ(d.MAQ);
  if(d.FROTA_UN) setFROTA_UN(d.FROTA_UN);
  if(d.REAL) setREAL(d.REAL);
  if(d.MATX) setMATX(d.MATX);
  if(d.INSX) setINSX(d.INSX);
  setINSX_V(d.INSX_V);
  /* Cadastro de insumos gravado antes de a base crescer nao conhece os produtos
     novos — o documento manda sobre CFG.insumos. Mescla uma vez por versao da
     base: produto que falta entra, campo tecnico vazio se completa, e o que o
     usuario ajustou (nome, preco, estoque) fica como esta. Uma vez por versao,
     para que produto removido de proposito nao volte na leitura seguinte. */
  if(d.INSX && INSX_V < CFG.insumos_v){
    const r = mesclarBaseInsumos();
    setINSX_V(CFG.insumos_v);
    if(r.novos || r.completados)
      console.info(`cadastro de insumos atualizado: +${r.novos} produto(s), ${r.completados} completado(s), ${r.total} no total`);
  } else if(!d.INSX) setINSX_V(CFG.insumos_v);
  if(d.ATVX) setATVX(d.ATVX);
  setATVX_V(d.ATVX_V);
  // mesmo mecanismo do cadastro de insumos, para atividade nova do codigo base
  if(d.ATVX && ATVX_V < CFG.atividades_v){
    const r = mesclarBaseAtividades();
    setATVX_V(CFG.atividades_v);
    if(r.novas || r.corrigidas)
      console.info(`cadastro de atividades atualizado: +${r.novas} atividade(s), ${r.corrigidas} corrigida(s), ${r.total} no total`);
  } else if(!d.ATVX) setATVX_V(CFG.atividades_v);
  if(d.GRUPOS_INS) setGRUPOS_INS(d.GRUPOS_INS);
  if(d.FAM_NOME) setFAM_NOME(d.FAM_NOME);
  if(d.FAM_CLASSE) setFAM_CLASSE(d.FAM_CLASSE);
  if(d.FROTA) setFROTA(d.FROTA);
  if(d.TPESS) setTPESS(d.TPESS);
  if(d.QUADRO) setQUADRO(d.QUADRO);
  if(d.ADM) setADM(d.ADM);
  if(d.ADM_RAT) setADM_RAT(d.ADM_RAT);
  if(d.FUN) d.FUN.forEach((s,i)=>{ if(CFG.funcoes[i]) CFG.funcoes[i].sal=s; });
}
/* ---------------------------------------------------------------------------
   Migração da janela do orçamento.
   Até 2026-09-16 o plano tinha 9 meses (Out/26 a Jun/27); passou a ter os 12
   do ano agrícola (Abr/26 a Mar/27). Documento gravado antes disso traz vetor
   de 9 posições, e a posição 0 não é mais o mesmo mês. O remapeamento é pelo
   NOME do mês, não pelo índice. Abr/27, Mai/27 e Jun/27 não existem na janela
   nova: o valor vai para o mesmo mês do ano anterior (Abr/26, Mai/26, Jun/26),
   que é o mês equivalente dentro do novo ano agrícola — assim nada se perde.
   O formato antigo só se reconhece pelo PLANO, então PLANO, DIESEL_MES e ARREND
   precisam ser gravados juntos. Perfil que não grava todos os três teria o
   documento salvo metade em cada formato; o servidor completa a migração nesse
   caso com a mesma regra (server/janela.js). Mudou aqui, mude lá.
   --------------------------------------------------------------------------- */
const MESES_9 = ["Out/26","Nov/26","Dez/26","Jan/27","Fev/27","Mar/27","Abr/27","Mai/27","Jun/27"];
function idxMes(rotulo){
  const i = MESES.indexOf(rotulo);
  if(i >= 0) return i;
  return MESES.findIndex(m => m.slice(0,3) === String(rotulo).slice(0,3));
}
function migrarJanela(d){
  const precisa = Object.values(d.PLANO || {}).some(v => Array.isArray(v.m) && v.m.length === MESES_9.length);
  if(!precisa) return d;
  const remapa = velho => {
    const novo = Array(NM).fill(0);
    MESES_9.forEach((rotulo,i)=>{
      const j = idxMes(rotulo);
      if(j >= 0) novo[j] += num(velho[i]);
    });
    return novo;
  };
  Object.values(d.PLANO || {}).forEach(v=>{
    if(Array.isArray(v.m) && v.m.length === MESES_9.length) v.m = remapa(v.m);
  });
  if(d.DIESEL_MES){
    const dm = {};
    Object.entries(d.DIESEL_MES).forEach(([k,v])=>{
      const j = idxMes(MESES_9[+k]); if(j >= 0) dm[j] = v;
    });
    d.DIESEL_MES = dm;
  }
  (d.ARREND || []).forEach(a=>{
    if(a.mes != null && +a.mes >= 0 && +a.mes < MESES_9.length) a.mes = idxMes(MESES_9[+a.mes]);
    if(Array.isArray(a.pmes))
      a.pmes = a.pmes.map(i=>idxMes(MESES_9[+i])).filter(i=>i>=0).sort((x,y)=>x-y);
  });
  (d.ESPOR || []).forEach(e=>{
    if(e.mes && MESES.indexOf(e.mes) < 0){ const j = idxMes(e.mes); e.mes = MESES[j >= 0 ? j : 0]; }
  });
  return d;
}
let salvePendente = false;

/* ===== Alteracao pendente, que sobrevive ao recarregar =====
   Gravar e assincrono: entre "o debounce disparou" e "o servidor respondeu" ha
   uma janela em que a alteracao so existe no ar. Recarregar a pagina nessa
   janela cancelava o fetch e a alteracao sumia -- a tela voltava com o valor
   antigo, como se nada tivesse sido feito. Era assim que uma celula apagada no
   Plano Operacional "voltava" depois do F5.

   Aqui a alteracao fica marcada no localStorage ANTES de ir ao fio e so sai de
   la quando o servidor confirma. Na abertura seguinte, o que ficou pendente e
   reaplicado por cima do documento do servidor e reenviado. Cobre tambem o
   beacon recusado (payload grande demais), a rede fora e a aba fechada no meio.

   E o mesmo recorte que uma gravacao normal manda (so as chaves que esta
   sessao mudou), entao o risco de pisar em outra sessao nao muda. */
const CHAVE_PEND = "crv_plano_pendente";
const VALIDADE_PEND = 7*24*60*60*1000;   // uma semana: pendencia mais velha que isso e lixo
function marcarPendente(doc){
  try{ localStorage.setItem(CHAVE_PEND, JSON.stringify({ts:Date.now(), doc})); }catch(err){}
}
function limparPendente(){ try{ localStorage.removeItem(CHAVE_PEND); }catch(err){} }
function lerPendente(){
  try{
    const raw = localStorage.getItem(CHAVE_PEND);
    if(!raw) return null;
    const p = JSON.parse(raw);
    if(!p || !p.doc || !(Date.now() - (p.ts||0) < VALIDADE_PEND)){ limparPendente(); return null; }
    if(!Object.keys(p.doc).some(k=>k!=="v")){ limparPendente(); return null; }
    return p;
  }catch(err){ limparPendente(); return null; }
}
/* Reaplica e reenvia o que ficou pendente da sessao anterior. Roda dentro do
   carregar(), depois do documento do servidor.

   Primeiro compara: na maioria das vezes o envio anterior chegou (o beacon foi
   entregue) e o documento do servidor ja traz a alteracao -- ai a pendencia so
   e apagada, sem reenvio e sem aviso. So quando o servidor ainda NAO tem o que
   ficou pendente e que ele e reaplicado por cima, reenviado e anunciado: foi
   uma alteracao que a pessoa fez e que teria sumido. */
async function recuperarPendente(doServidor){
  const p = lerPendente();
  if(!p) return;
  const doc = doServidor || {};
  const faltando = Object.keys(p.doc).filter(k =>
    k !== "v" && canonJSON(valorDaChave(p.doc, k)) !== canonJSON(valorDaChave(doc, k)));
  if(!faltando.length){ limparPendente(); return; }
  aplicar(p.doc);
  if(!REMOTO) return;   // sem servidor, o rascunho local ja e o estado
  try{
    await REMOTO.mesclar(p.doc);
    limparPendente();
    mostrarToast("Alteração pendente da sessão anterior foi enviada");
  }catch(err){ /* fica marcada para a proxima abertura */ }
}

async function gravar(){
  // rascunho local: sempre o estado inteiro (é o que sobra se o banco perder
  // alguma coisa), sobrevive a fechar a aba no meio da gravação
  try{ localStorage.setItem("crv_plano_v10",JSON.stringify(estado())); }catch(err){}
  const doc = alteracoes();
  // nada mudou desde a última gravação (ex.: campo editado e desfeito antes do
  // debounce disparar) — não vale ir ao servidor só pra atualizar o relógio
  if(!Object.keys(doc).some(k=>k!=="v")){
    salvePendente = false; limparPendente();
    if(REMOTO) statusRemoto("Salvo no servidor"); else setStatus("Salvo neste navegador","warn");
    return;
  }
  // marca ANTES de ir ao fio: se a aba recarregar no meio, a alteração é
  // reaplicada e reenviada na abertura seguinte
  marcarPendente(doc);
  if(REMOTO){
    try{
      // sempre mescla, nunca substitui o documento inteiro: só manda quem de
      // fato mudou nesta sessão (ver alteracoes()), então o `||` do jsonb no
      // servidor só troca a chave que é realmente nova — o que outra aba ou
      // outra pessoa gravou em qualquer outra chave segue intocado.
      const resp = await REMOTO.mesclar(doc);
      // O servidor descarta o que o perfil não pode editar e devolve a lista.
      // Dizer só "salvo" esconderia que parte da alteração não entrou — mas só
      // conta o que o usuário mudou desde a última gravação (ver BASE_GRAVACAO).
      const ignorados = (resp && Array.isArray(resp.ignorados) ? resp.ignorados : []).filter(k=>mudouDesdeBase(doc,k));
      atualizarBaseComEnviado(doc, ignorados);
      salvePendente = false; limparPendente();
      if(ignorados.length){
        setStatus("Salvo — sem permissão para alterar: "+ignorados.slice(0,3).join(", ")
          +(ignorados.length>3?"…":""), "warn");
        return;
      }
      statusRemoto("Salvo no servidor");
      mostrarToast(REMOTO.duravel ? "Salvo no banco de dados" : "Salvo no servidor (temporário)");
      return;
    }catch(err){
      // O rascunho local acima já segurou a alteração; dizer que está tudo salvo
      // esconderia do usuário que os outros ainda não estão vendo o que ele digitou.
      // A pendência fica marcada: a próxima abertura reenvia.
      setStatus("Servidor fora — salvo neste navegador","warn"); return;
    }
  }
  // sem servidor, o rascunho local é o destino final — não há o que reenviar
  salvePendente = false; limparPendente();
  setStatus("Salvo neste navegador","warn");
}
function salvar(){
  setEDITADO(true); salvePendente = true;
  setStatus("Salvando…","warn");
  clearTimeout(saveTimer);
  saveTimer=setTimeout(gravar,700);
}
/* Sair da pagina com gravacao pendente perdia a alteracao — forca a gravacao
   antes. Nao pergunta mais por `salvePendente`: quando o debounce ja disparou,
   ele ja e false e a gravacao pode estar EM VOO, e o fetch em voo o navegador
   cancela ao navegar. Quem responde "ha algo a mandar?" e alteracoes(), que
   compara com a base e so avanca quando o servidor confirma. */
function flushSalvar(){
  clearTimeout(saveTimer);
  try{ localStorage.setItem("crv_plano_v10",JSON.stringify(estado())); }catch(err){}
  const doc = alteracoes(), temMudanca = Object.keys(doc).some(k=>k!=="v");
  if(!temMudanca) return;
  // marcada antes de tentar: beacon recusado (payload grande) ou fetch
  // cancelado pela navegacao deixam a alteracao para a proxima abertura
  marcarPendente(doc);
  // O navegador cancela um fetch() em curso quando a aba fecha; o sendBeacon ele
  // se encarrega de entregar. Só existe contra servidor próprio — no Artifact e
  // sem rede, gravar() faz o que dá. Otimista: sendBeacon só confirma que o
  // navegador aceitou entregar, não que o servidor já processou — mesmo grau
  // de certeza que salvePendente=false já assumia aqui antes desta mudança.
  if(REMOTO && REMOTO.beacon && REMOTO.beacon(doc)){
    atualizarBaseComEnviado(doc, []); salvePendente = false; return;
  }
  gravar();
}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushSalvar(); });
window.addEventListener("pagehide",flushSalvar);
window.addEventListener("blur",flushSalvar);


export { abrirArtifact, abrirServidor, aplicar, carregar, estado, flushSalvar, gravar, marcarBaseGravacao, pedirAPI, salvar, salvePendente, setStatus, statusRemoto };

import { CFG } from '../dados/cfg.js';
import { APOIO, APOIO_FIXO, ARREND, ARR_PAR, ARR_RAT, BEN, CRM, DIESEL_MES, DIM, EDITADO, ENC, ESPOR, FORN, FORN_PAR, FROTA, CRM_ESP, MAQ, FROTA_UN, GRAT, INSUMO, INSX, MATX, NIV, P, PLANO, QUADRO, TERC_TAR, TPESS, TRATC, TRAT_NOME } from '../nucleo/estado.js';
import { setAPOIO, setAPOIO_FIXO, setARREND, setARR_PAR, setARR_RAT, setBEN, setCRM,
         setDIESEL_MES, setDIM, setEDITADO, setFORN, setFORN_PAR, setENC, setESPOR, setFROTA, setCRM_ESP, setMAQ, setFROTA_UN, setGRAT, setINSUMO,
         setINSX, setMATX, setNIV, setP, setPLANO, setQUADRO, setTERC_TAR, setTPESS, setTRATC,
         setTRAT_NOME } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { claudeUse } from './arquivo.js';
import { PADRAO } from '../dados/padroes.js';


/* Locais deste modulo: o destino remoto em uso e o timer do debounce de gravacao. */
let REMOTO = null, saveTimer = null;
/* ---------- persistência ---------- */
function estado(){
  const s = {P,PLANO,DIM,INSUMO,ESPOR,TRATC,TRAT_NOME,DIESEL_MES,ARREND,ARR_PAR,ARR_RAT,FORN,FORN_PAR,ENC,BEN,NIV,GRAT,APOIO,APOIO_FIXO,
             TERC_TAR,CRM,CRM_ESP,MAQ,FROTA_UN,MATX,INSX,FROTA,TPESS,QUADRO,FUN:CFG.funcoes.map(f=>f.sal),v:10};
  // Campos que esta sessão nunca tocou ficam nulos ou vazios em memória. Enviá-los
  // apagava no servidor o que outra sessão já tinha preenchido — por isso são omitidos.
  Object.keys(s).forEach(k=>{
    const v = s[k];
    if(v==null) delete s[k];
    else if(typeof v==="object" && !Array.isArray(v) && Object.keys(v).length===0) delete s[k];
  });
  return s;
}
function setStatus(t,c){ $("#stxt").textContent=t; $("#sdot").className="dot "+(c||""); }

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
      statusRemoto(d ? "Salvo no servidor" : "Pronto — salva no servidor");
      return;
    }catch(e){ REMOTO = null; }
  }
  try{
    const raw = localStorage.getItem("crv_plano_v10");
    if(!EDITADO && raw) aplicar(JSON.parse(raw));
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
  if(d.CRM) setCRM(d.CRM);
  if(d.CRM_ESP) setCRM_ESP(d.CRM_ESP);
  if(d.MAQ) setMAQ(d.MAQ);
  if(d.FROTA_UN) setFROTA_UN(d.FROTA_UN);
  if(d.MATX) setMATX(d.MATX);
  if(d.INSX) setINSX(d.INSX);
  if(d.FROTA) setFROTA(d.FROTA);
  if(d.TPESS) setTPESS(d.TPESS);
  if(d.QUADRO) setQUADRO(d.QUADRO);
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
  });
  (d.ESPOR || []).forEach(e=>{
    if(e.mes && MESES.indexOf(e.mes) < 0){ const j = idxMes(e.mes); e.mes = MESES[j >= 0 ? j : 0]; }
  });
  return d;
}
let salvePendente = false;
async function gravar(full){
  salvePendente = false;
  const e = estado();
  // o rascunho local é gravado sempre e na hora: sobrevive a fechar a aba no meio da gravação
  try{ localStorage.setItem("crv_plano_v10",JSON.stringify(e)); }catch(err){}
  if(REMOTO){
    try{
      // mesclar() junta campo a campo — uma sessão nunca apaga o que outra preencheu.
      // substituir() só em "restaurar padrões", onde limpar campos é justamente a intenção.
      if(full) await REMOTO.substituir(e); else await REMOTO.mesclar(e);
      statusRemoto("Salvo no servidor"); return;
    }catch(err){
      // O rascunho local acima já segurou a alteração; dizer que está tudo salvo
      // esconderia do usuário que os outros ainda não estão vendo o que ele digitou.
      setStatus("Servidor fora — salvo neste navegador","warn"); return;
    }
  }
  setStatus("Salvo neste navegador","warn");
}
function salvar(full){
  setEDITADO(true); salvePendente = true;
  setStatus("Salvando…","warn");
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>gravar(full),700);
}
// sair da página com uma gravação pendente perdia a alteração — força a gravação antes
function flushSalvar(){
  if(!salvePendente) return;
  clearTimeout(saveTimer);
  const e = estado();
  try{ localStorage.setItem("crv_plano_v10",JSON.stringify(e)); }catch(err){}
  // O navegador cancela um fetch() em curso quando a aba fecha; o sendBeacon ele
  // se encarrega de entregar. Só existe contra servidor próprio — no Artifact e
  // sem rede, gravar() faz o que dá.
  if(REMOTO && REMOTO.beacon && REMOTO.beacon(e)){ salvePendente = false; return; }
  gravar(false);
}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushSalvar(); });
window.addEventListener("pagehide",flushSalvar);
window.addEventListener("blur",flushSalvar);


export { abrirArtifact, abrirServidor, aplicar, carregar, estado, flushSalvar, gravar, pedirAPI, salvar, salvePendente, setStatus, statusRemoto };

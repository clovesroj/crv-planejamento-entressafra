import { CFG } from '../dados/cfg.js';
import { APOIO, APOIO_FIXO, ARREND, ARR_PAR, ARR_RAT, BEN, CRM, DIESEL_MES, DIM, EDITADO, ENC, ESPOR, FROTA, GRAT, INSUMO, INSX, MATX, NIV, P, PLANO, TERC_TAR, TPESS, TRATC, TRAT_NOME } from '../nucleo/estado.js';
import { setAPOIO, setAPOIO_FIXO, setARREND, setARR_PAR, setARR_RAT, setBEN, setCRM,
         setDIESEL_MES, setDIM, setEDITADO, setENC, setESPOR, setFROTA, setGRAT, setINSUMO,
         setINSX, setMATX, setNIV, setP, setPLANO, setTERC_TAR, setTPESS, setTRATC,
         setTRAT_NOME } from '../nucleo/estado.js';
import { $ } from '../nucleo/formato.js';
import { claudeUse } from './arquivo.js';
import { PADRAO } from '../dados/padroes.js';


/* Locais deste modulo: o destino remoto em uso e o timer do debounce de gravacao. */
let REMOTO = null, saveTimer = null;
/* ---------- persistência ---------- */
function estado(){
  const s = {P,PLANO,DIM,INSUMO,ESPOR,TRATC,TRAT_NOME,DIESEL_MES,ARREND,ARR_PAR,ARR_RAT,ENC,BEN,NIV,GRAT,APOIO,APOIO_FIXO,
             TERC_TAR,CRM,MATX,INSX,FROTA,TPESS,FUN:CFG.funcoes.map(f=>f.sal),v:10};
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
  if(d.ENC) setENC(d.ENC);
  if(d.BEN) setBEN(d.BEN);
  if(d.NIV) setNIV(d.NIV);
  if(d.GRAT) setGRAT(d.GRAT);
  if(d.APOIO) setAPOIO(d.APOIO);
  if(d.APOIO_FIXO) setAPOIO_FIXO(d.APOIO_FIXO);
  if(d.TERC_TAR) setTERC_TAR(d.TERC_TAR);
  if(d.CRM) setCRM(d.CRM);
  if(d.MATX) setMATX(d.MATX);
  if(d.INSX) setINSX(d.INSX);
  if(d.FROTA) setFROTA(d.FROTA);
  if(d.TPESS) setTPESS(d.TPESS);
  if(d.FUN) d.FUN.forEach((s,i)=>{ if(CFG.funcoes[i]) CFG.funcoes[i].sal=s; });
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

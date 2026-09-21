import { premissaBase } from '../calculo/base-fisica.js';
import { P } from '../nucleo/estado.js';
import { $, fmt, num } from '../nucleo/formato.js';

const CAMPOS = ["dens","tch","plantio","haTratosPlanta","haTratosSoca","haColheita","tonColheita","arr_ha","hdia","disp","efic","dias","diasOper","diasTrab","hTurno",
"diesel","arr","imob","dep","ipreco","densCarga","volTransb","velC","velV","tCarga",
"tDesc","hDiaTr","dispTr","consTr","manutTr","raioSafra","raioMuda","perdaCarga","desnivel","rendBomba",
"kwh","fonte","hPorMec","eqPorAjud","colPorLider","tercAereaTar","tercSistTar","tercSistHa","tercOutros"];

function pintarPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e) e.value=P[k];}); }
// campo travado pelo perfil (data-travado) não é relido: lerPremissas() roda a cada
// edição de QUALQUER premissa, e sem isto recolheria campos de abas que o perfil não edita
function lerPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e && !e.dataset.travado) P[k]= (k==="fonte")?e.value:num(e.value);}); }


/* Dica embaixo de cada campo da base física: com o campo em branco, diz o que
   o sistema está usando no lugar — para ninguém achar que "vazio" é zero. */
function pintarBasesPremissas(R){
  const culturaHa = c => R.L.filter(r=>r.a.etapa==="TRATOS CULTURAIS" && (r.a.cultura||"Soca")===c && r.ehHa)
    .reduce((t,r)=>t+r.total, 0);
  const colh = R.etapas["COLHEITA"] || {};
  const dica = (id, txtVazio) => { const el = $("#h_"+id); if(!el) return;
    el.textContent = premissaBase(id==="haTratosPlanta"?"planta":id==="haTratosSoca"?"soca":
      id==="haColheita"?"colheitaHa":"colheita") ? "Informada — base dos custos unitários" : txtVazio; };
  dica("haTratosPlanta", "Em branco: usando a área de plantio ("+fmt(num(P.plantio))+" ha)");
  dica("haTratosSoca",   "Em branco: usando "+fmt(culturaHa("Soca"))+" ha operados nas atividades");
  dica("haColheita",     "Em branco: colheita só por tonelada");
  dica("tonColheita",    "Em branco: usando "+fmt(colh.ton||0)+" t lançadas na colheita");
}

export { CAMPOS, lerPremissas, pintarBasesPremissas, pintarPremissas };

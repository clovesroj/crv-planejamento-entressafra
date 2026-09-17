import { P } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';

const CAMPOS = ["dens","tch","plantio","arr_ha","hdia","disp","dias","diasOper","diasTrab","hTurno",
"diesel","arr","imob","dep","ipreco","densCarga","volTransb","velC","velV","tCarga",
"tDesc","hDiaTr","dispTr","consTr","manutTr","raioSafra","raioMuda","perdaCarga","desnivel","rendBomba",
"kwh","fonte","hPorMec","eqPorAjud","colPorLider","tercAereaTar","tercSistTar","tercSistHa","tercOutros"];

function pintarPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e) e.value=P[k];}); }
// campo travado pelo perfil (data-travado) não é relido: lerPremissas() roda a cada
// edição de QUALQUER premissa, e sem isto recolheria campos de abas que o perfil não edita
function lerPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e && !e.dataset.travado) P[k]= (k==="fonte")?e.value:num(e.value);}); }


export { CAMPOS, lerPremissas, pintarPremissas };

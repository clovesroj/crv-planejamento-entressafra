import { P } from '../nucleo/estado.js';
import { $, num } from '../nucleo/formato.js';

const CAMPOS = ["dens","tch","plantio","arr_ha","hdia","disp","dias","diasOper","diasTrab","hTurno",
"diesel","arr","adm","imob","dep","ipreco","densCarga","volTransb","velC","velV","tCarga",
"tDesc","hDiaTr","dispTr","consTr","manutTr","raioSafra","raioMuda","perdaCarga","desnivel","rendBomba",
"kwh","fonte","hPorMec","eqPorAjud","colPorLider","tercAereaTar","tercSistTar","tercSistHa","tercOutros"];

function pintarPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e) e.value=P[k];}); }
function lerPremissas(){ CAMPOS.forEach(k=>{const e=$("#p_"+k); if(e) P[k]= (k==="fonte")?e.value:num(e.value);}); }


export { CAMPOS, lerPremissas, pintarPremissas };

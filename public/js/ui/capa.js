import { P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi } from './componentes.js';
import { validar } from './validacao.js';

/* ---------- CAPA ---------- */
function pintarCapa(R){
  const prog=R.L.filter(r=>r.total>0).length, bad=validar(R).filter(v=>!v.ok).length;
  $("#k_capa").innerHTML =
    kpi("Custo total projetado","",brl(R.SEL.total), R.SEL.parcial?R.SEL.rotulo:"","total") +
    kpi("Custo por ha plantado","t",brl(R.SEL.total/(P.plantio||1)), R.SEL.parcial?R.SEL.rotulo:"","custoha") +
    kpi("Hectares operados","g",fmt(R.haOp)+" ha","","hect:total") +
    kpi("Efetivo total","a",fmt(R.efetivoTotal||0)+" pessoas","","pessoas:total");
  $("#capa_status").innerHTML = `
    <div class="statusrow">
      <span class="badge ${bad?'b-bad':'b-ok'}">${bad?bad+" pendência(s)":"Sem pendências"}</span>
      <span class="calc">${prog} de ${R.L.length} atividades programadas</span>
      <span class="calc">Frota: ${R.frotaT+R.TR.frota} equipamentos</span>
      <span class="calc">Insumos: ${brl(R.insumoT)}</span>
    </div>
    <div class="bar" style="margin-top:12px"><i style="width:${prog/R.L.length*100}%"></i></div>`;
}

export { pintarCapa };

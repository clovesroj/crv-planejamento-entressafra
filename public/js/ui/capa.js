import { custoHaPlantado } from '../calculo/custo-operacao.js';
import { P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi } from './componentes.js';
import { validar } from './validacao.js';

/* ---------- CAPA ---------- */
function pintarCapa(R){
  const prog=R.L.filter(r=>r.total>0).length, bad=validar(R).filter(v=>!v.ok).length;
  $("#k_capa").innerHTML =
    kpi("Custo total projetado","",brl(R.SEL.total), R.SEL.parcial?R.SEL.rotulo:"","total") +
    (()=>{ const H = custoHaPlantado(R);
      /* O cartao responde "quanto custa plantar a area", nao "quanto custa um
         hectare": o numero grande e o total da formacao do canavial, e o R$/ha
         vira detalhe -- foi o que a operacao pediu ao olhar o rastro. */
      return kpi("Custo de plantar a área","t",brl(H.total),
        (H.ha ? fmt(H.ha)+" ha · "+brl(H.valor)+"/ha · " : "")+H.nota,"custoha"); })() +
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

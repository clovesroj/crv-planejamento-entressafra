import { MODOS_ORD } from '../calculo/atividade.js';
import { tratLista } from '../calculo/insumos.js';
import { ROMANOS, niveis } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { TRAT_NOME } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { MESES } from '../nucleo/calendario.js';

/* ---------- PLANO ---------- */
// editor compacto do mix de modos: 4 percentuais numa célula só
function mixEditor(r){
  const mx = r.mix || {};
  const soma = MODOS_ORD.reduce((s,m)=>s+num(mx[m]),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  const sigla = {Manual:"M",Trator:"T",Uniport:"U",Drone:"D",Terceiro:"3º"};
  return `<div class="mix">` +
    MODOS_ORD.map(m=>`<label title="${m}" class="${m==="Terceiro"?"terc":""}">${sigla[m]}<input data-mx="${r.a.cod}" data-mo="${m}"
      value="${mx[m]||""}" inputmode="decimal" placeholder="0"></label>`).join("") +
    `<span class="mixsum" style="color:${cor}">${soma===0?"padrão":fmt(soma,0)+"%"}</span></div>`;
}

function optFuncao(sel){
  return CFG.funcoes.map(f=>`<option value="${f.cod}" ${f.cod===sel?"selected":""}>${f.cod} · ${f.nome}</option>`).join("");
}
function optNivel(fcod, sel){
  return niveis(fcod).map((n,i)=>{
    const vazio = !(num(n.sal)>0);
    return `<option value="${i}" ${i===sel?"selected":""} ${vazio&&i>0?"disabled":""}>${ROMANOS[i]}${vazio&&i>0?" (sem salário)":""}</option>`;
  }).join("");
}
function pintarPlano(R){
  const TL = tratLista();
  let h = th([["Cod"],["Atividade"],["Un."],...MESES.map(m=>[m,1]),["Total",1],
              ["Modo de execução"],["Função"],["Nível"],["Tratamento"],["Insumo",1]])+"<tbody>";
  let et="";
  R.L.forEach(r=>{
    if(r.a.etapa!==et){et=r.a.etapa; h+=`<tr class="stage"><td colspan="${NM+9}">${et}</td></tr>`;}
    const opts=['<option value="">—</option>'].concat(TL.map(t=>
      `<option value="${t.cod}" ${t.cod===r.trat?"selected":""}>${t.cod}${TRAT_NOME[t.cod]?" — "+TRAT_NOME[t.cod]:""} · ${brl(t.custo_ha,0)}/ha</option>`)).join("");
    const auto = r.a.tipo==="transp";
    h+=`<tr><td>${r.a.cod}</td><td>${r.a.nome}${auto?' <span class="badge b-ok">auto</span>':''}</td>
        <td class="calc">${r.a.un}</td>`+
      r.meses.map((q,j)=> auto
        ? `<td class="num calc">${q?fmt(num(q)):""}</td>`
        : `<td class="num"><input data-c="${r.a.cod}" data-m="${j}" value="${q||""}" inputmode="decimal"></td>`).join("")+
      `<td class="num tot" style="color:${r.total>0?'var(--green)':'var(--grey)'}">${fmt(r.total)}</td>
       <td>${r.a.modoOn ? mixEditor(r) : '<span class="calc">—</span>'}</td>
       <td><select data-fc="${r.a.cod}">${optFuncao(r.fcod)}</select></td>
       <td><select data-fn="${r.a.cod}" style="min-width:70px">${optNivel(r.fcod,r.fniv)}</select></td>
       <td><select data-t="${r.a.cod}" ${r.ehHa?"":"disabled"}>${opts}</select></td>
       <td class="num calc">${r.cInsumo?brl(r.cInsumo):"—"}</td></tr>`;
  });
  $("#t_plano").innerHTML = h+"</tbody>";
  const prog=R.L.filter(r=>r.total>0).length;
  $("#plano_resumo").innerHTML=`<b>${prog}</b>/<b>${R.L.length}</b> atividades · <b>${fmt(R.haOp)}</b> ha-operação · `+
    `insumos <b>${brl(R.insumoT)}</b> · horas <b>${fmt(R.horasT)}</b> · `+
    `<span class="calc">transporte e transbordo espelham a tonelada da colheita automaticamente</span>`;
}


export { mixEditor, optFuncao, optNivel, pintarPlano };

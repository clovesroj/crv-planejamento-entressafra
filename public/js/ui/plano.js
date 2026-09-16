import { MODOS_ORD, modosDe } from '../calculo/atividade.js';
import { tratLista } from '../calculo/insumos.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { TRAT_NOME } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { MESES, PERIODO_MESES, periodoMes } from '../nucleo/calendario.js';

/* ---------- PLANO ---------- */
// editor compacto do mix de modos: 4 percentuais numa célula só
function mixEditor(r){
  const mx = r.mix || {};
  const modos = modosDe(r.a);   // so os modos que a atividade aceita
  const soma = modos.reduce((s,m)=>s+num(mx[m]),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  const sigla = {Manual:"M",Trator:"T",Uniport:"U",Drone:"D",Terceiro:"3º"};
  return `<div class="mix">` +
    modos.map(m=>`<label title="${m}" class="${m==="Terceiro"?"terc":""}">${sigla[m]}<input data-mx="${r.a.cod}" data-mo="${m}"
      value="${mx[m]||""}" inputmode="decimal" placeholder="0"></label>`).join("") +
    `<span class="mixsum" style="color:${cor}">${soma===0?"padrão":fmt(soma,0)+"%"}</span></div>`;
}

function optFuncao(sel){
  return CFG.funcoes.map(f=>`<option value="${f.cod}" ${f.cod===sel?"selected":""}>${f.cod} · ${f.nome}</option>`).join("");
}
/* Filtro de meses da aba: some com as colunas do outro período, sem tocar nos dados.
   Fica no elemento da tabela (e não no innerHTML), então sobrevive ao re-render. */
let FILTRO_MES = "todos";
function aplicarFiltroPlano(v){
  FILTRO_MES = ["safra","entressafra"].includes(v) ? v : "todos";
  const tab = $("#t_plano");
  if(tab) tab.className = FILTRO_MES==="todos" ? "" : "so-"+FILTRO_MES;
  const sel = $("#sel_plano_mes");
  if(sel && sel.value !== FILTRO_MES) sel.value = FILTRO_MES;
}
/* Índices dos meses que o filtro deixa à mostra. */
function mesesVisiveis(){
  const todos = MESES.map((_,j)=>j);
  return FILTRO_MES==="todos" ? todos : todos.filter(j=>periodoMes(j)===FILTRO_MES);
}
/* Quanto de uma atividade cai dentro do período filtrado.
   Sem filtro é o total do ano, e a conta fecha com o motor de cálculo. */
function totalNoFiltro(r){
  if(FILTRO_MES==="todos") return r.total;
  return mesesVisiveis().reduce((s,j)=>s+num(r.meses[j]),0);
}
function pintarPlano(R){
  const TL = tratLista();
  // cada coluna de mês carrega a classe do seu período: é o que dá a cor e o que o filtro usa
  const clsMes = j => "mes-"+periodoMes(j);
  const parcial = FILTRO_MES!=="todos";
  let h = th([["Cod"],["Atividade"],["Início"],["Fim"],["Un."],
              ...MESES.map((m,j)=>[m,1,clsMes(j)]),[parcial?"Total do período":"Total",1],
              ["Modo de execução"],["Equip."],["Tratamento"],["Insumo",1]])+"<tbody>";
  let et="";
  R.L.forEach(r=>{
    if(r.a.etapa!==et){et=r.a.etapa; h+=`<tr class="stage"><td colspan="${NM+10}">${et}</td></tr>`;}
    const opts=['<option value="">—</option>'].concat(TL.map(t=>
      `<option value="${t.cod}" ${t.cod===r.trat?"selected":""}>${t.cod}${TRAT_NOME[t.cod]?" — "+TRAT_NOME[t.cod]:""} · ${brl(t.custo_ha,0)}/ha</option>`)).join("");
    const auto = r.a.tipo==="transp";
    // janela de datas: define em que meses a atividade pode ser lancada
    const jIdx = r.janela.fonte==="datas" ? r.janela.idx : null;
    const dentro = j => !jIdx || jIdx.includes(j);
    h+=`<tr><td>${r.a.cod}</td><td>${r.a.nome}${auto?' <span class="badge b-ok">auto</span>':''}</td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="ini" value="${r.janela.ini||""}" title="Início da execução"></td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="fim" value="${r.janela.fim||""}" title="Fim da execução"></td>
        <td class="calc">${r.a.un}</td>`+
      r.meses.map((q,j)=> auto
        ? `<td class="num calc ${clsMes(j)}">${q?fmt(num(q)):""}</td>`
        : `<td class="num ${clsMes(j)}${dentro(j)?"":" fora-janela"}"><input data-c="${r.a.cod}" data-m="${j}" value="${q||""}" inputmode="decimal"${
            dentro(j)?"":' title="Fora da janela de datas desta atividade — o valor continua contando no total"'}></td>`).join("")+
      `<td class="num tot" style="color:${totalNoFiltro(r)>0?'var(--green)':'var(--grey)'}"${
          parcial && r.total>0 ? ` title="No ano: ${fmt(r.total)}"` : ""}>${fmt(totalNoFiltro(r))}</td>
       <td>${r.a.modoOn ? mixEditor(r) : '<span class="calc">—</span>'}</td>
       <td class="num ${r.frotaR>0?"tot":"calc"}" data-rastro="ativ:${r.a.cod}" role="button" tabindex="0"
           title="Como se chegou nessa frota">${r.frotaR ? r.frotaR+" ›" : "—"}</td>
       <td><select data-t="${r.a.cod}" ${r.ehHa?"":"disabled"}>${opts}</select></td>
       <td class="num calc">${r.cInsumo?brl(r.cInsumo):"—"}</td></tr>`;
  });
  $("#t_plano").innerHTML = h+"</tbody>";
  aplicarFiltroPlano(FILTRO_MES);
  // O resumo segue o filtro. Horas e insumos de uma atividade são lineares na
  // quantidade — horas = volume/rendimento, insumo = custo por ha x ha — então a
  // parcela do período é exata, não uma aproximação. Sem filtro, cai de volta
  // nos totais do motor de cálculo.
  const fatia = r => r.total>0 ? totalNoFiltro(r)/r.total : 0;
  const prog  = R.L.filter(r=>totalNoFiltro(r)>0).length;
  const haOp  = parcial ? R.L.reduce((s,r)=>s+(r.ehHa?totalNoFiltro(r):0),0) : R.haOp;
  const ins   = parcial ? R.L.reduce((s,r)=>s+r.cInsumo*fatia(r),0) : R.insumoT;
  // horasT do motor = horas das atividades + horas da frota de apoio. A frota de
  // apoio roda todo mês, independente de quando a atividade acontece, então a
  // parcela dela é a fração de meses do período — não a fração de volume.
  const hAtiv  = R.L.reduce((s,r)=>s+r.horas,0);
  const hApoio = R.horasT - hAtiv;
  const hrs    = parcial
    ? R.L.reduce((s,r)=>s+r.horas*fatia(r),0) + hApoio*(mesesVisiveis().length/NM)
    : R.horasT;
  $("#plano_resumo").innerHTML=`<b>${prog}</b>/<b>${R.L.length}</b> atividades · <b>${fmt(haOp)}</b> ha-operação · `+
    `insumos <b>${brl(ins)}</b> · horas <b>${fmt(hrs)}</b> · `+
    (parcial ? `<span class="calc">números de ${PERIODO_MESES[FILTRO_MES]}; o ano inteiro fica em "Todos os meses"</span>`
             : `<span class="calc">transporte e transbordo espelham a tonelada da colheita automaticamente</span>`);
}


export { aplicarFiltroPlano, mixEditor, optFuncao, pintarPlano };

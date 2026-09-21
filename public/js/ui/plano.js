import { MODOS_ORD, modosDe, temDetalheTerc } from '../calculo/atividade.js';
import { tratListaTodos } from '../calculo/insumos.js';
import { CFG } from '../dados/cfg.js';
import { TERC_MODOS } from '../dados/modos.js';
import { NM } from '../nucleo/calendario.js';
import { DIM, TERC_DET, TERC_SUB, TRAT_NOME, atividadesLista } from '../nucleo/estado.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { th } from './componentes.js';
import { MESES, PERIODO_MESES, clsMes } from '../nucleo/calendario.js';

/* ---------- PLANO ---------- */
// A44-A53 (Broca e Cigarrinha) agrupam visualmente como "Manejo
// Fitossanitário" nesta tabela, sem mudar a.etapa: etapa continua "Tratos
// Culturais" pra tudo que usa etapa pra calcular (rateio de arrendamento,
// administrativo, relatórios) — é só o cabeçalho de grupo que muda aqui.
const COD_FITOSSANITARIO = new Set(["A44","A45","A46","A47","A48","A49","A50","A51","A52","A53"]);
const grupoPlano = a => COD_FITOSSANITARIO.has(a.cod) ? "MANEJO FITOSSANITÁRIO" : a.etapa;
// editor compacto do mix de modos: percentuais numa célula só
function mixEditor(r){
  const mx = r.mix || {};
  const modos = modosDe(r.a);   // so os modos que a atividade aceita
  const soma = modos.reduce((s,m)=>s+num(mx[m]),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  const sigla = {Manual:"M",Trator:"T",Uniport:"U",Drone:"D",Quadriciclo:"Q",Terceiro:"3º"};
  const temSub = temDetalheTerc(r.a.cod);
  return `<div class="mix">` +
    modos.map(m=>`<label title="${m}" class="${m==="Terceiro"?"terc":""}">${sigla[m]}<input data-mx="${r.a.cod}" data-mo="${m}"
      value="${mx[m]||""}" inputmode="decimal" placeholder="0"></label>`).join("") +
    (modos.includes("Terceiro") ? `<button type="button" class="terc-det${temSub?" on":""}" data-tercdet="${r.a.cod}"
      title="${temSub?"Detalhamento do terceiro por avião/drone/terrestre já preenchido — clique para ajustar":"Detalhar o terceiro por avião, drone ou terrestre, cada um com seu % e sua tarifa"}">›</button>` : "") +
    `<span class="mixsum" style="color:${cor}">${soma===0?"padrão":fmt(soma,0)+"%"}</span></div>`;
}

/* Modal de detalhamento do terceiro: aberto pelo "›" ao lado do 3º no mix.
   Cardápio fixo de sub-modos (TERC_MODOS) — cada um com seu % (do total
   terceirizado, não da atividade inteira) e sua tarifa R$/ha. Some 0% em
   tudo e volta a valer a tarifa única de sempre (ver tarifaTercDe). */
function pintarTercDet(){
  const cont = $("#tercdet"), fundo = $("#tercdet_fundo");
  if(!cont) return;
  const cod = TERC_DET;
  const a = cod ? atividadesLista().find(x=>x.cod===cod) : null;
  if(!a){ cont.hidden = true; fundo.hidden = true; return; }
  const sub = TERC_SUB[cod] || {};
  const soma = TERC_MODOS.reduce((s,m)=>s+num(sub[m] && sub[m].pct),0);
  const cor = soma===0 ? "var(--grey)" : (Math.abs(soma-100)<0.01 ? "var(--green)" : "var(--red)");
  cont.innerHTML = `
    <div class="ra-modal td-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="td_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">Terceiro por sub-modo</div>
      <div class="ra-subtit">${esc(a.cod)} — ${esc(a.nome)}</div>
    </div>
    <div class="ra-corpo">
      <table>${th([["Sub-modo"],["% do terceiro",1],["Tarifa (R$/ha)",1]])}<tbody>` +
      TERC_MODOS.map(m=>`<tr><td>${esc(m)}</td>
        <td class="num"><input data-tsub="${esc(cod)}" data-tsm="${esc(m)}" data-tsf="pct"
          value="${(sub[m] && sub[m].pct) || ""}" inputmode="decimal" placeholder="0"></td>
        <td class="num"><input data-tsub="${esc(cod)}" data-tsm="${esc(m)}" data-tsf="tar"
          value="${(sub[m] && sub[m].tar) || ""}" inputmode="decimal" placeholder="0"></td></tr>`).join("") +
      `<tr><td class="tot">Soma</td><td class="num tot" style="color:${cor}">${fmt(soma,0)}%</td><td></td></tr>
      </tbody></table>
      <p class="calc" style="margin-top:10px;font-size:11.5px">Sem nada aqui, vale a tarifa única lançada em
        Plano de Contas. Preenchendo o % de cada sub-modo (soma até 100%), o custo da parte terceirizada
        vira a média ponderada das tarifas acima.</p>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

function optFuncao(sel){
  return CFG.funcoes.map(f=>`<option value="${f.cod}" ${f.cod===sel?"selected":""}>${f.cod} · ${f.nome}</option>`).join("");
}
/* O recorte de meses desta aba é o da barra superior — a aba não tem filtro
   próprio. Ter dois seletores para a mesma pergunta era o que fazia o de cima
   parecer quebrado: mudar "Safra" no topo não mexia numa tela que só obedecia ao
   seu próprio select. Agora há um lugar só onde se escolhe o período, e ele vale
   para todas as abas. */
/* Quanto de uma atividade cai dentro do período filtrado.
   Sem filtro é o total do ano, e a conta fecha com o motor de cálculo. */
function totalNoFiltro(r, SEL){
  if(!SEL.parcial) return r.total;
  return SEL.meses.reduce((s,j)=>s+num(r.meses[j]),0);
}
function pintarPlano(R){
  const TL = tratListaTodos();
  const SEL = R.SEL;
  const parcial = SEL.parcial;
  let h = th([["Cod"],["Atividade"],["Início"],["Fim"],["Un."],
              ...MESES.map((m,j)=>[m,1,clsMes(j)]),[parcial?"Total do período":"Total",1],
              ["Modo de execução"],["Equip."],["Tratamento"],["Insumo",1]])+"<tbody>";
  let et="";
  R.L.forEach(r=>{
    const grupo = grupoPlano(r.a);
    if(grupo!==et){et=grupo; h+=`<tr class="stage"><td colspan="${SEL.meses.length+10}"><span>${et}</span></td></tr>`;}
    const opts=['<option value="">—</option>'].concat(TL.map(t=>
      `<option value="${t.cod}" ${t.cod===r.trat?"selected":""}>${t.cod}${TRAT_NOME[t.cod]?" — "+esc(TRAT_NOME[t.cod]):""} · ${brl(t.custo_ha,0)}/ha</option>`)).join("");
    const auto = r.a.tipo==="transp";
    // janela de datas: define em que meses a atividade pode ser lancada
    const jIdx = r.janela.fonte==="datas" ? r.janela.idx : null;
    const dentro = j => !jIdx || jIdx.includes(j);
    const d = DIM[r.a.cod] || {};
    h+=`<tr><td>${r.a.cod}</td><td>${r.a.nome}${auto?' <span class="badge b-ok">auto</span>':''}</td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="ini" value="${r.janela.ini||""}" max="${d.fim||""}" title="Início da execução"></td>
        <td><input type="date" data-dt="${r.a.cod}" data-f="fim" value="${r.janela.fim||""}" min="${d.ini||""}" title="Fim da execução"></td>
        <td class="calc">${r.a.un}</td>`+
      r.meses.map((q,j)=> auto
        ? `<td class="num calc ${clsMes(j)}">${q?fmt(num(q)):""}</td>`
        : `<td class="num ${clsMes(j)}${dentro(j)?"":" fora-janela"}"><input data-c="${r.a.cod}" data-m="${j}" value="${q||""}" inputmode="decimal"${
            dentro(j)?"":' title="Fora da janela de datas desta atividade — o valor continua contando no total"'}></td>`).join("")+
      `<td class="num tot" style="color:${totalNoFiltro(r, SEL)>0?'var(--green)':'var(--grey)'}"${
          parcial && r.total>0 ? ` title="No ano: ${fmt(r.total)}"` : ""}>${fmt(totalNoFiltro(r, SEL))}</td>
       <td>${r.a.modoOn ? mixEditor(r) : '<span class="calc">—</span>'}</td>
       <td class="num ${r.frotaR>0?"tot":"calc"}" data-rastro="ativ:${r.a.cod}" role="button" tabindex="0"
           title="Como se chegou nessa frota">${r.frotaR ? r.frotaR+" ›" : "—"}</td>
       <td><select data-t="${r.a.cod}" ${r.ehHa?"":"disabled"}>${opts}</select></td>
       <td class="num calc">${r.cInsumo?brl(r.cInsumo):"—"}</td></tr>`;
  });
  $("#t_plano").innerHTML = h+"</tbody>";
  // O resumo segue o filtro. Horas e insumos de uma atividade são lineares na
  // quantidade — horas = volume/rendimento, insumo = custo por ha x ha — então a
  // parcela do período é exata, não uma aproximação. Sem filtro, cai de volta
  // nos totais do motor de cálculo.
  const fatia = r => r.total>0 ? totalNoFiltro(r, SEL)/r.total : 0;
  const prog  = R.L.filter(r=>totalNoFiltro(r, SEL)>0).length;
  const haOp  = parcial ? R.L.reduce((s,r)=>s+(r.ehHa?totalNoFiltro(r, SEL):0),0) : R.haOp;
  const ins   = parcial ? R.L.reduce((s,r)=>s+r.cInsumo*fatia(r),0) : R.insumoT;
  // horasT do motor = horas das atividades + horas da frota de apoio. A frota de
  // apoio roda todo mês, independente de quando a atividade acontece, então a
  // parcela dela é a fração de meses do período — não a fração de volume.
  const hAtiv  = R.L.reduce((s,r)=>s+r.horas,0);
  const hApoio = R.horasT - hAtiv;
  const hrs    = parcial
    ? R.L.reduce((s,r)=>s+r.horas*fatia(r),0) + hApoio*(SEL.meses.length/NM)
    : R.horasT;
  $("#plano_resumo").innerHTML=`<b>${prog}</b>/<b>${R.L.length}</b> atividades · <b>${fmt(haOp)}</b> ha-operação · `+
    `insumos <b>${brl(ins)}</b> · horas <b>${fmt(hrs)}</b> · `+
    (parcial ? `<span class="calc">números de ${PERIODO_MESES[SEL.periodo] || SEL.rotulo.toLowerCase()}; o ano inteiro fica em "Ano todo", na barra do topo</span>`
             : `<span class="calc">transporte e transbordo espelham a tonelada da colheita automaticamente</span>`);
}


export { mixEditor, optFuncao, pintarPlano, pintarTercDet };

import { criterioMensal } from '../calculo/atividade.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { DIM, P } from '../nucleo/estado.js';
import { $, fmt, num, pct } from '../nucleo/formato.js';

/* ---------- MODAL DE CRITÉRIO MENSAL ----------
   O Dimensionamento resolve a atividade com um critério só, médio na janela.
   Mas o mês não é médio: outubro pede mais que abril, e é no mês cheio que o
   critério aperta. Este modal é onde cada mês ganha o seu.

   Quatro campos por mês, e a ordem importa — é a ordem em que a pergunta
   aparece na reunião: quanto tenho de produzir, com quantas máquinas, quanto
   elas ficam de pé (manutenção) e quanto do tempo de pé eu aproveito (operação).
   O rendimento é a quinta variável, e ela é a que sobra: preenchendo a frota, o
   rendimento deixa de ser premissa e passa a ser o que fecha a conta.

   Em branco, o mês herda o critério da atividade. É o padrão porque na maioria
   delas o mês não muda nada, e um formulário com 48 campos preenchidos seria
   pior do que um com 48 vazios.

   Mesmo idioma visual do modal de rastro (blur + cartão central), mas é
   formulário, não explicação. */

let cod = null;         // atividade com o modal aberto, ou null
let jaAberto = false;   // anima so na transicao fechado->aberto

const aberto = () => !!cod;
function abrirRendMensal(c){ cod = c; }
function fecharRendMensal(){ cod = null; jaAberto = false; }

function pintarRendMensal(R){
  const cont = $("#rendm"), fundo = $("#rendm_fundo");
  if(!cont) return;
  if(!aberto()){ cont.hidden = true; fundo.hidden = true; jaAberto = false; return; }

  const r = R.L.find(x=>x.a.cod===cod);
  if(!r){ fecharRendMensal(); cont.hidden = true; fundo.hidden = true; return; }

  const d = DIM[cod] || {};
  const arr = k => Array.isArray(d[k]) ? d[k] : Array(NM).fill("");
  const rendM = arr("rendM"), frotaM = arr("frotaM"), dispM = arr("dispM"), utilM = arr("utilM");
  const un = r.a.un.split("/")[0];
  // o padrao exibido e a PREMISSA da atividade, nao a media do periodo: a media
  // se move quando um mes ganha criterio proprio, e o placeholder passaria a
  // sugerir um numero que o motor nao usa para os meses em branco
  const padrao = r.rendPremissa > 0 ? r.rendPremissa : r.rend;
  const C = criterioMensal(r);
  const comVolume = C.filter(c=>c.temVolume);
  const apertados = comVolume.filter(c=>!c.cabe).length;

  const entrando = !jaAberto;
  jaAberto = true;

  cont.innerHTML = `
    <div class="ra-modal rm-modal${entrando?" pop-in":""}">
    <div class="ra-topo">
      <div class="ra-nav">
        <div></div>
        <button class="ghost-btn" id="rm_fechar" title="Fechar" aria-label="Fechar">✕</button>
      </div>
      <div class="ra-tit">${r.a.cod} · ${r.a.nome}</div>
      <div class="ra-subtit">Critério por mês · padrão ${fmt(padrao,2)} ${un}/h ·
        ${r.frotaR||0} ${r.frotaR===1?"equipamento":"equipamentos"} ·
        ${pct(num(P.disp)/100)} de disponibilidade · ${pct(r.util)} de utilização</div>
    </div>
    <div class="ra-corpo">
      <div class="hint" style="margin-bottom:12px">
        Campo em branco herda o critério da atividade — preencha só o mês que foge dele.
        <b>Preenchendo a frota, o rendimento do mês passa a ser calculado</b>: com aquelas máquinas,
        naquela disponibilidade e utilização, é o ${un}/h que o volume do mês exige.
        Base de calendário: ${fmt(P.dias)} dias efetivos de ${fmt(P.hdia,1)} h.
      </div>
      ${comVolume.length ? `<div class="rm-resumo ${apertados?"rm-alerta":"rm-ok"}">
        ${apertados
          ? `<b>${apertados}</b> ${apertados>1?"meses pedem":"mês pede"} mais do que o critério entrega.
             Nesses, ou entra frota, ou sobe a disponibilidade, ou o volume vai para outro mês.`
          : `Os <b>${comVolume.length}</b> ${comVolume.length>1?"meses com volume cabem":"mês com volume cabe"} no critério lançado.`}
      </div>` : `<div class="rm-resumo">Nenhum mês com volume lançado — as metas aparecem quando o Plano Operacional tiver quantidade.</div>`}
      <div class="rm-grade">
        ${MESES.map((m,i)=>cartao(m, i, C[i], un)).join("")}
      </div>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;

  /* Um mês por cartão. Meta em cima, campos no meio, critério exigido embaixo —
     o que preciso entregar, com o que conto, e o que isso obriga. */
  function cartao(m, i, c, un){
    const vazio = !c.temVolume;
    return `<div class="rm-mes${vazio?" rm-vazio":c.cabe?"":" rm-aperta"}">
      <div class="rm-cab">
        <b>${m}</b>
        <span class="${vazio?"calc":"rm-meta"}">${vazio?"sem volume":fmt(c.q)+" "+un}</span>
      </div>
      ${vazio ? "" : `
      <div class="rm-metas">
        <span>Por dia <b>${fmt(c.qDia,1)} ${un}</b></span>
        <span>Por equip./dia <b>${fmt(c.qDiaEquip,1)} ${un}</b></span>
        <span>Horas <b>${fmt(c.horas)} h</b></span>
      </div>`}
      <div class="rm-campos">
        <label>Frota
          <input data-frotam="${cod}" data-i="${i}" value="${frotaM[i]||""}"
                 inputmode="decimal" placeholder="${r.frotaR||"—"}" title="Equipamentos neste mês">
        </label>
        <label>Rend. (${un}/h)
          ${c.daFrota
            ? `<span class="rm-calc" title="Calculado a partir da frota deste mês">${fmt(c.rend,2)}</span>`
            : `<input data-rendm="${cod}" data-i="${i}" value="${rendM[i]||""}"
                      inputmode="decimal" placeholder="${fmt(padrao,2)}">`}
        </label>
        <label>Disponib. %
          <input data-dispm="${cod}" data-i="${i}" value="${dispM[i]||""}"
                 inputmode="decimal" placeholder="${fmt(num(P.disp),0)}" title="Disponibilidade mecânica — manutenção">
        </label>
        <label>Utiliz. %
          <input data-utilm="${cod}" data-i="${i}" value="${utilM[i]||""}"
                 inputmode="decimal" placeholder="${fmt(r.util*100,0)}" title="Utilização — operação">
        </label>
      </div>
      ${vazio ? "" : `<div class="rm-exige">
        <div class="rm-exige-tit">Para o mês caber, cada critério sozinho:</div>
        <div class="rm-lin"><span>Rendimento</span><b>${fmt(c.rendNec,2)} ${un}/h</b></div>
        <div class="rm-lin${c.dispNec>c.disp?" rm-ruim":""}"><span>Disponibilidade</span><b>${pct(c.dispNec)}</b></div>
        <div class="rm-lin${c.utilNec>c.util?" rm-ruim":""}"><span>Utilização</span><b>${pct(c.utilNec)}</b></div>
        <div class="rm-lin"><span>Horas/dia por equip.</span><b>${fmt(c.hDiaEquip,1)} h
          <span class="calc">de ${fmt(c.hDispEquip,1)}</span></b></div>
      </div>`}
    </div>`;
  }
}

export { abrirRendMensal, aberto, fecharRendMensal, pintarRendMensal };

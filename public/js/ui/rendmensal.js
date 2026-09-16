import { MESES, NM } from '../nucleo/calendario.js';
import { DIM } from '../nucleo/estado.js';
import { $, fmt, num } from '../nucleo/formato.js';

/* ---------- MODAL DE RENDIMENTO MENSAL ----------
   Rendimento (ha/h, ton/h...) as vezes nao e o mesmo o ano inteiro — chuva,
   entressafra, terreno — mas por padrao a atividade usa um valor so, lancado
   no Dimensionamento. Este modal deixa lancar um valor por mes so onde ele
   realmente muda; o resto continua no padrao. Mesmo idioma visual do modal
   de rastro (blur + cartao central), mas e formulario, nao explicacao. */

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
  const rendM = Array.isArray(d.rendM) ? d.rendM : Array(NM).fill("");
  const un = r.a.un.split("/")[0];
  const padrao = d.rend!=null ? num(d.rend) : r.a.rend;

  const entrando = !jaAberto;
  jaAberto = true;

  cont.innerHTML = `
    <div class="ra-modal rm-modal${entrando?" pop-in":""}">
    <div class="ra-topo">
      <div class="ra-nav">
        <div></div>
        <button class="ghost-btn" id="rm_fechar" title="Fechar" aria-label="Fechar">✕</button>
      </div>
      <div class="ra-tit">${r.a.nome}</div>
      <div class="ra-subtit">Rendimento por mês · padrão ${fmt(padrao,2)} ${un}/h</div>
    </div>
    <div class="ra-corpo">
      <div class="hint" style="margin-bottom:14px">Em branco, o mês usa o rendimento padrão do Dimensionamento.
        Preencha só o(s) mês(es) em que o rendimento realmente muda.</div>
      <div class="rm-grade">
        ${MESES.map((m,i)=>`<div class="rm-mes">
          <label>${m}<span class="calc"> · ${fmt(r.meses[i]||0)} ${un}</span></label>
          <input data-rendm="${cod}" data-i="${i}" value="${rendM[i]||""}" inputmode="decimal" placeholder="${fmt(padrao,2)}">
        </div>`).join("")}
      </div>
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

export { abrirRendMensal, aberto, fecharRendMensal, pintarRendMensal };

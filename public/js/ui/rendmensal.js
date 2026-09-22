import { criterioMensal } from '../calculo/atividade.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { DIM, P } from '../nucleo/estado.js';
import { $, fmt, num, pct } from '../nucleo/formato.js';

/* ---------- MODAL DE CRITÉRIO MENSAL ----------
   O Dimensionamento resolve a atividade com um critério só, médio na janela.
   Mas o mês não é médio: outubro pede mais que abril, e é no mês cheio que o
   critério aperta. Este modal é onde cada mês ganha o seu.

   Os campos seguem a ordem em que a pergunta aparece na reunião: quanto tenho
   de produzir, com quantas máquinas, quanto elas ficam de pé (manutenção),
   quanto do tempo de pé vai para a operação (utilização) e quanto desse tempo
   rende de fato (eficiência — chuva, manobra, espera). O rendimento é a
   variável que sobra: preenchendo a frota, ele deixa de ser premissa e passa a
   ser o que fecha a conta.

   Disponibilidade e eficiência parecem a mesma coisa e não são: a primeira é da
   manutenção, e cai quando a máquina quebra; a segunda é da operação, e cai com
   dezembro chuvoso sem que nada tenha quebrado. Separá-las é o que deixa cobrar
   a gerência certa pelo número errado.

   Em branco, o mês herda o critério da atividade. É o padrão porque na maioria
   delas o mês não muda nada, e um formulário com 48 campos preenchidos seria
   pior do que um com 48 vazios.

   Mesmo idioma visual do modal de rastro (blur + cartão central), mas é
   formulário, não explicação. */

let cod = null;         // atividade com o modal aberto, ou null
let jaAberto = false;   // anima so na transicao fechado->aberto

/* ---------- RASCUNHO ----------
   Digitar aqui nao grava mais a cada tecla. Antes cada tecla chamava salvar() e
   um render() que repinta as 24 abas e reconstroi este modal -- o campo em que
   se estava digitando era destruido e recriado no meio da digitacao, e o cursor
   pulava ou o caractere se perdia.

   Agora a digitacao mexe so nesta copia, que nao passa pelo motor de calculo.
   O botao Salvar e que escreve no plano e redesenha. E o mesmo desenho de um
   formulario: preenche, confere, grava. */
const CAMPOS = ["rendM", "frotaM", "dispM", "utilM", "eficM"];
let RASCUNHO = null;

function rascunhoDe(c){
  const d = DIM[c] || {};
  const r = {};
  CAMPOS.forEach(k => { r[k] = Array.isArray(d[k]) ? d[k].slice() : Array(NM).fill(""); });
  return r;
}
/** Campo em branco volta a herdar o criterio da atividade: guarda "", nao zero. */
function editarRascunho(chave, i, valor){
  if(!RASCUNHO || !CAMPOS.includes(chave)) return;
  RASCUNHO[chave][i] = String(valor).trim() === "" ? "" : num(valor);
}
/** Array vazio (so "" ou 0) nao vira campo no plano -- e ausencia de criterio. */
const vazia = a => a.every(v => v === "" || num(v) === 0);
/** Quantos meses tem valor diferente do que esta gravado. */
function pendencias(){
  if(!cod || !RASCUNHO) return 0;
  const grav = rascunhoDe(cod);
  let n = 0;
  CAMPOS.forEach(k => RASCUNHO[k].forEach((v, i) => {
    if(String(v) !== String(grav[k][i])) n++;
  }));
  return n;
}
/** Escreve o rascunho no plano. Quem grava e chama render() e o chamador. */
function salvarRascunho(){
  if(!cod || !RASCUNHO) return false;
  const d = DIM[cod] = DIM[cod] || {};
  CAMPOS.forEach(k => { if(vazia(RASCUNHO[k])) delete d[k]; else d[k] = RASCUNHO[k].slice(); });
  RASCUNHO = rascunhoDe(cod);
  return true;
}
function descartarRascunho(){ if(cod) RASCUNHO = rascunhoDe(cod); }

const aberto = () => !!cod;
function abrirRendMensal(c){ cod = c; RASCUNHO = rascunhoDe(c); }
function fecharRendMensal(){ cod = null; RASCUNHO = null; jaAberto = false; }

function pintarRendMensal(R){
  const cont = $("#rendm"), fundo = $("#rendm_fundo");
  if(!cont) return;
  if(!aberto()){ cont.hidden = true; fundo.hidden = true; jaAberto = false; return; }

  const r = R.L.find(x=>x.a.cod===cod);
  if(!r){ fecharRendMensal(); cont.hidden = true; fundo.hidden = true; return; }

  // os campos mostram o RASCUNHO (o que se esta digitando); os numeros
  // calculados abaixo continuam vindo do plano gravado
  if(!RASCUNHO) RASCUNHO = rascunhoDe(cod);
  const rendM = RASCUNHO.rendM, frotaM = RASCUNHO.frotaM, dispM = RASCUNHO.dispM,
        utilM = RASCUNHO.utilM, eficM = RASCUNHO.eficM;
  const pend = pendencias();
  const un = r.a.un.split("/")[0];
  // o padrao exibido e a PREMISSA da atividade, nao a media do periodo: a media
  // se move quando um mes ganha criterio proprio, e o placeholder passaria a
  // sugerir um numero que o motor nao usa para os meses em branco
  const padrao = r.rendPremissa > 0 ? r.rendPremissa : r.rend;
  const eficPad = num(P.efic) > 0 ? num(P.efic)/100 : 1;
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
      <div class="rm-acoes">
        <span class="rm-pend ${pend?"tem":""}">${pend
          ? `<b>${pend}</b> campo${pend>1?"s":""} não salvo${pend>1?"s":""}`
          : "tudo salvo"}</span>
        <button class="btn" id="rm_descartar" ${pend?"":"disabled"}>Descartar</button>
        <button class="btn p" id="rm_salvar" ${pend?"":"disabled"}>Salvar critério</button>
      </div>
      <div class="ra-subtit">Critério por mês · padrão ${fmt(padrao,2)} ${un}/h ·
        ${r.frotaR||0} ${r.frotaR===1?"equipamento":"equipamentos"} ·
        ${pct(num(P.disp)/100)} de disponibilidade · ${pct(r.util)} de utilização ·
        ${pct(eficPad)} de eficiência</div>
    </div>
    <div class="ra-corpo">
      <div class="hint" style="margin-bottom:12px">
        Digite à vontade: o critério só entra no plano quando você clicar em <b>Salvar critério</b>.
        Campo em branco herda o critério da atividade — preencha só o mês que foge dele.
        <b>Preenchendo a frota, o rendimento do mês passa a ser calculado</b>: com aquelas máquinas,
        naquele critério, é o ${un}/h que o volume do mês exige.
        A hora efetiva do dia sai de ${fmt(P.hdia,1)} h de jornada × disponibilidade × utilização × eficiência —
        é por aí que dezembro chuvoso encolhe o dia sem que a máquina tenha quebrado.
        <b>Os dias de cada mês saem da janela da atividade</b>: mês que a janela corta no meio vale
        só os dias cobertos, e aparece marcado como <i>mês parcial</i>.
        A produção do mês aparece em <b>duas leituras</b>, e elas não são a mesma coisa.
        <b>Por dia efetivo</b> divide pelos ${fmt(P.dias)} dias de operação do mês (premissa) — é a
        <b>meta</b>, o ritmo a manter nos dias em que a frente vai a campo.
        <b>Por dia corrido</b> divide pelos dias do calendário — é o <b>termômetro</b>, para saber
        se o mês está no prazo. A efetiva é sempre maior, e é ela que a operação persegue.
      </div>
      ${pend ? `<div class="rm-resumo rm-alerta">Há <b>${pend}</b> campo${pend>1?"s":""} digitado${pend>1?"s":""}
        e ainda não salvo${pend>1?"s":""}. Os números calculados abaixo — meta por dia, horas e o bloco
        <i>para o mês caber</i> — ainda são os do critério <b>gravado</b>; eles se atualizam ao salvar.</div>` : ""}
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
        ${c.parcial ? `<span class="badge b-warn" title="A janela da atividade (${r.janela.ini} a ${r.janela.fim}) cobre ${fmt(c.diasCorridos)} dos ${fmt(c.diasCheios)} dias deste mês. Os divisores já são os do pedaço coberto.">mês parcial</span>` : ""}
      </div>
      ${vazio ? "" : `
      <div class="rm-metas">
        <span title="${fmt(c.q)} ${un} ÷ ${fmt(c.dias,1)} dias de operação = ${fmt(c.qDia,1)} ${un}. É a meta: o ritmo a manter nos dias em que a frente vai a campo.${
          c.parcial ? " O mês e parcial: a janela cobre "+fmt(c.diasCorridos)+" dos "+fmt(c.diasCheios)+" dias, e os dias de operação caem na mesma proporção." : ""}">Por dia efetivo
          <b>${fmt(c.qDia,1)} ${un}</b> <span class="calc">÷ ${fmt(c.dias,1)} dias</span></span>
        <span title="${fmt(c.q)} ${un} ÷ ${fmt(c.diasCorridos)} dias do mês = ${fmt(c.qDiaCorrido,1)} ${un}. É o termômetro: o ritmo contra o calendário, para saber se o mês está no prazo.">Por dia corrido
          <b>${fmt(c.qDiaCorrido,1)} ${un}</b> <span class="calc">÷ ${fmt(c.diasCorridos)} dias</span></span>
        <span title="${fmt(c.qDia,1)} ${un}/dia ÷ ${fmt(c.n)} equipamento(s)">Por equip./dia
          <b>${fmt(c.qDiaEquip,1)} ${un}</b></span>
        <span title="${fmt(c.q)} ${un} ÷ ${fmt(c.rend,2)} ${un}/h">Horas <b>${fmt(c.horas)} h</b></span>
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
                 inputmode="decimal" placeholder="${fmt(r.util*100,0)}" title="Utilização — quanto do tempo disponível vai para a operação">
        </label>
        <label>Efic. %
          <input data-eficm="${cod}" data-i="${i}" value="${eficM[i]||""}"
                 inputmode="decimal" placeholder="${fmt(eficPad*100,0)}"
                 title="Eficiência operacional — quanto do tempo em campo é produtivo. Desconta chuva, manobra, espera e abastecimento.">
        </label>
      </div>
      ${vazio ? "" : `<div class="rm-exige">
        <div class="rm-exige-tit">Para o mês caber, cada critério sozinho:</div>
        <div class="rm-lin"><span>Rendimento</span><b>${fmt(c.rendNec,2)} ${un}/h</b></div>
        <div class="rm-lin${c.dispNec>c.disp?" rm-ruim":""}"><span>Disponibilidade</span><b>${pct(c.dispNec)}</b></div>
        <div class="rm-lin${c.utilNec>c.util?" rm-ruim":""}"><span>Utilização</span><b>${pct(c.utilNec)}</b></div>
        <div class="rm-lin${c.eficNec>c.efic?" rm-ruim":""}"><span>Eficiência</span><b>${pct(c.eficNec)}</b></div>
        <div class="rm-lin"><span>Horas/dia por equip.</span><b>${fmt(c.hDiaEquip,1)} h
          <span class="calc">de ${fmt(c.hDispEquip,1)} efetivas</span></b></div>
      </div>`}
    </div>`;
  }
}

export { abrirRendMensal, aberto, descartarRascunho, editarRascunho, fecharRendMensal,
  pendencias, pintarRendMensal, salvarRascunho };

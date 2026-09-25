import { rastro } from '../calculo/rastro.js';
import { chaveItemReforma } from '../calculo/reforma.js';
import { itensDaEspecialidadeNaJanela } from '../calculo/gasto-real.js';
import { $, brl, esc } from '../nucleo/formato.js';

/* ---------- MODAL DE RASTRO ----------
   Explica um KPI ou custo descendo a cadeia: total, centro de custo,
   etapa, atividade, área, horas, equipamento, consumo, preço e premissa.
   Guarda a pilha de navegação, para o botão voltar. O conteúdo é redesenhado
   a cada render(), então acompanha qualquer edição que o usuário faça. */

let pilha = [];        // chaves visitadas; a última é a que está na tela
let periodo = "todos";  // 'todos' | 'safra' | 'entressafra' — filtro do nível atual
let jaAberto = false;   // controla a animação de entrada: só toca ao abrir, não a cada render()
let ultimoR = null;     // R do último render(), pra trocar o filtro sem recalcular o plano inteiro
let buscaItem = "";     // texto da caixa "incluir outro lançamento" (ver buscaAdicionar, calculo/rastro.js)

const aberto = () => pilha.length > 0;

function abrirRastro(chave){
  if(!chave) return;
  // chave que termina no período (cat:mdo:entressafra, a célula de uma coluna
  // de período) já abre filtrada nele; os botões do rastro continuam trocando
  const m = /:(safra|entressafra)$/.exec(chave);
  if(pilha[pilha.length-1] !== chave) { pilha.push(chave); periodo = m ? m[1] : "todos"; buscaItem = ""; }
}
function voltarRastro(){ pilha.pop(); periodo = "todos"; buscaItem = ""; }
function fecharRastro(){ pilha = []; jaAberto = false; buscaItem = ""; }
function filtrarRastro(p){ periodo = p; if(ultimoR) pintarRastro(ultimoR); }
/** Digitar na busca de "incluir outro lançamento" só repinta o modal (rápido), não o app inteiro. */
function filtrarBuscaItem(texto){ buscaItem = texto; if(ultimoR) pintarRastro(ultimoR); }

function pintarRastro(R){
  const cont = $("#rastro"), fundo = $("#rastro_fundo");
  if(!cont) return;
  ultimoR = R;
  if(!aberto()){ cont.hidden = true; fundo.hidden = true; jaAberto = false; return; }

  const r = rastro(R, pilha[pilha.length-1], periodo);
  if(!r){ fecharRastro(); cont.hidden = true; fundo.hidden = true; return; }

  // Tudo que vem de calculo/rastro.js é texto puro e pode citar nome de insumo,
  // equipamento ou rota digitados pelo usuário — por isso passa por esc().
  // linha normal, ou linha com checkbox pra marcar/desmarcar um lancamento do
  // ERP que conta (ou nao) no orcamento -- ver rastroReformaBiItem() em calculo/rastro.js
  /* Linha com quantidade: produto do sistema, com o campo do que a reforma vai
     usar. quantidade x valor medio do ano = orcamento daquele produto. */
  const linhaQtd = l => `<div class="ra-linha ra-linha-qtd">
      <div class="ra-flag-corpo">
        <div class="ra-rot">${esc(l.rot)}</div>
        ${l.sub ? `<div class="ra-sub">${esc(l.sub)}</div>` : ""}
      </div>
      <div class="ra-qtd-cel">
        <input type="text" inputmode="decimal" class="ra-qtd" value="${esc(String(l.qtd.valor))}"
          data-qtd-cod="${esc(l.qtd.cod)}" data-qtd-conjunto="${esc(l.qtd.conjunto)}"
          data-qtd-produto="${esc(l.qtd.produto)}" placeholder="0" title="Quantidade que a reforma vai usar">
        <span class="ra-val">${esc(l.val)}</span>
        <span class="ra-sub">${l.qtd.valor ? brl(Number(String(l.qtd.valor).replace(",","."))*l.qtd.media) : "—"}</span>
      </div>
    </div>`;
  const linha = l => l.qtd ? linhaQtd(l) : l.flag ? `<label class="ra-linha ra-linha-flag">
      <input type="checkbox" data-flag-cod="${esc(l.flag.cod)}" data-flag-conjunto="${esc(l.flag.conjunto)}"
        data-flag-chave="${esc(l.flag.chave)}" data-flag-origem="${esc(l.flag.origem)}"${l.flag.ligado?" checked":""}>
      <div class="ra-flag-corpo">
        <div class="ra-rot">${esc(l.rot)}${l.sub?`<span class="ra-sub">${esc(l.sub)}</span>`:""}</div>
        <div class="ra-val">${esc(l.val)}</div>
      </div>
    </label>` : `<div class="ra-linha${l.ir?" ra-ir":""}"${l.ir?` data-rastro="${esc(l.ir)}" tabindex="0" role="button"`:""}>
      <div class="ra-rot">${esc(l.rot)}${l.sub?`<span class="ra-sub">${esc(l.sub)}</span>`:""}</div>
      <div class="ra-val">${esc(l.val)}${l.ir?'<span class="ra-seta">›</span>':""}</div>
    </div>`;

  // caixa "incluir outro lançamento" -- so existe quando o rastro e de um
  // conjunto de reforma (ver buscaAdicionar em rastroReformaBiItem(),
  // calculo/rastro.js). Busca entre os lancamentos de QUALQUER FROTA da
  // MESMA ESPECIALIDADE (colhedora, caminhao...), de qualquer tag -- o mesmo
  // servico/peca costuma se repetir entre maquinas irmas, e antes so
  // aparecia o que ja tinha sido lancado nesta unidade exata. Mostra de qual
  // frota veio quando nao e a propria, pra nao confundir com lancamento
  // desta unidade.
  const blocoBusca = r.buscaAdicionar ? (()=>{
    const {cod, conjunto} = r.buscaAdicionar;
    const jaContam = new Set((r.blocos||[]).flatMap(b=>b.linhas).map(l=>l.flag && l.flag.chave).filter(Boolean));
    const termo = buscaItem.trim().toLowerCase();
    const candidatos = itensDaEspecialidadeNaJanela(cod)
      .filter(it => !jaContam.has(chaveItemReforma(cod, it.compartimento, it)))
      .filter(it => !termo || it.desc.toLowerCase().includes(termo))
      .sort((a,b)=>b.valor-a.valor).slice(0, 30);
    return `<div class="ra-bloco">
      <div class="ra-bloco-tit">Incluir outro lançamento desta especialidade</div>
      <input type="text" class="ra-busca-item" data-flag-busca="1" placeholder="Buscar por descrição..." value="${esc(buscaItem)}">
      <div class="ra-busca-lista">${candidatos.length ? candidatos.map(it=>{
        const chave = chaveItemReforma(cod, it.compartimento, it);
        return `<div class="ra-busca-item-linha" tabindex="0" role="button"
          data-flag-add-cod="${esc(cod)}" data-flag-add-conjunto="${esc(conjunto)}" data-flag-add-chave="${esc(chave)}">
          <div class="ra-rot">${esc(it.compartimento)} — ${esc(it.desc)}<span class="ra-sub">${esc(fmtDataCurta(it.data))}${
            String(it.frota) !== String(cod) ? ` · frota ${esc(it.frota)}` : ""}${
            it.empresa ? ` · ${esc(it.empresa)}` : ""}</span></div>
          <div class="ra-val">${esc(brl(it.valor))}</div>
        </div>`;
      }).join("") : `<div class="hint" style="padding:6px 0">${termo ? "Nada encontrado com esse termo." : "Nenhum outro lançamento desta especialidade pra incluir."}</div>`}</div>
    </div>`;
  })() : "";

  // anima só na transição fechado→aberto — senão pisca a cada tecla digitada em qualquer campo
  const entrando = !jaAberto;
  jaAberto = true;
  // a busca de incluir item repinta o modal a cada tecla (pra filtrar a lista);
  // sem isso o campo perderia o foco e o cursor a cada letra digitada
  const foco = document.activeElement;
  const eraBusca = foco && foco.matches && foco.matches("[data-flag-busca]");
  const selecao = eraBusca ? foco.selectionStart : null;

  cont.innerHTML = `
    <div class="ra-modal${r.largo?" ra-largo":""}${entrando?" pop-in":""}">
    <div class="ra-topo">
      <div class="ra-nav">
        ${pilha.length>1 ? '<button class="btn" id="ra_voltar">‹ Voltar</button>' : ""}
        <button class="ghost-btn" id="ra_fechar" title="Fechar" aria-label="Fechar">✕</button>
      </div>
      <div class="ra-tit">${esc(r.titulo)}</div>
      <div class="ra-subtit">${esc(r.subtitulo)}</div>
      <div class="ra-valor">${esc(r.valor)}</div>
      ${r.voltar ? `<div class="ra-caminho">${pilha.map((c,i)=>
        `<span${i===pilha.length-1?' class="ra-aqui"':""}>${esc(nomeCurto(c))}</span>`).join(" › ")}</div>` : ""}
      ${r.temPeriodo ? `<div class="ra-periodo">
        ${[["todos","Ano todo"],["safra","Safra"],["entressafra","Entressafra"]].map(([k,n])=>
          `<button data-ra-periodo="${k}" class="${periodo===k?"on":""}">${n}</button>`).join("")}
      </div>` : ""}
    </div>
    <div class="ra-corpo">
      ${(r.destaques||[]).length ? `<div class="ra-faixa">
        ${r.destaques.map(d=>`<div class="ra-dest">
          <div class="ra-dest-rot">${esc(d.rot)}</div>
          <div class="ra-dest-val">${esc(d.val)}</div>
          ${d.sub?`<div class="ra-dest-sub">${esc(d.sub)}</div>`:""}
        </div>`).join("")}
      </div>` : ""}
      ${(r.tabelas||[]).map(t=>`<div class="ra-bloco">
        <div class="ra-bloco-tit">${esc(t.titulo)}</div>
        <div class="tblwrap ra-tbl"><table>
          <thead><tr>${t.cab.map((c,i)=>`<th${i?' class="num"':""}>${esc(c)}</th>`).join("")}</tr></thead>
          <tbody>${t.linhas.map(l=>`<tr>${l.map((c,i)=>
            `<td${i?' class="num"':""}>${esc(c)}</td>`).join("")}</tr>`).join("")}
          ${t.rodape ? `<tr>${t.rodape.map((c,i)=>
            `<td class="tot${i?" num":""}">${esc(c)}</td>`).join("")}</tr>` : ""}
          </tbody></table></div>
        ${t.nota?`<div class="hint" style="margin-top:8px">${esc(t.nota)}</div>`:""}
      </div>`).join("")}
      ${(r.blocos||[]).map(b=>`<div class="ra-bloco">
        <div class="ra-bloco-tit">${esc(b.titulo)}</div>
        ${b.linhas.map(linha).join("")}
      </div>`).join("")}
      ${blocoBusca}
      ${(r.premissas||[]).length ? `<div class="ra-bloco ra-prem">
        <div class="ra-bloco-tit">Premissas usadas</div>
        ${r.premissas.map(p=>`<div class="ra-linha"><div class="ra-rot">${esc(p.rot)}${p.sub?`<span class="ra-sub">${esc(p.sub)}</span>`:""}</div>
          <div class="ra-val">${esc(p.val)}</div></div>`).join("")}
      </div>` : ""}
      ${r.nota ? `<div class="hint" style="margin-top:10px">${esc(r.nota)}</div>` : ""}
    </div>
    </div>`;
  if(eraBusca){
    const novo = cont.querySelector("[data-flag-busca]");
    if(novo){ novo.focus(); try{ novo.setSelectionRange(selecao, selecao); }catch(err){} }
  }
  cont.hidden = false;
  fundo.hidden = false;
}

/** "2026-04-01" -> "01/04/2026" */
function fmtDataCurta(iso){
  const [a,m,d] = String(iso||"").split("-");
  return a ? `${d}/${m}/${a}` : "";
}

function nomeCurto(chave){
  const s = String(chave); const i = s.indexOf(":");
  const tipo = i<0 ? s : s.slice(0,i), arg = i<0 ? "" : s.slice(i+1);
  if(tipo==="total") return "Custo total";
  if(tipo==="etapa") return arg.length>16 ? arg.slice(0,15)+"…" : arg;
  if(tipo==="ativ")  return arg;
  if(tipo==="nat")   return "Natureza";
  if(tipo==="mes")   return "Mês";
  if(tipo==="pessoas") return arg==="total" ? "Efetivo total" : arg.split(":")[1]||arg;
  return chave;
}

/* ---------- DICA AO PASSAR O MOUSE ----------
   Todo número com rastro (data-rastro) mostra, parado o mouse sobre ele, o
   começo da explicação: título, valor e as primeiras linhas de "como se
   chegou". O clique continua abrindo o rastro completo. Vale para qualquer
   tabela ou cartão do app que ligue data-rastro — não há dica escrita à mão
   por célula, e por isso ela nunca diz algo diferente do rastro.

   A dica usa o R do último render(): nada é recalculado ao passar o mouse. */
let dicaEl = null, dicaTimer = null, dicaAlvo = null;
function dicaEsconder(){ clearTimeout(dicaTimer); dicaAlvo = null; if(dicaEl) dicaEl.hidden = true; }
function dicaMostrar(alvo){
  if(!ultimoR || !alvo.isConnected) return;
  let r = null;
  const m = /:(safra|entressafra)$/.exec(alvo.dataset.rastro);
  try{ r = rastro(ultimoR, alvo.dataset.rastro, m ? m[1] : "todos"); }catch(err){ r = null; }
  if(!r) return;
  const bloco = (r.blocos||[]).find(b=>(b.linhas||[]).length) || null;
  const linhas = bloco ? bloco.linhas.slice(0,5) : [];
  if(!dicaEl){ dicaEl = document.createElement("div"); dicaEl.className = "ra-dica"; dicaEl.hidden = true;
    dicaEl.setAttribute("role","tooltip"); document.body.appendChild(dicaEl); }
  dicaEl.innerHTML = `<div class="ra-dica-tit">${esc(r.titulo)}</div>
    ${r.subtitulo ? `<div class="ra-dica-sub">${esc(r.subtitulo)}</div>` : ""}
    <div class="ra-dica-val">${esc(r.valor||"")}</div>
    ${bloco ? `<div class="ra-dica-bloco">${esc(bloco.titulo)}</div>` +
      linhas.map(l=>`<div class="ra-dica-l"><span>${esc(l.rot)}</span><b>${esc(l.val)}</b></div>`).join("") +
      (bloco.linhas.length>5 ? `<div class="ra-dica-mais">+ ${bloco.linhas.length-5} linha(s)</div>` : "") : ""}
    <div class="ra-dica-pe">Clique para ver o cálculo completo ›</div>`;
  dicaEl.hidden = false;
  const a = alvo.getBoundingClientRect(), d = dicaEl.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = Math.min(Math.max(8, a.left + a.width/2 - d.width/2), vw - d.width - 8);
  let y = a.bottom + 8;
  if(y + d.height > vh - 8) y = Math.max(8, a.top - d.height - 8);
  dicaEl.style.left = x+"px"; dicaEl.style.top = y+"px";
}
document.addEventListener("mouseover", e=>{
  const alvo = e.target.closest && e.target.closest("[data-rastro]");
  // dentro do proprio rastro a linha ja e a explicacao
  if(!alvo || alvo.closest("#rastro")){ if(dicaAlvo && !(alvo && alvo===dicaAlvo)) dicaEsconder(); return; }
  if(alvo === dicaAlvo) return;
  dicaEsconder(); dicaAlvo = alvo;
  dicaTimer = setTimeout(()=>{ if(dicaAlvo===alvo) dicaMostrar(alvo); }, 350);
});
document.addEventListener("mouseout", e=>{
  if(!dicaAlvo) return;
  const para = e.relatedTarget;
  if(!para || !dicaAlvo.contains(para)) dicaEsconder();
});
["click","scroll","keydown"].forEach(ev=>document.addEventListener(ev, dicaEsconder, true));

export { abrirRastro, aberto, fecharRastro, filtrarRastro, filtrarBuscaItem, pintarRastro, voltarRastro };

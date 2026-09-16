import { rastro } from '../calculo/rastro.js';
import { $ } from '../nucleo/formato.js';

/* ---------- MODAL DE RASTRO ----------
   Explica um KPI ou custo descendo a cadeia: total, centro de custo,
   etapa, atividade, área, horas, equipamento, consumo, preço e premissa.
   Guarda a pilha de navegação, para o botão voltar. O conteúdo é redesenhado
   a cada render(), então acompanha qualquer edição que o usuário faça. */

let pilha = [];        // chaves visitadas; a última é a que está na tela
let periodo = "todos";  // 'todos' | 'safra' | 'entressafra' — filtro do nível atual
let jaAberto = false;   // controla a animação de entrada: só toca ao abrir, não a cada render()
let ultimoR = null;     // R do último render(), pra trocar o filtro sem recalcular o plano inteiro

const aberto = () => pilha.length > 0;

function abrirRastro(chave){
  if(!chave) return;
  if(pilha[pilha.length-1] !== chave) { pilha.push(chave); periodo = "todos"; }
}
function voltarRastro(){ pilha.pop(); periodo = "todos"; }
function fecharRastro(){ pilha = []; jaAberto = false; }
function filtrarRastro(p){ periodo = p; if(ultimoR) pintarRastro(ultimoR); }

function pintarRastro(R){
  const cont = $("#rastro"), fundo = $("#rastro_fundo");
  if(!cont) return;
  ultimoR = R;
  if(!aberto()){ cont.hidden = true; fundo.hidden = true; jaAberto = false; return; }

  const r = rastro(R, pilha[pilha.length-1], periodo);
  if(!r){ fecharRastro(); cont.hidden = true; fundo.hidden = true; return; }

  const linha = l => `<div class="ra-linha${l.ir?" ra-ir":""}"${l.ir?` data-rastro="${l.ir}" tabindex="0" role="button"`:""}>
      <div class="ra-rot">${l.rot}${l.sub?`<span class="ra-sub">${l.sub}</span>`:""}</div>
      <div class="ra-val">${l.val}${l.ir?'<span class="ra-seta">›</span>':""}</div>
    </div>`;

  // anima só na transição fechado→aberto — senão pisca a cada tecla digitada em qualquer campo
  const entrando = !jaAberto;
  jaAberto = true;

  cont.innerHTML = `
    <div class="ra-modal${r.largo?" ra-largo":""}${entrando?" pop-in":""}">
    <div class="ra-topo">
      <div class="ra-nav">
        ${pilha.length>1 ? '<button class="btn" id="ra_voltar">‹ Voltar</button>' : ""}
        <button class="ghost-btn" id="ra_fechar" title="Fechar" aria-label="Fechar">✕</button>
      </div>
      <div class="ra-tit">${r.titulo}</div>
      <div class="ra-subtit">${r.subtitulo||""}</div>
      <div class="ra-valor">${r.valor}</div>
      ${r.voltar ? `<div class="ra-caminho">${pilha.map((c,i)=>
        `<span${i===pilha.length-1?' class="ra-aqui"':""}>${nomeCurto(c)}</span>`).join(" › ")}</div>` : ""}
      ${r.temPeriodo ? `<div class="ra-periodo">
        ${[["todos","Ano todo"],["safra","Safra"],["entressafra","Entressafra"]].map(([k,n])=>
          `<button data-ra-periodo="${k}" class="${periodo===k?"on":""}">${n}</button>`).join("")}
      </div>` : ""}
    </div>
    <div class="ra-corpo">
      ${(r.destaques||[]).length ? `<div class="ra-faixa">
        ${r.destaques.map(d=>`<div class="ra-dest">
          <div class="ra-dest-rot">${d.rot}</div>
          <div class="ra-dest-val">${d.val}</div>
          ${d.sub?`<div class="ra-dest-sub">${d.sub}</div>`:""}
        </div>`).join("")}
      </div>` : ""}
      ${(r.tabelas||[]).map(t=>`<div class="ra-bloco">
        <div class="ra-bloco-tit">${t.titulo}</div>
        <div class="tblwrap ra-tbl"><table>
          <thead><tr>${t.cab.map((c,i)=>`<th${i?' class="num"':""}>${c}</th>`).join("")}</tr></thead>
          <tbody>${t.linhas.map(l=>`<tr>${l.map((c,i)=>
            `<td${i?' class="num"':""}>${c}</td>`).join("")}</tr>`).join("")}
          ${t.rodape ? `<tr>${t.rodape.map((c,i)=>
            `<td class="tot${i?" num":""}">${c}</td>`).join("")}</tr>` : ""}
          </tbody></table></div>
        ${t.nota?`<div class="hint" style="margin-top:8px">${t.nota}</div>`:""}
      </div>`).join("")}
      ${(r.blocos||[]).map(b=>`<div class="ra-bloco">
        <div class="ra-bloco-tit">${b.titulo}</div>
        ${b.linhas.map(linha).join("")}
      </div>`).join("")}
      ${(r.premissas||[]).length ? `<div class="ra-bloco ra-prem">
        <div class="ra-bloco-tit">Premissas usadas</div>
        ${r.premissas.map(p=>`<div class="ra-linha"><div class="ra-rot">${p.rot}</div>
          <div class="ra-val">${p.val}</div></div>`).join("")}
      </div>` : ""}
      ${r.nota ? `<div class="hint" style="margin-top:10px">${r.nota}</div>` : ""}
    </div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
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

export { abrirRastro, aberto, fecharRastro, filtrarRastro, pintarRastro, voltarRastro };

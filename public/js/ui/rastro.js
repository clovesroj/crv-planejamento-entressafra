import { rastro } from '../calculo/rastro.js';
import { $, brl } from '../nucleo/formato.js';

/* ---------- PAINEL DE RASTRO ----------
   Gaveta que explica um custo descendo a cadeia: total, centro de custo,
   etapa, atividade, área, horas, equipamento, consumo, preço e premissa.
   Guarda a pilha de navegação, para o botão voltar. O conteúdo é redesenhado
   a cada render(), então acompanha qualquer edição que o usuário faça. */

let pilha = [];   // chaves visitadas; a última é a que está na tela

const aberto = () => pilha.length > 0;

function abrirRastro(chave){
  if(!chave) return;
  if(pilha[pilha.length-1] !== chave) pilha.push(chave);
}
function voltarRastro(){ pilha.pop(); }
function fecharRastro(){ pilha = []; }

function pintarRastro(R){
  const gaveta = $("#rastro"), fundo = $("#rastro_fundo");
  if(!gaveta) return;
  if(!aberto()){ gaveta.hidden = true; fundo.hidden = true; return; }

  const r = rastro(R, pilha[pilha.length-1]);
  if(!r){ fecharRastro(); gaveta.hidden = true; fundo.hidden = true; return; }

  const linha = l => `<div class="ra-linha${l.ir?" ra-ir":""}"${l.ir?` data-rastro="${l.ir}" tabindex="0" role="button"`:""}>
      <div class="ra-rot">${l.rot}${l.sub?`<span class="ra-sub">${l.sub}</span>`:""}</div>
      <div class="ra-val">${l.val}${l.ir?'<span class="ra-seta">›</span>':""}</div>
    </div>`;

  gaveta.innerHTML = `
    <div class="ra-topo">
      <div class="ra-nav">
        ${pilha.length>1 ? '<button class="btn" id="ra_voltar">‹ Voltar</button>' : ""}
        <button class="ghost-btn" id="ra_fechar" title="Fechar" aria-label="Fechar">✕</button>
      </div>
      <div class="ra-tit">${r.titulo}</div>
      <div class="ra-subtit">${r.subtitulo||""}</div>
      <div class="ra-valor">${brl(r.valor)}</div>
      ${r.voltar ? `<div class="ra-caminho">${pilha.map((c,i)=>
        `<span${i===pilha.length-1?' class="ra-aqui"':""}>${nomeCurto(c)}</span>`).join(" › ")}</div>` : ""}
    </div>
    <div class="ra-corpo">
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
    </div>`;
  gaveta.hidden = false;
  fundo.hidden = false;
}

function nomeCurto(chave){
  const [tipo, arg] = String(chave).split(":");
  if(tipo==="total") return "Custo total";
  if(tipo==="etapa") return arg.length>16 ? arg.slice(0,15)+"…" : arg;
  if(tipo==="ativ")  return arg;
  if(tipo==="nat")   return "Natureza";
  if(tipo==="mes")   return "Mês";
  return chave;
}

export { abrirRastro, aberto, fecharRastro, pintarRastro, voltarRastro };

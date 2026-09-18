import { bulaDoProduto } from '../io/agrofit.js';
import { AGROFIT_BUSCA, insLista } from '../nucleo/estado.js';
import { $, esc, urlWeb } from '../nucleo/formato.js';

/* ---------- BUSCA DE BULA NA AGROFIT, EM MODAL ----------
   Mesma estrutura do modal de ficha técnica (ui/insumos.js): um card por vez,
   estado transitório em AGROFIT_BUSCA (nucleo/estado.js) — não é dado do
   plano, é só a tela de confirmação de qual produto da Embrapa é o nosso. */
function candidato(p, ix){
  const bula = bulaDoProduto(p);
  const ativos = (p.ingrediente_ativo_detalhado || []).map(a=>
    `${esc(a.ingrediente_ativo)} ${esc(a.concentracao)} ${esc(a.unidade_medida||"")}`.trim()).join(" + ");
  return `<div class="fx-item fx-largo">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div>
        <b style="font-size:13px;color:var(--ink)">${esc((p.marca_comercial||[]).join(", ") || "—")}</b>
        <div class="hint">${esc(p.titular_registro||"—")} · registro nº ${esc(p.numero_registro)}</div>
      </div>
      <button class="btn p" data-agrovinc="${ix}"${bula?"":' disabled title="este produto não tem bula cadastrada na Agrofit"'}>Vincular</button>
    </div>
    <div style="margin-top:8px;font-size:12.5px;color:var(--ink)">${ativos || "—"}</div>
    <div class="hint" style="margin-top:4px">${esc(p.formulacao||"—")}${
      p.classificacao_toxicologica ? " · "+esc(p.classificacao_toxicologica) : ""}</div>
    ${bula ? `<div class="hint" style="margin-top:4px">Bula de ${esc(bula.data_inclusao||"—")}${urlWeb(bula.url)
      ? ` — <a href="${esc(urlWeb(bula.url))}" target="_blank" rel="noopener">ver PDF</a>` : ""}</div>`
      : '<div class="hint" style="margin-top:4px;color:var(--warn)">sem bula cadastrada</div>'}
  </div>`;
}

function pintarAgrofitModal(){
  const cont = $("#agrofit_modal"), fundo = $("#agrofit_fundo");
  if(!cont) return;
  const b = AGROFIT_BUSCA;
  if(!b){ cont.hidden = true; fundo.hidden = true; return; }
  const i = insLista()[b.ix];
  if(!i){ cont.hidden = true; fundo.hidden = true; return; }

  const corpo = b.carregando
    ? `<div class="hint">Buscando na Agrofit...</div>`
    : b.erro
      ? `<div class="hint" style="color:var(--warn)">${esc(b.erro)}</div>`
      : (b.resultados||[]).length
        ? `<div class="fx-grade">${b.resultados.map((p,ix)=>candidato(p,ix)).join("")}</div>`
        : `<div class="hint">Nenhum produto encontrado na Agrofit com esse nome e fabricante. Tente ajustar o
           nome comercial ou o fabricante no cadastro e buscar de novo — a Agrofit só tem produto com
           registro de agrotóxico/fitossanitário no Mapa; fertilizante simples ou bioestimulante pode não estar lá.</div>`;

  cont.innerHTML = `
    <div class="ra-modal fx-modal pop-in">
    <div class="ra-topo">
      <div class="ra-nav"><div></div>
        <button class="ghost-btn" id="agro_fechar" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="ra-tit">Buscar bula na Agrofit</div>
      <div class="ra-subtit">${esc(i.prod)}${i.fab ? " · "+esc(i.fab) : ""}</div>
    </div>
    <div class="ra-corpo">${corpo}</div>
    </div>`;
  cont.hidden = false;
  fundo.hidden = false;
}

export { pintarAgrofitModal };

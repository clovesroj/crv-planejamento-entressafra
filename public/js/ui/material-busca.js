import { buscarMateriais } from '../io/materiais.js';
import { esc } from '../nucleo/formato.js';

/* ---------- BUSCA DE MATERIAL (Custos Administrativos) ----------
   O catálogo tem mais de 120 mil itens e mora no servidor: cada busca é uma
   consulta (por código ou nome), e a lista de resultados não pode ser montada
   uma vez só como a dos outros comboboxes (ui/componentes.js).

   Um popup só, preso ao <body> e posicionado sob o campo ativo, em vez de uma
   lista dentro de cada célula, por dois motivos: (1) render() refaz a tabela
   inteira — e o leve() faz isso 260 ms depois de cada tecla num campo de
   tabela — então uma lista dentro da célula morreria no meio da digitação;
   (2) dentro do .tblwrap ela ficaria cortada pela rolagem da tabela.

   Quem escolhe o que fazer com o material é quem liga (app/eventos.js): aqui
   só se busca e se devolve o item. */

const ATRASO = 250;      // ms depois da última tecla
const MINIMO = 2;        // caracteres para começar a buscar
const LIMITE = 15;       // resultados na lista

let popup = null, itens = [], total = 0, foco = -1, alvo = null, seq = 0, timer = null, ctrl = null, aoEscolher = null;

const ehBusca = el => !!(el && el.classList && el.classList.contains('mat-busca'));

/** Campo de texto que busca material. `extra` leva os data-* de quem também grava o texto digitado. */
function campoBuscaMaterial({ linha, campo, valor = '', extra = '', placeholder = '', estilo = '' }) {
  return `<input type="text" class="mat-busca" data-matlinha="${linha}" data-matcampo="${campo}" ${extra}
    value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off" role="combobox"
    aria-autocomplete="list" aria-expanded="false"${estilo ? ` style="${estilo}"` : ''}>`;
}

function garantirPopup() {
  if (popup) return popup;
  popup = document.createElement('div');
  popup.className = 'mat-popup';
  popup.setAttribute('role', 'listbox');
  popup.hidden = true;
  document.body.appendChild(popup);
  // mousedown, não click, e sem tirar o foco do campo: o blur fecharia a lista antes do clique
  popup.addEventListener('mousedown', e => {
    e.preventDefault();
    const it = e.target.closest('.lista-select-item');
    if (it) escolher(itens[+it.dataset.ix]);
  });
  return popup;
}

function fechar() {
  if (popup) popup.hidden = true;
  foco = -1; itens = []; total = 0;
  document.querySelectorAll('.mat-busca[aria-expanded="true"]').forEach(c => c.setAttribute('aria-expanded', 'false'));
}

// o campo pode ter sido recriado pelo render() desde que a busca saiu: vale o que está com o foco agora
function posicionar() {
  const campo = document.activeElement;
  if (!ehBusca(campo)) { fechar(); return; }
  campo.setAttribute('aria-expanded', 'true');
  const r = campo.getBoundingClientRect();
  popup.style.minWidth = Math.max(r.width, 440) + 'px';
  popup.style.left = Math.max(8, Math.min(r.left, innerWidth - popup.offsetWidth - 8)) + 'px';
  const abaixo = r.bottom + 4;
  // sem espaço embaixo, abre para cima
  popup.style.top = (abaixo + popup.offsetHeight > innerHeight && r.top > popup.offsetHeight + 8
    ? r.top - popup.offsetHeight - 4 : abaixo) + 'px';
}

function pintar(mensagem) {
  const p = garantirPopup();
  p.innerHTML = itens.length
    ? itens.map((m, i) => `<div class="lista-select-item${i === foco ? ' foco' : ''}" data-ix="${i}" role="option">
        <b>${esc(m.codigo)}</b> · ${esc(m.descricao)}
        <span class="mat-sub">${esc([m.compl1, m.grupo && 'Grupo ' + m.grupo, m.un && 'Un. ' + m.un].filter(Boolean).join(' · '))}</span></div>`).join('')
      + (total > itens.length ? `<div class="lista-select-vazia">Mais ${total - itens.length} resultado(s) — continue digitando para afinar.</div>` : '')
    : `<div class="lista-select-vazia">${esc(mensagem || 'Nenhum material encontrado.')}</div>`;
  p.hidden = false;
  posicionar();
}

async function consultar(q) {
  const minha = ++seq;
  if (ctrl) ctrl.abort();
  ctrl = new AbortController();
  try {
    const r = await buscarMateriais(q, LIMITE, ctrl.signal);
    if (minha !== seq) return;
    itens = r.itens; total = r.total; foco = -1;
    pintar('Nenhum material encontrado. Confira o código ou o nome — ou importe a planilha em Configurações › Cadastro de Materiais.');
  } catch (e) {
    if (e.name === 'AbortError' || minha !== seq) return;
    itens = []; total = 0;
    pintar('Não consegui buscar agora: ' + e.message);
  }
}

function escolher(m) {
  if (!m || !alvo) return;
  const a = alvo;
  fechar();
  if (aoEscolher) aoEscolher(a.linha, m);
}

/** Liga a busca uma vez, no arranque. `aoEscolher(linha, material)` grava o material na linha. */
function ligarBuscaMaterial(fn) {
  aoEscolher = fn;
  document.addEventListener('input', e => {
    if (!ehBusca(e.target)) return;
    alvo = { linha: +e.target.dataset.matlinha, campo: e.target.dataset.matcampo };
    clearTimeout(timer);
    const q = e.target.value.trim();
    if (q.length < MINIMO) { seq++; if (ctrl) ctrl.abort(); fechar(); return; }
    timer = setTimeout(() => consultar(q), ATRASO);
  });
  document.addEventListener('keydown', e => {
    if (!ehBusca(e.target) || !popup || popup.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); foco = Math.min(foco + 1, itens.length - 1); pintar(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); foco = Math.max(foco - 1, 0); pintar(); }
    else if (e.key === 'Escape') { fechar(); }
    else if (e.key === 'Enter') {
      // o destacado; senão o único resultado; senão o de código igual ao digitado
      const q = e.target.value.trim().toLowerCase();
      const m = itens[foco] || (itens.length === 1 ? itens[0] : itens.find(x => x.codigo.toLowerCase() === q));
      if (m) { e.preventDefault(); escolher(m); }
    }
  });
  // depois do foco voltar (o render() recria o campo), a lista continua aberta; só fecha se o foco saiu de vez
  document.addEventListener('focusout', e => {
    if (ehBusca(e.target)) setTimeout(() => { if (!ehBusca(document.activeElement)) fechar(); }, 180);
  });
  // a lista é fixa na janela: acompanha a rolagem da página e da tabela
  document.addEventListener('scroll', () => { if (popup && !popup.hidden) posicionar(); }, true);
  window.addEventListener('resize', () => { if (popup && !popup.hidden) posicionar(); });
}

export { campoBuscaMaterial, ligarBuscaMaterial };

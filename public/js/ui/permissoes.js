/**
 * Trava de edição por perfil, na interface.
 *
 * Todo usuário VÊ todas as abas. Nas que o perfil não edita, os controles de
 * edição ficam desativados, com um aviso de "somente visualização"; filtros,
 * detalhamentos (rastro), exportar e tema continuam funcionando.
 *
 * Isto é conveniência: a regra de verdade está no servidor
 * (server/permissoes.js), que descarta o que o perfil não pode gravar.
 *
 * Três camadas, da mais visível para a mais defensiva:
 *   1. aplicarPermissoes() desativa os controles após cada render();
 *   2. um aviso no topo da aba e um chip na barra superior;
 *   3. um listener em fase de CAPTURA no document barra input/change/click
 *      antes de chegar a qualquer handler — cobre controle recriado entre um
 *      render e outro, ou handler registrado direto no elemento.
 *
 * AO CRIAR UM CONTROLE: por padrão, controle dentro de uma aba editável é
 * tratado como edição e travado para quem não edita a aba — o lado seguro do
 * erro. Se ele só muda a VISUALIZAÇÃO (filtro, abrir detalhe), inclua o
 * seletor em VISUAIS.
 */
import { USUARIO, podeEditar, areasDePermissao } from '../nucleo/sessao.js';

/* Controles que não gravam nada no plano: liberados para qualquer perfil.
   Lista conferida na interface — cada um destes foi acionado e nenhuma chave
   salva mudou. */
const VISUAIS = [
  '[data-rastro]', '[data-ra-periodo]', '#ra_voltar', '#ra_fechar',
  '[data-abrefrota]', '[data-fitoabre]', '[data-planoabre]', '[data-infx]', '[data-rendmes]', '#rm_fechar', '[data-tercdet]', '#td_fechar',
  '#sel_fun', '#busca_fun', '#sel_cat', '#sel_orig', '#sel_dest', '#sel_trat', '#busca_trat', '#sel_acomp_mes',
  '#sel_crit_ger', '#sel_crit_cabe', '.tbl-busca',
  '#ref_busca', '#sel_ref_ag', '#sel_ref_fam', '#ref_frota', '#sel_ref_prop',
  '#gr_inicio', '#gr_fim', '#sel_gr_empresa', '#sel_gr_esp', '#sel_gr_ag', '#sel_gr_comp', '#gr_frota', '#sel_gr_prop', '#sel_gr_reforma',
  '#sel_ins_fam', '#btn_ins_recolher', '[data-fam]', '[data-inusos]', '[data-abretrat]', '[data-exportar]',
  '[data-dimdet]', '[data-ddaba]', '#dd_fechar', '[data-dimmes]', '[data-dimfrente]', '[data-apmes]', '#am_fechar',
  '#btn_export', '#btn_theme',
  '#sel_qf_mes', '#sel_qf_grupo',
].join(',');

const CONTROLES = 'input, select, textarea, button';

/* Aba (área de permissão) dona de um elemento. O modal de rendimento mensal
   fica fora das abas e grava o dimensionamento. Abas sem nada editável (Capa,
   Painel, Validação) e a de Usuários — que tem regra própria, só admin — não
   entram. O Resumo de Pessoas passou a ter o quadro ativo, e por isso ganhou
   área própria em server/permissoes.js. */
function areaDe(el) {
  if (!el || !el.closest) return null;
  if (el.closest('#rendm')) return 'dimens';
  // Detalhe do dimensionamento: grava utilizacao, escala e turnos (DIM). A
  // funcao da atividade, nao — ela grava PLANO[cod].fcod, e quem manda nela e a
  // permissao do Plano Operacional. Sem esta linha, um perfil que edita o
  // Dimensionamento mudava a funcao na tela e o servidor descartava em silencio.
  if (el.closest('#dimdet')) return el.matches('[data-fc]') ? 'plano' : 'dimens';
  if (el.closest('#apoiomes')) return 'dimens';   // quantidade por mes do apoio grava DIM
  // Cadastro de Insumos, Grupos de Insumos (Configurações), o modal de busca
  // na Agrofit e o de editar produto gravam chaves da área 'insumos' no
  // servidor — as telas usam a mesma permissão, sem um toggle à parte no
  // catálogo. Os dois modais ficam fora de qualquer <section> (são <aside>
  // globais, ver index.html), então sem esta linha os campos de dentro nunca
  // seriam travados, não importa o perfil.
  if (el.closest('#insbase') || el.closest('#config') || el.closest('#agrofit_modal') || el.closest('#insedit')) return 'insumos';
  // detalhamento do terceiro por sub-modo (aviao, drone...): grava TERC_SUB,
  // mesma area de TERC_TAR (Plano de Contas) — o modal abre a partir do "3º"
  // no Plano Operacional, mas fora de qualquer <section>, como os de cima.
  if (el.closest('#tercdet')) return 'contas';
  const sec = el.closest('section[id]');
  if (!sec) return null;
  return areasDePermissao().some(a => a.id === sec.id) ? sec.id : null;
}

function bloqueado(el) {
  if (!USUARIO || !el || el.matches(VISUAIS)) return false;
  const area = areaDe(el);
  return !!area && !podeEditar(area);
}

/* Desativa só o que esta trava desativou (data-travado): controles que o
   próprio app desativa por regra (campo calculado, mês travado) não são
   religados ao ganhar permissão. */
function travar(raiz) {
  raiz.querySelectorAll(CONTROLES).forEach(el => {
    if (el.matches(VISUAIS) || el.disabled) return;
    el.disabled = true;
    el.dataset.travado = '1';
  });
}
function destravar(raiz) {
  raiz.querySelectorAll('[data-travado]').forEach(el => {
    el.disabled = false;
    delete el.dataset.travado;
  });
}

function aviso(sec, mostrar) {
  let a = sec.querySelector(':scope > .aviso-leitura');
  if (!mostrar) { if (a) a.remove(); return; }
  if (a) return;
  a = document.createElement('div');
  a.className = 'aviso-leitura';
  a.setAttribute('role', 'note');
  a.textContent = 'Somente visualização — seu perfil não edita esta aba.';
  const titulo = sec.querySelector(':scope > h2');
  const lead = titulo && titulo.nextElementSibling && titulo.nextElementSibling.classList.contains('lead')
    ? titulo.nextElementSibling : titulo;
  if (lead) lead.after(a); else sec.prepend(a);
}

function chipDaAbaAtual() {
  const chip = document.getElementById('chip_leitura');
  if (!chip) return;
  const atual = document.querySelector('section.on');
  let area = atual && areasDePermissao().some(x => x.id === atual.id) ? atual.id : null;
  if (!area && atual && (atual.id === 'config' || atual.id === 'insbase')) area = 'insumos';
  chip.hidden = !(USUARIO && area && !podeEditar(area));
}

function aplicarPermissoes() {
  if (!USUARIO) return;
  const areas = new Set(areasDePermissao().map(a => a.id));
  document.querySelectorAll('section[id]').forEach(sec => {
    if (!areas.has(sec.id)) return;
    const pode = podeEditar(sec.id);
    sec.classList.toggle('so-leitura', !pode);
    if (pode) destravar(sec); else travar(sec);
    aviso(sec, !pode);
  });
  const rm = document.getElementById('rendm');
  if (rm) { if (podeEditar('dimens')) destravar(rm); else travar(rm); }
  const td = document.getElementById('tercdet');
  if (td) { if (podeEditar('contas')) destravar(td); else travar(td); }
  const pode_ins = podeEditar('insumos');
  const agro = document.getElementById('agrofit_modal');
  if (agro) { if (pode_ins) destravar(agro); else travar(agro); }
  ['insbase', 'config'].forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.toggle('so-leitura', !pode_ins);
    if (pode_ins) destravar(sec); else travar(sec);
    aviso(sec, !pode_ins);
  });
  chipDaAbaAtual();
}

/* Camada 3: barra a edição antes de qualquer handler (fase de captura). */
function barrar(e) {
  const alvo = e.target && e.target.closest && e.target.closest(CONTROLES);
  if (!alvo || !bloqueado(alvo)) return;
  e.stopImmediatePropagation();
  if (e.type === 'click') e.preventDefault();
}
['input', 'change', 'click'].forEach(tipo => document.addEventListener(tipo, barrar, true));

// o chip acompanha a troca de aba
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('nav button[data-s]')) setTimeout(chipDaAbaAtual, 0);
});

export { aplicarPermissoes, bloqueado };

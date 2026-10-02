import { buscarMateriais, codigosMateriais, importarLoteMateriais, resumoMateriais } from '../io/materiais.js';
import { extrairMateriais } from '../io/materiais-planilha.js';
import { podeEditar } from '../nucleo/sessao.js';
import { $, esc, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- CADASTRO DE MATERIAIS (Configurações) ----------
   O catálogo do ERP tem mais de 120 mil itens e mora no servidor, numa tabela
   própria: esta tela nunca o carrega inteiro. Ela busca por código ou nome (os
   primeiros 100 resultados) e importa a planilha nova.

   Fica FORA do render(): render() refaz todas as abas a cada tecla, e aqui o
   que muda é resultado de busca no servidor, não dado do plano. Quem pinta é
   esta tela mesma, ao abrir a aba, ao digitar na busca e ao fim de uma importação.

   Importar tem duas etapas, para a pessoa ver antes de gravar: ler a planilha e
   conferir contra o que já está cadastrado; depois confirmar. Só entram os
   códigos que ainda não existem — o que já está cadastrado fica como está. */

const LIMITE_BUSCA = 100;
const LOTE_ENVIO = 3000;       // abaixo do teto de 5000 do servidor
const ATRASO_BUSCA = 250;

let SEQ_BUSCA = 0;             // só a resposta da última busca pinta a tela
let timerBusca = null;
let IMPORTANDO = false;
let ANALISE = null;            // {novos:[...], lidas, jaCadastrados, ...} da planilha lida, ou null

const nomeColuna = {
  codigo: 'Código', descricao: 'Descrição', compl1: 'Descrição Complementar 1', compl2: 'Descrição Complementar 2',
  saldo: 'Saldo Atual', grupo: 'Grupo de Produto', un: 'Unidade Medida Consumo', utiliza_custo: 'Utiliza no Custo',
  nbm: 'Código NBM', tipo: 'Tipo de Produto',
};

const dataBR = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const dormir = ms => new Promise(r => setTimeout(r, ms));

function pintarResumo(r) {
  const el = $('#k_cadmat');
  if (!el) return;
  el.innerHTML =
    kpi('Materiais cadastrados', '', r ? fmt(r.total) : '—', 'catálogo do ERP') +
    kpi('Última importação', 't', r && r.ultima ? dataBR(r.ultima) : '—', r && r.total ? 'entrada do último lote' : 'nenhuma planilha importada ainda');
}

function pintarResultado(q, r) {
  const comp = m => [m.compl1, m.compl2].filter(Boolean).join(' · ');
  $('#cm_tabela').innerHTML = th([['Código'], ['Descrição'], ['Complemento'], ['Grupo'], ['Un.'], ['Saldo', 1], ['Tipo']]) + '<tbody>' +
    (r.itens.length ? r.itens.map(m => `<tr>
      <td class="calc"><b>${esc(m.codigo)}</b></td><td>${esc(m.descricao)}</td><td class="calc">${esc(comp(m)) || '—'}</td>
      <td class="calc">${esc(m.grupo) || '—'}</td><td class="calc">${esc(m.un) || '—'}</td>
      <td class="num calc">${fmt(m.saldo)}</td><td class="calc">${esc(m.tipo) || '—'}</td></tr>`).join('')
      : '<tr><td colspan="7" class="calc">Nenhum material encontrado para esta busca.</td></tr>') + '</tbody>';
  $('#cm_info').textContent = r.total > r.itens.length
    ? `Mostrando ${fmt(r.itens.length)} de ${fmt(r.total)} materiais — digite mais do código ou do nome para afinar a busca.`
    : `${fmt(r.total)} ${r.total === 1 ? 'material encontrado' : 'materiais encontrados'}.`;
}

function pintarBuscaVazia(resumo) {
  $('#cm_tabela').innerHTML = '';
  $('#cm_info').textContent = resumo && resumo.total
    ? `Digite o código ou parte do nome do material para buscar entre os ${fmt(resumo.total)} cadastrados.`
    : 'O cadastro está vazio. Importe a planilha de materiais do ERP no painel acima.';
}

async function buscar() {
  const q = ($('#cm_busca').value || '').trim();
  const seq = ++SEQ_BUSCA;
  if (!q) { pintarBuscaVazia(await resumoMateriais().catch(() => null)); return; }
  $('#cm_info').textContent = 'Buscando…';
  try {
    const r = await buscarMateriais(q, LIMITE_BUSCA);
    if (seq === SEQ_BUSCA) pintarResultado(q, r);
  } catch (e) {
    if (seq === SEQ_BUSCA) $('#cm_info').textContent = 'Não consegui buscar agora: ' + e.message;
  }
}

async function abrir() {
  const r = await resumoMateriais().catch(() => null);
  pintarResumo(r);
  if (!($('#cm_busca').value || '').trim()) pintarBuscaVazia(r);
}

/* ---------- importação ---------- */
const status = (html, tipo) => {
  const el = $('#cm_status');
  el.innerHTML = html;
  el.dataset.tipo = tipo || '';
};

function liberarImportar(sim) {
  // quem não edita o cadastro nunca vê o botão habilitado (o servidor também recusa)
  $('#cm_importar').disabled = !(sim && podeEditar('cadmat'));
}

async function lerPlanilha(arquivo) {
  if (typeof XLSX === 'undefined') throw new Error('A biblioteca de planilha não carregou. Verifique a conexão e tente de novo.');
  const buf = await arquivo.arrayBuffer();
  // dense + sem fórmula/estilo: a exportação tem mais de 100 mil linhas e 29 colunas
  let wb = XLSX.read(buf, { type: 'array', dense: true, cellFormula: false, cellHTML: false, cellStyles: false, cellText: false });
  let ultimoErro = null;
  for (const nome of wb.SheetNames) {
    try {
      const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, defval: null, raw: true });
      const ext = extrairMateriais(linhas);
      wb = null;   // solta a planilha inteira da memória antes de seguir
      return ext;
    } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro || new Error('A planilha não tem nenhuma aba.');
}

async function analisar(arquivo) {
  ANALISE = null; liberarImportar(false);
  if (!arquivo) { status(''); return; }
  try {
    status(`Lendo <b>${esc(arquivo.name)}</b>… planilhas grandes (mais de 100 mil linhas) levam cerca de 15 a 30 segundos. Não feche a página.`, 'info');
    await dormir(50);                      // deixa a mensagem aparecer antes do trabalho pesado
    const ext = await lerPlanilha(arquivo);
    status('Conferindo com o que já está cadastrado…', 'info');
    const existentes = new Set(await codigosMateriais());
    const novos = ext.itens.filter(m => !existentes.has(m.codigo));
    ANALISE = { novos, lidas: ext.lidas, jaCadastrados: ext.itens.length - novos.length, semCodigo: ext.semCodigo, repetidas: ext.repetidas, faltando: ext.faltando };

    const avisos = [];
    if (ext.semCodigo) avisos.push(`${fmt(ext.semCodigo)} linha(s) sem código foram ignoradas.`);
    if (ext.repetidas) avisos.push(`${fmt(ext.repetidas)} código(s) repetido(s) na planilha — vale a primeira ocorrência.`);
    if (ext.faltando.length) avisos.push('Colunas não encontradas (ficam em branco): ' + ext.faltando.map(c => nomeColuna[c]).join(', ') + '.');
    status(`<b>${esc(arquivo.name)}</b>: ${fmt(ext.lidas)} materiais lidos, <b>${fmt(ANALISE.jaCadastrados)} já cadastrados</b> (ficam como estão) e `
      + `<b>${fmt(novos.length)} novos</b>.${novos.length ? ' Clique em <b>Importar materiais novos</b> para cadastrar.' : ' Não há nada a importar.'}`
      + (avisos.length ? '<br>' + avisos.map(esc).join('<br>') : ''), novos.length ? 'ok' : 'info');
    liberarImportar(novos.length > 0);
  } catch (e) {
    console.error(e);
    status('Não consegui ler esta planilha: ' + esc(e.message), 'erro');
  }
}

async function importar() {
  if (IMPORTANDO || !ANALISE || !ANALISE.novos.length) return;
  IMPORTANDO = true; liberarImportar(false); $('#cm_arquivo').disabled = true;
  const { novos } = ANALISE;
  let gravados = 0, existentes = 0;
  try {
    for (let i = 0; i < novos.length; i += LOTE_ENVIO) {
      status(`Importando… ${fmt(Math.min(i, novos.length))} de ${fmt(novos.length)} materiais novos.`, 'info');
      const r = await importarLoteMateriais(novos.slice(i, i + LOTE_ENVIO));
      gravados += r.novos; existentes += r.existentes;
    }
    status(`<b>Importação concluída:</b> ${fmt(gravados)} materiais novos cadastrados`
      + (existentes ? ` (${fmt(existentes)} já existiam e foram ignorados)` : '') + '.', 'ok');
    ANALISE = null; $('#cm_arquivo').value = '';
    abrir(); buscar();
  } catch (e) {
    console.error(e);
    // o que já entrou fica: rodar de novo pula os códigos cadastrados
    status(`A importação parou depois de ${fmt(gravados)} materiais: ${esc(e.message)}. Escolha a planilha de novo e importe outra vez — só entram os que faltam.`, 'erro');
    ANALISE = null;
  } finally {
    IMPORTANDO = false; $('#cm_arquivo').disabled = !podeEditar('cadmat');
  }
}

/* ---------- ligações ---------- */
document.addEventListener('click', e => {
  if (e.target.id === 'cm_importar') importar();
});
// A aba abre por clique no menu, por restauração da última aba (recarregar a
// página) e por link da Validação — nenhum deles passa por um evento só. Vigiar a
// classe "on" da seção pega os três.
{
  const secao = document.getElementById('cadmat');
  if (secao) {
    let aberta = false;
    const conferir = () => {
      const on = secao.classList.contains('on');
      if (on && !aberta) abrir();
      aberta = on;
    };
    new MutationObserver(conferir).observe(secao, { attributes: true, attributeFilter: ['class'] });
    conferir();
  }
}
document.addEventListener('input', e => {
  if (e.target.id !== 'cm_busca') return;
  clearTimeout(timerBusca);
  timerBusca = setTimeout(buscar, ATRASO_BUSCA);
});
document.addEventListener('change', e => {
  if (e.target.id === 'cm_arquivo') analisar(e.target.files && e.target.files[0]);
});

export { abrir as abrirCadastroMateriais };

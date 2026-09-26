#!/usr/bin/env node
/**
 * Extrai, do relatorio publico do Power BI "GERENCIAL (R$/Km)", as tabelas
 * "Analitico" das paginas R$/Ton e R$/Km (custo por tonelada colhida / por km
 * rodado, quebrado em Combustivel/Lubrificante/Peca/Pneu/Recapagem/Servico).
 *
 * ESPECIALIDADE: cada pagina usa um widget diferente pra esse filtro --
 * R$/Ton (e paginas parecidas) tem um radio de 7 itens (role=radio, um
 * clique so); R$/Km tem uma arvore ampla com busca (role=treeitem, entre
 * varias dezenas de categorias -- busca o rotulo exato e marca so ele). As 7
 * especialidades de producao (colhedora, caminhao, trator...) sao as mesmas
 * nos dois; o script detecta o widget da pagina e usa o certo.
 *
 * Relatorio DIFERENTE do de gasto-reforma-bi.mjs: aqui as tabelas ja vem
 * PRE-AGREGADAS (dezenas de linhas, nao milhares de lancamentos), entao nao
 * ha risco do teto de linhas/travamento do Chromium que forcou o fatiamento
 * agressivo daquele script. O fatiamento aqui e por MES so porque R$/Ton e
 * R$/Km so fazem sentido acumulados num periodo -- pra montar serie historica.
 *
 * TECNICA DE EXTRACAO: em vez de rolar a grade (como gasto-reforma-bi.mjs),
 * usa o proprio "Copiar > Copiar selecao" do menu de contexto do Power BI
 * sobre o visual da tabela, e le o resultado (TSV) da area de transferencia.
 * Mais simples e mais robusto pra uma matriz com muitas colunas (a leitura
 * por acessibilidade fragmenta a matriz em varias grades, uma por coluna).
 * Precisa de permissao de clipboard concedida ao contexto do Playwright.
 *
 * Uso:
 *   node scripts/gerencial-bi.mjs --inicio=2025-11-01 --fim=2026-09-25 --empresafrota=PFCMO-MG
 *   node scripts/gerencial-bi.mjs --inicio=2026-04-01 --fim=2026-09-25 --empresafrota=PFCMO-MG --frotapropria=SIM
 *   node scripts/gerencial-bi.mjs --inicio=2026-04-01 --fim=2026-09-25 --empresafrota=PFCMO-MG --visivel
 *
 * Parametros:
 *   --inicio=AAAA-MM-DD   (obrigatorio)
 *   --fim=AAAA-MM-DD      (obrigatorio)
 *   --passo=mes|trimestre|semana|tudo  (opcional, padrao mes)
 *   --paginas=A,B         (opcional; padrao: "R$ / Ton,R$ / Km")
 *   --especialidades=A,B  (opcional; padrao: as 7 de producao, ver
 *                         ESPECIALIDADES_PADRAO -- multiplica o numero de
 *                         fatias por especialidade pedida)
 *   --empresafrota=X      (opcional; filtra o slicer "Empresa Frota" -- sem
 *                         isso, extrai TODAS as empresas juntas numa linha so)
 *   --frotapropria=SIM|NAO (opcional; sem isso, nao mexe no filtro -- extrai
 *                         proprias+terceiras juntas)
 *   --reforma=SIM|NAO     (opcional, mesma logica de --frotapropria)
 *   --refazer             (opcional) extrai de novo fatias ja no arquivo
 *   --zerar               (opcional) ignora o arquivo anterior
 *   --visivel             (opcional) abre o Chromium com janela
 *
 * Saida: public/js/dados/gerencial-bi.js -- modulo ES simples. Ainda nao
 * existe tela que consome isso (a extracao veio antes da tela): quando a
 * tela for desenhada, decide-se ai se tambem grava no Postgres.
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LINK_BI = 'https://app.powerbi.com/view?r=eyJrIjoiN2Y0OTkxOTItNzVjMy00N2YwLTkxZWYtYzNmNzJiYjVjN2MzIiwidCI6IjEzMzAzY2I0LTNmZDQtNDMzNC04ZTJlLWFiZDZkMTNjZDQ2YSJ9';

/** Nao e erro de automacao -- e o Power BI dizendo "essa combinacao de filtros
 * nao tem nenhuma linha" (ver marcarCheckboxSlicer de Empresa Frota abaixo).
 * extrairFatia() trata isto como resultado vazio, sem gastar as 3 tentativas
 * normais nem entrar na lista de falhas no fim. */
class SemDados extends Error {}

const PAGINAS_PADRAO = ['R$ / Ton', 'R$ / Km'];
const ESPECIALIDADES_PADRAO = [
  'CAMINHAO - CANAVIEIRO', 'CAMINHAO - TRANSBORDO', 'CARREGADEIRA - CANA',
  'COLHEDORA - CANA', 'REBOQUE - CANAVIEIRO', 'TRATOR - CANA', 'TRATOR - TRANSBORDO',
];

function argValor(nome, padrao = null) {
  const p = process.argv.find(a => a.startsWith(`--${nome}=`));
  return p ? p.slice(nome.length + 3) : padrao;
}
function argFlag(nome) {
  return process.argv.includes(`--${nome}`);
}

const INICIO = argValor('inicio');
const FIM = argValor('fim');
const PASSO = (argValor('passo', 'mes') || 'mes').toLowerCase();
const PAGINAS = (argValor('paginas', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const ESPECIALIDADES = (argValor('especialidades', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const EMPRESA_FROTA = (argValor('empresafrota', '') || '').trim();
const FROTA_PROPRIA = (argValor('frotapropria', '') || '').trim().toUpperCase(); // SIM | NAO | ''
const REFORMA = (argValor('reforma', '') || '').trim().toUpperCase(); // SIM | NAO | ''
const VISIVEL = argFlag('visivel');
const REFAZER = argFlag('refazer');
const ZERAR = argFlag('zerar');

if (!INICIO || !FIM) {
  console.error('Uso: node scripts/gerencial-bi.mjs --inicio=AAAA-MM-DD --fim=AAAA-MM-DD ' +
    '[--passo=mes|trimestre|semana|tudo] [--paginas=R$ / Ton,R$ / Km] [--especialidades=A,B] [--empresafrota=PFCMO-MG] ' +
    '[--frotapropria=SIM|NAO] [--reforma=SIM|NAO] [--refazer] [--zerar] [--visivel]');
  process.exit(1);
}
if (FIM < INICIO) { console.error('O --fim e anterior ao --inicio.'); process.exit(1); }
if (FROTA_PROPRIA && !['SIM', 'NAO'].includes(FROTA_PROPRIA)) { console.error('--frotapropria precisa ser SIM ou NAO.'); process.exit(1); }
if (REFORMA && !['SIM', 'NAO'].includes(REFORMA)) { console.error('--reforma precisa ser SIM ou NAO.'); process.exit(1); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.resolve(__dirname, '../public/js/dados/gerencial-bi.js');

/** "2026-04-01" -> "01/04/2026" (formato que os campos de data do relatorio usam). */
function paraDataBR(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Preenche os campos de data "Data de inicio"/"Data de termino" (mesmo padrao do gasto-reforma-bi.mjs). */
async function aplicarFiltroData(page, inicioISO, fimISO) {
  const inicioLoc = page.locator('input[aria-label^="Data de início"]').first();
  const fimLoc = page.locator('input[aria-label^="Data de término"]').first();
  await inicioLoc.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  if (!(await inicioLoc.count()) || !(await fimLoc.count())) return false;
  await inicioLoc.fill(paraDataBR(inicioISO));
  await inicioLoc.press('Tab');
  await fimLoc.fill(paraDataBR(fimISO));
  await fimLoc.press('Tab');
  return true;
}

/**
 * Marca um item pelo atributo "title" dentro do slicer identificado pelo
 * rotulo do cabecalho (.slicer-header-text) -- usado para os slicers do tipo
 * checkbox (Empresa Frota, Frota Propria, Reforma). Cada opcao e um elemento
 * [role="checkbox"][title="<rotulo>"].
 *
 * Precisa de um clique de mouse de VERDADE (page.mouse.click), nao
 * elemento.click() via evaluate -- testado a fundo: o clique sintetico marca
 * aria-checked="true" (fica assim mesmo minutos depois) mas o filtro nunca
 * aplica de verdade (o rotulo "Empresa: X" no topo da pagina nunca muda).
 * Um clique de mouse real, na posicao de tela do elemento, resolve.
 */
async function marcarCheckboxSlicer(page, rotuloSlicer, tituloOpcao) {
  const handle = await page.evaluateHandle(({ rotuloSlicer, tituloOpcao }) => {
    const headers = Array.from(document.querySelectorAll('.slicer-header-text'))
      .filter(el => el.textContent.trim() === rotuloSlicer);
    for (const header of headers) {
      let container = header;
      for (let i = 0; i < 8 && container; i++) {
        container = container.parentElement;
        const item = container?.querySelector(`[role="checkbox"][title="${tituloOpcao}"]`);
        if (item && item.offsetParent !== null) return item;
      }
    }
    return null;
  }, { rotuloSlicer, tituloOpcao });
  const el = handle.asElement();
  if (!el) return false;
  // .click() nativo do elemento (nao page.mouse.click por coordenada): rola
  // pra dentro da vista e espera a checagem de "acionavel" sozinho, o que
  // page.mouse.click nao faz -- mais robusto quando o item esta dentro de um
  // painel com rolagem propria.
  await el.click({ timeout: 10000 });
  return true;
}

/**
 * Especialidade como radio (7 itens, role=radio) -- widget da pagina R$/Ton.
 * Um clique real (ElementHandle.click()) resolve, confirmado testando: muda
 * o modelo/valores da propria tabela da pagina de verdade.
 */
async function marcarEspecialidadeRadio(page, especialidade) {
  const handle = await page.evaluateHandle((especialidade) => {
    const headers = Array.from(document.querySelectorAll('.slicer-header-text'))
      .filter(el => el.textContent.trim() === 'Especialidade');
    for (const header of headers) {
      let c = header;
      for (let i = 0; i < 8 && c; i++) {
        c = c.parentElement;
        const item = c?.querySelector(`[role="radio"][title="${especialidade}"]`);
        if (item) return item;
      }
    }
    return null;
  }, especialidade);
  const el = handle.asElement();
  if (!el) return false;
  await el.click({ timeout: 10000 });
  return true;
}

/**
 * Especialidade como arvore ampla com busca (role=treeitem) -- widget da
 * pagina R$/Km (campo mais amplo, dezenas de categorias, nao so as 7 de
 * producao). Busca o rotulo exato; so clica se AINDA nao estiver marcado --
 * ao digitar na busca, o Power BI as vezes ja mostra o unico resultado como
 * "selecionado" (destaque de navegacao, nao selecao de verdade), e clicar
 * nesse estado DESMARCA em vez de marcar (confirmado testando).
 */
async function aplicarFiltroEspecialidadeArvore(page, especialidade) {
  const card = page.locator(
    `xpath=//*[contains(@class,"slicer-header-text") and normalize-space(text())="Especialidade"]` +
    '/ancestor::div[contains(@class,"slicer-container")][1]');
  if (!(await card.count().catch(() => 0))) return false;

  const campo = card.locator('input.searchInput, input[placeholder="Pesquisar"]').first();
  if (!(await campo.count().catch(() => 0))) return false;
  await campo.click();
  await campo.fill('');
  await campo.pressSequentially(especialidade, { delay: 60 });
  await page.waitForTimeout(1200);

  const item = card.getByRole('treeitem', { name: especialidade, exact: true }).first();
  if (!(await item.count().catch(() => 0))) return false;
  const jaSelecionado = await item.evaluate(el => !!el.querySelector('.slicerCheckbox.selected')).catch(() => false);
  if (!jaSelecionado) {
    await item.click({ timeout: 10000 });
    await page.waitForTimeout(1000);
  }
  await campo.fill('');
  await page.waitForTimeout(500);
  return true;
}

/** Aplica Especialidade usando o widget certo pra pagina (ver comentarios das duas funcoes acima). */
async function aplicarEspecialidade(page, pagina, especialidade) {
  return pagina === 'R$ / Ton'
    ? marcarEspecialidadeRadio(page, especialidade)
    : aplicarFiltroEspecialidadeArvore(page, especialidade);
}

async function abrirPainelFiltros(page) {
  const jaAberto = await page.locator('input[aria-label^="Data de início"]').count().catch(() => 0);
  if (jaAberto) return true;
  const link = page.getByRole('link', { name: /Filtros do Relatório/i }).first();
  await link.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
  if (!(await link.count().catch(() => 0))) return false;
  // Este "link" e o container inteiro do visual "Indicador" (botao de
  // abrir/fechar o painel) -- evaluate(el=>el.click()) nao dispara o handler
  // real (testado); precisa de um clique de mouse de verdade (force:true so
  // pra pular a checagem de visibilidade, que falha por causa da sombra de
  // acessibilidade).
  await link.click({ force: true, timeout: 10000 }).catch(() => {});
  await page.locator('input[aria-label^="Data de início"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  return (await page.locator('input[aria-label^="Data de início"]').count().catch(() => 0)) > 0;
}

async function fecharPainelFiltros(page) {
  const link = page.getByRole('link', { name: /Fechar Filtros/i }).first();
  if (await link.count().catch(() => 0)) await link.click({ force: true, timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400);
}

/**
 * Troca de pagina pelo nome da aba (nav do relatorio). O botao da aba e so a
 * sombra de acessibilidade (visibility:hidden, sem caixa na tela -- o Power
 * BI pinta a navegacao de verdade em canvas/webgl em paralelo); por isso
 * evaluate(el=>el.click()) em vez de clique de mouse por coordenada (que nao
 * acha geometria nenhuma pra mirar).
 */
async function abrirAba(page, rotulo) {
  const tentativas = [
    () => page.getByRole('tab', { name: rotulo, exact: true }),
    () => page.getByRole('button', { name: rotulo, exact: true }),
    () => page.getByText(rotulo, { exact: true }),
  ];
  for (const tentativa of tentativas) {
    const loc = tentativa();
    if (await loc.count().catch(() => 0)) {
      await loc.first().evaluate(el => el.click());
      return true;
    }
  }
  return false;
}

/**
 * Copia a tabela "Analitico" da pagina atual via menu de contexto (botao
 * direito > Copiar > Copiar selecao) e le o resultado (TSV) da area de
 * transferencia. O contexto do navegador precisa ter clipboard-read/write
 * concedidos (feito em main(), uma vez, na criacao do browser context).
 */
async function copiarTabelaAnalitico(page) {
  // A matriz "Analitico" renderiza em canvas/DOM normal, mas em paralelo o
  // Power BI monta uma arvore de acessibilidade ESCONDIDA que fragmenta a
  // mesma matriz em varias grades pequenas (uma por coluna, testado -- por
  // isso getByRole('grid').first() pega so 2 colunas). O container visual de
  // verdade (.visualContainer largo, com as colunas de columnheader dentro)
  // e o alvo certo pra clicar -- geometria real, nao a sombra.
  const container = await page.evaluateHandle(() => {
    const els = [...document.querySelectorAll('.visualContainer')];
    return els.find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 800 && r.height > 150 && el.querySelector('[role="columnheader"]');
    }) || null;
  });
  const box = await container.asElement()?.boundingBox();
  if (!box) throw new Error('Nao achei o container visual da tabela "Analitico" (largo, com columnheader) -- confira com --visivel.');
  await page.mouse.click(box.x + box.width / 2, box.y + Math.min(box.height / 2, 60), { button: 'right' });
  await page.waitForTimeout(500);

  const copiar = page.getByText('Copiar', { exact: true }).first();
  if (!(await copiar.count().catch(() => 0))) { await page.keyboard.press('Escape'); return null; }
  await copiar.hover();
  await page.waitForTimeout(400);

  const copiarSelecao = page.getByText('Copiar seleção', { exact: true }).first();
  if (!(await copiarSelecao.count().catch(() => 0))) { await page.keyboard.press('Escape'); return null; }
  await copiarSelecao.click();
  await page.waitForTimeout(500);

  const tsv = await page.evaluate(() => navigator.clipboard.readText()).catch(err => {
    throw new Error(`Nao consegui ler a area de transferencia (${err.message}). Confira se o contexto do Playwright concedeu clipboard-read.`);
  });
  return tsv || null;
}

// Colunas que so identificam a linha (label) -- nao contam pra decidir se a
// linha tem dado de verdade ou e "padding" da virtualizacao do Power BI.
const COLUNAS_ROTULO = new Set(['Empresa Frota', 'Modelo', '.']);

/**
 * TSV (cabecalho na 1a linha) -> [{coluna: valor, ...}, ...]. A matriz do
 * Power BI, ao copiar, repete o rotulo (Empresa/Modelo) uma vez por FROTA
 * individual do grupo mas so preenche os valores na 1a linha de cada grupo
 * (testado -- confirma pelo "Qtd Frota" batendo com o numero de linhas
 * repetidas); as demais vem com todas as colunas de valor vazias. Descarta
 * essas linhas "so rotulo, sem valor" -- nao sao dado, so o efeito colateral
 * de copiar a matriz com todas as frotas do grupo expandidas por baixo.
 */
function parseTSV(tsv) {
  const linhas = tsv.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
  if (linhas.length < 2) return { colunas: [], linhas: [] };
  const colunas = linhas[0].split('\t').map(c => c.trim());
  const colunasValor = colunas.filter(c => !COLUNAS_ROTULO.has(c));
  const dados = linhas.slice(1).map(l => {
    const celulas = l.split('\t');
    const obj = {};
    colunas.forEach((c, i) => { obj[c] = (celulas[i] ?? '').trim(); });
    return obj;
  }).filter(obj => colunasValor.some(c => obj[c] !== ''));
  return { colunas, linhas: dados };
}

/* ================== FATIAS DE PERIODO (mesma logica do gasto-reforma-bi.mjs) ================== */
function somaDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function fimDoPasso(iso, passo) {
  const d = new Date(iso + 'T00:00:00Z');
  if (passo === 'semana') return somaDias(iso, 6);
  if (passo === 'trimestre') { d.setUTCMonth(d.getUTCMonth() + 3, 0); return d.toISOString().slice(0, 10); }
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}
function fatias(inicio, fim, passo) {
  if (passo === 'tudo') return [{ inicio, fim }];
  const out = [];
  let ini = inicio;
  while (ini <= fim) {
    const f = fimDoPasso(ini, passo);
    out.push({ inicio: ini, fim: f > fim ? fim : f });
    ini = somaDias(f, 1);
  }
  return out;
}
const chaveFatia = f => `${f.inicio}|${f.fim}|${f.pagina}|${f.especialidade || ''}|${f.empresaFrota || ''}|${f.frotaPropria || ''}|${f.reforma || ''}`;

/**
 * Prepara a pagina; se falhar (visto na pratica: o clique no slicer Empresa
 * Frota as vezes nao emplaca numa 2a+ fatia na mesma sessao do navegador,
 * mesmo com o reload completo), tenta mais uma vez do zero antes de desistir
 * -- mesmo padrao de retry do gasto-reforma-bi.mjs pro filtro de data.
 */
async function prepararPagina(page, fatia) {
  await prepararPaginaTentativa(page, fatia);
}

/** Recarrega, abre a aba pedida e aplica os filtros. */
async function prepararPaginaTentativa(page, { inicio, fim, pagina, especialidade }) {
  await page.goto(LINK_BI, { waitUntil: 'load', timeout: 60000 });
  await page.getByText(/R\$ \/ Km/i).first().waitFor({ state: 'attached', timeout: 45000 });
  const abriu = await abrirAba(page, pagina);
  if (!abriu) throw new Error(`Nao encontrei a aba "${pagina}" na navegacao do relatorio. O layout deve ter mudado -- confira com --visivel.`);
  // pagina que nao e a default (R$/Ton) precisa de mais tempo pra assentar
  // depois da troca de verdade -- clicar nos slicers cedo demais fica com
  // referencia a um DOM que esta sendo trocado no meio do redesenho.
  await page.waitForTimeout(pagina === 'R$ / Ton' ? 4000 : 7000);

  const painelOk = await abrirPainelFiltros(page);
  if (!painelOk) throw new Error('Nao consegui abrir o painel "Filtros do Relatório" (link nao encontrado).');
  await page.waitForTimeout(2000);

  const dataOk = await aplicarFiltroData(page, inicio, fim).catch(() => false);
  if (!dataOk) {
    const labels = await page.locator('input[aria-label]').evaluateAll(els => els.map(e => e.getAttribute('aria-label'))).catch(() => []);
    throw new Error(
      `Nao encontrei os campos de data para a fatia ${inicio}..${fim} (${pagina}). aria-label de <input> encontrados: ${JSON.stringify(labels)}. ` +
      `Confira manualmente com --visivel.`
    );
  }
  // Mudar a data dispara uma consulta nova pro dado inteiro da pagina.
  // Clicar em outro slicer (Empresa Frota) ANTES dela terminar marca o
  // elemento (aria-checked fica true, visivel, tudo "certo") mas o filtro de
  // verdade nunca aplica -- a consulta da data, que ainda estava em voo,
  // sobrescreve. Testado a fundo: sem essa espera falha quase sempre; com
  // ela, nao falhou nenhuma vez.
  await page.waitForTimeout(8000);

  if (especialidade) {
    const ok = await aplicarEspecialidade(page, pagina, especialidade).catch(() => false);
    if (!ok) throw new Error(`Nao consegui marcar "${especialidade}" no filtro Especialidade (fatia ${inicio}..${fim}, ${pagina}). Confira a grafia exata.`);
    await page.waitForTimeout(5000);
  }

  if (EMPRESA_FROTA) {
    let ok = await marcarCheckboxSlicer(page, 'Empresa Frota', EMPRESA_FROTA).catch(() => false);
    if (!ok) {
      // pode ser so timing (a lista de opcoes ainda nao acabou de montar depois
      // do filtro de especialidade) -- uma espera extra e uma 2a tentativa antes
      // de concluir que a opcao nao existe de verdade.
      await page.waitForTimeout(3000);
      ok = await marcarCheckboxSlicer(page, 'Empresa Frota', EMPRESA_FROTA).catch(() => false);
    }
    if (!ok) {
      // O Power BI corta da lista a opcao que nao bate com o filtro de
      // Especialidade ja aplicado (cross-filter): se "PFCMO-MG" sumiu, e
      // porque essa empresa nao tem NENHUMA frota dessa especialidade neste
      // periodo -- resultado vazio de verdade, nao falha de automacao.
      // Retentar nao muda nada; sinaliza como "sem dados" pra nao gastar as
      // 3 tentativas normais a toa.
      throw new SemDados(`"${EMPRESA_FROTA}" nao aparece no slicer Empresa Frota -- sem frota dessa especialidade (fatia ${inicio}..${fim}, ${pagina}${especialidade ? ', ' + especialidade : ''}).`);
    }
    // o rotulo de texto no topo assenta rapido, mas a matriz (varias colunas,
    // agregando tudo de novo) demora mais -- confirmado copiando tabela com
    // empresa errada mesmo com o rotulo ja certo. A checagem linha-a-linha
    // logo depois de copiar pega o que essa espera nao cobrir.
    await page.waitForTimeout(6000);
  }

  if (FROTA_PROPRIA) {
    const titulo = FROTA_PROPRIA === 'SIM' ? 'SIM' : 'NÃO'; // Frota Propria usa titulo em CAIXA ALTA
    const ok = await marcarCheckboxSlicer(page, 'Frota Própria', titulo).catch(() => false);
    if (!ok) console.warn(`  Nao achei o filtro "Frota Própria" nesta pagina (${pagina}) -- seguindo sem ele.`);
    await page.waitForTimeout(2000);
  }

  if (REFORMA) {
    const titulo = REFORMA === 'SIM' ? 'Sim' : 'Não'; // Reforma usa titulo capitalizado (nao caixa alta)
    const ok = await marcarCheckboxSlicer(page, 'Reforma', titulo).catch(() => false);
    if (!ok) console.warn(`  Nao achei o filtro "Reforma" nesta pagina (${pagina}) -- seguindo sem ele.`);
    await page.waitForTimeout(1000);
  }

  await fecharPainelFiltros(page);
  await page.waitForTimeout(1500);

  if (EMPRESA_FROTA) {
    // confere de verdade, depois de fechar o painel (o rotulo "Empresa: X" no
    // topo da pagina fica escondido enquanto o painel esta aberto) -- nao so
    // confia no clique ter "funcionado" sem checar o efeito
    // O rotulo "Empresa:" no topo e so estilo (nao entra no innerText) -- o
    // que aparece de verdade e so o VALOR, como uma das primeiras linhas da
    // pagina (logo apos as duas datas). Confirmado por inspecao direta.
    const texto = await page.locator('body').innerText().catch(() => '');
    const primeirasLinhas = texto.split('\n').slice(0, 8);
    if (!primeirasLinhas.includes(EMPRESA_FROTA)) {
      throw new Error(`Marquei "${EMPRESA_FROTA}" no slicer Empresa Frota mas nao apareceu no topo da pagina (visto: ${JSON.stringify(primeirasLinhas)}) (fatia ${inicio}..${fim}, ${pagina}).`);
    }
  }
}

// Coluna que só existe na tabela da própria página -- confere que a copia
// saiu da pagina certa e nao de outra que ficou aberta por engano (o
// abrirAba() usa clique sintetico, que "funciona" sem erro mesmo quando a
// pagina nao troca de verdade -- ja aconteceu, R$/Km saiu com dado de R$/Ton).
const COLUNA_ASSINATURA = { 'R$ / Ton': 'Tonelada', 'R$ / Km': 'Km' };

async function extrairFatiaTentativa(page, fatia) {
  const { inicio, fim, pagina } = fatia;
  await prepararPagina(page, fatia);

  const tsv = await copiarTabelaAnalitico(page);
  if (!tsv) throw new Error('Nao consegui copiar a tabela (menu de contexto ou clipboard falhou).');
  const { colunas, linhas } = parseTSV(tsv);

  const assinatura = COLUNA_ASSINATURA[pagina];
  if (assinatura && !colunas.includes(assinatura)) {
    throw new Error(`Copiei uma tabela sem a coluna "${assinatura}" esperada pra "${pagina}" -- ` +
      `provavelmente copiou a pagina errada. Colunas vistas: ${colunas.join(' | ')}`);
  }
  // O rotulo "Empresa: X" no topo atualiza mais rapido que a matriz pesada
  // (varias colunas, muitos calculos) -- confirmar so pelo rotulo nao basta:
  // ja saiu tabela com OUTRA empresa mesmo com o rotulo certo (visto na
  // pratica, numeros identicos repetidos em meses diferentes = copiou dado
  // requentado de antes do filtro assentar). Confere linha a linha de verdade.
  if (EMPRESA_FROTA) {
    const erradas = linhas.filter(l => l['Empresa Frota'] && l['Empresa Frota'] !== EMPRESA_FROTA);
    if (erradas.length) {
      throw new Error(`A tabela copiada tem linha(s) de outra empresa (${[...new Set(erradas.map(l => l['Empresa Frota']))].join(', ')}), ` +
        `nao so "${EMPRESA_FROTA}" -- a matriz nao tinha assentado no filtro novo ainda quando copiei.`);
    }
  }
  console.log(`  ${linhas.length} linha(s), ${colunas.length} coluna(s): ${colunas.join(' | ')}`);
  return { colunas, linhas };
}

/** Extrai a fatia; se falhar (layout, timing, clique que nao emplacou), tenta mais uma vez do zero. */
// O Power BI e um SPA de terceiro sem API -- alguns cliques (ver comentarios
// em marcarCheckboxSlicer/abrirAba/copiarTabelaAnalitico) sao sensiveis a
// timing e falham do nada de vez em quando, sem padrao fixo (testado: um dia
// emplaca de primeira, no outro precisa de 2-3 tentativas). Por isso repete a
// fatia inteira do zero (reload completo, contexto novo) em vez de tentar
// consertar so o passo que falhou.
async function extrairFatia(novaPagina, fatia) {
  const { inicio, fim, pagina, especialidade } = fatia;
  console.log(`\n=== Fatia ${inicio}..${fim} [${pagina}]${especialidade ? ' ' + especialidade : ''} ===`);
  const MAX_TENTATIVAS = 3;
  let ultimoErro;
  for (let t = 1; t <= MAX_TENTATIVAS; t++) {
    const { context, page } = await novaPagina();
    try {
      return await extrairFatiaTentativa(page, fatia);
    } catch (err) {
      if (err instanceof SemDados) {
        console.log(`  ${err.message} (0 linhas, seguindo)`);
        return { colunas: [], linhas: [] };
      }
      ultimoErro = err;
      console.warn(`  Falhou (tentativa ${t}/${MAX_TENTATIVAS}): ${err.message}`);
    } finally {
      await context.close();
    }
  }
  throw ultimoErro;
}

function conteudoDoArquivo(saida) {
  return `/**
 * GERADO por scripts/gerencial-bi.mjs em ${saida.geradoEm}.
 * Nao editar a mao -- rode o script de novo para atualizar.
 *
 * Tabelas "Analitico" do relatorio GERENCIAL (R$/Ton, R$/Km) do Power BI, por
 * fatia de periodo (mensal por padrao), pagina e especialidade. Cada registro
 * em "registros" e uma linha da tabela tal como copiada do Power BI (colunas
 * variam por pagina -- ver "colunasPorPagina"), com a fatia/filtros usados
 * anexados (_especialidade, _empresaFrota, ...).
 */
export const GERENCIAL_BI = ${JSON.stringify(saida, null, 2)};
`;
}

async function main() {
  const passo = ['mes', 'trimestre', 'semana', 'tudo'].includes(PASSO) ? PASSO : 'mes';
  const paginas = PAGINAS.length ? PAGINAS : PAGINAS_PADRAO;
  const esps = ESPECIALIDADES.length ? ESPECIALIDADES : ESPECIALIDADES_PADRAO;
  const pedidas = paginas.flatMap(pagina => esps.flatMap(especialidade => fatias(INICIO, FIM, passo).map(f => ({
    ...f, pagina, especialidade, empresaFrota: EMPRESA_FROTA || null,
    frotaPropria: FROTA_PROPRIA || null, reforma: REFORMA || null,
  }))));

  let anterior = null;
  if (!ZERAR) {
    try {
      const mod = await import(pathToFileURL(SAIDA).href + `?t=${Date.now()}`);
      anterior = mod.GERENCIAL_BI?.geradoEm ? mod.GERENCIAL_BI : null;
    } catch { /* sem arquivo anterior ainda */ }
  }
  const jaFeitas = new Set((anterior?.periodos || []).map(chaveFatia));
  const aFazer = REFAZER ? pedidas : pedidas.filter(f => !jaFeitas.has(chaveFatia(f)));

  console.log(`Periodo pedido: ${INICIO} a ${FIM} | passo: ${passo} | ${pedidas.length} fatia(s) | paginas: ${paginas.join(', ')} | especialidades: ${esps.join(', ')}` +
    (EMPRESA_FROTA ? ` | empresa frota: ${EMPRESA_FROTA}` : ' | todas as empresas frota') +
    (FROTA_PROPRIA ? ` | frota propria: ${FROTA_PROPRIA}` : '') +
    (REFORMA ? ` | reforma: ${REFORMA}` : ''));
  if (aFazer.length < pedidas.length) {
    console.log(`${pedidas.length - aFazer.length} fatia(s) ja estao no arquivo anterior -- pulando (use --refazer para extrair de novo).`);
  }
  if (!aFazer.length) { console.log('Nada a extrair. O arquivo ja cobre o que foi pedido.'); return; }

  const registrosFinais = [...(anterior?.registros || [])];
  const periodos = [...(anterior?.periodos || [])];
  const chavesPeriodos = new Set(periodos.map(chaveFatia));
  const colunasPorPagina = anterior?.colunasPorPagina || {};

  console.log('Abrindo o relatorio publico do Power BI...');
  const browser = await chromium.launch({ headless: !VISIVEL });

  // Contexto NOVO a cada fatia (nao so page.goto na mesma pagina): visto na
  // pratica que o slicer Empresa Frota falha silenciosamente (clica, aria diz
  // "true", mas o rotulo da tela nao muda) na 2a+ fatia da MESMA sessao do
  // navegador, mesmo com reload completo -- so contexto novo (cookies/estado
  // do relatorio zerados de verdade) resolve.
  async function novaPagina() {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'pt-BR' });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://app.powerbi.com' });
    return { context, page: await context.newPage() };
  }

  try {
    let n = 0;
    const falhas = [];
    for (const fatia of aFazer) {
      n++;
      console.log(`\n--- fatia ${n}/${aFazer.length} ---`);
      let colunas, linhas;
      try {
        ({ colunas, linhas } = await extrairFatia(novaPagina, fatia));
      } catch (err) {
        // Nao aborta o resto do periodo por causa de UMA fatia teimosa --
        // fica de fora de "periodos" (nao marcada como feita), entao rodar o
        // mesmo comando de novo tenta so as que faltaram.
        console.error(`  Desistindo desta fatia depois de todas as tentativas: ${err.message}`);
        falhas.push(`${fatia.inicio}..${fatia.fim} [${fatia.pagina}] ${fatia.especialidade}`);
        continue;
      }
      if (colunas.length) colunasPorPagina[fatia.pagina] = colunas;
      linhas.forEach(l => registrosFinais.push({
        ...l,
        _inicio: fatia.inicio, _fim: fatia.fim, _pagina: fatia.pagina, _especialidade: fatia.especialidade,
        _empresaFrota: fatia.empresaFrota, _frotaPropria: fatia.frotaPropria, _reforma: fatia.reforma,
      }));
      if (!chavesPeriodos.has(chaveFatia(fatia))) {
        periodos.push({ ...fatia });
        chavesPeriodos.add(chaveFatia(fatia));
      }
      const saida = {
        geradoEm: new Date().toISOString(),
        periodos: periodos.slice().sort((a, b) => a.inicio.localeCompare(b.inicio)),
        colunasPorPagina,
        registros: registrosFinais,
      };
      await writeFile(SAIDA, conteudoDoArquivo(saida), 'utf8');
      console.log(`  Gravado: ${registrosFinais.length} registros acumulados, ${periodos.length} fatia(s) cobertas.`);
    }
    console.log(`\nPronto. ${path.relative(process.cwd(), SAIDA)} cobre ${periodos.length} fatia(s).`);
    if (falhas.length) {
      console.warn(`\n${falhas.length} fatia(s) nao saiu mesmo depois de 3 tentativas cada: ${falhas.join(', ')}. ` +
        `Rode o MESMO comando de novo -- as que ja deram certo sao puladas, so essas sao refeitas.`);
      // sai com erro (mesmo tendo gravado o que deu certo) pra quem chama em
      // loop (ex.: rodar-gerencial-bi.ps1) saber que precisa rodar de novo
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Falhou:', err.message);
  process.exit(1);
});

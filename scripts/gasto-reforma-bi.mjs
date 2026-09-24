#!/usr/bin/env node
/**
 * Extrai, do relatorio publico do Power BI ("Movimentacoes Internas"), o
 * gasto por equipamento (Frota) e compartimento mecanico -- cruzando pela
 * *TAG* no fim da Descricao Produto (ex.: "...*CHASSI*"). Alimenta a
 * referencia "gasto real" que a aba Reforma de Frota mostra ao lado do
 * orcamento digitado (so leitura -- nunca substitui o que a pessoa digita).
 *
 * Roda manual, fora do servidor: o link e "Publicar na Web" (anonimo, sem
 * API), entao a unica forma de ler os dados e abrindo o relatorio de
 * verdade num navegador e lendo o que ele renderiza. Por isso o resultado e
 * um instantaneo (arquivo gerado com data), nao dado ao vivo.
 *
 * Uso:
 *   npm run gasto-reforma-bi -- --inicio=2025-01-01 --fim=2026-09-23
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-09-22 --passo=trimestre
 *   npm run gasto-reforma-bi -- --inicio=2026-01-01 --fim=2026-03-31 --especialidades="COLHEDORA - CANA"
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-09-22 --frotas=62522,62523 --visivel
 *
 * PERIODO LONGO EM UMA CHAMADA SO: o teto de seguranca da rolagem (abaixo) e
 * por rolagem, nao por pedido -- um ano nao cabe numa so. Por isso o script
 * quebra o periodo em FATIAS (padrao: uma por mes), extrai uma a uma, soma
 * deduplicando e GRAVA A CADA FATIA. Consequencias praticas:
 *   - "--inicio=2025-01-01 --fim=2026-09-23" funciona direto; nao precisa mais
 *     orquestrar varias chamadas com --merge;
 *   - fatia que mesmo assim bate no teto e partida ao meio e refeita sozinha,
 *     ate o dia, em vez de devolver dado incompleto em silencio;
 *   - interrompeu no meio? rode o MESMO comando de novo: as fatias ja gravadas
 *     sao puladas e a extracao continua de onde parou;
 *   - re-rodar uma fatia nao conta em dobro (deduplicacao por lancamento).
 *
 * Parametros:
 *   --inicio=AAAA-MM-DD    (obrigatorio) inicio do periodo que conta como "ja gasto"
 *   --fim=AAAA-MM-DD       (obrigatorio) fim do periodo
 *   --passo=...            (opcional) tamanho da fatia: mes (padrao), trimestre,
 *                          semana ou tudo (uma fatia so -- o comportamento antigo)
 *   --especialidades=A,B   (opcional) filtra pelo slicer "Especialidade" do proprio
 *                          relatorio ANTES de rolar -- e o maior redutor de volume que
 *                          existe (testado: 769mi -> 62mi so com "COLHEDORA - CANA").
 *                          Use o nome como aparece em dados/frota-base.js (esp). Sem
 *                          isso, cada fatia traz TODAS as especialidades, que e o que
 *                          a tela precisa pra grade de conjuntos ficar completa.
 *                          (--especialidade=, no singular, segue aceito.)
 *   --empresas=A,B         (opcional) filtra por Emp Destino; sem isso, soma todas
 *   --frotas=62522,...     (opcional) filtra por codigo de Frota; sem isso, guarda todo
 *                          codigo de frota que aparecer com produto marcado *COMPARTIMENTO*
 *   --refazer              (opcional) extrai de novo tambem as fatias que ja estao no
 *                          arquivo (por padrao elas sao puladas)
 *   --zerar                (opcional) ignora o arquivo anterior e comeca do zero
 *   --visivel              (opcional) abre o Chromium com janela, para acompanhar/depurar
 *
 * Saida: public/js/dados/gasto-reforma-bi.js -- modulo ES simples, no mesmo
 * padrao dos outros arquivos de dados/, importado direto por ui/reforma.js.
 *
 * O relatorio nao tem uma coluna pronta de "compartimento" na tabela
 * Analitico. Por isso a extracao aplica os filtros "Data" e "Especialidade"
 * (se pedido) que ja existem no proprio relatorio (reduz volume antes de
 * rolar), rola o que sobrou e classifica cada linha pelo texto entre
 * asteriscos da Descricao Produto; linha sem asterisco (frete, seguro, mao
 * de obra...) e ignorada, porque nao pertence a nenhum conjunto mecanico.
 *
 * REFORMA SIM/NAO POR LANCAMENTO: "Reforma" nao e uma coluna da tabela, so um
 * filtro que existe antes de rolar -- nao da pra ler o valor direto de uma
 * linha. Por isso a extracao rola em DUAS passadas: a 1ª pega tudo (Data +
 * Especialidade, sem mexer no filtro Reforma), a 2ª aplica "Reforma = SIM" e
 * rola de novo, so que essa segunda e um SUBCONJUNTO da primeira -- mais
 * rapida. Todo lancamento que aparece nas duas fica `reforma:"SIM"`; o que so
 * aparece na primeira fica `reforma:"NAO"`. Dobra o tempo de extracao (2
 * rolagens), mas e o unico jeito de marcar isso por item e deixar SIM/NAO
 * como filtro de verdade na tela, em vez de decisao tomada so na hora de
 * extrair.
 *
 * TETO DE SEGURANCA: o Power BI nao recicla linha ja rolada (a arvore de
 * acessibilidade so cresce) e a aba derruba ("Target crashed") depois de uns
 * 6-7 mil elementos acumulados. Por isso o script para sozinho em
 * LIMITE_SEGURO_LINHAS (5000, com folga) e avisa no console e no arquivo
 * gerado (`truncado: true`, com a lista em `truncadas`) se cortou antes do
 * fim. Hoje quem reage a isso e o proprio script: a fatia truncada e partida
 * ao meio e refeita. Se mesmo no dia ela truncar, ai sim vale estreitar com
 * --especialidades.
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { storePostgres } = require('../server/store/postgres.js');

// Acima disso, rolar a tabela inteira arrisca travar o Chromium: o Power BI
// nao reaproveita as linhas ja rolamdas (a arvore de acessibilidade so
// cresce), e depois de uns 6-7 mil elementos a aba derruba ("Target
// crashed"). Foi assim que essa constante nasceu -- nao e um numero de
// manual, e o ponto onde o script quebrou de verdade num teste.
const LIMITE_SEGURO_LINHAS = 5000;

const LINK_BI = 'https://app.powerbi.com/view?r=eyJrIjoiOTdiODMxMGQtMGU3MS00YzAzLWEyZWItNDdmODExYmE0MWQxIiwidCI6IjEzMzAzY2I0LTNmZDQtNDMzNC04ZTJlLWFiZDZkMTNjZDQ2YSJ9';

function argValor(nome, padrao = null) {
  const p = process.argv.find(a => a.startsWith(`--${nome}=`));
  return p ? p.slice(nome.length + 3) : padrao;
}
function argFlag(nome) {
  return process.argv.includes(`--${nome}`);
}

const BANCO = argValor('banco') || process.env.DATABASE_URL;

const INICIO = argValor('inicio');
const FIM = argValor('fim');
const EMPRESAS = (argValor('empresas', '') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
const FROTAS = (argValor('frotas', '') || '').split(',').map(s => s.trim()).filter(Boolean);
// --especialidade= (uma) segue valendo; --especialidades= aceita varias
const ESPECIALIDADES = (argValor('especialidades', '') || argValor('especialidade', '') || '')
  .split(',').map(t => t.trim()).filter(Boolean);
const PASSO = (argValor('passo', 'mes') || 'mes').toLowerCase();
const VISIVEL = argFlag('visivel');
const REFAZER = argFlag('refazer');
// --merge era como se somava periodo a periodo; agora somar e o padrao (e
// deduplicado), entao a flag so existe pra nao quebrar quem ja a usa
const ZERAR = argFlag('zerar') && !argFlag('merge');

if (!INICIO || !FIM) {
  console.error('Uso: npm run gasto-reforma-bi -- --inicio=AAAA-MM-DD --fim=AAAA-MM-DD ' +
    '[--passo=mes|trimestre|semana|tudo] [--especialidades=A,B] [--empresas=CRV-MG,...] [--frotas=62522,...] [--refazer] [--zerar] [--visivel]');
  process.exit(1);
}
if (FIM < INICIO) { console.error('O --fim e anterior ao --inicio.'); process.exit(1); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.resolve(__dirname, '../public/js/dados/gasto-reforma-bi.js');

/**
 * Rotulo entre asteriscos mais proximo do FIM da descricao (o padrao usado no
 * ERP). O Power BI devolve o texto com ESPACO NAO-SEPARAVEL (U+00A0) no lugar
 * do espaco, entao a tag saia como "CORTE"+U+00A0+"BASE" e nunca casava com o
 * conjunto "CORTE BASE" da tela -- a coluna ficava vazia para sempre. A troca
 * e feita aqui, na origem; a tela normaliza tambem (normTag em
 * calculo/gasto-real.js), pra consertar os arquivos ja gerados.
 */
function compartimentoDe(desc) {
  const m = desc.match(/\*([^*]+)\*(?!.*\*)/);
  return m ? m[1].replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() : null;
}

/** "1.234,56" (formato BR) -> 1234.56 */
function numBR(s) {
  if (!s) return 0;
  const limpo = String(s).trim().replace(/\./g, '').replace(',', '.');
  return Number(limpo) || 0;
}

/** "22/09/2026" ou "1/1/2026" (sem zero a esquerda) -> "2026-09-22". */
function isoDe(dataBR) {
  const m = String(dataBR).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  return `${a}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Os slicers (Data, Reforma, Empresa...) da pagina Analitico ja ficam no
 * proprio canvas, sem precisar abrir o painel de filtros (funil) -- mais
 * simples e mais estavel do que mexer la. So reduz volume antes de rolar;
 * se algum nao for encontrado (relatorio mudou de layout), o script avisa e
 * segue sem ele -- mais lento, mas nao quebra por causa disso.
 */

/** Marca "Reforma = SIM" no slicer on-canvas -- usada na 2ª passada pra descobrir quais linhas da 1ª são SIM. */
async function aplicarFiltroReformaSim(page) {
  return page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('.slicer-header-text'))
      .filter(el => el.textContent.trim() === 'Reforma');
    if (!headers.length) return false;
    let container = headers[0];
    for (let i = 0; i < 8 && container; i++) {
      container = container.parentElement;
      if (container && container.querySelector('[role="checkbox"][title="SIM"]')) break;
    }
    const item = container?.querySelector('[role="checkbox"][title="SIM"]');
    if (!item) return false;
    item.click();
    return true;
  });
}

/** "2026-04-01" -> "01/04/2026" (o formato que o datepicker do slicer usa). */
function paraDataBR(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Preenche os dois campos de data (inicio/fim) do slicer "Data" on-canvas. */
async function aplicarFiltroData(page, inicioISO, fimISO) {
  const inicioLoc = page.locator('input[aria-label^="Data de início"]').first();
  const fimLoc = page.locator('input[aria-label^="Data de término"]').first();
  if (!(await inicioLoc.count()) || !(await fimLoc.count())) return false;
  // .fill() dispara os eventos que o binding Angular do slicer espera --
  // setar .value direto via evaluate nao seria detectado pelo componente.
  await inicioLoc.fill(paraDataBR(inicioISO));
  await inicioLoc.press('Tab');
  await fimLoc.fill(paraDataBR(fimISO));
  await fimLoc.press('Tab');
  return true;
}

/**
 * Marca um valor no slicer "Especialidade" (dropdown em árvore Agrupamento >
 * Especialidade, com busca). É o maior redutor de volume que existe no
 * relatório -- testado: 769mi -> 62mi de Valor Total só com "COLHEDORA - CANA".
 *
 * Só funciona com interação DE VERDADE (Playwright .click()/.fill(), que o
 * Chromium trata como confiável) -- esse dropdown ignora clique/evento
 * disparado via page.evaluate(): abre mas não filtra, ou nem abre.
 * Confirmado testando os dois lados a mão.
 */
async function aplicarFiltroEspecialidade(page, texto) {
  const card = page.locator(
    'xpath=//*[contains(@class,"slicer-header-text") and normalize-space(text())="Especialidade"]' +
    '/ancestor::div[contains(@class,"slicer-container")][1]');
  if (!(await card.count().catch(() => 0))) return false;

  const toggle = card.locator('.slicer-dropdown-menu, [class*="dropdown" i]').first();
  if (!(await toggle.count().catch(() => 0))) return false;
  await toggle.click();
  await page.waitForTimeout(700);

  // O campo de busca renderiza fora do card (num portal), não dá pra
  // escopar por ele -- pega o único searchInput visível na página, que é o
  // do dropdown que acabou de abrir. .fill() seta o valor mas o slicer não
  // reage (testado); precisa digitar tecla por tecla de verdade.
  const campo = page.locator('input.searchInput:visible').first();
  if (!(await campo.count().catch(() => 0))) return false;
  await campo.click();
  await campo.pressSequentially(texto, { delay: 60 });
  await page.waitForTimeout(900);

  const item = page.getByRole('treeitem', { name: texto, exact: true }).first();
  if (!(await item.count().catch(() => 0))) return false;
  await item.click();
  await page.waitForTimeout(1000);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return true;
}

/** Total de linhas que a grade relata via aria-rowcount, ou null se não achou a grade ainda. */
async function checarTotalLinhas(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[role="grid"]');
    const n = grid?.getAttribute('aria-rowcount');
    return n ? Number(n) : null;
  });
}

async function abrirAba(page, rotulo) {
  // O Power BI pinta a tela mesmo (canvas/webgl) e mantem em paralelo uma
  // arvore de acessibilidade "escondida" (visibility:hidden) so pros
  // leitores de tela -- e por causa dela que getByRole/getByText enxergam
  // os elementos, mas eles nunca ficam "visible" pro Playwright. Por isso
  // force:true em vez de esperar visibilidade.
  const tentativas = [
    () => page.getByRole('tab', { name: rotulo, exact: true }),
    () => page.getByRole('button', { name: rotulo, exact: true }),
    () => page.getByText(rotulo, { exact: true }),
  ];
  for (const tentativa of tentativas) {
    const loc = tentativa();
    if (await loc.count().catch(() => 0)) {
      // .click() (mesmo com force) exige geometria pra mirar o clique; esse
      // elemento e so a sombra de acessibilidade (visibility:hidden), sem
      // caixa visivel. Chamar o .click() nativo do proprio elemento via
      // evaluate funciona igual (dispara o mesmo evento), sem depender de
      // posicao na tela.
      await loc.first().evaluate(el => el.click());
      return true;
    }
  }
  return false;
}

/**
 * Rola a grade inteira, acumulando linha por texto (deduplicado), ate parar
 * de aparecer gente nova ou bater o teto de seguranca. Le TODAS as celulas
 * visiveis numa unica chamada por volta (allTextContents), bem mais rapido
 * que uma chamada por linha. Reaproveitada pelas duas passadas (tudo, e so
 * Reforma=SIM) -- ver rastreioReforma() logo abaixo.
 */
async function rolarGrade(page, largura, idxData, rotulo) {
  const linhasVistas = new Map(); // chave = texto bruto da linha
  let semNovidade = 0, volta = 0, truncado = false;
  const MAX_VOLTAS = 2500, SEM_NOVIDADE_LIMITE = 8;

  const grade = page.getByRole('grid').first();
  await grade.scrollIntoViewIfNeeded().catch(() => {});

  while (semNovidade < SEM_NOVIDADE_LIMITE && volta < MAX_VOLTAS) {
    if (linhasVistas.size >= LIMITE_SEGURO_LINHAS) {
      truncado = true;
      console.warn(`[${rotulo}] Parou em ${linhasVistas.size} linhas (teto de segurança) para não travar o Chromium -- ` +
        `o resultado pode estar incompleto. Rode de novo com --empresas e/ou --frotas mais estreitos, ` +
        `ou um período menor, para pegar tudo.`);
      break;
    }
    volta++;
    const celulasPlanas = await page.getByRole('gridcell').allTextContents();
    let novas = 0;
    for (let i = 0; i + largura <= celulasPlanas.length; i += largura) {
      const celulas = celulasPlanas.slice(i, i + largura);
      if (!isoDe(celulas[idxData])) continue; // fatia desalinhada (borda da rolagem) -- descarta
      const chave = celulas.join('|');
      if (!linhasVistas.has(chave)) {
        linhasVistas.set(chave, celulas);
        novas++;
      }
    }
    if (novas === 0) semNovidade++; else semNovidade = 0;
    if (volta % 20 === 0 || (novas > 0 && volta % 5 === 0)) {
      console.log(`  [${rotulo}] volta ${volta}: ${linhasVistas.size} linhas únicas até agora (+${novas})`);
    }
    await grade.hover();
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(180);
  }

  console.log(`[${rotulo}] Terminou de rolar: ${linhasVistas.size} linhas coletadas em ${volta} voltas.`);
  return { linhasVistas, truncado };
}

/* ================== FATIAS DE PERIODO ==================
   O teto de seguranca (LIMITE_SEGURO_LINHAS) e por ROLAGEM, nao por pedido:
   um ano inteiro nao cabe numa rolagem so. Por isso o script quebra o periodo
   pedido em fatias (padrao: um mes), roda uma por vez e soma. Fatia que ainda
   assim bate no teto e partida ao meio e refeita, ate o dia. Assim
   "--inicio=2025-01-01 --fim=2026-09-23" funciona numa chamada so, sem
   ninguem precisar orquestrar --merge a mao. */
function somaDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function fimDoPasso(iso, passo) {
  const d = new Date(iso + 'T00:00:00Z');
  if (passo === 'semana') return somaDias(iso, 6);
  if (passo === 'trimestre') { d.setUTCMonth(d.getUTCMonth() + 3, 0); return d.toISOString().slice(0, 10); }
  d.setUTCMonth(d.getUTCMonth() + 1, 0); // ultimo dia do mes corrente
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
const chaveFatia = f => `${f.inicio}|${f.fim}|${f.especialidade || ''}`;

/** Prepara a pagina para uma fatia: recarrega, abre o Analitico e aplica os filtros do proprio relatorio. */
async function prepararPagina(page, { inicio, fim, especialidade }) {
  // recarrega a cada fatia de proposito: e mais lento que so trocar as datas,
  // mas devolve os slicers (inclusive o "Reforma = SIM" da 2ª passada) ao
  // estado limpo -- sem isso a fatia seguinte herdaria o filtro da anterior
  await page.goto(LINK_BI, { waitUntil: 'load', timeout: 60000 });
  await page.getByText(/Analítico|Movimenta/i).first().waitFor({ state: 'attached', timeout: 45000 });
  const abriu = await abrirAba(page, 'Analítico');
  if (!abriu) throw new Error('Nao encontrei a aba "Analitico" na navegacao do relatorio. O layout deve ter mudado -- confira manualmente com --visivel.');
  await page.waitForTimeout(3000);

  const dataOk = await aplicarFiltroData(page, inicio, fim).catch(() => false);
  if (!dataOk) console.warn('  Nao encontrei os campos de data do relatorio -- vai ler o periodo todo disponivel (mais lento).');
  await page.waitForTimeout(1500);

  if (especialidade) {
    const espOk = await aplicarFiltroEspecialidade(page, especialidade).catch(() => false);
    if (!espOk) console.warn(`  Nao achei "${especialidade}" no slicer Especialidade -- confira a grafia (igual a dados/frota-base.js).`);
    await page.waitForTimeout(1500);
  }
}

/** Indices das colunas da tabela Analitico, descobertos pelo cabecalho (nao fixos). */
async function colunasDaTabela(page) {
  const cabecalhos = await page.getByRole('columnheader').allTextContents();
  const colunas = cabecalhos.map(c => c.trim()).filter(Boolean);
  const idx = {
    largura: colunas.length,
    data: colunas.findIndex(c => c === 'Data'),
    frota: colunas.findIndex(c => c === 'Frota'),
    desc: colunas.findIndex(c => c === 'Descricao Produto' || c === 'Descrição Produto'),
    valor: colunas.findIndex(c => c === 'Valor Total'),
    emp: colunas.findIndex(c => c === 'Emp Destino'),
  };
  if ([idx.data, idx.frota, idx.desc, idx.valor, idx.emp].some(i => i < 0)) {
    throw new Error(`Nao achei todas as colunas esperadas no cabecalho da tabela Analitico. Colunas vistas: ${colunas.join(' | ')}`);
  }
  return idx;
}

/**
 * Extrai UMA fatia (periodo + especialidade). Duas passadas de rolagem: tudo,
 * depois so Reforma=SIM, pra marcar cada lancamento (ver o topo do arquivo).
 */
async function extrairFatia(page, fatia) {
  const { inicio, fim, especialidade } = fatia;
  console.log(`\n=== Fatia ${inicio}..${fim}${especialidade ? ' ' + especialidade : ''} ===`);
  await prepararPagina(page, fatia);

  const idx = await colunasDaTabela(page);
  // aria-rowcount NAO e confiavel como "total filtrado" (em testes voltou 501
  // e 7487 pros MESMOS filtros): serve so de indicio no log. Quem garante
  // contra o travamento e o teto duro dentro do loop de rolagem.
  const indicio = await checarTotalLinhas(page);
  if (indicio != null) console.log(`  Indicio: ~${indicio} linhas montadas (nao e o total real).`);
  const passaTudo = await rolarGrade(page, idx.largura, idx.data, `tudo ${inicio}`);
  if (passaTudo.linhasVistas.size === 0) {
    console.log('  Nenhuma linha nesta fatia (periodo sem movimento, ou filtro sem resultado).');
    return { porFrota: {}, truncado: false, linhas: 0 };
  }

  const reformaOk = await aplicarFiltroReformaSim(page).catch(() => false);
  let chavesReformaSim = new Set(), truncadoSim = false;
  if (reformaOk) {
    await page.waitForTimeout(1500);
    const passaSim = await rolarGrade(page, idx.largura, idx.data, `reforma=sim ${inicio}`);
    chavesReformaSim = new Set(passaSim.linhasVistas.keys());
    truncadoSim = passaSim.truncado;
  } else {
    console.warn('  Nao encontrei o filtro "Reforma" nesta fatia -- as linhas dela ficam como NAO.');
  }

  const porFrota = {};
  let linhas = 0;
  for (const [chave, celulas] of passaTudo.linhasVistas) {
    const dataISO = isoDe(celulas[idx.data]);
    if (!dataISO || dataISO < inicio || dataISO > fim) continue;
    const emp = (celulas[idx.emp] || '').trim().toUpperCase();
    if (EMPRESAS.length && !EMPRESAS.includes(emp)) continue;
    const frota = (celulas[idx.frota] || '').trim();
    if (!frota) continue;
    if (FROTAS.length && !FROTAS.includes(frota)) continue;
    const compartimento = compartimentoDe(celulas[idx.desc] || '');
    if (!compartimento) continue;
    const valor = numBR(celulas[idx.valor]);
    porFrota[frota] ??= {};
    const cel = (porFrota[frota][compartimento] ??= { total: 0, itens: [] });
    cel.total += valor;
    cel.itens.push({
      desc: (celulas[idx.desc] || '').trim(), valor, data: dataISO, empresa: emp,
      reforma: chavesReformaSim.has(chave) ? 'SIM' : 'NAO',
    });
    linhas++;
  }
  console.log(`  ${linhas} linhas com *compartimento*, ${Object.keys(porFrota).length} frotas.`);
  return { porFrota, truncado: passaTudo.truncado || truncadoSim, linhas };
}

/**
 * Extrai a fatia; se ela bateu no teto de seguranca, parte ao meio e refaz as
 * duas metades (recursivo, ate o dia). Assim um mes "grande demais" vira duas
 * quinzenas sozinho, em vez de devolver dado incompleto em silencio.
 */
async function extrairFatiaOuPartir(page, fatia, profundidade = 0) {
  const r = await extrairFatia(page, fatia);
  if (!r.truncado || fatia.inicio === fatia.fim || profundidade >= 6) return [{ fatia, ...r }];
  const dias = Math.round((Date.parse(fatia.fim) - Date.parse(fatia.inicio)) / 86400000);
  const meio = somaDias(fatia.inicio, Math.floor(dias / 2));
  console.warn(`  Fatia ${fatia.inicio}..${fatia.fim} bateu no teto -- partindo em ${fatia.inicio}..${meio} e ${somaDias(meio, 1)}..${fatia.fim}.`);
  const a = await extrairFatiaOuPartir(page, { ...fatia, fim: meio }, profundidade + 1);
  const b = await extrairFatiaOuPartir(page, { ...fatia, inicio: somaDias(meio, 1) }, profundidade + 1);
  return a.concat(b);
}

/** Chave de deduplicacao de um lancamento -- a mesma linha extraida duas vezes nao conta duas vezes. */
const chaveItem = it => `${it.desc}|${it.valor}|${it.data}|${it.empresa || ''}`;

/**
 * Soma o resultado de uma fatia ao acumulado, SEM repetir lancamento ja
 * gravado. E o que torna re-rodar uma fatia inofensivo (antes, --merge do
 * mesmo periodo contava em dobro) e permite retomar uma extracao interrompida
 * rodando o mesmo comando de novo. Linha identica ja era deduplicada dentro
 * de uma rolagem (rolarGrade usa o texto da linha como chave), entao isto nao
 * perde informacao que a extracao de uma fatia so teria.
 */
function somarPorFrota(destino, origem) {
  for (const [frota, comps] of Object.entries(origem)) {
    destino[frota] ??= {};
    for (const [comp, dado] of Object.entries(comps)) {
      const atual = (destino[frota][comp] ??= { total: 0, itens: [] });
      const vistos = new Set(atual.itens.map(chaveItem));
      for (const it of dado.itens) {
        const k = chaveItem(it);
        if (vistos.has(k)) continue;
        vistos.add(k);
        atual.itens.push(it);
        atual.total += it.valor;
      }
    }
  }
}

function conteudoDoArquivo(saida) {
  return `/**
 * GERADO por scripts/gasto-reforma-bi.mjs em ${saida.geradoEm}.
 * Nao editar a mao -- rode o script de novo para atualizar. Ver o cabecalho
 * do script para os parametros usados nesta extracao.
 *
 * Gasto real (ERP, via Power BI) por codigo de Frota e por *COMPARTIMENTO*
 * encontrado na Descricao Produto. So leitura: a aba Reforma de Frota usa
 * isto como referencia ao lado do orcamento digitado, nunca substitui.
 *
 * porFrota[cod][compartimento] = { total, itens: [{desc, valor, data, empresa, reforma}, ...] }
 * -- reforma e "SIM" ou "NAO", vinda de uma 2ª passada de rolagem (ver
 * REFORMA SIM/NAO POR LANCAMENTO no topo do arquivo).
 * -- o total alimenta o "real: R$ X" ao lado do campo; os itens sao o que
 * aparece ao clicar nesse numero (rastro "reformabi:<familia>|<cod>|<conjunto>",
 * ver calculo/rastro.js).
 *
 * periodos[] sao as fatias ja extraidas. A tela usa isso pra dizer o que o
 * arquivo cobre e pra avisar quando o filtro de data pede periodo alem do
 * extraido -- coberturaBI() e faltaExtrair(), em calculo/gasto-real.js.
 */
export const GASTO_REFORMA_BI = ${JSON.stringify(saida, null, 2)};
`;
}

async function main() {
  const passo = ['mes', 'trimestre', 'semana', 'tudo'].includes(PASSO) ? PASSO : 'mes';
  const esps = ESPECIALIDADES.length ? ESPECIALIDADES : [null];
  const pedidas = esps.flatMap(esp => fatias(INICIO, FIM, passo).map(f => ({ ...f, especialidade: esp })));

  // arquivo anterior: por padrao o script SOMA ao que ja existe e pula fatia
  // ja extraida -- retomar uma extracao longa e so rodar o mesmo comando de
  // novo. --zerar comeca do zero; --refazer extrai de novo as ja gravadas.
  let anterior = null;
  if (!ZERAR) {
    try {
      const mod = await import(pathToFileURL(SAIDA).href + `?t=${Date.now()}`);
      anterior = mod.GASTO_REFORMA_BI?.geradoEm ? mod.GASTO_REFORMA_BI : null;
    } catch { /* sem arquivo anterior ainda -- comeca do zero */ }
  }
  const jaFeitas = new Set((anterior?.periodos || []).map(chaveFatia));
  const aFazer = REFAZER ? pedidas : pedidas.filter(f => !jaFeitas.has(chaveFatia(f)));

  console.log(`Periodo pedido: ${INICIO} a ${FIM} | passo: ${passo} | ${pedidas.length} fatia(s)` +
    (esps[0] ? ` | especialidades: ${esps.join(', ')}` : ' | todas as especialidades') +
    (EMPRESAS.length ? ` | empresas: ${EMPRESAS.join(', ')}` : ' | todas as empresas') +
    (FROTAS.length ? ` | frotas: ${FROTAS.join(', ')}` : ''));
  if (aFazer.length < pedidas.length) {
    console.log(`${pedidas.length - aFazer.length} fatia(s) ja estao no arquivo anterior -- pulando (use --refazer para extrair de novo).`);
  }
  if (!aFazer.length) { console.log('Nada a extrair. O arquivo ja cobre o que foi pedido.'); return; }

  const porFrotaFinal = anterior ? JSON.parse(JSON.stringify(anterior.porFrota)) : {};
  const periodos = [...(anterior?.periodos || [])];
  const chavesPeriodos = new Set(periodos.map(chaveFatia));
  const truncadas = [...(anterior?.truncadas || [])];

  console.log('Abrindo o relatorio publico do Power BI...');
  const browser = await chromium.launch({ headless: !VISIVEL });
  // locale explicito: sem isso o Power BI as vezes renderiza numero/data no
  // formato en-US (1,234.56 e 1/1/2026) mesmo com o relatorio em portugues,
  // dependendo do SO onde o script roda -- e o parser espera BR.
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, locale: 'pt-BR' });

  try {
    let n = 0;
    for (const fatia of aFazer) {
      n++;
      console.log(`\n--- fatia ${n}/${aFazer.length} ---`);
      const partes = await extrairFatiaOuPartir(page, fatia);
      partes.forEach(p => {
        somarPorFrota(porFrotaFinal, p.porFrota);
        if (p.truncado) truncadas.push(`${p.fatia.inicio}..${p.fatia.fim}${p.fatia.especialidade ? ' ' + p.fatia.especialidade : ''}`);
      });
      // a fatia PEDIDA entra inteira em periodos, mesmo tendo sido partida --
      // e ela que descreve a cobertura, e e por ela que o proximo run pula
      if (!chavesPeriodos.has(chaveFatia(fatia))) {
        periodos.push({ inicio: fatia.inicio, fim: fatia.fim, especialidade: fatia.especialidade || null });
        chavesPeriodos.add(chaveFatia(fatia));
      }
      // grava a cada fatia: extracao longa interrompida no meio nao se perde,
      // e rodar o mesmo comando de novo retoma de onde parou
      const saida = {
        geradoEm: new Date().toISOString(),
        periodos: periodos.slice().sort((a, b) => a.inicio.localeCompare(b.inicio)),
        empresas: EMPRESAS.length ? EMPRESAS : 'todas',
        truncado: truncadas.length > 0,
        truncadas,
        porFrota: porFrotaFinal,
      };
      await writeFile(SAIDA, conteudoDoArquivo(saida), 'utf8');
      const nLanc = Object.values(porFrotaFinal)
        .reduce((s, c) => s + Object.values(c).reduce((s2, d) => s2 + d.itens.length, 0), 0);
      console.log(`  Gravado no arquivo estático: ${nLanc} lancamentos acumulados, ${Object.keys(porFrotaFinal).length} frotas.`);
      
      if (BANCO) {
        console.log(`  Gravando no banco de dados (${BANCO.split('@')[1] || BANCO})...`);
        const pg = storePostgres(BANCO);
        const inseridos = await pg.gravarGastoReformaBi(porFrotaFinal);
        console.log(`  Banco atualizado: +${inseridos} registros novos inseridos (deduplicados).`);
      }
    }
    if (truncadas.length) {
      console.warn(`\nAtencao: ${truncadas.length} fatia(s) bateram no teto mesmo depois de partidas: ${truncadas.join(', ')}. ` +
        `Rode essas com --especialidades=... para reduzir o volume.`);
    }
    console.log(`\nPronto. ${path.relative(process.cwd(), SAIDA)} cobre ${periodos.length} fatia(s).`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Falhou:', err.message);
  process.exit(1);
});

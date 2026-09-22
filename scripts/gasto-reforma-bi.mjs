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
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-09-22
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-09-22 --empresas=CRV-MG
 *   npm run gasto-reforma-bi -- --inicio=2026-01-01 --fim=2026-03-31 --especialidade="COLHEDORA - CANA"
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-06-30 --especialidade="COLHEDORA - CANA" --merge
 *   npm run gasto-reforma-bi -- --inicio=2026-04-01 --fim=2026-09-22 --frotas=62522,62523 --visivel
 *
 * Parametros:
 *   --inicio=AAAA-MM-DD    (obrigatorio) inicio do periodo que conta como "ja gasto"
 *   --fim=AAAA-MM-DD       (obrigatorio) fim do periodo
 *   --especialidade=texto  (opcional, recomendado) filtra pelo slicer "Especialidade" do
 *                          proprio relatorio ANTES de rolar -- e o maior redutor de volume
 *                          que existe (testado: 769mi -> 62mi so com "COLHEDORA - CANA").
 *                          Use o nome como aparece em dados/frota-base.js (esp). Sem isso,
 *                          rola TODAS as especialidades do periodo -- pode ser bem mais lento.
 *   --empresas=A,B         (opcional) filtra por Emp Destino; sem isso, soma todas
 *   --frotas=62522,...     (opcional) filtra por codigo de Frota; sem isso, guarda todo
 *                         codigo de frota que aparecer com produto marcado *COMPARTIMENTO*
 *   --merge                (opcional) soma ao arquivo gerado anterior em vez de sobrescrever --
 *                          use pra juntar varias chamadas com periodos SEM SOBREPOSICAO
 *                          (ex.: um trimestre por chamada) quando um periodo so nao coube
 *                          no teto de seguranca. Rodar duas vezes o MESMO periodo com
 *                          --merge conta o gasto em dobro.
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
 * gerado (`truncado: true`) se cortou antes do fim. Especialidades grandes
 * (ex.: colhedora, com dezenas de conjuntos por unidade) passam facil desse
 * teto mesmo num trimestre -- nesse caso, quebre o periodo em pedacos
 * menores e rode de novo com --merge pra ir somando.
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const INICIO = argValor('inicio');
const FIM = argValor('fim');
const EMPRESAS = (argValor('empresas', '') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
const FROTAS = (argValor('frotas', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const ESPECIALIDADE = argValor('especialidade');
const VISIVEL = argFlag('visivel');
const MERGE = argFlag('merge');

if (!INICIO || !FIM) {
  console.error('Uso: npm run gasto-reforma-bi -- --inicio=AAAA-MM-DD --fim=AAAA-MM-DD [--empresas=CRV-MG,...] [--frotas=62522,...] [--visivel]');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.resolve(__dirname, '../public/js/dados/gasto-reforma-bi.js');

/** Rotulo entre asteriscos mais proximo do FIM da descricao (o padrao usado no ERP). */
function compartimentoDe(desc) {
  const m = desc.match(/\*([^*]+)\*(?!.*\*)/);
  return m ? m[1].trim().toUpperCase() : null;
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

async function main() {
  console.log(`Periodo: ${INICIO} a ${FIM}` +
    (EMPRESAS.length ? ` | empresas: ${EMPRESAS.join(', ')}` : ' | todas as empresas') +
    (FROTAS.length ? ` | frotas: ${FROTAS.join(', ')}` : ' | todas as frotas com compartimento'));
  console.log('Abrindo o relatorio publico do Power BI...');

  const browser = await chromium.launch({ headless: !VISIVEL });
  // locale explicito: sem isso o Power BI as vezes renderiza numero/data no
  // formato en-US (1,234.56 e 1/1/2026) mesmo com o relatorio em portugues,
  // dependendo do SO onde o script roda -- e o parser abaixo espera BR.
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, locale: 'pt-BR' });

  try {
    await page.goto(LINK_BI, { waitUntil: 'load', timeout: 60000 });

    console.log('Aguardando o relatorio carregar...');
    // attached, nao visible: o Power BI pinta via canvas e mantem a arvore de
    // acessibilidade escondida (visibility:hidden) -- ver nota em abrirAba().
    await page.getByText(/Analítico|Movimenta/i).first().waitFor({ state: 'attached', timeout: 45000 });

    console.log('Abrindo a aba "Analítico"...');
    const abriu = await abrirAba(page, 'Analítico');
    if (!abriu) throw new Error('Não encontrei a aba "Analítico" na navegação do relatório. O layout deve ter mudado -- confira manualmente com --visivel.');
    await page.waitForTimeout(3000);

    console.log('Aplicando filtro de período no próprio relatório...');
    const dataOk = await aplicarFiltroData(page, INICIO, FIM).catch(() => false);
    console.log(dataOk
      ? `Período restrito a ${INICIO}..${FIM} no relatório.`
      : 'Não encontrei os campos de data do relatório -- vai ler o período todo disponível (mais lento).');
    await page.waitForTimeout(1500);

    if (ESPECIALIDADE) {
      console.log(`Filtrando Especialidade = "${ESPECIALIDADE}"...`);
      const espOk = await aplicarFiltroEspecialidade(page, ESPECIALIDADE).catch(() => false);
      console.log(espOk
        ? 'Filtro de especialidade aplicado.'
        : `Não achei "${ESPECIALIDADE}" no slicer Especialidade -- confira a grafia (igual a dados/frota-base.js) ou rode com --visivel.`);
      await page.waitForTimeout(1500);
    }

    // aria-rowcount da grade NAO e confiavel como "total filtrado" -- em
    // testes ele voltou 501 e 7487 pros MESMOS filtros, provavelmente porque
    // reflete quanto ja esta montado no DOM num dado instante, nao o total
    // real. Serve so de indicio no log; quem garante contra o travamento e o
    // teto duro dentro do loop de rolagem, abaixo.
    const indicio = await checarTotalLinhas(page);
    if (indicio != null) console.log(`Indício inicial: ~${indicio} linhas montadas (não é o total real, só um sinal).`);

    // Cabecalho da tabela: descobre a ordem das colunas em vez de fixar
    // indice, pra nao quebrar se o relatorio ganhar/perder uma coluna.
    const cabecalhos = await page.getByRole('columnheader').allTextContents();
    const colunas = cabecalhos.map(c => c.trim()).filter(Boolean);
    const largura = colunas.length;
    const idxData = colunas.findIndex(c => c === 'Data');
    const idxFrota = colunas.findIndex(c => c === 'Frota');
    const idxDesc = colunas.findIndex(c => c === 'Descricao Produto' || c === 'Descrição Produto');
    const idxValor = colunas.findIndex(c => c === 'Valor Total');
    const idxEmp = colunas.findIndex(c => c === 'Emp Destino');
    if ([idxData, idxFrota, idxDesc, idxValor, idxEmp].some(i => i < 0)) {
      throw new Error(`Não achei todas as colunas esperadas no cabeçalho da tabela Analítico. Colunas vistas: ${colunas.join(' | ')}`);
    }
    console.log(`Colunas identificadas (${colunas.length} ao todo).`);

    // Duas passadas: TUDO primeiro (maior, sem filtro de Reforma), depois SO
    // Reforma=SIM (menor -- e um subconjunto da primeira). O item que aparece
    // nas duas e Reforma=SIM; o que so aparece na primeira e Reforma=NAO. E
    // o unico jeito de marcar isso por lancamento, porque "Reforma" e filtro
    // do proprio relatorio, nao uma coluna que a tabela mostra.
    const passaTudo = await rolarGrade(page, largura, idxData, 'tudo');
    if (passaTudo.linhasVistas.size === 0) throw new Error('Nenhuma linha coletada -- a tabela pode ter outra estrutura de acessibilidade. Rode com --visivel para inspecionar.');

    console.log('Isolando "Reforma = SIM" pra marcar cada lançamento (2ª passada, mais rápida)...');
    const reformaOk = await aplicarFiltroReformaSim(page).catch(() => false);
    let chavesReformaSim = new Set();
    let truncadoSim = false;
    if (reformaOk) {
      await page.waitForTimeout(1500);
      const passaSim = await rolarGrade(page, largura, idxData, 'reforma=sim');
      chavesReformaSim = new Set(passaSim.linhasVistas.keys());
      truncadoSim = passaSim.truncado;
    } else {
      console.warn('Não encontrei o filtro "Reforma" no relatório -- toda linha vai ficar marcada como NAO (confira manualmente com --visivel).');
    }

    // Filtra (periodo, empresa, frota) e agrupa por (frota, compartimento).
    // Guarda total E os itens (descricao/valor/data/reforma) que compoem esse
    // total -- e o que a tela usa pra mostrar "de onde veio" e filtrar por
    // Reforma SIM/NAO quando a pessoa clica ou usa o painel.
    const porFrota = {};
    let linhasComCompartimento = 0;
    for (const [chave, celulas] of passaTudo.linhasVistas) {
      const dataISO = isoDe(celulas[idxData]);
      if (!dataISO || dataISO < INICIO || dataISO > FIM) continue;
      const emp = (celulas[idxEmp] || '').trim().toUpperCase();
      if (EMPRESAS.length && !EMPRESAS.includes(emp)) continue;
      const frota = (celulas[idxFrota] || '').trim();
      if (!frota) continue;
      if (FROTAS.length && !FROTAS.includes(frota)) continue;
      const compartimento = compartimentoDe(celulas[idxDesc] || '');
      if (!compartimento) continue;
      const valor = numBR(celulas[idxValor]);
      porFrota[frota] ??= {};
      const cel = (porFrota[frota][compartimento] ??= { total: 0, itens: [] });
      cel.total += valor;
      cel.itens.push({
        desc: (celulas[idxDesc] || '').trim(), valor, data: dataISO, empresa: emp,
        reforma: chavesReformaSim.has(chave) ? 'SIM' : 'NAO',
      });
      linhasComCompartimento++;
    }

    const truncado = passaTudo.truncado || truncadoSim;
    console.log(`${linhasComCompartimento} linhas com *compartimento* dentro do período, ${Object.keys(porFrota).length} frotas distintas.`);

    let anterior = null;
    if (MERGE) {
      try {
        const mod = await import(pathToFileURL(SAIDA).href + `?t=${Date.now()}`);
        anterior = mod.GASTO_REFORMA_BI?.geradoEm ? mod.GASTO_REFORMA_BI : null;
      } catch { /* sem arquivo anterior ainda -- comeca do zero */ }
    }

    const porFrotaFinal = anterior ? JSON.parse(JSON.stringify(anterior.porFrota)) : {};
    for (const [frota, compartimentos] of Object.entries(porFrota)) {
      porFrotaFinal[frota] ??= {};
      for (const [comp, dado] of Object.entries(compartimentos)) {
        const atual = (porFrotaFinal[frota][comp] ??= { total: 0, itens: [] });
        atual.total += dado.total;
        atual.itens.push(...dado.itens);
      }
    }

    const saida = {
      geradoEm: new Date().toISOString(),
      // Varias extracoes (--merge) podem cobrir periodos diferentes -- por
      // isso e uma lista, nao um unico {inicio,fim}. Rodar duas vezes o MESMO
      // periodo com --merge soma em dobro; escolha periodos sem sobreposicao.
      periodos: [...(anterior?.periodos || []), { inicio: INICIO, fim: FIM, especialidade: ESPECIALIDADE || null }],
      empresas: EMPRESAS.length ? EMPRESAS : 'todas',
      truncado: truncado || !!anterior?.truncado, // true se ESTA ou qualquer extracao anterior mesclada bateu no teto
      porFrota: porFrotaFinal,
    };

    const conteudo = `/**
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
 * aparece ao clicar nesse número (rastro "reformabi:<familia>|<cod>|<conjunto>",
 * ver calculo/rastro.js).
 */
export const GASTO_REFORMA_BI = ${JSON.stringify(saida, null, 2)};
`;
    await writeFile(SAIDA, conteudo, 'utf8');
    console.log(`Gravado em ${path.relative(process.cwd(), SAIDA)}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Falhou:', err.message);
  process.exit(1);
});

'use strict';
/**
 * Extração ao vivo do Power BI (Movimentações Internas).
 * Usa Playwright para abrir o relatório, rolar a tabela e extrair os dados
 * baseados no filtro de período.
 */
const { chromium } = require('playwright');

const LINK_BI = 'https://app.powerbi.com/view?r=eyJrIjoiOTdiODMxMGQtMGU3MS00YzAzLWEyZWItNDdmODExYmE0MWQxIiwidCI6IjEzMzAzY2I0LTNmZDQtNDMzNC04ZTJlLWFiZDZkMTNjZDQ2YSJ9';
const LIMITE_SEGURO = 1500;

// Fila para garantir que apenas UMA extração ocorra por vez no servidor,
// evitando que múltiplos usuários cliquem juntos e estoorem a RAM instantaneamente.
let _filaPromise = Promise.resolve();

// Cache em memória (dura 4 horas, até 20 consultas)
const cache = new Map();
const TTL_CACHE = 4 * 60 * 60 * 1000;

async function extrairGastoReforma({ inicio, fim, especialidades = [], empresas = [], onProgresso }) {
  const chaveCache = `${inicio}|${fim}|${especialidades.join(',')}|${empresas.join(',')}`;
  if (cache.has(chaveCache)) {
    const hit = cache.get(chaveCache);
    if (Date.now() - hit.timestamp < TTL_CACHE) {
      if (onProgresso) onProgresso('Dados recentes encontrados no cache do servidor...');
      return hit.dados;
    }
    cache.delete(chaveCache);
  }

  // Coloca na fila
  const r = _filaPromise.then(() => executarExtracao({ inicio, fim, especialidades, empresas, onProgresso }));
  _filaPromise = r.catch(() => {}); // evita que um erro trave a fila para os próximos
  
  const dados = await r;
  
  // Limpa cache antigo se ficar grande e salva o novo
  if (cache.size >= 20) {
    const chaveMaisAntiga = cache.keys().next().value;
    cache.delete(chaveMaisAntiga);
  }
  cache.set(chaveCache, { timestamp: Date.now(), dados });
  
  return dados;
}

async function executarExtracao({ inicio, fim, especialidades, empresas, onProgresso }) {
  if (onProgresso) onProgresso('Iniciando navegador no servidor (pode levar 1 minuto)...');
  
  // Flags focadas em consumir o MÍNIMO de memória possível (essencial para o plano Free)
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
    
    // Tenta interceptar e bloquear imagens/css desnecessários para poupar RAM
    await page.route('**/*', route => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    if (onProgresso) onProgresso('Carregando Power BI...');
    await page.goto(LINK_BI, { waitUntil: 'networkidle', timeout: 90000 });
    
    // Espera os filtros carregarem
    await page.waitForSelector('div.slicer-dropdown-menu', { timeout: 60000 });
    
    // As funções abaixo rodam no contexto do navegador
    await page.evaluate(async ({ inicio, fim, especialidades }) => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      
      const setFiltroData = async () => {
        const inputs = document.querySelectorAll('div.date-slicer-control input');
        if (inputs.length >= 2) {
          const ev = new Event('change', { bubbles: true });
          inputs[0].value = inicio.split('-').reverse().join('/');
          inputs[0].dispatchEvent(ev);
          await wait(1000);
          inputs[1].value = fim.split('-').reverse().join('/');
          inputs[1].dispatchEvent(ev);
          await wait(2000);
        }
      };
      
      const setFiltroEsp = async () => {
        if (!especialidades || !especialidades.length) return;
        const dropdowns = document.querySelectorAll('div.slicer-dropdown-menu');
        if (!dropdowns.length) return;
        dropdowns[0].click();
        await wait(1000);
        const pop = document.querySelector('div.slicer-dropdown-content');
        if (!pop) return;
        const input = pop.querySelector('input[type="text"]');
        if (input) {
          for (const esp of especialidades) {
            input.value = esp;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await wait(1000);
            const opt = Array.from(pop.querySelectorAll('div.slicerItemContainer'))
              .find(x => x.innerText.toUpperCase().includes(esp.toUpperCase()));
            if (opt) { opt.click(); await wait(1000); }
            const clear = pop.querySelector('i.search-clear-icon');
            if (clear) { clear.click(); await wait(500); }
          }
        }
        dropdowns[0].click(); // fecha
        await wait(2000);
      };

      await setFiltroData();
      await setFiltroEsp();
    }, { inicio, fim, especialidades });

    if (onProgresso) onProgresso('Lendo tabela (Passo 1: Todos os dados)...');
    
    // Extrai rolando a tabela
    const linhasReformaIgno = await rolarEEstrairTabela(page, onProgresso, LIMITE_SEGURO);
    
    if (onProgresso) onProgresso('Lendo tabela (Passo 2: Apenas marcados como Reforma)...');
    
    // Filtra Reforma = SIM para deduzir o status
    await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const dropdowns = document.querySelectorAll('div.slicer-dropdown-menu');
      if (dropdowns.length >= 2) {
        dropdowns[1].click(); // Assumindo que o 2º dropdown é o de Reforma
        await wait(1000);
        const pop = document.querySelector('div.slicer-dropdown-content');
        if (pop) {
          const opt = Array.from(pop.querySelectorAll('div.slicerItemContainer'))
            .find(x => x.innerText.toUpperCase().includes('SIM'));
          if (opt) opt.click();
        }
        await wait(1000);
        dropdowns[1].click(); // Fecha
        await wait(2000);
      }
    });

    const linhasReformaSim = await rolarEEstrairTabela(page, onProgresso, LIMITE_SEGURO);
    
    if (onProgresso) onProgresso('Processando e agrupando resultados...');
    
    const setReformaSim = new Set(linhasReformaSim.map(x => x._raw));
    
    const porFrota = {};
    for (const l of linhasReformaIgno) {
      if (empresas.length && !empresas.includes(l.empresa.toUpperCase())) continue;
      if (!l.frota || !l.compartimento) continue;
      
      porFrota[l.frota] = porFrota[l.frota] || {};
      const cel = porFrota[l.frota][l.compartimento] = porFrota[l.frota][l.compartimento] || { total: 0, itens: [] };
      
      const reforma = setReformaSim.has(l._raw) ? 'SIM' : 'NAO';
      cel.total += l.valor;
      cel.itens.push({ desc: l.desc, valor: l.valor, data: l.data, empresa: l.empresa, reforma });
    }

    return {
      porFrota,
      periodos: [{ inicio, fim, especialidade: especialidades.join(',') || null }],
      empresas: empresas.length ? empresas : 'todas',
      geradoEm: new Date().toISOString(),
      truncado: false, // simplificado para produção ao vivo
      aoVivo: true
    };
    
  } finally {
    if (onProgresso) onProgresso('Fechando navegador...');
    await browser.close().catch(()=>{});
  }
}

async function rolarEEstrairTabela(page, onProgresso, limite) {
  return page.evaluate(async (maxLinhas) => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const container = document.querySelector('div.visual-tableWrapper div.scroll-wrapper');
    if (!container) return [];

    const extrairDOM = () => {
      const res = [];
      const rows = document.querySelectorAll('div.visual-tableWrapper div.row');
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('div.cell')).map(c => c.innerText.trim());
        if (cells.length < 9) continue;
        const [empresa, cc, os, dataStr, tipo, fam, frota, desc, valorStr] = cells;
        if (!frota || !desc || !valorStr) continue;
        
        let compartimento = null;
        const m = desc.match(/\*([^*]+)\*/);
        if (m) compartimento = m[1].trim().toUpperCase();
        if (!compartimento) continue; // ignora fretes, mão de obra, etc
        
        const valor = Number(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
        const [d, mo, y] = dataStr.split('/');
        const data = d && mo && y ? `${y}-${mo}-${d}` : null;
        if (!data) continue;
        
        res.push({
          empresa, frota, compartimento, desc, valor, data,
          _raw: cells.join('|')
        });
      }
      return res;
    };

    const todas = new Map();
    let scrollPos = 0;
    let parou = 0;
    
    while (todas.size < maxLinhas) {
      const lote = extrairDOM();
      for (const item of lote) todas.set(item._raw, item);
      
      const sh = container.scrollHeight;
      const ch = container.clientHeight;
      if (scrollPos + ch >= sh) {
        parou++;
        if (parou > 2) break;
      } else {
        parou = 0;
      }
      
      scrollPos += ch * 0.8;
      container.scrollTop = scrollPos;
      await wait(500);
    }
    
    return Array.from(todas.values());
  }, limite);
}

module.exports = { extrairGastoReforma };

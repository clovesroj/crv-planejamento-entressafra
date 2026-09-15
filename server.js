'use strict';
/**
 * Servidor do Sistema de Planejamento de Entressafra — CRV Industrial.
 *
 * Serve o index.html e guarda o plano compartilhado. Sem framework: o app é um
 * arquivo único e a API tem quatro rotas.
 *
 *   GET    /api/health  estado do serviço e qual armazenamento está ativo
 *   GET    /api/plano   documento completo
 *   PATCH  /api/plano   merge campo a campo — o caminho normal de gravação
 *   POST   /api/plano   idem, para navigator.sendBeacon ao fechar a aba
 *   PUT    /api/plano   substitui o documento — só em "restaurar padrões"
 *
 * Com DATABASE_URL definido grava em Postgres. Sem ele cai num arquivo em
 * .data/plano.json, o que serve para rodar na máquina local; no Render o disco
 * é efêmero e some a cada deploy, então a API marca duravel:false e o rodapé
 * do app passa a avisar que a gravação é temporária.
 */

const http = require('node:http');
const fsp = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 10000;
const RAIZ = __dirname;
const DOC_ID = 'atual';
const SERVICO = 'crv-planejamento-entressafra';

/* ---------------------------------------------------------------- Postgres */

function storePostgres(url) {
  const { Pool } = require('pg');
  const host = new URL(url).hostname;
  // O Postgres interno do Render responde na rede privada e não oferece TLS; o
  // endereço externo exige TLS com certificado próprio da Render, que não está
  // na cadeia de confiança do Node.
  const interno = host.endsWith('.internal') || host === 'localhost' || host === '127.0.0.1';
  const pool = new Pool({
    connectionString: url,
    ssl: interno ? false : { rejectUnauthorized: false },
    max: 5,
  });
  pool.on('error', err => console.error('[pg] conexão ociosa caiu:', err.message));

  let pronto = null;
  function garantirTabela() {
    // O .catch() entra junto com a promessa, e não depois: uma rejeição sem
    // tratador derruba o processo no Node. Ele também zera o cache, porque o
    // Postgres do Render costuma levar alguns segundos a mais que o serviço
    // para aceitar conexão — a requisição seguinte precisa tentar de novo em
    // vez de herdar a falha do boot.
    if (!pronto) {
      pronto = pool.query(`
        CREATE TABLE IF NOT EXISTS plano (
          id         text PRIMARY KEY,
          data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`).catch(err => { pronto = null; throw err; });
    }
    return pronto;
  }

  const linha = r => (r.rowCount ? { data: r.rows[0].data, updated_at: r.rows[0].updated_at } : null);

  return {
    tipo: 'postgres',
    duravel: true,
    async ler() {
      await garantirTabela();
      return linha(await pool.query('SELECT data, updated_at FROM plano WHERE id = $1', [DOC_ID]));
    },
    // O operador || concatena jsonb, ou seja, mescla no primeiro nível — que é
    // exatamente o recorte que o app envia. Resolvido dentro do próprio UPDATE,
    // e não em ler-alterar-gravar, duas sessões salvando junto não se apagam.
    async mesclar(doc) {
      await garantirTabela();
      return linha(await pool.query(
        `INSERT INTO plano (id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (id) DO UPDATE
           SET data = plano.data || EXCLUDED.data, updated_at = now()
         RETURNING data, updated_at`,
        [DOC_ID, JSON.stringify(doc)]));
    },
    async substituir(doc) {
      await garantirTabela();
      return linha(await pool.query(
        `INSERT INTO plano (id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (id) DO UPDATE
           SET data = EXCLUDED.data, updated_at = now()
         RETURNING data, updated_at`,
        [DOC_ID, JSON.stringify(doc)]));
    },
    async checar() { await garantirTabela(); await pool.query('SELECT 1'); },
  };
}

/* -------------------------------------------------------------- em arquivo */

function storeArquivo() {
  const dir = path.join(RAIZ, '.data');
  const arq = path.join(dir, 'plano.json');

  // Uma fila serializa as gravações: sem ela, dois PATCH simultâneos leriam o
  // mesmo estado e o último apagaria o campo que o primeiro acabou de gravar.
  let fila = Promise.resolve();
  const enfileirar = fn => {
    const r = fila.then(fn, fn);
    fila = r.catch(() => {});
    return r;
  };

  async function doDisco() {
    try {
      return JSON.parse(await fsp.readFile(arq, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async function paraDisco(doc) {
    await fsp.mkdir(dir, { recursive: true });
    const tmp = `${arq}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(doc));
    await fsp.rename(tmp, arq);   // troca atômica: nunca deixa um JSON pela metade
    return { data: doc, updated_at: new Date().toISOString() };
  }

  return {
    tipo: 'arquivo',
    duravel: false,
    async ler() {
      const d = await doDisco();
      if (!d) return null;
      const st = await fsp.stat(arq);
      return { data: d, updated_at: st.mtime.toISOString() };
    },
    mesclar: doc => enfileirar(async () => paraDisco({ ...(await doDisco()), ...doc })),
    substituir: doc => enfileirar(() => paraDisco(doc)),
    async checar() { await fsp.mkdir(dir, { recursive: true }); },
  };
}

const store = process.env.DATABASE_URL ? storePostgres(process.env.DATABASE_URL) : storeArquivo();
if (store.tipo === 'arquivo') {
  console.warn('[aviso] DATABASE_URL não definido — gravando em .data/plano.json.');
  console.warn('[aviso] No Render o disco é efêmero: ligue um Postgres antes de usar para valer.');
}

/* ------------------------------------------------------------------- HTTP */

const LIMITE = 8 * 1024 * 1024;   // o plano cheio não passa de algumas centenas de kB

function erroHTTP(status, msg) {
  return Object.assign(new Error(msg), { status });
}

function json(res, status, corpo) {
  const txt = JSON.stringify(corpo);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(txt),
  });
  res.end(txt);
}

function lerCorpo(req) {
  return new Promise((ok, falha) => {
    const partes = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > LIMITE) { falha(erroHTTP(413, 'corpo grande demais')); req.destroy(); return; }
      partes.push(c);
    });
    req.on('end', () => {
      if (!total) return ok({});
      try { ok(JSON.parse(Buffer.concat(partes).toString('utf8'))); }
      catch (e) { falha(erroHTTP(400, 'JSON inválido')); }
    });
    req.on('error', falha);
  });
}

async function api(req, res, rota) {
  if (rota === '/api/health') {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw erroHTTP(405, 'método não permitido');
    // Responde 200 enquanto o processo estiver de pé, mesmo com o banco fora: o
    // health check do Render derrubaria a instância a cada oscilação do Postgres,
    // e o app sabe se virar com o rascunho local. O estado real do armazenamento
    // vai no corpo.
    let banco = 'ok';
    try { await store.checar(); }
    catch (e) { banco = 'erro: ' + e.message; }
    return json(res, 200, { servico: SERVICO, armazenamento: store.tipo, duravel: store.duravel, banco });
  }

  if (rota !== '/api/plano') throw erroHTTP(404, 'rota inexistente');

  if (req.method === 'GET') {
    const d = await store.ler();
    return json(res, 200, {
      armazenamento: store.tipo, duravel: store.duravel,
      existe: !!d, data: d ? d.data : {}, updated_at: d ? d.updated_at : null,
    });
  }

  // PATCH e POST mesclam; POST existe porque navigator.sendBeacon só faz POST, e
  // é o único envio que sobrevive ao fechamento da aba.
  if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT') {
    const corpo = await lerCorpo(req);
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      throw erroHTTP(400, 'esperado um objeto JSON');
    }
    const d = req.method === 'PUT' ? await store.substituir(corpo) : await store.mesclar(corpo);
    return json(res, 200, { armazenamento: store.tipo, duravel: store.duravel, updated_at: d.updated_at });
  }

  throw erroHTTP(405, 'método não permitido');
}

/* --------------------------------------------------------------- estático */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Arquivos do servidor não são conteúdo do site.
const OCULTOS = new Set(['server.js', 'package.json', 'package-lock.json', 'render.yaml']);

async function estatico(req, res, rota) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw erroHTTP(405, 'método não permitido');

  let alvo = path.join(RAIZ, 'index.html');
  if (rota !== '/' && rota !== '/index.html') {
    const rel = decodeURIComponent(rota).replace(/^\/+/, '');
    const abs = path.resolve(RAIZ, rel);
    // path.resolve já normaliza ".."; confirmar que o resultado continua dentro
    // da raiz é o que impede ler arquivo de fora do projeto.
    const dentro = abs === RAIZ || abs.startsWith(RAIZ + path.sep);
    const visivel = dentro
      && !OCULTOS.has(path.basename(abs))
      && !rel.split('/').some(p => p.startsWith('.'));
    if (visivel && await fsp.stat(abs).then(s => s.isFile(), () => false)) alvo = abs;
    // Qualquer outro caminho cai no index.html: o app é uma página só.
  }

  const corpo = await fsp.readFile(alvo);
  const ext = path.extname(alvo).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'content-length': corpo.length,
    // O index.html é reescrito a cada deploy; revalidar evita servir a versão velha.
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(req.method === 'HEAD' ? undefined : corpo);
}

const servidor = http.createServer(async (req, res) => {
  let rota = '/';
  try {
    rota = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
    if (rota.startsWith('/api/')) await api(req, res, rota);
    else await estatico(req, res, rota);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('[erro]', req.method, rota, e);
    if (!res.headersSent) json(res, status, { erro: status >= 500 ? 'falha interna' : e.message });
    else res.end();
  }
});

servidor.listen(PORT, () => {
  console.log(`CRV Planejamento de Entressafra na porta ${PORT} — armazenamento: ${store.tipo}`);
});

// O Render manda SIGTERM no deploy; encerrar de vez evita cortar uma gravação.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => servidor.close(() => process.exit(0)));
}

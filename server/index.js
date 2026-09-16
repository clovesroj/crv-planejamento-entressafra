'use strict';
/**
 * Servidor do Sistema de Planejamento de Entressafra — CRV Industrial.
 *
 * Ponto de entrada: monta o servidor HTTP, roteia entre a API e os arquivos
 * estaticos, e trata o encerramento.
 *
 *   server/config.js     porta, caminhos, limites
 *   server/http.js       erro com status, resposta JSON, leitura de corpo
 *   server/api.js        rotas /api/health e /api/plano
 *   server/estatico.js   arquivos de public/
 *   server/store/        onde o plano e gravado (postgres ou arquivo)
 *
 * Com DATABASE_URL definido grava em Postgres. Sem ele cai num arquivo em
 * .data/plano.json, o que serve para rodar na maquina local; no Render o disco
 * e efemero e some a cada deploy, entao a API marca duravel:false e o rodape
 * do app passa a avisar que a gravacao e temporaria.
 */
const http = require('node:http');
const { api } = require('./api');
const { estatico } = require('./estatico');
const { json } = require('./http');
const { PORT } = require('./config');
const store = require('./store');

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

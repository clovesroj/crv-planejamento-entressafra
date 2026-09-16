'use strict';
/**
 * Servidor de arquivos estaticos da pasta public/.
 *
 * Qualquer rota que nao case com um arquivo cai no index.html: o app e uma
 * pagina so, e e assim que ele responde a um link direto para uma aba.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const { erroHTTP } = require('./http');
const { RAIZ_PUBLICA } = require('./config');

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
// Extensoes cujo conteudo nao muda de um deploy para o outro.
const ESTAVEL = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2']);

async function estatico(req, res, rota) {
  if (req.method !== 'GET' && req.method !== 'HEAD') throw erroHTTP(405, 'método não permitido');

  let alvo = path.join(RAIZ_PUBLICA, 'index.html');
  if (rota !== '/' && rota !== '/index.html') {
    const rel = decodeURIComponent(rota).replace(/^\/+/, '');
    const abs = path.resolve(RAIZ_PUBLICA, rel);
    // path.resolve já normaliza ".."; confirmar que o resultado continua dentro
    // da raiz é o que impede ler arquivo de fora do projeto.
    const dentro = abs === RAIZ_PUBLICA || abs.startsWith(RAIZ_PUBLICA + path.sep);
    // A lista de arquivos ocultos (server.js, package.json...) deixou de ser
    // necessaria: o codigo do servidor vive fora de public/, entao nao ha rota
    // que chegue nele. Resta recusar arquivos que comecem com ponto.
    const visivel = dentro
      && !rel.split('/').some(p => p.startsWith('.'));
    if (visivel && await fsp.stat(abs).then(s => s.isFile(), () => false)) alvo = abs;
    // Qualquer outro caminho cai no index.html: o app é uma página só.
  }

  const corpo = await fsp.readFile(alvo);
  const ext = path.extname(alvo).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'content-length': corpo.length,
    // Tudo que muda num deploy revalida a cada carga; so imagem e fonte ficam
    // em cache longo. Quando o app era um arquivo unico, bastava o index.html
    // revalidar. Agora ele carrega ~50 modulos por URL fixa: deixar o .js em
    // cache de uma hora faria o navegador juntar HTML novo com modulo velho no
    // primeiro acesso depois de um deploy. Se o custo de rebaixar tudo a cada
    // carga incomodar, a saida e versionar a URL dos modulos no build — nao
    // aumentar este max-age.
    'cache-control': ESTAVEL.has(ext) ? 'public, max-age=86400' : 'no-cache',
  });
  res.end(req.method === 'HEAD' ? undefined : corpo);
}

module.exports = { estatico };

'use strict';
/**
 * Utilitarios de HTTP: erro com status, resposta JSON e leitura de corpo.
 */
const { LIMITE } = require('./config');

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

module.exports = { erroHTTP, json, lerCorpo };

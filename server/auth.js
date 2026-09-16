'use strict';
/**
 * Autenticação: hash de senha, cookie de sessão, guardas de rota.
 *
 * Sem dependência nova — scrypt é nativo do Node, e a sessão é um token
 * opaco (não JWT/assinado) guardado em `store.sessoes`. Cada requisição
 * confere o token contra o banco, então revogar (logout, desativar usuário)
 * vale na hora, e não só no próximo login.
 */
const crypto = require('node:crypto');
const { erroHTTP } = require('./http');

const COOKIE = 'crv_sessao';
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivado = crypto.scryptSync(senha, salt, 64);
  return `${salt}:${derivado.toString('hex')}`;
}

function verificarSenha(senha, hash) {
  const [salt, guardado] = String(hash || '').split(':');
  if (!salt || !guardado) return false;
  const derivado = crypto.scryptSync(senha, salt, 64);
  const bufGuardado = Buffer.from(guardado, 'hex');
  // tamanhos diferentes derrubariam o timingSafeEqual antes de comparar
  if (bufGuardado.length !== derivado.length) return false;
  return crypto.timingSafeEqual(derivado, bufGuardado);
}

function gerarToken() {
  return crypto.randomBytes(32).toString('hex');
}

function lerCookies(req) {
  const cru = req.headers.cookie;
  const out = {};
  if (!cru) return out;
  cru.split(';').forEach(par => {
    const i = par.indexOf('=');
    if (i < 0) return;
    out[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
  });
  return out;
}

function ehHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;
}

function definirCookieSessao(req, res, token) {
  const partes = [
    `${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax',
    `Max-Age=${Math.floor(VALIDADE_MS / 1000)}`,
  ];
  if (ehHttps(req)) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

function limparCookieSessao(req, res) {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (ehHttps(req)) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

function expiraEm() {
  return new Date(Date.now() + VALIDADE_MS);
}

// Resolve a sessão da requisição contra o store; lança 401 se não houver
// cookie, o token não existir ou tiver expirado, ou o usuário estar inativo.
async function exigirSessao(req, store) {
  const token = lerCookies(req)[COOKIE];
  if (!token) throw erroHTTP(401, 'sessão ausente — faça login');
  const usuario = await store.sessaoValida(token);
  if (!usuario) throw erroHTTP(401, 'sessão inválida ou expirada — faça login de novo');
  return usuario;
}

async function exigirAdmin(req, store) {
  const usuario = await exigirSessao(req, store);
  if (usuario.papel !== 'admin') throw erroHTTP(403, 'só administradores acessam isto');
  return usuario;
}

module.exports = {
  COOKIE, hashSenha, verificarSenha, gerarToken, lerCookies,
  definirCookieSessao, limparCookieSessao, expiraEm, exigirSessao, exigirAdmin,
};

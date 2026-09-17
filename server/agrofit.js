'use strict';
/**
 * Integração com a API AGROFIT (Embrapa AgroAPI) — banco de produtos
 * fitossanitários registrados no Mapa, usado para achar a bula de um insumo
 * pelo fabricante e nome comercial.
 *
 * Credenciais em AGROFIT_CLIENT_ID / AGROFIT_CLIENT_SECRET (.env local ou
 * variável de ambiente no Render) — nunca no código. Sem elas, a busca
 * responde com um erro claro em vez de derrubar o servidor: a aba de
 * insumos continua funcionando normalmente sem esse recurso.
 *
 * Autenticação é OAuth2 client_credentials no gateway da Embrapa (WSO2), não
 * na própria AGROFIT — token cacheado em memória e renovado perto de expirar.
 */
const { erroHTTP } = require('./http');

const TOKEN_URL = 'https://api.cnptia.embrapa.br/token';
const BASE_URL = 'https://api.cnptia.embrapa.br/agrofit/v1';

let cache = null; // {token, expiraEm}

// 424 (Failed Dependency), não 5xx: server/index.js só devolve a mensagem de
// erro ao navegador para status abaixo de 500 — e quem clica em "Buscar no
// Agrofit" precisa saber o motivo (não configurado, credencial recusada...),
// não um "falha interna" genérico. O detalhe completo também vai pro log.
async function obterToken() {
  if (cache && cache.expiraEm > Date.now()) return cache.token;
  const id = process.env.AGROFIT_CLIENT_ID, secret = process.env.AGROFIT_CLIENT_SECRET;
  if (!id || !secret) throw erroHTTP(424, 'AGROFIT não configurado — falta AGROFIT_CLIENT_ID/SECRET no servidor');

  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  let r;
  try {
    r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: `Basic ${auth}` },
      body: 'grant_type=client_credentials',
    });
  } catch (e) { throw erroHTTP(424, 'AGROFIT: falha de rede ao autenticar'); }
  if (!r.ok) throw erroHTTP(424, `AGROFIT: credenciais recusadas (${r.status})`);

  const d = await r.json();
  // renova 30s antes do prazo, para uma busca não pegar o token no instante em que expira
  cache = { token: d.access_token, expiraEm: Date.now() + Math.max(0, (d.expires_in || 0) - 30) * 1000 };
  return cache.token;
}

async function chamar(caminho, params) {
  const token = await obterToken();
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, v); });
  let r;
  try {
    r = await fetch(`${BASE_URL}${caminho}?${qs}`, { headers: { authorization: `Bearer ${token}` } });
  } catch (e) { throw erroHTTP(424, 'AGROFIT: falha de rede na busca'); }
  if (r.status === 403) {
    throw erroHTTP(424, 'AGROFIT: acesso negado — confira se o app está inscrito (subscribed) na API no portal da Embrapa');
  }
  if (!r.ok) throw erroHTTP(424, `AGROFIT: erro na busca (${r.status})`);
  return r.json();
}

/**
 * Candidatos de produto formulado por marca comercial e/ou titular do
 * registro (fabricante). Os dois são "contém", não exatos — o nome do
 * fabricante no nosso cadastro raramente bate com a razão social completa
 * que a API usa (ex.: "Bayer" vs "Bayer S.A."), então a busca é só o
 * primeiro corte: quem confirma qual candidato é o certo é a pessoa que
 * cadastra, na tela.
 */
function buscarProdutosFormulados({ marca_comercial, titular_registro, page } = {}) {
  return chamar('/search/produtos-formulados', { marca_comercial, titular_registro, page });
}

module.exports = { buscarProdutosFormulados };

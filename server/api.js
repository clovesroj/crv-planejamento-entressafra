'use strict';
/**
 * As rotas da API.
 *
 *   GET    /api/health  estado do servico e qual armazenamento esta ativo
 *   GET    /api/plano   documento completo
 *   PATCH  /api/plano   merge campo a campo — o caminho normal de gravacao
 *   POST   /api/plano   idem, para navigator.sendBeacon ao fechar a aba
 *   PUT    /api/plano   substitui o documento — so em "restaurar padroes"
 *
 * Esta funcao e o ponto de entrada para colocar autenticacao: hoje o servico
 * fica aberto na internet e qualquer pessoa com o endereco le e edita o plano,
 * incluindo salarios e custos.
 */
const store = require('./store');
const { erroHTTP, json, lerCorpo } = require('./http');
const { SERVICO } = require('./config');

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

module.exports = { api };

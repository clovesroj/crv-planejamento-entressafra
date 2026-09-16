'use strict';
/**
 * Parametros de execucao do servidor.
 *
 * RAIZ_PUBLICA passou a ser a pasta public/. Antes era a raiz do repositorio, e
 * por isso existia uma lista de arquivos "ocultos" (server.js, package.json...)
 * que o servidor estatico tinha de recusar uma a um. Com o codigo do servidor
 * fora da pasta servida, nao ha o que esconder: o que nao esta em public/ nao
 * tem rota.
 *
 * DIR_DADOS continua na raiz do repositorio, e nao dentro de public/: e onde o
 * modo arquivo grava o plano quando nao ha Postgres, e nao deve ser servido.
 */
const path = require('node:path');

const RAIZ_PROJETO = path.join(__dirname, '..');

module.exports = {
  PORT: Number(process.env.PORT) || 10000,
  RAIZ_PUBLICA: path.join(RAIZ_PROJETO, 'public'),
  DIR_DADOS: path.join(RAIZ_PROJETO, '.data'),
  DOC_ID: 'atual',
  SERVICO: 'crv-planejamento-entressafra',
  LIMITE: 8 * 1024 * 1024,   // o plano cheio não passa de algumas centenas de kB
};

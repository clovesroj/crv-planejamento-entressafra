'use strict';
/**
 * Escolhe o armazenamento pela presenca de DATABASE_URL.
 *
 * Os dois modulos expoem a mesma interface — ler, mesclar, substituir, checar,
 * mais os campos tipo e duravel — e o resto do servidor nao sabe qual esta
 * ativo. Para acrescentar um destino novo, basta implementar essa interface e
 * escolhe-lo aqui.
 */
const { storePostgres } = require('./postgres');
const { storeArquivo } = require('./arquivo');

const store = process.env.DATABASE_URL ? storePostgres(process.env.DATABASE_URL) : storeArquivo();
if (store.tipo === 'arquivo') {
  console.warn('[aviso] DATABASE_URL não definido — gravando em .data/plano.json.');
  console.warn('[aviso] No Render o disco é efêmero: ligue um Postgres antes de usar para valer.');
}

module.exports = store;

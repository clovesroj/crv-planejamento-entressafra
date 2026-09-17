'use strict';
/**
 * Carrega .env na raiz do projeto para process.env, sem dependência nova.
 *
 * Só preenche o que ainda não está definido — uma variável já setada pelo
 * ambiente (Render, shell) sempre vence a do arquivo. Sem .env (produção,
 * onde as variáveis vêm do painel do Render), não faz nada.
 */
const fs = require('node:fs');
const path = require('node:path');

function carregarEnv() {
  const arquivo = path.join(__dirname, '..', '.env');
  let conteudo;
  try { conteudo = fs.readFileSync(arquivo, 'utf8'); }
  catch (e) { return; }

  conteudo.split('\n').forEach(linha => {
    const l = linha.trim();
    if (!l || l.startsWith('#')) return;
    const i = l.indexOf('=');
    if (i < 0) return;
    const chave = l.slice(0, i).trim();
    let valor = l.slice(i + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!(chave in process.env)) process.env[chave] = valor;
  });
}

module.exports = { carregarEnv };

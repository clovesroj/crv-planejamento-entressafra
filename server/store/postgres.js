'use strict';
/**
 * Armazenamento em Postgres — o modo de producao.
 *
 * O merge acontece dentro do proprio UPDATE (operador || do jsonb), e nao em
 * ler-alterar-gravar: duas sessoes salvando ao mesmo tempo nao se apagam.
 *
 * O DDL da tabela esta em schema.sql; garantirTabela() o executa na primeira
 * consulta, entao o primeiro deploy nao precisa de migracao manual.
 */
const fs = require('node:fs');
const path = require('node:path');
const { DOC_ID } = require('../config');

const DDL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

function storePostgres(url) {
  const { Pool } = require('pg');
  const host = new URL(url).hostname;
  // A URL interna do Render traz um nome simples, sem ponto (dpg-xxxx-a), e
  // responde na rede privada sem TLS. A externa é um FQDN
  // (dpg-xxxx-a.ohio-postgres.render.com) e exige TLS com certificado próprio
  // da Render, que não está na cadeia de confiança do Node. Pedir TLS a quem
  // não oferece derruba a conexão, então a distinção importa.
  const interno = !host.includes('.') || host.endsWith('.internal') || host === '127.0.0.1';
  // Escotilha caso a heurística erre num host fora desse padrão.
  const forcado = process.env.DATABASE_SSL;
  const usarSSL = forcado ? forcado !== 'off' : !interno;
  const pool = new Pool({
    connectionString: url,
    ssl: usarSSL ? { rejectUnauthorized: false } : false,
    max: 5,
  });
  console.log(`[pg] host ${host} — TLS ${usarSSL ? 'ligado' : 'desligado'}`);
  pool.on('error', err => console.error('[pg] conexão ociosa caiu:', err.message));

  let pronto = null;
  function garantirTabela() {
    // O .catch() entra junto com a promessa, e não depois: uma rejeição sem
    // tratador derruba o processo no Node. Ele também zera o cache, porque o
    // Postgres do Render costuma levar alguns segundos a mais que o serviço
    // para aceitar conexão — a requisição seguinte precisa tentar de novo em
    // vez de herdar a falha do boot.
    if (!pronto) {
      pronto = pool.query(DDL).catch(err => { pronto = null; throw err; });
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

    // ---------- usuários ----------
    async criarUsuario({ login, senha_hash, nome, papel }) {
      await garantirTabela();
      const r = await pool.query(
        `INSERT INTO usuarios (login, senha_hash, nome, papel) VALUES ($1,$2,$3,$4)
         RETURNING id, login, nome, papel, ativo, criado_em, ultimo_acesso`,
        [login, senha_hash, nome || null, papel || 'usuario']);
      return r.rows[0];
    },
    async listarUsuarios() {
      await garantirTabela();
      const r = await pool.query(
        `SELECT id, login, nome, papel, ativo, criado_em, ultimo_acesso
           FROM usuarios ORDER BY criado_em`);
      return r.rows;
    },
    async contarUsuarios() {
      await garantirTabela();
      return Number((await pool.query('SELECT count(*)::int AS n FROM usuarios')).rows[0].n);
    },
    async usuarioPorLogin(login) {
      await garantirTabela();
      const r = await pool.query('SELECT * FROM usuarios WHERE login = $1', [login]);
      return r.rows[0] || null;
    },
    async usuarioPorId(id) {
      await garantirTabela();
      const r = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
      return r.rows[0] || null;
    },
    async definirAtivo(id, ativo) {
      await garantirTabela();
      await pool.query('UPDATE usuarios SET ativo = $2 WHERE id = $1', [id, ativo]);
      // desativar mata as sessões abertas na hora, não só no próximo login
      if (!ativo) await pool.query('DELETE FROM sessoes WHERE usuario_id = $1', [id]);
    },
    async redefinirSenha(id, senha_hash) {
      await garantirTabela();
      await pool.query('UPDATE usuarios SET senha_hash = $2 WHERE id = $1', [id, senha_hash]);
      await pool.query('DELETE FROM sessoes WHERE usuario_id = $1', [id]); // força novo login
    },
    async marcarAcesso(id) {
      await pool.query('UPDATE usuarios SET ultimo_acesso = now() WHERE id = $1', [id]);
    },

    // ---------- sessões ----------
    async criarSessao(usuario_id, token, expira_em) {
      await garantirTabela();
      await pool.query('INSERT INTO sessoes (token, usuario_id, expira_em) VALUES ($1,$2,$3)',
        [token, usuario_id, expira_em]);
    },
    async sessaoValida(token) {
      await garantirTabela();
      const r = await pool.query(
        `SELECT u.id, u.login, u.nome, u.papel, u.ativo
           FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
          WHERE s.token = $1 AND s.expira_em > now() AND u.ativo`,
        [token]);
      return r.rows[0] || null;
    },
    async apagarSessao(token) {
      await pool.query('DELETE FROM sessoes WHERE token = $1', [token]);
    },
  };
}

module.exports = { storePostgres };

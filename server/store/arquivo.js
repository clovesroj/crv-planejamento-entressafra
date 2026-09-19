'use strict';
/**
 * Armazenamento em arquivo — usado quando nao ha DATABASE_URL.
 *
 * Serve para rodar na maquina local. No Render o disco e efemero e some a cada
 * deploy: por isso duravel:false, e o rodape do app avisa que a gravacao e
 * temporaria.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const { DIR_DADOS } = require('../config');

// Uma fila por arquivo serializa as gravações: sem ela, duas escritas
// simultâneas leriam o mesmo estado e a última apagaria o que a primeira
// acabou de gravar. Cada storeArquivo() cria a sua (plano e usuários não
// competem entre si).
function criarFila() {
  let fila = Promise.resolve();
  return fn => {
    const r = fila.then(fn, fn);
    fila = r.catch(() => {});
    return r;
  };
}

async function escritaAtomica(arq, dir, doc) {
  await fsp.mkdir(dir, { recursive: true });
  const tmp = `${arq}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(doc));
  await fsp.rename(tmp, arq);   // troca atômica: nunca deixa um JSON pela metade
  return doc;
}

async function leituraDisco(arq) {
  try { return JSON.parse(await fsp.readFile(arq, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

function storeArquivo() {
  const dir = DIR_DADOS;
  const arq = path.join(dir, 'plano.json');
  const arqUsu = path.join(dir, 'usuarios.json');

  const enfileirar = criarFila();
  const enfileirarUsu = criarFila();

  // {lista:[usuario...], sessoes:[{token,usuario_id,expira_em}], perfis:[{id,nome,editaveis}]}
  async function usuariosDoDisco() {
    const doc = (await leituraDisco(arqUsu)) || { lista: [], sessoes: [] };
    // mesma semente do schema.sql: 'usuario' nasce editando tudo, como antes dos perfis
    if (!Array.isArray(doc.perfis)) {
      doc.perfis = [{ id: 'usuario', nome: 'Usuário', editaveis: ['*'], criado_em: new Date().toISOString() }];
    }
    return doc;
  }
  const proxId = lista => 1 + lista.reduce((m, u) => Math.max(m, u.id), 0);

  async function doDisco() {
    try {
      return JSON.parse(await fsp.readFile(arq, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async function paraDisco(doc) {
    await fsp.mkdir(dir, { recursive: true });
    const tmp = `${arq}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(doc));
    await fsp.rename(tmp, arq);   // troca atômica: nunca deixa um JSON pela metade
    return { data: doc, updated_at: new Date().toISOString() };
  }

  return {
    tipo: 'arquivo',
    duravel: false,
    async ler() {
      const d = await doDisco();
      if (!d) return null;
      const st = await fsp.stat(arq);
      return { data: d, updated_at: st.mtime.toISOString() };
    },
    mesclar: doc => enfileirar(async () => paraDisco({ ...(await doDisco()), ...doc })),
    substituir: doc => enfileirar(() => paraDisco(doc)),
    async checar() { await fsp.mkdir(dir, { recursive: true }); },

    // ---------- usuários ----------
    criarUsuario: ({ login, senha_hash, nome, papel }) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const usuario = { id: proxId(doc.lista), login, senha_hash, nome: nome || null,
        papel: papel || 'usuario', ativo: true, criado_em: new Date().toISOString(), ultimo_acesso: null };
      doc.lista.push(usuario);
      await escritaAtomica(arqUsu, dir, doc);
      const { senha_hash: _s, ...semSenha } = usuario;
      return semSenha;
    }),
    async listarUsuarios() {
      const doc = await usuariosDoDisco();
      return doc.lista.map(({ senha_hash, ...u }) => u);
    },
    async contarUsuarios() { return (await usuariosDoDisco()).lista.length; },
    // Mesmo critério do store Postgres: login não diferencia maiúsculas de
    // minúsculas (ver comentário lá).
    async usuarioPorLogin(login) {
      const alvo = String(login || '').toLowerCase();
      return (await usuariosDoDisco()).lista.find(u => u.login.toLowerCase() === alvo) || null;
    },
    async usuarioPorId(id) {
      return (await usuariosDoDisco()).lista.find(u => u.id === id) || null;
    },
    definirAtivo: (id, ativo) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const u = doc.lista.find(x => x.id === id);
      if (u) u.ativo = ativo;
      if (!ativo) doc.sessoes = doc.sessoes.filter(s => s.usuario_id !== id);
      await escritaAtomica(arqUsu, dir, doc);
    }),
    redefinirSenha: (id, senha_hash) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const u = doc.lista.find(x => x.id === id);
      if (u) u.senha_hash = senha_hash;
      doc.sessoes = doc.sessoes.filter(s => s.usuario_id !== id);
      await escritaAtomica(arqUsu, dir, doc);
    }),
    // Diferente de definirAtivo(false): apaga o cadastro de vez, não só corta
    // o acesso — inclusive as sessões, que o Postgres cascateia sozinho.
    apagarUsuario: id => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      doc.lista = doc.lista.filter(u => u.id !== id);
      doc.sessoes = doc.sessoes.filter(s => s.usuario_id !== id);
      await escritaAtomica(arqUsu, dir, doc);
    }),
    marcarAcesso: id => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const u = doc.lista.find(x => x.id === id);
      if (u) u.ultimo_acesso = new Date().toISOString();
      await escritaAtomica(arqUsu, dir, doc);
    }),

    // ---------- sessões ----------
    criarSessao: (usuario_id, token, expira_em) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      doc.sessoes.push({ token, usuario_id, expira_em: expira_em.toISOString() });
      await escritaAtomica(arqUsu, dir, doc);
    }),
    async sessaoValida(token) {
      const doc = await usuariosDoDisco();
      const s = doc.sessoes.find(x => x.token === token);
      if (!s || new Date(s.expira_em) <= new Date()) return null;
      const u = doc.lista.find(x => x.id === s.usuario_id);
      if (!u || !u.ativo) return null;
      const { senha_hash, ...semSenha } = u;
      return semSenha;
    },
    apagarSessao: token => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      doc.sessoes = doc.sessoes.filter(s => s.token !== token);
      await escritaAtomica(arqUsu, dir, doc);
    }),

    // ---------- perfis ----------
    async listarPerfis() { return (await usuariosDoDisco()).perfis; },
    async perfilPorId(id) {
      return (await usuariosDoDisco()).perfis.find(p => p.id === id) || null;
    },
    criarPerfil: ({ id, nome, editaveis }) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const perfil = { id, nome, editaveis: editaveis || [], criado_em: new Date().toISOString() };
      doc.perfis.push(perfil);
      await escritaAtomica(arqUsu, dir, doc);
      return perfil;
    }),
    atualizarPerfil: (id, { nome, editaveis }) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const p = doc.perfis.find(x => x.id === id);
      if (!p) return null;
      if (nome != null) p.nome = nome;
      if (editaveis != null) p.editaveis = editaveis;
      await escritaAtomica(arqUsu, dir, doc);
      return p;
    }),
    apagarPerfil: id => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      doc.perfis = doc.perfis.filter(p => p.id !== id);
      await escritaAtomica(arqUsu, dir, doc);
    }),
    async contarUsuariosPorPapel(papel) {
      return (await usuariosDoDisco()).lista.filter(u => u.papel === papel).length;
    },
    async contarAdminsAtivos() {
      return (await usuariosDoDisco()).lista.filter(u => u.papel === 'admin' && u.ativo).length;
    },
    definirPapel: (id, papel) => enfileirarUsu(async () => {
      const doc = await usuariosDoDisco();
      const u = doc.lista.find(x => x.id === id);
      if (u) u.papel = papel;
      await escritaAtomica(arqUsu, dir, doc);
    }),
  };
}

module.exports = { storeArquivo };

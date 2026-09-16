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
const auth = require('./auth');

const usuarioPublico = u => u && { id: u.id, login: u.login, nome: u.nome, papel: u.papel,
  ativo: u.ativo, criado_em: u.criado_em, ultimo_acesso: u.ultimo_acesso };

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

  if (rota === '/api/auth/bootstrap') {
    if (req.method !== 'POST') throw erroHTTP(405, 'método não permitido');
    // Só funciona uma vez: com a tabela vazia. Depois disso é sempre 409 —
    // é assim que o primeiro admin é criado sem senha nenhuma no código-fonte.
    if (await store.contarUsuarios() > 0) throw erroHTTP(409, 'já existe usuário — bootstrap já foi usado');
    const { login, senha: senhaBruta } = await lerCorpo(req);
    const senha = aparar(senhaBruta);
    validarCredenciais(login, senha);
    const usuario = await store.criarUsuario({ login, senha_hash: auth.hashSenha(senha), papel: 'admin' });
    return json(res, 201, { usuario: usuarioPublico(usuario) });
  }

  if (rota === '/api/auth/login') {
    if (req.method !== 'POST') throw erroHTTP(405, 'método não permitido');
    const { login, senha: senhaBruta } = await lerCorpo(req);
    const senha = aparar(senhaBruta);
    const u = login && await store.usuarioPorLogin(login);
    // mesma mensagem para login inexistente ou senha errada — não dizer qual dos dois
    if (!u || !u.ativo || !auth.verificarSenha(senha, u.senha_hash)) {
      throw erroHTTP(401, 'usuário ou senha inválidos');
    }
    const token = auth.gerarToken(), expira = auth.expiraEm();
    await store.criarSessao(u.id, token, expira);
    await store.marcarAcesso(u.id);
    auth.definirCookieSessao(req, res, token);
    return json(res, 200, { usuario: usuarioPublico(u) });
  }

  if (rota === '/api/auth/logout') {
    if (req.method !== 'POST') throw erroHTTP(405, 'método não permitido');
    const token = auth.lerCookies(req)[auth.COOKIE];
    if (token) await store.apagarSessao(token);
    auth.limparCookieSessao(req, res);
    return json(res, 200, { ok: true });
  }

  if (rota === '/api/auth/me') {
    if (req.method !== 'GET') throw erroHTTP(405, 'método não permitido');
    const u = await auth.exigirSessao(req, store);
    return json(res, 200, { usuario: usuarioPublico(u) });
  }

  if (rota === '/api/auth/senha') {
    if (req.method !== 'PATCH') throw erroHTTP(405, 'método não permitido');
    const sessao = await auth.exigirSessao(req, store);
    const corpo = await lerCorpo(req);
    const senhaAtual = aparar(corpo.senhaAtual), novaSenha = aparar(corpo.novaSenha);
    const u = await store.usuarioPorId(sessao.id);
    if (!auth.verificarSenha(senhaAtual, u.senha_hash)) throw erroHTTP(401, 'senha atual incorreta');
    validarSenha(novaSenha);
    await store.redefinirSenha(u.id, auth.hashSenha(novaSenha));
    // a própria sessão atual também foi apagada por redefinirSenha — relogar
    const token = auth.gerarToken(), expira = auth.expiraEm();
    await store.criarSessao(u.id, token, expira);
    auth.definirCookieSessao(req, res, token);
    return json(res, 200, { ok: true });
  }

  if (rota === '/api/usuarios') {
    await auth.exigirAdmin(req, store);
    if (req.method === 'GET') {
      return json(res, 200, { usuarios: (await store.listarUsuarios()).map(usuarioPublico) });
    }
    if (req.method === 'POST') {
      const { login, senha: senhaBruta, nome, papel } = await lerCorpo(req);
      const senha = aparar(senhaBruta);
      validarCredenciais(login, senha);
      if (await store.usuarioPorLogin(login)) throw erroHTTP(409, 'já existe um usuário com este login');
      const usuario = await store.criarUsuario({ login, senha_hash: auth.hashSenha(senha), nome, papel });
      return json(res, 201, { usuario: usuarioPublico(usuario) });
    }
    if (req.method === 'PATCH') {
      const { id, ativo, novaSenha: novaSenhaBruta } = await lerCorpo(req);
      const novaSenha = aparar(novaSenhaBruta);
      const alvo = id && await store.usuarioPorId(id);
      if (!alvo) throw erroHTTP(404, 'usuário não encontrado');
      if (ativo != null) await store.definirAtivo(id, !!ativo);
      if (novaSenha) { validarSenha(novaSenha); await store.redefinirSenha(id, auth.hashSenha(novaSenha)); }
      return json(res, 200, { usuario: usuarioPublico(await store.usuarioPorId(id)) });
    }
    throw erroHTTP(405, 'método não permitido');
  }

  if (rota !== '/api/plano') throw erroHTTP(404, 'rota inexistente');

  // Dado de negócio — salário, custo, programação da safra — exige sessão.
  await auth.exigirSessao(req, store);

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

// espaço a mais no início/fim é o erro de digitação mais comum (autofill,
// copiar e colar) e o usuário não tem como ver — apara antes de tudo, tanto
// ao criar/redefinir quanto ao logar, pra não gravar um valor com espaço e
// depois nunca mais bater com o que a pessoa digita
function aparar(v) { return String(v == null ? '' : v).trim(); }
function validarCredenciais(login, senha) {
  if (!login || String(login).trim().length < 3) throw erroHTTP(400, 'login precisa de pelo menos 3 caracteres');
  validarSenha(senha);
}
function validarSenha(senha) {
  if (!senha || senha.length < 6) throw erroHTTP(400, 'senha precisa de pelo menos 6 caracteres');
}

module.exports = { api };

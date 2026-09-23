'use strict';
/**
 * As rotas da API.
 *
 *   GET    /api/health         estado do servico e qual armazenamento esta ativo
 *   GET    /api/plano          documento completo (qualquer usuario logado)
 *   PATCH  /api/plano          merge por chave — filtrado pelo perfil
 *   POST   /api/plano          idem, para navigator.sendBeacon ao fechar a aba
 *   PUT    /api/plano          substitui o documento — so em "restaurar padroes"
 *   POST   /api/auth/login | logout | bootstrap    GET /api/auth/me    PATCH /api/auth/senha
 *   GET|POST|PATCH|DELETE /api/usuarios   (admin)
 *   GET|POST|PATCH|DELETE /api/perfis     (admin) — o que cada perfil pode editar
 *   GET    /api/agrofit/produtos-formulados   candidatos na Embrapa para linkar a bula de um insumo
 *
 * Tudo que toca o plano exige sessao (server/auth.js). Gravar exige, alem
 * disso, permissao de edicao na aba de cada dado (server/permissoes.js).
 */
const store = require('./store');
const { erroHTTP, json, lerCorpo } = require('./http');
const { SERVICO } = require('./config');
const auth = require('./auth');
const perms = require('./permissoes');
const itens = require('./mesclaItens');
const agrofit = require('./agrofit');

const usuarioPublico = u => u && { id: u.id, login: u.login, nome: u.nome, papel: u.papel,
  ativo: u.ativo, criado_em: u.criado_em, ultimo_acesso: u.ultimo_acesso };

// usuário da sessão + o que o perfil dele pode editar (para a interface travar as abas)
async function usuarioComPermissoes(u) {
  return { ...usuarioPublico(u), permissoes: perms.permissoesPublicas(await perms.permissoesDe(u, store)) };
}
async function papelValido(papel) {
  return papel === 'admin' || !!(await store.perfilPorId(papel));
}
const mesmoId = (a, b) => String(a) === String(b);   // bigint do pg chega como string

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
    return json(res, 200, { usuario: await usuarioComPermissoes(u) });
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
    return json(res, 200, { usuario: await usuarioComPermissoes(u) });
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
    const sessao = await auth.exigirAdmin(req, store);
    if (req.method === 'GET') {
      return json(res, 200, { usuarios: (await store.listarUsuarios()).map(usuarioPublico) });
    }
    if (req.method === 'POST') {
      const { login, senha: senhaBruta, nome, papel: papelBruto } = await lerCorpo(req);
      const senha = aparar(senhaBruta);
      const papel = aparar(papelBruto) || 'usuario';
      validarCredenciais(login, senha);
      if (!await papelValido(papel)) throw erroHTTP(400, 'perfil inexistente');
      if (await store.usuarioPorLogin(login)) throw erroHTTP(409, 'já existe um usuário com este login');
      const usuario = await store.criarUsuario({ login, senha_hash: auth.hashSenha(senha), nome, papel });
      return json(res, 201, { usuario: usuarioPublico(usuario) });
    }
    if (req.method === 'PATCH') {
      const { id, ativo, novaSenha: novaSenhaBruta, papel } = await lerCorpo(req);
      const novaSenha = aparar(novaSenhaBruta);
      const alvo = id && await store.usuarioPorId(id);
      if (!alvo) throw erroHTTP(404, 'usuário não encontrado');
      const proprio = mesmoId(alvo.id, sessao.id);
      if (papel != null && !await papelValido(papel)) throw erroHTTP(400, 'perfil inexistente');
      if (proprio && ativo != null && !ativo) throw erroHTTP(409, 'não dá para desativar o próprio usuário logado');
      if (proprio && papel != null && papel !== 'admin') {
        throw erroHTTP(409, 'não dá para tirar o próprio acesso de administrador — peça a outro administrador');
      }
      // Sem administrador ativo ninguém mais gerencia usuários nem perfis: o
      // sistema ficaria trancado. Vale para desativar e para trocar o perfil.
      const tiraAdmin = alvo.papel === 'admin' && alvo.ativo &&
        ((ativo != null && !ativo) || (papel != null && papel !== 'admin'));
      if (tiraAdmin && await store.contarAdminsAtivos() <= 1) {
        throw erroHTTP(409, 'é o único administrador ativo — promova outro usuário antes');
      }
      if (ativo != null) await store.definirAtivo(id, !!ativo);
      if (papel != null) await store.definirPapel(id, papel);
      if (novaSenha) { validarSenha(novaSenha); await store.redefinirSenha(id, auth.hashSenha(novaSenha)); }
      return json(res, 200, { usuario: usuarioPublico(await store.usuarioPorId(id)) });
    }
    if (req.method === 'DELETE') {
      const { id } = await lerCorpo(req);
      const alvo = id && await store.usuarioPorId(id);
      if (!alvo) throw erroHTTP(404, 'usuário não encontrado');
      if (mesmoId(alvo.id, sessao.id)) throw erroHTTP(409, 'não dá para apagar o próprio usuário logado');
      // mesma regra do "tirar admin" em PATCH: sem administrador ativo, ninguém
      // mais gerencia usuários nem perfis
      if (alvo.papel === 'admin' && alvo.ativo && await store.contarAdminsAtivos() <= 1) {
        throw erroHTTP(409, 'é o único administrador ativo — promova outro usuário antes');
      }
      await store.apagarUsuario(id);
      return json(res, 200, { ok: true });
    }
    throw erroHTTP(405, 'método não permitido');
  }

  // Perfis: o que cada um pode editar. Só o administrador gerencia.
  if (rota === '/api/perfis') {
    await auth.exigirAdmin(req, store);
    if (req.method === 'GET') {
      const perfis = await Promise.all((await store.listarPerfis()).map(async p => ({
        ...p, editaveis: perms.normalizarEditaveis(p.editaveis),
        usuarios: await store.contarUsuariosPorPapel(p.id),
      })));
      return json(res, 200, {
        perfis, admins: await store.contarUsuariosPorPapel('admin'),
        areas: perms.permissoesPublicas({ admin: false, tudo: false, editaveis: [] }).areas,
      });
    }
    if (req.method === 'POST') {
      const { nome: nomeBruto, editaveis } = await lerCorpo(req);
      const nome = aparar(nomeBruto);
      if (nome.length < 2) throw erroHTTP(400, 'o nome do perfil precisa de pelo menos 2 caracteres');
      const id = perms.idDoNome(nome);
      if (!id) throw erroHTTP(400, 'o nome do perfil precisa ter letras ou números');
      if (id === 'admin' || perms.PERFIS_FIXOS[id] || await store.perfilPorId(id)) {
        throw erroHTTP(409, 'já existe um perfil com este nome');
      }
      const perfil = await store.criarPerfil({ id, nome, editaveis: perms.normalizarEditaveis(editaveis) });
      return json(res, 201, { perfil });
    }
    if (req.method === 'PATCH') {
      const { id, nome: nomeBruto, editaveis } = await lerCorpo(req);
      if (id === 'admin') throw erroHTTP(400, 'o perfil Administrador edita tudo sempre e não é configurável');
      if (!id || !await store.perfilPorId(id)) throw erroHTTP(404, 'perfil não encontrado');
      const campos = {};
      if (nomeBruto != null) {
        const nome = aparar(nomeBruto);
        if (nome.length < 2) throw erroHTTP(400, 'o nome do perfil precisa de pelo menos 2 caracteres');
        campos.nome = nome;
      }
      if (editaveis != null) campos.editaveis = perms.normalizarEditaveis(editaveis);
      return json(res, 200, { perfil: await store.atualizarPerfil(id, campos) });
    }
    if (req.method === 'DELETE') {
      const { id } = await lerCorpo(req);
      if (id === 'admin' || id === 'usuario') throw erroHTTP(400, 'os perfis padrão não podem ser excluídos');
      if (!id || !await store.perfilPorId(id)) throw erroHTTP(404, 'perfil não encontrado');
      const emUso = await store.contarUsuariosPorPapel(id);
      if (emUso > 0) throw erroHTTP(409, `perfil em uso por ${emUso} usuário(s) — troque o perfil deles antes`);
      await store.apagarPerfil(id);
      return json(res, 200, { ok: true });
    }
    throw erroHTTP(405, 'método não permitido');
  }

  // Busca de candidatos na AGROFIT (Embrapa) para linkar a bula de um insumo.
  // Só quem edita a aba Insumos usa isto — é passo de cadastro, não leitura livre.
  if (rota === '/api/agrofit/produtos-formulados') {
    if (req.method !== 'GET') throw erroHTTP(405, 'método não permitido');
    const sessao = await auth.exigirSessao(req, store);
    const perm = await perms.permissoesDe(sessao, store);
    if (!perm.tudo && !perm.editaveis.includes('insumos')) {
      throw erroHTTP(403, 'seu perfil não edita Insumos');
    }
    const url = new URL(req.url, 'http://x');
    const dados = await agrofit.buscarProdutosFormulados({
      marca_comercial: url.searchParams.get('marca'),
      titular_registro: url.searchParams.get('titular'),
      page: url.searchParams.get('page'),
    });
    return json(res, 200, { produtos: dados });
  }

  if (rota !== '/api/plano') throw erroHTTP(404, 'rota inexistente');

  // Dado de negócio — salário, custo, programação da safra — exige sessão.
  const sessao = await auth.exigirSessao(req, store);

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
    const perm = await perms.permissoesDe(sessao, store);

    // Insumos, Atividades e Tratamentos não mandam mais o array/objeto
    // inteiro — só o item que mudou (ver ui/insumos.js e ui/atividades-cad.js,
    // e server/mesclaItens.js pro porquê). Mescla com a linha travada, pra
    // duas gravações concorrentes não lerem o mesmo "antes" e uma apagar a
    // outra — é isso que fecha a lacuna que o merge raso (só no primeiro
    // nível) deixava quando duas pessoas editavam a mesma tabela ao mesmo tempo.
    if (req.method !== 'PUT' && itens.temPatch(corpo)) {
      let ignorados = [];
      const d = await store.mesclarItens(atual => {
        const efetivo = itens.aplicarPatches(corpo, atual || {});
        let doc = efetivo;
        if (!perm.tudo) {
          const r = perms.filtrarGravacao(efetivo, atual || {}, perm, false);
          doc = r.doc; ignorados = r.ignorados;
        }
        if (!Object.keys(doc).some(k => k !== 'v')) return null;
        const novo = { ...(atual || {}), ...doc };
        // P chega parcial (só os campos mudados): funde no P gravado
        if (doc.P && typeof doc.P === 'object') novo.P = { ...((atual || {}).P || {}), ...doc.P };
        return novo;
      });
      return json(res, 200, { armazenamento: store.tipo, duravel: store.duravel, updated_at: d.updated_at, ignorados });
    }

    // Ler é livre para quem está logado; gravar passa pelo perfil. O que o perfil
    // não pode alterar é descartado aqui, e volta em `ignorados` só o que chegou
    // diferente do banco (o navegador manda o documento inteiro a cada gravação).
    let doc = corpo, ignorados = [];
    if (!perm.tudo) {
      const atual = await store.ler();
      ({ doc, ignorados } = perms.filtrarGravacao(corpo, atual ? atual.data : {}, perm, req.method === 'PUT'));
      // nada permitido mudou: não grava, para não tocar updated_at à toa
      if (req.method !== 'PUT' && !Object.keys(doc).some(k => k !== 'v')) {
        return json(res, 200, { armazenamento: store.tipo, duravel: store.duravel,
          updated_at: atual ? atual.updated_at : null, ignorados });
      }
    }
    const d = req.method === 'PUT' ? await store.substituir(doc) : await store.mesclar(doc);
    return json(res, 200, { armazenamento: store.tipo, duravel: store.duravel, updated_at: d.updated_at, ignorados });
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

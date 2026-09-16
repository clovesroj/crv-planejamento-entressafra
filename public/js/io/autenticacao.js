/**
 * Chamadas de autenticação e gestão de usuários. Mesmo estilo de pedirAPI()
 * em io/persistencia.js.
 */
async function chamar(rota, metodo, corpo) {
  const r = await fetch(rota, {
    method: metodo,
    headers: corpo ? { 'content-type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro || (rota + ' respondeu ' + r.status));
  return d;
}

const quemSou    = () => chamar('/api/auth/me', 'GET').then(d => d.usuario).catch(() => null);
const login       = (login, senha) => chamar('/api/auth/login', 'POST', { login, senha }).then(d => d.usuario);
const logout      = () => chamar('/api/auth/logout', 'POST');
const trocarSenha = (senhaAtual, novaSenha) => chamar('/api/auth/senha', 'PATCH', { senhaAtual, novaSenha });

const listarUsuarios = () => chamar('/api/usuarios', 'GET').then(d => d.usuarios);
const criarUsuario   = u => chamar('/api/usuarios', 'POST', u).then(d => d.usuario);
const atualizarUsuario = (id, campos) => chamar('/api/usuarios', 'PATCH', { id, ...campos }).then(d => d.usuario);

export { quemSou, login, logout, trocarSenha, listarUsuarios, criarUsuario, atualizarUsuario };

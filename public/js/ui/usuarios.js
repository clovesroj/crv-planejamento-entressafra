/**
 * Aba Usuários — só-admin. Listener próprio, não passa pela delegação
 * central de app/eventos.js: gestão de usuário não é edição do plano.
 */
import { $, esc, fmt } from '../nucleo/formato.js';
import { listarUsuarios, criarUsuario, atualizarUsuario, trocarSenha } from '../io/autenticacao.js';
import { th } from './componentes.js';
import { USUARIO } from '../nucleo/sessao.js';

const dataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca';

async function pintarUsuarios() {
  let lista;
  try { lista = await listarUsuarios(); }
  catch (e) { $('#t_usuarios').innerHTML = `<tbody><tr><td>Não foi possível carregar (${esc(e.message)}).</td></tr></tbody>`; return; }

  $('#t_usuarios').innerHTML = th([['Login'], ['Nome'], ['Papel'], ['Status'], ['Último acesso'], ['']]) + '<tbody>' +
    (lista.length ? lista.map(u => `<tr>
      <td>${esc(u.login)}</td>
      <td>${esc(u.nome || '—')}</td>
      <td>${u.papel === 'admin' ? 'Administrador' : 'Usuário'}</td>
      <td><span class="badge ${u.ativo ? 'b-ok' : 'b-bad'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="calc">${dataHora(u.ultimo_acesso)}</td>
      <td>
        <button class="btn" data-us-tog="${u.id}" data-ativo="${u.ativo ? 1 : 0}"
          ${u.id === USUARIO.id ? 'disabled title="não dá para desativar o próprio usuário logado"' : ''}>
          ${u.ativo ? 'Desativar' : 'Ativar'}</button>
        <button class="btn" data-us-senha="${u.id}" data-login="${esc(u.login)}">Redefinir senha</button>
      </td></tr>`).join('')
      : '<tr><td colspan="6" class="calc">Nenhum usuário cadastrado.</td></tr>') + '</tbody>';
}

$('#t_usuarios').addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.usTog !== undefined) {
    const id = +t.dataset.usTog, ativoAtual = t.dataset.ativo === '1';
    if (ativoAtual && !confirm('Desativar este usuário? O acesso é cortado na hora.')) return;
    t.disabled = true;
    try { await atualizarUsuario(id, { ativo: !ativoAtual }); pintarUsuarios(); }
    catch (err) { alert(err.message); t.disabled = false; }
    return;
  }
  if (t.dataset.usSenha !== undefined) {
    const id = +t.dataset.usSenha;
    const nova = prompt(`Nova senha para "${t.dataset.login}" (mínimo 6 caracteres):`);
    if (!nova) return;
    if (nova.length < 6) { alert('A senha precisa de pelo menos 6 caracteres.'); return; }
    try { await atualizarUsuario(id, { novaSenha: nova }); alert('Senha redefinida.'); }
    catch (err) { alert(err.message); }
    return;
  }
});

$('#btn_us_add').onclick = async () => {
  const login = $('#us_login').value.trim(), nome = $('#us_nome').value.trim();
  const senha = $('#us_senha').value, papel = $('#us_papel').value;
  const erro = $('#us_erro'); erro.textContent = '';
  if (!login || !senha) { erro.textContent = 'Informe login e senha inicial.'; return; }
  try {
    await criarUsuario({ login, senha, nome, papel });
    $('#us_login').value = ''; $('#us_nome').value = ''; $('#us_senha').value = ''; $('#us_papel').value = 'usuario';
    pintarUsuarios();
  } catch (e) { erro.textContent = e.message; }
};

$('#btn_us_trocar_senha').onclick = async () => {
  const atual = $('#us_senha_atual').value, nova = $('#us_senha_nova').value;
  const msg = $('#us_senha_msg'); msg.style.color = ''; msg.textContent = '';
  if (!atual || !nova) { msg.style.color = 'var(--bad)'; msg.textContent = 'Informe a senha atual e a nova senha.'; return; }
  try {
    await trocarSenha(atual, nova);
    $('#us_senha_atual').value = ''; $('#us_senha_nova').value = '';
    msg.style.color = 'var(--ok)'; msg.textContent = 'Senha alterada.';
  } catch (e) { msg.style.color = 'var(--bad)'; msg.textContent = e.message; }
};

// A lista vive no servidor, fora do ciclo de render() do plano — recarrega
// a cada vez que a aba é aberta, não só na primeira.
document.querySelector('nav button[data-s="usuarios"]').addEventListener('click', pintarUsuarios);

export { pintarUsuarios };

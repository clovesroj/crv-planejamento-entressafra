/**
 * Tela de login e o "chrome" de sessão (chip do usuário, botão Sair,
 * itens só-admin). O arranque normal do app (main.js) só chama pintarPremissas
 * / render / carregar depois que iniciarTelaLogin() resolver com sucesso.
 */
import { $ } from '../nucleo/formato.js';
import { login as apiLogin, logout as apiLogout } from '../io/autenticacao.js';
import { setUSUARIO } from '../nucleo/sessao.js';
import { iniciar as iniciarFundo, parar as pararFundo } from './fundo-login.js';

function aplicarChromeUsuario(usuario) {
  $('#chip_usuario_nome').textContent = usuario.nome || usuario.login;
  $('#chip_usuario').hidden = false;
  $('#btn_logout').hidden = false;
  document.querySelectorAll('[data-admin]').forEach(el => { el.hidden = usuario.papel !== 'admin'; });
}

function mostrarErro(msg) {
  const el = $('#login_erro');
  el.textContent = msg;
  el.hidden = false;
}

function iniciarTelaLogin(aoEntrar) {
  const tela = $('#tela_login');
  tela.hidden = false;
  iniciarFundo($('#fundo_login'));
  $('#login_usuario').focus();

  $('#form_login').addEventListener('submit', async e => {
    e.preventDefault();
    const usuario = $('#login_usuario').value.trim(), senha = $('#login_senha').value;
    $('#login_erro').hidden = true;
    if (!usuario || !senha) { mostrarErro('Informe usuário e senha.'); return; }
    const btn = $('#btn_login');
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      const u = await apiLogin(usuario, senha);
      setUSUARIO(u);
      aplicarChromeUsuario(u);
      pararFundo();
      tela.hidden = true;
      aoEntrar(u);
    } catch (err) {
      mostrarErro(err.message || 'Não foi possível entrar.');
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
}

$('#btn_logout').onclick = async () => {
  try { await apiLogout(); } catch (e) {}
  location.reload();
};

export { iniciarTelaLogin, aplicarChromeUsuario };

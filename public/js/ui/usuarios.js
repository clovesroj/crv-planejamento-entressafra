/**
 * Aba Usuários — só-admin. Listener próprio, não passa pela delegação
 * central de app/eventos.js: gestão de usuário não é edição do plano.
 *
 * Três partes: usuários (com o perfil de cada um), perfis e permissões (a
 * matriz aba × perfil) e a troca da própria senha. Tudo vive no servidor,
 * fora do ciclo de render() do plano, e é recarregado ao abrir a aba.
 */
import { $, esc } from '../nucleo/formato.js';
import { listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario, trocarSenha,
         listarPerfis, criarPerfil, atualizarPerfil, excluirPerfil } from '../io/autenticacao.js';
import { th } from './componentes.js';
import { USUARIO } from '../nucleo/sessao.js';

const TUDO = '*';
const dataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca';

let PERFIS = [];   // último GET /api/perfis: [{id, nome, editaveis, usuarios}]
let AREAS = [];    // catálogo de abas editáveis: [{id, nome, grupo}]
let PERFIS_ADMINS = 0;   // quantos usuários têm perfil Administrador

const nomePerfil = id => id === 'admin' ? 'Administrador' : ((PERFIS.find(p => p.id === id) || {}).nome || id + ' (perfil removido)');
const opcoesPerfil = sel => [{ id: 'admin', nome: 'Administrador' }, ...PERFIS]
  .map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')
  // perfil que não existe mais continua visível na seleção, para o admin corrigir
  + (sel && sel !== 'admin' && !PERFIS.some(p => p.id === sel) ? `<option value="${esc(sel)}" selected>${esc(sel)} (removido)</option>` : '');

async function pintarUsuarios() {
  let lista;
  try {
    const [usuarios, catalogo] = await Promise.all([listarUsuarios(), listarPerfis()]);
    lista = usuarios; PERFIS = catalogo.perfis; AREAS = catalogo.areas; PERFIS_ADMINS = catalogo.admins;
  } catch (e) {
    $('#t_usuarios').innerHTML = `<tbody><tr><td>Não foi possível carregar (${esc(e.message)}).</td></tr></tbody>`;
    return;
  }

  $('#t_usuarios').innerHTML = th([['Login'], ['Nome'], ['Perfil'], ['Status'], ['Último acesso'], ['']]) + '<tbody>' +
    (lista.length ? lista.map(u => {
      const proprio = String(u.id) === String(USUARIO.id);
      return `<tr>
      <td>${esc(u.login)}</td>
      <td>${esc(u.nome || '—')}</td>
      <td><select data-us-papel="${u.id}" ${proprio ? 'disabled title="o próprio perfil não é alterável — peça a outro administrador"' : ''}
            style="min-width:160px">${opcoesPerfil(u.papel)}</select></td>
      <td><span class="badge ${u.ativo ? 'b-ok' : 'b-bad'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="calc">${dataHora(u.ultimo_acesso)}</td>
      <td>
        <button class="btn" data-us-tog="${u.id}" data-ativo="${u.ativo ? 1 : 0}"
          ${proprio ? 'disabled title="não dá para desativar o próprio usuário logado"' : ''}>
          ${u.ativo ? 'Desativar' : 'Ativar'}</button>
        <button class="btn" data-us-senha="${u.id}" data-login="${esc(u.login)}">Redefinir senha</button>
        <button class="btn d" data-us-excluir="${u.id}" data-login="${esc(u.login)}"
          ${proprio ? 'disabled title="não dá para apagar o próprio usuário logado"' : ''}>Excluir</button>
      </td></tr>`; }).join('')
      : '<tr><td colspan="6" class="calc">Nenhum usuário cadastrado.</td></tr>') + '</tbody>';

  // o formulário de novo usuário oferece os perfis que existem hoje
  const selNovo = $('#us_papel'), atual = selNovo.value || 'usuario';
  selNovo.innerHTML = opcoesPerfil(PERFIS.some(p => p.id === atual) || atual === 'admin' ? atual : 'usuario');

  pintarMatriz();
}

/* Matriz de permissões: linhas são as abas editáveis (agrupadas como no menu),
   colunas são os perfis. Administrador aparece fixo, tudo marcado. */
function pintarMatriz() {
  const col = PERFIS.map(p => ({ ...p, tudo: (p.editaveis || []).includes(TUDO) }));
  const grupos = [];
  AREAS.forEach(a => { let g = grupos.find(x => x.nome === a.grupo); if (!g) grupos.push(g = { nome: a.grupo, areas: [] }); g.areas.push(a); });
  const n = col.length + 2;

  const cab = `<thead><tr><th>Aba</th><th class="num">Administrador</th>${col.map(p =>
    `<th class="num">${esc(p.nome)}</th>`).join('')}</tr></thead>`;

  const linhaTudo = `<tr class="pf-tudo"><td><b>Edita tudo</b> <span class="calc">(inclusive abas futuras)</span></td>
    <td class="num"><input type="checkbox" checked disabled></td>${col.map(p =>
    `<td class="num"><input type="checkbox" data-pf-tudo="${esc(p.id)}" ${p.tudo ? 'checked' : ''}
       title="Editar todas as abas"></td>`).join('')}</tr>`;

  const corpo = grupos.map(g => `<tr class="pf-grupo"><td colspan="${n}">${esc(g.nome)}</td></tr>` +
    g.areas.map(a => `<tr><td>${esc(a.nome)}</td><td class="num"><input type="checkbox" checked disabled></td>${col.map(p =>
      `<td class="num"><input type="checkbox" data-pf="${esc(p.id)}" data-area="${esc(a.id)}"
         ${p.tudo || (p.editaveis || []).includes(a.id) ? 'checked' : ''} ${p.tudo ? 'disabled title="o perfil já edita tudo"' : ''}></td>`
    ).join('')}</tr>`).join('')).join('');

  const rodape = `<tr class="pf-rodape"><td>Usuários com o perfil</td><td class="num">${PERFIS_ADMINS}</td>${col.map(p =>
      `<td class="num">${p.usuarios}</td>`).join('')}</tr>
    <tr class="pf-rodape"><td></td><td></td>${col.map(p => `<td class="num">
      <button class="btn" data-pf-renomear="${esc(p.id)}">Renomear</button>
      <button class="btn d" data-pf-excluir="${esc(p.id)}" ${p.id === 'usuario' || p.usuarios > 0
        ? `disabled title="${p.id === 'usuario' ? 'perfil padrão de novos usuários' : 'perfil em uso — troque o perfil desses usuários antes'}"` : ''}>Excluir</button>
    </td>`).join('')}</tr>`;

  $('#t_perfis').innerHTML = cab + '<tbody>' + linhaTudo + corpo + rodape + '</tbody>';
}

async function salvarPerfil(id, campos, controle) {
  if (controle) controle.disabled = true;
  try { await atualizarPerfil(id, campos); }
  catch (err) { alert(err.message); }
  await pintarUsuarios();
}

/* ---------- usuários ---------- */
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
  if (t.dataset.usExcluir !== undefined) {
    const id = +t.dataset.usExcluir;
    if (!confirm(`Apagar o usuário "${t.dataset.login}" de vez? Isto não pode ser desfeito — se for só cortar o acesso, use "Desativar".`)) return;
    t.disabled = true;
    try { await excluirUsuario(id); pintarUsuarios(); }
    catch (err) { alert(err.message); t.disabled = false; }
    return;
  }
});

$('#t_usuarios').addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.usPapel === undefined) return;
  const id = +t.dataset.usPapel, papel = t.value;
  const aviso = papel === 'admin'
    ? 'Tornar este usuário Administrador? Ele passa a editar tudo e a gerenciar usuários e perfis.'
    : `Trocar o perfil para "${nomePerfil(papel)}"? Vale na próxima gravação que ele fizer.`;
  if (!confirm(aviso)) { pintarUsuarios(); return; }
  t.disabled = true;
  try { await atualizarUsuario(id, { papel }); }
  catch (err) { alert(err.message); }
  pintarUsuarios();
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

/* ---------- perfis ---------- */
$('#btn_pf_add').onclick = async () => {
  const nome = $('#pf_nome').value.trim(), erro = $('#pf_erro');
  erro.textContent = '';
  if (nome.length < 2) { erro.textContent = 'Informe o nome do perfil (pelo menos 2 caracteres).'; return; }
  try {
    // perfil novo nasce só com visualização: o admin marca o que ele edita
    await criarPerfil(nome, []);
    $('#pf_nome').value = '';
    await pintarUsuarios();
  } catch (e) { erro.textContent = e.message; }
};

$('#t_perfis').addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.pfTudo !== undefined) {
    const p = PERFIS.find(x => x.id === t.dataset.pfTudo); if (!p) return;
    // Desmarcar "tudo" mantém todas as abas de hoje marcadas, uma a uma: o admin
    // desmarca só o que quer tirar. Voltar para nenhuma aba cortaria de uma vez a
    // edição de uma equipe inteira por um clique. (Abas criadas no futuro deixam
    // de entrar sozinhas — essa é a diferença para "tudo".)
    const editaveis = t.checked ? [TUDO] : AREAS.map(a => a.id);
    return salvarPerfil(p.id, { editaveis }, t);
  }
  if (t.dataset.pf !== undefined) {
    const p = PERFIS.find(x => x.id === t.dataset.pf); if (!p) return;
    const atuais = new Set((p.editaveis || []).filter(a => a !== TUDO));
    if (t.checked) atuais.add(t.dataset.area); else atuais.delete(t.dataset.area);
    return salvarPerfil(p.id, { editaveis: [...atuais] }, t);
  }
});

$('#t_perfis').addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.pfRenomear !== undefined) {
    const p = PERFIS.find(x => x.id === t.dataset.pfRenomear); if (!p) return;
    const nome = prompt('Novo nome do perfil:', p.nome);
    if (!nome || nome.trim() === p.nome) return;
    return salvarPerfil(p.id, { nome: nome.trim() }, t);
  }
  if (t.dataset.pfExcluir !== undefined) {
    const p = PERFIS.find(x => x.id === t.dataset.pfExcluir); if (!p) return;
    if (!confirm(`Excluir o perfil "${p.nome}"?`)) return;
    t.disabled = true;
    try { await excluirPerfil(p.id); }
    catch (err) { alert(err.message); }
    return pintarUsuarios();
  }
});

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

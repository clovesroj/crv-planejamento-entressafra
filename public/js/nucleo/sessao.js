/**
 * Usuário autenticado da sessão atual — em memória, não persiste.
 *
 * Deliberadamente fora de estado()/aplicar() em io/persistencia.js: sessão
 * não é dado do plano, não entra no documento salvo no servidor.
 */
let USUARIO = null; // {id, login, nome, papel, permissoes:{admin,tudo,editaveis,areas}} | null

export { USUARIO };
export const setUSUARIO = v => { USUARIO = v; };
export const ehAdmin = () => !!USUARIO && USUARIO.papel === 'admin';

/* O perfil pode EDITAR a aba `area`? (ver todas as abas, todo mundo vê.)
   A resposta daqui só trava a interface; quem garante é o servidor
   (server/permissoes.js), que descarta o que o perfil não pode gravar.
   Sem `permissoes` no usuário — servidor anterior aos perfis — não trava nada,
   para não trancar ninguém numa troca de versão. */
export const podeEditar = area => {
  if (!USUARIO) return false;
  if (USUARIO.papel === 'admin') return true;
  const p = USUARIO.permissoes;
  if (!p) return true;
  return p.tudo || (p.editaveis || []).includes(area);
};

/* Catálogo de áreas vindo do servidor: [{id, nome, grupo, chaves, campos}]. */
export const areasDePermissao = () => (USUARIO && USUARIO.permissoes && USUARIO.permissoes.areas) || [];

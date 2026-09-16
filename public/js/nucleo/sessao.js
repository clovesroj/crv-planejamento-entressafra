/**
 * Usuário autenticado da sessão atual — em memória, não persiste.
 *
 * Deliberadamente fora de estado()/aplicar() em io/persistencia.js: sessão
 * não é dado do plano, não entra no documento salvo no servidor.
 */
let USUARIO = null; // {id, login, nome, papel, ...} | null

export { USUARIO };
export const setUSUARIO = v => { USUARIO = v; };
export const ehAdmin = () => !!USUARIO && USUARIO.papel === 'admin';

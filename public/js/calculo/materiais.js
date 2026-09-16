import { matLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== MATERIAIS DE MANUTENÇÃO ================== */
function materiais(){
  const linhas = matLista().map(m=>({...m, total: num(m.preco)*num(m.qtd)}));
  return {linhas, total: linhas.reduce((s,l)=>s+l.total,0)};
}


export { materiais };

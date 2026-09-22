import { NM } from '../nucleo/calendario.js';
import { matLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== MATERIAIS DE MANUTENÇÃO ==================
   Cada material pode ter o mês em que o recurso financeiro é alocado (`mes`,
   índice da janela do orçamento). Com mês marcado, o valor cai inteiro naquele
   mês; sem mês, entra em `distribuido` e o motor (calculo/index.js) o espalha
   pelos meses conforme a área operada, como era antes. */
const mesDe = m => (m.mes===""||m.mes==null) ? null : (+m.mes>=0 && +m.mes<NM ? +m.mes : null);

function materiais(){
  const linhas = matLista().map(m=>({...m, mes: mesDe(m), total: num(m.preco)*num(m.qtd)}));
  const mesFixo = Array(NM).fill(0);
  let distribuido = 0;
  linhas.forEach(l=>{ if(l.mes!=null) mesFixo[l.mes] += l.total; else distribuido += l.total; });
  return {linhas, total: linhas.reduce((s,l)=>s+l.total,0), mesFixo, distribuido};
}


export { materiais };

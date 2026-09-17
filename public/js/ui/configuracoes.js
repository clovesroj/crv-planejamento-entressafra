import { insumosPorFamilia, todasFamilias } from '../calculo/insumos.js';
import { FAMILIAS_INSUMO } from '../dados/insumos.js';
import { $, esc } from '../nucleo/formato.js';
import { th } from './componentes.js';

/* ---------- CONFIGURAÇÕES · Grupos de Insumos ----------
   Os grupos fixos do cadastro (FAMILIAS_INSUMO) não saem daqui — só os
   criados pelo usuário podem ser removidos, e só quando nenhum insumo estiver
   usando o grupo. Mesma permissão da aba Insumos (ver ui/permissoes.js). */
function pintarConfig(){
  const porGrupo = {};
  insumosPorFamilia().forEach(f => { porGrupo[f.id] = f.itens.length; });

  const linhas = todasFamilias().map(f=>{
    const fixo = FAMILIAS_INSUMO.some(x=>x.id===f.id);
    const qtd = porGrupo[f.id] || 0;
    return `<tr>
      <td>${esc(f.nome)}</td>
      <td class="calc">${fixo ? "Fixo do cadastro" : "Criado por você"}</td>
      <td class="num calc">${qtd}</td>
      <td>${fixo ? '<span class="calc">—</span>' : `
        <button class="btn" data-grpren="${esc(f.id)}">Renomear</button>
        <button class="btn d" data-grprm="${esc(f.id)}"${qtd?" disabled title=\"grupo em uso — mude o grupo dos produtos antes\"":""}>Remover</button>`}</td>
    </tr>`;
  }).join("");

  $("#t_grupos").innerHTML = th([["Grupo"],["Origem"],["Produtos",1],[""]])+
    "<tbody>"+linhas+"</tbody>";
}

export { pintarConfig };

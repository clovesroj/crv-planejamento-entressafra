import { CFG } from '../dados/cfg.js';
import { atividadesLista } from '../nucleo/estado.js';
import { $, esc } from '../nucleo/formato.js';
import { th } from './componentes.js';

const ETAPAS = ["PREPARO DE SOLO", "PLANTIO", "TRATOS CULTURAIS", "COLHEITA", "APOIO E CONSERVAÇÃO"];
const UNIDADES = ["ha/mês", "ton/mês"];

/* ---------- CADASTRO DE ATIVIDADES ----------
   Espelha o Cadastro de Insumos: lista as atividades do cadastro do sistema
   (fixas, só leitura no código/etapa/unidade) mais as que o usuário criou
   aqui (tudo editável, inclusive remover). O Dimensionamento ajusta
   rendimento/utilização por safra sem tocar este valor base — os dois não
   se sobrepõem, um é o padrão, o outro o ajuste do período. */
function pintarAtividadesCad(){
  const lista = atividadesLista();
  const fixos = new Set(CFG.atividades.map(a => a.cod));

  const linhas = lista.map((a, i) => {
    const fixo = fixos.has(a.cod);
    return `<tr>
      <td>${esc(a.cod)}</td>
      <td>${fixo ? esc(a.etapa) : `<select data-at="${i}" data-f="etapa">${ETAPAS.map(e =>
        `<option value="${esc(e)}"${a.etapa===e?" selected":""}>${esc(e)}</option>`).join("")}</select>`}</td>
      <td><input data-at="${i}" data-f="nome" value="${esc(a.nome)}" style="text-align:left;min-width:200px"${fixo?' title="Atividade do cadastro do sistema — nome pode ser ajustado"':""}></td>
      <td>${fixo ? esc(a.un) : `<select data-at="${i}" data-f="un">${UNIDADES.map(u =>
        `<option value="${esc(u)}"${a.un===u?" selected":""}>${esc(u)}</option>`).join("")}</select>`}</td>
      <td class="num"><input data-at="${i}" data-f="rend" value="${a.rend}" inputmode="decimal" style="width:70px"></td>
      <td><input data-at="${i}" data-f="maq" value="${esc(a.maq||"")}" style="text-align:left;min-width:150px"></td>
      <td><input data-at="${i}" data-f="imp" value="${esc(a.imp||"")}" style="text-align:left;min-width:150px"></td>
      <td class="num"><input data-at="${i}" data-f="ops" value="${a.ops??1}" inputmode="decimal" style="width:55px"></td>
      <td class="num"><input data-at="${i}" data-f="turnos" value="${a.turnos??1}" inputmode="decimal" style="width:55px"></td>
      <td class="num"><input data-atu="${i}" value="${Math.round((a.util??0.8)*100)}" inputmode="decimal" style="width:55px" title="Utilização em %"></td>
      <td class="calc">${fixo ? "Cadastro do sistema" : "Criado por você"}</td>
      <td>${fixo ? "" : `<button class="btn d" data-atrm="${esc(a.cod)}">Remover</button>`}</td></tr>`;
  }).join("");

  $("#t_ativ").innerHTML = th([["Código"],["Etapa"],["Nome"],["Unidade"],["Rendimento",1],
    ["Máquina"],["Implemento"],["Operadores",1],["Turnos",1],["Utilização %",1],["Origem"],[""]]) +
    "<tbody>" + linhas + "</tbody>";
}

export { pintarAtividadesCad };

import { CFG } from '../dados/cfg.js';
import { erpDe } from '../dados/atividades-erp.js';
import { atividadesLista } from '../nucleo/estado.js';
import { mapaCodigos } from '../nucleo/codigo-atividade.js';
import { $, esc } from '../nucleo/formato.js';
import { definirPatchItens, marcarRascunhoPendente } from '../io/persistencia.js';
import { ordenarPorEtapa, th } from './componentes.js';

/* Editar uma linha não grava mais sozinho — só quando a pessoa clica "Salvar
   alterações", no mesmo espírito do botão do Critério por Mês. E não manda
   mais a lista inteira: guarda só QUAIS atividades (pelo código, que aqui
   nunca muda) foram tocadas nesta leva, e no Salvar monta um patch com elas
   -- o servidor mescla item a item contra o que está gravado agora, então
   duas pessoas criando/editando atividades diferentes ao mesmo tempo não se
   apagam (ver server/mesclaItens.js). */
let SUJO = false;
const TOCADOS = new Map();   // cod -> referência viva do item
const NOVOS = [];            // itens criados nesta leva (ainda não existem no servidor)
const REMOVIDOS = new Set(); // cods removidos nesta leva

function marcarAtivSujo(item){
  if(item && !NOVOS.includes(item) && !TOCADOS.has(item.cod)) TOCADOS.set(item.cod, item);
  SUJO = true;
  marcarRascunhoPendente();
}
function marcarAtivNovo(item){ NOVOS.push(item); SUJO = true; marcarRascunhoPendente(); }
function marcarAtivRemovido(cod){
  const ixNovo = NOVOS.findIndex(x=>x.cod===cod);
  if(ixNovo>=0) NOVOS.splice(ixNovo,1);
  else { TOCADOS.delete(cod); REMOVIDOS.add(cod); }
  SUJO = true;
  marcarRascunhoPendente();
}
/** Monta e registra o patch pendente; diz se havia algo pra salvar (chamador decide gravar). */
function salvarAtiv(){
  if(!SUJO) return false;
  const upsert = [...TOCADOS.entries()].map(([chave,item])=>({chave, item:{...item}}))
    .concat(NOVOS.map(item=>({chave:null, item:{...item}})));
  definirPatchItens("ATVX_PATCH", {upsert, remover:[...REMOVIDOS]});
  TOCADOS.clear(); NOVOS.length = 0; REMOVIDOS.clear();
  SUJO = false;
  return true;
}

const ETAPAS = ["PREPARO DE SOLO", "PLANTIO", "TRATOS CULTURAIS", "COLHEITA", "APOIO E CONSERVAÇÃO"];
/* A unidade que o cadastro mostra é a do RENDIMENTO, que é por hora: 45 t/h,
   0,7 ha/h. O dado guardado na atividade continua sendo a unidade do volume
   lançado por mês no Plano Operacional ("ha/mês", "ton/mês") — lá, ao lado dos
   meses, é a unidade certa. O sistema só lê a parte da frente ("ha" ou
   "ton"), então trocar o rótulo aqui não muda conta nem documento salvo. */
/* "ha" e "ton" são as únicas que entram nos totais de base física do plano
   (ha operados / toneladas — ver ehHa/ehTon em calculo/atividade.js); as
   demais são só para custear a atividade por conta própria, sem entrar nessa
   soma. Escolha do usuário, ao cadastrar — não muda nada do que já existe. */
const UNIDADES = [["ha/mês", "ha/h"], ["ton/mês", "ton/h"], ["viagem/mês", "viagem/h"],
  ["hora/mês", "h/h"], ["litro/mês", "litro/h"], ["m³/mês", "m³/h"], ["unidade/mês", "un/h"]];
const unRend = un => String(un||"").split("/")[0] + "/h";

/* ---------- CADASTRO DE ATIVIDADES ----------
   Espelha o Cadastro de Insumos: lista as atividades do cadastro do sistema
   (fixas, só leitura no código/etapa/unidade) mais as que o usuário criou
   aqui (tudo editável, inclusive remover). O Dimensionamento ajusta
   rendimento/utilização por safra sem tocar este valor base — os dois não
   se sobrepõem, um é o padrão, o outro o ajuste do período. */
function pintarAtividadesCad(){
  const acoes = $("#ativ_acoes");
  if(acoes) acoes.innerHTML = `<div class="rasc-acoes">
    <span class="rasc-pend${SUJO?" tem":""}">${SUJO?"há alterações não salvas":"tudo salvo"}</span>
    <button class="btn p" id="ativ_salvar" ${SUJO?"":"disabled"}>Salvar alterações</button>
  </div>`;

  const lista = atividadesLista();
  const fixos = new Set(CFG.atividades.map(a => a.cod));
  // codigo de exibicao (PS03...), so texto — o codigo interno (A03...) segue
  // sendo a chave de tudo (ver nucleo/codigo-atividade.js). Mostrar os dois
  // aqui e o de-para: onde a atividade e identificada primeiro no sistema.
  const M = mapaCodigos();

  /* Sai na ordem da etapa, como o Plano e o Dimensionamento. Cada linha carrega
     o indice ORIGINAL da lista em data-at -- ordenar a tela e escrever pela
     posicao exibida editaria uma atividade e gravaria em outra, a mesma
     armadilha ja conhecida do Cadastro de Insumos. */
  const linhas = ordenarPorEtapa(lista.map((a, i) => ({a, i})), x => x.a.etapa).map(({a, i}) => {
    const fixo = fixos.has(a.cod);
    return `<tr${a.ativo===false?' class="inativo"':''}>
      <td>${esc(M[a.cod]||a.cod)}<br><span class="calc" style="font-size:10.5px" title="Código interno — usado no documento salvo, não muda">${esc(a.cod)}</span></td>
      <td>${fixo ? esc(a.etapa) : `<select data-at="${i}" data-f="etapa">${ETAPAS.map(e =>
        `<option value="${esc(e)}"${a.etapa===e?" selected":""}>${esc(e)}</option>`).join("")}</select>`}</td>
      <td><input data-at="${i}" data-f="nome" value="${esc(a.nome)}" style="text-align:left;min-width:200px"${fixo?' title="Atividade do cadastro do sistema — nome pode ser ajustado"':""}></td>
      <td>${fixo ? esc(unRend(a.un)) : `<select data-at="${i}" data-f="un">${UNIDADES.map(([v,rot]) =>
        `<option value="${esc(v)}"${a.un===v?" selected":""}>${esc(rot)}</option>`).join("")}</select>`}</td>
      <td class="num"><input data-at="${i}" data-f="rend" value="${a.rend}" inputmode="decimal" style="width:70px"
          title="Rendimento em ${esc(unRend(a.un))}${a.tipo==="transp"?" — no transporte, calculado pelas viagens":""}"></td>
      <td><input data-at="${i}" data-f="maq" value="${esc(a.maq||"")}" style="text-align:left;min-width:150px"></td>
      <td><input data-at="${i}" data-f="imp" value="${esc(a.imp||"")}" style="text-align:left;min-width:150px"></td>
      <td class="num"><input data-at="${i}" data-f="ops" value="${a.ops??1}" inputmode="decimal" style="width:55px"></td>
      <td class="num"><input data-at="${i}" data-f="turnos" value="${a.turnos??1}" inputmode="decimal" style="width:55px"></td>
      <td class="num"><input data-atu="${i}" value="${Math.round((a.util??0.8)*100)}" inputmode="decimal" style="width:55px" title="Utilização em %"></td>
      <td class="num"><input type="checkbox" data-atativo="${i}" ${a.ativo===false?"":"checked"}
          title="Atividade inativa some das buscas de vínculo novo (ex.: 'atividade que usa este tratamento'), mas continua valendo normalmente onde já está lançada"></td>
      <td class="calc">${(()=>{ const E=erpDe(a.cod), todos=E.nucleo.concat(E.apoio);
        return todos.length
          ? `<span title="${esc(todos.map(e=>e.cod+" — "+e.nome).join(" · "))}">${esc(E.nucleo.map(e=>e.cod).join(", ")||"—")}${
              E.apoio.length?` <span class="badge b-warn">+${E.apoio.length} apoio</span>`:""}</span>`
          : "—"; })()}</td>
      <td class="calc">${fixo ? "Cadastro do sistema" : "Criado por você"}${a.junto
        ? `<br><span class="badge b-ok" title="Vai na mesma passada da ${esc(M[a.junto]||a.junto)}: a área, a máquina e a equipe são dela, e aqui só entra o tratamento">junto da ${esc(M[a.junto]||a.junto)}</span>` : ""}</td>
      <td>${fixo ? "" : `<button class="btn d" data-atrm="${esc(a.cod)}">Remover</button>`}</td></tr>`;
  }).join("");

  $("#t_ativ").innerHTML = th([["Código"],["Etapa"],["Nome"],["Unidade"],["Rendimento (por hora)",1],
    ["Máquina"],["Implemento"],["Operadores",1],["Turnos",1],["Utilização %",1],["Ativo",1],
    ["Atividade no ERP"],["Origem"],[""]]) +
    "<tbody>" + linhas + "</tbody>";
}

export { pintarAtividadesCad, marcarAtivSujo, marcarAtivNovo, marcarAtivRemovido, salvarAtiv };

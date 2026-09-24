import { $, esc, fmt } from '../nucleo/formato.js';
import { barrasH, kpi, th } from './componentes.js';
import { marcarRascunhoPendente, definirPatchItens } from '../io/persistencia.js';
import { CTT_NOVOS, CTT_SAIDAS, CTT_MUDANCAS } from '../nucleo/estado.js';
import { QUADRO_CTT_CATEGORIAS_CNH, QUADRO_CTT_CIDADES, QUADRO_CTT_COLABORADORES, QUADRO_CTT_FUNCOES,
  QUADRO_CTT_GERENCIAS, QUADRO_CTT_HISTORICO, QUADRO_CTT_META, QUADRO_CTT_MOVIMENTACAO } from '../dados/quadro-ctt.js';

/* ---------- QUADRO CTT ----------
   Corte, Transbordo e Transporte: cadastro de referência dos colaboradores
   ativos do time, extraído do ERP (ver dados/quadro-ctt.js — planilha "QUADRO
   CTT - FUNCIONARIOS ATIVOS", atualizada à mão a cada nova base, sem carga
   automática por ora).

   A planilha em si (QUADRO_CTT_COLABORADORES) nunca é gravada -- ela é
   substituída inteira na próxima extração. O que ESTE app grava é só o ajuste
   por cima dela: incluir gente que ainda não está na planilha, marcar quem
   saiu e registrar mudança de função/cidade/gerência/CNH -- três chaves
   próprias (CTT_NOVOS, CTT_SAIDAS, CTT_MUDANCAS, ver nucleo/estado.js e
   server/permissoes.js), mescladas por matrícula contra o que já está
   gravado (server/mesclaItens.js) -- o mesmo mecanismo do Cadastro de
   Atividades e de Insumos, pelo mesmo motivo: duas pessoas mexendo em gente
   diferente do quadro ao mesmo tempo não se apagam.

   Nada grava sozinho: "Adicionar", "Marcar saída" e "Confirmar" só enchem um
   rascunho local (NOVOS_SESSAO/SAIDAS_SESSAO/MUDANCAS_SESSAO); só o clique em
   "Salvar alterações" (salvarCtt()) vira patch de verdade. */
let CTT_SUJO = false;
const NOVOS_SESSAO = [];           // pessoas incluídas nesta leva: {m,n,f,ci,g,c}
const SAIDAS_SESSAO = new Map();   // matrícula(string) -> {data}
const MUDANCAS_SESSAO = new Map(); // matrícula(string) -> {f,ci,g,c,data}
let EDITANDO = null;               // matrícula com a linha de edição aberta (visão, não grava)
let ULTIMA_PINTURA = null;         // assinatura da última vez que a tabela foi montada (ver precisaRepintar)

const hojeISO = () => new Date().toISOString().slice(0,10);
function marcarCttSujo(){ CTT_SUJO = true; marcarRascunhoPendente(); }

function marcarCttNovo(pessoa){ NOVOS_SESSAO.push(pessoa); marcarCttSujo(); }
function marcarCttSaida(matricula){ SAIDAS_SESSAO.set(String(matricula), {data:hojeISO()}); EDITANDO=null; marcarCttSujo(); }
function marcarCttMudanca(matricula, campos){
  MUDANCAS_SESSAO.set(String(matricula), {...campos, data:hojeISO()});
  EDITANDO = null;
  marcarCttSujo();
}
/** Monta e registra os patches pendentes; diz se havia algo pra salvar (chamador decide gravar). */
function salvarCtt(){
  if(!CTT_SUJO) return false;
  if(NOVOS_SESSAO.length)
    definirPatchItens("CTT_NOVOS_PATCH", {upsert: NOVOS_SESSAO.map(p=>({chave:String(p.m), item:p})), remover:[]});
  if(SAIDAS_SESSAO.size)
    definirPatchItens("CTT_SAIDAS_PATCH", {upsert: Object.fromEntries(SAIDAS_SESSAO), remover:[]});
  if(MUDANCAS_SESSAO.size)
    definirPatchItens("CTT_MUDANCAS_PATCH", {upsert: Object.fromEntries(MUDANCAS_SESSAO), remover:[]});
  NOVOS_SESSAO.length = 0; SAIDAS_SESSAO.clear(); MUDANCAS_SESSAO.clear();
  CTT_SUJO = false;
  return true;
}
function abrirEdicaoCtt(matricula){ EDITANDO = EDITANDO===String(matricula) ? null : String(matricula); }

const fmtData = iso => {
  const [a,m,d] = String(iso).split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
};
const normaliza = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");

// planilha do ERP + incluídos (já salvos e desta leva), com mudança de
// cadastro (já salva ou desta leva) sobreposta por cima -- essa é a "verdade"
// que a tela mostra; quem saiu (saidas) é filtrado depois, não daqui
function listaCompleta(){
  const mudancas = { ...(CTT_MUDANCAS||{}) };
  MUDANCAS_SESSAO.forEach((v,k)=>{ mudancas[k]=v; });
  const saidas = { ...(CTT_SAIDAS||{}) };
  SAIDAS_SESSAO.forEach((v,k)=>{ saidas[k]=v; });
  const todos = [...QUADRO_CTT_COLABORADORES, ...(CTT_NOVOS||[]), ...NOVOS_SESSAO].map(r=>{
    const mud = mudancas[String(r.m)];
    return mud ? {...r, f:mud.f??r.f, ci:mud.ci??r.ci, g:mud.g??r.g, c:mud.c??r.c} : r;
  });
  return {todos, saidas, mudancas};
}
function contarPor(rows, campo, lista){
  const c = new Map();
  rows.forEach(r=>{
    const rotulo = r[campo]>=0 ? lista[r[campo]].l : "Sem registro";
    c.set(rotulo, (c.get(rotulo)||0)+1);
  });
  return [...c.entries()].sort((a,b)=>b[1]-a[1]);
}
function linhaVariacao(){
  if(QUADRO_CTT_HISTORICO.length<2) return "";
  const atual = QUADRO_CTT_HISTORICO[QUADRO_CTT_HISTORICO.length-1];
  const anterior = QUADRO_CTT_HISTORICO[QUADRO_CTT_HISTORICO.length-2];
  const delta = atual.total - anterior.total;
  const texto = delta===0 ? "sem variação" : `${delta>0?"+":"−"}${fmt(Math.abs(delta))}`;
  return ` · ${texto} desde ${fmtData(anterior.d)}`;
}
// entraram/saíram/mudaram: a base da planilha (diff entre extrações do ERP)
// somada ao que foi registrado na mão aqui dentro -- os dois lados contam
// pra mesma pergunta ("o que mudou nesta gente desde a última vez")
function blocoMovimentacao(todosComSaida){
  const porM = new Map(todosComSaida.map(r=>[String(r.m), r]));
  const rotuloDe = r => ({n:r?r.n:"Matrícula sem cadastro", f:r&&r.f>=0?QUADRO_CTT_FUNCOES[r.f].l:"", g:r&&r.g>=0?QUADRO_CTT_GERENCIAS[r.g].l:""});
  const mv = QUADRO_CTT_MOVIMENTACAO || {prev:null, entered:[], left:[], moved:[]};
  const saidasManuais = [...SAIDAS_SESSAO.keys(), ...Object.keys(CTT_SAIDAS||{})]
    .filter((m,i,arr)=>arr.indexOf(m)===i).map(m=>rotuloDe(porM.get(m)));
  const mudancasManuais = [...MUDANCAS_SESSAO.keys(), ...Object.keys(CTT_MUDANCAS||{})]
    .filter((m,i,arr)=>arr.indexOf(m)===i).map(m=>rotuloDe(porM.get(m)));
  const entrados = [...mv.entered, ...NOVOS_SESSAO.map(p=>({n:p.n, f:p.f>=0?QUADRO_CTT_FUNCOES[p.f].l:"", g:p.g>=0?QUADRO_CTT_GERENCIAS[p.g].l:""})),
    ...(CTT_NOVOS||[]).map(p=>({n:p.n, f:p.f>=0?QUADRO_CTT_FUNCOES[p.f].l:"", g:p.g>=0?QUADRO_CTT_GERENCIAS[p.g].l:""}))];
  const bloco = (titulo, lista, cor) => `<div class="panel">
    <div style="display:flex;align-items:baseline;gap:8px">
      <span style="font-family:var(--f-display);font-size:26px;font-weight:600;color:var(${cor})">${fmt(lista.length)}</span>
      <span class="hint" style="margin:0;font-size:12.5px">${esc(titulo)}</span>
    </div>
    ${lista.length
      ? `<ul class="ctt-mov-lista">${lista.slice(0,20).map(x=>
          `<li><b>${esc(x.n)}</b><span class="calc">${esc(x.f||"")}${x.g?" — "+esc(x.g):""}</span></li>`).join("")}</ul>`
      : `<p class="hint">Ninguém nesta atualização.</p>`}
  </div>`;
  return `<h3 style="margin:20px 0 10px">Movimentação${mv.prev?` desde ${esc(fmtData(mv.prev))}`:""}</h3>
    <div class="grid g2">
      ${bloco("entraram", entrados, "--ok")}
      ${bloco("saíram", saidasManuais, "--bad")}
      ${bloco("mudaram de cadastro", mudancasManuais, "--warn")}
    </div>`;
}
function opcoesFiltro(lista, rotuloTodos, selecionado){
  return `<option value="">${esc(rotuloTodos)}</option>` +
    lista.map((item,i)=>`<option value="${i}"${String(i)===String(selecionado)?" selected":""}>${esc(typeof item==="string" ? item : item.l)}</option>`).join("");
}
function linhaTabela(r){
  const emEdicao = EDITANDO===String(r.m);
  const funcao = r.f>=0 ? QUADRO_CTT_FUNCOES[r.f].l : "—";
  const cidade = r.ci>=0 ? QUADRO_CTT_CIDADES[r.ci].l : "—";
  const gerencia = r.g>=0 ? QUADRO_CTT_GERENCIAS[r.g].l : "—";
  const cnh = r.c>=0 ? QUADRO_CTT_CATEGORIAS_CNH[r.c] : null;
  return `<tr><td class="num calc">${r.m}</td><td>${esc(r.n)}</td><td>${esc(funcao)}</td>
    <td>${cnh ? esc(cnh) : '<span class="calc">sem CNH</span>'}</td>
    <td>${esc(cidade)}</td><td>${esc(gerencia)}</td>
    <td><button type="button" class="btn xs" data-cttedit="${r.m}">${emEdicao?"Cancelar":"Editar"}</button>
      <button type="button" class="btn xs d" data-cttrm="${r.m}">Marcar saída</button></td></tr>` +
    (emEdicao ? `<tr class="sub"><td></td><td colspan="6">
      <div class="row" style="align-items:flex-end">
        <div style="min-width:200px"><label>Função</label><select data-cttf-func="${r.m}">${opcoesFiltro(QUADRO_CTT_FUNCOES,"— sem função —",r.f)}</select></div>
        <div style="min-width:150px"><label>Cidade</label><select data-cttf-cid="${r.m}">${opcoesFiltro(QUADRO_CTT_CIDADES,"— sem cidade —",r.ci)}</select></div>
        <div style="min-width:210px"><label>Gerência</label><select data-cttf-ger="${r.m}">${opcoesFiltro(QUADRO_CTT_GERENCIAS,"— sem gerência —",r.g)}</select></div>
        <div style="min-width:110px"><label>CNH</label><select data-cttf-cnh="${r.m}">${opcoesFiltro(QUADRO_CTT_CATEGORIAS_CNH,"— sem CNH —",r.c)}</select></div>
        <button type="button" class="btn p" data-cttconfirma="${r.m}">Confirmar mudança</button>
      </div></td></tr>` : "");
}

function estadoFiltros(){
  return {
    termo: normaliza($("#ctt_busca").value),
    f: $("#ctt_f_func").value, ci: $("#ctt_f_cid").value,
    g: $("#ctt_f_ger").value, c: $("#ctt_f_cnh").value,
  };
}
function bateFiltro(r, tr, fl){
  if(fl.f!=="" && String(r.f)!==fl.f) return false;
  if(fl.ci!=="" && String(r.ci)!==fl.ci) return false;
  if(fl.g!=="" && String(r.g)!==fl.g) return false;
  if(fl.c!=="" && String(r.c)!==fl.c) return false;
  if(fl.termo && !normaliza(tr.textContent).includes(fl.termo)) return false;
  return true;
}
function atualizarResumo(rows){
  const porFuncao = contarPor(rows, "f", QUADRO_CTT_FUNCOES);
  const porCidade = contarPor(rows, "ci", QUADRO_CTT_CIDADES);
  const porGerencia = contarPor(rows, "g", QUADRO_CTT_GERENCIAS);

  $("#k_ctt").innerHTML = kpi("No filtro","",fmt(rows.length)) +
    porFuncao.slice(0,4).map(([label,n])=>kpi(esc(label),"",fmt(n))).join("");
  $("#ctt_count").textContent = `${fmt(rows.length)} registros`;

  const elCid = $("#ctt_graf_cidade");
  if(elCid) barrasH(elCid, porCidade.length ? porCidade.map(([l,v])=>({l,v})) : [{l:"Nada no filtro",v:0}], "pessoas");
  const elGer = $("#ctt_graf_gerencia");
  if(elGer) barrasH(elGer, porGerencia.length ? porGerencia.map(([l,v])=>({l,v})) : [{l:"Nada no filtro",v:0}], "pessoas");
}
// os <tr> que a tabela tem AGORA correspondem 1:1 (na ordem) aos ativos()
// calculados aqui -- so' funciona porque so' se chama logo depois de montar
// a tabela de novo (ver pintarQuadroCTT); nao usar fora desse fluxo.
function aplicarFiltros(ativos){
  const fl = estadoFiltros();
  const visiveis = [];
  [...document.querySelectorAll("#t_ctt > tbody > tr:not(.sub)")].forEach((tr,i)=>{
    const bate = bateFiltro(ativos[i], tr, fl);
    tr.hidden = !bate;
    const sub = tr.nextElementSibling;
    if(sub && sub.classList.contains("sub")) sub.hidden = !bate;
    if(bate) visiveis.push(ativos[i]);
  });
  atualizarResumo(visiveis);
}

function precisaRepintar(){
  const assinatura = {novos:CTT_NOVOS, saidas:CTT_SAIDAS, mudancas:CTT_MUDANCAS, editando:EDITANDO,
    revNovos:NOVOS_SESSAO.length, revSaidas:SAIDAS_SESSAO.size, revMudancas:MUDANCAS_SESSAO.size};
  const igual = ULTIMA_PINTURA && Object.keys(assinatura).every(k=>assinatura[k]===ULTIMA_PINTURA[k]);
  ULTIMA_PINTURA = assinatura;
  return !igual;
}

let ESQUELETO_PRONTO = false;
function montarEsqueleto(){
  $("#ctt_f_func").innerHTML = opcoesFiltro(QUADRO_CTT_FUNCOES, "Todas as funções");
  $("#ctt_f_cid").innerHTML = opcoesFiltro(QUADRO_CTT_CIDADES, "Todas as cidades");
  $("#ctt_f_ger").innerHTML = opcoesFiltro(QUADRO_CTT_GERENCIAS, "Todas as gerências");
  $("#ctt_f_cnh").innerHTML = opcoesFiltro(QUADRO_CTT_CATEGORIAS_CNH, "Todas as categorias");
  $("#ctt_add_func").innerHTML = opcoesFiltro(QUADRO_CTT_FUNCOES, "— sem função —");
  $("#ctt_add_cid").innerHTML = opcoesFiltro(QUADRO_CTT_CIDADES, "— sem cidade —");
  $("#ctt_add_ger").innerHTML = opcoesFiltro(QUADRO_CTT_GERENCIAS, "— sem gerência —");
  $("#ctt_add_cnh").innerHTML = opcoesFiltro(QUADRO_CTT_CATEGORIAS_CNH, "— sem CNH —");
  // filtro (função/cidade/gerência/CNH/busca) é visão local, não dado -- refiltra
  // na hora, sem passar pelo render() geral do app
  ["#ctt_f_func","#ctt_f_cid","#ctt_f_ger","#ctt_f_cnh"].forEach(sel=>$(sel).addEventListener("change", refiltrar));
  $("#ctt_busca").addEventListener("input", refiltrar);
  $("#ctt_limpar").addEventListener("click", ()=>{
    $("#ctt_busca").value = "";
    ["#ctt_f_func","#ctt_f_cid","#ctt_f_ger","#ctt_f_cnh"].forEach(sel=>$(sel).value="");
    refiltrar();
  });
}
function refiltrar(){
  const {todos, saidas} = listaCompleta();
  aplicarFiltros(todos.filter(r=>!saidas[String(r.m)]));
}

function pintarQuadroCTT(){
  const el = $("#quadro-ctt");
  if(!el) return;
  if(!ESQUELETO_PRONTO){ montarEsqueleto(); ESQUELETO_PRONTO = true; }

  const {todos, saidas} = listaCompleta();
  const ativos = todos.filter(r=>!saidas[String(r.m)]);

  $("#ctt_sub").textContent =
    `Base de ${fmtData(QUADRO_CTT_META.base)} · ${fmt(ativos.length)} colaboradores ativos · fonte: ${QUADRO_CTT_META.file}${linhaVariacao()}`;
  $("#ctt_acoes").innerHTML = `<span class="rasc-pend${CTT_SUJO?" tem":""}">${CTT_SUJO?"há alterações não salvas":"tudo salvo"}</span>
    <button class="btn p" id="ctt_salvar" ${CTT_SUJO?"":"disabled"}>Salvar alterações</button>`;
  $("#ctt_mov").innerHTML = blocoMovimentacao(todos);

  if(precisaRepintar()){
    $("#t_ctt").innerHTML = th([["Matrícula",1],["Nome"],["Função"],["CNH"],["Cidade"],["Gerência"],[""]]) +
      "<tbody>" + ativos.map(linhaTabela).join("") + "</tbody>";
  }
  aplicarFiltros(ativos);
}

export { pintarQuadroCTT, marcarCttNovo, marcarCttSaida, marcarCttMudanca, salvarCtt, abrirEdicaoCtt };

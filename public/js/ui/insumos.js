import { composicao, etapasNoPlano, precoInsumo, tratCodigos, tratEtapas, tratListaTodos } from '../calculo/insumos.js';
import { TRAT_ETAPAS } from '../dados/insumos.js';
import { INSUMO, INS_ABERTO, P, TRATC, TRAT_NOME, TRAT_SEL, insLista } from '../nucleo/estado.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { filtrarPorNome, kpi, th } from './componentes.js';
import { setTRAT_SEL } from '../nucleo/estado.js';

/* ---------- INSUMOS ---------- */

// unidades de venda do cadastro; "—" cobre o produto antigo que não tem unidade
const UNIDADES = ["", "kg", "lt", "ton", "pc", "un"];
// ficha técnica: o que a classificação técnica traz de cada produto
const FICHA = [["cod","Código do material"],["classe","Classe agronômica"],
  ["categ","Categoria operacional"],["form","Formulação"],["modo","Modo de ação"],
  ["mec","Mecanismo de ação"],["grupo","Grupo químico"],["fab","Fabricante ou registrante"],
  ["tox","Classificação toxicológica"],["culturas","Culturas registradas"],
  ["estadio","Estádio dos alvos e momento de aplicação"],["status","Status da validação"],
  ["obs","Observação técnica"],["base","Base da classificação"]];

let BUSCA_INS = "", BUSCA_TRAT = "", BUSCA_MAT = "";
function aplicarBuscaIns(v){ BUSCA_INS = v||""; filtrarPorNome("#t_ins", BUSCA_INS); }
function aplicarBuscaTrat(v){ BUSCA_TRAT = v||""; filtrarPorNome("#t_trat", BUSCA_TRAT); }
function aplicarBuscaMat(v){ BUSCA_MAT = v||""; filtrarPorNome("#t_mat", BUSCA_MAT); }

function pintarInsumos(R){
  const TL = tratListaTodos();
  const custom = Object.keys(TRATC).length;
  const comPa = insLista().filter(i=>i.pa).length;
  $("#k_ins").innerHTML =
    kpi("Produtos cadastrados","",insLista().length, comPa+" com princípio ativo","insumos:total") +
    kpi("Tratamentos","t",TL.length, custom?custom+" com composição ajustada":"composições originais") +
    kpi("Custo de insumos no plano","g",brl(R.insumoT),"","nat:insumo") +
    kpi("Materiais de manutenção","a",brl(R.MT.total));

  // --- 1. cadastro de insumos (topo) — incluir, alterar, remover ---
  // nome comercial e princípio ativo na frente; o resto da classificação
  // técnica fica na ficha, que abre por linha
  $("#t_ins").innerHTML = th([["Nome comercial"],["Princípio ativo"],["Código"],["Un."],
    ["Concentração"],["Classe agronômica"],["Volume dem.",1],["Estoque",1],["Preço base",1],
    ["Preço corrigido",1],["Necessidade",1],["Custo de aquisição",1],["Usado em"],[""],[""]])+"<tbody>"+
    insLista().map((i,ix)=>{
      const ov=INSUMO[i.prod]||{};
      const preco = ov.preco!=null?num(ov.preco):num(i.preco);
      const est   = ov.est!=null?num(ov.est):num(i.est);
      const corr  = preco*(1+P.ipreco/100);
      const vol   = R.volDem[i.prod]||0;
      const nec   = Math.max(0,vol-est);
      const usos  = tratCodigos().filter(c=>composicao(c).some(l=>l.prod===i.prod)).length;
      const ficha = FICHA.filter(([k])=>i[k]);
      const aberta = !!INS_ABERTO[i.prod];
      return `<tr>
        <td><input data-in="${ix}" data-f="prod" value="${esc(i.prod)}" style="text-align:left;min-width:200px"></td>
        <td><input data-in="${ix}" data-f="pa" value="${esc(i.pa)}" style="text-align:left;min-width:200px" placeholder="a preencher"></td>
        <td><input data-in="${ix}" data-f="cod" value="${esc(i.cod)}" style="width:82px" placeholder="—"></td>
        <td><select data-in="${ix}" data-f="un" style="min-width:66px">${UNIDADES.map(u=>
          `<option value="${u}" ${(i.un||"")===u?"selected":""}>${u||"—"}</option>`).join("")}</select></td>
        <td><input data-in="${ix}" data-f="conc" value="${esc(i.conc)}" style="min-width:110px" placeholder="ex.: 480 g/L"></td>
        <td><input data-in="${ix}" data-f="classe" value="${esc(i.classe)}" style="text-align:left;min-width:150px" placeholder="—"></td>
        <td class="num calc">${fmt(vol,1)}</td>
        <td class="num"><input data-ie="${esc(i.prod)}" value="${est}" inputmode="decimal"></td>
        <td class="num"><input data-ip="${esc(i.prod)}" value="${preco}" inputmode="decimal"></td>
        <td class="num calc">${brl(corr,2)}</td><td class="num calc">${fmt(nec,1)}</td>
        <td class="num ${preco>0?"tot":"calc"}">${preco>0?brl(nec*corr):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num calc">${usos?usos+" trat.":"—"}</td>
        <td>${ficha.length?`<button class="btn" data-infx="${esc(i.prod)}" title="Classificação técnica do produto">${
          aberta?"Fechar":"Ficha"}</button>`:'<span class="calc">—</span>'}</td>
        <td><button class="btn d" data-inrm="${ix}">Remover</button></td></tr>`+
        (aberta && ficha.length ? `<tr class="sub"><td colspan="15">
          <div class="ficha">${ficha.map(([k,rot])=>
            `<div><b>${rot}</b><span>${esc(i[k])}</span></div>`).join("")}</div></td></tr>` : "");
    }).join("")+"</tbody>";
  filtrarPorNome("#t_ins", BUSCA_INS);

  // --- 2. composição do tratamento selecionado ---
  const codigos = tratCodigos();
  if(!TRAT_SEL || !codigos.includes(TRAT_SEL)) setTRAT_SEL(codigos[0]);
  $("#sel_trat").innerHTML = codigos.map(c=>
    `<option value="${c}" ${c===TRAT_SEL?"selected":""}>${c}${TRAT_NOME[c]?" — "+esc(TRAT_NOME[c]):""}${TRATC[c]?" (ajustado)":""}</option>`).join("");
  $("#in_trat_nome").value = TRAT_NOME[TRAT_SEL] || "";
  $("#in_trat_cod").value = TRAT_SEL || "";
  $("#sel_prod").innerHTML = insLista().map(i=>
    `<option value="${esc(i.prod)}">${esc(i.prod)}${i.pa?" — "+esc(i.pa):""}</option>`).join("");
  $("#c_etapa_sel").innerHTML = TRAT_SEL ? celulaEtapas(TRAT_SEL) : "";

  const comp = composicao(TRAT_SEL);
  const custoHa = comp.reduce((s,l)=>s+num(l.dose)*precoInsumo(l.prod),0);
  $("#c_trat").value = brl(custoHa,2) + "/ha";

  $("#t_comp").innerHTML = th([["Produto"],["Princípio ativo"],["Dose/ha",1],["Un."],
    ["Preço corrigido",1],["Custo/ha",1],["% do tratamento",1],[""]])+"<tbody>"+
    (comp.length? comp.map((l,i)=>{
      const pr = precoInsumo(l.prod), c = num(l.dose)*pr;
      const pp = custoHa>0 ? c/custoHa*100 : 0;
      const reg = insLista().find(x=>x.prod===l.prod);
      return `<tr><td>${esc(l.prod)}</td>
        <td class="calc">${esc((reg&&reg.pa)||"—")}</td>
        <td class="num"><input data-td="${i}" value="${l.dose}" inputmode="decimal"></td>
        <td class="calc">${esc(l.un||"—")}</td>
        <td class="num calc">${pr>0?brl(pr,2):'<span class="badge b-warn">sem preço</span>'}</td>
        <td class="num tot">${brl(c,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td><button class="btn d" data-tr="${i}">Remover</button></td></tr>`;}).join("")
      : `<tr><td colspan="8" class="calc">Tratamento sem produtos. Use o campo abaixo para adicionar.</td></tr>`)+
    `<tr><td class="tot" colspan="4">CUSTO/HA DO TRATAMENTO</td><td></td>
     <td class="num tot">${brl(custoHa,2)}</td><td class="num tot">${custoHa>0?"100,0%":"—"}</td><td></td></tr></tbody>`;

  // --- 3. cadastro dos tratamentos: código, nome e etapa de uso ---
  $("#t_trat").innerHTML = th([["Cod_Trat"],["Nome"],["Etapas em que é usado"],["Produtos",1],
    ["Custo/ha",1],["Composição"],["Atividades que usam"],["Custo no plano",1],[""]])+"<tbody>"+
    TL.map(t=>{
      const usos = R.L.filter(r=>r.trat===t.cod);
      const areaT = usos.reduce((s,u)=>s+u.total,0);
      return `<tr><td><input data-trc="${esc(t.cod)}" value="${esc(t.cod)}" style="min-width:110px"
                 title="Alterar o código do tratamento"></td>
        <td><input data-trn="${esc(t.cod)}" value="${esc(TRAT_NOME[t.cod]||"")}"
            style="text-align:left;min-width:180px" placeholder="Ex.: Herbicida pré-emergente"></td>
        <td style="min-width:176px">${celulaEtapas(t.cod)}</td>
        <td class="num calc">${composicao(t.cod).length}</td>
        <td class="num ${t.custo_ha>0?"tot":"calc"}">${t.custo_ha>0?brl(t.custo_ha,2):"—"}</td>
        <td>${TRATC[t.cod]?'<span class="badge b-warn">ajustado</span>':'<span class="badge b-ok">original</span>'}</td>
        <td class="calc">${usos.length?usos.map(u=>u.a.cod).join(", "):"—"}</td>
        <td class="num ${areaT?"tot":"calc"}">${areaT?brl(areaT*t.custo_ha):"—"}</td>
        <td><button class="btn d" data-trrm="${esc(t.cod)}">Remover</button></td></tr>`;}).join("")+
    "</tbody>";
  filtrarPorNome("#t_trat", BUSCA_TRAT);

  // --- 4. materiais ---
  $("#t_mat").innerHTML = th([["Categoria"],["Item"],["Un."],["Preço",1],["Qtd",1],["Total",1],[""]])+"<tbody>"+
    R.MT.linhas.map((m,i)=>`<tr>
      <td><input data-mt="${i}" data-f="cat" value="${esc(m.cat)}" style="text-align:left;min-width:130px"></td>
      <td><input data-mt="${i}" data-f="item" value="${esc(m.item)}" style="text-align:left;min-width:190px"></td>
      <td><input data-mt="${i}" data-f="un" value="${esc(m.un)}" style="text-align:left;width:60px"></td>
      <td class="num"><input data-mt="${i}" data-f="preco" value="${m.preco}" inputmode="decimal"></td>
      <td class="num"><input data-mt="${i}" data-f="qtd" value="${m.qtd}" inputmode="decimal"></td>
      <td class="num tot">${brl(m.total)}</td>
      <td><button class="btn d" data-mtrm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot" colspan="5">TOTAL</td><td class="num tot">${brl(R.MT.total)}</td><td></td></tr></tbody>`;
  filtrarPorNome("#t_mat", BUSCA_MAT);
}

/* Célula de marcação da etapa: uma caixa por etapa do plano. Sem marca, mostra
   em que etapa o Plano Operacional está usando o tratamento — o que ele diz
   hoje, sem inventar marcação em nome do usuário. */
function celulaEtapas(cod){
  const marcadas = tratEtapas(cod);
  const noPlano = etapasNoPlano(cod);
  const caixas = Object.entries(TRAT_ETAPAS).map(([k,e])=>{
    const on = marcadas.includes(k);
    return `<label class="etq${on?" on":""}" title="${e.nome}">
      <input type="checkbox" data-tre="${esc(cod)}" data-e="${k}" ${on?"checked":""}>
      <span>${e.sigla}</span></label>`;}).join("");
  const nota = marcadas.length
    ? `<div class="hint">${marcadas.map(e=>TRAT_ETAPAS[e].nome).join(" · ")}</div>`
    : (noPlano.length ? `<div class="hint">sem marcação — o plano usa em ${
         noPlano.map(e=>TRAT_ETAPAS[e].nome).join(", ")}</div>`
                      : `<div class="hint">sem marcação</div>`);
  return `<div class="etqs">${caixas}</div>${nota}`;
}

export { pintarInsumos, aplicarBuscaIns, aplicarBuscaTrat, aplicarBuscaMat };

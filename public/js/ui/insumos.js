import { composicao, precoInsumo, tratCodigos, tratLista } from '../calculo/insumos.js';
import { INSUMO, P, TRATC, TRAT_NOME, TRAT_SEL, insLista } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { setTRAT_SEL } from '../nucleo/estado.js';

/* ---------- INSUMOS ---------- */

function pintarInsumos(R){
  const TL = tratLista();
  const custom = Object.keys(TRATC).length;
  $("#k_ins").innerHTML =
    kpi("Produtos cadastrados","",insLista().length,"","insumos:total") +
    kpi("Tratamentos","t",tratCodigos().length, custom?custom+" com composição ajustada":"composições originais") +
    kpi("Custo de insumos no plano","g",brl(R.insumoT),"","nat:insumo") +
    kpi("Materiais de manutenção","a",brl(R.MT.total));

  // --- 1. cadastro de insumos (topo) — incluir, alterar, remover ---
  $("#t_ins").innerHTML = th([["Produto"],["Un."],["Princípio ativo"],["Concentração"],["Volume dem.",1],
    ["Estoque",1],["Preço base",1],["Preço corrigido",1],["Necessidade",1],["Custo de aquisição",1],
    ["Usado em"],[""]])+"<tbody>"+
    insLista().map((i,ix)=>{
      const ov=INSUMO[i.prod]||{};
      const preco = ov.preco!=null?num(ov.preco):num(i.preco);
      const est   = ov.est!=null?num(ov.est):num(i.est);
      const corr  = preco*(1+P.ipreco/100);
      const vol   = R.volDem[i.prod]||0;
      const nec   = Math.max(0,vol-est);
      const usos  = tratCodigos().filter(c=>composicao(c).some(l=>l.prod===i.prod)).length;
      return `<tr>
        <td><input data-in="${ix}" data-f="prod" value="${i.prod}" style="text-align:left;min-width:190px"></td>
        <td><select data-in="${ix}" data-f="un" style="min-width:60px">
          <option value="kg" ${i.un==="kg"?"selected":""}>kg</option>
          <option value="lt" ${i.un==="lt"?"selected":""}>lt</option></select></td>
        <td><input data-in="${ix}" data-f="pa" value="${i.pa||""}" style="text-align:left;min-width:150px" placeholder="a preencher"></td>
        <td><input data-in="${ix}" data-f="conc" value="${i.conc||""}" style="min-width:90px" placeholder="ex.: 480 g/L"></td>
        <td class="num calc">${fmt(vol,1)}</td>
        <td class="num"><input data-ie="${i.prod}" value="${est}" inputmode="decimal"></td>
        <td class="num"><input data-ip="${i.prod}" value="${preco}" inputmode="decimal"></td>
        <td class="num calc">${brl(corr,2)}</td><td class="num calc">${fmt(nec,1)}</td>
        <td class="num tot">${brl(nec*corr)}</td>
        <td class="num calc">${usos?usos+" trat.":"—"}</td>
        <td><button class="btn d" data-inrm="${ix}">Remover</button></td></tr>`;}).join("")+"</tbody>";

  // --- 2. composição do tratamento selecionado ---
  const codigos = tratCodigos();
  if(!TRAT_SEL || !codigos.includes(TRAT_SEL)) setTRAT_SEL(codigos[0]);
  $("#sel_trat").innerHTML = codigos.map(c=>
    `<option value="${c}" ${c===TRAT_SEL?"selected":""}>${c}${TRAT_NOME[c]?" — "+TRAT_NOME[c]:""}${TRATC[c]?" (ajustado)":""}</option>`).join("");
  $("#in_trat_nome").value = TRAT_NOME[TRAT_SEL] || "";
  $("#sel_prod").innerHTML = insLista().map(i=>`<option value="${i.prod}">${i.prod}</option>`).join("");

  const comp = composicao(TRAT_SEL);
  const custoHa = comp.reduce((s,l)=>s+num(l.dose)*precoInsumo(l.prod),0);
  $("#c_trat").value = brl(custoHa,2) + "/ha";

  $("#t_comp").innerHTML = th([["Produto"],["Dose/ha",1],["Un."],["Preço corrigido",1],["Custo/ha",1],["% do tratamento",1],[""]])+"<tbody>"+
    (comp.length? comp.map((l,i)=>{
      const pr = precoInsumo(l.prod), c = num(l.dose)*pr;
      const pp = custoHa>0 ? c/custoHa*100 : 0;
      return `<tr><td>${l.prod}</td>
        <td class="num"><input data-td="${i}" value="${l.dose}" inputmode="decimal"></td>
        <td class="calc">${l.un||"—"}</td>
        <td class="num calc">${brl(pr,2)}</td>
        <td class="num tot">${brl(c,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td><button class="btn d" data-tr="${i}">Remover</button></td></tr>`;}).join("")
      : `<tr><td colspan="7" class="calc">Tratamento sem produtos. Use o campo abaixo para adicionar.</td></tr>`)+
    `<tr><td class="tot">CUSTO/HA DO TRATAMENTO</td><td colspan="3"></td>
     <td class="num tot">${brl(custoHa,2)}</td><td class="num tot">100,0%</td><td></td></tr></tbody>`;

  // --- 3. resumo de todos os tratamentos ---
  $("#t_trat").innerHTML = th([["Cod_Trat"],["Nome"],["Produtos",1],["Custo/ha",1],["Composição"],["Atividades que usam"],["Custo no plano",1]])+"<tbody>"+
    TL.map(t=>{
      const usos = R.L.filter(r=>r.trat===t.cod);
      const areaT = usos.reduce((s,u)=>s+u.total,0);
      return `<tr><td><b>${t.cod}</b></td>
        <td class="calc">${TRAT_NOME[t.cod]||"—"}</td>
        <td class="num calc">${composicao(t.cod).length}</td>
        <td class="num tot">${brl(t.custo_ha,2)}</td>
        <td>${TRATC[t.cod]?'<span class="badge b-warn">ajustado</span>':'<span class="badge b-ok">original</span>'}</td>
        <td class="calc">${usos.length?usos.map(u=>u.a.cod).join(", "):"—"}</td>
        <td class="num ${areaT?"tot":"calc"}">${areaT?brl(areaT*t.custo_ha):"—"}</td></tr>`;}).join("")+"</tbody>";

  // --- 4. materiais ---
  $("#t_mat").innerHTML = th([["Categoria"],["Item"],["Un."],["Preço",1],["Qtd",1],["Total",1],[""]])+"<tbody>"+
    R.MT.linhas.map((m,i)=>`<tr>
      <td><input data-mt="${i}" data-f="cat" value="${m.cat}" style="text-align:left;min-width:130px"></td>
      <td><input data-mt="${i}" data-f="item" value="${m.item}" style="text-align:left;min-width:190px"></td>
      <td><input data-mt="${i}" data-f="un" value="${m.un}" style="text-align:left;width:60px"></td>
      <td class="num"><input data-mt="${i}" data-f="preco" value="${m.preco}" inputmode="decimal"></td>
      <td class="num"><input data-mt="${i}" data-f="qtd" value="${m.qtd}" inputmode="decimal"></td>
      <td class="num tot">${brl(m.total)}</td>
      <td><button class="btn d" data-mtrm="${i}">Remover</button></td></tr>`).join("")+
    `<tr><td class="tot" colspan="5">TOTAL</td><td class="num tot">${brl(R.MT.total)}</td><td></td></tr></tbody>`;
}


export { pintarInsumos };

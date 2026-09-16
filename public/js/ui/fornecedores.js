import { fornPar } from '../calculo/fornecedores.js';
import { FORN_MODALIDADES, FORN_ORIGENS, FORN_QUALIDADE } from '../dados/fornecedores.js';
import { MESES } from '../nucleo/calendario.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { barrasH, kpi, th } from './componentes.js';

/* ---------- FORNECEDORES DE CANA ---------- */
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const ORIG = Object.keys(FORN_ORIGENS);

function pintarForn(R){
  const F = R.FORN, O = F.origens;
  const pct = (v,t) => t>0 ? fmt(v/t*100,1)+"%" : "—";

  $("#k_forn").innerHTML =
    kpi("Custo da cana própria","g", O.propria.ton>0?brl(O.propria.rsT,2)+"/t":"—",
        fmt(O.propria.ton)+" t · custo de produção","forn:total") +
    kpi("Custo da cana de fornecedor","a", O.fornecedor.ton>0?brl(O.fornecedor.rsT,2)+"/t":"—",
        fmt(O.fornecedor.ton)+" t · aquisição","forn:total") +
    kpi("Custo médio ponderado","", F.tonTotal>0?brl(F.rsTMedio,2)+"/t":"—",
        fmt(F.tonTotal)+" t com tonelada lançada"+(F.custoSemTon>0?" · "+brl(F.custoSemTon)+" sem tonelada":""),"forn:total") +
    kpi("Custo por kg de ATR","t", F.atrTotal>0?brl(F.rsAtrMedio,4)+"/kg":"—",
        F.tonTotal>0?"ATR médio "+fmt(F.atrMedio,1)+" kg/t":"","forn:total");

  ["precoAtr","atrPropria","freteKm","areaPropria"].forEach(k=>{
    const e = $("#fnp_"+k); if(e) e.value = +fornPar(k).toFixed(4);
  });

  /* ---- cadastro de fornecedores ---- */
  const mesOpts = sel => MESES.map((m,i)=>`<option value="${i}" ${i===+sel?"selected":""}>${m}</option>`).join("");
  $("#t_forn").innerHTML = th([["Fornecedor"],["Propriedade"],["Origem"],["Modalidade de contrato"],
    ["Área (ha)",1],["TCH",1],["t contratadas",1],["t estimadas",1],["ATR (kg/t)",1],["Preço",1],["Un. do preço"],
    ["Prêmio (R$/t)",1],["Descontos (R$/t)",1],["Frete (R$/t)",1],["Logística (R$/t)",1],
    ["R$/t",1],["Custo total",1],[""]])+"<tbody>"+
    (F.linhas.length ? F.linhas.map((l,i)=>`<tr>
      <td><input data-fnr="${i}" data-f="forn" value="${esc(l.forn)}" style="text-align:left;min-width:160px"></td>
      <td><input data-fnr="${i}" data-f="prop" value="${esc(l.prop)}" style="text-align:left;min-width:150px"></td>
      <td><select data-fnr="${i}" data-f="origem">${ORIG.filter(o=>FORN_ORIGENS[o].fonte==="contrato")
        .map(o=>`<option value="${o}" ${o===l.origem?"selected":""}>${FORN_ORIGENS[o].nome}</option>`).join("")}</select></td>
      <td><select data-fnr="${i}" data-f="mod">${Object.entries(FORN_MODALIDADES)
        .map(([k,m])=>`<option value="${k}" ${k===l.mod?"selected":""}>${m.nome}</option>`).join("")}</select></td>
      <td class="num"><input data-fnr="${i}" data-f="area" value="${num(l.area)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="tch" value="${num(l.tch)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="tonContr" value="${num(l.tonContr)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="tonEst" value="${num(l.tonEst)}" inputmode="decimal"
          title="Em branco usa área × TCH"></td>
      <td class="num"><input data-fnr="${i}" data-f="atr" value="${num(l.atr)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="preco" value="${num(l.preco)}" inputmode="decimal"></td>
      <td class="calc">${(FORN_MODALIDADES[l.mod]||{un:""}).un}</td>
      <td class="num"><input data-fnr="${i}" data-f="premio" value="${num(l.premio)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="desc" value="${num(l.desc)}" inputmode="decimal"></td>
      <td class="num"><input data-fnr="${i}" data-f="frete" value="${num(l.frete)}" inputmode="decimal"
          title="Em branco usa distância × tarifa por km"></td>
      <td class="num"><input data-fnr="${i}" data-f="logist" value="${num(l.logist)}" inputmode="decimal"></td>
      <td class="num calc">${l.ton>0?brl(l.rsT,2):"—"}</td>
      <td class="num tot">${brl(l.custo)}</td>
      <td><button class="btn d" data-fnrm="${i}">Remover</button></td></tr>`).join("")
    : `<tr><td colspan="18" class="calc">Nenhum fornecedor cadastrado. Use "Adicionar fornecedor".</td></tr>`)+
    `<tr><td class="tot" colspan="4">TOTAL CONTRATADO DE TERCEIROS</td>
     <td class="num tot">${fmt(F.linhas.reduce((s,l)=>s+l.area,0))}</td><td></td>
     <td class="num tot">${fmt(F.linhas.reduce((s,l)=>s+l.tonContr,0))}</td>
     <td class="num tot">${fmt(F.aquisicao.ton)}</td><td colspan="7"></td>
     <td class="num tot">${F.aquisicao.ton>0?brl(F.aquisicao.rsT,2):"—"}</td>
     <td class="num tot">${brl(F.aquisicao.custo)}</td><td></td></tr></tbody>`;

  /* ---- entrega, qualidade, logística e histórico ---- */
  $("#t_forn_qual").innerHTML = th([["Fornecedor"],["Propriedade"],["Distância (km)",1],["Frete aplicado (R$/t)",1],
    ["Logística (R$/t)",1],["Período de entrega"],["Qualidade"],["Safra anterior (t)",1],["Variação",1],
    ["Estimado / contratado",1],["R$/kg ATR",1]])+"<tbody>"+
    (F.linhas.length ? F.linhas.map((l,i)=>`<tr>
      <td>${esc(l.forn)}</td><td class="calc">${esc(l.prop)}</td>
      <td class="num"><input data-fnr="${i}" data-f="dist" value="${num(l.dist)}" inputmode="decimal"></td>
      <td class="num calc">${brl(l.freteT,2)}${num(l.frete)>0?"":" *"}</td>
      <td class="num calc">${brl(num(l.logist),2)}</td>
      <td><select data-fnr="${i}" data-f="entIni">${mesOpts(l.entIni)}</select>
          <select data-fnr="${i}" data-f="entFim">${mesOpts(l.entFim)}</select></td>
      <td><select data-fnr="${i}" data-f="qual">${FORN_QUALIDADE
        .map(q=>`<option ${q===l.qual?"selected":""}>${q}</option>`).join("")}</select></td>
      <td class="num"><input data-fnr="${i}" data-f="tonHist" value="${num(l.tonHist)}" inputmode="decimal"></td>
      <td class="num calc">${l.varHist==null?"—":
        `<span class="badge ${l.varHist>=0?"b-ok":"b-bad"}">${l.varHist>=0?"+":""}${fmt(l.varHist*100,1)}%</span>`}</td>
      <td class="num calc">${l.aderContr>0?fmt(l.aderContr*100,1)+"%":"—"}</td>
      <td class="num calc">${l.atrTotal>0?brl(l.rsAtr,4):"—"}</td></tr>`).join("")
    : `<tr><td colspan="11" class="calc">Sem fornecedores cadastrados.</td></tr>`)+"</tbody>";

  /* ---- consolidado por origem, com a natureza contábil de cada uma ---- */
  $("#t_forn_orig").innerHTML = th([["Origem"],["Natureza contábil"],["Área (ha)",1],["Toneladas",1],["% da moagem",1],
    ["ATR médio (kg/t)",1],["Custo",1],["R$/t",1],["R$/kg ATR",1],["% do custo",1]])+"<tbody>"+
    ORIG.map(o=>{ const x=O[o];
      return `<tr><td>${x.nome}</td><td class="calc">${x.nat}</td>
        <td class="num calc">${x.area>0?fmt(x.area):"—"}</td><td class="num tot">${fmt(x.ton)}</td>
        <td class="num calc">${pct(x.ton,F.tonTotal)}</td>
        <td class="num calc">${x.atrMedio>0?fmt(x.atrMedio,1):"—"}</td>
        <td class="num">${brl(x.custo)}</td>
        <td class="num tot">${x.ton>0?brl(x.rsT,2):"—"}</td>
        <td class="num calc">${x.atrTotal>0?brl(x.rsAtr,4):"—"}</td>
        <td class="num calc">${pct(x.custo,F.custoTotal)}</td></tr>`; }).join("")+
    `<tr class="sub"><td class="calc">↳ Produção própria (própria + arrendada)</td><td class="calc">Custo agrícola do plano</td>
     <td></td><td class="num calc">${fmt(F.producao.ton)}</td><td class="num calc">${pct(F.producao.ton,F.tonTotal)}</td>
     <td></td><td class="num calc">${brl(F.producao.custo)}</td>
     <td class="num calc">${F.producao.ton>0?brl(F.producao.rsT,2):"—"}</td><td colspan="2"></td></tr>`+
    `<tr class="sub"><td class="calc">↳ Aquisição de terceiros (fornecedor + parceria)</td><td class="calc">Compra de matéria-prima</td>
     <td></td><td class="num calc">${fmt(F.aquisicao.ton)}</td><td class="num calc">${pct(F.aquisicao.ton,F.tonTotal)}</td>
     <td></td><td class="num calc">${brl(F.aquisicao.custo)}</td>
     <td class="num calc">${F.aquisicao.ton>0?brl(F.aquisicao.rsT,2):"—"}</td><td colspan="2"></td></tr>`+
    `<tr><td class="tot">TOTAL DA MOAGEM</td><td></td>
     <td class="num tot">${fmt(ORIG.reduce((s,o)=>s+O[o].area,0))}</td>
     <td class="num tot">${fmt(F.tonTotal)}</td><td class="num tot">${F.tonTotal>0?"100,0%":"—"}</td>
     <td class="num tot">${F.atrMedio>0?fmt(F.atrMedio,1):"—"}</td>
     <td class="num tot">${brl(F.custoTotal)}</td>
     <td class="num tot">${F.tonTotal>0?brl(F.rsTMedio,2):"—"}</td>
     <td class="num tot">${F.atrTotal>0?brl(F.rsAtrMedio,4):"—"}</td>
     <td class="num tot">100,0%</td></tr></tbody>`;

  /* ---- entrada de cana por mês e origem ---- */
  $("#t_forn_mes").innerHTML = th([["Origem"],...MESES.map(m=>[m,1]),["Total (t)",1]])+"<tbody>"+
    ORIG.filter(o=>O[o].ton>0.5).map(o=>{ const x=O[o];
      return `<tr><td>${x.nome}</td>`+x.mes.map(v=>`<td class="num calc">${v>0?fmt(v):"—"}</td>`).join("")+
        `<td class="num tot">${fmt(x.ton)}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td>`+F.tonMes.map(v=>`<td class="num tot">${fmt(v)}</td>`).join("")+
    `<td class="num tot">${fmt(F.tonTotal)}</td></tr></tbody>`;

  barrasH($("#ch_forn"), ORIG.filter(o=>O[o].custo>0).map(o=>({l:O[o].nome, v:O[o].custo})));

  const semTon = F.custoSemTon>0
    ? `<br>O custo agrícola de ${brl(F.custoSemTon)} ficou fora do custo médio por não ter tonelada:
       lance a colheita (A01) no Plano Operacional para a cana própria e arrendada entrarem na média.`
    : "";
  $("#forn_nota").innerHTML = semTon + (F.areaPlano>0
    ? `A produção do plano (${fmt(F.tonPlano)} t) foi dividida pela área: ${fmt(100-F.fracArr*100,1)}% própria e
       ${fmt(F.fracArr*100,1)}% arrendada. O arrendamento (${brl(R.arrT)}) fica inteiro na cana arrendada.`
    : `Informe a área própria nos parâmetros para separar a cana própria da arrendada — sem ela, toda a produção
       do plano aparece como arrendada quando há área de arrendamento cadastrada.`);
}

export { pintarForn };

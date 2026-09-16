import { admRat } from '../calculo/administrativo.js';
import { ADM_CC, ADM_CRITERIOS, ADM_GRUPOS } from '../dados/administrativo.js';
import { ETAPAS_ORD } from '../calculo/arrendamento.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { barrasH, kpi, th } from './componentes.js';
import { P } from '../nucleo/estado.js';

/* ---------- CUSTOS ADMINISTRATIVOS ---------- */
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");

function pintarAdm(R){
  const A = R.ADM, AD = R.AD, ha = P.plantio||1;

  $("#k_adm").innerHTML =
    kpi("Custo administrativo","",brl(A.total), A.linhas.filter(l=>l.mensal>0).length+" linhas lançadas") +
    kpi("Por mês","t",brl(A.mensal),"conta EST-01") +
    kpi("Por hectare plantado","g",brl(A.total/ha,2)+"/ha", fmt(ha)+" ha de plantio") +
    kpi("Peso no custo total","a",R.total>0?fmt(A.total/R.total*100,1)+"%":"—",
        AD.semRateio>0 ? brl(AD.semRateio)+" sem rateio" : "tudo rateado nas etapas");

  /* ---- cadastro das linhas ---- */
  const grupoOpts = sel => Object.entries(ADM_GRUPOS)
    .map(([k,n])=>`<option value="${k}" ${k===sel?"selected":""}>${n}</option>`).join("");
  const critOpts = sel => Object.entries(ADM_CRITERIOS)
    .map(([k,c])=>`<option value="${k}" ${k===sel?"selected":""}>${c.nome}</option>`).join("");
  const ccOpts = sel => `<option value="">—</option>` +
    ADM_CC.map(c=>`<option value="${c}" ${c===sel?"selected":""}>${c}</option>`).join("");

  $("#t_adm").innerHTML = th([["Grupo"],["Natureza do gasto"],["R$/mês",1],["Critério de rateio"],
    ["Centro de custo"],["Total no período",1],["Rateio",1],[""]])+"<tbody>"+
    (A.linhas.length ? A.linhas.map((l,i)=>{
      const st = (AD.porLinha[i]||{});
      return `<tr>
      <td><select data-adm="${i}" data-f="grupo">${grupoOpts(l.grupo)}</select></td>
      <td><input data-adm="${i}" data-f="desc" value="${esc(l.desc)}" style="text-align:left;min-width:250px"></td>
      <td class="num"><input data-adm="${i}" data-f="valor" value="${num(l.valor)||""}" inputmode="decimal"></td>
      <td><select data-adm="${i}" data-f="crit" title="${(ADM_CRITERIOS[l.crit]||{}).dica||""}">${critOpts(l.crit)}</select></td>
      <td><select data-adm="${i}" data-f="cc" ${l.crit==="cc"?"":"disabled"}>${ccOpts(l.cc)}</select></td>
      <td class="num tot">${l.total>0?brl(l.total):"—"}</td>
      <td class="num calc">${l.total<=0 ? "—"
        : (st.rateado>0 ? '<span class="badge b-ok">rateado</span>'
                        : `<span class="badge b-warn">${st.motivo||"sem rateio"}</span>`)}</td>
      <td><button class="btn d" data-admrm="${i}">Remover</button></td></tr>`;}).join("")
    : `<tr><td colspan="8" class="calc">Nenhuma linha cadastrada.</td></tr>`)+
    `<tr><td class="tot" colspan="2">TOTAL</td><td class="num tot">${brl(A.mensal)}</td>
     <td colspan="2"></td><td class="num tot">${brl(A.total)}</td><td colspan="2"></td></tr></tbody>`;

  /* ---- percentuais do critério "percentual por etapa" ---- */
  const somaPct = ETAPAS_ORD.reduce((s,e)=>s+admRat(e),0);
  $("#t_adm_pct").innerHTML = th([["Etapa"],["% informado",1],["% aplicado",1]])+"<tbody>"+
    ETAPAS_ORD.map(e=>`<tr><td>${e}</td>
      <td class="num"><input data-admrat="${e}" value="${+admRat(e).toFixed(4)}" inputmode="decimal"></td>
      <td class="num calc">${somaPct>0?fmt(admRat(e)/somaPct*100,1)+"%":"—"}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(somaPct,1)}%${
      Math.abs(somaPct-100)>0.01?' <span class="badge b-warn">≠ 100%</span>':""}</td>
     <td class="num tot">${somaPct>0?"100,0%":"—"}</td></tr></tbody>`;

  /* ---- resultado: rateio por etapa, com a base de cada critério ---- */
  const nomes = Object.keys(R.etapas).sort((a,b)=>ETAPAS_ORD.indexOf(a)-ETAPAS_ORD.indexOf(b));
  $("#t_adm_etapa").innerHTML = th([["Etapa"],["Hectares",1],["Toneladas",1],["Horas",1],["Custo direto",1],
    ["Administrativo",1],["% do administrativo",1],["R$/ha",1]])+"<tbody>"+
    nomes.map(e=>{ const d=R.etapas[e], v=d.admin||0;
      return `<tr><td>${e}</td>
        <td class="num calc">${d.ha>0?fmt(d.ha):"—"}</td><td class="num calc">${d.ton>0?fmt(d.ton):"—"}</td>
        <td class="num calc">${d.horas>0?fmt(d.horas):"—"}</td><td class="num calc">${brl(d.direto)}</td>
        <td class="num tot">${brl(v)}</td>
        <td class="num calc">${AD.rateado>0?fmt(v/AD.rateado*100,1)+"%":"—"}</td>
        <td class="num calc">${d.ha>0?brl(v/d.ha,2):"—"}</td></tr>`; }).join("")+
    `<tr><td class="tot">RATEADO NAS ETAPAS</td><td colspan="4"></td>
     <td class="num tot">${brl(AD.rateado)}</td><td class="num tot">100,0%</td><td></td></tr>`+
    (AD.semRateio>0 ? `<tr><td class="calc">Sem base para rateio — fica no rateio indireto geral</td>
     <td colspan="4"></td><td class="num calc">${brl(AD.semRateio)}</td><td colspan="2"></td></tr>` : "")+
    "</tbody>";

  /* ---- leitura por grupo e por critério ---- */
  $("#t_adm_grupo").innerHTML = th([["Grupo"],["Total no período",1],["% do administrativo",1],["R$/ha",1]])+"<tbody>"+
    Object.entries(ADM_GRUPOS).map(([k,n])=>{ const v=A.porGrupo[k]||0;
      return `<tr><td>${n}</td><td class="num ${v>0?"tot":"calc"}">${v>0?brl(v):"—"}</td>
        <td class="num calc">${A.total>0?fmt(v/A.total*100,1)+"%":"—"}</td>
        <td class="num calc">${v>0?brl(v/ha,2):"—"}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(A.total)}</td>
     <td class="num tot">${A.total>0?"100,0%":"—"}</td><td class="num tot">${brl(A.total/ha,2)}</td></tr></tbody>`;

  $("#t_adm_crit").innerHTML = th([["Critério de rateio"],["Como distribui"],["Total no período",1],["%",1]])+"<tbody>"+
    Object.entries(ADM_CRITERIOS).map(([k,c])=>{ const v=A.porCriterio[k]||0;
      return `<tr><td>${c.nome}</td><td class="calc">${c.dica}</td>
        <td class="num ${v>0?"tot":"calc"}">${v>0?brl(v):"—"}</td>
        <td class="num calc">${A.total>0?fmt(v/A.total*100,1)+"%":"—"}</td></tr>`; }).join("")+"</tbody>";

  const porGrupo = Object.entries(ADM_GRUPOS).map(([k,n])=>({l:n, v:A.porGrupo[k]||0})).filter(x=>x.v>0);
  if(porGrupo.length) barrasH($("#ch_adm"), porGrupo);
  else $("#ch_adm").innerHTML = `<div class="hint">Lance valores para ver a composição.</div>`;
}

export { pintarAdm };

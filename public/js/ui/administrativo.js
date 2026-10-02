import { baseEtapa, custoUnit, rotuloBase } from '../calculo/base-fisica.js';
import { admRat } from '../calculo/administrativo.js';
import { ADM_CC, ADM_CRITERIOS, ADM_GRUPOS } from '../dados/administrativo.js';
import { ETAPAS_ORD } from '../calculo/arrendamento.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { barrasH, kpi, th } from './componentes.js';
import { ADM_MESES_ABERTO, P } from '../nucleo/estado.js';
import { MESES, NM, periodoMes } from '../nucleo/calendario.js';
import { campoBuscaMaterial } from './material-busca.js';

/* ---------- CUSTOS ADMINISTRATIVOS ---------- */

function pintarAdm(R){
  const A = R.ADM, AD = R.AD, ha = P.plantio||1;

  $("#k_adm").innerHTML =
    kpi("Custo administrativo","",brl(A.total), A.linhas.filter(l=>l.mensal>0).length+" linhas lançadas","nat:admin") +
    kpi("Por mês","t",brl(A.mensal),"conta EST-01","nat:admin") +
    kpi("Por hectare plantado","g",brl(A.total/ha,2)+"/ha", fmt(ha)+" ha de plantio","nat:admin") +
    kpi("Peso no custo total","a",R.total>0?fmt(A.total/R.total*100,1)+"%":"—",
        AD.semRateio>0 ? brl(AD.semRateio)+" sem rateio" : "tudo rateado nas etapas","nat:admin");

  /* ---- cadastro das linhas ---- */
  const grupoOpts = sel => Object.entries(ADM_GRUPOS)
    .map(([k,n])=>`<option value="${k}" ${k===sel?"selected":""}>${n}</option>`).join("");
  const critOpts = sel => Object.entries(ADM_CRITERIOS)
    .map(([k,c])=>`<option value="${k}" ${k===sel?"selected":""}>${c.nome}</option>`).join("");
  const ccOpts = sel => `<option value="">—</option>` +
    ADM_CC.map(c=>`<option value="${c}" ${c===sel?"selected":""}>${c}</option>`).join("");

  // resumo da coluna "Meses": "Todos" (padrão -- gasto recorrente, nada
  // mudou pra quem já tinha a linha assim), "nenhum" (não ocorre neste
  // período) ou a lista dos meses marcados, pro gasto esporádico
  const resumoMeses = l => l.meses.length===NM ? "Todos"
    : l.meses.length===0 ? "nenhum mês"
    : l.meses.map(m=>MESES[m].slice(0,3)).join(", ");
  // sub-linha com os 12 meses, aberta só na linha que a pessoa clicou --
  // mesma marcação (per-pop-meses/per-pop-pe) do seletor de período do topo,
  // só que sem o popover: aqui já mora dentro da própria tabela
  // dentro da tabela larga a caixa tem bem mais espaco que o popover estreito
  // do topo -- mais colunas, senao cada mes vira uma barra esticada enorme
  const linhaMeses = (l,i) => `<tr class="sub"><td colspan="10">
    <div class="per-pop-meses per-pop-meses-linha" style="margin:6px 0">${MESES.map((m,j)=>{
      const on = l.meses.includes(j);
      return `<label class="${on?"on ":""}p-${periodoMes(j)}" data-admmes="${i}" data-m="${j}">
        <input type="checkbox" ${on?"checked":""} tabindex="-1" aria-hidden="true">${m}</label>`;}).join("")}</div>
    <div class="per-pop-pe">
      <button class="btn" data-admmesatalho="todos" data-i="${i}">Todos</button>
      <button class="btn" data-admmesatalho="limpar" data-i="${i}">Nenhum</button>
      <button class="btn" data-admmeses="${i}">Fechar</button>
    </div></td></tr>`;

  /* Código e descrição do material (Cadastro de Materiais, em Configurações).
     Linha SEM material (as do cadastro inicial, ou gasto que não é compra de
     material): o código fica em branco e a descrição é texto livre, como sempre
     foi. Os dois campos buscam no catálogo — por código ou por nome — e escolher
     um resultado grava código, descrição, grupo e unidade DO MATERIAL na linha
     (um retrato: o plano continua válido mesmo que o catálogo mude ou esvazie).
     Linha COM material mostra os dois como texto; o × desvincula e a descrição
     volta a ser livre. */
  const celCodigo = (l,i) => l.cod
    ? `<b>${esc(l.cod)}</b> <button type="button" class="btn xs" data-matlimpar="${i}"
         title="Desvincular o material desta linha (a descrição passa a ser texto livre)">×</button>`
    : campoBuscaMaterial({linha:i, campo:"cod", placeholder:"Código ou nome", estilo:"min-width:140px"});
  const celDescricao = (l,i) => l.cod
    ? `<div style="min-width:250px">${esc(l.desc)}</div>
       <div class="calc" style="font-size:11px">${esc([l.matGrupo && "Grupo "+l.matGrupo, l.matUn && "Un. "+l.matUn].filter(Boolean).join(" · "))}</div>`
    : campoBuscaMaterial({linha:i, campo:"desc", valor:l.desc, extra:`data-adm="${i}" data-f="desc"`,
        placeholder:"Descreva o gasto ou busque o material", estilo:"text-align:left;min-width:250px"});

  $("#t_adm").innerHTML = th([["Grupo"],["Código material"],["Descrição material"],["R$/mês",1],["Critério de rateio"],
    ["Centro de custo"],["Meses"],["Total no período",1],["Rateio",1],[""]])+"<tbody>"+
    (A.linhas.length ? A.linhas.map((l,i)=>{
      const st = (AD.porLinha[i]||{});
      return `<tr>
      <td><select data-adm="${i}" data-f="grupo">${grupoOpts(l.grupo)}</select></td>
      <td>${celCodigo(l,i)}</td>
      <td>${celDescricao(l,i)}</td>
      <td class="num"><input data-adm="${i}" data-f="valor" value="${num(l.valor)||""}" inputmode="decimal"></td>
      <td><select data-adm="${i}" data-f="crit" title="${(ADM_CRITERIOS[l.crit]||{}).dica||""}">${critOpts(l.crit)}</select></td>
      <td><select data-adm="${i}" data-f="cc" ${l.crit==="cc"?"":"disabled"}>${ccOpts(l.cc)}</select></td>
      <td><button type="button" class="btn" data-admmeses="${i}"
        title="Gasto esporádico? Marque só os meses em que ele ocorre.">${esc(resumoMeses(l))}</button></td>
      <td class="num tot">${l.total>0?brl(l.total):"—"}</td>
      <td class="num calc">${l.total<=0 ? "—"
        : (st.rateado>0 ? '<span class="badge b-ok">rateado</span>'
                        : `<span class="badge b-warn">${st.motivo||"sem rateio"}</span>`)}</td>
      <td><button class="btn d" data-admrm="${i}">Remover</button></td></tr>`
      +(ADM_MESES_ABERTO[i] ? linhaMeses(l,i) : "");}).join("")
    : `<tr><td colspan="10" class="calc">Nenhuma linha cadastrada.</td></tr>`)+
    `<tr><td class="tot" colspan="3">TOTAL</td><td class="num tot">${brl(A.mensal)}</td>
     <td colspan="3"></td><td class="num tot">${brl(A.total)}</td><td colspan="2"></td></tr></tbody>`;

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
    ["Administrativo",1],["% do administrativo",1],["Custo unitário",1]])+"<tbody>"+
    nomes.map(e=>{ const d=R.etapas[e], v=d.admin||0;
      return `<tr><td>${e}</td>
        <td class="num calc">${d.ha>0?fmt(d.ha):"—"}</td><td class="num calc">${d.ton>0?fmt(d.ton):"—"}</td>
        <td class="num calc">${d.horas>0?fmt(d.horas):"—"}</td><td class="num calc">${brl(d.direto)}</td>
        <td class="num tot">${brl(v)}</td>
        <td class="num calc">${AD.rateado>0?fmt(v/AD.rateado*100,1)+"%":"—"}</td>
        <td class="num calc" title="${rotuloBase(baseEtapa(R, e))}">${custoUnit(v, baseEtapa(R, e))}</td></tr>`; }).join("")+
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

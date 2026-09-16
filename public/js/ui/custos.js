import { CFG } from '../dados/cfg.js';
import { CAT_LBL, MESES, perTag } from '../nucleo/calendario.js';
import { ESPOR, P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- CUSTOS ---------- */
function comps(R){
  return [["Mão de obra direta",R.mdoDireta],["MDO equipamentos de apoio",R.mdoApoio],["MDO estrutura indireta",R.mdoIndirT],
    ["Equipe de manutenção",R.mdoManut],["Combustível (diesel)",R.dieselT],
    ["Manutenção e materiais",R.manutT],["Insumos agronômicos",R.insumoT],
    ["Irrigação e fertirrigação",R.irrT],["Transporte de pessoal",R.tpessT],["Terceirização de aplicações",R.tercAtivT],["Terceirizações (contratos)",R.tercT],
    ["Custos esporádicos",R.espT],["Arrendamento",R.arrT],
    ["Administração",R.admT],["Depreciação",R.depT]];
}
/* natureza do custo -> chave do rastro, para a linha abrir a explicacao */
const NAT_RASTRO = {"Combustível (diesel)":"diesel","Mão de obra direta":"mdo","Manutenção e materiais":"manut",
  "Insumos agronômicos":"insumo","Terceirização de aplicações":"terc","Arrendamento":"arrend",
  "Administração":"admin"};

function pintarCustos(R){
  const ha=P.plantio||1;
  $("#k_custo").innerHTML =
    kpi("Custo total","",brl(R.total)) + kpi("Custo variável","t",brl(R.variavel)) +
    kpi("Custo fixo","a",brl(R.fixoT)) + kpi("Custo por ha plantado","g",brl(R.total/ha));

  // safra (abril a novembro) × entressafra (dezembro a março)
  const PR = R.PER, perTot = PR.safra.total + PR.entressafra.total;
  const nomeP = p => p==="safra" ? "safra" : "entressafra";
  $("#k_per").innerHTML =
    ["safra","entressafra"].map(p=>{ const o=PR[p];
      return kpi("Custo na "+nomeP(p), p==="safra"?"g":"a", brl(o.total),
        o.meses.join(" · ")+(perTot>0?" — "+fmt(o.total/perTot*100,1)+"% do total":"")); }).join("") +
    ["safra","entressafra"].map(p=>{ const o=PR[p];
      return kpi("Média mensal — "+nomeP(p), p==="safra"?"g":"a", o.meses.length?brl(o.total/o.meses.length):"—",
        o.meses.length+(o.meses.length===1?" mês":" meses")+" no orçamento"); }).join("");

  $("#t_per_cat").innerHTML = th([["Grande conta"],["Safra",1],["% safra",1],["Entressafra",1],["% entressafra",1],["Total",1]])+"<tbody>"+
    Object.keys(CAT_LBL).map(k=>{ const s=PR.safra.cat[k], e=PR.entressafra.cat[k], t=s+e;
      return `<tr><td>${CAT_LBL[k]}</td><td class="num">${brl(s)}</td><td class="num calc">${t>0?fmt(s/t*100,1)+"%":"—"}</td>
        <td class="num">${brl(e)}</td><td class="num calc">${t>0?fmt(e/t*100,1)+"%":"—"}</td><td class="num tot">${brl(t)}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(PR.safra.total)}</td>
     <td class="num tot">${perTot>0?fmt(PR.safra.total/perTot*100,1)+"%":"—"}</td><td class="num tot">${brl(PR.entressafra.total)}</td>
     <td class="num tot">${perTot>0?fmt(PR.entressafra.total/perTot*100,1)+"%":"—"}</td><td class="num tot">${brl(perTot)}</td></tr></tbody>`;

  const etsP = Object.keys(R.etapaMes).filter(e=>PR.safra.etapa[e]+PR.entressafra.etapa[e]>0.5)
    .sort((a,b)=>(PR.safra.etapa[b]+PR.entressafra.etapa[b])-(PR.safra.etapa[a]+PR.entressafra.etapa[a]));
  const eS = etsP.reduce((s,e)=>s+PR.safra.etapa[e],0), eE = etsP.reduce((s,e)=>s+PR.entressafra.etapa[e],0);
  $("#t_per_etapa").innerHTML = th([["Etapa"],["Safra",1],["Entressafra",1],["Total",1],["% na entressafra",1]])+"<tbody>"+
    (etsP.length ? etsP.map(e=>{ const s=PR.safra.etapa[e], x=PR.entressafra.etapa[e], t=s+x;
      return `<tr><td>${e}</td><td class="num">${brl(s)}</td><td class="num">${brl(x)}</td>
        <td class="num tot">${brl(t)}</td><td class="num calc">${t>0?fmt(x/t*100,1)+"%":"—"}</td></tr>`; }).join("")
      : `<tr><td colspan="5" class="calc">Sem custo por etapa: lance quantidades no Plano Operacional.</td></tr>`)+
    `<tr><td class="tot">TOTAL DAS ETAPAS</td><td class="num tot">${brl(eS)}</td><td class="num tot">${brl(eE)}</td>
     <td class="num tot">${brl(eS+eE)}</td><td class="num tot">${eS+eE>0?fmt(eE/(eS+eE)*100,1)+"%":"—"}</td></tr></tbody>`;
  $("#per_nota").textContent = Math.abs(R.total-(eS+eE))>1
    ? `Custos gerais sem nenhuma etapa com custo direto para absorvê-los (${brl(R.total-(eS+eE))}) aparecem só nas grandes contas.` : "";

  $("#t_custo").innerHTML = th([["Natureza"],["Total",1],["%",1],["R$/ha",1],["Peso"]])+"<tbody>"+
    comps(R).map(([n,v])=>{const p=R.total>0?v/R.total*100:0; const k=NAT_RASTRO[n];
      return `<tr${k?` data-rastro="nat:${k}" title="Clique para ver a composição"`:""}><td>${n}</td><td class="num">${brl(v)}</td><td class="num calc">${fmt(p,1)}%</td>
        <td class="num calc">${brl(v/ha,0)}</td>
        <td><div class="bar"><i style="width:${Math.min(p,100)}%"></i></div></td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(R.total)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${brl(R.total/ha,0)}</td><td></td></tr></tbody>`;

  $("#t_mensal").innerHTML = th([["Mês"],["Período"],["Custo",1],["% do total",1],["Acumulado",1],["Curva"]])+"<tbody>"+
    (()=>{let ac=0; return MESES.map((m,i)=>{ac+=R.meses[i];
      const p=R.total>0?R.meses[i]/R.total*100:0, pa=R.total>0?ac/R.total*100:0;
      return `<tr data-rastro="mes:${i}" title="Clique para ver a composição do mês"><td>${m}</td><td>${perTag(i)}</td><td class="num">${brl(R.meses[i])}</td>
        <td class="num calc">${fmt(p,1)}%</td><td class="num calc">${brl(ac)}</td>
        <td><div class="bar"><i style="width:${pa}%"></i></div></td></tr>`;}).join("");})()+"</tbody>";

  const etapasOrd = Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total);
  const totalEtapas = etapasOrd.reduce((s,[,d])=>s+d.total,0)||1;
  $("#t_unit").innerHTML = th([["Etapa"],["Diesel",1],["Mão de obra",1],["Manutenção",1],["Insumos",1],
    ["Terceirização",1],["Arrendamento",1],["Indireto",1],["Total",1],["% do total",1],["Base física",1],["Custo unitário",1]])+"<tbody>"+
    etapasOrd.map(([e,d])=>{
      const base=d.ha>0?d.ha:d.ton, un=d.ha>0?"ha":"t";
      const pp = d.total/totalEtapas*100;
      let h = `<tr><td>${e}</td>
        <td class="num calc">${brl(d.diesel)}</td><td class="num calc">${brl(d.mdo)}</td>
        <td class="num calc">${brl(d.manut)}</td>
        <td class="num calc">${brl(d.insumo+(d.irrig||0))}</td><td class="num calc">${brl(d.terc)}</td>
        <td class="num calc">${brl(d.arrend)}</td><td class="num calc">${brl(d.indireto)}</td>
        <td class="num tot" data-rastro="etapa:${e}" title="Clique para ver a composição da etapa">${brl(d.total)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td class="num calc">${fmt(base)} ${un}</td>
        <td class="num tot">${base>0?brl(d.total/base,2)+"/"+un:"—"}</td></tr>`;
      if(e==="TRATOS CULTURAIS"){
        ["Soca","Planta"].forEach(c=>{const x=R.tratosCult[c];
          h += `<tr class="sub"><td class="calc">↳ Cana ${c.toLowerCase()}</td>
            <td colspan="5"></td>
            <td class="num calc">${brl(x.arrend)}</td><td class="num calc">${brl(x.indireto)}</td>
            <td class="num calc">${brl(x.total)}</td><td></td>
            <td class="num calc">${fmt(x.ha)} ha</td>
            <td class="num calc">${x.ha>0?brl(x.total/x.ha,2)+"/ha":"—"}</td></tr>`;});
      }
      return h;}).join("")+
    `<tr><td class="tot">TOTAL</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.diesel,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.mdo,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.manut,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.insumo+(d.irrig||0),0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.terc,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.arrend,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.indireto,0))}</td>
     <td class="num tot">${brl(totalEtapas)}</td><td class="num tot">100,0%</td><td colspan="2"></td></tr></tbody>`;

  $("#t_esp").innerHTML = th([["Mês"],["Descrição"],["Centro de custo"],["Valor",1],["Status"],[""]])+"<tbody>"+
    (ESPOR.length?ESPOR.map((e,i)=>`<tr>
      <td><select data-ex="${i}" data-f="mes">${MESES.map(m=>`<option ${m===e.mes?"selected":""}>${m}</option>`).join("")}</select></td>
      <td><input data-ex="${i}" data-f="desc" value="${e.desc||""}" style="text-align:left;min-width:180px"></td>
      <td><select data-ex="${i}" data-f="cc">${CFG.cc_list.map(c=>`<option ${c===e.cc?"selected":""}>${c}</option>`).join("")}</select></td>
      <td class="num"><input data-ex="${i}" data-f="valor" value="${e.valor||0}" inputmode="decimal"></td>
      <td><select data-ex="${i}" data-f="status">${["Provisão","Confirmado","Pago"].map(s=>`<option ${s===e.status?"selected":""}>${s}</option>`).join("")}</select></td>
      <td><button class="btn d" data-rm="${i}">Remover</button></td></tr>`).join("")
      :`<tr><td colspan="6" class="calc">Nenhum lançamento.</td></tr>`)+
    `<tr><td class="tot" colspan="3">TOTAL</td><td class="num tot">${brl(R.espT)}</td><td colspan="2"></td></tr></tbody>`;
}


export { comps, pintarCustos };

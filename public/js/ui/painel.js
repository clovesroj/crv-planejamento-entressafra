import { linha } from '../calculo/atividade.js';
import { CRM_COMP } from '../calculo/crm.js';
import { MESES, periodoMes } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { barras, barrasH, kpi, th } from './componentes.js';
import { comps } from './custos.js';

/* ---------- PAINEL ---------- */
function pintarPainel(R){
  const ha=P.plantio||1, colh=R.etapas["COLHEITA"], tonEtapa=colh?colh.ton:0;
  // custo de colheita em sentido estrito (corte, A01+A02) — exclui transporte e transbordo (TR1-TR4),
  // que também pertencem à etapa COLHEITA mas são um custo de logística, não de colheita propriamente.
  const corte = R.L.filter(r=>r.a.cod==="A01"||r.a.cod==="A02");
  const corteDireto = corte.reduce((s,r)=>s+r.direto,0), corteTon = corte.reduce((s,r)=>s+r.total,0);
  // o corte recebe o indireto e a parte do arrendamento da colheita na proporção do seu custo direto
  const corteTotal = corteDireto + R.indiretoPool*(corteDireto/R.diretoSum)
    + (colh && colh.direto>0 ? colh.arrend*(corteDireto/colh.direto) : 0);
  $("#k_painel").innerHTML =
    kpi("Custo total","",brl(R.total),"","total") +
    kpi("Custo / ha plantado","t",brl(R.total/ha),"","total") +
    kpi("Custo de colheita","g",corteTon>0?brl(corteTotal/corteTon,2)+"/t":"—","só corte (A01+A02), sem transporte","etapa:COLHEITA") +
    kpi("Efetivo total","a",fmt(R.efetivoTotal)+" pessoas","","pessoas:total") +
    kpi("Custo na safra","g",brl(R.PER.safra.total),"abr a nov · "+R.PER.safra.meses.length+" meses no orçamento","total") +
    kpi("Custo na entressafra","a",brl(R.PER.entressafra.total),"dez a mar · "+R.PER.entressafra.meses.length+" meses no orçamento","total");
  $("#k_tratos").innerHTML =
    kpi("Tratos — cana soca","t",R.tratosCult.Soca.ha>0?brl(R.tratosCult.Soca.total/R.tratosCult.Soca.ha,2)+"/ha":"—",
        brl(R.tratosCult.Soca.total)+" · "+fmt(R.tratosCult.Soca.ha)+" ha","etapa:TRATOS CULTURAIS") +
    kpi("Tratos — cana planta","g",R.tratosCult.Planta.ha>0?brl(R.tratosCult.Planta.total/R.tratosCult.Planta.ha,2)+"/ha":"—",
        brl(R.tratosCult.Planta.total)+" · "+fmt(R.tratosCult.Planta.ha)+" ha","etapa:TRATOS CULTURAIS") +
    kpi("Etapa colheita (c/ transporte)","",tonEtapa>0?brl(colh.total/tonEtapa,2)+"/t":"—","corte + transporte + transbordo","etapa:COLHEITA") +
    kpi("CRM total","a",brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)),"","frota:crm") +
    kpi("CRM por hora média","",R.horasT>0?brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)/R.horasT,2)+"/h":"—","","frota:crm") +
    kpi("Diesel projetado","t",fmt(R.CB.litrosT)+" L",
        brl(R.dieselT)+(R.CB.litrosT>0?" · "+brl(R.dieselT/R.CB.litrosT,2)+"/L":""),"diesel:total") +
    kpi("Arrendamento","a",R.AR.area>0?brl(R.AR.anual/R.AR.area,0)+"/ha/ano":"—",
        brl(R.arrT)+" no orçamento · "+fmt(R.AR.area)+" ha","nat:arrend");
  barras($("#ch_mes"),MESES.map((m,i)=>({l:m,v:R.meses[i]})),"#2D6A3A");

  const catLbl = {mdo:"Mão de obra",manut:"Manutenção (CRM)",diesel:"Diesel",insumo:"Insumos + irrigação",
    terc:"Terceirização + transporte",arrend:"Arrendamento",fixo:"Fixos (adm./deprec.)",espor:"Esporádicos"};
  const catKeys = Object.keys(catLbl);
  $("#t_grandes").innerHTML = th([["Conta"],...MESES.map((m,i)=>[`${m}<br><small>${periodoMes(i)==="safra"?"safra":"entressafra"}</small>`,1]),
      ["Total",1],["Safra",1],["Entressafra",1]])+"<tbody>"+
    catKeys.map(k=>{const linha=R.mesesCat[k], tot=linha.reduce((s,v)=>s+v,0);
      return `<tr><td>${catLbl[k]}</td>`+linha.map(v=>`<td class="num calc">${brl(v,0)}</td>`).join("")+
        `<td class="num tot">${brl(tot)}</td><td class="num">${brl(R.PER.safra.cat[k])}</td>`+
        `<td class="num">${brl(R.PER.entressafra.cat[k])}</td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL</td>`+
    MESES.map((m,i)=>`<td class="num tot">${brl(catKeys.reduce((s,k)=>s+R.mesesCat[k][i],0),0)}</td>`).join("")+
    `<td class="num tot">${brl(catKeys.reduce((s,k)=>s+R.mesesCat[k].reduce((a,v)=>a+v,0),0))}</td>`+
    `<td class="num tot">${brl(R.PER.safra.total)}</td><td class="num tot">${brl(R.PER.entressafra.total)}</td></tr></tbody>`;
  barrasH($("#ch_comp"),comps(R).filter(([,v])=>v>0).map(([l,v])=>({l,v})));

  const ref=[["Operações (MDO + manutenção + diesel)",R.mdoTotal+R.manutT+R.dieselT,52],
    ["Insumos (agronômicos + irrigação)",R.insumoT+R.irrT,25],
    ["Arrendamento",R.arrT,17],
    ["Outros (admin + depreciação + terceiros)",R.admT+R.depT+R.tercT+R.espT,6]];
  $("#t_bench").innerHTML = th([["Componente"],["Projetado",1],["% projetado",1],["% referência",1],["Desvio",1],["Leitura"]])+"<tbody>"+
    ref.map(([n,v,r])=>{const p=R.total>0?v/R.total*100:0,dv=p-r;
      const cls=Math.abs(dv)<=5?"b-ok":(dv>5?"b-bad":"b-warn");
      const tx=Math.abs(dv)<=5?"Aderente":(dv>5?"Acima":"Abaixo");
      return `<tr><td>${n}</td><td class="num">${brl(v)}</td><td class="num calc">${fmt(p,1)}%</td>
        <td class="num calc">${r},0%</td><td class="num">${fmt(dv,1)} p.p.</td>
        <td><span class="badge ${cls}">${tx}</span></td></tr>`;}).join("")+"</tbody>";
}


export { pintarPainel };

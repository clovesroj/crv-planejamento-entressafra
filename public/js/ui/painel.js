import { linha } from '../calculo/atividade.js';
import { custoHaPlantado, custoPorOperacao } from '../calculo/custo-operacao.js';
import { tabelaColheita, tabelaHa } from '../calculo/modelo-pecege.js';
import { baseEtapa, custoUnit, premissaBase, rotuloBase } from '../calculo/base-fisica.js';
import { CRM_COMP } from '../calculo/crm.js';
import { MESES, clsMes, periodoMes } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { barras, barrasH, kpi, somaSel, tdMeses, th } from './componentes.js';
import { comps } from './custos.js';

/* ---------- PAINEL ---------- */
function pintarPainel(R){
  pintarModeloPecege(R);
  const ha=P.plantio||1, colh=R.etapas["COLHEITA"], tonEtapa=colh?colh.ton:0;
  // custo de colheita em sentido estrito (corte, A01+A02) — exclui transporte e transbordo (TR1-TR4),
  // que também pertencem à etapa COLHEITA mas são um custo de logística, não de colheita propriamente.
  const corte = R.L.filter(r=>r.a.cod==="A01"||r.a.cod==="A02");
  const corteDireto = corte.reduce((s,r)=>s+r.direto,0), corteTon = corte.reduce((s,r)=>s+r.total,0);
  // o corte recebe o indireto e a parte do arrendamento da colheita na proporção do seu custo direto
  const corteTotal = corteDireto + R.indiretoPool*(corteDireto/R.diretoSum)
    + (colh && colh.direto>0 ? colh.arrend*(corteDireto/colh.direto) : 0);
  // corte pelo volume colhido (premissa); sem ela, pelas toneladas das atividades de corte
  const tonPrem = premissaBase("colheita");
  const baseCorte = tonPrem ? {q:tonPrem, un:"t", rot:"t colhidas", fonte:"premissa"}
                            : {q:corteTon, un:"t", rot:"t", fonte:"atividades"};
  const bColh = baseEtapa(R, "COLHEITA");
  $("#k_painel").innerHTML =
    kpi("Custo total","",brl(R.SEL.total), R.SEL.parcial?R.SEL.rotulo:"","total") +
    kpi("Custo / ha plantado","t",brl(custoHaPlantado(R).valor), custoHaPlantado(R).nota+(R.SEL.parcial?" · ano todo":""),"custoha") +
    kpi("Custo de colheita","g",custoUnit(corteTotal, baseCorte),"só corte (A01+A02), sem transporte · "+rotuloBase(baseCorte),"corte") +
    kpi("Efetivo total","a",fmt(R.efetivoTotal)+" pessoas","","pessoas:total") +
    kpi("Custo na safra","g",brl(R.PER.safra.total),"abr a nov · "+R.PER.safra.meses.length+" meses no orçamento","periodo:safra") +
    kpi("Custo na entressafra","a",brl(R.PER.entressafra.total),"dez a mar · "+R.PER.entressafra.meses.length+" meses no orçamento","periodo:entressafra");
  // planta x soca pela divisão que inclui a irrigação de cada cultura (aba
  // Custos). Cana planta e a formação do canavial dividem pela área plantada;
  // cana soca, por hectare operado.
  const OP = custoPorOperacao(R), op = id => OP.principais.find(l=>l.id===id);
  const unitHa = l => l ? custoUnit(l.contabil, l.base) : "—";
  const soca = op("soca"), planta = op("planta"), F = OP.formacao;
  $("#k_tratos").innerHTML =
    (F ? kpi("Formação do canavial","g",unitHa(F),
        brl(F.contabil)+" · preparo + plantio + tratos de cana planta ÷ "+rotuloBase(F.base),"op:formacao") : "") +
    kpi("Tratos — cana soca","t",unitHa(soca),
        soca ? brl(soca.contabil)+" · "+rotuloBase(soca.base) : "—","op:soca") +
    kpi("Tratos — cana planta","g",unitHa(planta),
        planta ? brl(planta.contabil)+" · "+rotuloBase(planta.base) : "—","op:planta") +
    kpi("Etapa colheita (c/ transporte)","",colh?custoUnit(colh.total, bColh):"—","corte + transporte + transbordo · "+rotuloBase(bColh),"op:colheita") +
    kpi("CRM total","a",brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)),"","frota:crm") +
    kpi("CRM por hora média","",R.horasT>0?brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)/R.horasT,2)+"/h":"—","","frota:crm") +
    kpi("Diesel projetado","t",fmt(R.CB.litrosT)+" L",
        brl(R.dieselT)+(R.CB.litrosT>0?" · "+brl(R.dieselT/R.CB.litrosT,2)+"/L":""),"diesel:total") +
    kpi("Arrendamento","a",R.AR.area>0?brl(R.AR.anual/R.AR.area,0)+"/ha/ano":"—",
        brl(R.arrT)+" no orçamento · "+fmt(R.AR.area)+" ha","nat:arrend");
  barras($("#ch_mes"),MESES.map((m,i)=>({l:m,v:R.meses[i]})),"#2A57A0");

  const catLbl = {mdo:"Mão de obra",manut:"Manutenção (CRM)",diesel:"Diesel",insumo:"Insumos + irrigação",
    terc:"Terceirização + transporte",arrend:"Arrendamento",fixo:"Fixos (adm./deprec.)",espor:"Esporádicos"};
  const catKeys = Object.keys(catLbl);
  const SEL = R.SEL;
  const totMes = MESES.map((m,i)=>catKeys.reduce((s,k)=>s+R.mesesCat[k][i],0));
  $("#t_grandes").innerHTML = th([["Conta"],...MESES.map((m,i)=>[`${m}<br><small>${periodoMes(i)==="safra"?"safra":"entressafra"}</small>`,1,clsMes(i)]),
      [SEL.parcial?"Total do período":"Total",1],["Safra",1],["Entressafra",1]])+"<tbody>"+
    catKeys.map(k=>{const linha=R.mesesCat[k];
      return `<tr><td>${catLbl[k]}</td>`+tdMeses(linha, v=>brl(v,0))+
        `<td class="num tot">${brl(somaSel(linha, SEL))}</td><td class="num">${brl(R.PER.safra.cat[k])}</td>`+
        `<td class="num">${brl(R.PER.entressafra.cat[k])}</td></tr>`;}).join("")+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(totMes, v=>brl(v,0), "num tot")+
    `<td class="num tot">${brl(somaSel(totMes, SEL))}</td>`+
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


/* ---------- tabelas no modelo PECEGE ----------
   Mesmo desenho do relatório de custos PECEGE/USP: R$/ha e % por operação, e o
   sistema de colheita em R$/t. O cálculo mora em calculo/modelo-pecege.js. */
const LINHAS_HA = [
  ["total","Total",0,"tot"],
  ["operacao","Operação",1,"grp"],
  ["maq","Máq + Mão de obra",2],
  ["terc","Serviços terceirizados",2],
  ["irrig","Irrigação/Fertirrigação",2],
  ["insumos","Insumos",1,"grp"],
  ["ins_mudas","Mudas",2],
  ["ins_corretivo","Adubação corretiva",2],
  ["ins_fertilizante","Fertilizantes",2],
  ["ins_defensivos","Defensivos",2],
  ["ins_herbicida","Herbicidas",3],
  ["ins_inseticida","Inseticidas",3],
  ["ins_fungicida","Fungicidas",3],
  ["ins_nematicida","Nematicidas",3],
  ["ins_biologico","Controle biológico",2],
  ["ins_maturador","Maturador",2],
  ["ins_inibidor","Inibidor",2],
  ["ins_torta","Torta de filtro",2],
  ["ins_outros","Outros insumos",2],
  ["adm","Administrativo",1,"grp"],
  ["admin","Administrativo",2],
  ["royalties","Royalties",2,"semdado"],
  ["rateios","Outros custos (rateios)",1,"grp"],
  ["arrend","Arrendamento",2],
  ["deprec","Depreciação",2],
  ["apoio","Diesel dos equipamentos de apoio",2],
  ["gerais","Demais custos gerais",2],
  ["pecege","Base PECEGE (operação + insumos + administrativo)",0,"sub"],
];
function pintarModeloPecege(R){
  const H = tabelaHa(R);
  const n0 = v => Math.abs(v)<0.5 ? "-" : fmt(v);
  const pc = (v,t) => Math.abs(v)<0.005 || !(t>0) ? "-" : fmt(v/t*100,1)+"%";
  let h = `<thead><tr><th class="pec-rot">R$/ha</th>${H.cols.map(c=>
    `<th colspan="2" class="pec-${c.id}">${c.nome}<small>${c.base&&c.base.q>0?fmt(c.base.q)+" "+(c.base.rot||c.base.un):"sem área"}</small></th>`).join("")}</tr></thead><tbody>`;
  LINHAS_HA.forEach(([k,rot,nivel,tipo])=>{
    h += `<tr class="pec-n${nivel}${tipo?" pec-"+tipo:""}"><td>${rot}</td>`+H.cols.map(c=>{
      const q = c.base && c.base.q>0 ? c.base.q : 0;
      if(tipo==="semdado") return `<td class="num pec-${c.id}" title="Sem dado no plano">-</td><td class="num pec-${c.id}">-</td>`;
      const v = q ? c.v[k]/q : 0, t = q ? c.v.total/q : 0;
      return `<td class="num pec-${c.id}">${n0(v)}</td><td class="num pec-${c.id} pec-pct">${pc(v,t)}</td>`;
    }).join("")+`</tr>`;
  });
  $("#t_pec_ha").innerHTML = h+"</tbody>";
  const haPl = (H.cols.find(c=>c.id==="formacao")||{}).base;
  $("#pec_ha_nota").textContent = H.custoMuda>0.5
    ? `Mudas: o custo da colheita, do transbordo e do transporte de muda (${brl(H.custoMuda)}, com a parte delas nos rateios da colheita) está na etapa Colheita do Plano Operacional; aqui, como no modelo PECEGE, entra no plantio como insumo — e sai do CTTA. `
      + (haPl && haPl.q>0 ? `É por isso que a coluna Formação fica ${brl(H.custoMuda/haPl.q)}/ha acima do cartão "Custo / ha plantado" do topo, que conta só as três etapas do plano.` : "")
    : "";

  const C = tabelaColheita(R), b = C.base, q = b.q>0 ? b.q : 0;
  const t1 = v => !q || Math.abs(v)<0.005*q ? "-" : fmt(v/q,1);
  const COLS = [["corte","Corte (C)"],["transbordo","Transbordo (T)"],["ct","C + T"],
    ["transporte",`Transporte (T)<small>raio ${fmt(P.raioSafra)} km</small>`],["a","Apoio + Adm (A)"],["ctta","CTTA"]];
  const valor = (col, lin) => {
    if(lin==="total") return C.tot[col];
    const dir = ["operador","diesel","manut","locacao","outros"];
    if(dir.includes(lin)){
      if(col==="a") return null;
      if(col==="ctta") return C.ct[lin]+C.g.transporte[lin];
      if(col==="ct") return C.ct[lin];
      return C.g[col][lin];
    }
    // linhas do apoio + adm: só nas colunas A e CTTA
    return (col==="a" || col==="ctta") ? C.A[lin] : null;
  };
  const LIN = [["total","Total","tot"],["operador","Operador"],["diesel","Diesel"],["manut","Manutenção"],
    ["locacao","Locação"],["outros","Outros"],["apoio","Apoio (equipamentos e custos gerais)","a"],
    ["admin","Administrativo","a"],["deprec","Depreciação","a"]];
  $("#t_pec_colh").innerHTML = `<thead><tr><th class="pec-rot">Parâmetro</th>${COLS.map(([k,n])=>
    `<th class="pec-c-${k}">${n}</th>`).join("")}</tr></thead><tbody>`+
    LIN.map(([k,rot,tipo])=>`<tr class="${tipo==="tot"?"pec-tot":tipo==="a"?"pec-n1 pec-a":"pec-n1"}"><td>${rot}</td>${
      COLS.map(([c])=>{ const v = valor(c,k); return `<td class="num pec-c-${c}">${v==null?"-":t1(v)}</td>`; }).join("")}</tr>`).join("")+
    "</tbody>";
  $("#pec_colh_nota").textContent =
    `R$ por tonelada, sobre ${q?fmt(q)+" "+(b.rot||"t")+(b.fonte==="premissa"?" (premissa)":" (soma do corte lançado)"):"volume não informado"}. `+
    `Atividades: ${C.ativ.join(", ")}; colheita e transporte de muda ficam no plantio. `+
    (C.arrend>0.5 && q ? `Arrendamento rateado à colheita, fora do CTTA: ${brl(C.arrend/q,2)}/t.` : "");
}

export { pintarPainel };

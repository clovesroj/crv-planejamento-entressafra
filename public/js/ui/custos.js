import { CFG } from '../dados/cfg.js';
import { avisoBase, comps, custoHaPlantado, custoPorOperacao } from '../calculo/custo-operacao.js';
import { baseEtapa, custoUnit, rotuloBase } from '../calculo/base-fisica.js';
import { CAT_LBL, MESES, clsMes, perTag, periodoMes } from '../nucleo/calendario.js';
import { ESPOR, P } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { barrasPeriodo, kpi, th } from './componentes.js';

/* ---------- CUSTOS ---------- */
/* natureza do custo -> chave do rastro, para a linha abrir a explicacao */
const NAT_RASTRO = {"Combustível (diesel)":"nat:diesel","Mão de obra direta":"nat:mdo","Manutenção e materiais":"nat:manut",
  "Insumos agronômicos":"nat:insumo","Terceirização de aplicações":"nat:terc","Arrendamento":"nat:arrend",
  "Administração":"nat:admin","MDO equipamentos de apoio":"frota:apoio","MDO quadro ADM agrícola":"cat:mdo",
  "MDO quadro da oficina":"cat:mdo","MDO apoio operacional":"cat:mdo","FAT (contrato suspenso)":"cat:mdo",
  "Irrigação e fertirrigação":"cat:irrig","Transporte de pessoal":"tpess","Terceirizações (contratos)":"cat:terc",
  "Custos esporádicos":"cat:espor","Depreciação":"fixo"};

/* ---------- custo operacional x custo contábil ----------
   Duas páginas sobre as mesmas operações: o que custa fazer (operacional) e o
   que a operação carrega com os rateios (contábil). O cálculo mora em
   calculo/custo-operacao.js; aqui só se desenha. */
// custo unitário e base física: a regra mora em calculo/base-fisica.js
const unit = (v, b) => custoUnit(v, b);
// base física com o que ela é: hectares plantados, operados ou toneladas
const rotBase = b => rotuloBase(b);
/* As operações principais, com a formação do canavial (preparo de solo,
   plantio e tratos de cana planta) logo depois da última parte dela. A formação
   é subtotal: não entra de novo na soma. */
function comFormacao(C, linhaOp, linhaForm){
  const ultima = C.principais.map(l=>!!l.formacao).lastIndexOf(true);
  return C.principais.map((l,k)=>linhaOp(l) + (k===ultima && C.formacao ? linhaForm(C.formacao) : "")).join("");
}
function pintarOperacional(R){
  const C = custoPorOperacao(R);
  const P4 = C.principais, OUT = C.outras;
  const somaP = f => C.soma(P4, f);
  const anoTodo = R.SEL.parcial ? " · ano todo" : "";

  const F = C.formacao;
  /* Cartão do custo OPERACIONAL: só o custo direto da operação. O total com os
     rateios (o que o Painel e o "Custo total por ha plantado" mostram) vem
     escrito logo abaixo, para os dois números não parecerem contraditórios. */
  const subOper = l => !(l.base && l.base.q>0)
    ? (l.oper.total>0 ? "sem base física" : "sem volume no plano")+anoTodo
    : unit(l.oper.total, l.base)+" · "+l.base.rot+anoTodo+
      " · total com rateios "+unit(l.contabil, l.base)+(avisoBase(l) ? " · "+avisoBase(l) : "");
  $("#k_oper").innerHTML =
    (F ? kpi("Formação do canavial — operacional","g",brl(F.oper.total), subOper(F),"op:formacao:oper") : "") +
    P4.map((l,k)=>kpi(l.nome+" — operacional", ["","t","g","a"][k%4], brl(l.oper.total), subOper(l),"op:"+l.id+":oper")).join("");

  const COLS = [["diesel","Diesel"],["mdo","Mão de obra"],["manut","Manutenção (CRM)"],["insumo","Insumos"],
                ["irrig","Irrigação"],["terc","Terceirização"]];
  const totOperPlano = C.totalOper || 1;
  const linhaOper = (l, cls) => `<tr${cls?` class="${cls}"`:""} data-rastro="op:${l.id}:oper"><td>${l.nome}</td>
      <td class="num calc"${l.base.haOper!=null?` title="${fmt(l.base.haOper)} ha operados nas atividades"`:""}>${rotBase(l.base)}</td>
      ${COLS.map(([k])=>`<td class="num calc">${l.oper[k]?brl(l.oper[k]):"—"}</td>`).join("")}
      <td class="num tot">${brl(l.oper.total)}</td>
      <td class="num tot">${unit(l.oper.total, l.base)}</td>
      <td class="num calc">${fmt(l.oper.total/totOperPlano*100,1)}%</td></tr>`;
  $("#t_oper").innerHTML = th([["Operação"],["Base física",1],...COLS.map(([,n])=>[n,1]),
    ["Custo operacional",1],["Custo unitário",1],["% do operacional",1]])+"<tbody>"+
    (P4.length ? comFormacao(C, l=>linhaOper(l), f=>`<tr class="formacao" data-rastro="op:formacao:oper"><td class="tot">= ${f.nome}
        <span class="hint" style="display:block;margin:0">preparo + plantio + tratos de cana planta</span></td>
      <td class="num tot">${rotBase(f.base)}</td>
      ${COLS.map(([k])=>`<td class="num tot">${f.oper[k]?brl(f.oper[k]):"—"}</td>`).join("")}
      <td class="num tot">${brl(f.oper.total)}</td>
      <td class="num tot">${unit(f.oper.total, f.base)}</td>
      <td class="num tot">${fmt(f.oper.total/totOperPlano*100,1)}%</td></tr>`)
      : `<tr><td colspan="${COLS.length+5}" class="calc">Sem custo: lance quantidades no Plano Operacional.</td></tr>`)+
    `<tr data-rastro="opsoma:oper:principais"><td class="tot">SUBTOTAL DAS OPERAÇÕES PRINCIPAIS</td><td></td>
      ${COLS.map(([k])=>`<td class="num tot">${brl(somaP(l=>l.oper[k]))}</td>`).join("")}
      <td class="num tot">${brl(somaP(l=>l.oper.total))}</td><td></td>
      <td class="num tot">${fmt(somaP(l=>l.oper.total)/totOperPlano*100,1)}%</td></tr>`+
    (OUT.length ? `<tr class="stage"><td colspan="${COLS.length+5}">Outras etapas do plano</td></tr>`+
      OUT.map(l=>linhaOper(l,"sub")).join("") : "")+
    `<tr data-rastro="opsoma:oper:todas"><td class="tot">TOTAL OPERACIONAL DO PLANO</td><td></td>
      ${COLS.map(([k])=>`<td class="num tot">${brl(C.soma(P4.concat(OUT), l=>l.oper[k]))}</td>`).join("")}
      <td class="num tot">${brl(C.totalOper)}</td><td></td><td class="num tot">100,0%</td></tr></tbody>`;
  $("#oper_nota").textContent = R.SEL.parcial ? "Valores do ano todo — o filtro de período da barra de cima não recorta esta página." : "";
}

function pintarContabil(R){
  const C = custoPorOperacao(R);
  const P4 = C.principais, OUT = C.outras;
  const anoTodo = R.SEL.parcial ? " · ano todo" : "";

  const F = C.formacao;
  const rotRat = l => " · rateios "+(l.oper.total>0?"+"+fmt(l.rateio.total/l.oper.total*100,0)+"%":"—");
  // total = operacional + rateios, escrito por extenso em R$/ha
  const subTot = l => !(l.base && l.base.q>0)
    ? (l.contabil>0 ? "sem base física" : "sem volume no plano")+anoTodo
    : unit(l.contabil, l.base)+" = operacional "+unit(l.oper.total, l.base)+" + rateios "+unit(l.rateio.total, l.base)+
      " · "+l.base.rot+anoTodo+(avisoBase(l) ? " · "+avisoBase(l) : "");
  $("#k_contabil").innerHTML =
    (F ? kpi("Formação do canavial — total","g",brl(F.contabil), subTot(F),"op:formacao:contabil") : "") +
    P4.map((l,k)=>kpi(l.nome+" — total", ["","t","g","a"][k%4], brl(l.contabil), subTot(l),"op:"+l.id+":contabil")).join("");

  const RAT = [["apoio","Diesel do apoio"],["arrend","Arrendamento"],["admin","Administrativo"],
               ["deprec","Depreciação"],["gerais","Demais custos gerais"]];
  const tot = R.total || 1;
  const linha = (l, cls) => { const pOper = l.contabil>0 ? l.oper.total/l.contabil*100 : 0;
    const rastro = "";
    return `<tr${cls?` class="${cls}"`:""} data-rastro="op:${l.id}:contabil"><td>${l.nome}</td>
      <td class="num">${brl(l.oper.total)}</td>
      ${RAT.map(([k])=>`<td class="num calc">${l.rateio[k]?brl(l.rateio[k]):"—"}</td>`).join("")}
      <td class="num">${brl(l.rateio.total)}</td>
      <td class="num tot"${rastro}>${brl(l.contabil)}</td>
      <td class="num tot">${unit(l.contabil, l.base)}</td>
      <td class="num calc">${l.oper.total>0?"+"+fmt(l.rateio.total/l.oper.total*100,1)+"%":"—"}</td>
      <td class="num calc">${fmt(l.contabil/tot*100,1)}%</td>
      <td title="${fmt(pOper,0)}% operacional · ${fmt(100-pOper,0)}% rateios"><div class="bar"><i style="width:${Math.min(pOper,100)}%"></i></div></td></tr>`; };
  const somaLinha = (lista, rot) => `<tr><td class="tot">${rot}</td>
      <td class="num tot">${brl(C.soma(lista,l=>l.oper.total))}</td>
      ${RAT.map(([k])=>`<td class="num tot">${brl(C.soma(lista,l=>l.rateio[k]))}</td>`).join("")}
      <td class="num tot">${brl(C.soma(lista,l=>l.rateio.total))}</td>
      <td class="num tot">${brl(C.soma(lista,l=>l.contabil))}</td><td></td>
      <td class="num tot">${(()=>{ const o=C.soma(lista,l=>l.oper.total); return o>0?"+"+fmt(C.soma(lista,l=>l.rateio.total)/o*100,1)+"%":"—"; })()}</td>
      <td class="num tot">${fmt(C.soma(lista,l=>l.contabil)/tot*100,1)}%</td><td></td></tr>`;
  $("#t_contabil").innerHTML = th([["Operação"],["Custo operacional",1],...RAT.map(([,n])=>[n,1]),
    ["Total de rateios",1],["Custo contábil",1],["Custo unitário",1],["Rateio sobre o operacional",1],
    ["% do custo total",1],["Operacional × rateio"]])+"<tbody>"+
    (P4.length ? comFormacao(C, l=>linha(l), f=>{ const pOper = f.contabil>0 ? f.oper.total/f.contabil*100 : 0;
      return `<tr class="formacao" data-rastro="op:formacao:contabil"><td class="tot">= ${f.nome}
        <span class="hint" style="display:block;margin:0">preparo + plantio + tratos de cana planta · ${rotBase(f.base)}</span></td>
      <td class="num tot">${brl(f.oper.total)}</td>
      ${RAT.map(([k])=>`<td class="num tot">${f.rateio[k]?brl(f.rateio[k]):"—"}</td>`).join("")}
      <td class="num tot">${brl(f.rateio.total)}</td>
      <td class="num tot">${brl(f.contabil)}</td>
      <td class="num tot">${unit(f.contabil, f.base)}</td>
      <td class="num tot">${f.oper.total>0?"+"+fmt(f.rateio.total/f.oper.total*100,1)+"%":"—"}</td>
      <td class="num tot">${fmt(f.contabil/tot*100,1)}%</td>
      <td title="${fmt(pOper,0)}% operacional · ${fmt(100-pOper,0)}% rateios"><div class="bar"><i style="width:${Math.min(pOper,100)}%"></i></div></td></tr>`; })
      : `<tr><td colspan="${RAT.length+8}" class="calc">Sem custo: lance quantidades no Plano Operacional.</td></tr>`)+
    somaLinha(P4, "SUBTOTAL DAS OPERAÇÕES PRINCIPAIS").replace("<tr>", '<tr data-rastro="opsoma:contabil:principais">')+
    (OUT.length ? `<tr class="stage"><td colspan="${RAT.length+8}">Outras etapas do plano</td></tr>`+
      OUT.map(l=>linha(l,"sub")).join("") : "")+
    somaLinha(P4.concat(OUT), "CUSTO TOTAL DO PLANO").replace("<tr>", '<tr data-rastro="opsoma:contabil:todas">')+"</tbody>";

  // a soma das operações é o custo do plano; se não fechar, dizer o quanto e por quê
  $("#contabil_nota").textContent =
    (Math.abs(C.diferenca)>1 ? `Custos gerais sem nenhuma operação com custo direto para absorvê-los (${brl(C.diferenca)}) ficam fora desta tabela. ` : "")+
    (R.SEL.parcial ? "Valores do ano todo — o filtro de período da barra de cima não recorta esta página." : "");
}

function pintarCustos(R){
  const ha=P.plantio||1;
  pintarOperacional(R);
  pintarContabil(R);
  $("#k_custo").innerHTML =
    kpi("Custo total","",brl(R.SEL.total), R.SEL.parcial?R.SEL.rotulo:"","total") +
    kpi("Custo variável","t",brl(R.SEL.variavel), R.SEL.parcial?R.SEL.rotulo:"","variavel") +
    kpi("Custo fixo","a",brl(R.SEL.fixo), R.SEL.parcial?R.SEL.meses.length+" meses":"","fixo") +
    (()=>{ const H = custoHaPlantado(R);
      // total da formacao no numero grande; o R$/ha (e a abertura dele) no rastro
      return kpi("Custo de plantar a área","g",brl(H.total),
        H.ha ? fmt(H.ha)+" ha · "+brl(H.valor)+"/ha · "+H.nota+(R.SEL.parcial?" · ano todo":"") : H.nota,"custoha"); })();

  // safra (abril a novembro) × entressafra (dezembro a março)
  const PR = R.PER, perTot = PR.safra.total + PR.entressafra.total;
  const nomeP = p => p==="safra" ? "safra" : "entressafra";
  $("#k_per").innerHTML =
    ["safra","entressafra"].map(p=>{ const o=PR[p];
      return kpi("Custo na "+nomeP(p), p==="safra"?"g":"a", brl(o.total),
        o.meses.join(" · ")+(perTot>0?" — "+fmt(o.total/perTot*100,1)+"% do total":""),"periodo:"+p); }).join("") +
    ["safra","entressafra"].map(p=>{ const o=PR[p];
      return kpi("Média mensal — "+nomeP(p), p==="safra"?"g":"a", o.meses.length?brl(o.total/o.meses.length):"—",
        o.meses.length+(o.meses.length===1?" mês":" meses")+" no orçamento","periodo:"+p); }).join("");

  $("#t_per_cat").innerHTML = th([["Grande conta"],["Safra",1],["% safra",1],["Entressafra",1],["% entressafra",1],["Total",1]])+"<tbody>"+
    Object.keys(CAT_LBL).map(k=>{ const s=PR.safra.cat[k], e=PR.entressafra.cat[k], t=s+e;
      const rs = `data-rastro="cat:${k}:safra"`, re = `data-rastro="cat:${k}:entressafra"`;
      return `<tr><td data-rastro="cat:${k}">${CAT_LBL[k]}</td><td class="num" ${rs}>${brl(s)}</td><td class="num calc" ${rs}>${t>0?fmt(s/t*100,1)+"%":"—"}</td>
        <td class="num" ${re}>${brl(e)}</td><td class="num calc" ${re}>${t>0?fmt(e/t*100,1)+"%":"—"}</td><td class="num tot" data-rastro="cat:${k}">${brl(t)}</td></tr>`; }).join("")+
    `<tr><td class="tot" data-rastro="total">TOTAL</td><td class="num tot" data-rastro="periodo:safra">${brl(PR.safra.total)}</td>
     <td class="num tot" data-rastro="periodo:safra">${perTot>0?fmt(PR.safra.total/perTot*100,1)+"%":"—"}</td><td class="num tot" data-rastro="periodo:entressafra">${brl(PR.entressafra.total)}</td>
     <td class="num tot" data-rastro="periodo:entressafra">${perTot>0?fmt(PR.entressafra.total/perTot*100,1)+"%":"—"}</td><td class="num tot" data-rastro="total">${brl(perTot)}</td></tr></tbody>`;

  const etsP = Object.keys(R.etapaMes).filter(e=>PR.safra.etapa[e]+PR.entressafra.etapa[e]>0.5)
    .sort((a,b)=>(PR.safra.etapa[b]+PR.entressafra.etapa[b])-(PR.safra.etapa[a]+PR.entressafra.etapa[a]));
  const eS = etsP.reduce((s,e)=>s+PR.safra.etapa[e],0), eE = etsP.reduce((s,e)=>s+PR.entressafra.etapa[e],0);
  $("#t_per_etapa").innerHTML = th([["Etapa"],["Safra",1],["Entressafra",1],["Total",1],["% na entressafra",1]])+"<tbody>"+
    (etsP.length ? etsP.map(e=>{ const s=PR.safra.etapa[e], x=PR.entressafra.etapa[e], t=s+x;
      return `<tr><td data-rastro="etapa:${e}">${e}</td><td class="num" data-rastro="etapaper:${e}:safra">${brl(s)}</td>
        <td class="num" data-rastro="etapaper:${e}:entressafra">${brl(x)}</td>
        <td class="num tot" data-rastro="etapa:${e}">${brl(t)}</td>
        <td class="num calc" data-rastro="etapaper:${e}:entressafra">${t>0?fmt(x/t*100,1)+"%":"—"}</td></tr>`; }).join("")
      : `<tr><td colspan="5" class="calc">Sem custo por etapa: lance quantidades no Plano Operacional.</td></tr>`)+
    `<tr><td class="tot" data-rastro="total">TOTAL DAS ETAPAS</td><td class="num tot" data-rastro="periodo:safra">${brl(eS)}</td>
     <td class="num tot" data-rastro="periodo:entressafra">${brl(eE)}</td>
     <td class="num tot" data-rastro="total">${brl(eS+eE)}</td><td class="num tot" data-rastro="periodo:entressafra">${eS+eE>0?fmt(eE/(eS+eE)*100,1)+"%":"—"}</td></tr></tbody>`;
  barrasPeriodo($("#ch_per"), $("#ch_per_leg"), R.meses, R.SEL, periodoMes);
  $("#per_nota").textContent = Math.abs(R.total-(eS+eE))>1
    ? `Custos gerais sem nenhuma etapa com custo direto para absorvê-los (${brl(R.total-(eS+eE))}) aparecem só nas grandes contas.` : "";

  $("#t_custo").innerHTML = th([["Natureza"],["Total",1],["%",1],["R$/ha",1],["Peso"]])+"<tbody>"+
    comps(R).map(([n,v])=>{const p=R.total>0?v/R.total*100:0; const k=NAT_RASTRO[n];
      return `<tr${k?` data-rastro="${k}"`:""}><td>${n}</td><td class="num">${brl(v)}</td><td class="num calc">${fmt(p,1)}%</td>
        <td class="num calc">${brl(v/ha,0)}</td>
        <td><div class="bar"><i style="width:${Math.min(p,100)}%"></i></div></td></tr>`;}).join("")+
    `<tr data-rastro="total"><td class="tot">TOTAL</td><td class="num tot">${brl(R.total)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${brl(R.total/ha,0)}</td><td></td></tr></tbody>`;

  // aqui o mês é linha, não coluna: a mesma classe de período serve, o CSS
  // esconde a linha inteira. Percentual e acumulado passam a ser do período
  // filtrado, senão a última linha visível fecharia em 33% e pareceria erro.
  const base = R.SEL.total || 1;
  $("#t_mensal").innerHTML = th([["Mês"],["Período"],["Custo",1],[R.SEL.parcial?"% do período":"% do total",1],["Acumulado",1],["Curva"]])+"<tbody>"+
    (()=>{let ac=0; return MESES.map((m,i)=>{if(R.SEL.meses.includes(i)) ac+=R.meses[i];
      const p=R.meses[i]/base*100, pa=ac/base*100;
      return `<tr class="${clsMes(i)}" data-rastro="mes:${i}"><td>${m}</td><td>${perTag(i)}</td><td class="num">${brl(R.meses[i])}</td>
        <td class="num calc">${fmt(p,1)}%</td><td class="num calc">${brl(ac)}</td>
        <td><div class="bar"><i style="width:${pa}%"></i></div></td></tr>`;}).join("");})()+"</tbody>";

  const etapasOrd = Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total);
  const totalEtapas = etapasOrd.reduce((s,[,d])=>s+d.total,0)||1;
  const OPS = Object.fromEntries(custoPorOperacao(R).principais.map(l=>[l.id, l]));
  $("#t_unit").innerHTML = th([["Etapa"],["Diesel",1],["Mão de obra",1],["Manutenção",1],["Insumos",1],["Irrigação",1],
    ["Terceirização",1],["Arrendamento",1],["Administrativo",1],["Indireto",1],["Total",1],["% do total",1],["Base física",1],["Custo unitário",1]])+"<tbody>"+
    etapasOrd.map(([e,d])=>{
      const b = baseEtapa(R, e);
      const pp = d.total/totalEtapas*100;
      let h = `<tr data-rastro="etapa:${e}"><td>${e}</td>
        <td class="num calc">${brl(d.diesel)}</td><td class="num calc">${brl(d.mdo)}</td>
        <td class="num calc">${brl(d.manut)}</td>
        <td class="num calc">${brl(d.insumo)}</td><td class="num calc">${d.irrig?brl(d.irrig):"—"}</td><td class="num calc">${brl(d.terc)}</td>
        <td class="num calc">${brl(d.arrend)}</td><td class="num calc">${brl(d.admin||0)}</td>
        <td class="num calc">${brl(d.indireto)}</td>
        <td class="num tot">${brl(d.total)}</td>
        <td class="num calc">${fmt(pp,1)}%</td>
        <td class="num calc">${rotuloBase(b)}</td>
        <td class="num tot">${custoUnit(d.total, b)}</td></tr>`;
      // planta x soca com a irrigação de cada cultura: a divisão antiga deixava a
      // irrigação de fora, e as duas linhas somavam menos que a etapa
      if(e==="TRATOS CULTURAIS"){
        [["soca","Soca"],["planta","Planta"]].forEach(([id,c])=>{const x=OPS[id]; if(!x) return;
          h += `<tr class="sub" data-rastro="op:${id}:contabil"><td class="calc">↳ Cana ${c.toLowerCase()}</td>
            <td colspan="6"></td>
            <td class="num calc">${brl(x.rateio.arrend)}</td><td class="num calc">${brl(x.rateio.admin)}</td>
            <td class="num calc">${brl(x.rateio.deprec+x.rateio.gerais)}</td>
            <td class="num calc">${brl(x.contabil)}</td><td></td>
            <td class="num calc">${rotuloBase(x.base)}</td>
            <td class="num calc">${custoUnit(x.contabil, x.base)}</td></tr>`;});
      }
      return h;}).join("")+
    `<tr data-rastro="total"><td class="tot">TOTAL</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.diesel,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.mdo,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.manut,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.insumo,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+(d.irrig||0),0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.terc,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+d.arrend,0))}</td>
     <td class="num tot">${brl(etapasOrd.reduce((s,[,d])=>s+(d.admin||0),0))}</td>
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

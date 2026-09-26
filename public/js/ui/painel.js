import { linha } from '../calculo/atividade.js';
import { avisoBase, comps, custoCorte, custoHaPlantado, custoPorOperacao, referenciaSetorial } from '../calculo/custo-operacao.js';
import { tabelaColheita, tabelaHa } from '../calculo/modelo-pecege.js';
import { baseEtapa, custoUnit, premissaBase, rotuloBase } from '../calculo/base-fisica.js';
import { CRM_COMP } from '../calculo/crm.js';
import { CAT_LBL, MESES, clsMes, periodoMes } from '../nucleo/calendario.js';
import { P } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { barrasEmpilhadas, barrasLinhas, barrasPeriodo, kpi, rosca, somaSel, tdMeses, th } from './componentes.js';

/* ---------- PAINEL ----------
   Quatro páginas: visão executiva (indicadores, composição, safra ×
   entressafra, fixo × variável e o custo mensal por período), custos por mês
   (grandes contas), etapas e operações (R$/ha e R$/t, com as tabelas no modelo
   da referência setorial) e composição e referência. Todo número, fatia e
   barra tem rastro: a dica ao passar o mouse e o detalhamento no clique. Os
   gráficos seguem o período da barra do topo; as tabelas por operação são do
   ano (R$/ha e R$/t não mudam com o recorte). */
// cor de cada grande conta (CAT_LBL): a mesma em todos os gráficos do Painel
const COR_CAT = {mdo:"#2A57A0", manut:"#A5503A", diesel:"#C9A45C", insumo:"#2E8540", irrig:"#2F9FB2",
  terc:"#7B5EA7", tpess:"#8A94A6", arrend:"#5B6B7F", fixo:"#B39A7A", espor:"#D9822B"};
// composição detalhada (comps) → grande conta (cor) e chave do rastro
const COMP = {"Mão de obra direta":["mdo","nat:mdo"], "MDO equipamentos de apoio":["mdo","frota:apoio"],
  "MDO quadro ADM agrícola":["mdo","cat:mdo"], "MDO quadro da oficina":["mdo","cat:mdo"], "MDO apoio operacional":["mdo","cat:mdo"],
  "FAT (contrato suspenso)":["mdo","cat:mdo"], "Combustível (diesel)":["diesel","cat:diesel"], "Manutenção e materiais":["manut","cat:manut"],
  "Insumos agronômicos":["insumo","cat:insumo"], "Irrigação e fertirrigação":["irrig","cat:irrig"], "Transporte de pessoal":["tpess","cat:tpess"],
  "Terceirização de aplicações":["terc","nat:terc"], "Terceirizações (contratos)":["terc","cat:terc"], "Custos esporádicos":["espor","cat:espor"],
  "Arrendamento":["arrend","cat:arrend"], "Administração":["fixo","nat:admin"], "Depreciação":["fixo","cat:fixo"]};
const COR_SAFRA = "var(--leaf)", COR_ENTRE = "var(--warn)";
const reais = v => brl(v);
const mi = v => fmt(v/1e6,1);
const nomeEtapa = e => String(e||"").charAt(0) + String(e||"").slice(1).toLowerCase();

function pintarPainel(R){
  pintarModeloPecege(R);
  const ha=P.plantio||1, colh=R.etapas["COLHEITA"], tonEtapa=colh?colh.ton:0;
  // custo de colheita em sentido estrito: o corte, sem transporte nem transbordo
  // (calculo/custo-operacao.js, custoCorte -- a mesma conta do rastro)
  const CC = custoCorte(R);
  const bColh = baseEtapa(R, "COLHEITA");
  const noFat = R.PS && R.PS.fat ? R.PS.fat.pico : 0;
  const SEL = R.SEL;
  $("#k_painel").innerHTML =
    kpi("Custo total","",brl(SEL.total), SEL.parcial?SEL.rotulo:"","total") +
    (()=>{ const H = custoHaPlantado(R);
      // R$/ha no numero grande; o total de plantar a area logo abaixo
      return kpi("Custo por ha plantado","t",brl(H.valor)+"/ha",
        (H.ha ? brl(H.total)+" para plantar "+fmt(H.ha)+" ha · " : "")+H.nota+(SEL.parcial?" · ano todo":""),"custoha"); })() +
    kpi("Custo de colheita","g",custoUnit(CC.total, CC.base),"só corte ("+(CC.cods.join(", ")||"—")+"), sem transporte · "+rotuloBase(CC.base),"corte") +
    kpi("Efetivo total","a",fmt(R.efetivoTotal)+" pessoas", noFat ? "+ "+fmt(noFat)+" no FAT, fora da operação" : "","pessoas:total") +
    kpi("Custo na safra","g",brl(R.PER.safra.total),"abr a nov · "+R.PER.safra.meses.length+" meses no orçamento","periodo:safra") +
    kpi("Custo na entressafra","a",brl(R.PER.entressafra.total),"dez a mar · "+R.PER.entressafra.meses.length+" meses no orçamento","periodo:entressafra") +
    kpi("Custo variável","t",brl(SEL.variavel), (SEL.total>0?fmt(SEL.variavel/SEL.total*100,1):"0")+"% do custo"+(SEL.parcial?" · "+SEL.rotulo:""),"variavel") +
    kpi("Custo fixo","",brl(SEL.fixo), "arrendamento, administração e depreciação · "+(SEL.total>0?fmt(SEL.fixo/SEL.total*100,1):"0")+"%","fixo");
  // planta x soca pela divisão que inclui a irrigação de cada cultura (aba
  // Custos). Cana planta e a formação do canavial dividem pela área plantada;
  // cana soca, por hectare operado.
  const OP = custoPorOperacao(R), op = id => OP.principais.find(l=>l.id===id);
  const unitHa = l => l ? custoUnit(l.contabil, l.base) : "—";
  const soca = op("soca"), planta = op("planta"), F = OP.formacao;
  /* Custo TOTAL por hectare (operação + rateios), o mesmo da página "Custo
     total" da aba Custos. A página "Custo operacional" de lá mostra só o
     custo direto; aqui a parcela operacional vem escrita embaixo, para os
     números das duas telas baterem à vista. */
  const partes = l => l && l.base && l.base.q>0
    ? "operacional "+custoUnit(l.oper.total, l.base)+" + rateios "+custoUnit(l.rateio.total, l.base)+" · "
    : "";
  const aviso = l => avisoBase(l) ? " · "+avisoBase(l) : "";
  $("#k_tratos").innerHTML =
    (F ? kpi("Formação do canavial — total","g",unitHa(F),
        partes(F)+brl(F.contabil)+" ÷ "+rotuloBase(F.base)+aviso(F),"op:formacao:contabil") : "") +
    kpi("Tratos cana soca — total","t",unitHa(soca),
        soca ? partes(soca)+brl(soca.contabil)+" ÷ "+rotuloBase(soca.base)+aviso(soca) : "—","op:soca:contabil") +
    kpi("Tratos cana planta — total","g",unitHa(planta),
        planta ? partes(planta)+brl(planta.contabil)+" ÷ "+rotuloBase(planta.base)+aviso(planta) : "—","op:planta:contabil") +
    kpi("Etapa colheita (c/ transporte)","",colh?custoUnit(colh.total, bColh):"—","corte + transporte + transbordo · "+rotuloBase(bColh),"op:colheita") +
    kpi("CRM total","a",brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)),"","frota:crm") +
    kpi("CRM por hora média","",R.horasT>0?brl(CRM_COMP.reduce((s,k)=>s+R.crmComp[k],0)/R.horasT,2)+"/h":"—","","frota:crm") +
    kpi("Diesel projetado","t",fmt(R.CB.litrosT)+" L",
        brl(R.dieselT)+(R.CB.litrosT>0?" · "+brl(R.dieselT/R.CB.litrosT,2)+"/L":""),"diesel:total") +
    kpi("Arrendamento","a",R.AR.area>0?brl(R.AR.anual/R.AR.area,0)+"/ha/ano":"—",
        brl(R.arrT)+" no orçamento · "+fmt(R.AR.area)+" ha","nat:arrend");

  // os rotulos sao os de CAT_LBL: uma lista so de grandes contas no app
  const catLbl = CAT_LBL;
  const catKeys = Object.keys(catLbl);
  // rastro de uma grande conta no recorte: só safra e entressafra têm chave de período
  const sufP = SEL.parcial && !SEL.manual && (SEL.periodo==="safra" || SEL.periodo==="entressafra") ? ":"+SEL.periodo : "";
  const catNoRec = k => somaSel(R.mesesCat[k], SEL);

  /* ---- visão executiva: roscas e custo mensal por período ---- */
  const totRec = catKeys.reduce((s,k)=>s+catNoRec(k),0);
  rosca($("#ch_pn_cat"), $("#ch_pn_cat_leg"), catKeys.map(k=>({l:catLbl[k], v:catNoRec(k), cor:COR_CAT[k], rastro:"cat:"+k+sufP}))
    .sort((a,b)=>b.v-a.v), {v:totRec, txt:mi(totRec), l:"R$ milhões"}, reais);
  rosca($("#ch_pn_per"), $("#ch_pn_per_leg"), [
      {l:"Safra (abr–nov)", v:R.PER.safra.total, cor:COR_SAFRA, rastro:"periodo:safra"},
      {l:"Entressafra (dez–mar)", v:R.PER.entressafra.total, cor:COR_ENTRE, rastro:"periodo:entressafra"}],
    {v:R.total, txt:mi(R.total), l:"R$ milhões no ano"}, reais);
  rosca($("#ch_pn_fix"), $("#ch_pn_fix_leg"), [
      {l:"Variável", v:SEL.variavel, cor:"#2A57A0", rastro:"variavel"},
      {l:"Fixo (arrendamento, administração, depreciação)", v:SEL.fixo, cor:"#B39A7A", rastro:"fixo"}],
    {v:SEL.total, txt:mi(SEL.total), l:"R$ milhões"+(SEL.parcial?" no período":"")}, reais);
  barrasPeriodo($("#ch_mes"), $("#ch_mes_leg"), R.meses, SEL, periodoMes);

  /* ---- custos por mês: grandes contas empilhadas ---- */
  barrasEmpilhadas($("#ch_pn_catmes"), $("#ch_pn_catmes_leg"), {meses:SEL.meses,
    series: catKeys.map(k=>({nome:catLbl[k], cor:COR_CAT[k], vals:R.mesesCat[k], rastro:i=>`cat:${k}:${periodoMes(i)}`,
      rastroLeg:"cat:"+k+sufP})).filter(sr=>SEL.meses.some(i=>sr.vals[i]>0.5)),
    linha:null, rastroCol:i=>"mes:"+i, fmt:v=>mi(v), fmtLeg:v=>"R$ "+fmt(v/1e6,2)+" mi"});

  const totMes = MESES.map((m,i)=>catKeys.reduce((s,k)=>s+R.mesesCat[k][i],0));
  $("#t_grandes").innerHTML = th([["Conta"],...MESES.map((m,i)=>[`${m}<br><small>${periodoMes(i)==="safra"?"safra":"entressafra"}</small>`,1,clsMes(i)]),
      [SEL.parcial?"Total do período":"Total",1],["Safra",1],["Entressafra",1]])+"<tbody>"+
    catKeys.map(k=>{const linha=R.mesesCat[k];
      return `<tr><td data-rastro="cat:${k}"><i class="cc-cor" style="background:${COR_CAT[k]}"></i>${catLbl[k]}</td>`+tdMeses(linha, v=>brl(v,0), "num calc", (v,i)=>`cat:${k}:${periodoMes(i)}`)+
        `<td class="num tot" data-rastro="cat:${k}">${brl(somaSel(linha, SEL))}</td>`+
        `<td class="num" data-rastro="cat:${k}:safra">${brl(R.PER.safra.cat[k])}</td>`+
        `<td class="num" data-rastro="cat:${k}:entressafra">${brl(R.PER.entressafra.cat[k])}</td></tr>`;}).join("")+
    `<tr><td class="tot" data-rastro="total">TOTAL</td>`+tdMeses(totMes, v=>brl(v,0), "num tot", (v,i)=>"mes:"+i)+
    `<td class="num tot" data-rastro="total">${brl(somaSel(totMes, SEL))}</td>`+
    `<td class="num tot" data-rastro="periodo:safra">${brl(R.PER.safra.total)}</td>`+
    `<td class="num tot" data-rastro="periodo:entressafra">${brl(R.PER.entressafra.total)}</td></tr></tbody>`;

  /* ---- etapas e operações ---- */
  const etapas = Object.entries(R.etapas).map(([e,d])=>({e, v: SEL.parcial && SEL.etapa ? num(SEL.etapa[e]) : d.total}))
    .filter(x=>x.v>0.5).sort((a,b)=>b.v-a.v);
  const totEt = etapas.reduce((s,x)=>s+x.v,0);
  barrasLinhas($("#ch_pn_etapa"), etapas.map(x=>({l:nomeEtapa(x.e), a:x.v, num:brl(x.v),
      dir:(totEt>0?fmt(x.v/totEt*100,1):"0")+"%", rastro: sufP ? `etapaper:${x.e}${sufP}` : "etapa:"+x.e})), {corA:"#2A57A0"});
  const opsHa = [F ? {id:"formacao", nome:"Formação do canavial", l:F} : null]
    .concat(["preparo","plantio","planta","soca"].map(id=>({id, nome:(OP.principais.find(l=>l.id===id)||{}).nome, l:op(id)})))
    .filter(x=>x && x.l && x.l.base && x.l.base.q>0 && x.l.contabil>0);
  $("#ch_pn_opha_leg").innerHTML = `<span><i style="background:#2A57A0"></i>Operacional (custo direto)</span>
    <span><i style="background:#C9A45C"></i>Total (operacional + rateios)</span>`;
  barrasLinhas($("#ch_pn_opha"), opsHa.map(x=>({l:x.nome, a:x.l.oper.total/x.l.base.q, b:x.l.contabil/x.l.base.q,
      num:brl(x.l.oper.total/x.l.base.q,0)+" / "+brl(x.l.contabil/x.l.base.q,0),
      dir:fmt(x.l.base.q)+" "+(x.l.base.un||"ha")+(avisoBase(x.l) ? " ⚠" : ""), dirCls: avisoBase(x.l) ? "sobra" : "",
      rastro:"op:"+x.id+":contabil"})), {corA:"#2A57A0", corB:"#C9A45C"});
  // CTTA em R$/t: corte, transbordo, transporte e apoio + adm (tabelaColheita, a mesma da tabela)
  const TC = tabelaColheita(R), qT = TC.base && TC.base.q>0 ? TC.base.q : 0;
  const ctta = [["corte","Corte","corte"],["transbordo","Transbordo","op:colheita"],["transporte","Transporte","op:colheita"],
    ["a","Apoio + administrativo","op:colheita"]].map(([k,rot,ir])=>({l:rot, v: qT ? num(TC.tot[k])/qT : 0, ir}));
  const cttaTot = qT ? num(TC.tot.ctta)/qT : 0;
  barrasLinhas($("#ch_pn_ctta"), qT ? ctta.map(x=>({l:x.l, a:x.v, num:brl(x.v,2)+"/t",
      dir:(cttaTot>0?fmt(x.v/cttaTot*100,1):"0")+"% do CTTA", rastro:x.ir})) : [], {corA:"#C9A45C"});
  $("#ch_pn_ctta_nota").textContent = qT ? `CTTA: ${brl(cttaTot,2)}/t sobre ${fmt(qT)} ${TC.base.rot||"t"}.` : "Sem volume de colheita no plano.";

  /* ---- composição e referência ---- */
  const cp = comps(R).filter(([,v])=>v>0.5).sort((a,b)=>b[1]-a[1]);
  const totCp = cp.reduce((s,[,v])=>s+v,0);
  barrasLinhas($("#ch_comp"), cp.map(([l,v])=>({l, a:v, cor:COR_CAT[(COMP[l]||[])[0]]||"#2A57A0", num:brl(v),
      dir:(totCp>0?fmt(v/totCp*100,1):"0")+"%", rastro:(COMP[l]||[])[1]||"total"})), {corA:"#2A57A0"});

  const B = referenciaSetorial(R);
  $("#ch_bench_leg").innerHTML = `<span><i style="background:#2A57A0"></i>Projetado (% do custo)</span>
    <span><i style="background:#B39A7A"></i>Referência do setor</span>`;
  barrasLinhas($("#ch_bench"), B.grupos.map(g=>({l:g.curto, a:g.pct, b:g.ref, num:fmt(g.pct,1)+"% / "+fmt(g.ref,0)+"%",
      dir:(g.desvio>0?"+":"")+fmt(g.desvio,1)+" p.p. · "+g.leitura, dirCls: g.leitura==="Acima" ? "falta" : g.leitura==="Abaixo" ? "sobra" : "",
      rastro:"bench:"+g.id})), {corA:"#2A57A0", corB:"#B39A7A"});
  $("#t_bench").innerHTML = th([["Componente"],["Projetado",1],["% projetado",1],["% referência",1],["Desvio",1],["Leitura"]])+"<tbody>"+
    B.grupos.map(g=>{ const cls = g.leitura==="Aderente" ? "b-ok" : g.leitura==="Acima" ? "b-bad" : "b-warn";
      return `<tr data-rastro="bench:${g.id}"><td>${g.nome}</td><td class="num">${brl(g.v)}</td><td class="num calc">${fmt(g.pct,1)}%</td>
        <td class="num calc">${g.ref},0%</td><td class="num">${fmt(g.desvio,1)} p.p.</td>
        <td><span class="badge ${cls}">${g.leitura}</span></td></tr>`;}).join("")+
    `<tr data-rastro="total"><td class="tot">TOTAL</td><td class="num tot">${brl(B.total)}</td>
      <td class="num tot">${fmt(R.total>0?B.total/R.total*100:0,1)}%</td><td class="num tot">100,0%</td><td></td><td></td></tr></tbody>`;
  $("#bl_pn_sub").textContent = `${brl(SEL.total)}${SEL.parcial ? " · "+SEL.rotulo : ""}`;
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
  ["pecege","Base de comparação (operação + insumos + administrativo)",0,"sub"],
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
    ? `Mudas: o custo da colheita, do transbordo e do transporte de muda (${brl(H.custoMuda)}, com a parte delas nos rateios da colheita) está na etapa Colheita do Plano Operacional; aqui, como na referência setorial, entra no plantio como insumo — e sai do CTTA. `
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
    `<th class="num pec-c-${k}">${n}</th>`).join("")}</tr></thead><tbody>`+
    LIN.map(([k,rot,tipo])=>`<tr class="${tipo==="tot"?"pec-tot":tipo==="a"?"pec-n1 pec-a":"pec-n1"}"><td>${rot}</td>${
      COLS.map(([c])=>{ const v = valor(c,k); return `<td class="num pec-c-${c}">${v==null?"-":t1(v)}</td>`; }).join("")}</tr>`).join("")+
    "</tbody>";
  $("#pec_colh_nota").textContent =
    `R$ por tonelada, sobre ${q?fmt(q)+" "+(b.rot||"t")+(b.fonte==="premissa"?" (premissa)":" (soma do corte lançado)"):"volume não informado"}. `+
    `Atividades: ${C.ativ.join(", ")}; colheita e transporte de muda ficam no plantio. `+
    (C.arrend>0.5 && q ? `Arrendamento rateado à colheita, fora do CTTA: ${brl(C.arrend/q,2)}/t.` : "");
}

export { pintarPainel };

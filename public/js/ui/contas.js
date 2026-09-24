import { tarifaTerc, tarifaTercDe, temDetalheTerc } from '../calculo/atividade.js';
import { CONTA_COMBINADA, SEM_CONTA, contasOrigens, contasValores, totaisContas } from '../calculo/contas.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { CONTAS_CD, CONTAS_CLS, CONTAS_GRUPO } from '../nucleo/estado.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { codExibir } from '../nucleo/codigo-atividade.js';
import { barrasEmpilhadas, barrasLinhas, kpi, rosca, th } from './componentes.js';

/* ---------- PLANO DE CONTAS ----------
   O mapeamento das contas mora em calculo/contas.js — a tela, o relatório, o
   rastro e a Validação leem o mesmo. Esta tela tem o painel (gráficos), a
   tabela das contas com o subtotal de cada grupo e a terceirização.

   O filtro de grupo, classificação (fixo/variável) e custo/despesa é só de
   visão (não grava) e vale para o painel e para a tabela. As linhas sem conta
   no plano de contas não têm classificação: aparecem quando o filtro de
   classificação e o de custo/despesa estão em "todos". Todo número tem rastro
   (conta:<código> e contas:grupo:<grupo>, calculo/rastro.js): a dica ao passar
   o mouse e de onde vem cada real no clique. */
const GRUPO_SEM_CONTA = "Sem conta no plano";
const COR_GRUPO = ["#2A57A0","#A5503A","#C9A45C","#7B5EA7","#2E8540","#5B6B7F","#B39A7A","#2F9FB2"];
const COR_SEM = COR_GRUPO[6];
const COR_CLS = {"Variável":"#2A57A0", "Fixo":"#C9A45C"};
const COR_CD  = {"Custo":"#2E8540", "Despesa":"#A5503A"};
/* Grandes contas do motor (mesesCat) por grupo do plano de contas, para o
   gráfico mensal. O que não tem conta própria (insumos sem classe, FAT) está
   dentro da natureza dele; os esporádicos formam a série "sem conta". */
const MES_DO_GRUPO = {"1. MDO":["mdo"], "2. Manutenção":["manut"], "3. Combustível":["diesel"],
  "4. Terceirização":["terc","tpess"], "5. Insumos":["insumo","irrig"], "6. Capital":["arrend","fixo"],
  [GRUPO_SEM_CONTA]:["espor"]};

const gruposDoPlano = () => [...new Set(CFG.contas.map(c=>c.grupo))];
const corDoGrupo = g => { if(g===GRUPO_SEM_CONTA) return COR_SEM;
  const i = gruposDoPlano().indexOf(g); return i<0 ? COR_GRUPO[7] : COR_GRUPO[i % 6]; };
const pctDe = (v, t) => t>0 ? fmt(v/t*100,1)+"%" : "—";
const valorConta = (CV, c) => CONTA_COMBINADA[c.conta] ? 0 : (CV[c.conta]||0);
const filtrado = () => CONTAS_GRUPO!=="todos" || CONTAS_CLS!=="todos" || CONTAS_CD!=="todos";

// o recorte: contas do cadastro que passam no filtro, e as linhas sem conta quando cabem
function recorte(CV){
  const passa = c => (CONTAS_GRUPO==="todos" || c.grupo===CONTAS_GRUPO)
    && (CONTAS_CLS==="todos" || c.cls===CONTAS_CLS) && (CONTAS_CD==="todos" || c.cd===CONTAS_CD);
  const contas = CFG.contas.filter(passa).map(c=>({...c, v:valorConta(CV, c)}));
  const semCabe = (CONTAS_GRUPO==="todos" || CONTAS_GRUPO===GRUPO_SEM_CONTA) && CONTAS_CLS==="todos" && CONTAS_CD==="todos";
  const sem = semCabe ? Object.entries(SEM_CONTA).map(([k,rot])=>({conta:k, desc:rot, grupo:GRUPO_SEM_CONTA, v:CV[k]||0}))
    .filter(x=>x.v>0.5) : [];
  const total = contas.reduce((s,c)=>s+c.v,0) + sem.reduce((s,x)=>s+x.v,0);
  return {contas, sem, total};
}

function pintarFiltroContas(CV){
  const gs = gruposDoPlano();
  const semTot = Object.keys(SEM_CONTA).reduce((s,k)=>s+(CV[k]||0),0);
  const doGrupo = g => CFG.contas.filter(c=>c.grupo===g).reduce((s,c)=>s+valorConta(CV, c),0);
  $("#sel_cc_grupo").innerHTML = `<option value="todos">Todos os grupos</option>` +
    gs.map(g=>`<option value="${esc(g)}"${g===CONTAS_GRUPO?" selected":""}>${esc(g)}</option>`).join("") +
    (semTot>0.5 ? `<option value="${GRUPO_SEM_CONTA}"${CONTAS_GRUPO===GRUPO_SEM_CONTA?" selected":""}>${GRUPO_SEM_CONTA}</option>` : "");
  $("#sel_cc_cls").value = CONTAS_CLS;
  $("#sel_cc_cd").value = CONTAS_CD;
  $("#btn_cc_limpar").hidden = !filtrado();
  $("#cc_filtro_nota").textContent = filtrado()
    ? "Filtrado: "+[CONTAS_GRUPO!=="todos"?CONTAS_GRUPO:"", CONTAS_CLS!=="todos"?CONTAS_CLS:"", CONTAS_CD!=="todos"?CONTAS_CD:""]
        .filter(Boolean).join(" › ")+". O painel e a tabela mostram só o recorte; os cartões do topo são do plano inteiro." : "";
  // atalhos por grupo, com o valor de cada um: um clique filtra
  $("#cc_chips").innerHTML = [["todos","Todos os grupos", gs.reduce((s,g)=>s+doGrupo(g),0)+semTot]]
    .concat(gs.map(g=>[g, g, doGrupo(g)]))
    .concat(semTot>0.5 ? [[GRUPO_SEM_CONTA, GRUPO_SEM_CONTA, semTot]] : [])
    .map(([id,rot,v])=>`<button type="button" class="cc-chip${id===CONTAS_GRUPO?" on":""}" data-ccgrupo="${esc(id)}"
      title="Mostrar só ${esc(rot)}">${id!=="todos"?`<i style="background:${corDoGrupo(id)}"></i>`:""}<span>${esc(rot)}</span><b>${brl(v)}</b></button>`).join("");
}

/* ---------- painel ---------- */
function pintarPainelContas(R, CV, REC){
  const {contas, sem, total} = REC;
  const {total: totPlano} = totaisContas(CV);
  const com = contas.filter(c=>c.v>0.5);
  const soma = f => contas.filter(f).reduce((s,c)=>s+c.v,0);
  const vVar = soma(c=>c.cls==="Variável"), vFix = soma(c=>c.cls==="Fixo");
  const vSem = sem.reduce((s,x)=>s+x.v,0);
  const maior = [...com, ...sem].sort((a,b)=>b.v-a.v)[0];
  const kRec = CONTAS_GRUPO!=="todos" ? "contas:grupo:"+CONTAS_GRUPO : "contas:total";
  $("#k_cc_painel").innerHTML =
    kpi(filtrado() ? "Custo no recorte" : "Custo do plano nas contas","",brl(total),
        pctDe(total, totPlano)+" do custo do plano · "+(com.length+sem.length)+" contas com valor", kRec) +
    kpi("Variável","t",brl(vVar), pctDe(vVar, total)+" do recorte", kRec) +
    kpi("Fixo","a",brl(vFix), pctDe(vFix, total)+" do recorte"+(vSem>0.5 ? " · "+brl(vSem)+" sem conta" : ""), kRec) +
    kpi("Maior conta","g", maior ? brl(maior.v) : "—",
        maior ? esc((maior.grupo===GRUPO_SEM_CONTA ? "" : maior.conta+" · ")+maior.desc)+" · "+pctDe(maior.v, total) : "", maior ? "conta:"+maior.conta : "");

  // roscas: grupo, fixo × variável, custo × despesa
  const porGrupo = {};
  contas.forEach(c=>{ porGrupo[c.grupo] = (porGrupo[c.grupo]||0) + c.v; });
  if(vSem>0.5) porGrupo[GRUPO_SEM_CONTA] = vSem;
  // o centro em R$ milhões; a legenda, em reais
  const centro = {v:total, txt:fmt(total/1e6,1), l:"R$ milhões"}, reais = v=>brl(v);
  rosca($("#ch_cc_grupo"), $("#ch_cc_grupo_leg"), Object.entries(porGrupo).map(([g,v])=>({l:g, v, cor:corDoGrupo(g),
    rastro:"contas:grupo:"+g})), centro, reais);
  const semFatia = vSem>0.5 ? [{l:GRUPO_SEM_CONTA, v:vSem, cor:COR_SEM, rastro:"contas:grupo:"+GRUPO_SEM_CONTA}] : [];
  rosca($("#ch_cc_cls"), $("#ch_cc_cls_leg"), ["Variável","Fixo"].map(k=>({l:k, v:soma(c=>c.cls===k), cor:COR_CLS[k], rastro:kRec}))
    .concat(semFatia), centro, reais);
  rosca($("#ch_cc_cd"), $("#ch_cc_cd_leg"), ["Custo","Despesa"].map(k=>({l:k, v:soma(c=>c.cd===k), cor:COR_CD[k], rastro:kRec}))
    .concat(semFatia), centro, reais);

  // custo mensal por grupo (grandes contas do motor), nos meses do período, em R$ mil
  const SEL = R.SEL;
  const gs = [...gruposDoPlano(), GRUPO_SEM_CONTA].filter(g=>CONTAS_GRUPO==="todos" || g===CONTAS_GRUPO);
  const serieDe = g => Array.from({length:NM}, (_,i)=>(MES_DO_GRUPO[g]||[]).reduce((s,k)=>s+(+((R.mesesCat[k]||[])[i])||0),0));
  const series = gs.map(g=>({nome:g, cor:corDoGrupo(g), vals:serieDe(g),
    rastro:i=>"mes:"+i, rastroLeg:"contas:grupo:"+g})).filter(s=>s.vals.some(v=>v>0));
  barrasEmpilhadas($("#ch_cc_mes"), $("#ch_cc_mes_leg"), {meses:SEL.meses, series, linha:null, rastroCol:i=>"mes:"+i,
    fmt:v=>fmt(v/1e6,1), fmtLeg:v=>"R$ "+fmt(v/1e6,2)+" mi"});
  $("#ch_cc_mes_nota").textContent = "Valores em R$ milhões, pela grande conta de cada natureza no mês — o mesmo critério do custo mensal do Painel."+
    (CONTAS_CLS!=="todos" || CONTAS_CD!=="todos" ? " O filtro de classificação e de custo/despesa não se aplica ao mês a mês." : "")+
    " O que não tem conta própria (insumo sem classe, FAT) está no grupo da sua natureza.";

  // contas com maior valor
  const TOPO = 15, ord = [...com, ...sem].sort((a,b)=>b.v-a.v);
  barrasLinhas($("#ch_cc_top"), ord.slice(0,TOPO).map(c=>({
      l:(c.grupo===GRUPO_SEM_CONTA ? "" : c.conta+" · ")+c.desc, a:c.v, cor:corDoGrupo(c.grupo),
      num:brl(c.v), dir:pctDe(c.v, total), rastro:"conta:"+c.conta})), {corA:COR_GRUPO[0]});
  $("#ch_cc_top_nota").textContent = ord.length>TOPO ? `As ${TOPO} maiores de ${ord.length} contas com valor. Todas estão na página Contas.` : "";
  $("#bl_cc_sub").textContent = `${brl(total)} · ${com.length+sem.length} contas com valor`+(filtrado() ? " no recorte" : "");
  /* Produto SEM GRUPO e o unico caso que a pessoa resolve na aba Insumos --
     adjuvante e regulador tem grupo e agora caem na INS-06. O aviso antigo
     dizia "sem grupo agronomico" para produtos que tinham grupo, e mandava
     procurar na aba Insumos um campo que ja estava preenchido. */
  const semGrupo = (contasOrigens(R)["__insumos"]||[]).filter(o=>o.v>0.5);
  const vSemGrupo = semGrupo.reduce((s,o)=>s+o.v,0);
  $("#cc_alerta").innerHTML = vSemGrupo>0.5
    ? `<span data-rastro="conta:__insumos"><b>${semGrupo.length} insumo${semGrupo.length>1?"s":""} sem grupo somam ${brl(vSemGrupo)}</b>
       (${pctDe(vSemGrupo, totPlano)} do custo) e ficam fora das contas INS-01 a INS-06 — ${semGrupo.slice(0,4).map(o=>esc(o.rot)).join(", ")}${semGrupo.length>4?", …":""}.
       São os produtos do bloco <b>Outros e a Classificar</b> do Cadastro de Insumos: escolha o grupo de cada um
       (coluna <b>Grupo</b>) para ele cair na conta certa. Adjuvante, regulador e grupo criado por você já têm
       conta — a INS-06.</span>` : "";
  $("#cc_alerta").hidden = !(vSemGrupo>0.5);
}

/* ---------- tabela das contas, com o subtotal de cada grupo ---------- */
function pintarTabelaContas(R, CV, REC){
  const {contas, sem, total} = REC;
  const {mapeado, total: somaContas} = totaisContas(CV);
  const base = somaContas || 1;
  let ct = th([["Conta"],["Descrição"],["Natureza"],["Classificação"],["Custo/Despesa"],
    ["Direcionador"],["Custo projetado",1],["% do custo do plano",1]])+"<tbody>";
  [...new Set(contas.map(c=>c.grupo))].forEach(g=>{
    const cs = contas.filter(c=>c.grupo===g), sub = cs.reduce((s,c)=>s+c.v,0);
    ct += `<tr class="stage"><td colspan="8"><span><i class="cc-cor" style="background:${corDoGrupo(g)}"></i>${esc(g)}</span>
      <span style="font-weight:400;opacity:.8"> · ${cs.length} conta${cs.length>1?"s":""} · ${brl(sub)}</span></td></tr>`;
    cs.forEach(c=>{
      const comb = CONTA_COMBINADA[c.conta];
      ct += `<tr data-rastro="conta:${esc(c.conta)}"><td>${esc(c.conta)}</td><td>${esc(c.desc)}</td>
        <td class="calc">${esc(c.nat)}</td>
        <td><span class="badge ${c.cls==="Fixo"?"b-warn":"b-ok"}">${esc(c.cls)}</span></td>
        <td><span class="badge ${c.cd==="Custo"?"b-ok":"b-warn"}">${esc(c.cd)}</span></td>
        <td class="calc">${esc(c.dir)}</td>
        <td class="num ${c.v>0.5?"tot":"calc"}">${comb ? "incluído em "+comb : c.v>0.5 ? brl(c.v) : "—"}</td>
        <td class="num calc">${c.v>0.5 ? pctDe(c.v, base) : ""}</td></tr>`;
    });
    ct += `<tr class="cc-sub" data-rastro="contas:grupo:${esc(g)}"><td colspan="6">Subtotal ${esc(g)}</td>
      <td class="num tot">${brl(sub)}</td><td class="num tot">${pctDe(sub, base)}</td></tr>`;
  });
  if(!filtrado()) ct += `<tr class="cc-tot"><td colspan="6">TOTAL MAPEADO ÀS CONTAS</td>
    <td class="num tot">${brl(mapeado)}</td><td class="num tot">${pctDe(mapeado, base)}</td></tr>`;
  // o que não tem conta no plano aparece aqui, para a soma fechar com o custo total
  if(sem.length){
    const subSem = sem.reduce((s,x)=>s+x.v,0);
    ct += `<tr class="stage" id="contas_semconta"><td colspan="8"><span><i class="cc-cor" style="background:${COR_SEM}"></i>${GRUPO_SEM_CONTA}</span></td></tr>` +
      sem.map(x=>`<tr data-rastro="conta:${esc(x.conta)}"><td class="calc">—</td><td>${esc(x.desc)}</td><td colspan="4"></td>
        <td class="num">${brl(x.v)}</td><td class="num calc">${pctDe(x.v, base)}</td></tr>`).join("") +
      `<tr class="cc-sub" data-rastro="contas:grupo:${GRUPO_SEM_CONTA}"><td colspan="6">Subtotal sem conta no plano</td>
        <td class="num tot">${brl(subSem)}</td><td class="num tot">${pctDe(subSem, base)}</td></tr>`;
  }
  if(!contas.length && !sem.length) ct += `<tr><td colspan="8" class="calc">Nenhuma conta no recorte.</td></tr>`;
  ct += filtrado()
    ? `<tr class="cc-tot"><td colspan="6">TOTAL DO RECORTE</td><td class="num tot">${brl(total)}</td><td class="num tot">${pctDe(total, base)}</td></tr>`
    : `<tr class="cc-tot"><td colspan="6">TOTAL — CONFERE COM O CUSTO DO PLANO</td>
       <td class="num tot">${brl(somaContas)}</td><td class="num tot">${Math.abs(somaContas-R.total)<=1 ? "confere" : "dif. "+brl(somaContas-R.total)}</td></tr>`;
  $("#t_contas").innerHTML = ct + "</tbody>";
}

function pintarContas(R){
  const fix=CFG.contas.filter(c=>c.cls==="Fixo").length;
  const vari=CFG.contas.filter(c=>c.cls==="Variável").length;
  const CV = contasValores(R);
  const {mapeado, semConta} = totaisContas(CV);
  $("#k_cc").innerHTML =
    kpi("Contas cadastradas","",CFG.contas.length,"","contas:total") +
    kpi("Variáveis","t",vari,"","contas:total") + kpi("Fixas","a",fix,"","contas:total") +
    kpi("Custo mapeado às contas","g",brl(mapeado),fmt(R.total>0?mapeado/R.total*100:0,1)+"% do custo total"+
      (semConta>0?" · "+brl(semConta)+" sem conta":""),"contas:total");

  pintarFiltroContas(CV);
  const REC = recorte(CV);
  pintarPainelContas(R, CV, REC);
  pintarTabelaContas(R, CV, REC);

  $("#t_terc").innerHTML = th([["Cod"],["Serviço"],["Centro de custo"],["Un."],["Valor",1],["Volume",1],["Total",1]])+"<tbody>"+
    R.TC.itens.map(i=>`<tr><td>${i.cod}</td><td>${i.desc}</td><td class="calc">${i.cc}</td>
      <td class="calc">${i.un}</td><td class="num calc">${brl(i.tarifa,2)}</td>
      <td class="num calc">${fmt(i.vol)}</td><td class="num tot">${brl(i.total)}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="6">TOTAL</td><td class="num tot">${brl(R.TC.total)}</td></tr></tbody>`;

  // tarifas de prestação de serviço por atividade com frente terceirizada.
  // Atividade com detalhamento por sub-modo (avião/drone/terrestre — TERC_SUB)
  // trava a tarifa única aqui: editar as duas ao mesmo tempo confundiria qual
  // vale. O detalhe se ajusta no "›" ao lado do 3º, no Plano Operacional.
  const comTerc = R.L.filter(x=>x.partes.some(p=>p.terc));
  $("#t_tarifa").innerHTML = th([["Cod"],["Atividade"],["% terceirizado",1],["Área terceirizada",1],
    ["Valor (R$/ha)",1],["Custo",1]])+"<tbody>"+
    (comTerc.length? comTerc.map(x=>{
      const p = x.partes.find(z=>z.terc);
      const detalhado = temDetalheTerc(x.a.cod);
      return `<tr><td>${codExibir(x.a.cod)}</td><td>${x.a.nome}</td>
        <td class="num calc">${fmt(p.pct*100,1)}%</td>
        <td class="num calc">${fmt(p.area)} ha</td>
        <td class="num">${detalhado
          ? `<span class="calc" title="Detalhado por avião/drone/terrestre no Plano Operacional">${brl(tarifaTercDe(x.a.cod),2)}</span>`
          : `<input data-tt="${x.a.cod}" value="${tarifaTerc(x.a.cod)}" inputmode="decimal">`}</td>
        <td class="num tot">${brl(p.cTerc)}</td></tr>`;}).join("")
      : `<tr><td colspan="6" class="calc">Nenhuma atividade com frente terceirizada. Marque o percentual na coluna "3º" do Plano Operacional.</td></tr>`)+
    `<tr><td class="tot" colspan="5">TOTAL DE APLICAÇÕES TERCEIRIZADAS</td>
     <td class="num tot">${brl(R.tercAtivT)}</td></tr></tbody>`;
}


export { CONTA_COMBINADA, GRUPO_SEM_CONTA, contasValores, pintarContas };

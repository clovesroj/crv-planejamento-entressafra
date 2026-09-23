import { GRUPOS_ORD, departamentosDe, deptIdx, filtrarPessoas, janelaDaLinha, necessidadePorAtividade, visaoPlanilha } from '../calculo/pessoas.js';
import { perTag } from '../nucleo/calendario.js';
import { diasDoMes } from '../calculo/atividade.js';
import { ajusteQuadro, ativoDe, quadroBase } from '../calculo/quadro.js';
import { CFG } from '../dados/cfg.js';
import { PES_DEPT, PES_GRUPO, QUADRO, setPES_DEPT } from '../nucleo/estado.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { barras, serieDoPeriodo, kpi, maxSel, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* ---------- RESUMO DE PESSOAS ---------- */
const nomeCargo = (R, f) => (R.PS && R.PS.nomeFun && R.PS.nomeFun[f]) || (R.MP.custoFuncao[f]||{nome:f}).nome;
// grupos do quadro, na ordem e com o nome do Resumo de MDO da controladoria
const NOME_GRUPO = {"OPERACIONAL":"Operacional (atividades do plano)", "ADM AGRÍCOLA":"ADM agrícola (quadro previsto)",
  "OFICINA":"Oficina — manutenção (quadro previsto)", "FAT":"FAT (fora da operação)"};
const CURTO_GRUPO = {"OPERACIONAL":"Operacional", "ADM AGRÍCOLA":"ADM agrícola", "OFICINA":"Oficina", "FAT":"FAT"};
/* ---------- NECESSIDADE x QUADRO ATIVO ----------
   Veio do Dimensionamento: a pergunta "quanta gente falta contratar" e de
   pessoas, e e nesta tela que estao as outras respostas sobre pessoas.
   Confronta a necessidade do plano com o quadro ativo informado, ja descontando
   ferias e demissoes programadas. O pico mensal e a referencia da contratacao:
   dimensionamento somado inteiro contrataria gente para meses em que a
   atividade nem roda. */
function pintarQuadro(R){
  const PS = R.PS;
  const SEL = R.SEL;   // recorte de meses da barra superior
  const qv = (f,k) => num((QUADRO[f]||{})[k]);
  const BASE = quadroBase();
  // o ativo vem do ERP; o campo da tela e um ajuste opcional que sobrepoe a base

  /* A leitura por atividade saiu daqui: virou coluna da tabela unica de
     Dimensionamento, ao lado da frota e das horas que a geram. O que fica neste
     bloco e o que so existe por FUNCAO -- confronto com o quadro ativo, ferias,
     demissoes e o pico mensal que decide a contratacao. */
  /* FAT: quem esta com o contrato suspenso e do quadro, mas nao opera. Nao e
     necessidade -- e disponivel que falta naquele mes. Por isso a conta do mes
     e necessidade + FAT contra o disponivel, e a funcao que so tem gente no
     FAT tambem aparece aqui. */
  const zeros = () => Array(NM).fill(0);
  const FATF = (PS.fat && PS.fat.porFun) || {};
  const fatMesDe = f => (FATF[f] && FATF[f].qtdMes) || zeros();
  const necDe = f => PS.porFun[f] || {qtd:0, pico:0, qtdMes:zeros()};
  const funcoes = [...new Set([...Object.keys(PS.porFun), ...Object.keys(FATF)])].sort();
  const tot = {nec:0, pico:0, ativo:0, ferias:0, demis:0, fat:0, disp:0, contratar:0, exced:0};
  const disponivel = {};
  const corpo = funcoes.map(f=>{
    const o = necDe(f), fm = fatMesDe(f), fatPico = Math.max(0,...fm);
    const base = BASE.porFuncao[f]||0, ajuste = ajusteQuadro(f);
    const ativo = ativoDe(f, BASE), ferias = qv(f,"ferias"), demis = qv(f,"demis");
    const disp = ativo - ferias - demis;
    disponivel[f] = disp;
    // o mes que mais ocupa o quadro: necessidade da operacao mais quem esta no FAT
    const ocupa = Math.max(0, ...o.qtdMes.map((v,i)=>v + fm[i]));
    const contratar = Math.max(0, ocupa - disp), exced = Math.max(0, disp - ocupa);
    const iPico = o.qtdMes.indexOf(o.pico);
    tot.nec+=o.qtd; tot.pico+=o.pico; tot.ativo+=ativo; tot.ferias+=ferias; tot.demis+=demis; tot.fat+=fatPico;
    tot.disp+=disp; tot.contratar+=contratar; tot.exced+=exced;
    return `<tr><td>${f} — ${esc(nomeCargo(R, f))}</td>
      <td class="num calc">${base||"—"}</td>
      <td class="num"><input data-qd="${f}" data-f="ativo" value="${ajuste!=null?ajuste:""}"
          placeholder="${base}" inputmode="decimal" title="Em branco usa o quadro do ERP"></td>
      <td class="num"><input data-qd="${f}" data-f="ferias" value="${ferias||""}" inputmode="decimal"></td>
      <td class="num"><input data-qd="${f}" data-f="demis" value="${demis||""}" inputmode="decimal"></td>
      <td class="num calc" title="Pico de pessoas desta função no FAT (aba Mão de Obra). Saem do disponível nos meses em que estão suspensas.">${fatPico?fmt(fatPico):"—"}</td>
      <td class="num calc">${fmt(disp)}</td>
      <td class="num calc">${fmt(o.qtd)}</td>
      <td class="num tot">${fmt(o.pico)}<span class="calc" style="font-size:10px"> ${o.pico>0?MESES[iPico]:""}</span></td>
      <td class="num">${contratar>0?`<span class="badge b-bad">+${fmt(contratar)}</span>`:"—"}</td>
      <td class="num">${exced>0?`<span class="badge b-warn">${fmt(exced)}</span>`:"—"}</td></tr>`;
  }).join("");

  $("#t_pes_quadro").innerHTML = th([["Função"],["Ativos ERP",1],["Ajuste",1],["Férias program.",1],["Demissões program.",1],
    ["No FAT (pico)",1],["Disponível",1],["Necessidade",1],["Pico mensal",1],["A contratar",1],["Excedente",1]])+"<tbody>"+
    (funcoes.length ? corpo : `<tr><td colspan="11" class="calc">Sem função dimensionada.</td></tr>`)+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(tot.ativo)}</td><td></td><td class="num tot">${fmt(tot.ferias)}</td>
     <td class="num tot">${fmt(tot.demis)}</td><td class="num tot">${tot.fat?fmt(tot.fat):"—"}</td><td class="num tot">${fmt(tot.disp)}</td>
     <td class="num tot">${fmt(tot.nec)}</td><td class="num tot">${fmt(tot.pico)}</td>
     <td class="num tot">${tot.contratar>0?"+"+fmt(tot.contratar):"—"}</td>
     <td class="num tot">${tot.exced>0?fmt(tot.exced):"—"}</td></tr></tbody>`;

  /* Necessidade mes a mes contra o disponivel de cada funcao.
     Celula vermelha e mes em que a funcao pede mais gente do que ha; o mes de
     pico vem em negrito, porque e ele que decide a contratacao. A linha "a
     contratar no mes" soma so o que falta, funcao por funcao -- excedente de
     uma funcao nao cobre falta de outra. */
  const temQuadro = tot.ativo + tot.ferias + tot.demis > 0;
  const faltaMes = MESES.map(()=>0);
  const corpoMes = funcoes.map(f=>{
    const o = necDe(f), disp = disponivel[f], fm = fatMesDe(f);
    return `<tr><td>${f} — ${esc(nomeCargo(R, f))}</td>
      <td class="num calc">${fmt(disp)}</td>` +
      o.qtdMes.map((v,i)=>{
        // no FAT naquele mes: e do quadro, mas nao esta disponivel
        const dispMes = disp - fm[i];
        const falta = temQuadro ? v - dispMes : 0;
        if(falta>0) faltaMes[i] += falta;
        const ehPico = v>0 && v===o.pico;
        const estilo = falta>0 ? ' style="background:var(--bad-bg);color:var(--bad);font-weight:600"' : '';
        return `<td class="num ${falta>0?"":"calc"} ${clsMes(i)}"${estilo} title="${MESES[i]}: precisa de ${fmt(v)}, disponível ${fmt(dispMes)}${
          fm[i]?` (${fmt(disp)} menos ${fmt(fm[i])} no FAT)`:""}">${
          v>0 ? (ehPico?`<b>${fmt(v)}</b>`:fmt(v)) : "—"}${fm[i]?`<span class="calc" style="font-size:10px"> −${fmt(fm[i])} FAT</span>`:""}</td>`;
      }).join("") +
      `<td class="num tot">${fmt(maxSel(o.qtdMes, SEL))}</td></tr>`;
  }).join("");

  $("#t_pes_mes").innerHTML = th([["Função"],["Disponível",1],...thMeses(),[SEL.parcial?"Pico no período":"Pico",1]])+"<tbody>"+
    (funcoes.length ? corpoMes : `<tr><td colspan="${NM+3}" class="calc">Sem função dimensionada.</td></tr>`)+
    `<tr><td class="tot">NECESSIDADE TOTAL</td><td class="num tot">${fmt(tot.disp)}</td>` +
    tdMeses(PS.qtdMes, v=>fmt(v), "num tot") +
    `<td class="num tot">${fmt(maxSel(PS.qtdMes, SEL))}</td></tr>` +
    `<tr><td class="calc">A contratar no mês</td><td></td>` +
    tdMeses(faltaMes, v=>v>0?`<span class="badge b-bad">+${fmt(v)}</span>`:"—", "num") +
    `<td class="num tot">${maxSel(faltaMes, SEL)>0?"+"+fmt(maxSel(faltaMes, SEL)):"—"}</td></tr></tbody>`;


  $("#bl_pes_sub").textContent = `${fmt(PS.qtd)} pessoas dimensionadas · pico ${fmt(Math.max(...PS.qtdMes))}`
    + (tot.contratar>0 ? ` · faltam ${fmt(tot.contratar)}` : "");
}

/* Filtro de quadro e departamento. O departamento escolhido tem de pertencer
   ao quadro escolhido: trocar de quadro com um departamento de outro volta o
   departamento para "todos". O confronto com o quadro ativo não filtra -- o
   ativo do ERP é por função, sem departamento, e comparar a necessidade de um
   departamento com o ativo da função inteira diria que sobra gente. */
function pintarFiltroPessoas(R){
  const ds = departamentosDe(R.PS, PES_GRUPO);
  if(PES_DEPT !== "todos" && !ds.some(d=>d.dept===PES_DEPT)) setPES_DEPT("todos");
  const grupos = GRUPOS_ORD.filter(g=>R.PS.itens.some(it=>it.grupo===g));
  $("#sel_pes_grupo").innerHTML = `<option value="todos">Todos os quadros</option>` +
    grupos.map(g=>`<option value="${esc(g)}"${g===PES_GRUPO?" selected":""}>${esc(NOME_GRUPO[g]||g)}</option>`).join("");
  $("#sel_pes_dept").innerHTML = `<option value="todos">Todos os departamentos${PES_GRUPO!=="todos"?" do quadro":""}</option>` +
    ds.map(d=>`<option value="${esc(d.dept)}"${d.dept===PES_DEPT?" selected":""}>${esc(d.dept)}${d.dcod?" ("+esc(d.dcod)+")":""}${
      PES_GRUPO==="todos"?" — "+esc(CURTO_GRUPO[d.grupo]||d.grupo):""}</option>`).join("");
  const ativo = PES_GRUPO!=="todos" || PES_DEPT!=="todos";
  $("#btn_pes_limpar").hidden = !ativo;
  $("#pes_filtro_nota").textContent = ativo
    ? "Filtrado: "+[PES_GRUPO!=="todos" ? (NOME_GRUPO[PES_GRUPO]||PES_GRUPO) : "", PES_DEPT!=="todos" ? PES_DEPT : ""].filter(Boolean).join(" › ")
      +". O confronto com o quadro ativo (primeira página) segue sem filtro: o ativo do ERP é por função."
    : "";
  return ativo;
}

function pintarPessoas(R){
  pintarQuadro(R);
  pintarFiltroPessoas(R);
  const S = filtrarPessoas(R.PS, PES_GRUPO, PES_DEPT), SEL = R.SEL;
  /* Tudo abaixo no padrão das planilhas da controladoria (Painel das
     justificativas de folha e Resumo de MDO): grupo -> departamento -> função,
     o ranking por função e a evolução mensal, um mês por linha. O recorte é o
     da barra do topo. A agregação mora em calculo/pessoas.js (visaoPlanilha),
     a mesma do relatório. */
  const V = visaoPlanilha(S, SEL.meses);
  const T = V.total, nM = SEL.meses.length;
  const fat = S.fat || {qtd:0, custo:0, qtdMes:Array(NM).fill(0)};
  const iPico = S.qtdMes.indexOf(Math.max(...S.qtdMes));
  const pctC = v => T.custo>0 ? fmt(v/T.custo*100,1)+"%" : "—";
  const porPessoa = o => o.pm>0 ? brl(o.custo/o.pm,0) : "—";

  $("#k_pes").innerHTML =
    kpi("Efetivo dimensionado","",fmt(S.qtd)+" pessoas", V.grupos.map(g=>CURTO_GRUPO[g.grupo]+" "+fmt(g.pico)).join(" · "),"pessoas:total") +
    kpi("Pico de mobilização","a",fmt(S.qtdMes[iPico]||0)+" pessoas", S.qtd>0?MESES[iPico]+" · sem o FAT":"","pessoas:pico") +
    kpi("Custo de mão de obra","t",brl(T.custo), SEL.parcial ? SEL.rotulo : NM+" meses","nat:mdo") +
    kpi("Salário médio","g",T.salMed?brl(T.salMed,0)+"/mês":"—", "folha ÷ pessoas-mês de quem tem folha no plano","pessoas:total");

  /* ---- por departamento, com as funções (↳) ---- */
  const linhaP = (o, rot, cls, rastro) => `<tr${cls?` class="${cls}"`:""}${rastro?` data-rastro="${rastro}"`:""}>${rot}
      <td class="num">${fmt(o.qtd,o.qtd<10?1:0)}</td><td class="num calc">${fmt(o.pico,o.pico<10?1:0)}</td>
      <td class="num calc">${o.salMed?brl(o.salMed):"—"}</td><td class="num calc">${o.folha?brl(o.folha):"—"}</td>
      <td class="num tot">${brl(o.custo)}</td><td class="num calc">${pctC(o.custo)}</td>
      <td class="num calc">${porPessoa(o)}</td></tr>`;
  $("#t_pes_dept").innerHTML = th([["Departamento / Função"],["Qtde (média)",1],["Pico",1],["Sal. médio",1],["Folha",1],
    ["Custo MDO",1],["% do custo",1],["R$/pessoa/mês",1]])+"<tbody>"+
    V.grupos.map(g=>linhaP(g, `<td><b>${esc(NOME_GRUPO[g.grupo]||g.grupo)}</b></td>`, "pes-grp") +
      g.depts.map(d=>linhaP(d, `<td class="pes-dep">${esc(d.dept)}${d.dcod?` <span class="calc">${esc(d.dcod)}</span>`:""}</td>`,
          "qf-dep", "pessoas:dept:"+d.dept) +
        d.funcs.map(f=>linhaP(f, `<td class="qf-fun">↳ ${esc(f.fnome)} <span class="calc">${esc(f.fcod)}</span></td>`, "qf-f",
          S.porFun[f.fcod] ? "pessoas:fun:"+f.fcod : "")).join("")).join("")).join("")+
    linhaP(T, `<td class="tot">TOTAL</td>`, "qf-tot", "nat:mdo")+"</tbody>";

  // conferência com as outras abas
  const difCusto = S.custo - R.mdoTotal;
  $("#pes_conc").innerHTML = (S.filtrado
    ? `Filtrado: custo de mão de obra no ano de <b>${brl(S.custo)}</b>, ${R.mdoTotal>0?fmt(S.custo/R.mdoTotal*100,1):"0"}% dos
       ${brl(R.mdoTotal)} do plano (sem filtro, esta aba confere com a aba Custos).`
    : `Custo de mão de obra desta aba no ano: <b>${brl(S.custo)}</b> — aba Custos: ${brl(R.mdoTotal)}
    ${Math.abs(difCusto)<=1?"(confere)":"(diferença de "+brl(difCusto)+")"}.`)+` <b>Qtde</b> é a média mensal de pessoas no
    período; <b>pico</b>, o mês que mais pede. O ADM agrícola e a oficina vêm do quadro previsto da controladoria (aba Mão
    de Obra); motoristas, operadores e rurais, das atividades. Efetivo da Capa: ${fmt(R.efetivoTotal)} pessoas, sem os
    ${fmt(S.apoio)} operadores dos equipamentos de apoio. A reserva do transporte e o apoio da frente entram na quantidade
    sem custo próprio; o FAT entra no custo pelo benefício, sem folha.`;

  /* ---- por função, ordenado pelo maior custo ---- */
  $("#t_pes_fun").innerHTML = th([["#",1],["Cod"],["Função"],["Quadro"],["Deptos.",1],["Qtde (média)",1],["Pico",1],
    ["Sal. médio",1],["Custo MDO",1],["% do custo",1]])+"<tbody>"+
    V.funcoes.map((f,k)=>`<tr${S.porFun[f.fcod]?` data-rastro="pessoas:fun:${f.fcod}"`:""}><td class="num calc">${k+1}</td>
      <td>${esc(f.fcod)}</td><td>${esc(f.fnome)}</td><td class="calc">${f.grupos.map(g=>CURTO_GRUPO[g]||g).join(", ")}</td>
      <td class="num calc" title="${esc(f.depts.join(", "))}">${f.depts.length}</td>
      <td class="num">${fmt(f.qtd,f.qtd<10?1:0)}</td><td class="num calc">${fmt(f.pico,f.pico<10?1:0)}</td>
      <td class="num calc">${f.salMed?brl(f.salMed):"—"}</td><td class="num tot">${brl(f.custo)}</td>
      <td class="num calc">${pctC(f.custo)}</td></tr>`).join("")+
    `<tr class="qf-tot"><td></td><td class="tot" colspan="4">TOTAL</td><td class="num tot">${fmt(T.qtd,0)}</td>
      <td class="num tot">${fmt(T.pico,0)}</td><td class="num tot">${T.salMed?brl(T.salMed):"—"}</td>
      <td class="num tot">${brl(T.custo)}</td><td class="num tot">100,0%</td></tr></tbody>`;

  /* ---- função × quadro (média de pessoas no período) ---- */
  const gruposV = GRUPOS_ORD.filter(g=>V.grupos.some(x=>x.grupo===g));
  const noRec = arr => SEL.meses.reduce((t,i)=>t+(+arr[i]||0),0)/Math.max(1,nM);
  const celG = (fcod, g) => noRec(S.itens.filter(it=>it.fcod===fcod && it.grupo===g)
    .reduce((a,it)=>a.map((v,i)=>v+it.qtdMes[i]), Array(NM).fill(0)));
  $("#t_pes_matriz").innerHTML = th([["Função"],...gruposV.map(g=>[CURTO_GRUPO[g]||g,1]),["Total",1]])+"<tbody>"+
    V.funcoes.map(f=>`<tr><td>${esc(f.fcod)} — ${esc(f.fnome)}</td>`+
      gruposV.map(g=>{ const v = celG(f.fcod, g); return `<td class="num ${v?"":"calc"}">${v?fmt(v,v<10?1:0):"—"}</td>`; }).join("")+
      `<td class="num tot">${fmt(f.qtd,f.qtd<10?1:0)}</td></tr>`).join("")+
    `<tr class="qf-tot"><td class="tot">TOTAL</td>`+gruposV.map(g=>{ const o = V.grupos.find(x=>x.grupo===g);
      return `<td class="num tot">${fmt(o?o.qtd:0,0)}</td>`; }).join("")+`<td class="num tot">${fmt(T.qtd,0)}</td></tr></tbody>`;

  /* ---- evolução mensal: um mês por linha, como na planilha ---- */
  const cabG = gruposV.map(g=>[CURTO_GRUPO[g]||g,1]);
  $("#t_pes_mes_qtd").innerHTML = th([["Mês"],["Período"],...cabG,["Total",1],["Na operação",1],["Sal. médio",1]])+"<tbody>"+
    V.evolucao.map(e=>`<tr data-rastro="mes:${e.i}"><td>${MESES[e.i]}</td><td>${perTag(e.i)}</td>`+
      gruposV.map(g=>`<td class="num">${fmt((e.porGrupo[g]||{qtd:0}).qtd,0)}</td>`).join("")+
      `<td class="num tot">${fmt(e.qtd,0)}</td><td class="num calc">${fmt(e.qtd-(e.porGrupo["FAT"]||{qtd:0}).qtd,0)}</td>
       <td class="num calc">${e.salMed?brl(e.salMed):"—"}</td></tr>`).join("")+
    `<tr class="qf-tot"><td class="tot">Média mensal</td><td></td>`+
      gruposV.map(g=>`<td class="num tot">${fmt(V.media.porGrupo[g].qtd,0)}</td>`).join("")+
      `<td class="num tot">${fmt(V.media.qtd,0)}</td><td class="num tot">${fmt(V.media.qtd-(V.media.porGrupo["FAT"]||{qtd:0}).qtd,0)}</td>
       <td class="num tot">${V.media.salMed?brl(V.media.salMed):"—"}</td></tr></tbody>`;
  let ac = 0;
  $("#t_pes_mes_custo").innerHTML = th([["Mês"],["Período"],...cabG,["Custo MDO",1],["% do período",1],["Acumulado",1]])+"<tbody>"+
    V.evolucao.map(e=>{ ac += e.custo; return `<tr data-rastro="cat:mdo"><td>${MESES[e.i]}</td><td>${perTag(e.i)}</td>`+
      gruposV.map(g=>`<td class="num">${brl((e.porGrupo[g]||{custo:0}).custo)}</td>`).join("")+
      `<td class="num tot">${brl(e.custo)}</td><td class="num calc">${pctC(e.custo)}</td><td class="num calc">${brl(ac)}</td></tr>`; }).join("")+
    `<tr class="qf-tot"><td class="tot">Média mensal</td><td></td>`+
      gruposV.map(g=>`<td class="num tot">${brl(V.media.porGrupo[g].custo)}</td>`).join("")+
      `<td class="num tot">${brl(V.media.custo)}</td><td></td><td></td></tr>`+
    `<tr class="qf-tot"><td class="tot">TOTAL</td><td></td>`+
      gruposV.map(g=>{ const o = V.grupos.find(x=>x.grupo===g); return `<td class="num tot">${brl(o?o.custo:0)}</td>`; }).join("")+
      `<td class="num tot">${brl(T.custo)}</td><td class="num tot">100,0%</td><td></td></tr></tbody>`;
  barras($("#ch_pes"), serieDoPeriodo(S.custoMes, SEL), "#2A57A0");

  /* ---------- NECESSIDADE POR ETAPA, TIPO DE GENTE, ORIGEM E FUNCAO ----------
     O quadro por funcao responde "quantos motoristas preciso ter". Esta tabela
     responde a que vem logo depois, e que e a que monta escala: de onde vem
     cada um -- em que etapa, que tipo de gente, em que atividade, em que mes.

     Dois niveis de faixa, e cada uma e o subtotal dela: a etapa por fora e o
     TIPO DE GENTE por dentro (operador, motorista, manutencao...). Operador e
     motorista sao quadros diferentes -- habilitacao, treinamento e escala nao
     se misturam --, e somados na mesma etapa nao respondiam nada.

     Inicio e fim dizem quando a frente comeca e termina. Sem eles, uma coluna
     de mes cheia de gente parece mes inteiro ocupado, e nao e: uma atividade
     acaba no dia 12 e a seguinte comeca no 13, com a mesma turma. Mes que a
     janela corta no meio vem marcado. */
  const det = necessidadePorAtividade(S);
  const nCols = NM + 6;
  const celMes = (l, v, i) => {
    if(!(v>0)) return '<span class="calc">—</span>';
    const D = l.janela && l.janela.fonte==="datas" ? diasDoMes(i, l.janela) : null;
    return D && D.parcial
      ? `${fmt(v)}<span class="parc" title="${MESES[i]}: a janela cobre ${fmt(D.corridos)} dos ${fmt(D.cheio)} dias. A turma não fica o mês inteiro nesta frente.">◗</span>`
      : fmt(v);
  };
  const linhaFaixa = (classe, rotulo, porMes, colspan) =>
    `<tr class="${classe}"><td colspan="${colspan}"><span>${esc(rotulo)}</span></td>` +
    tdMeses(porMes, v=>v?fmt(v):"—", "num") +
    `<td class="num">${fmt(maxSel(porMes, SEL))}</td></tr>`;
  const somaMes = lista => MESES.map((m,i)=>lista.reduce((acc,x)=>acc+x.qtdMes[i],0));

  let etapa = "", categoria = "", corpoDet = "";
  det.forEach(l=>{
    if(l.dept !== etapa){
      etapa = l.dept; categoria = "";
      corpoDet += linhaFaixa("stage", etapa, somaMes(det.filter(x=>x.dept===etapa)), 5);
    }
    if(l.categoria !== categoria){
      categoria = l.categoria;
      corpoDet += linhaFaixa("stage2", categoria,
        somaMes(det.filter(x=>x.dept===etapa && x.categoria===categoria)), 5);
    }
    const {ini, fim, dica} = janelaDaLinha(l);
    corpoDet += `<tr class="pes-linha"><td class="calc">${esc(l.cod||"—")}</td><td title="${esc(l.origem)}">${esc(l.origem)}</td>
      <td class="calc" title="${esc(l.fcod)} — ${esc(l.fnome)}">${esc(l.fcod)} — ${esc(l.fnome)}</td>
      <td class="calc"${dica?` title="${esc(dica)}"`:""}>${esc(ini)}</td>
      <td class="calc"${dica?` title="${esc(dica)}"`:""}>${esc(fim)}</td>` +
      tdMeses(l.qtdMes, (v,i)=>celMes(l, v, i), "num") +
      `<td class="num tot">${fmt(maxSel(l.qtdMes, SEL))}</td></tr>`;
  });
  $("#t_pes_det").innerHTML = th([["Cod"],["Origem"],["Função"],["Início"],["Fim"],...thMeses(),
      [SEL.parcial?"Pico no período":"Pico",1]])+"<tbody>"+
    (det.length ? corpoDet
      : `<tr><td colspan="${nCols}" class="calc">Sem efetivo: lance quantidades no Plano Operacional.</td></tr>`)+
    `<tr><td class="tot" colspan="5"><span>NECESSIDADE TOTAL NO MÊS</span></td>` +
    tdMeses(S.qtdMes, v=>fmt(v), "num tot") +
    `<td class="num tot">${fmt(maxSel(S.qtdMes, SEL))}</td></tr></tbody>`;
}


export { pintarPessoas };

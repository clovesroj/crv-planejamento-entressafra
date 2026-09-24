import { GRUPOS_ORD, departamentosDe, deptIdx, filtrarPessoas, janelaDaLinha, necessidadePorAtividade, visaoPlanilha } from '../calculo/pessoas.js';
import { perTag } from '../nucleo/calendario.js';
import { diasDoMes } from '../calculo/atividade.js';
import { confrontoQuadro, linhaNoPeriodo, somarConfronto } from '../calculo/quadro.js';
import { CATEGORIAS_FUNCAO, CATEGORIA_OUTRAS } from '../dados/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { PES_DEPT, PES_GRUPO, setPES_DEPT } from '../nucleo/estado.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt } from '../nucleo/formato.js';
import { barras, barrasEmpilhadas, barrasLinhas, rosca, serieDoPeriodo, kpi, maxSel, somaSel, tdMeses, th, thMeses } from './componentes.js';

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
  // o ativo vem do ERP; o campo da tela e um ajuste opcional que sobrepoe a base

  /* A leitura por atividade saiu daqui: virou coluna da tabela unica de
     Dimensionamento, ao lado da frota e das horas que a geram. O que fica neste
     bloco e o que so existe por FUNCAO -- confronto com o quadro ativo, ferias,
     demissoes e o pico mensal que decide a contratacao. */
  /* FAT: quem esta com o contrato suspenso e do quadro, mas nao opera. Nao e
     necessidade -- e disponivel que falta naquele mes. Por isso a conta do mes
     e necessidade + FAT contra o disponivel, e a funcao que so tem gente no
     FAT tambem aparece aqui. */
  /* A conta mora em calculo/quadro.js (confrontoQuadro): o Resumo geral e o
     rastro leem o mesmo confronto. */
  const C = confrontoQuadro(PS), tot = C.tot;
  const corpo = C.linhas.map(l=>{
    const f = l.fcod;
    return `<tr><td>${f} — ${esc(nomeCargo(R, f))}</td>
      <td class="num calc">${l.base||"—"}</td>
      <td class="num"><input data-qd="${f}" data-f="ativo" value="${l.ajuste!=null?l.ajuste:""}"
          placeholder="${l.base}" inputmode="decimal" title="Em branco usa o quadro do ERP"></td>
      <td class="num"><input data-qd="${f}" data-f="ferias" value="${l.ferias||""}" inputmode="decimal"></td>
      <td class="num"><input data-qd="${f}" data-f="demis" value="${l.demis||""}" inputmode="decimal"></td>
      <td class="num calc" title="Pico de pessoas desta função no FAT (aba Mão de Obra). Saem do disponível nos meses em que estão suspensas.">${l.fatPico?fmt(l.fatPico):"—"}</td>
      <td class="num calc">${fmt(l.disp)}</td>
      <td class="num calc">${fmt(l.nec)}</td>
      <td class="num tot">${fmt(l.pico)}<span class="calc" style="font-size:10px"> ${l.pico>0?MESES[l.iPico]:""}</span></td>
      <td class="num">${l.contratar>0?`<span class="badge b-bad">+${fmt(l.contratar)}</span>`:"—"}</td>
      <td class="num">${l.exced>0?`<span class="badge b-warn">${fmt(l.exced)}</span>`:"—"}</td></tr>`;
  }).join("");
  const funcoes = C.linhas;

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
  const temQuadro = C.temQuadro, faltaMes = C.faltaMes;
  const corpoMes = C.linhas.map(l=>{
    const f = l.fcod, disp = l.disp, fm = l.fatMes;
    return `<tr><td>${f} — ${esc(nomeCargo(R, f))}</td>
      <td class="num calc">${fmt(disp)}</td>` +
      l.qtdMes.map((v,i)=>{
        // no FAT naquele mes: e do quadro, mas nao esta disponivel
        const dispMes = l.dispMes[i];
        const falta = temQuadro ? v - dispMes : 0;
        const ehPico = v>0 && v===l.pico;
        const estilo = falta>0 ? ' style="background:var(--bad-bg);color:var(--bad);font-weight:600"' : '';
        return `<td class="num ${falta>0?"":"calc"} ${clsMes(i)}"${estilo} title="${MESES[i]}: precisa de ${fmt(v)}, disponível ${fmt(dispMes)}${
          fm[i]?` (${fmt(disp)} menos ${fmt(fm[i])} no FAT)`:""}">${
          v>0 ? (ehPico?`<b>${fmt(v)}</b>`:fmt(v)) : "—"}${fm[i]?`<span class="calc" style="font-size:10px"> −${fmt(fm[i])} FAT</span>`:""}</td>`;
      }).join("") +
      `<td class="num tot">${fmt(maxSel(l.qtdMes, SEL))}</td></tr>`;
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
      +". O confronto com o quadro ativo (página Necessidade x quadro ativo) segue sem filtro: o ativo do ERP é por função."
    : "";
  return ativo;
}

/* ---------- RESUMO GERAL ----------
   A primeira página: todas as pessoas projetadas, o quadro atual e as pessoas
   por mês, num lugar só e resumido -- as outras páginas abrem cada parte. As
   pessoas seguem o filtro de quadro e departamento e o período da barra do
   topo. O quadro atual é o confronto da página "Necessidade x quadro ativo"
   (confrontoQuadro, calculo/quadro.js), aberto pelo quadro onde cada função
   mais pede gente; com departamento filtrado ele sai, porque o ativo do ERP é
   por função, sem departamento. Tudo tem rastro: a dica ao passar o mouse e o
   detalhamento completo no clique (chaves pessoas:* de calculo/rastro.js). */
const COR_GRUPO = {"OPERACIONAL":"#2A57A0", "ADM AGRÍCOLA":"#C9A45C", "OFICINA":"#A5503A", "FAT":"#8A94A6"};
const TIPOS = [...CATEGORIAS_FUNCAO.map(c=>c.nome), CATEGORIA_OUTRAS];
const COR_TIPO = ["#2A57A0","#C9A45C","#A5503A","#2E8540","#7B5EA7","#8A94A6"];
function pintarResumoGeral(R, S, SEL){
  const meses = SEL.meses, n = Math.max(1, meses.length);
  const med = arr => meses.reduce((s,i)=>s+(+arr[i]||0),0)/n;
  const picoDe = arr => { const p = Math.max(0, ...meses.map(i=>+arr[i]||0)); return {p, i: meses.find(i=>(+arr[i]||0)===p)}; };
  const soma = arr => meses.reduce((s,i)=>s+(+arr[i]||0),0);
  const q = v => v>0 ? fmt(v, v<10 && Math.abs(v-Math.round(v))>0.05 ? 1 : 0) : "—";
  const pes = v => fmt(v,0)+(Math.round(v)===1 ? " pessoa" : " pessoas");
  const g = PES_GRUPO, d = PES_DEPT;
  // período do rastro: só safra e entressafra têm chave; meses avulsos abrem o ano
  const sufP = !SEL.manual && (SEL.periodo==="safra" || SEL.periodo==="entressafra") ? ":"+SEL.periodo : "";
  const kq = "pessoas:quadro"+(g==="todos" ? (sufP ? ":todos" : "") : ":"+g)+sufP;
  const noPer = SEL.parcial ? "no período" : "no ano";
  // o total do recorte: sem filtro é o pico de mobilização; filtrado, o quadro/departamento escolhido
  const kOper = (g==="todos" && d==="todos" ? "pessoas:pico" : `pessoas:grupo:${g}:${d}`)+sufP;
  const grupos = GRUPOS_ORD.filter(G=>S.porGrupo[G] && S.porGrupo[G].qtdMes.some(v=>v>0));
  const fatMes = (S.fat && S.fat.qtdMes) || Array(NM).fill(0);
  const comFat = S.qtdMes.map((v,i)=>v + (+fatMes[i]||0));

  // quadro atual: o confronto por função, no recorte de quadro; sem departamento
  const C = confrontoQuadro(R.PS);
  const comQuadro = d==="todos";
  const linhasQ = comQuadro ? C.linhas.filter(l=>g==="todos" || l.grupo===g) : [];
  // o pico que decide a contratação é o do período da barra do topo (ano todo = primeira página)
  const TQ = somarConfronto(linhasQ, meses), temQ = linhasQ.length>0;
  const nFalta = TQ.nFalta, nSobra = TQ.nSobra;

  /* ---- cartões ---- */
  // filtrado só no FAT, o primeiro cartão fala do FAT: na operação não há ninguém
  const soFat = g==="FAT", serie1 = soFat ? fatMes : S.qtdMes;
  const pk = picoDe(serie1), semDept = "com departamento filtrado não há confronto: o ativo do ERP é por função";
  $("#k_pes_geral").innerHTML =
    kpi(soFat ? "No FAT — média mensal" : "Na operação — média mensal","",pes(med(serie1)),
        pk.p>0 ? "pico de "+fmt(pk.p,0)+" em "+MESES[pk.i]+(soFat ? " · fora da operação" : S.fat && S.fat.pico ? " · FAT à parte" : "") : "sem gente no período", kOper) +
    kpi("Quadro atual (ativo no ERP)","t", temQ ? pes(TQ.ativo) : "—",
        !comQuadro ? semDept : !temQ ? "nenhuma função deste quadro no ERP"
        : g==="todos" ? `${fmt(C.totalERP,0)} no ERP · ${fmt(C.afastados,0)} afastados · ${fmt(C.foraDoPlanoQtd,0)} em funções fora do plano`
        : TQ.n+" funções deste quadro", temQ ? kq : "") +
    kpi("Disponível","g", temQ ? pes(TQ.disp) : "—", temQ ? "ativo − férias − demissões programadas" : "", temQ ? kq : "") +
    kpi("A contratar","a", temQ ? (TQ.contratar>0 ? "+"+fmt(TQ.contratar,0) : "—") : "—",
        temQ ? "pelo pico de cada função "+noPer+" · "+nFalta+(nFalta===1?" função":" funções") : "", temQ ? kq : "") +
    kpi("Excedente","", temQ ? (TQ.exced>0 ? fmt(TQ.exced,0) : "—") : "—",
        temQ ? nSobra+(nSobra===1?" função":" funções")+" com gente a mais" : "", temQ ? kq : "");

  /* ---- resumo por quadro ---- */
  const custoTot = soma(S.custoMes);
  const colsQ = lg => { if(!lg || !lg.length) return `<td class="num calc">—</td>`.repeat(4);
    const t = somarConfronto(lg, meses);
    return `<td class="num">${fmt(t.ativo,0)}</td><td class="num calc">${fmt(t.disp,0)}</td>
      <td class="num">${t.contratar>0?`<span class="badge b-bad">+${fmt(t.contratar,0)}</span>`:"—"}</td>
      <td class="num">${t.exced>0?`<span class="badge b-warn">${fmt(t.exced,0)}</span>`:"—"}</td>`; };
  const linhaG = (rot, qtdMes, custo, lg, chave, cls) => { const pg = picoDe(qtdMes), m = med(qtdMes);
    return `<tr${cls?` class="${cls}"`:""}${chave?` data-rastro="${esc(chave)}"`:""}><td>${rot}</td>
      <td class="num tot">${fmt(pg.p,0)}</td><td class="calc">${pg.p>0?MESES[pg.i]:"—"}</td>
      <td class="num">${q(m)}</td>` + colsQ(lg) +
      `<td class="num">${brl(custo)}</td><td class="num calc">${custoTot>0?fmt(custo/custoTot*100,1)+"%":"—"}</td></tr>`; };
  const custoFat = soma((S.fat && S.fat.custoMes) || []);
  $("#t_pes_geral").innerHTML = th([["Quadro"],["Pico no mês",1],["Mês do pico"],["Média mensal",1],["Quadro atual (ERP)",1],
      ["Disponível",1],["A contratar",1],["Excedente",1],["Custo MDO",1],["% do custo",1]])+"<tbody>"+
    (grupos.length ? grupos.map(G=>linhaG(`<i class="pes-cor" style="background:${COR_GRUPO[G]}"></i>${esc(NOME_GRUPO[G]||G)}`,
        S.porGrupo[G].qtdMes, soma(S.porGrupo[G].custoMes), comQuadro ? C.linhas.filter(l=>l.grupo===G) : null,
        `pessoas:grupo:${G}:${d}`+sufP)).join("")
      : `<tr><td colspan="10" class="calc">Sem pessoas no recorte.</td></tr>`)+
    (soFat ? "" : linhaG("<b>Na operação</b> (sem o FAT)", S.qtdMes, custoTot-custoFat, linhasQ, kOper, "qf-tot"))+
    (S.fat && S.fat.qtd>0 ? linhaG("<b>Total com o FAT</b>", comFat, custoTot, null, "", "qf-tot") : "")+"</tbody>";
  /* Quadro que o ERP quase não traz (a base de pessoal do ERP não tem a
     oficina, por exemplo): a necessidade inteira dele aparece como a
     contratar. A nota diz isso, para não ler como falta de gente de verdade. */
  const vazios = comQuadro ? GRUPOS_ORD.filter(G=>G!=="FAT" && grupos.includes(G)).map(G=>{
    const t = somarConfronto(C.linhas.filter(l=>l.grupo===G), meses); return {G, t}; })
    .filter(x=>x.t.n>0 && x.t.ocupa>0 && x.t.ativo < x.t.ocupa*0.1) : [];
  $("#pes_geral_nota").innerHTML = `<b>Pico no mês</b> é o maior número de pessoas ao mesmo tempo no período (${esc(SEL.rotulo)});
    <b>média mensal</b>, a média dos meses do período. <b>Quadro atual</b> é o ativo do ERP com os ajustes, férias e
    demissões da página Necessidade x quadro ativo — cada função conta no quadro onde mais pede gente. <b>A contratar</b>
    e <b>excedente</b> somam função por função, cada uma no seu pico ${noPer}: por isso não são o pico menos o quadro
    atual.${SEL.parcial ? " Com o ano todo, são os números da página Necessidade x quadro ativo." : ""}`+
    (!comQuadro ? ` Com departamento filtrado o confronto sai: o ativo do ERP é por função, sem departamento.` : "")+
    (vazios.length ? ` <b>A base do ERP quase não traz ${vazios.map(x=>`${esc(CURTO_GRUPO[x.G]||x.G)} (${fmt(x.t.ativo,0)} ativo${x.t.ativo===1?"":"s"} para um pico de ${fmt(x.t.ocupa,0)})`).join(" nem ")}</b>:
      quase toda a necessidade aparece como a contratar. Informe o quadro atual dessas funções na coluna Ajuste da página
      Necessidade x quadro ativo.` : "");

  /* ---- pessoas por mês: gráfico e tabela ---- */
  barrasEmpilhadas($("#ch_pes_mes"), $("#ch_pes_mes_leg"), {meses,
    series: grupos.map(G=>({nome:CURTO_GRUPO[G]||G, cor:COR_GRUPO[G], vals:S.porGrupo[G].qtdMes,
      rastro:i=>`pessoas:mes:${i}:${G}:${d}`, rastroLeg:`pessoas:grupo:${G}:${d}`+sufP})),
    linha: temQ && C.temQuadro ? {nome:"Quadro atual disponível", cor:"var(--ok)", vals:TQ.dispMes, rastro:kq} : null,
    rastroCol: i=>`pessoas:mes:${i}:${g}:${d}`});
  const celMes = (arr, chave, fmtV=q) => tdMeses(arr, v=>fmtV(v), "num", (v,i)=>esc(chave(i)));
  const fechaMes = (arr, fmtV=q) => `<td class="num tot">${fmtV(maxSel(arr, SEL))}</td><td class="num calc">${fmtV(med(arr))}</td>`;
  $("#t_pes_geral_mes").innerHTML = th([["Pessoas"], ...thMeses(), [SEL.parcial?"Pico no período":"Pico",1], ["Média",1]])+"<tbody>"+
    grupos.filter(G=>G!=="FAT").map(G=>`<tr><td><i class="pes-cor" style="background:${COR_GRUPO[G]}"></i>${esc(CURTO_GRUPO[G]||G)}</td>`+
      celMes(S.porGrupo[G].qtdMes, i=>`pessoas:mes:${i}:${G}:${d}`)+fechaMes(S.porGrupo[G].qtdMes)+`</tr>`).join("")+
    `<tr class="qf-tot"><td>Na operação</td>`+celMes(S.qtdMes, i=>`pessoas:mes:${i}:${g}:${d}`)+fechaMes(S.qtdMes)+`</tr>`+
    (grupos.includes("FAT") ? `<tr><td><i class="pes-cor" style="background:${COR_GRUPO.FAT}"></i>FAT (fora da operação)</td>`+
      celMes(fatMes, i=>`pessoas:mes:${i}:FAT:${d}`)+fechaMes(fatMes)+`</tr>` : "")+
    (temQ && C.temQuadro ? `<tr><td>Quadro atual disponível</td>`+tdMeses(TQ.dispMes, v=>fmt(v,0), "num calc", ()=>esc(kq))+
        fechaMes(TQ.dispMes, v=>fmt(v,0))+`</tr>`+
      `<tr><td>A contratar no mês</td>`+tdMeses(TQ.faltaMes, v=>v>0?`<span class="badge b-bad">+${fmt(v,0)}</span>`:"—", "num", ()=>esc(kq))+
        fechaMes(TQ.faltaMes, v=>v>0?"+"+fmt(v,0):"—")+`</tr>` : "")+"</tbody>";

  /* ---- roscas: por quadro e por tipo de função ---- */
  const dG = grupos.map(G=>({l:CURTO_GRUPO[G]||G, v:med(S.porGrupo[G].qtdMes), cor:COR_GRUPO[G], rastro:`pessoas:grupo:${G}:${d}`+sufP}));
  rosca($("#ch_pes_quadro"), $("#ch_pes_quadro_leg"), dG, {v:dG.reduce((s,x)=>s+x.v,0), l:"pessoas por mês"});
  const porTipo = {};
  S.itens.forEach(it=>{ porTipo[it.categoria] = (porTipo[it.categoria]||0) + med(it.qtdMes); });
  const dT = Object.entries(porTipo).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])
    .map(([c,v])=>({l:c, v, cor:COR_TIPO[Math.max(0,TIPOS.indexOf(c))%COR_TIPO.length], rastro:`pessoas:tipo:${c}:${g}:${d}`+sufP}));
  rosca($("#ch_pes_tipo"), $("#ch_pes_tipo_leg"), dT, {v:dT.reduce((s,x)=>s+x.v,0), l:"pessoas por mês"});

  /* ---- projetado × quadro atual, por função ---- */
  const TOPO = 15;
  const fs = linhasQ.map(l=>linhaNoPeriodo(l, meses)).filter(l=>l.ocupa>0 || l.disp>0).sort((a,b)=>b.ocupa-a.ocupa || b.disp-a.disp);
  $("#ch_pes_fun_leg").innerHTML = temQ ? `<span><i style="background:#2A57A0"></i>Projetado — pico da função ${noPer}</span>
    <span><i style="background:var(--ok)"></i>Quadro atual disponível</span>` : "";
  if(temQ) barrasLinhas($("#ch_pes_fun"), fs.slice(0,TOPO).map(l=>({l:nomeCargo(R, l.fcod), a:l.ocupa, b:Math.max(0,l.disp),
      num:fmt(l.ocupa,0)+" / "+fmt(l.disp,0),
      dir: l.contratar>0 ? "+"+fmt(l.contratar,0)+" a contratar" : l.exced>0 ? fmt(l.exced,0)+" sobrando" : "em dia",
      dirCls: l.contratar>0 ? "falta" : l.exced>0 ? "sobra" : "",
      rastro: R.PS.porFun[l.fcod] ? "pessoas:fun:"+l.fcod : kq})), {corA:"#2A57A0", corB:"var(--ok)"});
  else $("#ch_pes_fun").innerHTML = `<div class="calc" style="padding:20px 0">${!comQuadro ? esc(semDept[0].toUpperCase()+semDept.slice(1))+"." : "Nenhuma função deste quadro no ERP."}</div>`;
  $("#ch_pes_fun_nota").textContent = temQ && fs.length>TOPO
    ? `As ${TOPO} funções que mais pedem gente, de ${fs.length}. Todas estão na página Necessidade x quadro ativo.` : "";

  /* ---- por departamento ---- */
  const deps = Object.entries(S.porDept).map(([dep,o])=>({dep, grupo:o.grupo, m:med(o.qtdMes), p:picoDe(o.qtdMes).p}))
    .filter(x=>x.m>0).sort((a,b)=>b.m-a.m);
  barrasLinhas($("#ch_pes_dep"), deps.slice(0,TOPO).map(x=>({l:x.dep, a:x.m, cor:COR_GRUPO[x.grupo], num:q(x.m),
      dir:"pico "+fmt(x.p,0)+" · "+(CURTO_GRUPO[x.grupo]||x.grupo), rastro:"pessoas:dept:"+x.dep})), {corA:"#2A57A0"});
  $("#ch_pes_dep_nota").textContent = deps.length>TOPO
    ? `Os ${TOPO} departamentos com mais gente, de ${deps.length}. Todos estão na página Por departamento e função.` : "";

  $("#bl_pes_geral_sub").textContent = `${fmt(med(S.qtdMes),0)} pessoas/mês na operação · pico ${fmt(pk.p,0)}`+
    (temQ ? ` · quadro atual ${fmt(TQ.ativo,0)}`+(TQ.contratar>0 ? ` · a contratar ${fmt(TQ.contratar,0)}` : "") : "");
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
  pintarResumoGeral(R, S, SEL);
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

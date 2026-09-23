import { deptIdx, janelaDaLinha, necessidadePorAtividade } from '../calculo/pessoas.js';
import { diasDoMes } from '../calculo/atividade.js';
import { ajusteQuadro, ativoDe, quadroBase } from '../calculo/quadro.js';
import { CFG } from '../dados/cfg.js';
import { QUADRO } from '../nucleo/estado.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { barras, serieDoPeriodo, kpi, maxSel, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* ---------- RESUMO DE PESSOAS ---------- */
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
    return `<tr><td>${f} — ${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td>
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
    return `<tr><td>${f} — ${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td>
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

function pintarPessoas(R){
  pintarQuadro(R);
  const S = R.PS, sm = a => a.reduce((s,x)=>s+x,0);
  const contaF = c => (CFG.funcoes.find(f=>f.cod===c)||{conta:"—"}).conta;
  const depts = Object.keys(S.porDept).sort((a,b)=>deptIdx(a)-deptIdx(b));
  // efetivo e custo por funcao somam todo mundo, FAT incluido (a necessidade,
  // sem o FAT, e a do confronto com o quadro, acima)
  const FUNS = S.porFunTodos || S.porFun;
  const funs  = Object.keys(FUNS).sort();
  const pm = sm(S.qtdMes), iPico = S.qtdMes.indexOf(Math.max(...S.qtdMes));
  const fat = S.fat || {qtd:0, custo:0, qtdMes:Array(NM).fill(0)};
  const todosMes = S.qtdMes.map((v,i)=>v + fat.qtdMes[i]);
  const porPessoa = o => o.pessoasMes>0 ? brl(o.custo/o.pessoasMes,0) : "—";

  $("#k_pes").innerHTML =
    kpi("Efetivo dimensionado","",fmt(S.qtd)+" pessoas", depts.length+" departamentos · "+funs.length+" funções"
        + (S.fat && S.fat.qtd ? ` · ${fmt(S.fat.qtd)} no FAT, fora da operação` : ""),"pessoas:total") +
    kpi("Pico de mobilização","a",fmt(S.qtdMes[iPico]||0)+" pessoas", S.qtd>0?MESES[iPico]:"","pessoas:pico") +
    kpi("Custo de mão de obra","t",brl(S.custo), NM+" meses","nat:mdo") +
    // o FAT tem custo mas nao mobiliza ninguem: fica fora da media por pessoa mobilizada
    kpi("Custo médio por pessoa","g",pm>0?brl((S.custo-((S.fat&&S.fat.custo)||0))/pm,0)+"/mês":"—","pessoa mobilizada no mês","pessoas:total");

  $("#t_pes_dept").innerHTML = th([["Departamento"],["Funções",1],["Efetivo",1],["% do efetivo",1],["Pico mensal",1],
    ["Custo MDO",1],["% do custo",1],["R$/pessoa/mês",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d], nf=new Set(S.itens.filter(it=>it.dept===d).map(it=>it.fcod)).size;
      return `<tr><td>${esc(d)}</td><td class="num calc">${nf}</td><td class="num tot">${fmt(o.qtd)}</td>
        <td class="num calc">${S.qtd>0?fmt(o.qtd/S.qtd*100,1)+"%":"—"}</td><td class="num calc">${fmt(o.pico)}</td>
        <td class="num">${brl(o.custo)}</td><td class="num calc">${S.custo>0?fmt(o.custo/S.custo*100,1)+"%":"—"}</td>
        <td class="num calc">${porPessoa(o)}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${funs.length}</td><td class="num tot">${fmt(S.qtd)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${fmt(Math.max(...S.qtdMes))}</td><td class="num tot">${brl(S.custo)}</td>
     <td class="num tot">100,0%</td><td class="num tot">${pm>0?brl((S.custo-fat.custo)/pm,0):"—"}</td></tr></tbody>`;

  // conferência com as outras abas: a Capa não soma os operadores de apoio
  const difCusto = S.custo - R.mdoTotal;
  $("#pes_conc").innerHTML = `Custo de mão de obra desta aba: <b>${brl(S.custo)}</b> — aba Custos: ${brl(R.mdoTotal)}
    ${Math.abs(difCusto)<=1?"(confere)":"(diferença de "+brl(difCusto)+")"}. Efetivo da Capa: ${fmt(R.efetivoTotal)} pessoas,
    que não inclui os ${fmt(S.apoio)} operadores dos equipamentos de apoio contados aqui. A reserva do transporte de cana
    entra no efetivo sem custo de mão de obra próprio, como na Capa.`;

  $("#t_pes_fun").innerHTML = th([["Cod"],["Função"],["Conta"],["Departamentos"],["Efetivo",1],["Pico mensal",1],
    ["Custo MDO",1],["R$/pessoa/mês",1]])+"<tbody>"+
    funs.map(f=>{ const o=FUNS[f];
      const ds=[...new Set(S.itens.filter(it=>it.fcod===f).map(it=>it.dept))].sort((a,b)=>deptIdx(a)-deptIdx(b));
      return `<tr><td>${f}</td><td>${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td><td class="calc">${contaF(f)}</td>
        <td class="calc">${ds.map(esc).join(", ")}</td><td class="num tot">${fmt(o.qtd)}</td>
        <td class="num calc">${fmt(o.pico)}</td><td class="num">${brl(o.custo)}</td>
        <td class="num calc">${porPessoa(o)}</td></tr>`; }).join("")+
    `<tr><td class="tot" colspan="4">TOTAL</td><td class="num tot">${fmt(S.qtd)}</td><td></td>
     <td class="num tot">${brl(S.custo)}</td><td></td></tr></tbody>`;

  const cel = (f,d) => S.itens.filter(it=>it.fcod===f && it.dept===d).reduce((s,it)=>s+it.qtd,0);
  $("#t_pes_matriz").innerHTML = th([["Função"],...depts.map(d=>[esc(d),1]),["Total",1]])+"<tbody>"+
    funs.map(f=>`<tr><td>${f} — ${esc((R.MP.custoFuncao[f]||{nome:f}).nome)}</td>`+
      depts.map(d=>{ const v=cel(f,d); return `<td class="num ${v?"":"calc"}">${v?fmt(v):"—"}</td>`; }).join("")+
      `<td class="num tot">${fmt(FUNS[f].qtd)}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td>`+depts.map(d=>`<td class="num tot">${fmt(S.porDept[d].qtd)}</td>`).join("")+
    `<td class="num tot">${fmt(S.qtd)}</td></tr></tbody>`;

  const SEL = R.SEL;
  $("#t_pes_mes_qtd").innerHTML = th([["Departamento"],...thMeses(),[SEL.parcial?"Pico no período":"Pico",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d];
      return `<tr><td>${esc(d)}</td>`+tdMeses(o.qtdMes, v=>v?fmt(v):"—")+
        `<td class="num tot">${fmt(maxSel(o.qtdMes, SEL))}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(todosMes, v=>fmt(v), "num tot")+
    `<td class="num tot">${fmt(maxSel(todosMes, SEL))}</td></tr>`+
    (fat.qtd ? `<tr><td class="calc">Na operação (sem o FAT)</td>`+tdMeses(S.qtdMes, v=>fmt(v))+
      `<td class="num calc">${fmt(maxSel(S.qtdMes, SEL))}</td></tr>` : "")+`</tbody>`;

  // o acumulado corre sobre os meses à mostra: acumular meses escondidos faria a
  // última coluna visível não bater com o total da linha
  let ac = 0;
  const acum = S.custoMes.map((v,i)=> SEL.meses.includes(i) ? (ac+=v) : null);
  $("#t_pes_mes_custo").innerHTML = th([["Departamento"],...thMeses(),[SEL.parcial?"Total do período":"Total",1]])+"<tbody>"+
    depts.map(d=>{ const o=S.porDept[d];
      return `<tr><td>${esc(d)}</td>`+tdMeses(o.custoMes, v=>brl(v))+
        `<td class="num tot">${brl(somaSel(o.custoMes, SEL))}</td></tr>`; }).join("")+
    `<tr><td class="tot">TOTAL</td>`+tdMeses(S.custoMes, v=>brl(v), "num tot")+
    `<td class="num tot">${brl(somaSel(S.custoMes, SEL))}</td></tr>`+
    `<tr><td class="calc">Acumulado</td>`+tdMeses(acum, v=>v==null?"—":brl(v))+`<td></td></tr>`+
    `<tr><td class="calc">Pessoas na operação no mês</td>`+tdMeses(S.qtdMes, v=>fmt(v))+`<td></td></tr>`+
    (fat.qtd ? `<tr><td class="calc">Pessoas no FAT no mês</td>`+tdMeses(fat.qtdMes, v=>v?fmt(v):"—")+`<td></td></tr>` : "")+`</tbody>`;
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

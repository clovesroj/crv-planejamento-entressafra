import { benVal, encPct, gratif } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM, clsMes } from '../nucleo/calendario.js';
import { BEN, ENC, FUN_SEL, GRAT, QF_GRUPO, QF_MES } from '../nucleo/estado.js';
import { COLUNAS_QUADRO, comparativoQuadro, mesAnoAnterior } from '../calculo/quadro-comparativo.js';
import { QUADRO_FONTE } from '../dados/quadro-fixo.js';
import { arvorePessoal, catalogoQuadro } from '../calculo/pessoal.js';
import { $, brl, esc, fmt, num, pct } from '../nucleo/formato.js';
import { kpi, ligarBuscaSelect, th } from './componentes.js';
import { setFUN_SEL } from '../nucleo/estado.js';

/* ---------- MÃO DE OBRA ---------- */
// "Cargo" (gratificação) e persistente -- mostra o cargo selecionado, nao some
// depois de um clique -- por isso usa definir(), sincronizado a cada render.
const buscaFun = ligarBuscaSelect("#busca_fun", "#lista_fun", "#sel_fun", () => CFG.funcoes,
  f => f.cod + " · " + f.nome + (GRAT[f.cod] ? " (com gratificação)" : ""), f => f.cod);

function pintarMDO(R){
  const M=R.MP;
  $("#c_escala").value = M.fatorEscala.toFixed(2);
  $("#k_mdo").innerHTML =
    kpi("Encargos sociais","",pct(M.encTot),"sobre o salário","nat:mdo") +
    kpi("Benefícios","t",brl(M.benTot),"por colaborador/mês","nat:mdo") +
    kpi("MDO total do período","g",brl(R.mdoTotal),"","nat:mdo") +
    kpi("Quadro ADM + oficina","a",fmt(R.QF.pico)+" pessoas",
        `${fmt(R.QF.adm.pico)} ADM · ${fmt(R.QF.oficina.pico)} oficina · ${brl(R.QF.total)} no ano`,"cat:mdo");

  $("#t_enc").innerHTML = th([["Encargo"],["Base legal"],["% aplicado",1],["Original",1],["Impacto p/ F01",1]]) + "<tbody>" +
    CFG.encargos.map((e,i)=>{
      const p = encPct(i), alt = ENC[i]!=null && Math.abs(p-e.pct)>1e-9;
      const impacto = M.custoFuncao["918"] ? M.custoFuncao["918"].comAdic*p : 0;
      return `<tr><td>${e.nome}${alt?' <span class="badge b-warn">ajustado</span>':''}</td>
        <td class="calc">${e.base}</td>
        <td class="num"><input data-enc="${i}" value="${+(p*100).toFixed(4)}" inputmode="decimal"></td>
        <td class="num calc">${pct(e.pct)}</td>
        <td class="num calc">${brl(impacto,2)}</td></tr>`;}).join("") +
    `<tr><td class="tot">TOTAL DE ENCARGOS</td><td></td><td class="num tot">${pct(M.encTot)}</td>
     <td class="num calc">${pct(CFG.encargos.reduce((s,e)=>s+e.pct,0))}</td>
     <td class="num tot">${brl(M.custoFuncao["918"]?M.custoFuncao["918"].encargos:0,2)}</td></tr></tbody>`;

  $("#t_ben").innerHTML = th([["Benefício"],["Conta"],["Valor aplicado",1],["Original",1],["% do pacote",1]]) + "<tbody>" +
    CFG.beneficios.map((b,i)=>{
      const v = benVal(i), alt = BEN[i]!=null && Math.abs(v-b.valor)>1e-9;
      const pp = M.benTot>0 ? v/M.benTot*100 : 0;
      return `<tr><td>${b.nome}${alt?' <span class="badge b-warn">ajustado</span>':''}</td>
        <td class="calc">${b.conta}</td>
        <td class="num"><input data-ben="${i}" value="${v}" inputmode="decimal"></td>
        <td class="num calc">${brl(b.valor,2)}</td>
        <td class="num calc">${fmt(pp,1)}%</td></tr>`;}).join("") +
    `<tr><td class="tot">TOTAL DE BENEFÍCIOS</td><td></td><td class="num tot">${brl(M.benTot,2)}</td>
     <td class="num calc">${brl(CFG.beneficios.reduce((s,b)=>s+b.valor,0),2)}</td>
     <td class="num tot">100,0%</td></tr></tbody>`;

  $("#t_fun").innerHTML = th([["Cod"],["Cargo no ERP"],["Conta"],["Salário base",1],["Adic.",1],
    ["Gratificação",1],["Base",1],["Encargos",1],["Benefícios",1],["Custo mensal",1],["Custo/hora",1]]) + "<tbody>" +
    CFG.funcoes.map(f=>{
      const c=M.custoFuncao[f.cod];
      const alt = GRAT[f.cod];
      return `<tr><td>${f.cod}</td>
        <td>${f.nome}${alt?' <span class="badge b-warn">ajustada</span>':''}</td>
        <td class="calc">${f.conta}</td>
        <td class="num"><input data-fs="${f.cod}" value="${f.sal}" inputmode="decimal"></td>
        <td class="num calc">${pct(f.adic)}</td>
        <td class="num calc">${c.grat?brl(c.grat,2):"—"}</td>
        <td class="num calc">${brl(c.base,2)}</td>
        <td class="num calc">${brl(c.encargos,2)}</td>
        <td class="num calc">${brl(c.beneficios,2)}</td>
        <td class="num tot">${brl(c.mensal,2)}</td>
        <td class="num">${brl(c.hora,2)}</td></tr>`;}).join("") + "</tbody>";

  // --- gratificação do cargo selecionado ---
  if(!FUN_SEL || !CFG.funcoes.some(f=>f.cod===FUN_SEL)) setFUN_SEL(CFG.funcoes[0].cod);
  buscaFun && buscaFun.definir(FUN_SEL);
  const g = GRAT[FUN_SEL] || {tipo:"R$", valor:0};
  $("#sel_grat_tipo").value = g.tipo;
  $("#in_grat").value = g.valor;

  pintarQuadro(R);
  pintarPessoal(R);
  pintarFat(R);
}

/* ---------- FAT ----------
   Uma linha por funcao: pessoas, meses com o contrato suspenso e o beneficio
   por pessoa por mes. O custo vem de calculo/mao-de-obra.js (fatCalc). */
function pintarFat(R){
  const F = R.FT || {linhas:[], qtdMes:Array(NM).fill(0), mes:Array(NM).fill(0), total:0, pico:0};
  const optF = sel => CFG.funcoes.map(f=>`<option value="${esc(f.cod)}"${f.cod===sel?" selected":""}>${esc(f.cod)} · ${esc(f.nome)}</option>`).join("")
    + (sel && !CFG.funcoes.some(f=>f.cod===sel) ? `<option value="${esc(sel)}" selected>${esc(sel)} — fora do cadastro</option>` : "");
  $("#t_fat").innerHTML = th([["Função"],["Pessoas",1],...MESES.map((m,j)=>[m,1,clsMes(j)]),
      ["Benefício por pessoa/mês",1],["Benefício pago"],["Custo por mês",1],["Custo no período",1],[""]])+"<tbody>"+
    (F.linhas.length ? F.linhas.map(l=>`<tr>
      <td><select data-fatf="${l.ix}" style="min-width:220px">${optF(l.fcod)}</select></td>
      <td class="num"><input data-fat="${l.ix}" data-f="qtd" value="${l.qtd||""}" inputmode="decimal" style="width:60px"></td>` +
      l.on.map((b,j)=>`<td class="num ${clsMes(j)}"><input type="checkbox" data-fatm="${l.ix}" data-m="${j}"${b?" checked":""}
        title="${MESES[j]}: ${b?"no FAT":"trabalhando"}"></td>`).join("") +
      `<td class="num"><input data-fat="${l.ix}" data-f="ben" value="${l.ben||""}" inputmode="decimal" style="width:90px" placeholder="R$"></td>
      <td><input data-fat="${l.ix}" data-f="desc" value="${esc(l.desc)}" placeholder="ex.: ajuda compensatória + cesta" style="min-width:190px;text-align:left"></td>
      <td class="num calc">${brl(l.qtd*l.ben)}</td>
      <td class="num tot">${l.nMeses ? brl(l.total) : '<span class="badge b-warn">sem mês</span>'}</td>
      <td><button class="btn d" data-fatrm="${l.ix}">Remover</button></td></tr>`).join("")
      : `<tr><td colspan="${NM+7}" class="calc">Nenhuma função no FAT. Use o botão abaixo para incluir.</td></tr>`) +
    `<tr><td class="tot">TOTAL NO FAT</td><td class="num tot">${fmt(F.pico)}</td>` +
    F.qtdMes.map((q,j)=>`<td class="num tot ${clsMes(j)}">${q?fmt(q):"—"}</td>`).join("") +
    `<td></td><td></td><td></td><td class="num tot">${brl(F.total)}</td><td></td></tr></tbody>`;
  $("#bl_fat_sub").textContent = F.total>0 ? `${fmt(F.pico)} pessoas no pico · ${brl(F.total)}` : "";
}


/* ---------- QUADRO ADM E OFICINA ----------
   O mesmo desenho do Painel das planilhas de justificativa da folha: os
   indicadores do mês, a evolução mensal, o departamento com as funções
   embaixo (↳) e as funções ordenadas pela maior diferença em R$. O cálculo
   mora em calculo/quadro-comparativo.js. */
const pctF = v => (v>0?"+":"")+fmt(v*100,1)+"%";
const sinal = v => (v>0?"+":"")+fmt(v,0);
const brlS = v => (v>0?"+":"")+brl(v);
function colsQuadro(o, rotulo, cls){
  return `<tr${cls?` class="${cls}"`:""}>${rotulo}
    <td class="num">${fmt(o.qa,0)}</td><td class="num">${fmt(o.qp,0)}</td><td class="num calc">${o.dq?sinal(o.dq):"0"}</td>
    <td class="num calc">${o.sa?brl(o.sa):"—"}</td><td class="num calc">${o.sp?brl(o.sp):"—"}</td>
    <td class="num calc">${o.dsal?pctF(o.dsal):"—"}</td>
    <td class="num">${brl(o.va)}</td><td class="num tot">${brl(o.vp)}</td>
    <td class="num ${o.dv>0?"qf-mais":o.dv<0?"qf-menos":""}">${brlS(o.dv)}</td><td class="num calc">${o.va?pctF(o.pct):"—"}</td>
    <td class="num calc">${brlS(o.efQ)}</td><td class="num calc">${brlS(o.efS)}</td>
    <td class="calc">${o.fator||""}</td><td class="num">${brl(o.cp)}</td></tr>`;
}
// títulos em calculo/quadro-comparativo.js (os mesmos do relatório); só "Fator principal" é texto
const CAB_QF = COLUNAS_QUADRO.map(t=>[t, t==="Fator principal" ? 0 : 1]);
function pintarQuadro(R){
  const QF = R.QF; if(!QF) return;
  const C = comparativoQuadro(QF, QF_GRUPO, QF_MES);
  const nomeMes = QF_MES==="media" ? "média dez/26–mar/27" : MESES[QF_MES];
  $("#sel_qf_mes").innerHTML = C.meses.map(i=>`<option value="${i}"${i===QF_MES?" selected":""}>${MESES[i]}</option>`).join("")
    + `<option value="media"${QF_MES==="media"?" selected":""}>Média dez/26–mar/27</option>`;
  $("#sel_qf_grupo").value = QF_GRUPO;
  $("#qf_fonte").textContent = "Fonte: "+Object.values(QUADRO_FONTE).map(f=>f.arquivo+" (revisão "+f.revisao+")").join(" · ");
  const T = C.total;
  $("#k_qf").innerHTML =
    kpi("Folha prevista — "+nomeMes,"",brl(T.vp), fmt(T.qp,0)+" pessoas previstas · salário médio "+(T.sp?brl(T.sp):"—"),"cat:mdo") +
    kpi("Folha realizada no ano anterior — "+(QF_MES==="media" ? "média dez/25–mar/26" : mesAnoAnterior(MESES[QF_MES])),"t",brl(T.va),
        fmt(T.qa,0)+" pessoas realizadas · salário médio "+(T.sa?brl(T.sa):"—"),"") +
    kpi("Variação: prevista − ano anterior","a",brlS(T.dv), (T.va?pctF(T.pct):"—")+" · "+(T.dq>0?"+":"")+fmt(T.dq,0)+" pessoas · "+(T.fator||"—"),"") +
    kpi("Custo no plano — "+nomeMes,"g",brl(T.cp), "folha + contribuições + benefícios","cat:mdo");
  $("#t_qf_evol").innerHTML = th([["Mês"],...CAB_QF])+"<tbody>"+
    C.evolucao.map(e=>colsQuadro(e, `<td data-rastro="mes:${e.i}">${e.mes}</td>`, e.i===QF_MES?"qf-sel":"")).join("")+
    colsQuadro(C.media, `<td class="tot">Média mensal</td>`, "qf-tot")+"</tbody>";
  $("#t_qf_dep").innerHTML = th([["Departamento / Função"],...CAB_QF])+"<tbody>"+
    (C.departamentos.length ? C.departamentos.map(d=>
      colsQuadro(d, `<td><b>${esc(d.nome)}</b> <span class="calc">${esc(d.dcod)} · ${d.grupo==="adm"?"ADM":"oficina"}</span></td>`, "qf-dep") +
      d.filhas.map(f=>colsQuadro(f, `<td class="qf-fun">↳ ${esc(f.nome)} <span class="calc">${esc(f.fcod)}</span></td>`, "qf-f")).join("")).join("")
      : `<tr><td colspan="15" class="calc">Sem previsto neste mês.</td></tr>`)+
    colsQuadro(T, `<td class="tot">TOTAL</td>`, "qf-tot")+"</tbody>";
  $("#t_qf_fun").innerHTML = th([["#",1],["Função"],...CAB_QF])+"<tbody>"+
    C.funcoes.map((f,k)=>colsQuadro(f, `<td class="num calc">${k+1}</td><td>${esc(f.nome)} <span class="calc">${esc(f.fcod)}</span></td>`)).join("")+
    colsQuadro(T, `<td></td><td class="tot">TOTAL</td>`, "qf-tot")+"</tbody>";
  $("#bl_qf_sub").textContent = `${fmt(QF.pico,0)} pessoas no pico · ${brl(QF.total)} no ano`;
}

/* ---------- ARVORE DE FUNCIONARIOS DO ADM E DA OFICINA ----------
   Quem ocupa cada vaga do quadro previsto: grupo -> departamento -> pessoa,
   com a quantidade e a folha previstas do departamento ao lado das lancadas.
   Os departamentos do previsto aparecem todos, mesmo vazios -- e a lista do
   que falta lancar. O calculo mora em calculo/pessoal.js; nao entra no custo,
   que continua vindo do quadro previsto da controladoria. */
function pintarPessoal(R){
  const QF = R.QF;
  const A = arvorePessoal(QF);
  const cat = catalogoQuadro(QF);
  const optF = sel => cat.funcoes.map(f=>`<option value="${esc(f.fcod)}"${f.fcod===sel?" selected":""}>${esc(f.fcod)} · ${esc(f.fnome)}</option>`).join("")
    + (sel && !cat.funcoes.some(f=>f.fcod===sel) ? `<option value="${esc(sel)}" selected>${esc(sel)} — fora do quadro previsto</option>` : "");
  const optD = p => cat.deptos.map(d=>`<option value="${esc(d.grupo+"|"+d.dcod)}"${(p.grupo+"|"+p.dcod)===(d.grupo+"|"+d.dcod)?" selected":""}>${
      d.grupo==="adm"?"ADM":"Oficina"} · ${esc(d.depto)}</option>`).join("")
    + (!cat.deptos.some(d=>d.grupo===p.grupo && d.dcod===p.dcod)
        ? `<option value="${esc(p.grupo+"|"+p.dcod)}" selected>${esc(p.depto)} — fora do quadro previsto</option>` : "");
  // vagas = previsto - lancado: positivo falta gente, negativo ha gente a mais
  const dif = (a,b) => { const d=a-b; return d===0 ? '<span class="calc">em dia</span>'
    : `<span class="${d>0?"pes-falta":"pes-excede"}">${(d>0?"+":"")+fmt(d,0)}</span>`; };

  const faixa = (classe, rotulo, o) =>
    `<tr class="${classe}"><td colspan="3"><span>${rotulo}</span></td>
     <td class="num">${fmt(o.qtd,0)}</td><td class="num">${o.prevQtd?fmt(o.prevQtd,0):"—"}</td>
     <td class="num">${o.prevQtd||o.qtd ? dif(o.prevQtd, o.qtd) : "—"}</td>
     <td class="num tot">${o.folha?brl(o.folha):"—"}</td>
     <td class="num calc">${o.prevFolha?brl(o.prevFolha):"—"}</td><td></td></tr>`;

  let corpo = "";
  A.grupos.forEach(g=>{
    corpo += faixa("stage", esc(g.rotulo), g);
    g.deptos.forEach(d=>{
      corpo += faixa("stage2", `${esc(d.depto)} <span class="calc">${esc(d.dcod||"sem código")}</span>`, d);
      corpo += d.pessoas.length ? d.pessoas.map(p=>{
        const rep = p.mat && A.duplicadas.includes(p.mat);
        return `<tr class="pes-linha">
          <td><input data-pes="${p.i}" data-f="mat" value="${esc(p.mat)}" style="width:90px" inputmode="numeric">${
            rep?' <span class="badge b-warn" title="Esta matrícula está lançada em mais de uma linha.">repetida</span>':''}</td>
          <td><input data-pes="${p.i}" data-f="nome" value="${esc(p.nome)}" style="min-width:170px;text-align:left"></td>
          <td><select data-pesf="${p.i}" style="min-width:195px;max-width:230px">${optF(p.fcod)}</select>
              <select data-pesd="${p.i}" style="min-width:175px;max-width:210px">${optD(p)}</select></td>
          <td class="num calc">1</td><td class="num calc">—</td><td class="num calc">—</td>
          <td class="num"><input data-pes="${p.i}" data-f="sal" value="${p.sal||""}" inputmode="decimal" style="width:100px"
              placeholder="${p.salPrev?fmt(p.salPrev,0):"0"}"></td>
          <td class="num calc"${p.salPrev?` title="Salário médio previsto da função em ${esc(A.ref.nome)}"`:""}>${p.salPrev?brl(p.salPrev):"—"}</td>
          <td><button class="btn d" data-pesrm="${p.i}">Excluir</button></td></tr>`;
      }).join("")
      // Linha do departamento vazio com as mesmas 9 colunas (e nao um colspan):
      // assim a busca acha o departamento pelo nome tambem quando nao ha
      // ninguem lancado nele — nas linhas de gente o nome vem do seletor.
      : `<tr class="pes-linha pes-vazio">
          <td class="calc">—</td>
          <td class="calc" colspan="2">${esc(d.depto)} — ${fmt(d.prevQtd,0)} vaga(s) em aberto, ninguém lançado</td>
          <td class="num calc">0</td><td class="num">${fmt(d.prevQtd,0)}</td>
          <td class="num">${dif(d.prevQtd, 0)}</td><td class="num calc">—</td>
          <td class="num calc">${brl(d.prevFolha)}</td><td></td></tr>`;
    });
  });

  const ref = A.ref.nome ? " — "+A.ref.nome : "";
  $("#t_pessoal").innerHTML = th([["Matrícula"],["Nome"],["Função e departamento"],["Pessoas",1],["Previsto"+ref,1],
      ["Vagas",1],["Salário (R$)",1],["Salário previsto",1],[""]])+"<tbody>"+corpo+
    `<tr><td class="tot" colspan="3"><span>TOTAL LANÇADO</span></td>
     <td class="num tot">${fmt(A.qtd,0)}</td><td class="num tot">${fmt(A.prevQtd,0)}</td>
     <td class="num tot">${dif(A.prevQtd, A.qtd)}</td>
     <td class="num tot">${brl(A.folha)}</td><td class="num calc">${brl(A.prevFolha)}</td><td></td></tr></tbody>`;

  // listas de consulta do lancamento: uma so, montadas quando mudam
  const dlD = $("#pes_dep_lista"), dlF = $("#pes_fun_lista");
  if(dlD && dlD.childElementCount !== cat.deptos.length)
    dlD.innerHTML = cat.deptos.map(d=>`<option value="${esc(d.dcod)}" label="${esc((d.grupo==="adm"?"ADM":"Oficina")+" · "+d.depto)}"></option>`).join("");
  if(dlF && dlF.childElementCount !== cat.funcoes.length)
    dlF.innerHTML = cat.funcoes.map(f=>`<option value="${esc(f.fcod)}" label="${esc(f.fnome)}"></option>`).join("");

  $("#bl_pessoal_sub").textContent = A.qtd
    ? `${fmt(A.qtd,0)} de ${fmt(A.prevQtd,0)} vagas lançadas · ${brl(A.folha)} de folha`
    : `${fmt(A.prevQtd,0)} vagas previstas · nenhuma lançada`;
  const nota = $("#pes_ref");
  if(nota) nota.textContent = A.ref.nome
    ? `Previsto e folha prevista medidos em ${A.ref.nome}, o mês de pico do quadro da controladoria — o mesmo `+
      `número do indicador "Quadro ADM + oficina" e do bloco acima.`
    : "";
}

export { pintarMDO };

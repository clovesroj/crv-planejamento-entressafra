import { GERENCIAS, execucao, metasDeFrota, metasPorAtividade } from '../calculo/acompanhamento.js';
import { MESES } from '../nucleo/calendario.js';
import { ACOMP_MES, REAL } from '../nucleo/estado.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- ACOMPANHAMENTO DO PLANO ----------
   Duas leituras na mesma aba: a meta que cada gerência leva da reunião de
   planejamento, e o quanto dela já foi cumprido. A meta é a mesma que o modal
   da atividade mostra — vem de metaDe(), não é recalculada aqui. */
function pintarAcomp(R){
  const metas = metasPorAtividade(R);
  const ex = execucao(R, ACOMP_MES);

  $("#sel_acomp_mes").innerHTML =
    `<option value="">Ano todo</option>` +
    MESES.map((m,i)=>`<option value="${i}"${ACOMP_MES===i?" selected":""}>até ${m}</option>`).join("");

  $("#k_acomp").innerHTML =
    kpi("Atividades com meta","",fmt(metas.length),
        metas.filter(m=>m.gerencia==="agricola").length+" agrícola · "+
        metas.filter(m=>m.gerencia==="logistica").length+" logística") +
    kpi("Execução lançada", ex.comLancamento?"":"a", fmt(ex.comLancamento)+" de "+fmt(ex.total),
        ex.comLancamento ? "atividades com realizado" : "nada lançado ainda") +
    kpi("Aderência ao plano", aderCor(ex.aderenciaGeral),
        ex.aderenciaGeral!=null ? pct(ex.aderenciaGeral) : "—",
        ex.aderenciaGeral!=null ? "realizado ÷ plano dos meses medidos"
          : ex.semLancamento ? ex.semLancamento+" meses planejados sem lançamento" : "lance o realizado para medir") +
    kpi("Frota em operação","t", fmt(R.frotaT)+" equip.", fmt(R.horasT)+" h no plano");

  // ===== metas por gerência =====
  ["agricola","logistica"].forEach(g=>{
    const lin = metas.filter(m=>m.gerencia===g);
    $("#t_meta_"+g).innerHTML = th([["Cod"],["Atividade"],["Etapa"],["Volume",1],["Janela"],
      ["Rend.",1],["Frota",1],["Efetivo",1],["Meta/dia · equip.",1],["Meta/dia · frota",1],["Custo",1]])+"<tbody>"+
      (lin.length ? lin.map(m=>`<tr>
        <td>${m.cod}</td><td>${m.nome}</td><td class="calc">${m.etapa}</td>
        <td class="num tot">${fmt(m.total)} ${m.un}</td>
        <td class="calc">${janelaTxt(m.janela)}</td>
        <td class="num calc">${fmt(m.rend,2)} ${m.un}/h</td>
        <td class="num tot">${m.frota||"—"}</td>
        <td class="num calc">${fmt(m.efetivo)}</td>
        <td class="num ${m.meta?"tot":"calc"}">${m.meta
          ? fmt(m.meta.qEquipDia,1)+" "+m.un+" · "+fmt(m.meta.hEquipDia,1)+" h" : "—"}</td>
        <td class="num ${m.meta?"tot":"calc"}">${m.meta
          ? fmt(m.meta.qFrotaDia,1)+" "+m.un+"/dia" : "—"}</td>
        <td class="num calc">${brl(m.custo)}</td></tr>`).join("")
        : `<tr><td colspan="11" class="calc">Nenhuma atividade com volume lançado para esta gerência.</td></tr>`)+
      "</tbody>";
  });

  // ===== metas de manutenção =====
  const fr = metasDeFrota(R);
  $("#t_meta_manut").innerHTML = th([["Máquina ou implemento"],["Atividades",1],["Frota",1],
    ["Horas no plano",1],["Horas/equip.",1],["CRM (R$/h)",1],["CRM no plano",1]])+"<tbody>"+
    (fr.length ? fr.map(o=>`<tr>
      <td>${o.maq}</td><td class="num calc">${o.ativs}</td>
      <td class="num tot">${fmt(o.frota)}</td>
      <td class="num calc">${fmt(o.horas)} h</td>
      <td class="num calc">${o.frota>0?fmt(o.horas/o.frota):"—"} h</td>
      <td class="num calc">${brl(o.crmHora,2)}</td>
      <td class="num tot">${brl(o.crm)}</td></tr>`).join("")
      : `<tr><td colspan="7" class="calc">Nenhum equipamento em uso no plano.</td></tr>`)+
    `<tr><td class="tot">TOTAL</td><td></td>
     <td class="num tot">${fmt(fr.reduce((s,o)=>s+o.frota,0))}</td>
     <td class="num tot">${fmt(fr.reduce((s,o)=>s+o.horas,0))} h</td><td></td><td></td>
     <td class="num tot">${brl(fr.reduce((s,o)=>s+o.crm,0))}</td></tr></tbody>`;

  // ===== execução =====
  $("#t_acomp").innerHTML = th([["Cod"],["Atividade"],["Gerência"],
    ...MESES.map(m=>[m,1]),["Plano medido",1],["Realizado",1],["Aderência",1],["A fazer",1]])+"<tbody>"+
    ex.linhas.map(l=>`<tr>
      <td>${l.cod}</td><td>${l.nome}</td>
      <td class="calc">${GERENCIAS[l.gerencia]||l.gerencia}</td>
      ${l.meses.map(m=>`<td class="num${m.i>ex.ateMes?" fora-janela":""}">
        <input data-real="${l.cod}" data-m="${m.i}" value="${m.real!=null?m.real:""}"
               placeholder="${m.plano?fmt(m.plano):"—"}" inputmode="decimal"
               title="Plano: ${fmt(m.plano)} ${l.un}"></td>`).join("")}
      <td class="num calc">${fmt(l.planoAte)} ${l.un}</td>
      <td class="num tot">${l.lancados?fmt(l.realizado)+" "+l.un:"—"}</td>
      <td class="num ${l.aderencia!=null?"tot":"calc"}" style="${corAder(l.aderencia)}">${
        l.aderencia!=null?pct(l.aderencia):"—"}</td>
      <td class="num calc">${fmt(l.saldo)} ${l.un}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="3">TOTAL DAS ATIVIDADES COM LANÇAMENTO</td>
     <td colspan="${MESES.length}"></td>
     <td class="num tot">${fmt(ex.planoAte)}</td>
     <td class="num tot">${fmt(ex.realizado)}</td>
     <td class="num tot" style="${corAder(ex.aderenciaGeral)}">${
       ex.aderenciaGeral!=null?pct(ex.aderenciaGeral):"—"}</td><td></td></tr></tbody>`;
}

/** O campo em branco mostra o plano como placeholder; digitar grava o realizado. */
function janelaTxt(j){
  if(!j) return "—";
  if(j.fonte === "datas") return `${j.ini} a ${j.fim}`;
  return fmt(j.meses,1)+" meses";
}
function aderCor(a){ return a==null ? "t" : a>=0.95 ? "g" : a>=0.8 ? "a" : "a"; }
function corAder(a){
  if(a==null) return "";
  if(a >= 0.95) return "color:var(--green)";
  if(a >= 0.80) return "color:var(--amber)";
  return "color:var(--red)";
}

export { pintarAcomp };

import { GERENCIAS, criterioPorMes, excecoes, metasDeFrota, metasPorAtividade, porGerencia } from '../calculo/acompanhamento.js';
import { MESES, clsMes } from '../nucleo/calendario.js';
import { ACOMP_MES, CRIT_CABE, CRIT_GER, REAL } from '../nucleo/estado.js';
import { codExibir } from '../nucleo/codigo-atividade.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, tdMeses, th, thMeses } from './componentes.js';

/* ---------- ACOMPANHAMENTO DO PLANO ----------
   Duas leituras na mesma aba: a meta que cada gerência leva da reunião de
   planejamento, e o quanto dela já foi cumprido. A meta é a mesma que o modal
   da atividade mostra — vem de metaDe(), não é recalculada aqui. */
function pintarAcomp(R){
  const metas = metasPorAtividade(R);
  // o recorte de periodo vem da barra superior; "ate o mes" continua sendo a
  // pergunta separada de quanto ja foi medido
  const SEL = R.SEL;
  const E  = excecoes(R, ACOMP_MES, SEL.parcial ? SEL.meses : null);
  const ex = E.ex;
  const ger = porGerencia(R, ACOMP_MES, SEL.parcial ? SEL.meses : null);
  const forasCrit = criterioPorMes(R, null).filter(c => !c.cabe).length;

  $("#sel_acomp_mes").innerHTML =
    `<option value="">Ano todo</option>` +
    MESES.map((m,i)=>`<option value="${i}"${ACOMP_MES===i?" selected":""}>até ${m}</option>`).join("");

  // O topo responde o que o diretor pergunta primeiro, nesta ordem: estamos no
  // ritmo, o que está fora, quanto custa o atraso, e o que ainda nem foi medido.
  $("#k_acomp").innerHTML =
    kpi("Aderência ao plano", aderCor(ex.aderenciaGeral),
        ex.aderenciaGeral!=null ? pct(ex.aderenciaGeral) : "—",
        ex.aderenciaGeral!=null ? "até "+ex.mesLabel+(SEL.parcial?" · "+SEL.rotulo:"")+" · "+fmt(ex.comLancamento)+" de "+fmt(ex.total)+" atividades medidas"
          : "nada lançado: sem execução não há o que medir") +
    kpi("Atividades fora da meta", E.atraso.length?"a":"g", fmt(E.atraso.length),
        E.atraso.length ? "abaixo de 95% do plano medido" : "todas as medidas em dia") +
    kpi("Atraso em dinheiro", E.atrasoValor>0?"a":"g", brl(E.atrasoValor),
        E.atrasoValor>0 ? "custo do que deveria ter sido feito e não foi" : "sem atraso medido") +
    kpi("Meses fora do critério", forasCrit?"a":"g", fmt(forasCrit),
        forasCrit ? "volume não cabe na frota e no critério do mês" : "todo mês cabe no critério lançado") +
    kpi("Sem apontamento", ex.semLancamento?"a":"g", fmt(ex.semLancamento)+" meses",
        ex.semLancamento ? "planejados e ainda não reportados" : "tudo reportado até aqui");

  // ===== onde perguntar =====
  $("#t_acomp_exc").innerHTML = th([["Atividade"],["Gerência"],["Etapa"],["Plano medido",1],
    ["Realizado",1],["Falta",1],["Aderência",1],["Atraso em R$",1]])+"<tbody>"+
    (E.atraso.length ? E.atraso.map(l=>`<tr>
      <td>${codExibir(l.cod)} · ${l.nome}</td>
      <td class="calc">${GERENCIAS[l.gerencia]||l.gerencia}</td>
      <td class="calc">${l.etapa}</td>
      <td class="num calc">${fmt(l.planoAte)} ${l.un}</td>
      <td class="num">${fmt(l.realizado)} ${l.un}</td>
      <td class="num tot" style="color:var(--red)">${fmt(l.gap)} ${l.un}</td>
      <td class="num tot" style="${corAder(l.aderencia)}">${pct(l.aderencia)}</td>
      <td class="num tot">${brl(l.gapValor)}</td></tr>`).join("")
      : `<tr><td colspan="8" class="calc">${ex.comLancamento
          ? "Nenhuma atividade abaixo de 95% do plano medido."
          : "Nada lançado como realizado ainda — sem execução não há exceção para mostrar."}</td></tr>`)+
    (E.atraso.length ? `<tr><td class="tot" colspan="7">ATRASO TOTAL</td>
      <td class="num tot">${brl(E.atrasoValor)}</td></tr>` : "")+
    "</tbody>";

  // ===== resumo por gerência =====
  $("#t_acomp_ger").innerHTML = th([["Gerência"],["Atividades",1],["Medidas",1],["Aderência",1],
    ["Fora da meta",1],["Sem apontamento",1],["Atraso em R$",1],["Custo no plano",1]])+"<tbody>"+
    ger.map(g=>`<tr>
      <td class="tot">${g.nome}</td>
      <td class="num calc">${g.atividades}</td>
      <td class="num calc">${g.medidas}</td>
      <td class="num tot" style="${corAder(g.aderencia)}">${g.aderencia!=null?pct(g.aderencia):"—"}</td>
      <td class="num ${g.foraDaMeta?"tot":"calc"}" style="${g.foraDaMeta?"color:var(--amber)":""}">${g.foraDaMeta||"—"}</td>
      <td class="num ${g.semApontamento?"tot":"calc"}" style="${g.semApontamento?"color:var(--amber)":""}">${g.semApontamento||"—"}</td>
      <td class="num ${g.atrasoValor>0?"tot":"calc"}">${g.atrasoValor>0?brl(g.atrasoValor):"—"}</td>
      <td class="num calc">${brl(g.custoPlano)}</td></tr>`).join("")+
    `<tr><td class="tot">Gerência de Manutenção</td>
     <td class="num calc">${metasDeFrota(R).length} equip.</td><td colspan="5"></td>
     <td class="num calc">${brl(R.crmTotal||0)}</td></tr></tbody>`;

  // ===== critério por mês =====
  // A ordem é a do calendário, não a da lista de atividades: é assim que a
  // reunião mensal anda — abre o mês, e dentro dele o que pesa mais.
  const critSel = $("#sel_crit_ger"), cabeSel = $("#sel_crit_cabe");
  if(critSel) critSel.value = CRIT_GER;
  if(cabeSel) cabeSel.value = CRIT_CABE;
  const crit = criterioPorMes(R, CRIT_GER || null)
    .filter(c => CRIT_CABE === "apertado" ? !c.cabe : true);
  $("#t_crit_mes").innerHTML = th([["Mês"],["Cod"],["Atividade"],["Gerência"],["Produção",1],
    ["Por dia efetivo",1],["Por dia corrido",1],["Frota",1],["Rend.",1],["Horas",1],
    ["h/dia · equip.",1],["Rend. nec.",1],["Disp. nec.",1],["Utiliz. nec.",1],["Efic. nec.",1],["Situação"]])+"<tbody>"+
    (crit.length ? crit.map(c=>`<tr>
      <td class="tot">${c.mes}${c.parcial?' <span class="badge b-warn">parcial</span>':""}</td><td>${codExibir(c.cod)}</td><td>${c.nome}</td>
      <td class="calc">${GERENCIAS[c.gerencia]||c.gerencia}</td>
      <td class="num tot">${fmt(c.q)} ${c.un}</td>
      <td class="num tot" title="${fmt(c.q)} ${c.un} ÷ ${fmt(c.dias,1)} dias de operação${
        c.parcial?" (mês parcial: a janela cobre "+fmt(c.diasCorridos)+" dos "+fmt(c.diasCheios)+" dias)":""}">${fmt(c.qDia,1)}
        <span class="calc">÷${fmt(c.dias,1)}</span></td>
      <td class="num calc" title="${fmt(c.q)} ${c.un} ÷ ${fmt(c.diasCorridos)} dias do mês">${fmt(c.qDiaCorrido,1)}
        <span class="calc">÷${fmt(c.diasCorridos)}</span></td>
      <td class="num calc">${fmt(c.n)}</td>
      <td class="num calc">${fmt(c.rend,2)}</td>
      <td class="num calc">${fmt(c.horas)} h</td>
      <td class="num ${c.cabe?"calc":"tot"}" style="${c.cabe?"":"color:var(--red)"}">${fmt(c.hDiaEquip,1)}
        <span class="calc">de ${fmt(c.hDispEquip,1)}</span></td>
      <td class="num calc">${fmt(c.rendNec,2)}</td>
      <td class="num ${c.dispNec>c.disp?"tot":"calc"}" style="${c.dispNec>c.disp?"color:var(--red)":""}">${pct(c.dispNec)}</td>
      <td class="num ${c.utilNec>c.util?"tot":"calc"}" style="${c.utilNec>c.util?"color:var(--red)":""}">${pct(c.utilNec)}</td>
      <td class="num ${c.eficNec>c.efic?"tot":"calc"}" style="${c.eficNec>c.efic?"color:var(--red)":""}">${pct(c.eficNec)}</td>
      <td>${c.cabe ? '<span class="badge b-ok">cabe</span>' : '<span class="badge b-bad">não cabe</span>'}</td></tr>`).join("")
      : `<tr><td colspan="16" class="calc">${CRIT_CABE==="apertado"
          ? "Nenhum mês fora do critério neste recorte."
          : "Nenhuma atividade com volume lançado."}</td></tr>`)+
    "</tbody>";

  // ===== metas por gerência =====
  ["agricola","logistica"].forEach(g=>{
    const lin = metas.filter(m=>m.gerencia===g);
    $("#t_meta_"+g).innerHTML = th([["Cod"],["Atividade"],["Etapa"],["Volume",1],["Janela"],
      ["Rend.",1],["Frota",1],["Efetivo",1],["Meta/dia efetivo · equip.",1],
      ["Meta/dia efetivo · frota",1],["Meta/dia corrido · frota",1],["Custo",1]])+"<tbody>"+
      (lin.length ? lin.map(m=>`<tr>
        <td>${codExibir(m.cod)}</td><td>${m.nome}</td><td class="calc">${m.etapa}</td>
        <td class="num tot">${fmt(m.total)} ${m.un}</td>
        <td class="calc">${janelaTxt(m.janela)}</td>
        <td class="num calc">${fmt(m.rend,2)} ${m.un}/h</td>
        <td class="num tot" title="${m.frota!==m.frotaMedia
          ? `Frota do mês que mais pede. A média da janela, que rateia o custo, é ${fmt(m.frotaMedia)}.`
          : "Frota da atividade"}">${m.frota||"—"}</td>
        <td class="num calc" title="${m.efetivo!==m.efetivoMedio
          ? `Equipe do mês que mais pede. Na média da janela são ${fmt(m.efetivoMedio)}, que é o efetivo com que o motor paga a folha.`
          : "Frota × operadores × turnos × fator de escala"}">${fmt(m.efetivo)}</td>
        <td class="num ${m.meta?"tot":"calc"}">${m.meta
          ? fmt(m.meta.qEquipDia,1)+" "+m.un+" · "+fmt(m.meta.hEquipDia,1)+" h" : "—"}</td>
        <td class="num ${m.meta?"tot":"calc"}">${m.meta
          ? fmt(m.meta.qFrotaDia,1)+" "+m.un : "—"}</td>
        <td class="num calc" title="produção ÷ dias de calendário da janela">${m.qDiaCorrido>0
          ? fmt(m.qDiaCorrido,1)+" "+m.un : "—"}</td>
        <td class="num calc">${brl(m.custo)}</td></tr>`).join("")
        : `<tr><td colspan="12" class="calc">Nenhuma atividade com volume lançado para esta gerência.</td></tr>`)+
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
    ...thMeses(),["Plano medido",1],["Realizado",1],["Aderência",1],["A fazer",1]])+"<tbody>"+
    ex.linhas.map(l=>`<tr>
      <td>${codExibir(l.cod)}</td><td>${l.nome}</td>
      <td class="calc">${GERENCIAS[l.gerencia]||l.gerencia}</td>
      ${l.meses.map(m=>`<td class="num ${clsMes(m.i)}${m.i>ex.ateMes?" fora-janela":""}">
        <input data-real="${l.cod}" data-m="${m.i}" value="${m.real!=null?m.real:""}"
               placeholder="${m.plano?fmt(m.plano):"—"}" inputmode="decimal"
               title="Plano: ${fmt(m.plano)} ${l.un}"></td>`).join("")}
      <td class="num calc">${fmt(l.planoAte)} ${l.un}</td>
      <td class="num tot">${l.lancados?fmt(l.realizado)+" "+l.un:"—"}</td>
      <td class="num ${l.aderencia!=null?"tot":"calc"}" style="${corAder(l.aderencia)}">${
        l.aderencia!=null?pct(l.aderencia):"—"}</td>
      <td class="num calc">${fmt(l.saldo)} ${l.un}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="3">TOTAL DAS ATIVIDADES COM LANÇAMENTO</td>
     ${tdMeses(MESES, ()=>"", "")}
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

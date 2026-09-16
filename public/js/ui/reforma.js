import { reforma } from '../calculo/reforma.js';
import { REFORMA_FAMILIAS } from '../dados/reforma.js';
import { FROTA_UN } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- REFORMA DE FROTA ---------- */
function pintarReforma(){
  const R = reforma();

  $("#k_reforma").innerHTML =
    kpi("Provisionamento de reforma", "", brl(R.total), "soma do orçado por conjunto","frota:reforma") +
    kpi("Equipamentos em reforma", "t", fmt(R.unidades) + " un",
        R.unidades ? R.orcadas + " já com orçamento" : "nenhum marcado ainda","frota:reforma") +
    kpi("Custo médio por equipamento", "g", R.unidades ? brl(R.media) : "—","","frota:reforma") +
    kpi("Especialidades envolvidas", "a", fmt(R.esps.length),"","frota:reforma");

  if(!R.esps.length){
    $("#t_ref_resumo").innerHTML =
      `<tbody><tr><td class="calc" style="padding:18px">Nenhum equipamento marcado para reforma.
       Marque o destino de cada frota em <b>Manutenção de Frota</b> — abra o modelo no botão <b>+</b>
       e escolha <i>Vai reformar</i>. O que for marcado aparece aqui para orçar por conjunto.</td></tr></tbody>`;
    $("#t_ref_detalhe").innerHTML = "";
    $("#t_ref_conj").innerHTML = "";
    return;
  }

  // Resumo por especialidade, no formato da planilha de orçamento
  let agAtual = "";
  $("#t_ref_resumo").innerHTML = th([["Agrupamento / especialidade"], ["Modelos", 1], ["Equipamentos", 1],
      ["Orçados", 1], ["Total R$", 1], ["Média por equipamento", 1]]) + "<tbody>" +
    R.esps.slice().sort((a,b)=> a.ag.localeCompare(b.ag) || a.esp.localeCompare(b.esp)).map(e=>{
      const cab = e.ag !== agAtual
        ? (agAtual = e.ag, `<tr style="background:var(--bg)"><td class="tot" colspan="6">${e.ag}</td></tr>`) : "";
      return cab + `<tr><td style="padding-left:20px">${e.esp} <span class="badge">${e.grp}</span></td>
        <td class="num calc">${e.mods.length}</td>
        <td class="num tot">${e.unidades}</td>
        <td class="num ${e.orcadas < e.unidades ? "calc" : "tot"}">${e.orcadas}${
          e.orcadas < e.unidades ? ` <span class="badge b-warn">faltam ${e.unidades - e.orcadas}</span>` : ""}</td>
        <td class="num tot">${e.total ? brl(e.total) : "—"}</td>
        <td class="num calc">${e.total ? brl(e.media) : "—"}</td></tr>`;
    }).join("") +
    `<tr><td class="tot">TOTAL</td>
     <td class="num tot">${fmt(R.esps.reduce((s,e)=>s+e.mods.length,0))}</td>
     <td class="num tot">${fmt(R.unidades)}</td>
     <td class="num tot">${fmt(R.orcadas)}</td>
     <td class="num tot">${brl(R.total)}</td>
     <td class="num tot">${R.unidades ? brl(R.media) : "—"}</td></tr></tbody>`;

  // Detalhe: uma tabela por especialidade, conjuntos nas colunas
  $("#t_ref_detalhe").innerHTML = R.esps.map(e=>{
    const cols = e.conjuntos;
    return `<div class="panel" style="margin-top:14px">
      <h3>${e.esp} <span class="badge">${REFORMA_FAMILIAS[e.familia].rotulo}</span></h3>
      <div class="tblwrap"><table>
        ${th([["Modelo / frota"], ["Ano", 1], ...cols.map(c=>[c, 1]), ["Total", 1]])}
        <tbody>${e.mods.map(m=>
          `<tr style="background:var(--bg)"><td class="tot" colspan="2">${m.mod}
             <span class="calc" style="font-weight:400">· ${m.linhas.length} equipamento${m.linhas.length>1?"s":""}</span></td>
           ${cols.map(c=>`<td class="num tot">${somaConj(m, c) ? brl(somaConj(m, c)) : "—"}</td>`).join("")}
           <td class="num tot">${m.total ? brl(m.total) : "—"}</td></tr>` +
          m.linhas.map(l=>
            `<tr><td style="padding-left:22px">${l.cod}</td>
             <td class="num calc">${l.ano || "—"}</td>
             ${cols.map(c=>`<td class="num"><input data-ref="${l.cod}" data-c="${c}" value="${
               l.ref[c] != null ? l.ref[c] : ""}" placeholder="—" inputmode="decimal"></td>`).join("")}
             <td class="num ${l.total ? "tot" : "calc"}">${l.total ? brl(l.total) : "—"}</td></tr>`).join("")
        ).join("")}
        <tr><td class="tot" colspan="2">TOTAL DA ESPECIALIDADE</td>
          ${cols.map(c=>{ const v = e.mods.reduce((s,m)=>s+somaConj(m,c),0);
            return `<td class="num tot">${v ? brl(v) : "—"}</td>`;}).join("")}
          <td class="num tot">${e.total ? brl(e.total) : "—"}</td></tr>
        </tbody></table></div></div>`;
  }).join("");

  // Onde a reforma concentra gasto
  const conj = Object.entries(R.porConjunto).sort((a,b)=>b[1]-a[1]);
  const tot = conj.reduce((s,[,v])=>s+v, 0) || 1;
  $("#t_ref_conj").innerHTML = th([["Conjunto"], ["Total", 1], ["% da reforma", 1], ["Peso"]]) + "<tbody>" +
    (conj.length ? conj.map(([c,v])=>
      `<tr><td>${c}</td><td class="num">${brl(v)}</td>
       <td class="num calc">${fmt(v/tot*100, 1)}%</td>
       <td><div class="bar"><i style="width:${Math.min(v/tot*100, 100)}%"></i></div></td></tr>`).join("")
      : `<tr><td colspan="4" class="calc">Nenhum conjunto orçado ainda.</td></tr>`) +
    `<tr><td class="tot">TOTAL</td><td class="num tot">${brl(R.total)}</td>
     <td class="num tot">${conj.length ? "100,0%" : "—"}</td><td></td></tr></tbody>`;
}

/** Soma de um conjunto em todas as unidades de um modelo. */
function somaConj(m, c){
  return m.linhas.reduce((s,l)=> s + (l.ref[c] != null ? Number(l.ref[c]) || 0 : 0), 0);
}

export { pintarReforma };

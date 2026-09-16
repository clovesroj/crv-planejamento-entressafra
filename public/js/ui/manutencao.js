import { manutencao } from '../calculo/manutencao.js';
import { CRM_COMP, CRM_LABEL, opcoesDestino } from '../calculo/crm.js';
import { FROTA_ABERTO, FROTA_ORIG, FROTA_UN } from '../nucleo/estado.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- PLANEJAMENTO DE MANUTENÇÃO ---------- */
function pintarManut(){
  const M = manutencao();

  $("#sel_manut_orig").value = FROTA_ORIG;

  $("#k_manut").innerHTML =
    kpi("Frota que vai rodar", "", fmt(M.unidades) + " un",
        FROTA_ORIG === "todos" ? "próprias e de terceiros"
        : FROTA_ORIG === "proprio" ? "somente próprias" : "somente de terceiros") +
    kpi("Orçadas equipamento a equipamento", M.cobertura >= 1 ? "" : "a",
        fmt(M.orcadas) + " un", M.unidades ? pct(M.cobertura) + " da frota que roda" : "—") +
    kpi("Rodando sem taxa nenhuma", M.semTaxa ? "a" : "g", fmt(M.semTaxa) + " un",
        M.semTaxa ? "entram no plano custando zero" : "toda a frota que roda tem taxa") +
    kpi("Idade média da frota que roda", "t",
        M.idadeMedia != null ? fmt(M.idadeMedia, 1) + " anos" : "—");

  if(!M.esps.length){
    $("#t_manut").innerHTML =
      `<tbody><tr><td class="calc" style="padding:18px">Nenhum equipamento marcado para rodar com o
       filtro atual. O destino de cada frota é definido no Dimensionamento, na Manutenção de Frota
       ou no Resumo de Frota.</td></tr></tbody>`;
    return;
  }

  const ORIGEM_TARJA = {
    frota:         '<span class="badge b-ok">da frota</span>',
    modelo:        '<span class="badge">do modelo</span>',
    especialidade: '<span class="badge">da especialidade</span>',
    plano:         '<span class="badge">do plano</span>',
  };

  let corpo = "", agAtual = "";
  M.esps.slice().sort((a,b)=> a.ag.localeCompare(b.ag) || a.esp.localeCompare(b.esp)).forEach(e=>{
    if(e.ag !== agAtual){
      agAtual = e.ag;
      corpo += `<tr style="background:var(--bg)"><td class="tot" colspan="9">${e.ag}</td></tr>`;
    }
    const un = e.base === "K" ? "km" : "h";
    corpo += `<tr><td class="tot" style="padding-left:16px">${e.esp}
        <span class="badge">${e.grp}</span>
        ${e.semTaxa ? ' <span class="badge b-warn">sem taxa</span>' : ''}</td>
      <td class="num tot">${e.unidades}</td>
      <td class="num ${e.orcadas < e.unidades ? "calc" : "tot"}">${e.orcadas}</td>
      <td class="num calc">${fmt(e.unidades ? e.orcadas / e.unidades * 100 : 0, 0)}%</td>
      <td colspan="5"></td></tr>`;

    e.mods.forEach(m=>{
      const aberto = FROTA_ABERTO["mnt:" + m.chave];
      corpo += `<tr><td style="padding-left:34px">
          <button class="btn xs" data-abrefrota="mnt:${m.chave}" style="margin-right:6px;padding:1px 6px">${aberto ? "−" : "+"}</button>
          ${m.mod}${m.marca ? ` <span class="calc" style="font-weight:400">· ${m.marca}</span>` : ""}</td>
        <td class="num">${m.linhas.length}</td>
        <td class="num ${m.orcadas < m.linhas.length ? "calc" : "tot"}">${m.orcadas || "—"}</td>
        <td class="num calc">${fmt(m.linhas.length ? m.orcadas / m.linhas.length * 100 : 0, 0)}%</td>
        <td class="num ${m.taxa.total ? "tot" : "calc"}">${m.taxa.total ? brl(m.taxa.total, 2) + "/" + un : "—"}</td>
        <td>${m.taxa.origem ? ORIGEM_TARJA[m.taxa.origem] : '<span class="badge b-warn">falta orçar</span>'}</td>
        <td class="num calc">${m.idadeMedia != null ? fmt(m.idadeMedia, 1) + " anos" : "—"}</td>
        <td class="num ${m.maisVelho != null && m.maisVelho >= 15 ? "tot" : "calc"}"
            style="${m.maisVelho != null && m.maisVelho >= 15 ? "color:var(--amber)" : ""}">${
          m.maisVelho != null ? m.maisVelho + " anos" : "—"}</td>
        <td></td></tr>`;
      if(aberto) corpo += linhasUnidades(m, un);
    });
  });

  $("#t_manut").innerHTML = th([["Especialidade / modelo / equipamento"], ["Rodando", 1], ["Orçadas", 1],
    ["Cobertura", 1], ["CRM em vigor", 1], ["Origem da taxa"], ["Idade média", 1], ["Mais velho", 1], [""]])
    + "<tbody>" + corpo +
    `<tr><td class="tot">TOTAL DA FROTA QUE VAI RODAR</td>
     <td class="num tot">${fmt(M.unidades)}</td>
     <td class="num tot">${fmt(M.orcadas)}</td>
     <td class="num tot">${fmt(M.cobertura * 100, 0)}%</td>
     <td colspan="5"></td></tr></tbody>`;
}

/** Equipamentos do modelo, com os campos de CRM abertos para orçar. */
function linhasUnidades(m, un){
  return `<tr><td colspan="9" style="padding:0"><div style="padding:6px 0 10px 56px">
    <table style="width:auto;min-width:720px"><thead><tr>
      <th>Frota</th><th class="num">Ano</th><th class="num">Idade</th><th>Origem</th>
      ${CRM_COMP.map(k=>`<th class="num">${CRM_LABEL[k]}</th>`).join("")}
      <th class="num">CRM (R$/${un})</th><th>Destino</th></tr></thead>
    <tbody>${m.linhas.map(l=>{
      const bruto = (FROTA_UN[l.cod] || {}).crm || {};
      return `<tr><td>${l.cod}</td>
        <td class="num ${l.idade != null && l.idade >= 15 ? "tot" : "calc"}"
            style="${l.idade != null && l.idade >= 15 ? "color:var(--amber)" : ""}">${l.ano || "—"}</td>
        <td class="num calc">${l.idade != null ? l.idade + " anos" : "—"}</td>
        <td class="calc">${l.prop ? "Própria" : "Terceiro"}</td>
        ${CRM_COMP.map(k=>`<td class="num"><input data-uncrm="${l.cod}" data-k="${k}" value="${
          bruto[k] != null ? bruto[k] : ""}" placeholder="—" inputmode="decimal"></td>`).join("")}
        <td class="num ${l.crm.preenchida ? "tot" : "calc"}">${
          l.crm.preenchida ? brl(l.crm.total, 2) : `<span class="calc">herda ${brl(m.taxa.total, 2)}</span>`}</td>
        <td><select data-undest="${l.cod}">${opcoesDestino("roda")}</select></td></tr>`;
    }).join("")}</tbody></table>
    <div class="hint" style="margin-top:6px">Campo em branco herda a taxa do modelo ou da especialidade.
    Tirar o equipamento de <i>vai rodar</i> remove ele desta lista.</div>
  </div></td></tr>`;
}

export { pintarManut };

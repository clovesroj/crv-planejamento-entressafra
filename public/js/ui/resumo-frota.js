import { CFG } from '../dados/cfg.js';
import { FROTA_ESP, contaOrigem, destinoDe, opcoesDestino, rotuloItem } from '../calculo/crm.js';
import { FROTA_ABERTO, FROTA_ORIG } from '../nucleo/estado.js';
import { $, fmt, num, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- RESUMO DE FROTA ---------- */
function pintarResumoFrota(R){
  const oper = [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=> a.cat===b.cat ? b.qtd-a.qtd : a.cat.localeCompare(b.cat));
  const apoioFixo = R.AP.linhas.filter(l=>l.nec>0);
  const tpess = R.TP.linhas.filter(l=>num(l.qtd)>0);
  const irrig = R.IR.linhas.filter(l=>l.area>0);

  const totOper = oper.reduce((s,l)=>s+l.qtd,0);
  const totApoio = Math.ceil(R.AP.total);
  const totIrrig = irrig.reduce((s,l)=>s+l.nConj,0);

  $("#k_resfrota").innerHTML =
    kpi("Frota operacional + apoio","",fmt(totOper)+" un","máquinas e implementos","frota:oper") +
    kpi("Apoio de utilização fixa","t",fmt(totApoio)+" un","","frota:apoiofixo") +
    kpi("Transporte de pessoal","g",fmt(R.TP.veic)+" un",fmt(R.TP.lugares)+" lugares","tpess:total") +
    kpi("Conjuntos de irrigação","a",fmt(totIrrig)+" un") +
    kpi("Frota cadastrada (base)","t",
        fmt((CFG.frota_base||[]).reduce((s,e)=>s+contaOrigem(e.prop,e.terc),0))+" un",
        FROTA_ORIG==="todos" ? "próprias e de terceiros"
        : FROTA_ORIG==="proprio" ? "somente próprias" : "somente de terceiros");

  $("#t_rf_oper").innerHTML = th([["Agrupamento"],["Especialidade"],["Item"],["Horas do plano",1],
      ["Qtd necessária",1],["Cadastrada",1],["Situação"]])+"<tbody>"+
    oper.map(l=>{ const e = l.esp && FROTA_ESP[l.esp];
      const un = contaOrigem(l.baseProp, l.baseTerc);
      return `<tr><td class="calc">${e?e.ag:"—"}</td><td class="calc">${l.esp||"—"}</td>
      <td>${rotuloItem(l.item)}</td>
      <td class="num calc">${fmt(l.hTotPlano)}</td><td class="num tot">${fmt(l.qtd)}</td>
      <td class="num calc">${un||"—"}</td>
      <td>${l.extra>0?`<span class="badge b-warn">+${fmt(l.extra)} frota adicional</span>`:'<span class="calc">—</span>'}</td></tr>`;}).join("")+
    "</tbody>";

  // O plano dimensiona arquétipos, a base registra o que existe. Somar os dois
  // na especialidade é o que torna a comparação possível.
  const nec = {};
  R.crmFrotaL.forEach(l=>{ if(l.esp && l.qtd>0) nec[l.esp] = (nec[l.esp]||0) + l.qtd; });
  const espsBase = (CFG.frota_base||[]).filter(e=> contaOrigem(e.prop,e.terc)>0 || nec[e.esp]>0)
    .sort((a,b)=> a.ag.localeCompare(b.ag) || a.grp.localeCompare(b.grp) || a.esp.localeCompare(b.esp));
  let agAtual = "";
  // Unidades de uma especialidade, respeitando o filtro de origem
  const anoAtual = new Date().getFullYear();
  const unidadesDaEsp = e => e.mods.flatMap(m => (m.un||[])
      .filter(u => FROTA_ORIG==="todos" || (FROTA_ORIG==="proprio" ? u[2]===1 : u[2]===0))
      .map(u => ({mod:m.m, cod:u[0], ano:u[1], prop:u[2]})))
    .sort((a,b)=> b.ano-a.ano || a.cod.localeCompare(b.cod));

  $("#t_rf_base").innerHTML = th([["Agrupamento / especialidade"],["Modelos",1],["Próprios",1],["Terceiros",1],
      ["Cadastrada",1],["Vai rodar",1],["Vai reformar",1],["Stand by",1],["Exigida pelo plano",1],
      ["Folga",1],["Situação"]])+"<tbody>"+
    espsBase.map(e=>{
      const cab = e.ag!==agAtual ? (agAtual=e.ag, `<tr style="background:var(--bg)"><td class="tot" colspan="9">${e.ag}</td></tr>`) : "";
      const cad = contaOrigem(e.prop, e.terc), n = nec[e.esp]||0;
      const un = unidadesDaEsp(e);
      const emRef = un.filter(u=>destinoDe(u.cod)==="reforma").length;
      const emSb  = un.filter(u=>destinoDe(u.cod)==="standby").length;
      // A folga que interessa compara o que VAI RODAR com o que o plano pede.
      // Contra a frota cadastrada ela mente: uma especialidade com 24 equipamentos
      // e 17 na bancada mostraria folga de 18 tendo so 6 para trabalhar.
      const sit = situacao(un.length-emRef-emSb, nec[e.esp]||0);
      const aberto = FROTA_ABERTO["esp:"+e.esp];
      const linha = cab+`<tr><td style="padding-left:20px">${
          un.length?`<button class="btn xs" data-abrefrota="esp:${e.esp}" style="margin-right:6px;padding:1px 6px">${aberto?"−":"+"}</button>`:""
        }${e.esp} <span class="badge">${e.grp}</span></td>
        <td class="num calc">${e.mods.length}</td>
        <td class="num calc">${e.prop||"—"}</td><td class="num calc">${e.terc||"—"}</td>
        <td class="num tot">${cad||"—"}</td>
        <td class="num calc">${un.length-emRef-emSb||"—"}</td>
        <td class="num ${emRef?"tot":"calc"}" style="${emRef?"color:var(--amber)":""}">${emRef||"—"}</td>
        <td class="num ${emSb?"tot":"calc"}" style="${emSb?"color:var(--grey)":""}">${emSb||"—"}</td>
        <td class="num tot">${n?fmt(n):"—"}</td>
        <td class="num ${sit.classe}" style="${sit.cor}">${n?fmt(sit.folga):"—"}</td>
        <td>${sit.tarja}</td></tr>`;
      if(!aberto) return linha;
      return linha+`<tr><td colspan="11" style="padding:0"><div style="padding:6px 0 10px 46px">
        <table style="width:auto;min-width:520px"><thead><tr>
          <th>Frota</th><th>Modelo</th><th class="num">Ano</th><th class="num">Idade</th>
          <th>Origem</th><th>Destino na safra</th></tr></thead><tbody>${
          un.map(u=>{ const i = u.ano?anoAtual-u.ano:null, d = destinoDe(u.cod);
            return `<tr${d==="reforma"?' style="opacity:.62"':''}><td>${u.cod}</td><td class="calc">${u.mod}</td>
              <td class="num ${i!=null&&i>=15?"tot":"calc"}" style="${i!=null&&i>=15?"color:var(--amber)":""}">${u.ano||"—"}</td>
              <td class="num calc">${i!=null?i+" anos":"—"}</td>
              <td class="calc">${u.prop?"Própria":"Terceiro"}</td>
              <td><select data-undest="${u.cod}">${opcoesDestino(d)}</select></td></tr>`;}).join("")
        }</tbody></table>
        <div class="hint" style="margin-top:6px">O destino vale para as duas telas: o que for marcado aqui
        aparece igual na Manutenção de Frota. Quem vai reformar sai da conta do CRM e entra no
        provisionamento da aba Reforma de Frota.</div>
      </div></td></tr>`;
    }).join("")+
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.mods.length,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.prop,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+e.terc,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+contaOrigem(e.prop,e.terc),0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+unidadesDaEsp(e).filter(u=>destinoDe(u.cod)==="roda").length,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+unidadesDaEsp(e).filter(u=>destinoDe(u.cod)==="reforma").length,0))}</td>
     <td class="num tot">${fmt(espsBase.reduce((s,e)=>s+unidadesDaEsp(e).filter(u=>destinoDe(u.cod)==="standby").length,0))}</td>
     <td class="num tot">${fmt(Object.values(nec).reduce((a,b)=>a+b,0))}</td><td></td><td></td></tr></tbody>`;

  $("#t_rf_apoio").innerHTML = th([["Veículo / Máquina"],["Utilização",1],["Disponib.",1],["Necessidade",1],["Atividade"]])+"<tbody>"+
    apoioFixo.map(a=>`<tr><td>${a.nome}</td><td class="num calc">${pct(a.util)}</td>
      <td class="num calc">${pct(a.disp)}</td><td class="num tot">${a.nec.toFixed(2)}</td>
      <td class="calc">${a.ativ}</td></tr>`).join("")+
    "</tbody>";

  $("#t_rf_tpess").innerHTML = th([["Rota"],["Veículo"],["Qtd",1],["Lugares",1]])+"<tbody>"+
    tpess.map(t=>`<tr><td>${t.rota}</td><td class="calc">${t.veic}</td>
      <td class="num tot">${fmt(t.qtd)}</td><td class="num calc">${fmt(t.lugares)}</td></tr>`).join("")+
    "</tbody>";

  $("#t_rf_irrig").innerHTML = th([["Modalidade"],["Área",1],["Potência (CV)",1],["Conjuntos necessários",1]])+"<tbody>"+
    irrig.map(l=>`<tr><td>${l.nome}</td><td class="num calc">${fmt(l.area)} ha</td>
      <td class="num calc">${fmt(l.potCV,1)}</td><td class="num tot">${l.nConj}</td></tr>`).join("")+
    "</tbody>";
}


/**
 * Confronta a frota que vai rodar com a exigida pelo plano.
 * Sem exigencia do plano nao ha o que comparar: a especialidade nao e usada.
 */
function situacao(rodando, exigida){
  if(!exigida) return {folga:0, classe:"calc", cor:"", tarja:'<span class="calc">—</span>'};
  const folga = rodando - exigida;
  if(folga < 0) return {folga, classe:"tot", cor:"color:var(--red)",
    tarja:`<span class="badge b-warn">falta ${fmt(-folga)}</span>`};
  if(folga > 0) return {folga, classe:"calc", cor:"color:var(--grey)",
    tarja:`<span class="badge">sobra ${fmt(folga)}</span>`};
  return {folga:0, classe:"tot", cor:"", tarja:'<span class="badge b-ok">OK</span>'};
}

export { pintarResumoFrota };

import { CFG } from '../dados/cfg.js';
import { FROTA_ESP, contaOrigem, destinoDe, opcoesDestino, rotuloItem } from '../calculo/crm.js';
import { FROTA_ABERTO, FROTA_ORIG } from '../nucleo/estado.js';
import { $, esc, fmt, num, pct } from '../nucleo/formato.js';
import { kpi, maxSel, ordenarPorEtapa, tdMeses, th, thMeses } from './componentes.js';
import { NM } from '../nucleo/calendario.js';
import { criterioMensal, frotaDaAtividade } from '../calculo/atividade.js';
import { codExibir } from '../nucleo/codigo-atividade.js';

/* ---------- RESUMO DE FROTA ---------- */
function pintarResumoFrota(R){
  const SEL = R.SEL;   // recorte de meses da barra superior
  const oper = [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=> a.cat===b.cat ? b.qtd-a.qtd : a.cat.localeCompare(b.cat));
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

  /* Frota de apoio: a tabela EDITAVEL, que veio do Dimensionamento. Havia duas
     quase iguais -- uma aqui, so de leitura, e outra la, com a quantidade
     digitavel -- para a mesma pergunta e a mesma fonte (R.AP.linhas). Ficou a
     que deixa ajustar. */
  /* Frota de apoio: o MESMO numero que aparece nas atividades. Cada linha e uma
     especialidade do ERP, e a celula do mes e a soma das frentes que pedem
     aquele equipamento naquele mes. O Pico e o que precisa existir no patio:
     frentes que rodam em meses diferentes dividem o mesmo caminhao. */
  $("#t_apoio").innerHTML = th([["Especialidade"],["Frentes que pedem",1],...thMeses(),
      [SEL.parcial?"Pico no período":"Pico",1],["Ajuste",1]])+"<tbody>"+
    (R.AP.linhas.length ? R.AP.linhas.map(a=>`<tr>
      <td title="${esc(a.itens.join(" · "))}">${esc(a.esp)} — ${esc(a.nome)}</td>
      <td class="num calc" title="${esc(a.ativs.join(" · "))}">${a.ativs.length}</td>` +
      tdMeses(a.qtdMes, v=>v?fmt(v):'<span class="calc">—</span>', "num") +
      `<td class="num tot">${fmt(maxSel(a.qtdMes, SEL))}${a.mes?` <span class="calc">${a.mes}</span>`:""}</td>
       <td class="num"><input data-apf="${esc(a.esp)}" value="${a.ajustada?a.qtd:""}"
           placeholder="${a.pedido}" inputmode="decimal"
           title="Em branco vale o que as frentes pedem. Preenchido, fixa a quantidade — para quando o pátio tem mais do que o plano pede."></td></tr>`).join("")
      : `<tr><td colspan="${NM+4}" class="calc">Sem frente com volume lançado: nenhuma operação de apoio a dimensionar.</td></tr>`)+
    `<tr><td class="tot" colspan="2">TOTAL NO MÊS</td>` +
    tdMeses(R.AP.porMes, v=>fmt(v), "num tot") +
    `<td class="num tot">${fmt(Math.ceil(R.AP.total))}</td><td></td></tr></tbody>`;

  /* Necessidade de frota por MES, uma linha por atividade.
     Veio do Dimensionamento: a pergunta "em que mes a frota aperta" e de frota,
     e e aqui que estao as outras respostas sobre frota. A tabela por tipo de
     maquina, que somava o ano inteiro, escondia justamente o mes que decide
     compra e aluguel. */
  const L = ordenarPorEtapa(R.L, r=>r.a.etapa);
  $("#t_dim_frotames").innerHTML = th([["Cod"],["Atividade / frente"],["Máquina"],
    ...thMeses(),["Pico",1]])+"<tbody>"+
    (()=>{
      const linhas = L.filter(r=>r.total>0 && !r.junto);
      if(!linhas.length) return `<tr><td colspan="${NM+4}" class="calc">Sem atividade com volume lançado.</td></tr>`;
      const porMes = Array(NM).fill(0);
      const corpo = linhas.map(r=>{
        const C = criterioMensal(r);
        const F = frotaDaAtividade(r);
        C.forEach((c,i)=>{ porMes[i] += c.n; });
        return `<tr><td>${esc(codExibir(r.a.cod))}</td><td>${esc(r.a.nome)}</td>
          <td class="calc">${r.partes.length>1?"—":esc(r.maqEfetiva||"—")}</td>
          ${tdMeses(C.map(c=>c.n), (v,i)=>v>0?fmt(v):'<span class="calc">—</span>')}
          <td class="num tot">${fmt(F.pico)}${F.mes?` <span class="calc">${F.mes}</span>`:""}</td></tr>`;
      }).join("");
      return corpo + `<tr><td class="tot" colspan="3">SOMA DAS ATIVIDADES NO MÊS</td>` +
        tdMeses(porMes, v=>fmt(v), "num tot") +
        `<td class="num calc" title="Somar o pico de cada atividade nao da a frota da usina: atividades que picam em meses diferentes dividem a mesma maquina.">—</td></tr>`;
    })()+"</tbody>";
  $("#bl_frota_sub").textContent = `${fmt(R.frotaT)} equipamentos na operação · ${fmt(Math.ceil(R.AP.total))} de apoio`;

  $("#t_rf_tpess").innerHTML = th([["Rota"],["Veículo"],["Qtd",1],["Lugares",1]])+"<tbody>"+
    tpess.map(t=>`<tr><td>${esc(t.rota)}</td><td class="calc">${esc(t.veic)}</td>
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

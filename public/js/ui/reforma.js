import { reforma, valorConjunto, realDe } from '../calculo/reforma.js';
import { REFORMA_FAMILIAS } from '../dados/reforma.js';
import { GASTO_REFORMA_BI } from '../dados/gasto-reforma-bi.js';
import { FROTA_UN, REF_BUSCA, REF_AG, REF_FAM, REF_FROTA, REF_PROP } from '../nucleo/estado.js';
import { $, brl, fmt } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';
import { pintarGastoReal } from './gasto-real.js';

/* ---------- REFORMA DE FROTA ---------- */
function pintarReforma(){
  const R = reforma();
  pintarGastoReal();

  const bi = GASTO_REFORMA_BI;
  $("#ref_bi_status").innerHTML = bi.geradoEm
    ? `Gasto real por equipamento (abaixo dos campos de orçamento) veio do ERP via Power BI,
       extraído em ${new Date(bi.geradoEm).toLocaleString("pt-BR")},
       ${periodosResumo(bi.periodos)}.
       ${bi.truncado ? '<span class="badge b-warn">extração parcial — bateu no teto de segurança, pode faltar linha</span>' : ""}
       O que aparece na grade abaixo é o gasto dessa extração dentro da <b>janela do painel de filtros</b>
       (período, empresa, próprio, reforma) — mudou o filtro, muda a grade.
       Rode <code>npm run gasto-reforma-bi -- --inicio=AAAA-MM-DD --fim=AAAA-MM-DD</code> para estender o período.`
    : `Sem extração do ERP ainda — os campos abaixo mostram só o orçamento digitado.
       Rode <code>npm run gasto-reforma-bi -- --inicio=AAAA-MM-DD --fim=AAAA-MM-DD</code> para trazer o gasto real.`;

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

  // Filtro das especialidades mostradas (visão, não mexe no plano) — junta
  // os mesmos eixos que o relatório de origem (BI) oferecia: nome, agrupamento
  // e família. Todos opcionais e combináveis.
  const agsExistentes = [...new Set(R.esps.map(e=>e.ag))].sort();
  const selAg = $("#sel_ref_ag");
  if(selAg && selAg.dataset.opcoes !== agsExistentes.join("|")){
    selAg.innerHTML = `<option value="">Todos</option>` +
      agsExistentes.map(ag=>`<option value="${ag}">${ag}</option>`).join("");
    selAg.dataset.opcoes = agsExistentes.join("|");
  }
  if(selAg) selAg.value = REF_AG;
  const buscaEl = $("#ref_busca"); if(buscaEl && buscaEl.value !== REF_BUSCA) buscaEl.value = REF_BUSCA;
  const famEl = $("#sel_ref_fam"); if(famEl) famEl.value = REF_FAM;
  const frotaEl = $("#ref_frota"); if(frotaEl && frotaEl.value !== REF_FROTA) frotaEl.value = REF_FROTA;
  const propEl = $("#sel_ref_prop"); if(propEl) propEl.value = REF_PROP;

  const buscaNorm = REF_BUSCA.trim().toLowerCase();
  const frotaNorm = REF_FROTA.trim().toLowerCase();

  // Dois níveis de filtro: especialidade (painel inteiro some ou fica) e
  // equipamento (linha dentro do painel) — frota/modelo e próprio/terceiro
  // escondem só a unidade, não a especialidade toda. Por isso recalcula
  // total do modelo e da especialidade a partir do que sobrou, em vez de
  // usar e.total/m.total prontos (que contam TUDO, filtrado ou não).
  const espsParaExibir = R.esps
    .filter(e =>
      (!buscaNorm || e.esp.toLowerCase().includes(buscaNorm)) &&
      (!REF_AG || e.ag === REF_AG) &&
      (!REF_FAM || e.familia === REF_FAM))
    .map(e=>{
      const mods = e.mods
        .map(m=>{
          const linhas = m.linhas.filter(l =>
            (!frotaNorm || String(l.cod).toLowerCase().includes(frotaNorm) || m.mod.toLowerCase().includes(frotaNorm)) &&
            (!REF_PROP || (REF_PROP==="proprio" ? l.prop===1 : l.prop===0)));
          return linhas.length ? {...m, linhas, total: linhas.reduce((s,l)=>s+l.total,0)} : null;
        })
        .filter(Boolean);
      return mods.length ? {...e, mods, total: mods.reduce((s,m)=>s+m.total,0)} : null;
    })
    .filter(Boolean);

  // Detalhe: uma tabela por especialidade, conjuntos nas colunas
  $("#t_ref_detalhe").innerHTML = espsParaExibir.length ? espsParaExibir.map(e=>{
    const cols = e.conjuntos;
    return `<div class="panel" style="margin-top:14px">
      <h3>${e.esp} <span class="badge">${REFORMA_FAMILIAS[e.familia].rotulo}</span></h3>
      <div class="tblwrap"><table>
        ${th([["Modelo / frota"], ["Ano", 1], ...cols.map(c=>[c, 1]), ["Total", 1]])}
        <tbody>${e.mods.map(m=>
          `<tr style="background:var(--bg)"><td class="tot" colspan="2">${m.mod}
             <span class="calc" style="font-weight:400">· ${m.linhas.length} equipamento${m.linhas.length>1?"s":""}</span></td>
           ${cols.map(c=>`<td class="num tot">${somaConj(m, c, e.familia) ? brl(somaConj(m, c, e.familia)) : "—"}</td>`).join("")}
           <td class="num tot">${m.total ? brl(m.total) : "—"}</td></tr>` +
          m.linhas.map(l=>
            `<tr><td style="padding-left:22px">${l.cod}</td>
             <td class="num calc">${l.ano || "—"}</td>
             ${cols.map(c=>{ const real = gastoRealDe(e.familia, l.cod, c);
               if(real){
                 return `<td class="num"><span class="ref-real" data-rastro="reformabi:${e.familia}|${l.cod}|${c}"
                   tabindex="0" role="button" title="Valor do ERP (Power BI) — não editável aqui. Clique para ver os lançamentos.">${brl(real)}</span></td>`;
               }
               return `<td class="num"><span class="ref-busca-wrap"><input data-ref="${l.cod}" data-c="${c}" value="${
               l.ref[c] != null ? l.ref[c] : ""}" placeholder="—" inputmode="decimal" title="Digite o valor à mão">
               <button type="button" class="ref-buscar" data-rastro="reformabi:${e.familia}|${l.cod}|${c}"
                 tabindex="0" title="Buscar e incluir um lançamento do ERP deste equipamento">🔍</button></span></td>`;}).join("")}
             <td class="num ${l.total ? "tot" : "calc"}">${l.total ? brl(l.total) : "—"}</td></tr>`).join("")
        ).join("")}
        <tr><td class="tot" colspan="2">TOTAL DA ESPECIALIDADE</td>
          ${cols.map(c=>{ const v = e.mods.reduce((s,m)=>s+somaConj(m,c,e.familia),0);
            return `<td class="num tot">${v ? brl(v) : "—"}</td>`;}).join("")}
          <td class="num tot">${e.total ? brl(e.total) : "—"}</td></tr>
        </tbody></table></div></div>`;
  }).join("") : `<div class="panel" style="margin-top:14px">
      <p class="calc">Nada bate com esse filtro. Limpe algum campo ou escolha "Todos"/"Todas" acima.</p></div>`;
}

/** Soma de um conjunto em todas as unidades de um modelo (real do ERP + digitado). */
function somaConj(m, c, familia){
  return m.linhas.reduce((s,l)=> s + valorConjunto(l.cod, c, familia), 0);
}

/** Gasto real (ERP/Power BI) de uma unidade num conjunto, ja descontando o que foi desmarcado no rastro. Null sem dado. */
function gastoRealDe(familia, cod, conjunto){
  return realDe(cod, conjunto, familia) || null;
}

/** "2026-04-01" -> "01/04/2026" */
function fmtDataISO(iso){
  const [a,m,d] = (iso || "").split("-");
  return a ? `${d}/${m}/${a}` : "—";
}

/** Resumo do(s) período(s) e especialidade(s) cobertos pela extração — pode ter vindo de várias fatias. */
function periodosResumo(periodos){
  if(!periodos || !periodos.length) return "período desconhecido";
  const inicio = periodos.map(p=>p.inicio).sort()[0];
  const fim = periodos.map(p=>p.fim).sort().at(-1);
  const esps = [...new Set(periodos.map(p=>p.especialidade).filter(Boolean))];
  const todas = periodos.some(p=>!p.especialidade);
  const faixa = `período ${fmtDataISO(inicio)}–${fmtDataISO(fim)}` +
    (todas ? ", todas as especialidades" : esps.length ? `, só ${esps.join(", ")}` : "");
  return periodos.length > 1 ? `${faixa} (${periodos.length} fatias somadas)` : faixa;
}

export { pintarReforma };

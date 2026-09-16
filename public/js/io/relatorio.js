import { calcularCompleto } from '../app/ciclo.js';
import { ARR_FORMAS, ETAPAS_ORD } from '../calculo/arrendamento.js';
import { deptIdx } from '../calculo/pessoas.js';
import { CFG } from '../dados/cfg.js';
import { LOGO } from '../dados/logo.js';
import { CAT_LBL, MESES } from '../nucleo/calendario.js';
import { INSUMO, P, insLista } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { CONTA_COMBINADA, contasValores } from '../ui/contas.js';
import { comps } from '../ui/custos.js';
import { baixar } from './arquivo.js';

/* ---------- RELATÓRIO (PDF / EXCEL) ---------- */
// Monta as seções do relatório uma única vez e reaproveita tanto no Excel quanto no PDF.
function relatorioSecoes(R, nivel){
  const secoes = [];
  const add = (aba,titulo,cab,linhas) => secoes.push({aba,titulo,cab,linhas});

  add("Resumo","Resumo Executivo",["Indicador","Valor"],[
    ["Safra","2026/2027"],["Unidade","Capinópolis-MG"],
    ["Custo total projetado", brl(R.total)],
    ["Custo por ha plantado", brl(R.total/(P.plantio||1))],
    ["Hectares operados", fmt(R.haOp)+" ha"],
    ["Efetivo total", fmt(R.efetivoTotal)+" pessoas"],
    ["Atividades programadas", R.L.filter(r=>r.total>0).length+" de "+R.L.length],
  ]);

  const totEt = Object.values(R.etapas).reduce((s,e)=>s+e.total,0)||1;
  add("Custo por etapa","Custo por etapa",
    ["Etapa","Diesel","Mão de obra","Manutenção","Insumos","Terceirização","Arrendamento","Indireto","Total","% do total"],
    Object.entries(R.etapas).sort((a,b)=>b[1].total-a[1].total).map(([e,d])=>
      [e, brl(d.diesel), brl(d.mdo), brl(d.manut), brl(d.insumo+(d.irrig||0)), brl(d.terc),
        brl(d.arrend), brl(d.indireto), brl(d.total), fmt(d.total/totEt*100,1)+"%"]));

  add("Natureza","Composição por natureza",["Natureza","Total","%"],
    comps(R).filter(([,v])=>v>0).map(([n,v])=>[n, brl(v), fmt(R.total>0?v/R.total*100:0,1)+"%"]));

  const catLbl = {mdo:"Mão de obra",manut:"Manutenção",diesel:"Diesel",insumo:"Insumos+irrigação",
    terc:"Terceirização+transporte",arrend:"Arrendamento",fixo:"Fixos (adm./deprec.)",espor:"Esporádicos"};
  add("Contas por mês","Grandes contas por mês",["Conta",...MESES,"Total"],
    Object.keys(catLbl).map(k=>{const l=R.mesesCat[k];
      return [catLbl[k], ...l.map(v=>brl(v)), brl(l.reduce((s,v)=>s+v,0))];}));

  add("Períodos","Custos por período — safra (abr a nov) e entressafra (dez a mar)",["Grande conta","Safra","Entressafra","Total"],
    Object.keys(CAT_LBL).map(k=>[CAT_LBL[k], brl(R.PER.safra.cat[k]), brl(R.PER.entressafra.cat[k]),
      brl(R.PER.safra.cat[k]+R.PER.entressafra.cat[k])])
    .concat([["TOTAL", brl(R.PER.safra.total), brl(R.PER.entressafra.total), brl(R.PER.safra.total+R.PER.entressafra.total)]]));
  add("Etapas por período","Custo por etapa — safra e entressafra",["Etapa","Safra","Entressafra","Total"],
    Object.keys(R.etapaMes).filter(e=>R.PER.safra.etapa[e]+R.PER.entressafra.etapa[e]>0.5)
      .map(e=>[e, brl(R.PER.safra.etapa[e]), brl(R.PER.entressafra.etapa[e]), brl(R.PER.safra.etapa[e]+R.PER.entressafra.etapa[e])]));

  add("Arrendamentos","Arrendamentos — fazendas",
    ["Fazenda","Grupo","Área (ha)","Forma de pagamento","R$/ha/ano","Custo anual","Custo no orçamento"],
    R.AR.linhas.map(l=>[l.faz, l.grupo, fmt(l.area), (ARR_FORMAS[l.forma]||{nome:l.forma}).nome,
      brl(l.rsHa,2), brl(l.anual), brl(l.periodo)])
    .concat([["TOTAL","",fmt(R.AR.area),"",R.AR.area>0?brl(R.AR.anual/R.AR.area,2):"—",brl(R.AR.anual),brl(R.AR.total)]]));
  add("Arrendamento por etapa","Arrendamento — rateio por etapa (referência PECEGE/USP)",["Etapa","% aplicado","Valor"],
    ETAPAS_ORD.filter(e=>R.etapas[e]&&R.etapas[e].arrend>0).map(e=>[e,
      fmt(R.arrT>0?R.etapas[e].arrend/R.arrT*100:0,1)+"%", brl(R.etapas[e].arrend)]));

  add("Combustível","Combustível — diesel projetado",["Mês","Litros","Preço (R$/L)","Custo"],
    MESES.map((m,i)=>[m, fmt(R.CB.litrosOperMes[i]+R.CB.litrosApoioMes[i]), brl(R.CB.preco[i],2),
      brl(R.CB.custoOperMes[i]+R.CB.custoApoioMes[i])])
    .concat([["TOTAL", fmt(R.CB.litrosT), R.CB.litrosT>0?brl(R.dieselT/R.CB.litrosT,2):"—", brl(R.dieselT)]]));

  // o relatório pode receber o resultado de calcular() puro, que não traz o resumo de pessoas
  const PS = R.PS || calcularCompleto().PS;
  add("Pessoas por depto","Pessoas por departamento",["Departamento","Efetivo","Pico mensal","Custo MDO"],
    Object.entries(PS.porDept).sort((a,b)=>deptIdx(a[0])-deptIdx(b[0]))
      .map(([d,o])=>[d, fmt(o.qtd), fmt(o.pico), brl(o.custo)])
      .concat([["TOTAL", fmt(PS.qtd), fmt(Math.max(...PS.qtdMes)), brl(PS.custo)]]));
  add("Pessoas por função","Pessoas por função",["Cod","Função","Efetivo","Pico mensal","Custo MDO"],
    Object.entries(PS.porFun).sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([f,o])=>[f, (R.MP.custoFuncao[f]||{nome:f}).nome, fmt(o.qtd), fmt(o.pico), brl(o.custo)]));
  add("Fluxo mensal MDO","Fluxo mensal — pessoas e custo de mão de obra",["Mês","Pessoas","Custo MDO","Acumulado"],
    (()=>{ let ac=0; return MESES.map((m,i)=>{ ac+=PS.custoMes[i]; return [m, fmt(PS.qtdMes[i]), brl(PS.custoMes[i]), brl(ac)]; }); })());

  add("Frota","Frota — necessidade projetada",["Categoria","Item","Qtd necessária"],
    [...R.crmFrotaL].filter(l=>l.qtd>0).sort((a,b)=>b.qtd-a.qtd).map(l=>[l.cat,l.item,fmt(l.qtd)]));

  if(nivel==="detalhado"){
    add("Plano Operacional","Plano Operacional",["Cod","Atividade","Un",...MESES,"Total"],
      R.L.filter(r=>r.total>0).map(r=>[r.a.cod,r.a.nome,r.a.un,...r.meses.map(m=>fmt(num(m))),fmt(r.total)]));

    add("Mão de Obra","Mão de Obra — Funções",["Cod","Função","Salário","Custo mensal","Custo hora"],
      CFG.funcoes.map(f=>{const c=R.MP.custoFuncao[f.cod];
        return [f.cod,f.nome,brl(f.sal),brl(c.mensal),brl(c.hora,2)];}));

    add("CRM Manutenção","Manutenção de Frota — CRM",
      ["Categoria","Item","Frota prevista","Uso p/ CRM","CRM total"],
      [...R.crmFrotaL].filter(l=>l.qtd>0||l.hTotPlano>0).map(l=>
        [l.cat,l.item,fmt(l.qtd),fmt(l.baseUso)+" "+l.unidade,brl(l.total)]));

    add("Insumos","Insumos — Cadastro",["Produto","Un","Volume dem.","Estoque","Preço corrigido","Necessidade"],
      insLista().map(i=>{const ov=INSUMO[i.prod]||{};
        const preco=(ov.preco!=null?num(ov.preco):num(i.preco))*(1+P.ipreco/100);
        const est=ov.est!=null?num(ov.est):num(i.est); const vol=R.volDem[i.prod]||0;
        return [i.prod,i.un||"—",fmt(vol,1),fmt(est),brl(preco,2),fmt(Math.max(0,vol-est),1)];}));

    const CV = contasValores(R);
    add("Plano de Contas","Plano de Contas",["Conta","Descrição","Grupo","Custo projetado"],
      CFG.contas.map(c=>{const combinada=CONTA_COMBINADA[c.conta];
        return [c.conta,c.desc,c.grupo, combinada?"incluído em "+combinada:(CV[c.conta]!=null?brl(CV[c.conta]):"—")];}));
  }
  return secoes;
}

async function gerarExcel(nivel){
  if(typeof XLSX==="undefined"){ alert("A biblioteca de planilha não carregou. Verifique a conexão e tente novamente."); return; }
  const R = calcularCompleto();
  const secoes = relatorioSecoes(R, nivel);
  const wb = XLSX.utils.book_new();
  const usados = new Set();
  secoes.forEach(s=>{
    let nome = s.aba.slice(0,31), n=2;
    while(usados.has(nome)){ nome = s.aba.slice(0,28)+" "+n; n++; }
    usados.add(nome);
    const ws = XLSX.utils.aoa_to_sheet([[s.titulo],[],s.cab, ...s.linhas]);
    XLSX.utils.book_append_sheet(wb, ws, nome);
  });
  const out = XLSX.write(wb,{bookType:"xlsx",type:"array"});
  await baixar(out, `planejamento_entressafra_${nivel}.xlsx`,
               "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function gerarPDF(nivel){
  const R = calcularCompleto();
  const secoes = relatorioSecoes(R, nivel);
  // papel branco: logo azul original
  let html = `<img class="rel-logo" src="${LOGO}" alt="CRV Industrial">
    <h1>CRV Industrial — Planejamento de Entressafra</h1>
    <p>Safra 2026/2027 · Unidade Capinópolis-MG · Relatório ${nivel==="detalhado"?"detalhado":"resumido"} ·
    gerado em ${new Date().toLocaleDateString("pt-BR")}</p>`;
  secoes.forEach(s=>{
    html += `<h2>${s.titulo}</h2><table><thead><tr>${s.cab.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>`+
      (s.linhas.length? s.linhas.map(l=>`<tr>${l.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${s.cab.length}">Sem dados lançados.</td></tr>`)+
      `</tbody></table>`;
  });
  $("#print_report").innerHTML = html;
  setTimeout(()=>window.print(),80);
}

$("#btn_report").onclick=()=>{ $("#report_pop").hidden = !$("#report_pop").hidden; };
document.addEventListener("click",e=>{
  if(!e.target.closest(".reportbox")) $("#report_pop").hidden = true;
});
$("#btn_report_pdf").onclick=()=>{ $("#report_pop").hidden=true; gerarPDF($("#sel_report_nivel").value); };
$("#btn_report_xlsx").onclick=()=>{ $("#report_pop").hidden=true; gerarExcel($("#sel_report_nivel").value); };


export { gerarExcel, gerarPDF, relatorioSecoes };

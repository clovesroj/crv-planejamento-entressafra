import { tarifaTerc, tarifaTercDe, temDetalheTerc } from '../calculo/atividade.js';
import { CONTA_COMBINADA, SEM_CONTA, contasValores, totaisContas } from '../calculo/contas.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- PLANO DE CONTAS ----------
   O mapeamento das contas mora em calculo/contas.js — a tela, o relatório, o
   rastro e a Validação leem o mesmo. */
function pintarContas(R){
  const fix=CFG.contas.filter(c=>c.cls==="Fixo").length;
  const vari=CFG.contas.filter(c=>c.cls==="Variável").length;
  const cst=CFG.contas.filter(c=>c.cd==="Custo").length;
  const CV = contasValores(R);
  const {mapeado, semConta, total: somaContas} = totaisContas(CV);
  $("#k_cc").innerHTML =
    kpi("Contas cadastradas","",CFG.contas.length,"","contas:total") +
    kpi("Variáveis","t",vari,"","contas:total") + kpi("Fixas","a",fix,"","contas:total") +
    kpi("Custo mapeado às contas","g",brl(mapeado),fmt(R.total>0?mapeado/R.total*100:0,1)+"% do custo total"+
      (semConta>0?" · "+brl(semConta)+" sem conta":""),"contas:total");

  $("#t_terc").innerHTML = th([["Cod"],["Serviço"],["Centro de custo"],["Un."],["Valor",1],["Volume",1],["Total",1]])+"<tbody>"+
    R.TC.itens.map(i=>`<tr><td>${i.cod}</td><td>${i.desc}</td><td class="calc">${i.cc}</td>
      <td class="calc">${i.un}</td><td class="num calc">${brl(i.tarifa,2)}</td>
      <td class="num calc">${fmt(i.vol)}</td><td class="num tot">${brl(i.total)}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="6">TOTAL</td><td class="num tot">${brl(R.TC.total)}</td></tr></tbody>`;

  // tarifas de prestação de serviço por atividade com frente terceirizada.
  // Atividade com detalhamento por sub-modo (avião/drone/terrestre — TERC_SUB)
  // trava a tarifa única aqui: editar as duas ao mesmo tempo confundiria qual
  // vale. O detalhe se ajusta no "›" ao lado do 3º, no Plano Operacional.
  const comTerc = R.L.filter(x=>x.partes.some(p=>p.terc));
  $("#t_tarifa").innerHTML = th([["Cod"],["Atividade"],["% terceirizado",1],["Área terceirizada",1],
    ["Valor (R$/ha)",1],["Custo",1]])+"<tbody>"+
    (comTerc.length? comTerc.map(x=>{
      const p = x.partes.find(z=>z.terc);
      const detalhado = temDetalheTerc(x.a.cod);
      return `<tr><td>${x.a.cod}</td><td>${x.a.nome}</td>
        <td class="num calc">${fmt(p.pct*100,1)}%</td>
        <td class="num calc">${fmt(p.area)} ha</td>
        <td class="num">${detalhado
          ? `<span class="calc" title="Detalhado por avião/drone/terrestre no Plano Operacional">${brl(tarifaTercDe(x.a.cod),2)}</span>`
          : `<input data-tt="${x.a.cod}" value="${tarifaTerc(x.a.cod)}" inputmode="decimal">`}</td>
        <td class="num tot">${brl(p.cTerc)}</td></tr>`;}).join("")
      : `<tr><td colspan="6" class="calc">Nenhuma atividade com frente terceirizada. Marque o percentual na coluna "3º" do Plano Operacional.</td></tr>`)+
    `<tr><td class="tot" colspan="5">TOTAL DE APLICAÇÕES TERCEIRIZADAS</td>
     <td class="num tot">${brl(R.tercAtivT)}</td></tr></tbody>`;

  let grupoAtual="", ct = th([["Conta"],["Descrição"],["Natureza"],["Classificação"],["Custo/Despesa"],
    ["Direcionador"],["Custo projetado",1]])+"<tbody>";
  CFG.contas.forEach(c=>{
    if(c.grupo!==grupoAtual){ grupoAtual=c.grupo; ct+=`<tr class="stage"><td colspan="7">${c.grupo}</td></tr>`; }
    const combinada = CONTA_COMBINADA[c.conta];
    const valor = combinada ? null : CV[c.conta];
    ct += `<tr><td>${c.conta}</td><td>${c.desc}</td>
      <td class="calc">${c.nat}</td>
      <td><span class="badge ${c.cls==="Fixo"?"b-warn":"b-ok"}">${c.cls}</span></td>
      <td><span class="badge ${c.cd==="Custo"?"b-ok":"b-warn"}">${c.cd}</span></td>
      <td class="calc">${c.dir}</td>
      <td class="num ${valor?"tot":"calc"}">${combinada?"incluído em "+combinada
        : (valor!=null?brl(valor):"—")}</td></tr>`;
  });
  ct += `<tr><td class="tot" colspan="6">TOTAL MAPEADO ÀS CONTAS</td>
    <td class="num tot">${brl(mapeado)}</td></tr>`;
  // o que não tem conta no plano aparece aqui, para a soma fechar com o custo total
  const semLinhas = Object.entries(SEM_CONTA).filter(([k])=>(CV[k]||0)>0.5);
  if(semLinhas.length){
    ct += `<tr class="stage" id="contas_semconta"><td colspan="7">Sem conta no plano de contas</td></tr>` +
      semLinhas.map(([k,rot])=>`<tr><td class="calc">—</td><td>${rot}</td><td colspan="4"></td>
        <td class="num">${brl(CV[k])}</td></tr>`).join("");
  }
  ct += `<tr><td class="tot" colspan="6">TOTAL — CONFERE COM O CUSTO DO PLANO</td>
    <td class="num tot">${brl(somaContas)}</td></tr></tbody>`;
  $("#t_contas").innerHTML = ct;
}


export { CONTA_COMBINADA, contasValores, pintarContas };

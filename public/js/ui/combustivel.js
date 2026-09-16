import { MESES, NM } from '../nucleo/calendario.js';
import { DIESEL_MES, P } from '../nucleo/estado.js';
import { $, brl, fmt, num } from '../nucleo/formato.js';
import { barras, kpi, th } from './componentes.js';

/* ---------- COMBUSTÍVEL ---------- */
function pintarCombustivel(R){
  const C = R.CB, soma = a=>a.reduce((s,x)=>s+x,0);
  const litrosMes = MESES.map((m,i)=>C.litrosOperMes[i]+C.litrosApoioMes[i]);
  const custoMes  = MESES.map((m,i)=>C.custoOperMes[i]+C.custoApoioMes[i]);
  const litrosT = soma(litrosMes), custoT = soma(custoMes);
  const iPico = litrosMes.indexOf(Math.max(...litrosMes));

  $("#k_comb").innerHTML =
    kpi("Volume de diesel necessário","",fmt(litrosT)+" L", fmt(litrosT/NM)+" L/mês em média") +
    kpi("Custo de diesel","t",brl(custoT),"conta 200-110 · Combustível") +
    kpi("Preço médio ponderado","g",brl(litrosT>0?custoT/litrosT:P.diesel,2)+"/L","ponderado pelo volume mensal") +
    kpi("Mês de pico","a",litrosT>0?MESES[iPico]:"—", litrosT>0?fmt(litrosMes[iPico])+" L":"sem volume lançado");

  $("#t_comb_preco").innerHTML = th([[""],...MESES.map(m=>[m,1])]) + "<tbody>" +
    `<tr><td>Preço (R$/L)</td>` + MESES.map((m,i)=>{
      const v = DIESEL_MES[i];
      return `<td class="num"><input data-dm="${i}" value="${v!=null?+num(v).toFixed(4):""}"
        placeholder="${+P.diesel.toFixed(2)}" inputmode="decimal"></td>`;}).join("") + `</tr></tbody>`;

  const linhaTab = (rot,arr,f,forte)=>`<tr><td${forte?' class="tot"':''}>${rot}</td>`+
    arr.map(v=>`<td class="num ${forte?"tot":"calc"}">${f(v)}</td>`).join("")+
    `<td class="num tot">${f(soma(arr))}</td></tr>`;
  let tm = th([["Mês"],...MESES.map(m=>[m,1]),["Total",1]]) + "<tbody>" +
    linhaTab("Litros — operação do plano", C.litrosOperMes, v=>fmt(v)) +
    linhaTab("Litros — equipamentos de apoio", C.litrosApoioMes, v=>fmt(v)) +
    linhaTab("Volume de diesel necessário (L)", litrosMes, v=>fmt(v), true) +
    `<tr><td>Preço aplicado (R$/L)</td>` + C.preco.map(p=>`<td class="num calc">${brl(p,2)}</td>`).join("") +
    `<td class="num calc">${litrosT>0?brl(custoT/litrosT,2):"—"}</td></tr>` +
    linhaTab("Custo de diesel (R$)", custoMes, v=>brl(v), true);
  if(C.litrosIrrig>0)
    tm += linhaTab("Irrigação com motobomba a diesel (L) — custo em Irrigação", C.litrosIrrigMes, v=>fmt(v));
  $("#t_comb_mes").innerHTML = tm + "</tbody>";
  barras($("#ch_comb"), MESES.map((m,i)=>({l:m, v:litrosMes[i]})), "#B98A3E", "L");

  const et = Object.entries(R.etapas).filter(([,d])=>d.litros>0).sort((a,b)=>b[1].litros-a[1].litros);
  const lEt = et.reduce((s,[,d])=>s+d.litros,0), cEt = et.reduce((s,[,d])=>s+d.diesel,0);
  let te = th([["Etapa"],["Litros",1],["% do volume",1],["Custo diesel",1],["R$/L",1],["Consumo por unidade",1]]) + "<tbody>" +
    (et.length ? et.map(([e,d])=>{
      const base = d.ha>0?d.ha:d.ton, un = d.ha>0?"ha":"t";
      return `<tr><td>${e}</td><td class="num tot">${fmt(d.litros)}</td>
        <td class="num calc">${fmt(lEt>0?d.litros/lEt*100:0,1)}%</td><td class="num">${brl(d.diesel)}</td>
        <td class="num calc">${brl(d.diesel/d.litros,2)}</td>
        <td class="num calc">${base>0?fmt(d.litros/base,1)+" L/"+un:"—"}</td></tr>`;}).join("")
      : `<tr><td colspan="6" class="calc">Sem consumo nas etapas: lance quantidades no Plano Operacional.</td></tr>`);
  // sem litros no plano, o diesel do apoio não tem como ser rateado entre etapas
  if(litrosT-lEt>0.5)
    te += `<tr><td class="calc">Equipamentos de apoio — sem etapa para ratear</td><td class="num calc">${fmt(litrosT-lEt)}</td>
      <td></td><td class="num calc">${brl(custoT-cEt)}</td><td colspan="2"></td></tr>`;
  $("#t_comb_etapa").innerHTML = te +
    `<tr><td class="tot">TOTAL</td><td class="num tot">${fmt(litrosT)}</td><td class="num tot">100,0%</td>
     <td class="num tot">${brl(custoT)}</td><td colspan="2"></td></tr></tbody>`;

  const mq = {};
  const addM = (nome,cons,horas,frota,litros,custo)=>{
    const o = mq[nome] = mq[nome] || {cons, horas:0, frota:0, litros:0, custo:0};
    o.horas+=horas; o.frota+=frota; o.litros+=litros; o.custo+=custo; };
  R.L.forEach(r=>r.partes.forEach(p=>{ if(!p.terc && p.litros>0) addM(p.maq,p.consumoLh,p.horas,p.frotaR,p.litros,p.cDiesel); }));
  R.AE.linhas.forEach(l=>{ if(l.litros>0) addM(l.maq+" (apoio)",l.consumoLh,l.horas,num(l.qtd),l.litros,l.diesel); });
  const lm = Object.entries(mq).sort((a,b)=>b[1].litros-a[1].litros);
  $("#t_comb_maq").innerHTML = th([["Equipamento"],["Consumo (L/h)",1],["Frota",1],["Horas",1],["Litros",1],["Custo diesel",1],["% do volume",1]]) + "<tbody>" +
    (lm.length ? lm.map(([n,o])=>`<tr><td>${n}</td><td class="num calc">${fmt(o.cons,1)}</td>
      <td class="num calc">${fmt(o.frota)}</td><td class="num calc">${fmt(o.horas)}</td>
      <td class="num tot">${fmt(o.litros)}</td><td class="num">${brl(o.custo)}</td>
      <td class="num calc">${litrosT>0?fmt(o.litros/litrosT*100,1)+"%":"—"}</td></tr>`).join("")
      : `<tr><td colspan="7" class="calc">Nenhum equipamento com consumo projetado.</td></tr>`) + "</tbody>";
}


export { pintarCombustivel };

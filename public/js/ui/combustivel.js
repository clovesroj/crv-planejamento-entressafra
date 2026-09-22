import { MESES, NM } from '../nucleo/calendario.js';
import { DIESEL_MES, P } from '../nucleo/estado.js';
import { $, brl, esc, fmt, num } from '../nucleo/formato.js';
import { consumoDe, velPadrao } from '../calculo/consumo.js';
import { barras, kpi, somaSel, tdMeses, th, thMeses } from './componentes.js';

/* ---------- COMBUSTÍVEL ---------- */
function pintarCombustivel(R){
  const C = R.CB, soma = a=>a.reduce((s,x)=>s+x,0);
  const litrosMes = MESES.map((m,i)=>C.litrosOperMes[i]+C.litrosApoioMes[i]);
  const custoMes  = MESES.map((m,i)=>C.custoOperMes[i]+C.custoApoioMes[i]);
  const litrosT = soma(litrosMes), custoT = soma(custoMes);
  const iPico = litrosMes.indexOf(Math.max(...litrosMes));

  $("#k_comb").innerHTML =
    kpi("Volume de diesel necessário","",fmt(litrosT)+" L", fmt(litrosT/NM)+" L/mês em média","diesel:total") +
    kpi("Custo de diesel","t",brl(custoT),"conta 200-110 · Combustível","nat:diesel") +
    kpi("Preço médio ponderado","g",brl(litrosT>0?custoT/litrosT:P.diesel,2)+"/L","ponderado pelo volume mensal","diesel:total") +
    kpi("Mês de pico","a",litrosT>0?MESES[iPico]:"—", litrosT>0?fmt(litrosMes[iPico])+" L":"sem volume lançado","diesel:total");

  const SEL = R.SEL;
  $("#t_comb_preco").innerHTML = th([[""],...thMeses()]) + "<tbody>" +
    `<tr><td>Preço (R$/L)</td>` + tdMeses(MESES, (m,i)=>{
      const v = DIESEL_MES[i];
      return `<input data-dm="${i}" value="${v!=null?+num(v).toFixed(4):""}"
        placeholder="${+P.diesel.toFixed(2)}" inputmode="decimal">`;}, "num") + `</tr></tbody>`;

  const linhaTab = (rot,arr,f,forte)=>`<tr><td${forte?' class="tot"':''}>${rot}</td>`+
    tdMeses(arr, v=>f(v), forte?"num tot":"num calc")+
    `<td class="num tot">${f(somaSel(arr, SEL))}</td></tr>`;
  let tm = th([["Mês"],...thMeses(),[SEL.parcial?"Total do período":"Total",1]]) + "<tbody>" +
    linhaTab("Litros — operação do plano", C.litrosOperMes, v=>fmt(v)) +
    linhaTab("Litros — equipamentos de apoio", C.litrosApoioMes, v=>fmt(v)) +
    linhaTab("Volume de diesel necessário (L)", litrosMes, v=>fmt(v), true) +
    `<tr><td>Preço aplicado (R$/L)</td>` + tdMeses(C.preco, p=>brl(p,2)) +
    `<td class="num calc">${(()=>{const l=somaSel(litrosMes,SEL);
      return l>0?brl(somaSel(custoMes,SEL)/l,2):"—";})()}</td></tr>` +
    linhaTab("Custo de diesel (R$)", custoMes, v=>brl(v), true);
  if(C.litrosIrrig>0)
    tm += linhaTab("Irrigação com motobomba a diesel (L) — custo em Irrigação", C.litrosIrrigMes, v=>fmt(v));
  $("#t_comb_mes").innerHTML = tm + "</tbody>";
  barras($("#ch_comb"), MESES.map((m,i)=>({l:m, v:litrosMes[i]})), "#2A57A0", "L");

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

  /* Consumo por equipamento. Cada linha diz em que unidade o equipamento
     consome (L/h ou L/km) e com que número; os dois são editáveis e valem para
     o sistema inteiro — é o cadastro da máquina, o mesmo da aba Manutenção de
     Frota. Horas e km são projetados pelo plano: horas pelas premissas de cada
     atividade; km pelas viagens do transporte ou por horas × velocidade média. */
  const mq = {};
  const addM = (nome, maq, horas, frota, litros, custo, km, fonteKm)=>{
    const o = mq[nome] = mq[nome] || {maq, horas:0, frota:0, litros:0, custo:0, km:0, temKm:false, fontes:new Set()};
    o.horas+=horas; o.frota+=frota; o.litros+=litros; o.custo+=custo;
    if(km!=null){ o.km+=km; o.temKm=true; }
    if(fonteKm) o.fontes.add(fonteKm); };
  R.L.forEach(r=>r.partes.forEach(p=>{ if(!p.terc && (p.litros>0 || p.horas>0))
    addM(p.maq, p.maq, p.horas, p.frotaR, p.litros, p.cDiesel, p.km, p.fonteKm); }));
  R.AE.linhas.forEach(l=>{ if(l.litros>0 || l.horas>0)
    addM(l.maq+" (apoio)", l.maq, l.horas, num(l.qtd), l.litros, l.diesel, l.km, l.fonteKm); });
  const lm = Object.entries(mq).sort((a,b)=>b[1].litros-a[1].litros);
  const nKm = lm.filter(([,o])=>consumoDe(o.maq).un==="km").length;
  $("#t_comb_maq").innerHTML = th([["Equipamento"],["Unidade"],["Consumo",1],["Velocidade média",1],
    ["Frota",1],["Horas",1],["Km",1],["Litros",1],["Custo diesel",1],["% do volume",1]]) + "<tbody>" +
    (lm.length ? lm.map(([n,o])=>{
      const c = consumoDe(o.maq), emKm = c.un==="km", m = esc(o.maq);
      const porViagem = o.fontes.has("viagens");
      // velocidade só entra na conta quando os km vêm das horas
      const celVel = !emKm ? '<span class="calc">—</span>'
        : porViagem && o.fontes.size===1 ? '<span class="calc" title="km pelas viagens: ida carregado e volta vazio, raio da aba Transporte">pelas viagens</span>'
        : `<input data-cmaq="${m}" data-ck="vel" value="${+c.vel.toFixed(1)}" inputmode="decimal" style="width:70px"
             title="${c.velPadrao?"Padrão: média das velocidades carregado e vazio da aba Transporte":"Informada"}"
             class="${c.velPadrao?"padrao":""}"> km/h`;
      return `<tr><td>${n}</td>
      <td><select data-cmaq="${m}" data-ck="unC" style="min-width:74px">
        <option value="h" ${emKm?"":"selected"}>L/h</option><option value="km" ${emKm?"selected":""}>L/km</option></select></td>
      <td class="num">${emKm
        ? `<input data-cmaq="${m}" data-ck="dKm" value="${+c.lkm.toFixed(3)}" inputmode="decimal" style="width:76px"
             title="${c.lkmPadrao?"Padrão: o L/h dividido pela velocidade média. Digite o consumo real por km.":"Informado"}"
             class="${c.lkmPadrao?"padrao":""}"> L/km`
        : `<input data-cmaq="${m}" data-ck="d" value="${+c.lh.toFixed(2)}" inputmode="decimal" style="width:76px"> L/h`}</td>
      <td class="num">${celVel}</td>
      <td class="num calc">${fmt(o.frota)}</td><td class="num calc">${fmt(o.horas)}</td>
      <td class="num calc">${o.temKm && o.km>0 ? fmt(o.km) : "—"}</td>
      <td class="num tot">${fmt(o.litros)}</td><td class="num">${brl(o.custo)}</td>
      <td class="num calc">${litrosT>0?fmt(o.litros/litrosT*100,1)+"%":"—"}</td></tr>`; }).join("")
      : `<tr><td colspan="10" class="calc">Nenhum equipamento com consumo projetado.</td></tr>`) +
    `<tr><td class="tot">TOTAL</td><td class="calc">${nKm?nKm+" em L/km":""}</td><td colspan="2"></td>
      <td class="num tot">${fmt(lm.reduce((s,[,o])=>s+o.frota,0))}</td>
      <td class="num tot">${fmt(lm.reduce((s,[,o])=>s+o.horas,0))}</td>
      <td class="num tot">${fmt(lm.reduce((s,[,o])=>s+(o.temKm?o.km:0),0))}</td>
      <td class="num tot">${fmt(lm.reduce((s,[,o])=>s+o.litros,0))}</td>
      <td class="num tot">${brl(lm.reduce((s,[,o])=>s+o.custo,0))}</td><td></td></tr></tbody>`;
  const vp = velPadrao();
  if($("#comb_vel_nota")) $("#comb_vel_nota").textContent = vp>0
    ? "Velocidade média padrão: "+fmt(vp,1)+" km/h (média de carregado e vazio da aba Transporte)." : "";
}


export { pintarCombustivel };

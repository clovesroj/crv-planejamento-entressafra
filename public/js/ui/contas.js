import { tarifaTerc } from '../calculo/atividade.js';
import { benVal, encPct } from '../calculo/mao-de-obra.js';
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- PLANO DE CONTAS ---------- */
// Contas que compartilham um único valor calculado com outra (evita contar duas vezes).
const CONTA_COMBINADA = {"200-52":"200-51","200-73":"200-72","200-79":"200-77"};
// Mapeia cada conta a um valor projetado, a partir dos dados já calculados no plano.
// Encargos e benefícios individuais são decompostos do total de MDO de forma exata:
// como a alíquota de cada encargo incide sobre a mesma base, o valor de um encargo
// específico é sempre (total de encargos) x (peso do encargo no somatório).
function contasValores(R){
  const efet = R.efetivoTotal||0;
  const encTot = R.MP.encTot, benTot = R.MP.benTot;
  const totalBenef = benTot*efet*NM;
  const totalBase = (1+encTot)>0 ? (R.mdoTotal-totalBenef)/(1+encTot) : 0;
  const totalEnc = totalBase*encTot;
  const encPct = nome => (CFG.encargos.find(e=>e.nome.includes(nome))||{pct:0}).pct;
  const encVal = nome => encTot>0 ? totalEnc*(encPct(nome)/encTot) : 0;
  const benVal = conta => { const b=CFG.beneficios.find(x=>x.conta===conta); return b? b.valor*efet*NM : 0; };
  const mdoMaq   = R.L.filter(r=>r.a.maq!=="Equipe manual").reduce((s,r)=>s+r.cMDO,0);
  const mdoManual= R.L.filter(r=>r.a.maq==="Equipe manual").reduce((s,r)=>s+r.cMDO,0);
  const tc = cod => (R.TC.itens.find(i=>i.cod===cod)||{total:0}).total;
  return {
    "200-15": R.mdoIndirT, "200-16": R.mdoManut,
    "200-17": mdoMaq, "200-18": mdoManual,
    "200-35": encVal("INSS"), "200-36": encVal("FGTS"),
    "200-51": benVal("200-51 / 200-52"), "200-53": benVal("200-53"),
    "200-54": benVal("200-54"), "200-55": benVal("200-55"),
    "200-72": benVal("200-72 / 200-73"), "200-77": benVal("200-79 / 200-77"),
    "200-93": R.crmComp.pecas, "200-94": R.crmComp.terc,
    "200-95": R.crmComp.consumo+R.MT.total, "200-98": R.crmComp.lubrif,
    "200-110": R.dieselT,
    "200-124": tc("T02")+tc("T03")+R.tercAtivT, "200-126": tc("T01"), "200-127": R.tpessT,
    "INS-05": R.irrT,
    "DEP-01": R.depT, "EST-01": R.admT, "ARR-01": R.arrT,
  };
}
function pintarContas(R){
  const fix=CFG.contas.filter(c=>c.cls==="Fixo").length;
  const vari=CFG.contas.filter(c=>c.cls==="Variável").length;
  const cst=CFG.contas.filter(c=>c.cd==="Custo").length;
  const CV = contasValores(R);
  const mapeado = CFG.contas.reduce((s,c)=>s+(CV[c.conta]||0),0);
  $("#k_cc").innerHTML =
    kpi("Contas cadastradas","",CFG.contas.length,"","contas:total") +
    kpi("Variáveis","t",vari,"","contas:total") + kpi("Fixas","a",fix,"","contas:total") +
    kpi("Custo mapeado às contas","g",brl(mapeado),fmt(R.total>0?mapeado/R.total*100:0,0)+"% do custo total","contas:total");

  $("#t_terc").innerHTML = th([["Cod"],["Serviço"],["Centro de custo"],["Un."],["Tarifa",1],["Volume",1],["Total",1]])+"<tbody>"+
    R.TC.itens.map(i=>`<tr><td>${i.cod}</td><td>${i.desc}</td><td class="calc">${i.cc}</td>
      <td class="calc">${i.un}</td><td class="num calc">${brl(i.tarifa,2)}</td>
      <td class="num calc">${fmt(i.vol)}</td><td class="num tot">${brl(i.total)}</td></tr>`).join("")+
    `<tr><td class="tot" colspan="6">TOTAL</td><td class="num tot">${brl(R.TC.total)}</td></tr></tbody>`;

  // tarifas de prestação de serviço por atividade com frente terceirizada
  const comTerc = R.L.filter(x=>x.partes.some(p=>p.terc));
  $("#t_tarifa").innerHTML = th([["Cod"],["Atividade"],["% terceirizado",1],["Área terceirizada",1],
    ["Tarifa (R$/ha)",1],["Custo",1]])+"<tbody>"+
    (comTerc.length? comTerc.map(x=>{
      const p = x.partes.find(z=>z.terc);
      return `<tr><td>${x.a.cod}</td><td>${x.a.nome}</td>
        <td class="num calc">${fmt(p.pct*100,1)}%</td>
        <td class="num calc">${fmt(p.area)} ha</td>
        <td class="num"><input data-tt="${x.a.cod}" value="${tarifaTerc(x.a.cod)}" inputmode="decimal"></td>
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
    <td class="num tot">${brl(mapeado)}</td></tr></tbody>`;
  $("#t_contas").innerHTML = ct;
}


export { CONTA_COMBINADA, contasValores, pintarContas };

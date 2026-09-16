import { CFG } from '../dados/cfg.js';
import { MESES, NM, PERIODOS, periodoMes } from '../nucleo/calendario.js';
import { ESPOR, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { apoioCalc, frotaApoio } from './apoio.js';
import { admCalc, admRateio } from './administrativo.js';
import { ETAPAS_ORD, arrRat, arrendCalc } from './arrendamento.js';
import { linha } from './atividade.js';
import { CRM_COMP, crmFrota } from './crm.js';
import { precoDiesel } from './diesel.js';
import { volumeDemandado } from './insumos.js';
import { irrigacao } from './irrigacao.js';
import { equipeManut, mdoParams } from './mao-de-obra.js';
import { materiais } from './materiais.js';
import { terceirizacao } from './terceirizacao.js';
import { transpPessoal } from './transporte-pessoal.js';
import { transporte } from './transporte.js';

/* ================== CONSOLIDAÇÃO ================== */
function calcular(){
  P.capTransb = P.volTransb*P.densCarga;   // capacidade por viagem = volume útil x densidade de carga
  const MP = mdoParams();
  const L = CFG.atividades.map(a=>linha(a, MP));

  let dieselT=0, manutT=0, mdoT=0, insumoT=0, horasT=0, haOp=0, frotaT=0, tercAtivT=0;
  const crmComp = {pecas:0,terc:0,consumo:0,lubrif:0};
  const crmEtapa = {};
  L.forEach(r=>{
    dieselT+=r.cDiesel; mdoT+=r.cMDO; insumoT+=r.cInsumo; tercAtivT+=r.cTerc;
    horasT+=r.horas; frotaT+=r.frotaR;
    if(r.ehHa) haOp += r.total;
  });

  const TR  = transporte(L, MP);      // dimensionamento (custo já está em L)
  const AE  = apoioCalc(MP);          // equipamentos de apoio
  // ===== CRM: calculado pela FROTA PREVISTA e alocado às atividades =====
  // Cada item distribui seu CRM proporcionalmente às horas que trabalha em cada
  // frente. O que sobra (equipamento previsto além do que o plano usa) vira uma
  // parcela de frota adicional, rateada pelo custo direto de cada etapa.
  const CF = crmFrota(L, AE);
  const crmItem = {}; CF.linhas.forEach(l=> crmItem[l.item]=l);
  CRM_COMP.forEach(k=> crmComp[k] = CF.linhas.reduce((s,l)=>s+l.det[k],0));

  let crmAlocado = 0;
  const addCrm = (destino, valor)=>{ crmEtapa[destino]=(crmEtapa[destino]||0)+valor; };
  L.forEach(r=>r.partes.forEach(p=>{
    if(p.terc||p.horas<=0) return;
    // parcela operacional = uso realmente trabalhado (horas ou km, conforme a categoria) x taxa do conjunto
    let v = 0;
    [p.maq, p.imp].forEach(it=>{
      const l = crmItem[it];
      if(!l) return;
      v += p.horas * l.conv * l.rh;
    });
    p.cManut = v; r.cManut += v; r.direto += v; crmAlocado += v;
    const key = r.a.etapa==="TRATOS CULTURAIS" ? "TRATOS — "+(r.a.cultura||"Soca") : r.a.etapa;
    addCrm(key, v);
  }));
  AE.linhas.forEach(l=>{
    if(l.horas<=0) return;
    const it = crmItem[l.maq];
    if(!it) return;
    // `conv` converte hora em km nos itens cotados por quilometragem, como já faz
    // o rateio do plano operacional acima. Sem ele a taxa em R$/km era cobrada
    // como se fosse R$/h, e o CRM da frota de apoio saía dividido pela velocidade
    // média — o que não fosse cobrado ficava calculado e sem etapa nenhuma.
    const v = l.horas*it.conv*it.rh;
    l.manut = v; l.total += v; crmAlocado += v;
    addCrm("APOIO", v);
  });
  AE.manut = AE.linhas.reduce((s,l)=>s+l.manut,0);
  AE.total = AE.linhas.reduce((s,l)=>s+l.total,0);
  const crmExtra = CF.exced;   // frota excedente: prevista além do que o plano consome
  if(crmExtra>0) addCrm("FROTA EXCEDENTE", crmExtra);

  L.forEach(r=>{ manutT += r.cManut; });
  const IR  = irrigacao(L);
  const MT  = materiais();
  const AP  = frotaApoio();
  const EM  = equipeManut(horasT+AE.horas, frotaT+AE.equip, MP);
  const TC  = terceirizacao(L);
  const TP  = transpPessoal(MP);

  const mdoIndir = CFG.indiretos.reduce((s,i)=>{
    const c = MP.custoFuncao[i.fcod]; return s + (c?c.mensal*i.qtd:0);
  },0);
  const mdoIndirT = mdoIndir*NM;

  const AR = arrendCalc();
  const depMes = P.imob*(P.dep/100)/12;
  const ADM = admCalc();     // custos administrativos detalhados por natureza
  const admMes = ADM.mensal;
  const fixoMes = depMes+admMes;         // arrendamento tem distribuição mensal própria (AR.mes)
  const fixoT = fixoMes*NM + AR.total;
  const espT = ESPOR.reduce((s,e)=>s+num(e.valor),0);

  // dieselT/manutT/mdoT já incluem TR1..TR4 (são atividades de L)
  const dieselTot = dieselT + AE.diesel;
  const manutTot  = manutT + AE.manut + crmExtra + MT.total;
  const mdoTot    = mdoT + AE.mdo + mdoIndirT + EM.total;

  const variavel = dieselTot + manutTot + mdoTot + insumoT + IR.total + TC.total + tercAtivT + TP.total + espT;
  const total = variavel + fixoT;

  // distribuição mensal
  const meses = Array(NM).fill(0);
  const haMes = Array(NM).fill(0);
  L.forEach(r=>{ r.meses.forEach((q,i)=>{ if(r.ehHa) haMes[i]+=num(q); }); });
  const haTotReal = haMes.reduce((s,x)=>s+x,0), haTot = haTotReal||1;
  // peso de cada mês para os custos gerais: pela área operada; sem nenhuma atividade em hectares
  // no plano, divide igualmente entre os meses (antes esses custos ficavam fora de todos os meses)
  const pesoMes = i => haTotReal>0 ? haMes[i]/haTotReal : 1/NM;
  L.forEach(r=>{
    const tot = r.total||0;
    // diesel entra pelo litro e preço de cada mês; o restante do custo direto, pela quantidade
    r.meses.forEach((q,i)=>{ if(tot>0) meses[i] += (r.direto-r.cDiesel)*(num(q)/tot) + r.dieselMes[i]; });
  });
  const outros = (AE.total-AE.diesel) + IR.total + MT.total + TC.total + EM.total + mdoIndirT + TP.total + crmExtra;
  for(let i=0;i<NM;i++){ meses[i] += outros*pesoMes(i) + fixoMes + AE.dieselMes[i] + AR.mes[i]; }
  ESPOR.forEach(e=>{ const i = MESES.indexOf(e.mes); if(i>=0) meses[i]+=num(e.valor); });

  // grandes contas por mês — mesmo critério de rateio do total mensal, só que por natureza
  const mesesCat = {mdo:Array(NM).fill(0), manut:Array(NM).fill(0), diesel:Array(NM).fill(0),
    insumo:Array(NM).fill(0), terc:Array(NM).fill(0), arrend:Array(NM).fill(0), fixo:Array(NM).fill(0), espor:Array(NM).fill(0)};
  L.forEach(r=>{
    const tot=r.total||0; if(tot<=0) return;
    r.meses.forEach((q,i)=>{ const f=num(q)/tot;
      mesesCat.mdo[i]+=r.cMDO*f; mesesCat.manut[i]+=r.cManut*f;
      mesesCat.diesel[i]+=r.dieselMes[i]; mesesCat.insumo[i]+=r.cInsumo*f; mesesCat.terc[i]+=r.cTerc*f; });
  });
  const indiretoMdo = AE.mdo+mdoIndirT+EM.total, indiretoManut = AE.manut+crmExtra+MT.total,
    indiretoInsumo = IR.total, indiretoTerc = TC.total+TP.total;
  for(let i=0;i<NM;i++){ const h=pesoMes(i);
    mesesCat.mdo[i]+=indiretoMdo*h; mesesCat.manut[i]+=indiretoManut*h;
    mesesCat.diesel[i]+=AE.dieselMes[i]; mesesCat.insumo[i]+=indiretoInsumo*h; mesesCat.terc[i]+=indiretoTerc*h;
    mesesCat.fixo[i]+=fixoMes; mesesCat.arrend[i]+=AR.mes[i];
  }
  ESPOR.forEach(e=>{ const i=MESES.indexOf(e.mes); if(i>=0) mesesCat.espor[i]+=num(e.valor); });

  // custo por etapa
  const etapas = {}, tratosCult = {Soca:{direto:0,ha:0,litros:0}, Planta:{direto:0,ha:0,litros:0}};
  L.forEach(r=>{
    const e=r.a.etapa; etapas[e]=etapas[e]||{direto:0,ha:0,ton:0,horas:0,diesel:0,litros:0,mdo:0,manut:0,insumo:0,terc:0};
    etapas[e].horas = (etapas[e].horas||0) + r.horas;
    etapas[e].direto+=r.direto;
    etapas[e].diesel+=r.cDiesel; etapas[e].litros+=r.litros; etapas[e].mdo+=r.cMDO; etapas[e].manut+=r.cManut;
    etapas[e].insumo+=r.cInsumo; etapas[e].terc+=r.cTerc;
    if(r.ehHa) etapas[e].ha+=r.total; else if(r.a.tipo!=="transp") etapas[e].ton+=r.total;
    if(e==="TRATOS CULTURAIS"){
      const c = r.a.cultura||"Soca";
      tratosCult[c].direto += r.direto; tratosCult[c].litros += r.litros;
      if(r.ehHa) tratosCult[c].ha += r.total;
    }
  });
  // diesel dos equipamentos de apoio: rateado entre as etapas pelos litros que cada uma consome
  const litrosDir = Object.values(etapas).reduce((s,e)=>s+e.litros,0);
  if(litrosDir>0){
    const pesos = Object.values(etapas).map(e=>e.litros/litrosDir);
    Object.values(etapas).forEach((e,k)=>{
      e.diesel += AE.diesel*pesos[k]; e.direto += AE.diesel*pesos[k]; e.litros += AE.litros*pesos[k]; });
    Object.values(tratosCult).forEach(c=>{
      const w = c.litros/litrosDir; c.direto += AE.diesel*w; c.litros += AE.litros*w; });
  }
  if(etapas["TRATOS CULTURAIS"]){ etapas["TRATOS CULTURAIS"].direto += IR.total; etapas["TRATOS CULTURAIS"].irrig = IR.total; }
  // arrendamento: rateado entre as etapas pelos percentuais de referência PECEGE/USP (normalizados a 100%)
  const ratSoma = ETAPAS_ORD.reduce((s,e)=>s+arrRat(e),0);
  const arrAloc = ratSoma>0 ? AR.total : 0;   // sem percentual nenhum, volta para o rateio indireto
  if(ratSoma>0) ETAPAS_ORD.forEach(e=>{
    const w = arrRat(e)/ratSoma; if(w<=0) return;
    etapas[e] = etapas[e]||{direto:0,ha:0,ton:0,horas:0,diesel:0,litros:0,mdo:0,manut:0,insumo:0,terc:0};
    etapas[e].arrend = AR.total*w;
  });
  // dentro de tratos, soca e planta dividem a parcela do arrendamento pela área tratada
  const arrTratos = etapas["TRATOS CULTURAIS"] ? (etapas["TRATOS CULTURAIS"].arrend||0) : 0;
  const haTr = tratosCult.Soca.ha+tratosCult.Planta.ha, dirTr = tratosCult.Soca.direto+tratosCult.Planta.direto;
  Object.values(tratosCult).forEach(c=>{
    c.arrend = arrTratos*(haTr>0 ? c.ha/haTr : dirTr>0 ? c.direto/dirTr : 0.5); });
  // administrativo: cada linha pelo seu criterio; o que nao tem base fica no indireto
  const AD = admRateio(ADM, etapas);
  Object.entries(etapas).forEach(([e,d])=>{ d.admin = AD.porEtapa[e]||0; });
  const diretoSum = Object.values(etapas).reduce((s,e)=>s+e.direto,0)||1;
  const indiretoPool = total - diretoSum - arrAloc - AD.rateado;
  Object.values(etapas).forEach(e=>{
    e.arrend = e.arrend||0; e.admin = e.admin||0;
    e.indireto = indiretoPool*(e.direto/diretoSum);
    e.total = e.direto+e.arrend+e.admin+e.indireto;
  });
  const admTratos = etapas["TRATOS CULTURAIS"] ? (etapas["TRATOS CULTURAIS"].admin||0) : 0;
  const dirTr2 = tratosCult.Soca.direto + tratosCult.Planta.direto;
  Object.values(tratosCult).forEach(c=>{
    c.admin = admTratos*(dirTr2>0 ? c.direto/dirTr2 : 0.5);
    c.indireto = indiretoPool*(c.direto/diretoSum);
    c.total = c.direto+c.arrend+c.admin+c.indireto;
  });

  // custo de cada etapa mês a mês, pelo mesmo critério do total mensal — base da segmentação por período
  const etapaMes = {};
  Object.keys(etapas).forEach(e=>{ etapaMes[e] = Array(NM).fill(0); });
  L.forEach(r=>{
    const tot = r.total||0; if(tot<=0) return;
    const em = etapaMes[r.a.etapa];
    r.meses.forEach((q,i)=>{ em[i] += (r.direto-r.cDiesel)*(num(q)/tot) + r.dieselMes[i]; });
  });
  const litrosTotEt = litrosDir + AE.litros;
  Object.entries(etapas).forEach(([e,d])=>{
    const em = etapaMes[e];
    // diesel do apoio pelo peso em litros (o mesmo rateio aplicado acima)
    if(litrosDir>0) for(let i=0;i<NM;i++) em[i] += AE.dieselMes[i]*(d.litros/litrosTotEt);
    if(d.irrig) for(let i=0;i<NM;i++) em[i] += d.irrig*pesoMes(i);
    if(d.arrend && AR.total>0) for(let i=0;i<NM;i++) em[i] += d.arrend*(AR.mes[i]/AR.total);
  });
  // o que sobra em cada mês é o indireto, repartido pela participação de cada etapa no custo direto
  for(let i=0;i<NM;i++){
    const alocado = Object.values(etapaMes).reduce((s,a)=>s+a[i],0);
    const pool = meses[i] - alocado;
    Object.entries(etapas).forEach(([e,d])=>{ etapaMes[e][i] += pool*(d.direto/diretoSum); });
  }

  // segmentação safra × entressafra
  const somaPer = (arr,p) => arr.reduce((s,v,i)=>s+(periodoMes(i)===p ? v : 0), 0);
  const PER = {};
  Object.keys(PERIODOS).forEach(p=>{
    PER[p] = {nome:PERIODOS[p], meses:MESES.filter((m,i)=>periodoMes(i)===p), total:somaPer(meses,p),
      cat:   Object.fromEntries(Object.entries(mesesCat).map(([k,a])=>[k, somaPer(a,p)])),
      etapa: Object.fromEntries(Object.entries(etapaMes).map(([k,a])=>[k, somaPer(a,p)]))};
  });

  const muda = P.plantio*P.dens;
  const viveiro = P.tch>0 ? muda/P.tch : 0;

  const litrosOperMes = MESES.map((m,i)=>L.reduce((s,r)=>s+r.litrosMes[i],0));
  const custoOperMes  = MESES.map((m,i)=>L.reduce((s,r)=>s+r.dieselMes[i],0));
  const CB = {preco: MESES.map((m,i)=>precoDiesel(i)), litrosOperMes, custoOperMes,
    litrosApoioMes: AE.litrosMes, custoApoioMes: AE.dieselMes,
    litrosT: litrosOperMes.reduce((s,x)=>s+x,0)+AE.litros,
    litrosIrrigMes: IR.litrosMes, litrosIrrig: IR.litros};

  return {MP,L,TR,AE,IR,MT,AP,EM,TC,TP,CB, meses, mesesCat, haMes, etapaMes, PER,
          dieselT: dieselTot, manutT: manutTot,
          mdoDireta: mdoT, mdoApoio: AE.mdo, mdoIndirT, mdoManut: EM.total,
          mdoTotal: mdoTot,
          insumoT, irrT:IR.total, tercT:TC.total, tercAtivT, espT, apoioT: AE.total,
          arrT:AR.total, AR, ADM, AD, diretoSum, indiretoPool, admT:ADM.total, depT:depMes*NM,
          variavel, fixoT, total, horasT: horasT+AE.horas, haOp,
          frotaT, etapas, tratosCult, crmComp, crmEtapa, crmFrotaL:CF.linhas,
          crmTotal:CF.total, crmOper:CF.oper, crmExtra, tpessT:TP.total, muda, viveiro,
          volDem: volumeDemandado(L)};
}


export { calcular };

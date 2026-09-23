import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { BEN, ENC, FAT, GRAT, MO_APOIO, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== MÃO DE OBRA ================== */
function encPct(i){ return ENC[i]!=null ? num(ENC[i])/100 : CFG.encargos[i].pct; }
function benVal(i){ return BEN[i]!=null ? num(BEN[i]) : CFG.beneficios[i].valor; }

/* Custo mensal de um cargo. O nivel agora esta no proprio cargo do ERP
   (MOTORISTA II e III, OP. MAQUINAS I, II e III), entao nao ha mais faixa
   I..V por funcao: o salario e o do cadastro, ajustavel na aba Mao de Obra. */
function custoDaFuncao(fcod, MP){
  const f = CFG.funcoes.find(x=>x.cod===fcod);
  if(!f) return {mensal:0, hora:0, sal:0, nome:"—"};
  const sal = num(f.sal);
  const comAdic = sal*(1+f.adic);
  const grat = gratif(fcod, comAdic);
  const base = comAdic+grat;
  const mensal = base*(1+MP.encTot)+MP.benTot;
  const hMes = P.dias*P.hdia;
  return {mensal, hora: hMes>0?mensal/hMes:0, sal, grat, nome:f.nome};
}

function gratif(fcod, base){
  const g = GRAT[fcod];
  if(!g) return 0;
  return g.tipo==="%" ? base*num(g.valor)/100 : num(g.valor);
}

function mdoParams(){
  const encTot = CFG.encargos.reduce((s,e,i)=>s+encPct(i),0);
  const benTot = CFG.beneficios.reduce((s,b,i)=>s+benVal(i),0);
  const fatorEscala = P.diasTrab>0 ? P.diasOper/P.diasTrab : 1;
  const custoFuncao = {};
  CFG.funcoes.forEach(f=>{
    const salMed  = num(f.sal);
    const comAdic = salMed*(1+f.adic);
    // gratificação variável é remuneração: entra na base de encargos
    const grat    = gratif(f.cod, comAdic);
    const base    = comAdic + grat;
    custoFuncao[f.cod] = {
      nome:f.nome, conta:f.conta, sal:salMed, salCad:f.sal, adic:f.adic,
      comAdic, grat, base,
      encargos: base*encTot, beneficios: benTot,
      mensal: base*(1+encTot) + benTot
    };
  });
  // custo-hora médio do operador direto (F01), base para as atividades
  const hMes = P.dias * P.hdia;
  Object.values(custoFuncao).forEach(c=> c.hora = hMes>0 ? c.mensal/hMes : 0);
  return {encTot, benTot, fatorEscala, custoFuncao, hMes};
}

/* ================== FAT E APOIO OPERACIONAL ==================
   Duas listas de gente que nao sai de atividade nenhuma, cada uma com os
   meses em que vale. O custo cai exatamente nos meses marcados -- nao e
   espalhado pela area operada, como a estrutura indireta --, porque o mes e
   justamente o que se lanca.

   FAT: contrato suspenso para qualificacao (art. 476-A da CLT), com a bolsa
   paga pelo Fundo de Amparo ao Trabalhador. A empresa nao paga salario nem
   encargos no periodo; paga o beneficio lancado (ajuda compensatoria, cesta,
   plano de saude...). Custo = pessoas x beneficio por mes, em cada mes marcado.
   Essas pessoas contam no efetivo, mas nao ficam disponiveis para a operacao.

   Apoio operacional: gente que a operacao precisa e o plano nao dimensiona
   por atividade (fiscal de campo, apontador, lider de frente...). Custo =
   pessoas x custo mensal cheio da funcao (salario, encargos e beneficios), em
   cada mes marcado. */
const mesesDe = l => Array.from({length:NM}, (_,i)=> Array.isArray(l.m) && num(l.m[i])>0);

function fatCalc(){
  const linhas = FAT.map((l,ix)=>{
    const qtd = Math.max(0, num(l.qtd)), ben = Math.max(0, num(l.ben)), on = mesesDe(l);
    const qtdMes = on.map(b => b ? qtd : 0);
    const mes = qtdMes.map(q => q*ben);
    return {ix, fcod:l.fcod||"", desc:l.desc||"", qtd, ben, on, nMeses:on.filter(Boolean).length,
            qtdMes, mes, total: mes.reduce((s,x)=>s+x,0)};
  });
  const mes = Array.from({length:NM}, (_,i)=>linhas.reduce((s,l)=>s+l.mes[i],0));
  const qtdMes = Array.from({length:NM}, (_,i)=>linhas.reduce((s,l)=>s+l.qtdMes[i],0));
  return {linhas, mes, qtdMes, total: mes.reduce((s,x)=>s+x,0), pico: Math.max(0,...qtdMes)};
}

function apoioOperCalc(MP){
  const linhas = MO_APOIO.map((l,ix)=>{
    const qtd = Math.max(0, num(l.qtd)), on = mesesDe(l);
    const cf = MP.custoFuncao[l.fcod] || {mensal:0, nome:"—"};
    const qtdMes = on.map(b => b ? qtd : 0);
    const mes = qtdMes.map(q => q*cf.mensal);
    return {ix, fcod:l.fcod||"", fnome:cf.nome, frente:l.frente||"", qtd, on, nMeses:on.filter(Boolean).length,
            custoMensal:cf.mensal, qtdMes, mes, total: mes.reduce((s,x)=>s+x,0)};
  });
  const mes = Array.from({length:NM}, (_,i)=>linhas.reduce((s,l)=>s+l.mes[i],0));
  const qtdMes = Array.from({length:NM}, (_,i)=>linhas.reduce((s,l)=>s+l.qtdMes[i],0));
  return {linhas, mes, qtdMes, total: mes.reduce((s,x)=>s+x,0), pico: Math.max(0,...qtdMes)};
}

export { apoioOperCalc, benVal, custoDaFuncao, encPct, fatCalc, gratif, mdoParams };

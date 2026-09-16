import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { BEN, ENC, GRAT, NIV, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== MÃO DE OBRA ================== */
function encPct(i){ return ENC[i]!=null ? num(ENC[i])/100 : CFG.encargos[i].pct; }
function benVal(i){ return BEN[i]!=null ? num(BEN[i]) : CFG.beneficios[i].valor; }

const ROMANOS = ["I","II","III","IV","V"];
// níveis de uma função: 5 faixas. Se nunca editada, o nível I recebe o salário
// do cadastro e os demais ficam zerados (sem efetivo, logo sem efeito no custo).
function niveis(fcod){
  if(NIV[fcod]) return NIV[fcod];
  const f = CFG.funcoes.find(x=>x.cod===fcod) || {sal:0};
  return [{sal:f.sal, qtd:1},{sal:0,qtd:0},{sal:0,qtd:0},{sal:0,qtd:0},{sal:0,qtd:0}];
}
function destravarNiv(fcod){
  if(!NIV[fcod]) NIV[fcod] = niveis(fcod).map(n=>({...n}));
  return NIV[fcod];
}
// salário médio ponderado pelo efetivo de cada nível
function salarioMedio(fcod){
  const ns = niveis(fcod);
  const qt = ns.reduce((s,n)=>s+num(n.qtd),0);
  if(qt>0) return ns.reduce((s,n)=>s+num(n.sal)*num(n.qtd),0)/qt;
  const f = CFG.funcoes.find(x=>x.cod===fcod)||{sal:0};
  return num(ns[0].sal) || f.sal;
}
// custo mensal de um nível específico (I..V) — usado quando a atividade
// aponta para um nível, em vez da média ponderada da função
function custoNivel(fcod, idx, MP){
  const f = CFG.funcoes.find(x=>x.cod===fcod);
  if(!f) return {mensal:0, hora:0, sal:0, nome:"—"};
  const ns = niveis(fcod);
  const n  = ns[idx] || ns[0];
  const sal = num(n.sal)>0 ? num(n.sal) : salarioMedio(fcod);
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
    const salMed  = salarioMedio(f.cod);
    const comAdic = salMed*(1+f.adic);
    // gratificação variável é remuneração: entra na base de encargos
    const grat    = gratif(f.cod, comAdic);
    const base    = comAdic + grat;
    custoFuncao[f.cod] = {
      nome:f.nome, conta:f.conta, sal:salMed, salCad:f.sal, adic:f.adic,
      comAdic, grat, base,
      encargos: base*encTot, beneficios: benTot,
      mensal: base*(1+encTot) + benTot,
      efetivoNiv: niveis(f.cod).reduce((s,n)=>s+num(n.qtd),0)
    };
  });
  // custo-hora médio do operador direto (F01), base para as atividades
  const hMes = P.dias * P.hdia;
  Object.values(custoFuncao).forEach(c=> c.hora = hMes>0 ? c.mensal/hMes : 0);
  return {encTot, benTot, fatorEscala, custoFuncao, hMes};
}
/* ================== EQUIPE DE MANUTENÇÃO ================== */
function equipeManut(horasFrota, frotaTotal, MP){
  const hMes = horasFrota/NM;
  const mec   = Math.ceil(hMes/(P.hPorMec||1));
  const ajud  = Math.ceil(frotaTotal/(P.eqPorAjud||1));
  const lider = Math.ceil((mec+ajud)/(P.colPorLider||1));
  const cM = (MP.custoFuncao["F09"]||{mensal:0}).mensal;
  const cA = (MP.custoFuncao["F14"]||{mensal:0}).mensal;
  const cL = (MP.custoFuncao["F13"]||{mensal:0}).mensal;
  const mensal = mec*cM + ajud*cA + lider*cL;
  return {mec, ajud, lider, efetivo:mec+ajud+lider, mensal, total: mensal*NM};
}


export { ROMANOS, benVal, custoNivel, destravarNiv, encPct, equipeManut, gratif, mdoParams, niveis, salarioMedio };

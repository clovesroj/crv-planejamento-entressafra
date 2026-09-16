import { MESES, NM } from '../nucleo/calendario.js';
import { ARR_PAR, ARR_RAT, arrLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== ARRENDAMENTOS ================== */
const ARR_FORMAS = {
  rsha:    {nome:"R$ fixo por ha/ano",               un:"R$/ha"},
  tcana:   {nome:"t de cana por ha/ano (Consecana)", un:"t/ha"},
  katr:    {nome:"kg de ATR por ha/ano",             un:"kg ATR/ha"},
  parceria:{nome:"Parceria — % da produção",         un:"% prod."}
};
const ARR_PAG = ["Mensal","Semestral","Anual"];
// parâmetros que convertem a forma de pagamento em R$ — ajustar pelo Consecana vigente
const ARR_PAR_PADRAO = {atr:135, precoAtr:1.25, tchParc:80, criterio:"competencia"};
// rateio do arrendamento por etapa: padrão editável, a confirmar com o relatório PECEGE/USP adotado
// Rateio do arrendamento entre as etapas, em %.
//
// O plantio nao carrega arrendamento: a terra e arrendada para produzir, e a
// cana planta nao produz no ano em que e plantada. Jogar aluguel da area toda
// no plantio inflava o centro de custo -- eram R$ 3,28 mi sobre 2.400 ha
// plantados, contra ~R$ 776 mil de operacao de plantio de verdade.
//
// Os 20% que ficavam no plantio foram para as etapas da area em producao,
// mantendo a proporcao que elas ja tinham entre si (45:35):
//   tratos   45 + 20 x 45/80 = 56,25
//   colheita 35 + 20 x 35/80 = 43,75
// Continua editavel por etapa na aba Arrendamentos.
const ARR_RAT_PADRAO = {"PREPARO DE SOLO":0, "PLANTIO":0, "TRATOS CULTURAIS":56.25, "COLHEITA":43.75, "APOIO E CONSERVAÇÃO":0};
const ETAPAS_ORD = ["PREPARO DE SOLO","PLANTIO","TRATOS CULTURAIS","COLHEITA","APOIO E CONSERVAÇÃO"];
function arrPar(k){ return ARR_PAR[k]!=null ? ARR_PAR[k] : ARR_PAR_PADRAO[k]; }
function arrRat(e){ return ARR_RAT[e]!=null ? num(ARR_RAT[e]) : (ARR_RAT_PADRAO[e]||0); }
function arrendCalc(){
  const atr=num(arrPar("atr")), pAtr=num(arrPar("precoAtr")), tch=num(arrPar("tchParc"));
  const caixa = arrPar("criterio")==="caixa";
  const linhas = arrLista().map(a=>{
    const area=num(a.area), q=num(a.qtd);
    const rsHa = ({rsha:q, tcana:q*atr*pAtr, katr:q*pAtr, parceria:q/100*tch*atr*pAtr})[a.forma] || 0;
    const anual = rsHa*area;
    const mes = Array(NM).fill(0);
    // competência: 1/12 do valor anual em cada mês; caixa: o valor cai no mês de cada pagamento
    if(!caixa || a.pag==="Mensal") mes.fill(anual/12);
    else{
      const m0 = +a.mes;
      if(a.pag==="Semestral") [m0, m0+6].forEach(i=>{ if(i>=0 && i<NM) mes[i]+=anual/2; });
      else if(m0>=0 && m0<NM) mes[m0]+=anual;
    }
    return {...a, area, rsHa, anual, mes, periodo: mes.reduce((s,x)=>s+x,0)};
  });
  const soma = k => linhas.reduce((s,l)=>s+l[k],0);
  return {linhas, area:soma("area"), anual:soma("anual"), total:soma("periodo"),
          mes: MESES.map((m,i)=>linhas.reduce((s,l)=>s+l.mes[i],0))};
}


export { ARR_FORMAS, ARR_PAG, ARR_PAR_PADRAO, ARR_RAT_PADRAO, ETAPAS_ORD, arrPar, arrRat, arrendCalc };

import { ADM_CRITERIOS, ADM_RAT_PADRAO } from '../dados/administrativo.js';
import { NM } from '../nucleo/calendario.js';
import { ADM_RAT, admLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== CUSTOS ADMINISTRATIVOS ==================
   Cada linha tem um valor mensal e um critério de rateio. O total não depende
   das etapas; o rateio sim, e por isso acontece depois que as etapas existem
   (admRateio). Linha cujo critério não tem base no plano — tonelada sem
   colheita lançada, por exemplo — fica sem rateio e volta para o rateio
   indireto geral, em vez de ser distribuída por um peso inventado. */

function admRat(e){ return ADM_RAT[e]!=null ? num(ADM_RAT[e]) : (ADM_RAT_PADRAO[e]||0); }

/* Em quais meses a linha ocorre. Sem `meses` (a maioria: gasto recorrente o
   ano inteiro), são todos os NM meses -- documento gravado antes desta
   melhoria não tem o campo e continua exatamente como estava. Com `meses`
   (gasto esporádico: licença anual, compra pontual...), só esses entram no
   total -- é a lista de índices marcada na tela, nunca a média nem o pico. */
function mesesDaLinha(l){
  return Array.isArray(l.meses) ? l.meses.filter(m=>m>=0 && m<NM) : Array.from({length:NM},(_,i)=>i);
}

function admCalc(){
  const linhas = admLista().map(l=>{
    const mensal = num(l.valor);
    const crit = ADM_CRITERIOS[l.crit] ? l.crit : "direto";
    const meses = mesesDaLinha(l);
    // valor da linha em cada mês do orçamento: o mensal nos meses marcados, zero nos outros
    const mes = Array.from({length:NM}, (_,i)=> meses.includes(i) ? mensal : 0);
    return {...l, mensal, crit, meses, mes, total: mensal*meses.length};
  });
  // soma do R$/mês lançado nas linhas (o valor de um mês em que todas ocorrem)
  const mensal = linhas.reduce((s,l)=>s+l.mensal,0);
  /* Custo administrativo de cada mês: só as linhas que ocorrem naquele mês.
     O motor lançava `mensal` (a soma de todas as linhas) em todos os 12 meses:
     a linha marcada só para a entressafra aparecia também na safra, e o total
     do ano passava do total das linhas. */
  const mes = Array.from({length:NM}, (_,i)=> linhas.reduce((s,l)=>s+l.mes[i],0));
  // total NÃO é mensal*NM desde que uma linha possa ter menos meses que o ano
  // inteiro -- soma o total já prorateado de cada linha.
  const total = linhas.reduce((s,l)=>s+l.total,0);
  const porGrupo = {};
  linhas.forEach(l=>{ porGrupo[l.grupo] = (porGrupo[l.grupo]||0) + l.total; });
  const porCriterio = {};
  linhas.forEach(l=>{ porCriterio[l.crit] = (porCriterio[l.crit]||0) + l.total; });
  return {linhas, mensal, mes, total, porGrupo, porCriterio,
          // alguma linha não ocorre o ano inteiro: o custo varia de mês a mês
          variaNoAno: linhas.some(l=>l.mensal>0 && l.meses.length!==NM)};
}

/* Rateio entre as etapas. `etapas` é o mapa já montado pela consolidação, com
   ha, ton, horas e custo direto de cada uma. Devolve quanto cada etapa recebe
   e quanto ficou sem rateio. */
function admRateio(ADM, etapas){
  const nomes = Object.keys(etapas);
  const porEtapa = {}; nomes.forEach(e=>{ porEtapa[e] = 0; });
  const porLinha = {};
  let semRateio = 0;

  const somaBase = campo => nomes.reduce((s,e)=>s+num(etapas[e][campo]),0);
  const bases = {ha:somaBase("ha"), ton:somaBase("ton"), horas:somaBase("horas"), direto:somaBase("direto")};
  const somaPct = nomes.reduce((s,e)=>s+admRat(e),0);

  ADM.linhas.forEach((l,i)=>{
    if(l.total<=0){ porLinha[i] = {rateado:0, motivo:""}; return; }
    const base = (ADM_CRITERIOS[l.crit]||{}).base;
    if(base==="cc"){
      // centro de custo: a linha inteira vai para a etapa escolhida
      if(etapas[l.cc]){ porEtapa[l.cc] += l.total; porLinha[i] = {rateado:l.total, motivo:""}; }
      else { semRateio += l.total; porLinha[i] = {rateado:0, motivo:"sem etapa: fica no rateio indireto"}; }
      return;
    }
    if(base==="fixo"){
      if(somaPct>0){
        nomes.forEach(e=>{ porEtapa[e] += l.total*(admRat(e)/somaPct); });
        porLinha[i] = {rateado:l.total, motivo:""};
      }else{ semRateio += l.total; porLinha[i] = {rateado:0, motivo:"percentuais zerados"}; }
      return;
    }
    const tot = bases[base] || 0;
    if(tot>0){
      nomes.forEach(e=>{ porEtapa[e] += l.total*(num(etapas[e][base])/tot); });
      porLinha[i] = {rateado:l.total, motivo:""};
    }else{
      semRateio += l.total;
      porLinha[i] = {rateado:0, motivo:"plano sem "+base+" lançado"};
    }
  });

  const rateado = nomes.reduce((s,e)=>s+porEtapa[e],0);
  return {porEtapa, porLinha, semRateio, rateado, bases, somaPct};
}

export { admCalc, admRat, admRateio, mesesDaLinha };

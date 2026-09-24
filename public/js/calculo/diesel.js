import { DIESEL_MES, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

// preço do diesel no mês i: valor projetado para o mês, ou o preço base das Premissas
function precoDiesel(i){ return DIESEL_MES[i]!=null ? num(DIESEL_MES[i]) : P.diesel; }

/* Diesel como orçado na aba Combustível: o preço de cada mês (DIESEL_MES; mês
   sem preço próprio usa o preço base das Premissas) pesado pelos litros do
   mês -- o "preço médio ponderado" da aba. É o preço que o custo usa; o preço
   base sozinho não é o orçado. CB é o resumo de combustível do motor (R.CB). */
function dieselOrcado(CB){
  const n = (CB && CB.preco ? CB.preco.length : 12);
  const precos = Array.from({length:n}, (_,i)=>precoDiesel(i));
  const litros = CB ? CB.litrosOperMes.reduce((s,x,i)=>s+x+(CB.litrosApoioMes[i]||0),0) : 0;
  const custo  = CB ? CB.custoOperMes.reduce((s,x,i)=>s+x+(CB.custoApoioMes[i]||0),0) : 0;
  const min = Math.min(...precos), max = Math.max(...precos);
  return {medio: litros>0 ? custo/litros : precos.reduce((s,x)=>s+x,0)/n, min, max,
          variaNoAno: max-min > 0.005, litros, custo, base: P.diesel};
}

export { dieselOrcado, precoDiesel };

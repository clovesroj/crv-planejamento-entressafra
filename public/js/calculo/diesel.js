import { DIESEL_MES, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

// preço do diesel no mês i: valor projetado para o mês, ou o preço base das Premissas
function precoDiesel(i){ return DIESEL_MES[i]!=null ? num(DIESEL_MES[i]) : P.diesel; }


export { precoDiesel };

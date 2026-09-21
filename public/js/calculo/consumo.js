/* ================== CONSUMO DE DIESEL POR EQUIPAMENTO ==================
   Cada equipamento consome por hora (máquina: trator, colhedora, motobomba) ou
   por quilômetro (veículo: caminhão, veículo leve). A escolha e o consumo são
   do cadastro da máquina (MAQ, o mesmo que a aba Manutenção de Frota edita),
   e podem ser ajustados na aba Combustível:

     unC   "h" (L/h, padrão) ou "km" (L/km)
     d     consumo em L/h
     dKm   consumo em L/km
     vel   velocidade média em km/h, para projetar km a partir das horas

   As horas são sempre as do plano, projetadas pelas premissas (área ÷
   rendimento, viagens × ciclo). Os km também saem sozinhos:
     - transporte de cana: viagens × ida e volta do raio (premissas da aba
       Transporte) — a distância que o caminhão de fato roda;
     - demais veículos: horas × velocidade média.

   Sem dKm informado, o L/km padrão é o L/h dividido pela velocidade média:
   trocar a unidade não inventa consumo — muda a conta para quilômetros, e o
   número real do fabricante ou da telemetria entra quando alguém o digitar. */
import { P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { maqDe } from './crm.js';

// velocidade média padrão: a média de carregado e vazio da aba Transporte
function velPadrao(){
  const c = num(P.velC), v = num(P.velV);
  return c>0 && v>0 ? (c+v)/2 : (c || v || 0);
}

function consumoDe(item){
  const mq = maqDe(item);
  const lh = num(mq.d);
  const vel = num(mq.vel)>0 ? num(mq.vel) : velPadrao();
  const lkmInf = num(mq.dKm)>0;
  return {
    un: mq.unC==="km" ? "km" : "h",
    lh, vel,
    lkm: lkmInf ? num(mq.dKm) : (vel>0 ? lh/vel : 0),
    lkmPadrao: !lkmInf,            // L/km ainda é o equivalente do L/h
    velPadrao: !(num(mq.vel)>0),   // velocidade ainda é a média do transporte
  };
}

/* Litros de um trabalho de `horas`. `kmViagens` é a distância quando o
   trabalho a conhece (transporte); sem ela, km = horas × velocidade média. */
function litrosDe(item, horas, kmViagens){
  const c = consumoDe(item);
  if(c.un==="km"){
    const km = kmViagens!=null ? kmViagens : horas*c.vel;
    return {...c, litros: km*c.lkm, km, fonteKm: kmViagens!=null ? "viagens" : "velocidade"};
  }
  return {...c, litros: horas*c.lh, km: kmViagens!=null ? kmViagens : null, fonteKm: kmViagens!=null ? "viagens" : null};
}

export { consumoDe, litrosDe, velPadrao };

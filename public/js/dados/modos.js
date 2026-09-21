/**
 * Modos de aplicacao e tarifa padrao de terceirizacao.
 *
 * MODOS  modo -> maquina, implemento, rendimento, operadores, turnos e funcao.
 *        terc:true marca prestador de servico (nao consome frota nem efetivo).
 * TERC_TAR_PAD  tarifa padrao de terceirizacao em R$/ha
 * TERC_MODOS  cardapio fixo de sub-modos do prestador de servico (aviao, drone,
 *             terrestre), cada um com seu proprio % e tarifa — ver TERC_SUB em
 *             nucleo/estado.js. Sem nada preenchido ali, vale a tarifa unica
 *             de sempre (TERC_TAR/TERC_TAR_PAD).
 */

export const MODOS = {
  "Manual": {"maq":"Equipe manual","imp":"Pulverizador costal","rend":0.8,"ops":1,"turnos":1,"fcod":"542"},
  "Trator": {"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","rend":2.2,"ops":1,"turnos":2,"fcod":"917"},
  "Uniport": {"maq":"Uniport 3030","imp":"Barra de pulverização 24 m","rend":3.5,"ops":1,"turnos":3,"fcod":"917"},
  "Drone": {"maq":"Drone pulverizador","imp":"Bico rotativo","rend":1.5,"ops":1,"turnos":2,"fcod":"917"},
  "Quadriciclo": {"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","rend":1.2,"ops":1,"turnos":1,"fcod":"542"},
  "Terceiro": {"maq":"Prestador de serviço","imp":"—","rend":0,"ops":0,"turnos":0,"fcod":null,"terc":true}
};

export const TERC_TAR_PAD = 180;

export const TERC_MODOS = ["Avião", "Drone", "Terrestre"];

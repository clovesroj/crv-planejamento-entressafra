/**
 * Cadastro de atividades do plano operacional.
 *
 * 44 atividades. Cada linha e uma operacao agricola ou de transporte.
 * 
 * cod    codigo unico (A01..., TR1... para transporte)
 * etapa  PREPARO DE SOLO | PLANTIO | TRATOS CULTURAIS | COLHEITA | APOIO E CONSERVACAO
 * un     unidade de lancamento: "ha/mes" ou "ton/mes"
 * rend   rendimento operacional na unidade/hora
 * maq    maquina base; imp: implemento acoplado
 * ops    operadores por equipamento; turnos: turnos/dia; util: fator de utilizacao
 * tipo   "transp" marca transporte, que puxa o volume da atividade em "src"
 * modo   "caminhao" ou "transbordo" (so em tipo=transp)
 * modoOn true libera o mix de modos de aplicacao (Manual/Trator/Uniport/Drone/Terceiro)
 * cultura "Soca" ou "Planta" — usado no rateio de TRATOS CULTURAIS
 */

export const ATIVIDADES = [
  {"cod":"A01","etapa":"COLHEITA","nome":"Colheita safra 2026","un":"ton/mês","rend":45,"maq":"Colhedora CH570 / John Deere","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1},
  {"cod":"A02","etapa":"COLHEITA","nome":"Colheita muda","un":"ton/mês","rend":35,"maq":"Colhedora de muda","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.6},
  {"cod":"TR1","etapa":"COLHEITA","nome":"Transporte de cana colheita","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Rodotrem canavieiro","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"A01","modo":"caminhao"},
  {"cod":"TR2","etapa":"COLHEITA","nome":"Transporte de cana muda","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Carroceria canavieira","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"A02","modo":"caminhao"},
  {"cod":"TR3","etapa":"COLHEITA","nome":"Transbordo colheita","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"A01","modo":"transbordo"},
  {"cod":"TR4","etapa":"COLHEITA","nome":"Transbordo muda","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"A02","modo":"transbordo"},
  {"cod":"A03","etapa":"PREPARO DE SOLO","nome":"Dessecação","un":"ha/mês","rend":1.65,"maq":"Uniport 3030 / Drone","imp":"Barra de pulverização 24 m","ops":1,"turnos":3,"util":0.8,"modoOn":true},
  {"cod":"A04","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"A05","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"A06","etapa":"PREPARO DE SOLO","nome":"Gradagem leve","un":"ha/mês","rend":1.3,"maq":"Trator 4x4 150 CV","imp":"Grade leve 16 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A07","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A08","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A09","etapa":"PREPARO DE SOLO","nome":"Subsolagem","un":"ha/mês","rend":0.5,"maq":"Trator 4x4 230 CV","imp":"Subsolador 5 hastes","ops":1,"turnos":3,"util":0.9},
  {"cod":"A10","etapa":"PLANTIO","nome":"Plantio","un":"ha/mês","rend":0.84,"maq":"Trator 4x4 230 CV","imp":"Plantadora DMB PCP 6.000","ops":2,"turnos":2,"util":1},
  {"cod":"A39","etapa":"PLANTIO","nome":"Adubação de fundação","un":"ha/mês","rend":4.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoOn":true,"modos":["Trator","Terceiro"],"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":4.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A11","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Soca"},
  {"cod":"A12","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Soca"},
  {"cod":"A13","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria pingente","un":"ha/mês","rend":1.8,"maq":"Trator 4x4 150 CV","imp":"Barra pingente","ops":1,"turnos":2,"util":0.7,"modoOn":true,"cultura":"Soca"},
  {"cod":"A14","etapa":"TRATOS CULTURAIS","nome":"Bordaduras","un":"ha/mês","rend":1.2,"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","ops":1,"turnos":1,"util":0.6,"modoOn":true,"cultura":"Soca"},
  {"cod":"A15","etapa":"TRATOS CULTURAIS","nome":"Catação quadriciclo","un":"ha/mês","rend":1.5,"maq":"Quadriciclo","imp":"Pulverizador costal","ops":1,"turnos":1,"util":0.6,"modoOn":true,"cultura":"Soca"},
  {"cod":"A16","etapa":"TRATOS CULTURAIS","nome":"1ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"modoOn":true,"cultura":"Soca"},
  {"cod":"A17","etapa":"TRATOS CULTURAIS","nome":"2ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"modoOn":true,"cultura":"Soca"},
  {"cod":"A18","etapa":"TRATOS CULTURAIS","nome":"Colheitabilidade","un":"ha/mês","rend":1,"maq":"Equipe manual","imp":"----","ops":0,"turnos":1,"util":0.7,"cultura":"Soca"},
  {"cod":"A19","etapa":"TRATOS CULTURAIS","nome":"Tratos Fitossanitários no Plantio","un":"ha/mês","rend":2.3,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"modoOn":true,"cultura":"Planta"},
  {"cod":"A20","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"modoOn":true,"cultura":"Soca"},
  {"cod":"A21","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida aéreo","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"A22","etapa":"TRATOS CULTURAIS","nome":"Dessecação","un":"ha/mês","rend":1.65,"maq":"Uniport 3030 / Drone","imp":"Barra de pulverização 24 m","ops":1,"turnos":3,"util":0.8,"modoOn":true,"cultura":"Soca"},
  {"cod":"A23","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Planta"},
  {"cod":"A24","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Planta"},
  {"cod":"A25","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria muda","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.7,"modoOn":true,"cultura":"Planta"},
  {"cod":"A26","etapa":"TRATOS CULTURAIS","nome":"Quebra-lombo","un":"ha/mês","rend":1.1,"maq":"Trator 4x4 100 CV","imp":"Cobridor com tanque de aplicação","ops":1,"turnos":2,"util":0.8,"modoOn":true,"cultura":"Planta"},
  {"cod":"A27","etapa":"TRATOS CULTURAIS","nome":"1ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"modoOn":true,"cultura":"Planta"},
  {"cod":"A28","etapa":"TRATOS CULTURAIS","nome":"2ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"modoOn":true,"cultura":"Planta"},
  {"cod":"A37","etapa":"TRATOS CULTURAIS","nome":"Aplicação de calcário","un":"ha/mês","rend":5.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoOn":true,"modos":["Trator","Terceiro"],"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A38","etapa":"TRATOS CULTURAIS","nome":"Aplicação de gesso","un":"ha/mês","rend":5.5,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoOn":true,"modos":["Trator","Terceiro"],"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.5,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A30","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A31","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel + tanque vinhaça","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A32","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A33","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"A34","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional plantio","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"A35","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A36","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"AD1","etapa":"TRATOS CULTURAIS","nome":"Adubação de socaria","un":"ha/mês","rend":1.8,"maq":"Adubadora autopropelida","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Soca"},
  {"cod":"AD2","etapa":"TRATOS CULTURAIS","nome":"Adubação de cobertura","un":"ha/mês","rend":2,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de cobertura","ops":1,"turnos":2,"util":0.85,"modoOn":true,"cultura":"Soca"},
  {"cod":"A29","etapa":"APOIO E CONSERVAÇÃO","nome":"Reflorestamento","un":"ha/mês","rend":0.3,"maq":"Trator 4x4 100 CV","imp":"Perfuratriz / carroça","ops":1,"turnos":1,"util":0.4},
  {"cod":"AP1","etapa":"APOIO E CONSERVAÇÃO","nome":"Apoio operacional","un":"ha/mês","rend":2.5,"maq":"Veículo leve de apoio","imp":"----","ops":1,"turnos":2,"util":0.7},
  {"cod":"AP2","etapa":"APOIO E CONSERVAÇÃO","nome":"Auxiliares agrícolas","un":"ha/mês","rend":1.2,"maq":"Equipe manual","imp":"Ferramental manual","ops":1,"turnos":1,"util":0.8}
];

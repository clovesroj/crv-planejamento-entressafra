/**
 * Irrigacao: tecnica, custos e atividades por modalidade.
 *
 * IRR_TEC    modalidade -> [descricao, lamina, eficiencia, pressao, vazao,
 *            turno, area_por_conjunto, horas_dia]
 * IRR_CUSTOS modalidade -> [% energia, % agua, % mao de obra]
 * IRR_ACTS   nomes das atividades tratadas como irrigacao
 */

export const IRR_TEC = {
  "Irrigação convencional socaria": ["Aspersão convencional (canhão hidráulico)",0.75,0.82,35,10,18,32,15],
  "Fertirrigação convencional socaria": ["Aspersão convencional (canhão hidráulico)",0.75,0.82,30,15,16,32,15],
  "Fertirrigação localizada socaria": ["Gotejamento subsuperficial",0.92,0.9,15,5,20,12,1],
  "Fertirrigação localizada plantio": ["Gotejamento subsuperficial",0.92,0.9,12,5,20,12,1],
  "Irrigação convencional plantio": ["Aspersão convencional (canhão hidráulico)",0.75,0.82,25,7,16,32,15],
  "Irrigação localizada socaria": ["Gotejamento superficial",0.92,0.9,15,6,20,12,1],
  "Irrigação localizada plantio": ["Gotejamento superficial",0.92,0.9,12,5,20,12,1]
};

export const IRR_CUSTOS = {
  "Irrigação convencional socaria": [85,0,15],
  "Fertirrigação convencional socaria": [95,120,15],
  "Fertirrigação localizada socaria": [60,140,35],
  "Fertirrigação localizada plantio": [60,140,35],
  "Irrigação convencional plantio": [85,0,15],
  "Irrigação localizada socaria": [45,0,40],
  "Irrigação localizada plantio": [45,0,40]
};

export const IRR_ACTS = [
  "Irrigação convencional socaria",
  "Fertirrigação convencional socaria",
  "Fertirrigação localizada socaria",
  "Fertirrigação localizada plantio",
  "Irrigação convencional plantio",
  "Irrigação localizada socaria",
  "Irrigação localizada plantio"
];

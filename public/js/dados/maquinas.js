/**
 * Frota: consumo e parametros por modelo.
 *
 * Chave = nome do equipamento, igual ao usado em atividades.maq / .imp.
 * 
 * d  consumo de diesel em L/h
 * m  custo de manutencao de referencia em R$/h (historico; o CRM detalhado manda)
 * h  horas disponiveis por mes
 * u  fator de utilizacao tipico
 */

export const MAQUINAS = {
  "Trator 4x4 230 CV": {"d":22,"m":22,"h":195,"u":0.9},
  "Uniport 3030 / Drone": {"d":18,"m":30,"h":260,"u":0.85},
  "Trator 4x4 100 CV": {"d":11,"m":13,"h":115,"u":0.8},
  "Trator 4x4 150 CV": {"d":16,"m":17,"h":150,"u":0.85},
  "Colhedora de muda": {"d":40,"m":55,"h":480,"u":0.7},
  "Colhedora CH570 / John Deere": {"d":55,"m":75,"h":620,"u":0.95},
  "Conjunto motobomba": {"d":8,"m":9,"h":80,"u":0.75},
  "Aeronave / Drone (terceiro)": {"d":0,"m":0,"h":0,"u":1},
  "Quadriciclo": {"d":3,"m":6,"h":45,"u":0.7},
  "Equipe manual": {"d":0,"m":0,"h":0,"u":1},
  "A definir": {"d":12,"m":14,"h":120,"u":0.85},
  "Caminhão Volvo FMX 540": {"d":38,"m":42,"h":210,"u":0.9},
  "Caminhão bombeiro": {"d":18,"m":20,"h":110,"u":0.85},
  "Caçamba basculante": {"d":22,"m":24,"h":130,"u":0.85},
  "Motoniveladora": {"d":26,"m":34,"h":180,"u":0.85},
  "Pá mecânica / carregadeira": {"d":24,"m":30,"h":165,"u":0.85},
  "Retroescavadeira": {"d":16,"m":22,"h":140,"u":0.85},
  "Escavadeira hidráulica": {"d":28,"m":38,"h":200,"u":0.85},
  "Veículo leve de apoio": {"d":7,"m":9,"h":55,"u":0.85},
  "Caminhão comboio": {"d":16,"m":18,"h":105,"u":0.85},
  "Caminhão oficina": {"d":15,"m":20,"h":120,"u":0.85},
  "Caminhão prancha": {"d":20,"m":22,"h":135,"u":0.85},
  "Caminhão munck": {"d":19,"m":24,"h":140,"u":0.85},
  "Trator de esteira": {"d":30,"m":40,"h":210,"u":0.85},
  "Uniport 3030": {"d":18,"m":30,"h":260,"u":0.85},
  "Drone pulverizador": {"d":0,"m":14,"h":90,"u":0.8},
  "Adubadora autopropelida": {"d":20,"m":26,"h":185,"u":0.85},
  "Prestador de serviço": {"d":0,"m":0,"h":0,"u":1}
};

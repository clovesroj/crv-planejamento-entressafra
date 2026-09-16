/**
 * Equipamentos de apoio.
 *
 * APOIO_FROTA  frota de apoio de utilizacao fixa (qtd, util, disp, implemento)
 * APOIO_EQ     equipamentos de apoio dimensionados por horas/mes e funcao
 */

export const APOIO_FROTA = [
  {"nome":"Caminhão Volvo FMX 540 — Bombeiro","qtd":1,"util":1,"disp":0.8,"imp":"Tanque pressurizador bombeiro","ativ":"Prevenção e combate a incêndios"},
  {"nome":"Caminhão Volvo FMX 540 — Basculante","qtd":1,"util":0.2,"disp":0.8,"imp":"Carroceria basculante","ativ":"Transporte de materiais"},
  {"nome":"Caminhão Volvo FMX 540 — Oficina","qtd":1,"util":1,"disp":0.8,"imp":"Carroceria oficina","ativ":"Oficina móvel"},
  {"nome":"Caminhão Volvo FMX 540 — Munck","qtd":1,"util":0.2,"disp":0.8,"imp":"Carroceria com Munck","ativ":"Transporte de materiais"},
  {"nome":"Caminhão Volvo FMX 540 — Prancha","qtd":1,"util":0.3,"disp":0.8,"imp":"Carroceria plataforma","ativ":"Transporte de equipamentos"},
  {"nome":"Caminhão Volvo FMX 540 — Comboio","qtd":1,"util":1,"disp":0.8,"imp":"Tanque de combustível","ativ":"Abastecimento"},
  {"nome":"Caminhão Volvo FMX 540 — Insumos","qtd":1,"util":1,"disp":0.8,"imp":"Carroceria carga seca","ativ":"Transporte de fertilizantes"},
  {"nome":"Caminhão Volvo FMX 540 — Transporte de muda","qtd":6,"util":1,"disp":0.8,"imp":"Carroceria canavieira","ativ":"Transporte de muda"},
  {"nome":"Trator 4x4 135 CV — Distribuição","qtd":1,"util":0.6,"disp":0.8,"imp":"Carroça de distribuição","ativ":"Distribuição de fertilizantes"},
  {"nome":"Motoniveladora JD 607","qtd":1,"util":0.3,"disp":0.8,"imp":"----","ativ":"Manutenção de estradas"},
  {"nome":"Retroescavadeira JD","qtd":1,"util":0.3,"disp":0.8,"imp":"----","ativ":"Sistematização"},
  {"nome":"Escavadeira hidráulica (terceiro)","qtd":1,"util":0.1,"disp":0.8,"imp":"----","ativ":"Sistematização"},
  {"nome":"Trator de esteira JD","qtd":1,"util":0.1,"disp":0.8,"imp":"----","ativ":"Sistematização"}
];

export const APOIO_EQ = [
  {"nome":"Caminhão bombeiro","maq":"Caminhão bombeiro","qtd":1,"hmes":180,"fcod":"F03","fniv":0},
  {"nome":"Caçamba basculante","maq":"Caçamba basculante","qtd":1,"hmes":60,"fcod":"F03","fniv":0},
  {"nome":"Motoniveladora","maq":"Motoniveladora","qtd":1,"hmes":90,"fcod":"F01","fniv":1},
  {"nome":"Pá mecânica / carregadeira","maq":"Pá mecânica / carregadeira","qtd":1,"hmes":120,"fcod":"F01","fniv":1},
  {"nome":"Retroescavadeira","maq":"Retroescavadeira","qtd":1,"hmes":90,"fcod":"F01","fniv":0},
  {"nome":"Escavadeira hidráulica","maq":"Escavadeira hidráulica","qtd":1,"hmes":60,"fcod":"F01","fniv":2},
  {"nome":"Veículo leve de apoio","maq":"Veículo leve de apoio","qtd":8,"hmes":150,"fcod":"F12","fniv":0},
  {"nome":"Caminhão comboio (abastecimento)","maq":"Caminhão comboio","qtd":1,"hmes":180,"fcod":"F03","fniv":0},
  {"nome":"Caminhão oficina","maq":"Caminhão oficina","qtd":1,"hmes":180,"fcod":"F09","fniv":1}
];

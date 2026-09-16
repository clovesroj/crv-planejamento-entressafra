/**
 * Escalas de trabalho.
 *
 * trab / folga  dias trabalhados e dias de folga do ciclo
 * fator         pessoas por posto: (trab + folga) / trab — é quanto de gente
 *               a escala exige para manter o posto coberto todos os dias
 *               de operação. 6x1 = 7/6 = 1,17; 5x2 = 7/5 = 1,40.
 *
 * A escala em branco na atividade usa o fator das Premissas de Mão de Obra
 * (dias de operação ÷ dias trabalhados), que é o comportamento de sempre.
 */

export const ESCALAS = {
  "6x1":   {trab:6, folga:1, nome:"6x1 — seis dias, um de folga"},
  "5x1":   {trab:5, folga:1, nome:"5x1 — cinco dias, um de folga"},
  "5x2":   {trab:5, folga:2, nome:"5x2 — semana de cinco dias"},
  "4x1":   {trab:4, folga:1, nome:"4x1 — quatro dias, um de folga"},
  "12x36": {trab:1, folga:1, nome:"12x36 — turno de doze horas"},
};

export const fatorEscala = cod => {
  const e = ESCALAS[cod];
  return e && e.trab > 0 ? (e.trab + e.folga) / e.trab : null;
};

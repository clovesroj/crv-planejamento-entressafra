/**
 * Mao de obra: encargos, beneficios, funcoes e estrutura indireta.
 *
 * ENCARGOS   percentuais sobre a remuneracao (pct e fracao, 0.2 = 20%)
 * BENEFICIOS valor fixo mensal por colaborador, em R$
 * FUNCOES    cod, nome, conta contabil, salario base e adicional (adic, fracao)
 * INDIRETOS  efetivo fixo que nao depende do volume do plano
 * FUNCAO_POR_ATIVIDADE  nome da atividade -> codigo da funcao padrao
 */

export const ENCARGOS = [
  {"nome":"INSS Empregador (patronal)","base":"Conta 200-35 — 20%","pct":0.2},
  {"nome":"RAT / SAT (grau de risco)","base":"Atividade agrícola","pct":0.03},
  {"nome":"Terceiros (SENAR, INCRA, Salário-Educação)","base":"Sistema S rural","pct":0.058},
  {"nome":"FGTS","base":"Conta 200-36 — 8%","pct":0.08},
  {"nome":"13º salário (provisão)","base":"1/12 do salário anual","pct":0.0833},
  {"nome":"Férias + 1/3 (provisão)","base":"Provisão mensal","pct":0.1111},
  {"nome":"Encargos sobre 13º e férias","base":"INSS+FGTS sobre provisões","pct":0.0621},
  {"nome":"Aviso prévio e rescisão (provisão)","base":"Provisão média","pct":0.04}
];

export const BENEFICIOS = [
  {"nome":"Vale refeição / alimentação","conta":"200-51 / 200-52","valor":620},
  {"nome":"Plano de saúde","conta":"200-53","valor":280},
  {"nome":"Plano odontológico","conta":"200-54","valor":35},
  {"nome":"Seguro de vida","conta":"200-55","valor":28},
  {"nome":"Uniformes e EPI","conta":"200-72 / 200-73","valor":95},
  {"nome":"Transporte de pessoal","conta":"200-127","valor":340},
  {"nome":"Alimentação rurícola (soro/lanche)","conta":"200-79 / 200-77","valor":110}
];

export const FUNCOES = [
  {"cod":"F01","nome":"Operador de máquinas agrícolas","conta":"200-17","sal":1895.5,"adic":0.2},
  {"cod":"F02","nome":"Operador de colhedora","conta":"200-17","sal":3348.46,"adic":0.2},
  {"cod":"F03","nome":"Motorista de caminhão","conta":"200-17","sal":1895.5,"adic":0.2},
  {"cod":"F04","nome":"Operário rural (catação/bordadura)","conta":"200-18","sal":1621,"adic":0.2},
  {"cod":"F05","nome":"Aplicador de defensivos","conta":"200-18","sal":2350,"adic":0.4},
  {"cod":"F06","nome":"Auxiliar rural / apoio","conta":"200-18","sal":1621,"adic":0.2},
  {"cod":"F07","nome":"Líder / encarregado de turma","conta":"200-18","sal":4200,"adic":0.2},
  {"cod":"F08","nome":"Assistente agrícola","conta":"200-15","sal":2703.71,"adic":0},
  {"cod":"F09","nome":"Mecânico de manutenção","conta":"200-16","sal":2031.64,"adic":0.2},
  {"cod":"F10","nome":"Técnico agrícola","conta":"200-15","sal":5200,"adic":0},
  {"cod":"F11","nome":"Operador de transbordo","conta":"200-17","sal":2900,"adic":0.2},
  {"cod":"F12","nome":"Motorista de veículo leve","conta":"200-17","sal":1895.5,"adic":0},
  {"cod":"F13","nome":"Mecânico líder de equipe","conta":"200-16","sal":5474.15,"adic":0.2},
  {"cod":"F14","nome":"Ajudante de mecânico","conta":"200-16","sal":1706.8,"adic":0.2}
];

export const INDIRETOS = [
  {"cod":"I01","nome":"Assistente agrícola","fcod":"F08","qtd":4},
  {"cod":"I02","nome":"Técnico agrícola","fcod":"F10","qtd":3},
  {"cod":"I03","nome":"Líder / encarregado de turma","fcod":"F07","qtd":8},
  {"cod":"I05","nome":"Motorista de apoio","fcod":"F03","qtd":9}
];

export const FUNCAO_POR_ATIVIDADE = {
  "Colheita safra 2026": "F02",
  "Colheita muda": "F02",
  "Dessecação": "F01",
  "1ª Gradagem pesada": "F01",
  "2ª Gradagem pesada": "F01",
  "Gradagem leve": "F01",
  "1ª Gradagem média": "F01",
  "2ª Gradagem média": "F01",
  "Subsolagem": "F01",
  "Plantio": "F01",
  "Tratos Fitossanitários no Plantio": "F05",
  "1ª Pré-emergência socaria": "F05",
  "2ª Pré-emergência socaria": "F05",
  "2ª Pré-emergência socaria pingente": "F05",
  "Bordaduras": "F04",
  "Catação quadriciclo": "F04",
  "1ª Catação socaria": "F04",
  "2ª Catação socaria": "F04",
  "Colheitabilidade": "F04",
  "Aplicação de Inseticida terrestre": "F05",
  "Aplicação de Inseticida aéreo": "F06",
  "1ª Pré-emergência plantio": "F05",
  "2ª Pré-emergência plantio": "F05",
  "1ª Pré-emergência socaria muda": "F05",
  "Quebra-lombo": "F01",
  "1ª Catação plantio": "F04",
  "2ª Catação plantio": "F04",
  "Reflorestamento": "F06",
  "Irrigação convencional socaria": "F06",
  "Fertirrigação convencional socaria": "F06",
  "Fertirrigação localizada socaria": "F06",
  "Fertirrigação localizada plantio": "F06",
  "Irrigação convencional plantio": "F06",
  "Irrigação localizada socaria": "F06",
  "Irrigação localizada plantio": "F06",
  "Transporte de cana colheita": "F03",
  "Transporte de cana muda": "F03",
  "Transbordo colheita": "F11",
  "Transbordo muda": "F11",
  "Apoio operacional": "F06",
  "Auxiliares agrícolas": "F06",
  "Adubação de socaria": "F01",
  "Adubação de cobertura": "F01"
};

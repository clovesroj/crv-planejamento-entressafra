/**
 * Mao de obra: encargos, beneficios, funcoes e estrutura indireta.
 *
 * ENCARGOS   percentuais sobre a remuneracao (pct e fracao, 0.2 = 20%)
 * BENEFICIOS valor fixo mensal por colaborador, em R$
 * FUNCOES    cargos do ERP, com o codigo e o nome como estao cadastrados la.
 *            Salario e adicional vieram por heranca do cargo equivalente do
 *            cadastro anterior: sao valores de PARTIDA, a confirmar com a
 *            folha. oficina:true marca os tres cargos de manutencao, que a
 *            extracao agricola do ERP nao traz.
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
  {"cod":"481","nome":"ASSISTENTE AGRICOLA I","conta":"200-15","sal":2703.71,"adic":0.0},
  {"cod":"484","nome":"ASSISTENTE AGRICOLA IV","conta":"200-15","sal":2703.71,"adic":0.0},
  {"cod":"673","nome":"ASSISTENTE DE TOPOGRAFIA II","conta":"200-15","sal":2703.71,"adic":0.0},
  {"cod":"15","nome":"AUXILIAR ADMINISTRATIVO I","conta":"200-15","sal":2703.71,"adic":0.0},
  {"cod":"190","nome":"AUXILIAR ADMINISTRATIVO II","conta":"200-15","sal":2703.71,"adic":0.0},
  {"cod":"596","nome":"AUXILIAR AGRICOLA","conta":"200-18","sal":1621.00,"adic":0.2},
  {"cod":"491","nome":"COORDENADOR AGRICOLA III","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"664","nome":"COORDENADOR AGRICOLA VI","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"663","nome":"FISCAL AGRICOLA","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"567","nome":"FISCAL AGRICOLA III","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"519","nome":"GERENTE DE TRANSPORTE E MECANIZACAO","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"960","nome":"LIDER AGRICOLA I","conta":"200-18","sal":4200.00,"adic":0.2},
  {"cod":"961","nome":"LIDER AGRICOLA II","conta":"200-18","sal":4200.00,"adic":0.2},
  {"cod":"962","nome":"LIDER AGRICOLA III","conta":"200-18","sal":4200.00,"adic":0.2},
  {"cod":"963","nome":"LIDER AGRICOLA IV","conta":"200-18","sal":4200.00,"adic":0.2},
  {"cod":"906","nome":"MOTORISTA DIRETORIA","conta":"200-17","sal":1895.50,"adic":0.0},
  {"cod":"82","nome":"MOTORISTA I","conta":"200-17","sal":1895.50,"adic":0.0},
  {"cod":"900","nome":"MOTORISTA I","conta":"200-17","sal":1895.50,"adic":0.0},
  {"cod":"901","nome":"MOTORISTA II","conta":"200-17","sal":1895.50,"adic":0.2},
  {"cod":"902","nome":"MOTORISTA III","conta":"200-17","sal":1895.50,"adic":0.2},
  {"cod":"9615","nome":"MOTORISTA III","conta":"200-17","sal":1895.50,"adic":0.2},
  {"cod":"905","nome":"MOTORISTA LIDER","conta":"200-17","sal":1895.50,"adic":0.2},
  {"cod":"917","nome":"OP. DE MAQUINAS AGRICOLAS I (MG)","conta":"200-17","sal":1895.50,"adic":0.2},
  {"cod":"918","nome":"OP. DE MAQUINAS AGRICOLAS II (MG)","conta":"200-17","sal":2900.00,"adic":0.2},
  {"cod":"919","nome":"OP. DE MAQUINAS AGRICOLAS III (MG)","conta":"200-17","sal":3348.46,"adic":0.2},
  {"cod":"920","nome":"OP. DE MAQUINAS AGRICOLAS LIDER (MG)","conta":"200-17","sal":3348.46,"adic":0.2},
  {"cod":"660","nome":"SUPERVISOR AGRICOLA I","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"661","nome":"SUPERVISOR AGRICOLA II","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"662","nome":"SUPERVISOR AGRICOLA III","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"681","nome":"TOPOGRAFO","conta":"200-15","sal":5200.00,"adic":0.0},
  {"cod":"542","nome":"TRABALHADOR RURAL","conta":"200-18","sal":1621.00,"adic":0.2},
  {"cod":"F09","nome":"MECANICO DE MANUTENCAO","conta":"200-16","sal":2031.64,"adic":0.2,"oficina":true},
  {"cod":"F13","nome":"MECANICO LIDER DE EQUIPE","conta":"200-16","sal":5474.15,"adic":0.2,"oficina":true},
  {"cod":"F14","nome":"AJUDANTE DE MECANICO","conta":"200-16","sal":1706.80,"adic":0.2,"oficina":true},
];

export const INDIRETOS = [
  {"cod":"I01","nome":"Assistente agrícola","fcod":"481","qtd":4},
  {"cod":"I02","nome":"Técnico agrícola","fcod":"567","qtd":3},
  {"cod":"I03","nome":"Líder / encarregado de turma","fcod":"961","qtd":8},
  {"cod":"I05","nome":"Motorista de apoio","fcod":"902","qtd":9}
];

export const FUNCAO_POR_ATIVIDADE = {
  "Aplicação de calcário":"918","Aplicação de gesso":"918","Colheita safra 2026": "919",
  "Colheita muda": "919",
  "Dessecação": "918",
  "1ª Gradagem pesada": "918",
  "2ª Gradagem pesada": "918",
  "Gradagem leve": "918",
  "1ª Gradagem média": "918",
  "2ª Gradagem média": "918",
  "Subsolagem": "918",
  "Plantio": "918",
  "Tratos Fitossanitários no Plantio": "917",
  "1ª Pré-emergência socaria": "917",
  "2ª Pré-emergência socaria": "917",
  "2ª Pré-emergência socaria pingente": "917",
  "Bordaduras": "542",
  "Catação quadriciclo": "542",
  "1ª Catação socaria": "542",
  "2ª Catação socaria": "542",
  "Colheitabilidade": "542",
  "Aplicação de Inseticida terrestre": "917",
  "Aplicação de Inseticida aéreo": "596",
  "1ª Pré-emergência plantio": "917",
  "2ª Pré-emergência plantio": "917",
  "1ª Pré-emergência socaria muda": "917",
  "Quebra-lombo": "918",
  "1ª Catação plantio": "542",
  "2ª Catação plantio": "542",
  "Reflorestamento": "596",
  "Irrigação convencional socaria": "596",
  "Fertirrigação convencional socaria": "596",
  "Fertirrigação localizada socaria": "596",
  "Fertirrigação localizada plantio": "596",
  "Irrigação convencional plantio": "596",
  "Irrigação localizada socaria": "596",
  "Irrigação localizada plantio": "596",
  "Transporte de cana colheita": "902",
  "Transporte de cana muda": "902",
  "Transbordo colheita": "918",
  "Transbordo muda": "918",
  "Apoio operacional": "596",
  "Auxiliares agrícolas": "596",
  "Adubação de socaria": "918",
  "Adubação de cobertura": "918"
};

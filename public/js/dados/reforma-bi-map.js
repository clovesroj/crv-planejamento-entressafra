/**
 * De-para entre os CONJUNTOS da Reforma de Frota (dados/reforma.js) e o
 * texto entre asteriscos que o ERP grava no fim da Descricao Produto (ex.:
 * "...*CHASSI*"), que e o que scripts/gasto-reforma-bi.mjs le do Power BI.
 *
 * Colhedora (CONJ_COLHEDORA) NAO precisa de mapa: os nomes dos conjuntos JA
 * SAO as tags do ERP, letra por letra -- foi por isso que a lista mudou (ver
 * o comentario em dados/reforma.js). tagsBiDoConjunto() so faz o identity
 * pra essa familia.
 *
 * Frota geral (CONJ_GERAL) ainda usa a nomenclatura da planilha de
 * orcamento, entao continua precisando de um de-para. Os nomes NAO batem
 * 100% -- cada conjunto pode corresponder a zero, uma ou mais tags do ERP
 * (por isso o valor e sempre um array). Tag do ERP que nao aparece em
 * nenhum array fica de fora da referencia "gasto real"; nao quebra nada, so
 * nao mostra numero. Preenchido so onde a correspondencia e obvia -- na
 * duvida, deixe vazio (mostrar no conjunto errado e pior que nao mostrar).
 */

// Frota geral -- ver CONJ_GERAL em dados/reforma.js
export const COMPARTIMENTO_BI_GERAL = {
  "MOTOR": ["MOTOR"],
  "SUSPENSÃO": ["SUSPENSAO"],
  "FREIO": ["FREIO"],
  "CABINE": ["CABINE"],
  "IMPLEMENTO": ["IMPLEMENTO"],
  "PINTURA": ["PINTURA"],
  "CARROCERIA / CALDEIRARIA": ["CARROCERIA"],
  "EMBREAGEM": [],
  "CÂMBIO / TRANSMISSÃO": ["CAMBIO", "TRANSMISSAO"],
  "DIFERENCIAL": [],
  "CUBO": [],
  "CHASSI / ESTRUTURA": ["CHASSI", "ESTRUTURA"],
  "PNEUMÁTICA": ["PNEUMATICA"],
  "BANCOS": [],
  "SISTEMA ARREFECIMENTO": ["ARREFECIMENTO"],
  "SISTEMA HIDRÁULICO": ["HIDRAULICA"],
  "MUCK": [],
  "EIXO DIANTEIRO / EMBUCHAMENTO": [],
  "CHICOTE ELÉTRICO": [],
  "PARTE ELÉTRICA": [],
  "AR CONDICIONADO": [],
};

/** Tags do ERP (Power BI) que valem para um conjunto, na familia certa. */
export function tagsBiDoConjunto(familia, conjunto) {
  if (familia === "colhedora") return [conjunto]; // nome do conjunto == tag do ERP
  return COMPARTIMENTO_BI_GERAL[conjunto] || [];
}

/**
 * Reforma de frota: conjuntos orcados por equipamento.
 *
 * O orcamento de reforma e lancado por UNIDADE de frota, aberto nos conjuntos
 * mecanicos que vao a reforma. A lista de conjuntos muda conforme a familia do
 * equipamento -- uma colhedora tem corte de base e extrator, um caminhao tem
 * embreagem e diferencial.
 *
 * Nomenclatura e ordem vieram da planilha de orcamento de reforma da safra,
 * abas "Base Diversos" (frota geral) e "Base Colhedora" (colhedora e esteira).
 *
 * Aqui so mora a ESTRUTURA. Valor nenhum e pre-preenchido: o orcamento e
 * digitado na aba Reforma de Frota, unidade por unidade.
 */

// Frota geral: caminhao, trator, reboque, implemento, veiculo, equipamento
const CONJ_GERAL = [
  "MOTOR", "SUSPENSÃO", "FREIO", "CABINE", "IMPLEMENTO", "PINTURA",
  "CARROCERIA / CALDEIRARIA", "EMBREAGEM", "CÂMBIO / TRANSMISSÃO", "DIFERENCIAL",
  "CUBO", "CHASSI / ESTRUTURA", "PNEUMÁTICA", "BANCOS", "SISTEMA ARREFECIMENTO",
  "SISTEMA HIDRÁULICO", "MUCK", "EIXO DIANTEIRO / EMBUCHAMENTO",
  "CHICOTE ELÉTRICO", "PARTE ELÉTRICA", "AR CONDICIONADO",
];

// Colhedora de cana e trator de esteira: conjuntos proprios da maquina de corte
const CONJ_COLHEDORA = [
  "CHASSI", "EXTRATOR 1°", "EXTRATOR 2°", "ELEVADOR", "ELÉTRICA",
  "SIST. HIDRÁULICO MANGUEIRAS", "SIST. HIDR. BOMBAS / MOTORES",
  "SISTEMA ARREFECIMENTO", "AR CONDICIONADO", "MOTOR", "CABINE",
  "PAINEL INSTRUMENTOS", "CORTE BASE", "CORTE DE PONTA", "DIVISOR DE LINHA",
  "ROLOS ALIMENTADORES", "ROLOS PICADORES", "COMANDOS", "CAIXA PICADOR",
  "MESA DE GIRO", "CAIXA 4 FUROS", "KIT ANTI INCÊNDIO", "ROLETES",
  "REDUÇÃO FINAL", "TRUCK", "RODA GUIA / MOTRIZ", "ESTEIRA", "SAPATAS",
];

// Especialidades que usam a lista da colhedora; o resto cai na geral
const ESP_COLHEDORA = ["COLHEDORA - CANA", "MAQUINA PESADA - TRATOR ESTEIRA"];

export const REFORMA_FAMILIAS = {
  colhedora: { rotulo: "Colhedora e esteira", conjuntos: CONJ_COLHEDORA },
  geral:     { rotulo: "Frota geral",         conjuntos: CONJ_GERAL },
};

/** Familia de conjuntos de uma especialidade. */
export function familiaReforma(esp) {
  return ESP_COLHEDORA.includes(esp) ? "colhedora" : "geral";
}

/** Conjuntos orcaveis de uma especialidade, na ordem de exibicao. */
export function conjuntosDe(esp) {
  return REFORMA_FAMILIAS[familiaReforma(esp)].conjuntos;
}

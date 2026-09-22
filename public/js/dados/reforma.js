/**
 * Reforma de frota: conjuntos orcados por equipamento.
 *
 * O orcamento de reforma e lancado por UNIDADE de frota, aberto nos conjuntos
 * mecanicos que vao a reforma. A lista de conjuntos muda conforme a familia do
 * equipamento -- uma colhedora tem corte de base e extrator, um caminhao tem
 * embreagem e diferencial.
 *
 * Frota geral: nomenclatura e ordem vieram da planilha de orcamento de
 * reforma da safra, aba "Base Diversos".
 *
 * Colhedora: os nomes SAO as tags *COMPARTIMENTO* do ERP (ver comentario
 * abaixo) -- trocado da planilha original pra bater com o gasto real vindo
 * do Power BI sem ambiguidade.
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

// Colhedora de cana e trator de esteira: mesmos nomes (e grafia) das tags
// *COMPARTIMENTO* que o ERP grava no fim da Descricao Produto, vistas de
// verdade numa extracao real (scripts/gasto-reforma-bi.mjs, 2026-09-22,
// Especialidade=COLHEDORA-CANA). Antes essa lista vinha da planilha de
// orcamento e tinha nomenclatura propria (ex.: duas colunas de hidraulica);
// como o ERP so tem UMA tag "*HIDRAULICA*", manter dois nomes so causava
// ambiguidade na hora de cruzar com o gasto real -- por isso a lista agora
// segue o ERP: um conjunto, uma tag, sem tradução no meio.
const CONJ_COLHEDORA = [
  "ADMISSAO", "ARREFECIMENTO", "CABINE", "CAMBIO", "CARROCERIA", "CHASSI",
  "COMPRESSOR", "CORTADOR", "CORTE BASE", "DIRECAO", "DIVISOR LINHA",
  "ELETRICA", "ELEVADOR", "ESCAPE", "EXT PRIMARIO", "EXT SECUNDARIO", "FREIO",
  "HIDRAULICA", "IMPLEMENTO", "MANUT BASICA", "MEC DEDICADO", "MESA GIRO",
  "MOTOR", "PICADOR", "PNEU", "PNEUMATICA", "RADIO", "REFRIGERACAO",
  "RODANTE", "ROLO ALIMENTACAO", "ROLO PRE TOMBADOR", "SIST COMB",
  "SUSPENSAO", "TRANSMISSAO", "TREM FORCA", "TRUCK",
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

/**
 * Sistema (compartimento) a que um PRODUTO pertence, pela descricao do ERP.
 *
 * O lancamento do ERP ja vem com uma tag no fim da descricao (*RODANTE*,
 * *HIDRAULICA*...), e e por ela que a extracao separa o gasto. So que a tag e
 * de quem apontou, nao do produto: um lancamento de mangueira hidraulica
 * aparece em *ADMISSAO* quando o apontamento saiu errado, e o compartimento de
 * hidraulica nunca ve aquele produto.
 *
 * Aqui a classificacao segue o PRODUTO. A regra e por palavra, na ordem da
 * lista -- a primeira que casar manda. Produto generico (parafuso, porca,
 * arruela, anel, pino) NAO entra em nenhuma: nao da para saber de que sistema
 * e um parafuso olhando o nome dele, e chutar seria pior do que manter a tag do
 * ERP. Nesse caso vale a tag, e a tela mostra que veio dela.
 */

export const SISTEMAS_PRODUTO = [
  {sistema:"HIDRAULICA",   tem:["HIDRAUL", "MANGUEIRA", "CILINDRO", "VALVULA", "BOMBA HIDR", "ENGATE RAPIDO",
                                "TERMINAL MANG", "ADAPTADOR HIDR", "RESERVATORIO HIDR"]},
  {sistema:"RODANTE",      tem:["ROLETE", "ESTEIRA", "SAPATA", "RODA MOTRIZ", "RODA GUIA", "MOLA TENSORA",
                                "CORRENTE RODANTE", "TENSOR ESTEIRA"]},
  {sistema:"MOTOR",        tem:["OLEO LUBR", "FILTRO LUBR", "PISTAO", "BIELA", "VIRABREQUIM", "CABECOTE",
                                "JUNTA MOTOR", "BOMBA OLEO", "TURBINA", "TURBO"]},
  {sistema:"SIST COMB",    tem:["BICO INJETOR", "FILTRO COMB", "BOMBA COMB", "INJETORA", "COMBUSTIVEL"]},
  {sistema:"ARREFECIMENTO",tem:["RADIADOR", "ARREFEC", "VENTOINHA", "COLMEIA", "ADITIVO RADIADOR"]},
  {sistema:"ELETRICA",     tem:["BATERIA", "CHICOTE", "LAMPADA", "SENSOR", "ALTERNADOR", "MOTOR PARTIDA",
                                "BUZINA", "FUSIVEL", "RELE", "FAROL", "CABO ELETRICO"]},
  {sistema:"TRANSMISSAO",  tem:["TRANSMISSAO", "EMBREAGEM", "DIFERENCIAL", "CAIXA CAMBIO", "CARDAN",
                                "REDUTOR", "COROA PINHAO"]},
  {sistema:"PNEU",         tem:["PNEU", "CAMARA AR", "PROTETOR ARO"]},
  {sistema:"ELEVADOR",     tem:["ELEVADOR", "TAPETE ELEVADOR", "CORRENTE ELEVADOR"]},
  {sistema:"CORTE BASE",   tem:["CORTE BASE", "DISCO CORTE", "FACA CORTE", "SAPATA CORTE"]},
  {sistema:"PICADOR",      tem:["PICADOR", "FACA PICADOR", "ROLO PICADOR"]},
  {sistema:"EXT PRIMARIO", tem:["EXTRATOR PRIMARIO", "EXT PRIMARIO", "CAPUZ", "HELICE EXTRATOR"]},
  {sistema:"PNEUMATICA",   tem:["PNEUMAT", "COMPRESSOR AR", "VALVULA AR"]},
  {sistema:"CABINE",       tem:["CABINE", "AR CONDICIONADO", "BANCO OPERADOR", "VIDRO CABINE", "PARABRISA"]},
  {sistema:"ESCAPE",       tem:["ESCAPAMENTO", "SILENCIOSO", "CATALISADOR"]},
  {sistema:"SUSPENSAO",    tem:["SUSPENSAO", "AMORTECEDOR", "FEIXE MOLA"]},
  {sistema:"CHASSI",       tem:["CHASSI", "LONGARINA"]},
];

/* Produto generico: nao diz de que sistema e. Fica com a tag do ERP. */
export const PRODUTO_GENERICO = ["PARAFUSO", "PORCA", "ARRUELA", "ANEL", "PINO", "BUCHA", "VEDACAO",
  "RETENTOR", "ROLAMENTO", "GRAXA", "ABRACADEIRA", "CHAVETA", "TRAVA", "MANCAL", "EIXO", "BUJAO"];

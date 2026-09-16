/**
 * Cadastro de matéria-prima: origens da cana, modalidades de contrato e
 * parâmetros de pagamento. Dado de negócio — nenhuma fórmula aqui.
 */

/* As quatro origens, com a natureza contábil de cada uma. A natureza é o que
   impede a mistura: própria e arrendada são custo de produção do plano
   agrícola; fornecedor e parceria são aquisição de matéria-prima. */
const FORN_ORIGENS = {
  propria:    {nome:"Cana própria",       nat:"Custo de produção — área própria",  fonte:"plano",    cor:"#2D6A3A"},
  arrendada:  {nome:"Cana arrendada",     nat:"Custo de produção + arrendamento",  fonte:"plano",    cor:"#7E9C6B"},
  fornecedor: {nome:"Cana de fornecedor", nat:"Aquisição de matéria-prima",        fonte:"contrato", cor:"#C9A45C"},
  parceria:   {nome:"Cana de parceria",   nat:"Aquisição — partilha da produção",  fonte:"contrato", cor:"#A5503A"},
};

/* Modalidades de contrato. "un" é a unidade do campo Preço em cada uma, e
   "origem" diz em qual origem a entrega entra quando o usuário não escolhe. */
const FORN_MODALIDADES = {
  consecana: {nome:"Consecana — ATR × preço do kg", un:"R$/kg ATR",      origem:"fornecedor"},
  rs_t:      {nome:"Preço fixo por tonelada",       un:"R$/t",           origem:"fornecedor"},
  parceria:  {nome:"Parceria — % da produção",      un:"% da produção",  origem:"parceria"},
  permuta:   {nome:"Permuta — cana por área",       un:"t/ha entregues", origem:"parceria"},
};

const FORN_QUALIDADE = ["A definir","Ótima","Boa","Regular","Abaixo do padrão"];

/* Parâmetros gerais. precoAtr e atrPropria seguem o Consecana da safra;
   freteKm é a tarifa usada quando a linha não traz frete próprio. */
const FORN_PAR_PADRAO = {
  precoAtr: 1.25,      // R$ por kg de ATR
  atrPropria: 135,     // kg de ATR por tonelada da cana própria
  freteKm: 0.22,       // R$ por tonelada por km rodado
  areaPropria: 0,      // ha de terra própria — o resto da área do plano é arrendada
};

/* Linha em branco do cadastro de fornecedores. */
const FORN_LINHA = {
  forn:"Novo fornecedor", prop:"", origem:"fornecedor", mod:"consecana",
  area:0, tch:0, tonContr:0, tonEst:0, atr:135, preco:0, premio:0, desc:0,
  frete:0, logist:0, dist:0, entIni:0, entFim:0, qual:"A definir", tonHist:0,
};

export { FORN_LINHA, FORN_MODALIDADES, FORN_ORIGENS, FORN_PAR_PADRAO, FORN_QUALIDADE };

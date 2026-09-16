/**
 * Custos administrativos: grupos, criterios de rateio e cadastro inicial.
 *
 * Dado de negocio - nenhuma formula aqui.
 *
 * ADM_GRUPOS    agrupamento das linhas, so para leitura e totalizacao
 * ADM_CRITERIOS criterio de rateio de cada linha entre as etapas do plano
 * ADM_PADRAO    cadastro inicial, uma linha por natureza pedida
 */

const ADM_GRUPOS = {
  estrutura:  "Estrutura administrativa",
  pessoal:    "Pessoal administrativo",
  tecnologia: "Tecnologia e comunicação",
  instalacao: "Instalações",
  pessoas:    "Pessoas e segurança",
  servicos:   "Serviços especializados",
  gerais:     "Despesas gerais",
};

/* Como cada linha se distribui entre as etapas do plano.
   base  o que serve de peso no rateio; "fixo" usa os percentuais por etapa
         informados na propria aba; "cc" joga a linha inteira num centro de
         custo escolhido na linha. */
const ADM_CRITERIOS = {
  ha:     {nome:"Hectare operado",        base:"ha",     dica:"Proporcional aos hectares de cada etapa"},
  ton:    {nome:"Tonelada",               base:"ton",    dica:"Proporcional às toneladas de cada etapa"},
  horas:  {nome:"Horas-máquina",          base:"horas",  dica:"Proporcional às horas de máquina de cada etapa"},
  direto: {nome:"Custo direto",           base:"direto", dica:"Proporcional ao custo direto de cada etapa"},
  pct:    {nome:"Percentual por etapa",   base:"fixo",   dica:"Usa os percentuais informados nesta aba"},
  cc:     {nome:"Centro de custo",        base:"cc",     dica:"Vai inteiro para o centro de custo da linha"},
};

/* Centros de custo operacionais: as etapas do plano, mais a estrutura, que
   nao pertence a nenhuma etapa e fica no rateio indireto geral. */
const ADM_CC = ["PREPARO DE SOLO","PLANTIO","TRATOS CULTURAIS","COLHEITA",
                "APOIO E CONSERVAÇÃO","ESTRUTURA (sem rateio)"];

/* Percentual de partida do critério "percentual por etapa" — editável. */
const ADM_RAT_PADRAO = {"PREPARO DE SOLO":10, "PLANTIO":20, "TRATOS CULTURAIS":30,
                        "COLHEITA":35, "APOIO E CONSERVAÇÃO":5};

/* Cadastro inicial: uma linha por natureza pedida, com o critério que costuma
   fazer sentido em cada uma. Valores em R$/mês, todos zerados — a primeira
   linha recebe, no primeiro uso, o valor global de administração que estava
   nas Premissas, para o custo do plano não mudar sozinho. */
const ADM_PADRAO = [
  {grupo:"estrutura",  desc:"Estrutura administrativa (valor global)", valor:0, crit:"direto", cc:""},
  {grupo:"pessoal",    desc:"Salários da administração",               valor:0, crit:"direto", cc:""},
  {grupo:"pessoal",    desc:"Encargos sobre a folha administrativa",   valor:0, crit:"direto", cc:""},
  {grupo:"pessoal",    desc:"Benefícios da administração",             valor:0, crit:"direto", cc:""},
  {grupo:"tecnologia", desc:"Tecnologia e infraestrutura de TI",       valor:0, crit:"ha",     cc:""},
  {grupo:"tecnologia", desc:"Softwares e licenças",                    valor:0, crit:"ha",     cc:""},
  {grupo:"tecnologia", desc:"Comunicação (telefonia e dados)",         valor:0, crit:"ha",     cc:""},
  {grupo:"instalacao", desc:"Aluguel de imóveis e instalações",        valor:0, crit:"ha",     cc:""},
  {grupo:"instalacao", desc:"Energia elétrica",                        valor:0, crit:"ha",     cc:""},
  {grupo:"pessoas",    desc:"Viagens e estadas",                       valor:0, crit:"direto", cc:""},
  {grupo:"pessoas",    desc:"Treinamentos e capacitação",              valor:0, crit:"horas",  cc:""},
  {grupo:"pessoas",    desc:"EPIs e uniformes",                        valor:0, crit:"horas",  cc:""},
  {grupo:"pessoas",    desc:"Segurança do trabalho e patrimonial",     valor:0, crit:"pct",    cc:""},
  {grupo:"servicos",   desc:"Consultorias",                            valor:0, crit:"direto", cc:""},
  {grupo:"servicos",   desc:"Auditorias",                              valor:0, crit:"direto", cc:""},
  {grupo:"servicos",   desc:"Serviços especializados de terceiros",    valor:0, crit:"direto", cc:""},
  {grupo:"gerais",     desc:"Despesas gerais",                         valor:0, crit:"direto", cc:""},
];

export { ADM_CC, ADM_CRITERIOS, ADM_GRUPOS, ADM_PADRAO, ADM_RAT_PADRAO };

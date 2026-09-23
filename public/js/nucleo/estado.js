/**
 * Estado da sessao — tudo que o usuario edita e que a persistencia grava.
 *
 * Os valores sao exportados como bindings vivos: quem importa `P` enxerga a
 * troca feita aqui. Como um modulo nao pode atribuir a um binding importado,
 * toda substituicao passa por um setter (setP, setPLANO, ...). Mexer no
 * conteudo — `P.diesel = 6.5`, `PLANO[cod].m[2] = 10` — dispensa setter.
 *
 * Campo nao tocado nesta sessao fica `null` ou `{}`: e assim que estado()
 * sabe o que omitir no merge para nao apagar o que outra sessao preencheu.
 */
import { PADRAO } from '../dados/padroes.js';
import { CFG } from '../dados/cfg.js';
import { ADM_PADRAO } from '../dados/administrativo.js';
import { num } from './formato.js';

let P = {...PADRAO};
let PLANO = {};          // cod -> {m:[9], trat:""}
let DIM   = {};          // cod -> {rend, rendM, util, frota, turnos, esc, ini, fim}
let INSUMO = {};         // produto -> {preco, est}
let ESPOR = [];          // [{mes, desc, cc, valor, status}]
let TRATC = {};          // cod -> [{prod,dose,un}]  composição customizada (sobrepõe a base)
let NIV  = {};           // fcod -> [{sal,qtd} x5]  níveis salariais (I..V)
let GRAT = {};           // fcod -> {tipo:'R$'|'%', valor}
let APOIO = null;        // [{nome,maq,qtd,hmes,fcod,fniv}] equipamentos de apoio
let TERC_TAR = {};       // cod da atividade -> tarifa de terceirização (R$/ha)
let TERC_SUB = {};       // cod -> {subModo: {pct, tar}} detalhamento do terceiro por avião/drone/terrestre
let TERC_DET = null;     // cod com o modal de detalhamento do terceiro aberto, ou null (visão, não dado)
let CRM = {};            // item -> {pecas,terc,consumo,lubrif} ajustados
let MATX = null;         // materiais de manutenção (lista editável)
let INSX = null;         // cadastro de insumos (lista editável: incluir/alterar/remover)
let INSX_V = 0;          // versão do cadastro base que este documento já recebeu
let ATVX = null;         // cadastro de atividades (lista editável: incluir/alterar/remover)
let ATVX_V = 0;          // versão do cadastro base de atividades que este documento já recebeu
let FROTA = {};          // item -> {qtd, hmes} frota prevista para manutenção
let MAQ = {};            // item -> {d,h,u} ajustados: diesel L/h, horas/mês, utilização
let CRM_ESP = {};        // especialidade -> taxa padrão herdada pelos modelos dela
let FROTA_UN = {};       // CodFrota -> {st:"roda"|"reforma", crm:{...}, ref:{conjunto:valor}}
let FROTA_DEST = "todos"; // filtro de destino: todos | roda | reforma
let REAL = {};           // cod da atividade -> [12] realizado lançado
let ACOMP_MES = null;    // mês de corte do acompanhamento; null = todos
let PERIODO_SEL = "todos";  // filtro global de periodo: todos | safra | entressafra | meses
// meses escolhidos a dedo, quando PERIODO_SEL e "meses". Fica separado do
// PERIODO_SEL para que voltar de "Ano todo" para a escolha manual nao perca a
// selecao -- e visao, nao dado, entao nao entra no documento salvo.
let MESES_SEL = [];
let FROTA_ABERTO = {};   // chave do modelo -> true quando a lista de unidades está aberta
let FITO_ABERTO = {};    // cod da atividade -> true quando a estratificação por modo está aberta (Manejo Fitossanitário)
let PLANO_ABERTO = {};   // cod da atividade -> true quando a quebra por tratamento está aberta (Plano Operacional)
let INS_FICHA = null;    // produto com a ficha técnica aberta no modal, ou null
let DIM_DET = null;      // {cod, aba} do detalhe de dimensionamento aberto, ou null
let APOIO_DET = null;    // {cod, erp} do item de apoio com o mes aberto, ou null
let INS_EDIT = null;     // produto em edição no modal (Cadastro de Insumos), ou null
let FROTA_ORIG = "todos"; // filtro próprio/terceiro das abas de frota (não é salvo: é visão, não dado)
let CRIT_GER = "";       // filtro de gerência do critério por mês (visão, não dado)
let REF_BUSCA = "";      // busca por especialidade na aba Reforma de Frota (visão, não dado)
let REF_AG = "";         // filtro de agrupamento na aba Reforma de Frota (visão, não dado)
let REF_FAM = "";        // filtro de família (colhedora/geral) na aba Reforma de Frota (visão, não dado)
let REF_FROTA = "";      // busca por código de frota ou modelo na aba Reforma de Frota (visão, não dado)
let REF_PROP = "";       // filtro próprio/terceiro na aba Reforma de Frota (visão, não dado) -- "" | "proprio" | "terceiro"

// Filtros do painel "Análise do Gasto Real (ERP)" -- mesmos eixos do
// relatório de origem (BI), aplicados sobre GASTO_REFORMA_BI. Visão, não dado.
let GR_INICIO = "";      // AAAA-MM-DD ou "" (sem piso)
let GR_FIM = "";         // AAAA-MM-DD ou "" (sem teto)
let GR_EMPRESA = "";
let GR_ESP = "";
let GR_AG = "";
let GR_COMP = "";
let GR_FROTA = "";
let GR_PROP = "";
let GR_REFORMA = "";     // "" | "SIM" | "NAO"
let CRIT_CABE = "";      // "" todos os meses | "apertado" só os que não cabem
let APOIO_FIXO = {};     // nome do item -> qtd ajustada (frota de apoio de utilização fixa)
let TRAT_NOME = {};      // cod do tratamento -> nome descritivo editável
let TRAT_OBS = {};       // cod do tratamento -> observação livre (recomendação, instrução de uso)
let TRAT_ETAPA = {};     // cod do tratamento -> etapas em que é usado (preparo, plantio, planta, soca...)
let TRAT_DEL = {};       // cod do tratamento -> true quando foi removido do cadastro base
let TRAT_ATIVO = {};     // cod do tratamento -> false quando inativo (ausente = ativo); some das buscas de vínculo novo
let DIESEL_MES = {};     // índice do mês -> preço projetado do diesel (R$/L); vazio = preço base
let ARREND = null;       // [{faz, grupo, area, forma, qtd, pag, mes}] fazendas ou grupos arrendados
let ARR_PAR = {};        // parâmetros de pagamento do arrendamento (ATR, preços, critério)
let ARR_RAT = {};        // etapa -> % do arrendamento (referência PECEGE/USP)
let FORN = null;         // [{forn,prop,origem,mod,area,tch,tonContr,tonEst,atr,preco,...}] fornecedores de cana
let FORN_PAR = {};       // parâmetros de matéria-prima (preço do ATR, ATR próprio, frete/km, área própria)
let GRUPOS_INS = null;   // [{id,nome}] grupos de insumo criados pelo usuário, além dos fixos do cadastro
let FAM_NOME = {};       // id do grupo FIXO do cadastro -> nome renomeado pelo usuário (grupo criado já guarda o nome nele mesmo)
let FAM_CLASSE = {};     // id do grupo FIXO do cadastro -> classe (Químico, Mineral...) ajustada pelo usuário
let ADM = null;          // [{grupo,desc,valor,crit,cc}] custos administrativos
let ADM_RAT = {};        // etapa -> % do rateio administrativo por percentual
let QUADRO = {};         // fcod -> {ativo, ferias, demis} quadro de pessoal informado
let TPESS = null;        // rotas de transporte de pessoal (lista editável)
/* FAT: funcionarios com o contrato suspenso para qualificacao (bolsa paga pelo
   Fundo de Amparo ao Trabalhador). Somam no efetivo e no custo -- a empresa
   paga um beneficio por mes enquanto dura --, mas nao ficam disponiveis para a
   operacao. Linha: {fcod, qtd, m:[12 x 0/1], ben (R$/mes por pessoa), desc} */
let FAT = [];
/* Mao de obra de apoio operacional, lancada no Dimensionamento: gente que a
   operacao precisa e que nao sai de atividade nenhuma (fiscal, apontador,
   lider de frente...). Linha: {fcod, qtd, m:[12 x 0/1], frente} */
let MO_APOIO = [];
// visao da pagina Quadro ADM e oficina (aba Mao de Obra): mes e grupo -- nao e gravado
let QF_MES = 10, QF_GRUPO = "todos";
let ENC = {};            // índice do encargo -> % ajustado
let BEN = {};            // índice do benefício -> valor ajustado
let EDITADO = false;     // true assim que o usuário mexe em algo — trava o carregamento
                          // assíncrono do servidor para não sobrescrever uma edição em andamento

/* Selecao corrente da interface. Nao entra na gravacao: e so onde o usuario
   esta olhando, e por isso nao aparece em estado(). */
let FUN_SEL = null;
let CAT_SEL = null;
let TRAT_SEL = null;
let ATIV_TRAT_SEL = null;  // cod da atividade cujo período/meses aparece na aba Insumos
// busca de bula na AGROFIT (Embrapa), aberta no modal: {ix, carregando, erro, resultados} ou null
let AGROFIT_BUSCA = null;

export {
  P, PLANO, DIM, INSUMO, ESPOR, TRATC, NIV, GRAT, APOIO, TERC_TAR, TERC_SUB, TERC_DET, CRM, MATX,
  INSX, INSX_V, ATVX, ATVX_V, FROTA, CRM_ESP, MAQ, FROTA_UN, FROTA_DEST, FROTA_ORIG, CRIT_GER, CRIT_CABE, REF_BUSCA, REF_AG, REF_FAM, REF_FROTA, REF_PROP, GR_INICIO, GR_FIM, GR_EMPRESA, GR_ESP, GR_AG, GR_COMP, GR_FROTA, GR_PROP, GR_REFORMA, PERIODO_SEL, MESES_SEL, REAL, ACOMP_MES, FROTA_ABERTO, FITO_ABERTO, PLANO_ABERTO, INS_FICHA, DIM_DET, APOIO_DET, APOIO_FIXO, TRAT_NOME, TRAT_OBS, TRAT_ETAPA, TRAT_DEL, TRAT_ATIVO, DIESEL_MES, ARREND, ARR_PAR, ARR_RAT, FORN, FORN_PAR,
  TPESS, FAT, MO_APOIO, QF_MES, QF_GRUPO, QUADRO, ADM, ADM_RAT, ENC, BEN, EDITADO, FUN_SEL, CAT_SEL, TRAT_SEL, ATIV_TRAT_SEL, GRUPOS_INS, FAM_NOME, FAM_CLASSE, AGROFIT_BUSCA, INS_EDIT,
};

export const setP          = v => { P = v; };
export const setPLANO      = v => { PLANO = v; };
export const setDIM        = v => { DIM = v; };
export const setINSUMO     = v => { INSUMO = v; };
export const setESPOR      = v => { ESPOR = v; };
export const setTRATC      = v => { TRATC = v; };
export const setNIV        = v => { NIV = v; };
export const setGRAT       = v => { GRAT = v; };
export const setAPOIO      = v => { APOIO = v; };
export const setTERC_TAR   = v => { TERC_TAR = v; };
export const setTERC_SUB   = v => { TERC_SUB = v; };
export const setTERC_DET   = v => { TERC_DET = v; };
export const setCRM        = v => { CRM = v; };
export const setMATX       = v => { MATX = v; };
export const setINSX       = v => { INSX = v; };
export const setINSX_V     = v => { INSX_V = +v || 0; };
export const setATVX       = v => { ATVX = v; };
export const setATVX_V     = v => { ATVX_V = +v || 0; };
export const setFROTA      = v => { FROTA = v; };
export const setCRM_ESP    = v => { CRM_ESP = v; };
export const setMAQ        = v => { MAQ = v; };
export const setFROTA_ORIG = v => { FROTA_ORIG = v; };
export const setCRIT_GER   = v => { CRIT_GER = v; };
export const setREF_BUSCA  = v => { REF_BUSCA = v; };
export const setREF_AG     = v => { REF_AG = v; };
export const setREF_FAM    = v => { REF_FAM = v; };
export const setREF_FROTA  = v => { REF_FROTA = v; };
export const setREF_PROP   = v => { REF_PROP = v; };
export const setGR_INICIO  = v => { GR_INICIO = v; };
export const setGR_FIM     = v => { GR_FIM = v; };
export const setGR_EMPRESA = v => { GR_EMPRESA = v; };
export const setGR_ESP     = v => { GR_ESP = v; };
export const setGR_AG      = v => { GR_AG = v; };
export const setGR_COMP    = v => { GR_COMP = v; };
export const setGR_FROTA   = v => { GR_FROTA = v; };
export const setGR_PROP    = v => { GR_PROP = v; };
export const setGR_REFORMA = v => { GR_REFORMA = v; };
export const setCRIT_CABE  = v => { CRIT_CABE = v; };
export const setFROTA_ABERTO = v => { FROTA_ABERTO = v; };
export const setINS_FICHA    = v => { INS_FICHA = v; };
export const setDIM_DET      = v => { DIM_DET = v; };
export const setAPOIO_DET    = v => { APOIO_DET = v; };
export const setINS_EDIT     = v => { INS_EDIT = v; };
export const setPERIODO_SEL  = v => { PERIODO_SEL = v; };
export const setMESES_SEL    = v => { MESES_SEL = v; };
export const setREAL         = v => { REAL = v; };
export const setACOMP_MES    = v => { ACOMP_MES = v; };
export const setFROTA_UN   = v => { FROTA_UN = v; };
export const setFROTA_DEST = v => { FROTA_DEST = v; };
export const setAPOIO_FIXO = v => { APOIO_FIXO = v; };
export const setTRAT_NOME  = v => { TRAT_NOME = v; };
export const setTRAT_OBS   = v => { TRAT_OBS = v; };
export const setTRAT_ETAPA = v => { TRAT_ETAPA = v; };
export const setTRAT_DEL   = v => { TRAT_DEL = v; };
export const setTRAT_ATIVO = v => { TRAT_ATIVO = v; };
export const setDIESEL_MES = v => { DIESEL_MES = v; };
export const setARREND     = v => { ARREND = v; };
export const setARR_PAR    = v => { ARR_PAR = v; };
export const setARR_RAT    = v => { ARR_RAT = v; };
export const setFORN       = v => { FORN = v; };
export const setFORN_PAR   = v => { FORN_PAR = v; };
export const setTPESS      = v => { TPESS = v; };
export const setFAT        = v => { FAT = Array.isArray(v) ? v : []; };
export const setMO_APOIO   = v => { MO_APOIO = Array.isArray(v) ? v : []; };
export const setQF_MES     = v => { QF_MES = v==="media" ? v : +v; };
export const setQF_GRUPO   = v => { QF_GRUPO = v || "todos"; };
export const setQUADRO     = v => { QUADRO = v; };
export const setGRUPOS_INS = v => { GRUPOS_INS = v; };
export const setFAM_NOME   = v => { FAM_NOME = v; };
export const setFAM_CLASSE = v => { FAM_CLASSE = v; };
export const setADM        = v => { ADM = v; };
export const setADM_RAT    = v => { ADM_RAT = v; };
export const setENC        = v => { ENC = v; };
export const setBEN        = v => { BEN = v; };
export const setEDITADO    = v => { EDITADO = v; };
export const setFUN_SEL    = v => { FUN_SEL = v; };
export const setCAT_SEL    = v => { CAT_SEL = v; };
export const setTRAT_SEL   = v => { TRAT_SEL = v; };
export const setATIV_TRAT_SEL = v => { ATIV_TRAT_SEL = v; };
export const setAGROFIT_BUSCA = v => { AGROFIT_BUSCA = v; };

/* ---------------------------------------------------------------------------
   Listas de carga preguicosa: so materializam a copia do cadastro padrao
   quando alguem pede. Ficam aqui, e nao no modulo de calculo, porque atribuem
   a variavel de estado — o que so o modulo dono do binding pode fazer.
   --------------------------------------------------------------------------- */

export function insLista(){ if(!INSX) INSX = CFG.insumos.map(i=>({...i})); return INSX; }

export function atividadesLista(){ if(!ATVX) ATVX = CFG.atividades.map(a=>({...a})); return ATVX; }

export function apoioLista(){ if(!APOIO) APOIO = CFG.apoio_eq.map(a=>({...a})); return APOIO; }

export function matLista(){ if(!MATX) MATX = CFG.materiais.map(m=>({...m})); return MATX; }

export function tpessLista(){
  if(!TPESS) TPESS = CFG.tpess.map(t=>({...t}));
  return TPESS;
}

export function arrLista(){
  // primeira abertura: herda a área e o valor que estavam nas Premissas, para o custo não mudar sozinho
  if(!ARREND) ARREND = [{faz:"Arrendamentos gerais", grupo:"Geral", area:P.arr_ha||0, forma:"rsha",
                         qtd:P.arr||0, pag:"Anual", mes:0}];
  // o pagamento em sacas de soja deixou de existir: converte para R$/ha pelo mesmo valor, sem mudar o custo
  ARREND.forEach(a=>{ if(a.forma==="soja"){
    a.qtd = num(a.qtd)*num(ARR_PAR.precoSoja!=null ? ARR_PAR.precoSoja : 120); a.forma = "rsha"; } });
  return ARREND;
}

export function fornLista(){ if(!FORN) FORN = []; return FORN; }

export function gruposInsLista(){ if(!GRUPOS_INS) GRUPOS_INS = []; return GRUPOS_INS; }

export function admLista(){
  // primeiro uso: herda o valor global de administracao das Premissas, para o
  // custo do plano nao mudar sozinho quando o modulo entra
  if(!ADM){
    ADM = ADM_PADRAO.map(l=>({...l}));
    if(ADM[0]) ADM[0].valor = num(P.adm)||0;
  }
  return ADM;
}

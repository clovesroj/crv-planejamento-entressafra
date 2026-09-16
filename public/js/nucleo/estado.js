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
import { num } from './formato.js';

let P = {...PADRAO};
let PLANO = {};          // cod -> {m:[9], trat:""}
let DIM   = {};          // cod -> {rend, util}
let INSUMO = {};         // produto -> {preco, est}
let ESPOR = [];          // [{mes, desc, cc, valor, status}]
let TRATC = {};          // cod -> [{prod,dose,un}]  composição customizada (sobrepõe a base)
let NIV  = {};           // fcod -> [{sal,qtd} x5]  níveis salariais (I..V)
let GRAT = {};           // fcod -> {tipo:'R$'|'%', valor}
let APOIO = null;        // [{nome,maq,qtd,hmes,fcod,fniv}] equipamentos de apoio
let TERC_TAR = {};       // cod da atividade -> tarifa de terceirização (R$/ha)
let CRM = {};            // item -> {pecas,terc,consumo,lubrif} ajustados
let MATX = null;         // materiais de manutenção (lista editável)
let INSX = null;         // cadastro de insumos (lista editável: incluir/alterar/remover)
let FROTA = {};          // item -> {qtd, hmes} frota prevista para manutenção
let APOIO_FIXO = {};     // nome do item -> qtd ajustada (frota de apoio de utilização fixa)
let TRAT_NOME = {};      // cod do tratamento -> nome descritivo editável
let DIESEL_MES = {};     // índice do mês -> preço projetado do diesel (R$/L); vazio = preço base
let ARREND = null;       // [{faz, grupo, area, forma, qtd, pag, mes}] fazendas ou grupos arrendados
let ARR_PAR = {};        // parâmetros de pagamento do arrendamento (ATR, preços, critério)
let ARR_RAT = {};        // etapa -> % do arrendamento (referência PECEGE/USP)
let TPESS = null;        // rotas de transporte de pessoal (lista editável)
let ENC = {};            // índice do encargo -> % ajustado
let BEN = {};            // índice do benefício -> valor ajustado
let EDITADO = false;     // true assim que o usuário mexe em algo — trava o carregamento
                          // assíncrono do servidor para não sobrescrever uma edição em andamento

/* Selecao corrente da interface. Nao entra na gravacao: e so onde o usuario
   esta olhando, e por isso nao aparece em estado(). */
let FUN_SEL = null;
let CAT_SEL = null;
let TRAT_SEL = null;

export {
  P, PLANO, DIM, INSUMO, ESPOR, TRATC, NIV, GRAT, APOIO, TERC_TAR, CRM, MATX,
  INSX, FROTA, APOIO_FIXO, TRAT_NOME, DIESEL_MES, ARREND, ARR_PAR, ARR_RAT,
  TPESS, ENC, BEN, EDITADO, FUN_SEL, CAT_SEL, TRAT_SEL,
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
export const setCRM        = v => { CRM = v; };
export const setMATX       = v => { MATX = v; };
export const setINSX       = v => { INSX = v; };
export const setFROTA      = v => { FROTA = v; };
export const setAPOIO_FIXO = v => { APOIO_FIXO = v; };
export const setTRAT_NOME  = v => { TRAT_NOME = v; };
export const setDIESEL_MES = v => { DIESEL_MES = v; };
export const setARREND     = v => { ARREND = v; };
export const setARR_PAR    = v => { ARR_PAR = v; };
export const setARR_RAT    = v => { ARR_RAT = v; };
export const setTPESS      = v => { TPESS = v; };
export const setENC        = v => { ENC = v; };
export const setBEN        = v => { BEN = v; };
export const setEDITADO    = v => { EDITADO = v; };
export const setFUN_SEL    = v => { FUN_SEL = v; };
export const setCAT_SEL    = v => { CAT_SEL = v; };
export const setTRAT_SEL   = v => { TRAT_SEL = v; };

/* ---------------------------------------------------------------------------
   Listas de carga preguicosa: so materializam a copia do cadastro padrao
   quando alguem pede. Ficam aqui, e nao no modulo de calculo, porque atribuem
   a variavel de estado — o que so o modulo dono do binding pode fazer.
   --------------------------------------------------------------------------- */

export function insLista(){ if(!INSX) INSX = CFG.insumos.map(i=>({...i})); return INSX; }

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

/**
 * Código de EXIBIÇÃO da atividade — camada de apresentação só, não dado.
 *
 * O código interno (A03, TR1, AD1...) continua sendo a chave de tudo: PLANO,
 * DIM, ATVX, data-* de todo controle, chave de rastro ("ativ:A03"), o "cod" do
 * ERP-catálogo (dados/atividades-erp.js). Nada disso muda — mudar a chave
 * exigiria migrar o documento salvo em produção (invariante nº5 do CLAUDE.md)
 * e quebraria todo v vínculo (tratamento, terceiro, realizado) já lançado.
 *
 * O que muda é só o texto que a pessoa lê: PS03 no lugar de A03, numeração
 * sequencial por grupo, na ordem do cadastro (a ordem de atividadesLista()).
 * Broca e Cigarrinha (A44-A53) formam o grupo "MF" à parte, porque já
 * aparecem separados do resto de Tratos Culturais no Plano Operacional e no
 * Manejo Fitossanitário — numerar junto com TC escondia essa separação.
 *
 * Quem usa: toda tela que mostra o código da atividade como texto (Plano
 * Operacional, Dimensionamento, Manejo Fitossanitário, Cadastro de
 * Atividades, Validação, Acompanhamento, relatórios, rastro). NUNCA usar isto
 * em atributo que serve de chave (data-c, data-t, data-r, "ativ:"+cod...) —
 * só em texto que a pessoa lê.
 */
import { atividadesLista } from './estado.js';

const SIGLA_ETAPA = {
  "COLHEITA": "CO",
  "PLANTIO": "PL",
  "PREPARO DE SOLO": "PS",
  "TRATOS CULTURAIS": "TC",
  "APOIO E CONSERVAÇÃO": "AC",
};
// mesmo grupo que a tela já separa do resto dos tratos culturais — ver
// COD_FITOSSANITARIO em ui/plano.js (não importa de lá para não criar
// dependência de ui/ dentro de nucleo/: a lista é curta e estável).
const COD_FITOSSANITARIO = new Set(["A44","A45","A46","A47","A48","A49","A50","A51","A52","A53"]);
const siglaDe = a => COD_FITOSSANITARIO.has(a.cod) ? "MF" : (SIGLA_ETAPA[a.etapa] || "??");

/** {codigoInterno -> codigoDeExibicao}, numerado na ordem do cadastro. */
function mapaCodigos(){
  const contagem = {}, m = {};
  atividadesLista().forEach(a=>{
    const sigla = siglaDe(a);
    contagem[sigla] = (contagem[sigla]||0) + 1;
    m[a.cod] = sigla + String(contagem[sigla]).padStart(2,"0");
  });
  return m;
}
/** Código de exibição de UM código interno. Para uma tabela inteira, prefira
    mapaCodigos() uma vez e indexar nela — mais barato que recalcular a cada célula. */
function codExibir(cod){ return mapaCodigos()[cod] || cod; }

export { codExibir, mapaCodigos };

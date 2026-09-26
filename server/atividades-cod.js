'use strict';
/**
 * Migração do código interno da atividade (A01/TR1/AD1... -> CO01/PL01/TC01...)
 * do lado do servidor. Mesmo problema do 9->12 meses (ver server/janela.js):
 * quem migra é o navegador, ao abrir o plano (renomearAtividades, dentro de
 * mesclarBaseAtividades em public/js/calculo/atividade.js), mas a renomeação
 * mexe em ATVX (aba Cadastro de Atividades) e também em PLANO, DIM, TERC_TAR,
 * TERC_SUB e REAL — abas diferentes, cada uma com seu próprio dono em
 * server/permissoes.js. Se o primeiro a salvar depois do deploy for um
 * perfil que não edita todas elas, o patch dele não carrega as chaves que
 * faltam, e o documento fica migrado pela metade.
 *
 * Aqui o servidor completa, na primeira gravação que chega já na versão
 * nova, a migração das chaves que o perfil não grava — com a mesma regra do
 * navegador. Mudou o de-para lá (RENOMEACOES_ATIVIDADE em
 * public/js/dados/atividades.js), mude aqui também.
 */

const NOVA_VERSAO = 8;

// mesmo de-para de public/js/dados/atividades.js (RENOMEACOES_ATIVIDADE) —
// o servidor não importa módulo ES de public/, por isso a cópia.
const RENOMEACOES = {
  A01:'CO01', A02:'PL01', TR1:'CO02', TR2:'PL02', TR3:'CO03', TR4:'PL03', A03:'PS01',
  A04:'PS02', A05:'PS03', A06:'PS04', A07:'PS05', A08:'PS06', A09:'PS07', A10:'PL04',
  A39:'PL05', A11:'TC01', A12:'TC02', A13:'TC03', A14:'TC04', A15:'TC05', A16:'TC06',
  A17:'TC07', A18:'TC08', A19:'PL06', A20:'TC09', A21:'TC10', A23:'TC11', A24:'TC12',
  A25:'TC13', A26:'TC14', A27:'TC15', A28:'TC16', A37:'TC17', A38:'TC18', A30:'TC19',
  A31:'TC20', A32:'TC21', A33:'TC22', A34:'TC23', A35:'TC24', A36:'TC25', AD1:'TC26',
  AD2:'TC27', A29:'AC01', AP1:'AC02', AP2:'AC03', A40:'TC28', A41:'TC29', A42:'TC30',
  A43:'TC31', A44:'MF01', A45:'MF02', A46:'MF03', A47:'MF04', A48:'MF05', A49:'MF06',
  A50:'MF07', A51:'MF08', A52:'MF09', A53:'MF10', A54:'PS08', A55:'PS09', A56:'PL07',
  A57:'PL08', A58:'PL09', A59:'TC32', A60:'TC33', A61:'TC34', A62:'TC35', A63:'AC04',
};

// chaves do documento que dependem do codigo da atividade (mesmo conjunto
// que removerAtividadesRetiradas(), em calculo/atividade.js, ja usa)
const CHAVES = ['ATVX', 'ATVX_V', 'PLANO', 'DIM', 'TERC_TAR', 'TERC_SUB', 'REAL'];

/** true se o documento ainda tem alguma atividade com codigo do formato antigo. */
function versaoAntiga(doc) {
  const v = doc && doc.ATVX_V;
  if (v != null) return v < NOVA_VERSAO;
  // documento sem ATVX_V (nunca abriu com o navegador desde sempre): decide
  // pelo formato de ATVX, igual ao teste de forma que janela.js faz pra PLANO.
  const atvx = (doc && doc.ATVX) || [];
  return atvx.some(a => a && RENOMEACOES[a.cod]);
}

/** Cópia do documento com ATVX, PLANO, DIM, TERC_TAR, TERC_SUB e REAL
    renomeados para o código novo. */
function migrar(doc) {
  const d = JSON.parse(JSON.stringify(doc || {}));
  (d.ATVX || []).forEach(a => {
    if (!a) return;
    const novo = RENOMEACOES[a.cod];
    if (novo) a.cod = novo;
  });
  (d.ATVX || []).forEach(a => {
    if (!a) return;
    if (a.src && RENOMEACOES[a.src]) a.src = RENOMEACOES[a.src];
    if (a.junto && RENOMEACOES[a.junto]) a.junto = RENOMEACOES[a.junto];
  });
  ['PLANO', 'DIM', 'TERC_TAR', 'TERC_SUB', 'REAL'].forEach(chave => {
    if (!d[chave]) return;
    const novo = {};
    Object.entries(d[chave]).forEach(([cod, v]) => { novo[RENOMEACOES[cod] || cod] = v; });
    d[chave] = novo;
  });
  d.ATVX_V = NOVA_VERSAO;
  return d;
}

module.exports = { CHAVES, versaoAntiga, migrar };

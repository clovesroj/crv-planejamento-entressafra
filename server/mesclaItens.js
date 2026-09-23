'use strict';
/**
 * Merge por item para os cadastros que o navegador não manda mais inteiros —
 * Insumos, Atividades e Tratamentos (ver ui/insumos.js e ui/atividades-cad.js).
 * Em vez do array/objeto inteiro, essas telas mandam só o que mudou nesta
 * sessão (chave "_PATCH": {upsert, remover}); aqui isso vira o valor real da
 * chave do documento (INSX, ATVX, TRAT_NOME...), mesclado item a item contra
 * o que JÁ ESTÁ GRAVADO — não contra o que a aba tinha na memória.
 *
 * É o que fecha a lacuna que o merge raso (`||` do jsonb, só no primeiro
 * nível) deixava: duas pessoas editando produtos diferentes do mesmo cadastro
 * ao mesmo tempo não apagam uma a outra, porque cada uma só entra com o item
 * dela — o resto do array/objeto vem de quem está gravado agora, lido com a
 * linha travada (ver mesclarItens() em store/postgres.js e store/arquivo.js).
 */

/** Array mesclado por chave (prod, cod...): upsert substitui pela posição (ou insere, sem chave de match); remover tira pela chave. */
function mesclarArray(atualArr, patch, idCampo) {
  const arr = Array.isArray(atualArr) ? atualArr.map(x => ({ ...x })) : [];
  (patch.remover || []).forEach(chave => {
    const ix = arr.findIndex(x => x && x[idCampo] === chave);
    if (ix >= 0) arr.splice(ix, 1);
  });
  (patch.upsert || []).forEach(({ chave, item }) => {
    const ix = chave == null ? -1 : arr.findIndex(x => x && x[idCampo] === chave);
    if (ix >= 0) arr[ix] = item; else arr.push(item);
  });
  return arr;
}

// Tratamentos: um patch só (por código ORIGINAL), desmembrado nas quatro
// chaves do documento que "Cadastro dos tratamentos" edita. TRATC (composição)
// não entra aqui de propósito — continua no caminho antigo (ver ui/insumos.js).
// `v.novoCod` só existe quando o código foi renomeado nesta sessão: tira as
// quatro entradas do código original e escreve as quatro sob o novo, no mesmo
// lançamento — sem isso, um rename salvaria code novo com code velho ainda
// pendurado, ou vice-versa, dependendo da ordem de chegada.
function mesclarTratamentos(atual, patch) {
  const nome = { ...(atual.TRAT_NOME || {}) }, obs = { ...(atual.TRAT_OBS || {}) },
    etapa = { ...(atual.TRAT_ETAPA || {}) }, ativo = { ...(atual.TRAT_ATIVO || {}) };
  (patch.remover || []).forEach(cod => { delete nome[cod]; delete obs[cod]; delete etapa[cod]; delete ativo[cod]; });
  Object.entries(patch.upsert || {}).forEach(([origCod, v]) => {
    const destino = v.novoCod || origCod;
    if (destino !== origCod) { delete nome[origCod]; delete obs[origCod]; delete etapa[origCod]; delete ativo[origCod]; }
    if (v.nome) nome[destino] = v.nome; else delete nome[destino];
    if (v.obs) obs[destino] = v.obs; else delete obs[destino];
    if (v.etapa && v.etapa.length) etapa[destino] = v.etapa; else delete etapa[destino];
    if (v.ativo === false) ativo[destino] = false; else delete ativo[destino];
  });
  return { TRAT_NOME: nome, TRAT_OBS: obs, TRAT_ETAPA: etapa, TRAT_ATIVO: ativo };
}

// Sobreposição de preço/estoque (INSUMO[prod], separada do próprio item de
// INSX — ver calculo/insumos.js): mesmo objeto-por-chave-renomeável dos
// tratamentos, só que com um overlay só em vez de quatro chaves.
function mesclarObjetoRenomeavel(atual, patch, campoNovaChave) {
  const obj = { ...(atual || {}) };
  (patch.remover || []).forEach(chave => { delete obj[chave]; });
  Object.entries(patch.upsert || {}).forEach(([origChave, v]) => {
    const destino = v[campoNovaChave] || origChave;
    if (destino !== origChave) delete obj[origChave];
    if (v.overlay) obj[destino] = v.overlay; else delete obj[destino];
  });
  return obj;
}

const PATCHES_ARRAY = { INSX_PATCH: { chave: 'INSX', id: 'prod' }, ATVX_PATCH: { chave: 'ATVX', id: 'cod' } };

/** true se o corpo tem algum patch de item — só aí vale travar a linha pra mesclar. */
function temPatch(corpo) {
  return !!(corpo.INSX_PATCH || corpo.ATVX_PATCH || corpo.TRAT_PATCH || corpo.INSUMO_PATCH);
}

/** Corpo com os "_PATCH" trocados pelo valor real da chave, já mesclado com o que está gravado. */
function aplicarPatches(corpo, atual) {
  const efetivo = { ...corpo };
  for (const [chaveCorpo, cfg] of Object.entries(PATCHES_ARRAY)) {
    if (!efetivo[chaveCorpo]) continue;
    efetivo[cfg.chave] = mesclarArray((atual || {})[cfg.chave], efetivo[chaveCorpo], cfg.id);
    delete efetivo[chaveCorpo];
  }
  if (efetivo.TRAT_PATCH) {
    Object.assign(efetivo, mesclarTratamentos(atual || {}, efetivo.TRAT_PATCH));
    delete efetivo.TRAT_PATCH;
  }
  if (efetivo.INSUMO_PATCH) {
    efetivo.INSUMO = mesclarObjetoRenomeavel((atual || {}).INSUMO, efetivo.INSUMO_PATCH, 'novoProd');
    delete efetivo.INSUMO_PATCH;
  }
  return efetivo;
}

module.exports = { temPatch, aplicarPatches, mesclarArray, mesclarTratamentos, mesclarObjetoRenomeavel };

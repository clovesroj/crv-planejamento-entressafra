/**
 * Cadastro de Materiais — o fetch da nossa própria API (server/api.js, /api/materiais).
 * O catálogo tem mais de 120 mil itens e fica no servidor: a tela nunca o carrega
 * inteiro, só busca por código ou nome e mostra os primeiros resultados.
 */

async function pedir(url, opcoes) {
  const r = await fetch(url, opcoes);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro || `o servidor respondeu ${r.status}`);
  return d;
}

/** {total, itens}: cada palavra de `q` tem de aparecer no código ou na descrição. */
function buscarMateriais(q, limite = 30, sinal) {
  return pedir('/api/materiais?' + new URLSearchParams({ q: q || '', limite: String(limite) }), { signal: sinal });
}
/** {total, ultima}: quantos materiais há e quando entrou o último lote. */
const resumoMateriais = () => pedir('/api/materiais/resumo');
/** Códigos já cadastrados — o importador só envia o que falta. */
const codigosMateriais = async () => (await pedir('/api/materiais/codigos')).codigos;
/** {recebidos, validos, novos, existentes}: o servidor só grava o código que ainda não existe. */
const importarLoteMateriais = itens => pedir('/api/materiais/importar', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itens }),
});

export { buscarMateriais, resumoMateriais, codigosMateriais, importarLoteMateriais };

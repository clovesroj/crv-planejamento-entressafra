/**
 * Busca de candidatos na AGROFIT (Embrapa) para linkar a bula de um insumo.
 * O servidor guarda a credencial e faz a chamada de verdade (server/agrofit.js);
 * aqui é só o fetch da nossa própria API, igual io/persistencia.js faz com o plano.
 */
async function buscarAgrofit({ marca, titular }){
  const qs = new URLSearchParams();
  if(marca) qs.set("marca", marca);
  if(titular) qs.set("titular", titular);
  const r = await fetch("/api/agrofit/produtos-formulados?"+qs);
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.erro || "não foi possível buscar no Agrofit agora");
  return d.produtos || [];
}

/* A data vem como "DD/MM/AAAA HH:mm:ss" — string não ordena certo, então vira
   Date pra achar a bula mais recente quando o produto tem mais de uma versão. */
function dataDoDocumento(doc){
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(doc.data_inclusao || "");
  return m ? new Date(+m[3], +m[2]-1, +m[1]) : new Date(0);
}
/** A bula mais recente de um produto formulado da AGROFIT, ou null se não tiver. */
function bulaDoProduto(produto){
  const docs = (produto.documento_cadastrado || []).filter(d => d.tipo_documento === "Bula");
  if(!docs.length) return null;
  return docs.sort((a,b)=>dataDoDocumento(b)-dataDoDocumento(a))[0];
}

export { buscarAgrofit, bulaDoProduto };

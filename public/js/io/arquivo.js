/* Recursos do Artifact da Claude (banco, downloads). Fora dele a variável
   `claude` nem existe — o typeof evita o ReferenceError e o app segue no
   caminho de servidor próprio ou de navegador. */
async function claudeUse(nome){
  try{ return typeof claude !== "undefined" && claude ? await claude.use(nome) : null; }
  catch(e){ return null; }
}

/* Salvar arquivo no disco do usuário. Dentro do Artifact só o canal de
   downloads da Claude atravessa o sandbox; hospedado em servidor próprio, o
   link comum do navegador resolve. */
async function baixar(dados, nome, tipo){
  const blob = dados instanceof Blob ? dados : new Blob([dados],{type:tipo||"application/octet-stream"});
  const dl = await claudeUse("downloads");
  if(dl){
    try{ await dl.save({filename:nome, data:dados}); return; }
    catch(e){}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}


export { baixar, claudeUse };

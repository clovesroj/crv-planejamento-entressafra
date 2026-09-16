import { LOGO } from '../dados/logo.js';


/* Logo em duas versões, conforme o fundo:
   azul (original, com fundo branco) — fundos claros, como o relatório impresso;
   branca (gerada do original)       — fundos escuros: menu lateral e capa.
   A versão branca troca o fundo branco por transparência e o azul por branco,
   preservando a suavização das bordas. Se o canvas falhar, fica o azul com a moldura clara. */
function logoBranco(src){
  return new Promise(ok=>{
    const img = new Image();
    img.onload = ()=>{
      try{
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const x = c.getContext("2d"); x.drawImage(img,0,0);
        const d = x.getImageData(0,0,c.width,c.height), p = d.data;
        for(let i=0;i<p.length;i+=4){
          // quanto mais distante do branco, mais opaco
          const a = Math.min(255, (255-Math.min(p[i],p[i+1],p[i+2]))*1.25);
          p[i]=p[i+1]=p[i+2]=255; p[i+3]=Math.round(a*p[i+3]/255);
        }
        x.putImageData(d,0,0); ok(c.toDataURL("image/png"));
      }catch(e){ ok(null); }
    };
    img.onerror = ()=>ok(null);
    img.src = src;
  });
}
["logo","herologo","login_logo"].forEach(id=>{ document.getElementById(id).src=LOGO; });
logoBranco(LOGO).then(branco=>{
  if(!branco) return;
  ["logo","herologo","login_logo"].forEach(id=>{ const el=document.getElementById(id); el.src=branco; el.dataset.variante="branco"; });
});

export { logoBranco };

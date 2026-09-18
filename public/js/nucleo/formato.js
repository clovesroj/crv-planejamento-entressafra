const $ = s => document.querySelector(s);
const fmt = (n,d=0) => (isFinite(n)?n:0).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const brl = (n,d=0) => "R$ " + fmt(n,d);
const num = v => { const x = parseFloat(String(v).replace(",",".")); return isFinite(x)?x:0; };
const pct = n => fmt(n*100,1)+"%";

/* Escapa texto para dentro de HTML (conteúdo ou atributo entre aspas duplas).
   Todo texto que o usuário digita — nome de insumo, rota, equipamento, nome de
   tratamento — precisa passar por aqui antes de entrar num template de innerHTML:
   uma aspa fechava o value="..." antes da hora e a próxima edição gravava o nome
   cortado; um < virava marcação. Era copiado em cinco telas, uma delas sem tratar
   a aspa; agora é um só. */
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
// Link externo (bula da Agrofit) só se for http(s). esc() segura a aspa, mas um
// "javascript:" gravado no documento passaria inteiro para o href.
const urlWeb = u => { const s = String(u==null?"":u).trim(); return /^https?:\/\//i.test(s) ? s : ""; };


export { $, brl, esc, fmt, num, pct, urlWeb };

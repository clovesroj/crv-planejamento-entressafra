const $ = s => document.querySelector(s);
const fmt = (n,d=0) => (isFinite(n)?n:0).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const brl = (n,d=0) => "R$ " + fmt(n,d);
const num = v => { const x = parseFloat(String(v).replace(",",".")); return isFinite(x)?x:0; };
const pct = n => fmt(n*100,1)+"%";


export { $, brl, fmt, num, pct };

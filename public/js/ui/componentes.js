import { brl, fmt } from '../nucleo/formato.js';

// `ra` opcional: a chave do rastro. Com ela o card vira botão e abre a
// explicação daquele custo — é por onde se entra na composição.
const kpi=(l,c,v,s,ra)=>`<div class="kpi ${c}"${ra?` data-rastro="${ra}" tabindex="0" role="button" title="Ver como este número é composto"`:""}><div class="l">${l}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:""}</div>`;
// [rotulo, alinhaDireita, classeExtra] — a classe extra serve, por exemplo, para marcar o periodo do mes
const th=a=>`<thead><tr>${a.map(x=>{
  const c=[x[1]?"num":"", x[2]||""].filter(Boolean).join(" ");
  return `<th${c?` class="${c}"`:""}>${x[0]}</th>`;
}).join("")}</tr></thead>`;

/* ---------- GRÁFICOS ---------- */
function barras(el,dados,cor,un){
  const W=760,H=210,ml=64,mb=34,mt=12,mr=10;
  const max=Math.max(...dados.map(d=>d.v),1), bw=(W-ml-mr)/dados.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  for(let i=0;i<=4;i++){const y=mt+(H-mt-mb)*i/4,v=max*(1-i/4);
    s+=`<line x1="${ml}" y1="${y}" x2="${W-mr}" y2="${y}" stroke="var(--line)"/>
        <text x="${ml-7}" y="${y+4}" text-anchor="end" font-size="9.5" fill="var(--grey)">${fmt(v/1000)}k</text>`;}
  dados.forEach((d,i)=>{const hh=(H-mt-mb)*(d.v/max),x=ml+i*bw+bw*.18,y=H-mb-hh;
    const ly=Math.max(y-5,mt+9);
    s+=`<rect x="${x}" y="${y}" width="${bw*.64}" height="${Math.max(hh,0)}" fill="${cor}" rx="2"><title>${d.l}: ${un?fmt(d.v)+" "+un:brl(d.v)}</title></rect>
        <text x="${ml+i*bw+bw/2}" y="${ly}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">${d.v>0?fmt(d.v/1000,0)+"k":""}</text>
        <text x="${ml+i*bw+bw/2}" y="${H-mb+14}" text-anchor="middle" font-size="9.5" fill="var(--grey)">${d.l}</text>`;});
  el.innerHTML=s+`</svg>`;
}
function barrasH(el,dados){
  // paleta do campo: folha, palha, céu, latossolo e tons intermediários
  const cores=["#2D6A3A","#C9A45C","#3E7CB1","#A5503A","#7E9C6B","#5C6F7B","#8A8F3C","#2F8C83","#B98A3E","#6B8FB5","#9C6B4E","#A3AE9C"];
  const tot=dados.reduce((s,d)=>s+d.v,0)||1, W=760,rh=24,H=dados.length*rh+10,ml=185;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  dados.forEach((d,i)=>{const y=i*rh+5,w=(W-ml-105)*(d.v/tot);
    s+=`<text x="${ml-8}" y="${y+13}" text-anchor="end" font-size="10.5" fill="var(--ink)">${d.l}</text>
        <rect x="${ml}" y="${y+2}" width="${Math.max(w,1)}" height="14" fill="${cores[i%12]}" rx="3"><title>${brl(d.v)}</title></rect>
        <text x="${ml+w+7}" y="${y+14}" font-size="10" fill="var(--grey)">${fmt(d.v/tot*100,1)}%</text>`;});
  el.innerHTML=s+`</svg>`;
}


export { barras, barrasH, kpi, th };

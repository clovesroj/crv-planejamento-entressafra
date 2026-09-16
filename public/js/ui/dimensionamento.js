import { FROTA_ESP, SEP_MOD, chaveDoModelo, destinoDe, espDe, modDe, opcoesDestino,
         unidadesDoModelo } from '../calculo/crm.js';
import { FROTA_ABERTO } from '../nucleo/estado.js';
import { $, brl, fmt, pct } from '../nucleo/formato.js';
import { kpi, th } from './componentes.js';

/* ---------- DIMENSIONAMENTO ---------- */
function pintarDim(R){
  $("#k_dim").innerHTML =
    kpi("Horas-máquina","",fmt(R.horasT)) +
    kpi("Frota operacional","t",fmt(R.frotaT)+" un") +
    kpi("Frota de apoio","g",fmt(Math.ceil(R.AP.total))+" un") +
    kpi("Transbordos","a",fmt(R.TR.frota)+" un");

  $("#t_dim").innerHTML = th([["Cod"],["Atividade / frente"],["Modo"],["Área/Volume",1],["Rend. (un/h)",1],["Utiliz.",1],
    ["Horas",1],["Frota",1],["Efetivo",1],["Função"],["Máquina"],["Implemento"]])+"<tbody>"+
    R.L.map(r=>{
      const multi = r.partes.length>1;
      const un = r.a.un.split("/")[0];
      let h = `<tr><td>${r.a.cod}</td><td>${r.a.nome}</td>
        <td class="calc">${multi?`<span class="badge b-warn">${r.partes.length} frentes</span>`:(r.a.modoOn?"padrão":"—")}</td>
        <td class="num calc">${fmt(r.total)} <span style="font-size:10px">${un}</span></td>
        <td class="num">${multi?`<span class="calc">${fmt(r.rend,2)} ${un}/h</span>`
          :`<input data-r="${r.a.cod}" value="${r.rend}" inputmode="decimal"><span class="calc" style="font-size:9.5px;margin-left:3px">${un}/h</span>`}</td>
        <td class="num"><input data-u="${r.a.cod}" value="${Math.round(r.util*100)}" inputmode="decimal"></td>
        <td class="num calc">${fmt(r.horas)}</td><td class="num tot">${r.frotaR||"—"}</td>
        <td class="num calc">${r.efetivo||"—"}</td><td class="calc">${r.fcod}</td>
        <td class="calc">${multi?"—":r.maqEfetiva}</td><td class="calc">${multi?"—":r.impEfetivo}</td></tr>`;
      if(multi) r.partes.forEach(p=>{
        h += `<tr class="sub"><td></td><td class="calc">↳ ${p.modo}</td>
          <td class="num calc">${fmt(p.pct*100,0)}%</td><td class="num calc">${fmt(p.area)} <span style="font-size:9.5px">${un}</span></td>
          <td class="num calc">${fmt(p.rend,2)} ${un}/h</td><td class="calc"></td>
          <td class="num calc">${p.terc?"—":fmt(p.horas)}</td>
          <td class="num calc">${p.terc?"—":p.frotaR}</td>
          <td class="num calc">${p.terc?"—":p.efetivo}</td>
          <td class="calc">${p.terc?'<span class="badge b-warn">terceiro</span>':p.fcod}</td>
          <td class="calc">${p.maq}</td><td class="calc">${p.imp}</td></tr>`;});
      return h;}).join("")+"</tbody>";

  const fr={};
  R.L.forEach(r=>r.partes.forEach(p=>{
    if(p.horas<=0) return;
    fr[p.maq]=fr[p.maq]||{h:0,f:0,n:0,d:0,m:0};
    fr[p.maq].h+=p.horas; fr[p.maq].f+=p.frota; fr[p.maq].n++;
    fr[p.maq].d+=p.cDiesel; fr[p.maq].m+=p.cManut;}));
  // Cada maquina do plano abre na frota real que a representa, para marcar ali
  // mesmo quem vai rodar e quem vai reformar -- e aqui que se olha o
  // dimensionamento, entao e aqui que a duvida aparece.
  const anoAtual = new Date().getFullYear();
  $("#t_frota").innerHTML = th([["Máquina"],["Frentes",1],["Horas",1],["Frota",1],["Diesel",1],["Manutenção",1]])+"<tbody>"+
    Object.entries(fr).sort((a,b)=>b[1].h-a[1].h).map(([m,d])=>{
      const chave = chaveDoModelo(m);
      const un = chave ? unidadesDoModelo(chave, true) : [];
      const k = "dim:"+m, aberto = FROTA_ABERTO[k];
      const emRef = un.filter(u=>destinoDe(u[0])==="reforma").length;
      const emSb  = un.filter(u=>destinoDe(u[0])==="standby").length;
      const linha = `<tr><td>${
          un.length?`<button class="btn xs" data-abrefrota="${k}" style="margin-right:6px;padding:1px 6px">${aberto?"−":"+"}</button>`:""
        }${m}${un.length?` <span class="calc" style="font-weight:400">· ${un.length} na frota${
          emRef?`, ${emRef} em reforma`:""}${emSb?`, ${emSb} em stand by`:""}</span>`:""}</td>
        <td class="num calc">${d.n}</td><td class="num calc">${fmt(d.h)}</td>
        <td class="num tot">${Math.ceil(d.f)}</td><td class="num calc">${brl(d.d)}</td>
        <td class="num calc">${brl(d.m)}</td></tr>`;
      if(!aberto) return linha;
      return linha+`<tr><td colspan="6" style="padding:0"><div style="padding:6px 0 10px 40px">
        <table style="width:auto;min-width:520px"><thead><tr>
          <th>Frota</th><th class="num">Ano</th><th class="num">Idade</th>
          <th>Origem</th><th>Destino na safra</th></tr></thead><tbody>${
          un.map(([cod,ano,prop])=>{ const i = ano?anoAtual-ano:null, dst = destinoDe(cod);
            return `<tr${dst==="reforma"?' style="opacity:.62"':''}><td>${cod}</td>
              <td class="num ${i!=null&&i>=15?"tot":"calc"}" style="${i!=null&&i>=15?"color:var(--amber)":""}">${ano||"—"}</td>
              <td class="num calc">${i!=null?i+" anos":"—"}</td>
              <td class="calc">${prop?"Própria":"Terceiro"}</td>
              <td><select data-undest="${cod}">${opcoesDestino(dst)}</select></td></tr>`;}).join("")
        }</tbody></table>
        <div class="hint" style="margin-top:6px">Frota cadastrada como
        <b>${espDe(m)||"—"} › ${modDe(m)||"—"}</b>. Só quem vai rodar carrega CRM: reforma vai para o
        provisionamento da aba Reforma de Frota, e stand by não gera custo nenhum.</div>
      </div></td></tr>`;
    }).join("")+"</tbody>";

  $("#t_apoio").innerHTML = th([["Veículo / Máquina"],["Qtd",1],["Utilização",1],["Disponib.",1],["Necessidade",1],["Atividade"]])+"<tbody>"+
    R.AP.linhas.map(a=>`<tr><td>${a.nome}</td><td class="num"><input data-apf="${a.nome}" value="${a.qtd}" inputmode="decimal"></td>
      <td class="num calc">${pct(a.util)}</td><td class="num calc">${pct(a.disp)}</td>
      <td class="num tot">${a.nec.toFixed(2)}</td><td class="calc">${a.ativ}</td></tr>`).join("")+
    `<tr><td class="tot">TOTAL</td><td colspan="3"></td><td class="num tot">${R.AP.total.toFixed(2)}</td><td></td></tr></tbody>`;
}


export { pintarDim };

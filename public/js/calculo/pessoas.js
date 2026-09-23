import { criterioMensal } from './atividade.js';
import { CFG } from '../dados/cfg.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { num } from '../nucleo/formato.js';
import { ETAPAS_ORD } from './arrendamento.js';

/* ================== RESUMO DE PESSOAS ================== */
const DEPTS_ORD = [...ETAPAS_ORD, "MANUTENÇÃO", "ESTRUTURA AGRÍCOLA"];
function deptIdx(d){ const i = DEPTS_ORD.indexOf(d); return i<0 ? 99 : i; }
// Reúne cada fonte de efetivo do plano numa lista única (departamento, função, pessoas e custo por mês).
// Usa os mesmos números das abas de origem, para o total conferir com a mão de obra da aba Custos.
function pessoasCalc(R){
  const MP = R.MP, itens = [];
  const nomeF = c => (MP.custoFuncao[c]||{nome:c}).nome;
  const fixo = v => Array(NM).fill(v);
  // `cod` e o codigo da atividade, quando a origem e uma atividade do plano --
  // e por ele que a necessidade de gente volta a conversar com o Plano
  // Operacional e com o Dimensionamento. Apoio, manutencao e estrutura nao tem
  // atividade, e ficam sem codigo.
  const add = (dept, fcod, origem, qtd, qtdMes, custoMes, cod) => itens.push({dept, fcod, fnome:nomeF(fcod), origem,
    cod: cod || "", qtd, qtdMes, custoMes, custo:custoMes.reduce((s,x)=>s+x,0)});

  // atividades do plano: a equipe conta nos meses com quantidade; o custo segue a quantidade do mês
  R.L.forEach(r=>{
    const tot = r.total||0; if(tot<=0) return;
    /* Equipe de cada mes na proporcao da frota DAQUELE mes. Quem ajusta a
       frota de dezembro no criterio por mes muda a equipe de dezembro, e essa
       serie e a que responde "quanta gente tenho de ter em cada mes" no
       Dimensionamento e na aba Pessoas. Sem criterio lancado, a frota do mes e
       a da atividade, o fator da 1 e a serie sai identica a de sempre.
       O custo nao passa por aqui: custoMes continua vindo do motor. */
    const C = criterioMensal(r);
    const fatorMes = i => (r.frotaR > 0 ? C[i].n / r.frotaR : 1);
    r.partes.forEach(p=>{
      if(p.terc || !(p.efetivo>0)) return;
      add(r.a.etapa, p.fcod, r.a.nome, p.efetivo,
          r.meses.map((q,i)=>num(q)>0 ? Math.ceil(p.efetivo*fatorMes(i)) : 0), (p.mdoMes||[]).slice(), r.a.cod);
    });
  });
  // reserva do transporte de cana que o efetivo total soma à parte (sem custo de MDO próprio no modelo)
  const fe = MP.fatorEscala, TR = R.TR;
  const extraTot = Math.ceil(TR.frota*fe);
  const extraCam = Math.min(extraTot, Math.ceil(((TR.camSafra.frotaR||0)+(TR.camMuda.frotaR||0))*fe));
  const ativos = cods => MESES.map((m,i)=>cods.some(c=>{ const r=R.L.find(x=>x.a.cod===c); return r && num(r.meses[i])>0; }));
  if(extraCam>0){ const at=ativos(["TR1","TR2"]);
    add("COLHEITA","902","Transporte de cana — reserva do efetivo", extraCam, at.map(b=>b?extraCam:0), fixo(0), "TR1/TR2"); }
  if(extraTot-extraCam>0){ const n=extraTot-extraCam, at=ativos(["TR3","TR4"]);
    add("COLHEITA","918","Transbordo — reserva do efetivo", n, at.map(b=>b?n:0), fixo(0), "TR3/TR4"); }
  // equipamentos de apoio: mesmo efetivo e custo em todos os meses
  R.AE.linhas.forEach(l=>{ if(l.efetivo>0)
    add("APOIO E CONSERVAÇÃO", l.fcod, l.nome, l.efetivo, fixo(l.efetivo), fixo(l.mdo/NM)); });
  // equipe de manutenção
  [["F09",R.EM.mec,"Mecânicos"],["F14",R.EM.ajud,"Ajudantes de mecânico"],["F13",R.EM.lider,"Líderes de manutenção"]]
    .forEach(([f,n,o])=>{ if(n>0) add("MANUTENÇÃO", f, o, n, fixo(n), fixo(n*(MP.custoFuncao[f]||{mensal:0}).mensal)); });
  // estrutura agrícola indireta
  CFG.indiretos.forEach(i=>{ if(i.qtd>0)
    add("ESTRUTURA AGRÍCOLA", i.fcod, i.nome, i.qtd, fixo(i.qtd), fixo(i.qtd*(MP.custoFuncao[i.fcod]||{mensal:0}).mensal)); });

  const agrupa = chave => {
    const g = {};
    itens.forEach(it=>{
      const o = g[chave(it)] = g[chave(it)] || {qtd:0, custo:0, n:0, qtdMes:fixo(0), custoMes:fixo(0)};
      o.qtd+=it.qtd; o.custo+=it.custo; o.n++;
      it.qtdMes.forEach((v,i)=>{ o.qtdMes[i]+=v; o.custoMes[i]+=it.custoMes[i]; });
    });
    Object.values(g).forEach(o=>{ o.pico=Math.max(...o.qtdMes); o.pessoasMes=o.qtdMes.reduce((s,x)=>s+x,0); });
    return g;
  };
  const qtdMes = MESES.map((m,i)=>itens.reduce((s,it)=>s+it.qtdMes[i],0));
  const custoMes = MESES.map((m,i)=>itens.reduce((s,it)=>s+it.custoMes[i],0));
  return {itens, porDept:agrupa(it=>it.dept), porFun:agrupa(it=>it.fcod), qtdMes, custoMes,
          qtd: itens.reduce((s,it)=>s+it.qtd,0), custo: custoMes.reduce((s,x)=>s+x,0),
          apoio: R.AE.efetivo};
}


/* ===== Necessidade de gente por etapa, atividade e funcao =====
   O quadro por funcao responde "quantos motoristas preciso ter"; esta lista
   responde a pergunta que vem logo depois, e que e a que monta escala:
   "em que atividade, e em que mes". A funcao aparece dentro da atividade
   porque e assim que a frente e formada -- 4 operadores de colhedora em
   outubro nao sao os mesmos 4 de dezembro se a colheita parou.

   Nao recalcula nada: agrupa os itens que pessoasCalc ja montou, que sao os
   mesmos que somam o custo de mao de obra. Por isso a soma das linhas fecha,
   mes a mes, com a necessidade total do quadro. */
function necessidadePorAtividade(PS){
  if(!PS || !PS.itens) return [];
  const g = {};
  PS.itens.forEach(it=>{
    const k = [it.dept, it.cod, it.origem, it.fcod].join("|");
    const o = g[k] = g[k] || {dept:it.dept, cod:it.cod, origem:it.origem, fcod:it.fcod, fnome:it.fnome,
                              qtd:0, qtdMes:Array(NM).fill(0), custoMes:Array(NM).fill(0)};
    o.qtd += it.qtd;
    it.qtdMes.forEach((v,i)=>{ o.qtdMes[i] += v; o.custoMes[i] += it.custoMes[i]; });
  });
  return Object.values(g)
    .map(o=>({...o, pico: Math.max(...o.qtdMes), custo: o.custoMes.reduce((s,x)=>s+x,0)}))
    .sort((a,b)=> deptIdx(a.dept) - deptIdx(b.dept)
               || a.cod.localeCompare(b.cod)
               || a.origem.localeCompare(b.origem)
               || a.fcod.localeCompare(b.fcod));
}

export { DEPTS_ORD, deptIdx, necessidadePorAtividade, pessoasCalc };

import { criterioMensal } from './atividade.js';
import { apoioDaAtividade } from './apoio-frente.js';
import { CFG } from '../dados/cfg.js';
import { CATEGORIAS_FUNCAO, CATEGORIA_OUTRAS } from '../dados/mao-de-obra.js';
import { MESES, NM } from '../nucleo/calendario.js';
import { num } from '../nucleo/formato.js';
import { ETAPAS_ORD } from './arrendamento.js';

/* ================== RESUMO DE PESSOAS ================== */
const DEPT_APOIO_OPER = "APOIO OPERACIONAL";
const DEPT_FAT = "FAT — FORA DA OPERAÇÃO";
const DEPTS_ORD = [...ETAPAS_ORD, DEPT_APOIO_OPER, "MANUTENÇÃO", "ESTRUTURA AGRÍCOLA", DEPT_FAT];
function deptIdx(d){ const i = DEPTS_ORD.indexOf(d); return i<0 ? 99 : i; }
// Reúne cada fonte de efetivo do plano numa lista única (departamento, função, pessoas e custo por mês).
// Usa os mesmos números das abas de origem, para o total conferir com a mão de obra da aba Custos.
/* Categoria operacional de uma funcao, pelo nome do cargo. Sem acento e em
   maiuscula para a comparacao nao depender de como o ERP escreveu. */
function categoriaDaFuncao(nome){
  const n = String(nome||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase();
  const c = CATEGORIAS_FUNCAO.find(c => c.tem.some(t => n.includes(t)));
  return c ? c.nome : CATEGORIA_OUTRAS;
}
const ordemCategoria = c => { const i = CATEGORIAS_FUNCAO.findIndex(x=>x.nome===c); return i<0 ? CATEGORIAS_FUNCAO.length : i; };

function pessoasCalc(R){
  const MP = R.MP, itens = [];
  const nomeF = c => (MP.custoFuncao[c]||{nome:c}).nome;
  const fixo = v => Array(NM).fill(v);
  // `cod` e o codigo da atividade, quando a origem e uma atividade do plano --
  // e por ele que a necessidade de gente volta a conversar com o Plano
  // Operacional e com o Dimensionamento. Apoio, manutencao e estrutura nao tem
  // atividade, e ficam sem codigo.
  // `fora` marca quem conta no efetivo e no custo mas nao e necessidade da
  // operacao nem esta disponivel para ela: o pessoal no FAT
  const add = (dept, fcod, origem, qtd, qtdMes, custoMes, cod, janela, fora) => itens.push({dept, fcod, fnome:nomeF(fcod), origem,
    cod: cod || "", janela: janela || null, categoria: categoriaDaFuncao(nomeF(fcod)),
    qtd, qtdMes, custoMes, custo:custoMes.reduce((s,x)=>s+x,0), fora: !!fora});

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
          r.meses.map((q,i)=>num(q)>0 ? Math.ceil(p.efetivo*fatorMes(i)) : 0), (p.mdoMes||[]).slice(), r.a.cod,
          // a janela diz quando a frente comeca e termina: sem ela, uma coluna
          // cheia de gente parece mes inteiro ocupado (ver ui/pessoas.js)
          r.janela ? {fonte:r.janela.fonte, ini:r.janela.ini||"", fim:r.janela.fim||""} : null);
    });
  });
  /* Apoio da frente: a gente que a operacao precisa e que nao tem area para
     lancar — auxiliar rural, motorista da pipa, do onibus, do caminhao de
     insumo. Vem do catalogo do ERP preso a atividade (calculo/apoio-frente.js)
     e conta nos meses em que a frente roda. Entra SEM custo de mao de obra
     proprio, como a reserva do transporte de cana logo abaixo: o caminhao pipa
     e o onibus ja sao pagos nos Equipamentos de Apoio e no Transporte de
     Pessoal, e somar de novo aqui pagaria a mesma gente duas vezes. */
  R.L.forEach(r=>{
    if(!(r.total > 0)) return;
    apoioDaAtividade(r).forEach(x=>{
      if(!(x.pessoas > 0)) return;
      add(r.a.etapa, x.fcod, `${r.a.nome} · ${x.nome}`, x.pessoas, x.pessoasMes.slice(), fixo(0), r.a.cod,
          r.janela ? {fonte:r.janela.fonte, ini:r.janela.ini||"", fim:r.janela.fim||""} : null);
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
  // apoio operacional lancado no Dimensionamento: necessidade nos meses marcados
  ((R.MOA||{}).linhas||[]).forEach(l=>{ if(l.qtd>0 && l.nMeses>0)
    add(DEPT_APOIO_OPER, l.fcod, l.frente || "Apoio operacional", l.qtd, l.qtdMes.slice(), l.mes.slice()); });
  // FAT: somam no efetivo e no custo, fora da operacao
  ((R.FT||{}).linhas||[]).forEach(l=>{ if(l.qtd>0 && l.nMeses>0)
    add(DEPT_FAT, l.fcod, l.desc ? "FAT — "+l.desc : "FAT — contrato suspenso", l.qtd, l.qtdMes.slice(), l.mes.slice(),
        "", null, true); });

  const operam = itens.filter(it=>!it.fora), noFat = itens.filter(it=>it.fora);
  const agrupa = (chave, lista = itens) => {
    const g = {};
    lista.forEach(it=>{
      const o = g[chave(it)] = g[chave(it)] || {qtd:0, custo:0, n:0, qtdMes:fixo(0), custoMes:fixo(0)};
      o.qtd+=it.qtd; o.custo+=it.custo; o.n++;
      it.qtdMes.forEach((v,i)=>{ o.qtdMes[i]+=v; o.custoMes[i]+=it.custoMes[i]; });
    });
    Object.values(g).forEach(o=>{ o.pico=Math.max(...o.qtdMes); o.pessoasMes=o.qtdMes.reduce((s,x)=>s+x,0); });
    return g;
  };
  /* qtdMes e porFun sao necessidade da operacao: o FAT fica fora deles, e o
     confronto com o quadro o desconta do disponivel (ui/pessoas.js). O custo e
     o efetivo total somam todo mundo, e por isso fecham com a mao de obra. */
  const qtdMes = MESES.map((m,i)=>operam.reduce((s,it)=>s+it.qtdMes[i],0));
  const custoMes = MESES.map((m,i)=>itens.reduce((s,it)=>s+it.custoMes[i],0));
  const fatMes = MESES.map((m,i)=>noFat.reduce((s,it)=>s+it.qtdMes[i],0));
  const fatCustoMes = MESES.map((m,i)=>noFat.reduce((s,it)=>s+it.custoMes[i],0));
  // porFunTodos: efetivo e custo por funcao com o FAT, para as tabelas que somam ao total
  return {itens, porDept:agrupa(it=>it.dept), porFun:agrupa(it=>it.fcod, operam), porFunTodos:agrupa(it=>it.fcod), qtdMes, custoMes,
          qtd: itens.reduce((s,it)=>s+it.qtd,0), custo: custoMes.reduce((s,x)=>s+x,0),
          apoio: R.AE.efetivo,
          fat: {porFun:agrupa(it=>it.fcod, noFat), qtdMes:fatMes, custoMes:fatCustoMes,
                qtd: noFat.reduce((s,it)=>s+it.qtd,0), custo: fatCustoMes.reduce((s,x)=>s+x,0),
                pico: Math.max(0,...fatMes)}};
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
  // FAT nao e necessidade: nao entra nesta lista (ver pessoasCalc)
  PS.itens.filter(it=>!it.fora).forEach(it=>{
    const k = [it.dept, it.cod, it.origem, it.fcod].join("|");
    const o = g[k] = g[k] || {dept:it.dept, cod:it.cod, origem:it.origem, fcod:it.fcod, fnome:it.fnome,
                              categoria:it.categoria, janela:it.janela,
                              qtd:0, qtdMes:Array(NM).fill(0), custoMes:Array(NM).fill(0)};
    o.qtd += it.qtd;
    it.qtdMes.forEach((v,i)=>{ o.qtdMes[i] += v; o.custoMes[i] += it.custoMes[i]; });
  });
  return Object.values(g)
    .map(o=>({...o, pico: Math.max(...o.qtdMes), custo: o.custoMes.reduce((s,x)=>s+x,0)}))
    // etapa, depois TIPO de gente (operador, motorista, ...), depois a atividade:
    // e assim que a escala e montada, e nao pela ordem do cadastro
    .sort((a,b)=> deptIdx(a.dept) - deptIdx(b.dept)
               || ordemCategoria(a.categoria) - ordemCategoria(b.categoria)
               || a.cod.localeCompare(b.cod)
               || a.origem.localeCompare(b.origem)
               || a.fcod.localeCompare(b.fcod));
}

/* Quando a frente comeca e termina, em texto. Data lancada na atividade manda
   (e ela que diz "acaba no dia 12"); sem data, valem o primeiro e o ultimo mes
   com gente. Mora aqui porque a tela e o relatorio impresso mostram a mesma
   coisa -- duas contas dariam duas respostas para a mesma pergunta. */
function janelaDaLinha(l){
  const d = iso => { const p = String(iso||"").split("-"); return p.length===3 ? `${p[2]}/${p[1]}/${p[0].slice(2)}` : ""; };
  if(l.janela && l.janela.fonte === "datas" && l.janela.ini && l.janela.fim)
    return {ini: d(l.janela.ini), fim: d(l.janela.fim), dica: "datas lançadas na atividade"};
  const com = l.qtdMes.map((v,i)=>v>0?i:-1).filter(i=>i>=0);
  if(!com.length) return {ini:"—", fim:"—", dica:""};
  return {ini: MESES[com[0]], fim: MESES[com[com.length-1]],
          dica: "meses com gente; a atividade não tem data lançada"};
}

export { DEPTS_ORD, DEPT_APOIO_OPER, DEPT_FAT, categoriaDaFuncao, deptIdx, janelaDaLinha, necessidadePorAtividade, pessoasCalc };

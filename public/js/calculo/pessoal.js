import { MESES } from '../nucleo/calendario.js';
import { PESSOAL } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== QUADRO NOMINAL — ADM E OFICINA ==================
   Quem e cada pessoa do administrativo agricola e da oficina: matricula, nome,
   funcao e salario. O quadro previsto da controladoria (calculo/quadro-fixo.js)
   diz QUANTAS pessoas e QUANTO de folha cada departamento tem; aqui esta QUEM
   sao, uma linha por pessoa, e por isso a arvore confronta os dois: departamento
   com 4 previstas e 3 lancadas tem uma vaga em aberto, e o contrario avisa que
   ha gente a mais do que o previsto.

   Estes registros NAO entram no cadastro-base do repositorio (que e publico e
   so guarda contagem, ver dados/funcionarios-base.js): moram no documento do
   plano, no banco da usina, como qualquer outro lancamento.

   O previsto sai do MESMO calculo que pinta o bloco "Quadro ADM e oficina" e o
   indicador da aba, medido no MES DE PICO do quadro -- o mesmo mes, para todo
   mundo. Somar o pico de cada departamento daria um numero maior (cada um pica
   no seu mes) e a tela mostraria 343 vagas ao lado de um indicador de 340
   pessoas, que e o tipo de divergencia entre telas que este app nao aceita.

   Nao mexe em custo. O plano continua custando o quadro PREVISTO da
   controladoria, nao a soma dos salarios lancados aqui -- um e a previsao
   fechada com a planilha, o outro e a lista de quem ocupa as vagas. A tela
   mostra a diferenca; trocar a fonte do custo seria outra decisao. */

/** Uma linha por pessoa, saneada (o documento salvo pode vir de outra versao). */
function pessoas(){
  return (Array.isArray(PESSOAL) ? PESSOAL : []).map((p, i) => ({
    i,
    mat: String(p.mat ?? "").trim(),
    nome: String(p.nome ?? "").trim(),
    grupo: p.grupo === "oficina" ? "oficina" : "adm",
    dcod: String(p.dcod ?? "").trim(),
    depto: String(p.depto ?? "").trim(),
    fcod: String(p.fcod ?? "").trim(),
    fnome: String(p.fnome ?? "").trim(),
    sal: num(p.sal),
  }));
}

/** Mes de pico do quadro previsto — a referencia de todas as contagens daqui. */
function mesReferencia(QF){
  const q = (QF && QF.qtdMes) || [];
  let ref = -1, max = 0;
  q.forEach((v,i)=>{ if(v > max){ max = v; ref = i; } });
  return {i: ref, nome: ref>=0 ? MESES[ref] : "", qtd: max};
}

/** Departamentos e funcoes do quadro previsto, para os seletores da tela. */
function catalogoQuadro(QF){
  const deptos = new Map(), funcoes = new Map();
  ((QF && QF.linhas) || []).forEach(l=>{
    const kd = l.grupo+"|"+l.dcod;
    if(!deptos.has(kd)) deptos.set(kd, {grupo:l.grupo, dcod:l.dcod, depto:l.depto});
    if(!funcoes.has(l.fcod)) funcoes.set(l.fcod, {fcod:l.fcod, fnome:l.fnome});
  });
  return {
    deptos: [...deptos.values()].sort((a,b)=> a.grupo.localeCompare(b.grupo) || a.depto.localeCompare(b.depto)),
    funcoes: [...funcoes.values()].sort((a,b)=> a.fnome.localeCompare(b.fnome)),
  };
}

/** Quantidade, folha e salario medio previstos de uma funcao no mes de pico. */
function previstoDaFuncao(QF, fcod, ref){
  const m = (ref !== undefined ? ref : mesReferencia(QF).i);
  const ls = ((QF && QF.linhas) || []).filter(l=>l.fcod===fcod);
  if(m < 0 || !ls.length) return {qtd:0, folha:0, sal:0};
  const qtd = ls.reduce((s,l)=>s+num(l.qtdMes[m]), 0);
  const folha = ls.reduce((s,l)=>s+num(l.folhaMes[m]), 0);
  return {qtd, folha, sal: qtd ? folha/qtd : 0};
}

/** Quantidade e folha previstas de um departamento no mes de pico. */
function previstoDoDepto(QF, grupo, dcod, ref){
  const m = (ref !== undefined ? ref : mesReferencia(QF).i);
  const ls = ((QF && QF.linhas) || []).filter(l=>l.grupo===grupo && l.dcod===dcod);
  if(m < 0) return {qtd:0, folha:0};
  return {qtd: ls.reduce((s,l)=>s+num(l.qtdMes[m]), 0),
          folha: ls.reduce((s,l)=>s+num(l.folhaMes[m]), 0)};
}

/**
 * Arvore do quadro nominal: grupo -> departamento -> pessoas, com o total de
 * cada no e o confronto com o previsto da controladoria.
 *
 * A arvore traz TODOS os departamentos do quadro previsto, inclusive os que
 * ainda nao tem ninguem lancado -- e a lista do que falta preencher, e o
 * departamento vazio mostra a vaga em aberto. Departamento lancado que nao
 * existe no previsto tambem aparece, sem previsto.
 */
function arvorePessoal(QF){
  const lista = pessoas();
  const cat = catalogoQuadro(QF);
  const ref = mesReferencia(QF);
  const salPrev = {};
  const grupos = ["adm", "oficina"].map(g=>{
    const doGrupo = lista.filter(p=>p.grupo===g);
    const porDep = new Map();
    const entra = (dcod, depto) => {
      const k = dcod || depto || "—";
      if(!porDep.has(k)) porDep.set(k, {dcod, depto: depto || "(sem departamento)", pessoas:[], folha:0});
      return porDep.get(k);
    };
    cat.deptos.filter(d=>d.grupo===g).forEach(d=>entra(d.dcod, d.depto));
    doGrupo.forEach(p=>{
      if(salPrev[p.fcod] === undefined) salPrev[p.fcod] = previstoDaFuncao(QF, p.fcod, ref.i).sal;
      const o = entra(p.dcod, p.depto);
      o.pessoas.push({...p, salPrev: salPrev[p.fcod]});
      o.folha += p.sal;
    });
    const deptos = [...porDep.values()].map(d=>{
      const prev = previstoDoDepto(QF, g, d.dcod, ref.i);
      return {...d, qtd:d.pessoas.length, prevQtd:prev.qtd, prevFolha:prev.folha,
              vagas: prev.qtd - d.pessoas.length,
              pessoas: d.pessoas.sort((a,b)=> a.nome.localeCompare(b.nome))};
    // departamento que nao tem previsto no mes de referencia nem ninguem
    // lancado nao e vaga em aberto: e uma linha do quadro que nao existe neste
    // mes, e so encompridaria a arvore
    }).filter(d=>d.prevQtd > 0 || d.qtd > 0)
      .sort((a,b)=> (b.prevQtd>0) - (a.prevQtd>0) || a.depto.localeCompare(b.depto));
    return {grupo:g, rotulo: g==="adm" ? "ADM agrícola" : "Oficina (manutenção)",
            deptos, qtd: doGrupo.length, folha: doGrupo.reduce((s,p)=>s+p.sal,0),
            prevQtd: deptos.reduce((s,d)=>s+d.prevQtd,0), prevFolha: deptos.reduce((s,d)=>s+d.prevFolha,0)};
  });
  return {grupos, ref, qtd: lista.length, folha: lista.reduce((s,p)=>s+p.sal,0),
          prevQtd: grupos.reduce((s,g)=>s+g.prevQtd,0), prevFolha: grupos.reduce((s,g)=>s+g.prevFolha,0),
          duplicadas: matriculasRepetidas(lista)};
}

/** Matricula lancada mais de uma vez — a mesma pessoa em dois departamentos. */
function matriculasRepetidas(lista){
  const c = new Map();
  lista.forEach(p=>{ if(p.mat) c.set(p.mat, (c.get(p.mat)||0)+1); });
  return [...c.entries()].filter(([,n])=>n>1).map(([m])=>m);
}

export { arvorePessoal, catalogoQuadro, mesReferencia, pessoas, previstoDaFuncao, previstoDoDepto };

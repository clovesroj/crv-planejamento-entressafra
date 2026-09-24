/* ================== DEMANDAS DE INSUMOS E MATERIAIS ==================
   O que o plano pede de cada insumo e de cada material de manutenção, o que já
   existe em estoque e a diferença: o que precisa ser comprado, quanto custa e
   até quando tem de chegar.

   Insumos. O volume é o dos tratamentos lançados no Plano Operacional, cada
   tratamento na sua área e nos seus meses (demandaMensal, calculo/insumos.js),
   na unidade do cadastro -- a mesma em que o estoque e o preço estão. O estoque
   é o da aba Insumos (o ajuste da tela vale sobre o cadastro). A compra usa o
   volume sem as linhas de composição marcadas para não comprar (compra:false:
   o produto só consome o saldo que já existe), a mesma regra dos relatórios.

   Materiais de manutenção. A quantidade anual e o preço da lista de materiais
   (aba Insumos); o estoque é informado na aba Demandas (MATX[i].est). O mês de
   compra é o mês de alocação do material, quando marcado.

   "Acaba em" é o primeiro mês em que o consumo acumulado passa o estoque: a
   compra tem de estar entregue antes dele. A compra de cada mês é o consumo que
   o estoque não cobre naquele mês -- somada no ano, é a quantidade a comprar. */
import { NM } from '../nucleo/calendario.js';
import { INSUMO, TRAT_ATIVO, insLista, matLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { composicao, demandaMensal, doseBase, familiaDoInsumo, freteEfetivo, precoInsumo, tratamentosDaLinha } from './insumos.js';

const somar = a => (a||[]).reduce((s,x)=>s+num(x),0);
const zeros = () => Array(NM).fill(0);

// estoque de um insumo: o ajuste da aba Insumos, se houver; senão, o do cadastro
function estoqueInsumo(prod, reg){
  const ov = INSUMO[prod] || {};
  return ov.est != null ? num(ov.est) : num(reg && reg.est);
}
/* Consumo que o estoque não cobre, mês a mês: o estoque vai sendo gasto na
   ordem dos meses; o que passa dele em cada mês é compra daquele mês. */
function faltaPorMes(mes, estoque){
  let resta = Math.max(0, num(estoque));
  return mes.map(v=>{ const usa = Math.min(resta, v); resta -= usa; return v - usa; });
}

function demandasInsumos(R){
  const uso = demandaMensal(R.L, false), compra = demandaMensal(R.L, true);
  const reg = new Map(insLista().map(i=>[i.prod, i]));
  const linhas = Object.keys(uso).map(prod=>{
    const i = reg.get(prod) || {prod};
    const mes = uso[prod], mesC = compra[prod] || zeros();
    const vol = somar(mes), volC = somar(mesC);
    const est = estoqueInsumo(prod, i), preco = precoInsumo(prod);
    const faltaMes = faltaPorMes(mesC, est);
    const comprar = somar(faltaMes);
    // o mês em que o consumo acumulado passa o estoque
    let ac = 0, acaba = null;
    mes.forEach((v,k)=>{ ac += v; if(acaba==null && v>0 && ac > est + 1e-9) acaba = k; });
    const fam = familiaDoInsumo(i);
    return {prod, cod:i.cod||"", un:i.un||"", famId:fam.id, famNome:fam.nome, pa:i.pa||"",
            mes, mesC, faltaMes, vol, volC, est, estData:(INSUMO[prod]||{}).estData||"", preco,
            consumo: vol*preco, comprar, valor: comprar*preco, valorMes: faltaMes.map(v=>v*preco),
            usoEstoque: Math.min(est, vol)*preco, saldo: est - vol, acaba,
            soEstoque: volC < vol - 1e-9, semPreco: !(preco>0), semCadastro: !reg.has(prod)};
  }).filter(l=>l.vol>0)
    .sort((a,b)=>b.valor-a.valor || b.consumo-a.consumo || a.prod.localeCompare(b.prod));
  return {linhas, ...totais(linhas)};
}

function demandasMateriais(R){
  const MT = R.MT || {linhas:[]};
  const linhas = matLista().map((m, ix)=>{
    const qtd = num(m.qtd), est = num(m.est), preco = num(m.preco);
    const comprar = Math.max(0, qtd - est);
    const mesAloc = (MT.linhas[ix] || {}).mes;
    const valorMes = zeros();
    if(mesAloc != null) valorMes[mesAloc] = comprar*preco;
    return {ix, cat:m.cat||"", item:m.item||"", un:m.un||"", preco, qtd, est, comprar,
            consumo: qtd*preco, valor: comprar*preco, valorMes, mes: mesAloc,
            usoEstoque: Math.min(est, qtd)*preco, saldo: est - qtd, semPreco: !(preco>0)};
  }).filter(l=>l.qtd>0 || l.est>0);
  return {linhas, ...totais(linhas)};
}

function totais(linhas){
  const valorMes = zeros();
  linhas.forEach(l=>l.valorMes.forEach((v,i)=>{ valorMes[i] += v; }));
  const valor = linhas.reduce((s,l)=>s+l.valor,0);
  return {n: linhas.length, nComprar: linhas.filter(l=>l.comprar>1e-9).length,
          consumo: linhas.reduce((s,l)=>s+l.consumo,0), valor, valorMes,
          semMes: valor - somar(valorMes),           // material a comprar sem mês de alocação
          usoEstoque: linhas.reduce((s,l)=>s+l.usoEstoque,0)};
}

function demandas(R){
  const ins = demandasInsumos(R), mat = demandasMateriais(R);
  return {ins, mat, valor: ins.valor + mat.valor, consumo: ins.consumo + mat.consumo,
          usoEstoque: ins.usoEstoque + mat.usoEstoque,
          valorMes: ins.valorMes.map((v,i)=>v + mat.valorMes[i])};
}

/* ---------- conferência: todo insumo lançado está no custo? ----------
   Refaz o custo de insumos pelo lado do produto -- volume x preço de cada
   linha de composição, mais o frete da linha -- e confronta com o custo que o
   motor soma atividade por atividade (R.insumoT). As duas contas têm de bater
   no centavo: se não batem, algum tratamento está sendo contado num lado e não
   no outro. Abre também o custo de insumos por etapa (e tratos por cultura), o
   que entra no custo do plantio e dos tratos culturais. */
const ROT_ETAPA = {"PREPARO DE SOLO":"Preparo de solo", "PLANTIO":"Plantio",
  "TRATOS CULTURAIS|Planta":"Tratos culturais — cana planta", "TRATOS CULTURAIS|Soca":"Tratos culturais — cana soca",
  "COLHEITA":"Colheita", "APOIO E CONSERVAÇÃO":"Apoio e conservação"};
const ORDEM_ETAPA = Object.keys(ROT_ETAPA);
function conferenciaInsumos(R){
  let consumo = 0, frete = 0;
  const porEtapa = {}, inativos = [];
  R.L.forEach(r=>{
    const ts = tratamentosDaLinha(r);
    ts.forEach(t=>composicao(t.trat).forEach(l=>{
      const q = t.area*doseBase(l);
      consumo += q*precoInsumo(l.prod); frete += q*freteEfetivo(l);
    }));
    const k = r.a.etapa==="TRATOS CULTURAIS" ? "TRATOS CULTURAIS|"+(r.a.cultura||"Soca") : r.a.etapa;
    if(num(r.cInsumo)) porEtapa[k] = (porEtapa[k]||0) + num(r.cInsumo);
    // tratamento inativo continua vinculado: entra no custo, mas some das buscas
    ts.forEach(t=>{ if(TRAT_ATIVO[t.trat]===false) inativos.push({cod:r.a.cod, nome:r.a.nome, trat:t.trat, area:t.area}); });
  });
  const etapas = Object.entries(porEtapa).map(([k,v])=>({k, rot:ROT_ETAPA[k]||k, v}))
    .sort((a,b)=>(ORDEM_ETAPA.indexOf(a.k)+99)%99 - (ORDEM_ETAPA.indexOf(b.k)+99)%99);
  const formacao = ["PREPARO DE SOLO","PLANTIO","TRATOS CULTURAIS|Planta"].reduce((s,k)=>s+(porEtapa[k]||0),0);
  const soma = consumo + frete, insumoT = num(R.insumoT);
  return {consumo, frete, soma, insumoT, dif: soma - insumoT, confere: Math.abs(soma - insumoT) <= 1,
          etapas, somaEtapas: etapas.reduce((s,e)=>s+e.v,0), formacao, inativos};
}

export { conferenciaInsumos, demandas, demandasInsumos, demandasMateriais, estoqueInsumo, faltaPorMes };

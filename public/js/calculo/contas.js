/* ================== PLANO DE CONTAS ==================
   Distribui o custo do plano nas contas contábeis. A regra: toda conta sai de
   uma natureza que o motor já calculou, e a soma das contas é o custo total —
   o que não tem conta própria aparece em linha separada, nunca some.

   Mão de obra. O custo mensal de cada função é salário-base + encargos
   (base × % de cada encargo) + benefícios (valor fixo por pessoa). Todo real
   de MDO do plano — do operador cobrado por hora, da estrutura cobrada por
   cabeça — carrega essa composição, e é por ela que o valor se abre:
     - salário-base e provisões (13º, férias, encargos sobre eles, aviso
       prévio) na conta de salário do grupo: 200-15 estrutura, 200-16
       oficina, 200-17 motoristas e operadores (inclui apoio), 200-18 rurais;
     - INSS patronal, RAT e Terceiros na 200-35; FGTS na 200-36;
     - cada benefício na conta que o cadastro de benefícios indica.
   Antes, os benefícios eram estimados à parte (efetivo × 12 meses) e somados
   por cima do custo cheio das contas de salário: a MDO entrava duas vezes, e
   os encargos, por subtração, chegavam a sair negativos.

   Insumos agronômicos, que não caíam em conta nenhuma, entram pela família
   do produto: herbicidas INS-01; inseticidas, fungicidas e biológicos INS-02;
   fertilizantes e corretivos INS-03; foliares, micronutrientes e
   bioestimulantes INS-04. Reguladores, adjuvantes e produto sem classe
   agronômica não têm conta no plano: ficam na linha "insumos sem conta".
   Esporádicos também não têm conta e ficam em linha própria. */
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { insLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { familiaDe, precoInsumo } from './insumos.js';
import { benVal, encPct } from './mao-de-obra.js';

// contas que o plano de contas mostra "incluído em" outra
const CONTA_COMBINADA = {"200-52":"200-51","200-73":"200-72","200-79":"200-77"};
// linhas sem conta própria — somam no total, com rótulo próprio
const SEM_CONTA = {
  "__insumos": "Insumos sem conta própria (reguladores, adjuvantes, produtos sem classe agronômica)",
  "__espor":   "Custos esporádicos (lançados na aba Custos)",
  "__fat":     "FAT — benefício pago aos funcionários com contrato suspenso (aba Mão de Obra)",
};
const INSUMO_CONTA = {herbicida:"INS-01", inseticida:"INS-02", fungicida:"INS-02", biologico:"INS-02",
  fertilizante:"INS-03", corretivo:"INS-03", foliar:"INS-04", micro:"INS-04", bioestim:"INS-04"};

// encargo → conta: contribuições sobre a folha e FGTS têm conta; o resto é provisão de remuneração
const contaEncargo = nome => /INSS|RAT|SAT|Terceiros/i.test(nome) ? "200-35" : /FGTS/i.test(nome) ? "200-36" : null;
// benefício → conta: das duas contas de "200-51 / 200-52", a que não é combinada em outra
const contaBeneficio = b => String(b.conta||"").split("/").map(s=>s.trim()).find(c=>c && !CONTA_COMBINADA[c]) || null;

function contasValores(R){
  const CV = {};
  const add = (k, v) => { if(k && v) CV[k] = (CV[k]||0) + v; };
  const MP = R.MP;

  /* abre um valor de MDO pela composição da função: salário-base e provisões
     na conta do grupo, encargos e benefícios nas suas contas */
  function abrirMDO(valor, fcod, contaSalario){
    const cf = MP.custoFuncao[fcod];
    if(!(valor>0)) return;
    if(!cf || !(cf.mensal>0)){ add(contaSalario, valor); return; }
    const f = valor/cf.mensal;
    let salario = cf.base;
    CFG.encargos.forEach((x,i)=>{ const v = cf.base*encPct(i); const k = contaEncargo(x.nome);
      if(k) add(k, v*f); else salario += v; });
    CFG.beneficios.forEach((b,i)=>{ const v = benVal(i); const k = contaBeneficio(b);
      if(k) add(k, v*f); else salario += v; });
    add(contaSalario, salario*f);
  }
  // operadores e rurais das atividades, frente a frente (cada frente tem a sua função)
  R.L.forEach(r=>{
    const conta = r.a.maq==="Equipe manual" ? "200-18" : "200-17";
    r.partes.forEach(p=>{ if(!p.terc) abrirMDO(num(p.cMDO), p.fcod, conta); });
  });
  // equipamentos de apoio: motoristas e operadores
  R.AE.linhas.forEach(l=>abrirMDO(num(l.mdo), l.fcod, "200-17"));
  // estrutura agrícola indireta
  CFG.indiretos.forEach(i=>{ const cf = MP.custoFuncao[i.fcod];
    if(cf) abrirMDO(cf.mensal*num(i.qtd)*NM, i.fcod, "200-15"); });
  // equipe de manutenção (oficina)
  const EM = R.EM || {};
  [["F09",EM.mec],["F14",EM.ajud],["F13",EM.lider]].forEach(([f,n])=>{ const cf = MP.custoFuncao[f];
    if(cf && n>0) abrirMDO(cf.mensal*n*NM, f, "200-16"); });
  // apoio operacional do Dimensionamento: custo cheio da função, como o operador
  ((R.MOA||{}).linhas||[]).forEach(l=>abrirMDO(num(l.total), l.fcod, "200-17"));
  // FAT: não há salário nem encargo no período, só o benefício lançado — que
  // não tem conta própria no plano; fica em linha separada, somando no total
  add("__fat", num(R.mdoFat));

  // manutenção (CRM por componente + materiais)
  add("200-93", R.crmComp.pecas); add("200-94", R.crmComp.terc);
  add("200-95", R.crmComp.consumo + R.MT.total); add("200-98", R.crmComp.lubrif);
  // combustível, terceiros, transporte de pessoal
  add("200-110", R.dieselT);
  const tc = cod => (R.TC.itens.find(i=>i.cod===cod)||{total:0}).total;
  add("200-124", tc("T02")+tc("T03")+R.tercAtivT); add("200-126", tc("T01"));
  add("200-127", R.tpessT);
  // insumos pela família do produto; o que não tem conta vai para a linha própria
  const custoProd = {};
  Object.entries(R.volDem||{}).forEach(([prod,vol])=>{ custoProd[prod] = num(vol)*precoInsumo(prod); });
  const somaProd = Object.values(custoProd).reduce((s,v)=>s+v,0);
  // ajuste fino: as contas somam exatamente o custo de insumos do motor
  const ajuste = somaProd>0 ? num(R.insumoT)/somaProd : 0;
  Object.entries(custoProd).forEach(([prod,v])=>{
    const i = insLista().find(x=>x.prod===prod) || {};
    const fam = i.fam || familiaDe(i.classe).id;
    add(INSUMO_CONTA[fam] || "__insumos", v*ajuste);
  });
  if(!(somaProd>0)) add("__insumos", num(R.insumoT));
  add("INS-05", R.irrT);
  // capital e estrutura
  add("DEP-01", R.depT); add("EST-01", R.admT); add("ARR-01", R.arrT);
  add("__espor", R.espT);
  return CV;
}

// soma das contas do cadastro e das linhas sem conta
function totaisContas(CV){
  const mapeado = CFG.contas.reduce((s,c)=>s+(CV[c.conta]||0),0);
  const semConta = Object.keys(SEM_CONTA).reduce((s,k)=>s+(CV[k]||0),0);
  return {mapeado, semConta, total: mapeado+semConta};
}

export { CONTA_COMBINADA, SEM_CONTA, contasValores, totaisContas };

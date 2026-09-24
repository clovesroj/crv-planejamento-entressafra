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
   bioestimulantes INS-04; adjuvantes, reguladores e qualquer grupo criado na
   aba Grupos de Insumos, INS-06. Só fica fora de conta o produto que NÃO TEM
   grupo (o bloco "Outros e a Classificar" do cadastro) -- esse é o único caso
   que a pessoa resolve escolhendo o grupo na aba Insumos, e é o que o aviso do
   Plano de Contas passou a dizer. Antes, adjuvante e regulador caíam no mesmo
   balaio e a tela pedia para definir um grupo que o produto já tinha.
   Esporádicos também não têm conta e ficam em linha própria. */
import { CFG } from '../dados/cfg.js';
import { NM } from '../nucleo/calendario.js';
import { insLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { familiaEfetiva, precoInsumo } from './insumos.js';
import { benVal, encPct } from './mao-de-obra.js';

// contas que o plano de contas mostra "incluído em" outra
const CONTA_COMBINADA = {"200-52":"200-51","200-73":"200-72","200-79":"200-77"};
// linhas sem conta própria — somam no total, com rótulo próprio
const SEM_CONTA = {
  "__insumos": "Insumos sem grupo agronômico na aba Insumos (bloco \"Outros e a Classificar\")",
  "__espor":   "Custos esporádicos (lançados na aba Custos)",
  "__fat":     "FAT — benefício pago aos funcionários com contrato suspenso (aba Mão de Obra)",
};
const INSUMO_CONTA = {herbicida:"INS-01", inseticida:"INS-02", fungicida:"INS-02", biologico:"INS-02",
  fertilizante:"INS-03", corretivo:"INS-03", foliar:"INS-04", micro:"INS-04", bioestim:"INS-04",
  regulador:"INS-06", adjuvante:"INS-06"};
/* Grupo criado na aba Grupos de Insumos nao esta no mapa acima -- e um grupo de
   verdade, escolhido a mao, entao vai para INS-06 e nao para a linha sem conta.
   Sem grupo mesmo ("outros") continua fora: e o que o aviso manda corrigir. */
const contaDoInsumo = fam => INSUMO_CONTA[fam] || (fam && fam !== "outros" ? "INS-06" : "__insumos");

// encargo → conta: contribuições sobre a folha e FGTS têm conta; o resto é provisão de remuneração
const contaEncargo = nome => /INSS|RAT|SAT|Terceiros/i.test(nome) ? "200-35" : /FGTS/i.test(nome) ? "200-36" : null;
// benefício → conta: das duas contas de "200-51 / 200-52", a que não é combinada em outra
const contaBeneficio = b => String(b.conta||"").split("/").map(s=>s.trim()).find(c=>c && !CONTA_COMBINADA[c]) || null;

/* Apura as contas e, junto, a ORIGEM de cada real em cada conta (de que
   parte do plano ele veio: etapa, quadro, produto...). contasValores devolve
   só os valores; contasOrigens, as origens -- o detalhamento de uma conta no
   rastro e no painel do Plano de Contas. */
function apurarContas(R){
  const CV = {}, ORIG = {};
  const add = (k, v, orig) => { if(!k || !v) return; CV[k] = (CV[k]||0) + v;
    const o = ORIG[k] = ORIG[k] || {}; const rot = orig || "Outros"; o[rot] = (o[rot]||0) + v; };
  const MP = R.MP;

  /* abre um valor de MDO pela composição da função: salário-base e provisões
     na conta do grupo, encargos e benefícios nas suas contas */
  function abrirMDO(valor, fcod, contaSalario, orig){
    const cf = MP.custoFuncao[fcod];
    if(!(valor>0)) return;
    if(!cf || !(cf.mensal>0)){ add(contaSalario, valor, orig); return; }
    const f = valor/cf.mensal;
    let salario = cf.base;
    CFG.encargos.forEach((x,i)=>{ const v = cf.base*encPct(i); const k = contaEncargo(x.nome);
      if(k) add(k, v*f, orig); else salario += v; });
    CFG.beneficios.forEach((b,i)=>{ const v = benVal(i); const k = contaBeneficio(b);
      if(k) add(k, v*f, orig); else salario += v; });
    add(contaSalario, salario*f, orig);
  }
  const etapaRot = e => String(e||"").charAt(0) + String(e||"").slice(1).toLowerCase();
  // operadores e rurais das atividades, frente a frente (cada frente tem a sua função)
  R.L.forEach(r=>{
    const conta = r.a.maq==="Equipe manual" ? "200-18" : "200-17";
    r.partes.forEach(p=>{ if(!p.terc) abrirMDO(num(p.cMDO), p.fcod, conta, "Equipes das atividades — "+etapaRot(r.a.etapa)); });
  });
  // equipamentos de apoio: motoristas e operadores
  R.AE.linhas.forEach(l=>abrirMDO(num(l.mdo), l.fcod, "200-17", "Operadores dos equipamentos de apoio"));
  /* quadro ADM agrícola (200-15) e oficina (200-16), da controladoria: a folha
     prevista vai inteira na conta de salário do grupo (já traz 13º e férias no
     mês em que são pagos); INSS, RAT, Terceiros e FGTS sobre ela, nas suas
     contas; benefícios por pessoa prevista, na conta de cada benefício */
  const QF = R.QF;
  if(QF) [QF.adm, QF.oficina].forEach(G=>{
    const orig = G===QF.adm ? "Quadro ADM agrícola (controladoria)" : "Quadro da oficina (controladoria)";
    add(G.conta, G.folha, orig);
    QF.contrib.forEach(e=>{ const k = contaEncargo(e.nome); add(k || G.conta, G.folha*e.pct, orig); });
    const pessoasMes = G.qtdMes.reduce((s,x)=>s+x,0);
    CFG.beneficios.forEach((b,i)=>{ add(contaBeneficio(b) || G.conta, benVal(i)*pessoasMes, orig); });
  });
  // apoio operacional do Dimensionamento: custo cheio da função, como o operador
  ((R.MOA||{}).linhas||[]).forEach(l=>abrirMDO(num(l.total), l.fcod, "200-17", "Apoio operacional (Dimensionamento)"));
  // FAT: não há salário nem encargo no período, só o benefício lançado — que
  // não tem conta própria no plano; fica em linha separada, somando no total
  add("__fat", num(R.mdoFat), "FAT (aba Mão de Obra)");

  // manutenção (CRM por componente + materiais)
  add("200-93", R.crmComp.pecas, "CRM da frota — peças"); add("200-94", R.crmComp.terc, "CRM da frota — serviços de terceiros");
  add("200-95", R.crmComp.consumo, "CRM da frota — materiais de uso e consumo");
  add("200-95", R.MT.total, "Materiais de manutenção (lista de materiais)");
  add("200-98", R.crmComp.lubrif, "CRM da frota — lubrificantes");
  // combustível, terceiros, transporte de pessoal
  add("200-110", R.dieselT, "Diesel das atividades e do apoio (aba Combustível)");
  const tc = cod => (R.TC.itens.find(i=>i.cod===cod)||{total:0}).total;
  add("200-124", tc("T02"), "Terceirização T02"); add("200-124", tc("T03"), "Terceirização T03");
  add("200-124", R.tercAtivT, "Frentes terceirizadas das atividades (coluna 3º)");
  add("200-126", tc("T01"), "Terceirização T01 — aplicação aérea");
  add("200-127", R.tpessT, "Transporte de pessoal (rotas)");
  // insumos pela família do produto; o que não tem conta vai para a linha própria
  const custoProd = {};
  Object.entries(R.volDem||{}).forEach(([prod,vol])=>{ custoProd[prod] = num(vol)*precoInsumo(prod); });
  const somaProd = Object.values(custoProd).reduce((s,v)=>s+v,0);
  // ajuste fino: as contas somam exatamente o custo de insumos do motor
  const ajuste = somaProd>0 ? num(R.insumoT)/somaProd : 0;
  Object.entries(custoProd).forEach(([prod,v])=>{
    // a mesma família do R$/ha do Painel: cadastro e, sem ele, o nome (NPK, KCl, calcário...)
    const fam = familiaEfetiva(insLista().find(x=>x.prod===prod) || {prod});
    add(contaDoInsumo(fam), v*ajuste, prod);
  });
  if(!(somaProd>0)) add("__insumos", num(R.insumoT), "Insumos dos tratamentos");
  add("INS-05", R.irrT, "Irrigação e fertirrigação (aba Irrigação)");
  // capital e estrutura
  add("DEP-01", R.depT, "Depreciação do imobilizado (Premissas)"); add("EST-01", R.admT, "Custos administrativos (aba Custos Administrativos)");
  add("ARR-01", R.arrT, "Arrendamentos (aba Arrendamentos)");
  add("__espor", R.espT, "Esporádicos (aba Custos)");
  return {CV, ORIG};
}
function contasValores(R){ return apurarContas(R).CV; }
// origem de cada conta: {conta: [{rot, v}]}, da maior para a menor
function contasOrigens(R){
  const {ORIG} = apurarContas(R);
  return Object.fromEntries(Object.entries(ORIG).map(([k,o])=>[k,
    Object.entries(o).map(([rot,v])=>({rot, v})).filter(x=>Math.abs(x.v)>0.005).sort((a,b)=>b.v-a.v)]));
}

// soma das contas do cadastro e das linhas sem conta
function totaisContas(CV){
  const mapeado = CFG.contas.reduce((s,c)=>s+(CV[c.conta]||0),0);
  const semConta = Object.keys(SEM_CONTA).reduce((s,k)=>s+(CV[k]||0),0);
  return {mapeado, semConta, total: mapeado+semConta};
}

export { CONTA_COMBINADA, SEM_CONTA, contasOrigens, contasValores, totaisContas };

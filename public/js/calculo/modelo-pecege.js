/* ================== TABELAS NO MODELO PECEGE ==================
   As duas tabelas do relatório de custos PECEGE/USP, montadas com os números
   do plano:

   1. Custo por hectare — preparo, plantio, tratos de cana planta, formação do
      canavial (preparo + plantio + tratos planta, como no modelo) e tratos de
      cana soca; abertura em operação, insumos e administrativo, mais o que o
      plano tem e o modelo não mostra (arrendamento, depreciação, apoio e
      custos gerais).
   2. Sistema de colheita — corte, transbordo, transporte, apoio + adm e CTTA
      (corte, transbordo, transporte e apoio), em R$ por tonelada.

   Nada é conta nova: operação, rateios e insumos saem de custoPorOperacao e
   das atividades, com os mesmos critérios de rateio do motor.

   Mudas. No Plano Operacional a colheita, o transbordo e o transporte de muda
   (a atividade A02 e as que a transportam) estão na etapa Colheita. No modelo
   PECEGE muda é insumo do plantio. Aqui o custo delas — direto mais a parte
   delas nos rateios da colheita — entra no plantio como "Mudas" e sai do CTTA.
   Assim as duas tabelas fecham entre si: plantio + CTTA + arrendamento da
   colheita = etapas Plantio + Colheita. */
import { insLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';
import { baseOperacao } from './base-fisica.js';
import { custoPorOperacao } from './custo-operacao.js';
import { composicao, doseBase, familiaEfetiva, freteEfetivo, precoInsumo } from './insumos.js';

/* ---------- categoria do insumo no modelo ----------
   Pela família efetiva do insumo (calculo/insumos.js): a do cadastro e, sem
   ela, o nome para os casos óbvios -- a mesma que o Plano de Contas usa. */
function categoriaInsumo(prod){
  const i = insLista().find(x=>x.prod===prod) || {prod};
  const texto = [i.prod, i.classe, i.pa, i.categ, i.obs].join(" ");
  if(/\bmuda/i.test(i.prod||"")) return "mudas";
  if(/torta/i.test(texto)) return "torta";
  const fam = familiaEfetiva(i);
  if(fam==="corretivo") return "corretivo";
  if(["fertilizante","foliar","micro","bioestim"].includes(fam)) return "fertilizante";
  if(fam==="herbicida") return "herbicida";
  if(fam==="inseticida") return "inseticida";
  if(fam==="fungicida") return /nemat/i.test(texto) ? "nematicida" : "fungicida";
  if(fam==="biologico") return "biologico";
  if(fam==="regulador") return /inib|floresc/i.test(texto) ? "inibidor" : "maturador";
  return "outros";
}

// custo de insumo por produto de uma atividade (tratamento principal e extras)
function insumosDaAtividade(r){
  const out = {};
  const partes = Array.isArray(r.tratsDetalhe) && r.tratsDetalhe.length
    ? r.tratsDetalhe.map(t=>({trat:t.trat, area:num(t.area)}))
    : (r.trat && r.ehHa ? [{trat:r.trat, area:num(r.total)}] : []);
  partes.forEach(({trat, area})=>{
    if(!trat || !(area>0)) return;
    composicao(trat).forEach(l=>{
      out[l.prod] = (out[l.prod]||0) + area*doseBase(l)*(precoInsumo(l.prod)+freteEfetivo(l));
    });
  });
  // fecha com o custo de insumo que o motor calculou para a atividade
  const soma = Object.values(out).reduce((s,v)=>s+v,0);
  if(soma>0 && num(r.cInsumo)>0){ const f = num(r.cInsumo)/soma; Object.keys(out).forEach(k=>{ out[k]*=f; }); }
  else if(num(r.cInsumo)>0) out["(sem composição)"] = num(r.cInsumo);
  return out;
}

const CATS = ["mudas","corretivo","fertilizante","herbicida","inseticida","fungicida","nematicida",
              "biologico","maturador","inibidor","torta","outros"];
const culturaDe = a => a.cultura || "Soca";
const ehMuda = a => a.cod==="PL01" || a.src==="PL01";   // PL01 = Colheita muda (antigo A02)

/* ---------- 1. custo por hectare ---------- */
function tabelaHa(R){
  const C = custoPorOperacao(R);
  const op = id => C.principais.concat(C.outras).find(l=>l.id===id);
  const colh = op("colheita");

  // mudas: custo das atividades de muda + a parte delas nos rateios da colheita
  const muda = R.L.filter(r=>r.a.etapa==="COLHEITA" && ehMuda(r.a));
  const dirMuda = muda.reduce((s,r)=>s+r.direto,0);
  const dirColh = R.L.filter(r=>r.a.etapa==="COLHEITA").reduce((s,r)=>s+r.direto,0);
  const fMuda = dirColh>0 ? dirMuda/dirColh : 0;
  const ratColh = colh ? colh.rateio.apoio+colh.rateio.admin+colh.rateio.deprec+colh.rateio.gerais : 0;
  const custoMuda = dirMuda + ratColh*fMuda;

  function coluna(id, ops){
    const linhas = ops.map(op).filter(Boolean);
    const v = {maq:0, terc:0, irrig:0, admin:0, royalties:0, arrend:0, deprec:0, apoio:0, gerais:0};
    CATS.forEach(k=>{ v["ins_"+k] = 0; });
    linhas.forEach(l=>{
      v.maq   += l.oper.diesel + l.oper.mdo + l.oper.manut;
      v.terc  += l.oper.terc;
      v.irrig += l.oper.irrig;
      v.admin += l.rateio.admin; v.arrend += l.rateio.arrend; v.deprec += l.rateio.deprec;
      v.apoio += l.rateio.apoio; v.gerais += l.rateio.gerais;
      const ativs = R.L.filter(r=>r.a.etapa===l.etapa && (!l.cultura || culturaDe(r.a)===l.cultura));
      ativs.forEach(r=>Object.entries(insumosDaAtividade(r)).forEach(([prod,c])=>{
        v["ins_"+(prod==="(sem composição)" ? "outros" : categoriaInsumo(prod))] += c; }));
    });
    if(ops.includes("plantio")) v.ins_mudas += custoMuda;
    return v;
  }
  const cols = [
    {id:"preparo",  nome:"Preparo",               v:coluna("preparo",["preparo"]),  base:baseOperacao("plantio",{q:0,un:"ha"})},
    {id:"plantio",  nome:"Plantio",               v:coluna("plantio",["plantio"]),  base:baseOperacao("plantio",{q:0,un:"ha"})},
    {id:"planta",   nome:"Tratos planta",         v:coluna("planta",["planta"]),    base:(op("planta")||{}).base},
    {id:"formacao", nome:"Formação do canavial",  v:coluna("formacao",["preparo","plantio","planta"]), base:baseOperacao("plantio",{q:0,un:"ha"})},
    {id:"soca",     nome:"Tratos soca",           v:coluna("soca",["soca"]),        base:(op("soca")||{}).base},
  ];
  cols.forEach(c=>{
    const v = c.v;
    v.operacao = v.maq + v.terc + v.irrig;
    v.ins_defensivos = v.ins_herbicida + v.ins_inseticida + v.ins_fungicida + v.ins_nematicida;
    v.insumos = CATS.reduce((s,k)=>s+v["ins_"+k],0);
    v.adm = v.admin + v.royalties;
    v.rateios = v.arrend + v.deprec + v.apoio + v.gerais;
    v.pecege = v.operacao + v.insumos + v.adm;
    v.total = v.pecege + v.rateios;
  });
  return {cols, custoMuda, dirMuda};
}

/* ---------- 2. sistema de colheita (R$/t) ---------- */
function tabelaColheita(R){
  const C = custoPorOperacao(R);
  const colh = C.principais.find(l=>l.id==="colheita");
  const ativ = R.L.filter(r=>r.a.etapa==="COLHEITA" && !ehMuda(r.a));
  const grupo = r => r.a.tipo==="transp" ? (r.a.modo==="caminhao" ? "transporte" : "transbordo") : "corte";
  const vazio = () => ({operador:0, diesel:0, manut:0, locacao:0, outros:0});
  const g = {corte:vazio(), transbordo:vazio(), transporte:vazio()};
  ativ.forEach(r=>{ const x = g[grupo(r)];
    x.operador += r.cMDO; x.diesel += r.cDiesel; x.manut += r.cManut; x.locacao += r.cTerc;
    x.outros += r.direto - r.cMDO - r.cDiesel - r.cManut - r.cTerc; });
  // apoio + adm: a parte do CTTA (sem muda) nos rateios da colheita, pelo custo direto
  const dirCtta = ativ.reduce((s,r)=>s+r.direto,0);
  const dirColh = R.L.filter(r=>r.a.etapa==="COLHEITA").reduce((s,r)=>s+r.direto,0);
  const f = dirColh>0 ? dirCtta/dirColh : 0;
  const A = colh ? {apoio:(colh.rateio.apoio+colh.rateio.gerais)*f, admin:colh.rateio.admin*f, deprec:colh.rateio.deprec*f} : {apoio:0,admin:0,deprec:0};
  const arrend = colh ? colh.rateio.arrend : 0;
  // toneladas colhidas: a premissa de volume de colheita ou as toneladas do corte
  const tonCorte = ativ.filter(r=>grupo(r)==="corte").reduce((s,r)=>s+r.total,0);
  const base = baseOperacao("colheita", {q:tonCorte, un:"t", rot:"t cortadas"});
  const soma = x => x.operador+x.diesel+x.manut+x.locacao+x.outros;
  const ct = {}; Object.keys(g.corte).forEach(k=>{ ct[k] = g.corte[k]+g.transbordo[k]; });
  const tot = {corte:soma(g.corte), transbordo:soma(g.transbordo), ct:soma(ct), transporte:soma(g.transporte),
               a:A.apoio+A.admin+A.deprec};
  tot.ctta = tot.ct + tot.transporte + tot.a;
  return {g, ct, A, tot, arrend, base, ativ:ativ.map(r=>r.a.cod)};
}

export { categoriaInsumo, familiaEfetiva, tabelaColheita, tabelaHa };

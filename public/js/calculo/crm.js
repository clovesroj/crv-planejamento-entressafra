import { CFG } from '../dados/cfg.js';
import { CRM, CRM_ESP, FROTA, FROTA_DEST, FROTA_ORIG, FROTA_UN, MAQ, P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ===== CRM: custos de reparo e manutenção, estratificados ===== */
const CRM_COMP = ["pecas","terc","consumo","lubrif"];
const CRM_LABEL = {pecas:"Peças", terc:"Serviços de terceiros",
                   consumo:"Materiais de uso e consumo", lubrif:"Lubrificantes"};
/* ===== Base real de frota =====
   Indexada por especialidade. Um modelo pode estar cadastrado em mais de uma
   (o mesmo trator serve de agrícola e de transbordo), por isso a identidade de
   um item do registro é o par especialidade+modelo, não o nome do modelo: com a
   chave só pelo nome, a segunda especialidade perdia as unidades dela. */
const SEP_MOD = " ▸ ";
const FROTA_ESP = {};                       // especialidade -> registro da base
const FROTA_AG  = {};                       // agrupamento   -> [especialidades]
const INFO_MODELO = {};                     // chave composta -> {esp, mod, marca, n, np}
(CFG.frota_base||[]).forEach(e=>{
  FROTA_ESP[e.esp] = e;
  (FROTA_AG[e.ag] = FROTA_AG[e.ag] || []).push(e.esp);
  e.mods.forEach(m=> INFO_MODELO[e.esp+SEP_MOD+m.m] = {esp:e.esp, mod:m.m, marca:m.marca, n:m.n, np:m.np});
});
const FROTA_AGS = Object.keys(FROTA_AG).sort();
// Balde dos itens fora da taxonomia de frota: serviço, mão de obra, terceirizado
const AG_SEM_FROTA = "SEM FROTA (serviços)";
function agsCRM(){ return [...FROTA_AGS, AG_SEM_FROTA]; }
// Agrupamento de uma linha do registro: o da especialidade dela, ou o balde
function agDeLinha(l){
  const e = l.esp && FROTA_ESP[l.esp];
  return e ? e.ag : AG_SEM_FROTA;
}
// Nome curto para exibir: a especialidade já é o cabeçalho do bloco
function rotuloItem(item){ const i = INFO_MODELO[item]; return i ? i.mod : item; }
// Modelo da base que um item do plano declara representar. Vazio quando o item
// é uma classe de planejamento sem modelo único correspondente — três classes de
// trator agrícola para 28 modelos em campo não viram um modelo só.
function modDe(item){ const c = CFG.crm[item]; return (c && c.mod) || null; }
// Chave do registro do modelo que este item do plano representa
function chaveDoModelo(item){
  const c = CFG.crm[item];
  return c && c.mod && c.esp ? c.esp+SEP_MOD+c.mod : null;
}
/* ===== Unidade de frota =====
   O equipamento fisico e a menor unidade do cadastro. Cada um tem um destino na
   safra: roda na operacao, e ai carrega custo de manutencao, ou vai para
   reforma, e ai entra no provisionamento de reforma em vez do CRM. */
const DESTINO_PADRAO = "roda";
function unDe(cod){ return FROTA_UN[cod] || {}; }
function destinoDe(cod){ return unDe(cod).st || DESTINO_PADRAO; }
// CRM proprio da unidade, quando alguem digitou algum componente nela
function crmUnDe(cod){
  const c = unDe(cod).crm || {};
  const o = {}; let tem = false;
  CRM_COMP.forEach(k=>{ if(c[k]!=null && c[k]!==""){ o[k]=num(c[k]); tem=true; } else o[k]=0; });
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  o.preenchida = tem;
  return o;
}

// Unidades físicas de um modelo, do mais novo ao mais velho: [cod, ano, proprio]
function unidadesDoModelo(chave, ignorarDestino){
  const i = INFO_MODELO[chave];
  if(!i) return [];
  const e = FROTA_ESP[i.esp];
  const m = e && e.mods.find(x=>x.m===i.mod);
  let un = (m && m.un) || [];
  if(FROTA_ORIG!=="todos") un = un.filter(u => FROTA_ORIG==="proprio" ? u[2]===1 : u[2]===0);
  if(!ignorarDestino && FROTA_DEST!=="todos") un = un.filter(u => destinoDe(u[0])===FROTA_DEST);
  return un;
}
// Media do que foi digitado nas unidades que vao rodar. E o caminho de baixo
// para cima: a unidade orcada gera o modelo, e o modelo gera a especialidade.
// So conta unidade que roda -- a que vai para reforma nao carrega CRM de safra.
function crmDasUnidades(chave){
  const un = unidadesDoModelo(chave, true).filter(u=>destinoDe(u[0])==="roda");
  const cheias = un.map(u=>crmUnDe(u[0])).filter(c=>c.preenchida);
  if(!cheias.length) return null;
  const o = {};
  CRM_COMP.forEach(k=> o[k] = cheias.reduce((a,c)=>a+c[k],0)/cheias.length);
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  o.n = cheias.length; o.de = un.length;
  return o;
}
// Idem para a especialidade: media dos modelos que tem unidade orcada
function crmDosModelos(esp){
  const e = FROTA_ESP[esp];
  if(!e) return null;
  const vindos = e.mods.map(m=>crmDasUnidades(esp+SEP_MOD+m.m)).filter(Boolean);
  if(!vindos.length) return null;
  const o = {};
  CRM_COMP.forEach(k=> o[k] = vindos.reduce((a,c)=>a+c[k],0)/vindos.length);
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  o.n = vindos.length;
  return o;
}
// Especialidade de um item: arquétipo traz `esp` no cadastro, modelo da base
// traz na própria chave. Serviço e mão de obra não têm frota, logo não têm.
function espDe(item){
  const c = CFG.crm[item];
  if(c && c.esp) return c.esp;
  const i = INFO_MODELO[item];
  return i ? i.esp : null;
}
// Unidades que a base registra deste modelo, e quantas são próprias
function modeloNaBase(item){
  const i = INFO_MODELO[item];
  return i ? {n:i.n, np:i.np} : {n:0, np:0};
}
// Filtro próprio/terceiro, aplicado sobre as unidades da base
function contaOrigem(prop, terc){
  return FROTA_ORIG==="proprio" ? prop : FROTA_ORIG==="terceiro" ? terc : prop+terc;
}
// Taxa vigente de uma especialidade, para a linha-mãe da tabela
function crmEspDe(esp){
  const ov = CRM_ESP[esp] || {};
  const dosMods = crmDosModelos(esp);
  const o = {};
  CRM_COMP.forEach(k=> o[k] = ov[k]!=null ? num(ov[k]) : dosMods ? dosMods[k] : 0);
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  o.daFrota = !!dosMods && !Object.keys(ov).length;   // veio de baixo, nao digitado aqui
  return o;
}

// Parâmetros de máquina do plano, com o ajuste do usuário por cima do cadastro.
// São premissas de projeto, não medição: a mesma colhedora rende diferente
// colhendo cana e colhendo muda, e é aqui que isso se corrige.
const MAQ_CAMPOS = ["d","h","u"];
function maqDe(item){
  const base = CFG.maquinas[item] || CFG.maquinas["A definir"] || {d:0,m:0,h:0,u:1};
  const ov = MAQ[item] || {};
  const o = {...base};
  MAQ_CAMPOS.forEach(k=>{ if(ov[k]!=null) o[k] = num(ov[k]); });
  return o;
}

function crmDe(item){
  const base = CFG.crm[item];
  const esp  = espDe(item);
  // Taxa da especialidade: vale para todo modelo dela que não tenha número
  // próprio — o caso dos modelos vindos da base real, que entram sem taxa.
  // Arquétipo do planejamento já tem a sua e não é afetado.
  const pad  = (esp && CRM_ESP[esp]) || {};
  const ov   = CRM[item] || {};
  // Precedencia: numero digitado no proprio item > cadastro do arquetipo >
  // media das unidades orcadas deste modelo > taxa lancada na especialidade.
  const daFrota = INFO_MODELO[item] ? crmDasUnidades(item) : null;
  const o = {esp, cat: base ? base.cat : "Equipamentos", daFrota: !!daFrota};
  CRM_COMP.forEach(k=>{
    o[k] = ov[k]!=null           ? num(ov[k])
         : base && base[k]!=null ? base[k]
         : daFrota               ? daFrota[k]
         : pad[k]!=null          ? num(pad[k])
         : 0;
  });
  o.total = CRM_COMP.reduce((s,k)=>s+o[k],0);
  return o;
}
// R$/h de manutenção do conjunto: máquina + implemento acoplado
function crmHora(maq, imp){
  const a = crmDe(maq).total;
  const b = (imp && imp!=="----" && imp!=="—" && CFG.crm[imp]) ? crmDe(imp).total : 0;
  return a+b;
}
// abre o custo de manutenção do conjunto por componente
function crmDetalhe(maq, imp, horas){
  const o = {};
  CRM_COMP.forEach(k=>{
    const a = crmDe(maq)[k];
    const b = (imp && CFG.crm[imp]) ? crmDe(imp)[k] : 0;
    o[k] = (a+b)*horas;
  });
  return o;
}
// Horas de cada item (máquina ou implemento) conforme o plano operacional
function horasPorItem(L, AE){
  const h = {};
  const soma=(k,v)=>{ if(!k||k==="----"||k==="—") return; h[k]=(h[k]||0)+v; };
  L.forEach(r=>r.partes.forEach(p=>{
    if(p.terc||p.horas<=0) return;
    soma(p.maq,p.horas); soma(p.imp,p.horas);
  }));
  AE.linhas.forEach(l=>{ if(l.horas>0) soma(l.maq,l.horas); });
  return h;
}
// Frota dimensionada pelo plano (arredondada) por item
function frotaPorItem(L, AE){
  const f = {};
  const soma=(k,v)=>{ if(!k||k==="----"||k==="—") return; f[k]=(f[k]||0)+v; };
  L.forEach(r=>r.partes.forEach(p=>{
    if(p.terc||p.frotaR<=0) return;
    soma(p.maq,p.frotaR); soma(p.imp,p.frotaR);
  }));
  AE.linhas.forEach(l=>{ if(num(l.qtd)>0) soma(l.maq,num(l.qtd)); });
  return f;
}
// CRM de veículo é expresso por km rodado, não por hora. A conversão horas->km usa
// a velocidade média de transporte já premissada (Transporte e Transbordo).
//
// Quem decide a unidade é a base do ERP, por especialidade — não a categoria do
// app. As duas discordavam em oito equipamentos, e o ERP está certo: caminhão
// bombeiro, comboio, oficina e munck trabalham parados e são medidos por hora;
// reboque canavieiro, carroceria e tanque rodam estrada e são medidos por km.
// As taxas desses oito foram convertidas pela mesma velocidade média, de modo
// que o custo projetado não se mexeu — só passou a ser expresso na unidade que
// o equipamento realmente usa. Ver o campo `unERP` em dados/crm.js.
const CAT_VEICULO = ["Veículos pesados","Veículos leves"];
// Unidade de medida de uma especialidade, como o ERP mede a frota dela:
// K = veículo, contado em km rodado; H = máquina, contada em hora de motor.
// É a fonte de verdade — a categoria do app só vale para item fora da taxonomia
// (serviço, mão de obra), que não tem frota e portanto não tem hodômetro.
function baseDe(esp){ const e = FROTA_ESP[esp]; return e ? e.base : "H"; }
function velMediaVeic(){ return ((P.velC||0)+(P.velV||0))/2 || 1; }
// Para cada item: quantidade e horas/equipamento previstas (editáveis) e o CRM resultante
function crmFrota(L, AE){
  const hPlano = horasPorItem(L, AE);
  const fPlano = frotaPorItem(L, AE);
  // O registro reúne os arquétipos do planejamento, o que o plano usar e todo
  // modelo da base real — é ela que responde "o que existe hoje".
  const itens = [...new Set([...Object.keys(CFG.crm), ...Object.keys(hPlano), ...Object.keys(INFO_MODELO)])];
  const vmed = velMediaVeic();
  const linhas = itens.map(item=>{
    const c = crmDe(item);
    const isVeic = c.esp ? baseDe(c.esp)==="K" : CAT_VEICULO.includes(c.cat);
    const unidade = isVeic ? "km" : "h";
    const conv = isVeic ? vmed : 1;
    const qtdDim = fPlano[item] || 0;
    const hTot   = hPlano[item] || 0;
    const ov = FROTA[item] || {};
    const qtd  = ov.qtd!=null  ? num(ov.qtd)  : qtdDim;
    const hEq  = ov.hmes!=null ? num(ov.hmes) : (qtdDim>0 ? hTot/qtdDim : 0);
    const horasPrev = qtd*hEq;
    // horas do plano são obrigatórias; o que exceder é frota parada/reserva
    const horas = Math.max(horasPrev, hTot);
    const horasExced = Math.max(0, horas - hTot);
    const baseUso = horas*conv, baseExced = horasExced*conv, baseOper = hTot*conv;
    const det = {}; CRM_COMP.forEach(k=> det[k] = c[k]*baseUso);
    const mb = modeloNaBase(item);
    return {item, cat:c.cat, esp:c.esp, baseProp:mb.np, baseTerc:mb.n-mb.np, naBase:mb.n>0, unidade, conv, qtdDim, hTotPlano:hTot, qtd, hEq, horasPrev, horas, horasExced,
            baseUso, baseExced, rh:c.total, det, total: c.total*baseUso,
            crmOper: c.total*baseOper, crmExced: c.total*baseExced,
            extra: Math.max(0, qtd-qtdDim)};
  });
  return {linhas, total: linhas.reduce((s,l)=>s+l.total,0),
          oper: linhas.reduce((s,l)=>s+l.crmOper,0),
          exced: linhas.reduce((s,l)=>s+l.crmExced,0), hPlano};
}


export { AG_SEM_FROTA, CAT_VEICULO, MAQ_CAMPOS, baseDe, maqDe, CRM_COMP, CRM_LABEL, FROTA_AG, FROTA_AGS, FROTA_ESP, INFO_MODELO, SEP_MOD,
         agDeLinha, agsCRM, chaveDoModelo, contaOrigem, crmDasUnidades, crmDe, crmUnDe, destinoDe, crmDetalhe, crmEspDe, crmFrota, crmHora, espDe, frotaPorItem,
         horasPorItem, modDe, modeloNaBase, rotuloItem, unidadesDoModelo, velMediaVeic };

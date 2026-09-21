/* ================== BASE FÍSICA DOS CUSTOS UNITÁRIOS ==================
   Toda tela que mostra custo por hectare ou por tonelada divide pelo que está
   aqui. A base vem das premissas da aba Premissas, bloco "Base física dos
   custos":

     plantio      Área de plantio (ha)
     planta       Área de tratos culturais — cana planta (ha)
     soca         Área de tratos culturais — cana soca (ha)
     colheitaHa   Área de colheita (ha)
     colheita     Volume estimado de colheita (t)

   Premissa em branco (ou zero) não é "zero hectares": é "não informado". Aí a
   base cai no que o plano sabe — a soma dos hectares ou toneladas lançados nas
   atividades — e a base volta marcada com fonte:"atividades", para a tela
   dizer de onde veio o número. A aba Validação lista o que falta informar.

   Antes, toda tela dividia pela soma das atividades: dez operações no mesmo
   talhão contavam dez hectares, e o custo por hectare saía dez vezes menor. */
import { P } from '../nucleo/estado.js';
import { brl, fmt, num } from '../nucleo/formato.js';

const PREMISSAS_BASE = {
  plantio:    {campo:"plantio",        un:"ha", rot:"ha plantados",      nome:"Área de plantio"},
  planta:     {campo:"haTratosPlanta", un:"ha", rot:"ha de cana planta", nome:"Área de tratos culturais — cana planta"},
  soca:       {campo:"haTratosSoca",   un:"ha", rot:"ha de cana soca",   nome:"Área de tratos culturais — cana soca"},
  colheitaHa: {campo:"haColheita",     un:"ha", rot:"ha colhidos",       nome:"Área de colheita"},
  colheita:   {campo:"tonColheita",    un:"t",  rot:"t colhidas",        nome:"Volume estimado de colheita"},
};

// valor informado na premissa, ou null quando em branco
function premissaBase(id){
  const v = num(P[PREMISSAS_BASE[id].campo]);
  return v>0 ? v : null;
}
const dePremissa = (id, q) => ({q, un:PREMISSAS_BASE[id].un, rot:PREMISSAS_BASE[id].rot, fonte:"premissa", id});

/* Base de uma operação. `estimado` é o que as atividades somam — usado só
   quando a premissa não foi informada. Tratos de cana planta, sem premissa
   própria, usa a área de plantio: a cana planta é a área que foi plantada. */
function baseOperacao(id, estimado){
  const v = premissaBase(id);
  if(v) return dePremissa(id, v);
  if(id==="planta" && premissaBase("plantio")) return {...dePremissa("plantio", premissaBase("plantio")), rot:"ha plantados"};
  return {...estimado, fonte:"atividades"};
}

/* Base de uma etapa inteira do plano. Plantio pela área de plantio, tratos
   pela área de cana planta + soca, colheita pelo volume colhido. Preparo de
   solo e apoio não têm premissa de área: seguem na soma das atividades. */
function baseEtapa(R, etapa){
  const d = R.etapas[etapa] || {};
  const est = d.ha>0 ? {q:d.ha, un:"ha", rot:"ha operados"} : {q:d.ton||0, un:"t", rot:"t"};
  if(etapa==="PLANTIO")  return baseOperacao("plantio", est);
  if(etapa==="COLHEITA") return comAlternativa(baseOperacao("colheita", est));
  if(etapa==="TRATOS CULTURAIS"){
    const pl = baseOperacao("planta", {}), so = premissaBase("soca");
    // só vira área física quando as duas culturas têm área: somar premissa com
    // passadas de atividade misturaria duas medidas
    if(pl.fonte==="premissa" && so) return {q:pl.q+so, un:"ha", rot:"ha de cana planta + soca", fonte:"premissa"};
    return {...est, fonte:"atividades"};
  }
  return {...est, fonte:"atividades"};
}

// colheita também por hectare colhido, quando a área foi informada
function comAlternativa(b){
  const ha = premissaBase("colheitaHa");
  return ha ? {...b, alt:dePremissa("colheitaHa", ha)} : b;
}

/* Custo unitário escrito: "R$ 62,26/t", e na colheita com área informada
   "R$ 62,26/t · R$ 4.520,00/ha colhido". */
function custoUnit(v, b, casas=2){
  if(!b || !(b.q>0)) return "—";
  let s = brl(v/b.q, casas)+"/"+b.un;
  if(b.alt && b.alt.q>0) s += " · "+brl(v/b.alt.q, casas)+"/ha colhido";
  return s;
}
// a base escrita, com a origem quando não é premissa
const rotuloBase = b => !b ? "—" : fmt(b.q)+" "+(b.rot||b.un)+(b.fonte==="atividades" ? " (soma das atividades)" : "");

export { PREMISSAS_BASE, baseEtapa, baseOperacao, comAlternativa, custoUnit, premissaBase, rotuloBase };

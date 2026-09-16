import { CFG } from '../dados/cfg.js';
import { FROTA_ORIG } from '../nucleo/estado.js';
import { CRM_COMP, SEP_MOD, crmDe, crmEspDe, crmUnDe, destinoDe, modDe } from './crm.js';

/* ================== PLANEJAMENTO DE MANUTENCAO ==================
   Recorta da frota so o que vai rodar na safra e responde duas perguntas:
   quanto ja esta orcado, e o que falta orcar.

   A aba Manutencao de Frota e o cadastro -- tem a frota inteira, incluindo o
   que vai para a bancada e o que fica parado, e serve para lancar taxa em
   qualquer nivel. Este modulo e o trabalho: a lista do que efetivamente vai
   rodar, com o buraco de orcamento a vista. */

/**
 * Taxa em vigor de um modelo e de onde ela veio, da mais especifica para a mais
 * generica. A ultima e a do arquetipo do plano: a classe que representa este
 * modelo no dimensionamento (`Trator 4x4 230 CV` para o JOHN DEERE 7230J) ja
 * tem taxa desde sempre, e e ela que esta custando hoje. Ignora-la faria a aba
 * anunciar que a frota inteira esta sem taxa, o que nao e verdade.
 */
function taxaDoModelo(chave, esp){
  const c = crmDe(chave);
  if(c.total > 0) return {total: c.total, comp: c, origem: c.daFrota ? "frota" : "modelo"};
  const e = crmEspDe(esp);
  if(e.total > 0) return {total: e.total, comp: e, origem: e.daFrota ? "frota" : "especialidade"};
  const arq = arquetipoDoModelo(chave, esp);
  if(arq) return {total: arq.taxa, comp: arq.comp, origem: "plano", item: arq.item};
  return {total: 0, comp: c, origem: null};
}

/** Item do plano que declara representar este modelo, se houver e se tiver taxa. */
function arquetipoDoModelo(chave, esp){
  const mod = chave.slice(chave.indexOf(SEP_MOD) + SEP_MOD.length);
  for(const item of Object.keys(CFG.crm)){
    const d = CFG.crm[item];
    if(d.esp !== esp || modDe(item) !== mod) continue;
    const comp = crmDe(item);
    if(comp.total > 0) return {item, taxa: comp.total, comp};
  }
  return null;
}

function manutencao(){
  const anoAtual = new Date().getFullYear();
  const esps = [];
  let unidades = 0, orcadas = 0, semTaxa = 0, somaIdade = 0, comIdade = 0;

  (CFG.frota_base || []).forEach(e=>{
    const mods = [];
    let nEsp = 0, orcEsp = 0;

    e.mods.forEach(m=>{
      let un = (m.un || []).filter(u => destinoDe(u[0]) === "roda");
      if(FROTA_ORIG !== "todos"){
        un = un.filter(u => FROTA_ORIG === "proprio" ? u[2] === 1 : u[2] === 0);
      }
      if(!un.length) return;

      const chave = e.esp + SEP_MOD + m.m;
      const taxa = taxaDoModelo(chave, e.esp);
      const linhas = un.map(([cod, ano, prop])=>{
        const c = crmUnDe(cod);
        if(c.preenchida) orcEsp++;
        return {cod, ano, prop, idade: ano ? anoAtual - ano : null,
                crm: c, propria: c.preenchida};
      });
      linhas.forEach(l=>{ if(l.idade != null){ somaIdade += l.idade; comIdade++; } });
      nEsp += linhas.length;

      const idades = linhas.map(l=>l.idade).filter(i=>i != null);
      mods.push({mod: m.m, marca: m.marca, chave, taxa, linhas,
                 orcadas: linhas.filter(l=>l.propria).length,
                 idadeMedia: idades.length ? idades.reduce((a,b)=>a+b,0)/idades.length : null,
                 maisVelho: idades.length ? Math.max(...idades) : null});
    });

    if(!mods.length) return;
    unidades += nEsp; orcadas += orcEsp;
    // Especialidade sem taxa em lugar nenhum entra no plano custando zero
    const semQualquerTaxa = mods.every(m=>m.taxa.total === 0);
    if(semQualquerTaxa) semTaxa += nEsp;

    esps.push({esp: e.esp, grp: e.grp, ag: e.ag, base: e.base, mods,
               unidades: nEsp, orcadas: orcEsp, semTaxa: semQualquerTaxa,
               taxaEsp: crmEspDe(e.esp)});
  });

  esps.sort((a,b)=> b.unidades - a.unidades || a.esp.localeCompare(b.esp));

  return {esps, unidades, orcadas, semTaxa,
          idadeMedia: comIdade ? somaIdade/comIdade : null,
          cobertura: unidades ? orcadas/unidades : 0,
          comTaxa: unidades - semTaxa};
}

export { manutencao, taxaDoModelo };

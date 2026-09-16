import { NM } from '../nucleo/calendario.js';
import { tpessLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== TRANSPORTE DE PESSOAL ================== */
function transpPessoal(MP){
  const linhas = tpessLista().map(t=>{
    const dias   = num(t.diasMes)*NM;
    const kmRota = num(t.qtd)*num(t.kmDia)*dias;
    const cKm    = kmRota*num(t.rsKm);
    const cDiaria= num(t.qtd)*num(t.diaria)*dias;
    const kmEx   = num(t.kmExtra)*NM;
    const cExtra = kmEx*num(t.rsKmExtra);
    return {...t, dias, kmRota, cKm, cDiaria, kmEx, cExtra,
            lugares: num(t.qtd)*num(t.cap),
            total: cKm+cDiaria+cExtra};
  });
  return {linhas,
    total:   linhas.reduce((s,l)=>s+l.total,0),
    km:      linhas.reduce((s,l)=>s+l.kmRota+l.kmEx,0),
    veic:    linhas.reduce((s,l)=>s+num(l.qtd),0),
    lugares: linhas.reduce((s,l)=>s+l.lugares,0),
    cKm:     linhas.reduce((s,l)=>s+l.cKm,0),
    cDiaria: linhas.reduce((s,l)=>s+l.cDiaria,0),
    cExtra:  linhas.reduce((s,l)=>s+l.cExtra,0)};
}

/* ================== CRM POR FROTA PREVISTA ================== */

export { transpPessoal };

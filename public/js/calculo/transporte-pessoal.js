import { MESES, NM_PER, periodoMes } from '../nucleo/calendario.js';
import { tpessLista } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== TRANSPORTE DE PESSOAL ==================
   A rota é projetada em dois blocos, safra e entressafra: na safra roda mais
   ônibus, mais dias e mais quilômetro extra que na parada. Os campos base da
   rota são os da safra; `ent` guarda o que muda na entressafra e, em branco,
   herda a safra -- que é como o cadastro antigo se comporta, sem mexer em
   nenhum valor já lançado.

   Preço (R$/km, diária, R$/km extra) é contrato e vale para o ano inteiro. */

const CAMPOS_PERIODO = ["qtd","kmDia","diasMes","kmExtra"];

/** Valor de um campo da rota no período pedido. */
function campo(t, f, per){
  if(per === "safra") return num(t[f]);
  const v = (t.ent || {})[f];
  return v != null && v !== "" ? num(v) : num(t[f]);
}

/** Custo de uma rota num período, com os meses daquele período. */
function bloco(t, per){
  const meses = NM_PER[per];
  const qtd = campo(t,"qtd",per), kmDia = campo(t,"kmDia",per);
  const dias = campo(t,"diasMes",per) * meses;
  const kmRota = qtd * kmDia * dias;
  const kmEx = campo(t,"kmExtra",per) * meses;
  const cKm = kmRota * num(t.rsKm);
  const cDiaria = qtd * num(t.diaria) * dias;
  const cExtra = kmEx * num(t.rsKmExtra);
  const total = cKm + cDiaria + cExtra;
  return {per, meses, qtd, kmDia, diasMes: campo(t,"diasMes",per), kmExtra: campo(t,"kmExtra",per),
          dias, kmRota, kmEx, cKm, cDiaria, cExtra,
          lugares: qtd * num(t.cap), total, mensal: meses>0 ? total/meses : 0};
}

function transpPessoal(MP){
  const linhas = tpessLista().map(t=>{
    // bSafra/bEnt são os blocos calculados; `t.ent` continua sendo o que o
    // usuário digitou para a entressafra, e sobrevive ao spread
    const bSafra = bloco(t, "safra"), bEnt = bloco(t, "entressafra");
    const soma = k => bSafra[k] + bEnt[k];
    return {...t, bSafra, bEnt,
            // a rota tem tantos veículos quanto o seu pico: é o que precisa existir na frota
            qtdPico: Math.max(bSafra.qtd, bEnt.qtd),
            dias: soma("dias"), kmRota: soma("kmRota"), kmEx: soma("kmEx"),
            cKm: soma("cKm"), cDiaria: soma("cDiaria"), cExtra: soma("cExtra"),
            lugares: Math.max(bSafra.lugares, bEnt.lugares),
            total: soma("total")};
  });
  const porPeriodo = {
    safra:       linhas.reduce((s,l)=>s+l.bSafra.total,0),
    entressafra: linhas.reduce((s,l)=>s+l.bEnt.total,0),
  };
  /* Custo de cada MÊS: as rotas rodam igual em todo mês do período (o bloco é
     o mensal × os meses do período), então cada mês da entressafra recebe o
     mensal da entressafra, e cada mês da safra, o da safra. Antes o total do
     ano ia para os meses pela área operada -- dezembro, com mais área, levava
     metade do transporte da entressafra, e março quase nada. */
  const porMes = {
    safra:       NM_PER.safra>0 ? porPeriodo.safra/NM_PER.safra : 0,
    entressafra: NM_PER.entressafra>0 ? porPeriodo.entressafra/NM_PER.entressafra : 0,
  };
  return {linhas,
    total:   linhas.reduce((s,l)=>s+l.total,0),
    km:      linhas.reduce((s,l)=>s+l.kmRota+l.kmEx,0),
    veic:    linhas.reduce((s,l)=>s+l.qtdPico,0),
    lugares: linhas.reduce((s,l)=>s+l.lugares,0),
    cKm:     linhas.reduce((s,l)=>s+l.cKm,0),
    cDiaria: linhas.reduce((s,l)=>s+l.cDiaria,0),
    cExtra:  linhas.reduce((s,l)=>s+l.cExtra,0),
    porPeriodo, porMes,
    mes: MESES.map((_,i)=>porMes[periodoMes(i)])};
}

export { CAMPOS_PERIODO, campo, transpPessoal };

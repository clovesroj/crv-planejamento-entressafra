import { P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== TRANSPORTE E TRANSBORDO (dimensionamento) ================== */

/* Parâmetros de cada tipo de composição.
   Caminhão canavieiro (modo "caminhao": CO02, PL02): os campos de sempre das
   Premissas (velC, velV, tCarga, tDesc, hDiaTr, dispTr, raioSafra, raioMuda) e
   a capacidade capCam.
   Transbordo (trator, modo "transbordo": CO03, PL03): os seus, em P.trb, e a
   capacidade capTransb (volume útil × densidade). O transbordo anda dentro da
   lavoura, mais devagar e por menos km que o caminhão -- antes os dois usavam
   os mesmos números. Campo do transbordo em branco herda o do caminhão, então
   plano gravado antes da separação não muda número nenhum. */
const BASE_CAM = {velC:"velC", velV:"velV", tCarga:"tCarga", tDesc:"tDesc", hDia:"hDiaTr", disp:"dispTr",
                  raioSafra:"raioSafra", raioMuda:"raioMuda"};
const CAMPOS_TRB = Object.keys(BASE_CAM);
const temValor = v => v!=null && v!=="";
function parTransp(a){
  const ehTrb = !!a && a.modo==="transbordo";
  const T = ehTrb ? (P.trb||{}) : {};
  const v = k => temValor(T[k]) ? num(T[k]) : num(P[BASE_CAM[k]]);
  const o = {tipo: ehTrb ? "transbordo" : "caminhao",
             velC:v("velC"), velV:v("velV"), tCarga:v("tCarga"), tDesc:v("tDesc"),
             hDia:v("hDia"), disp:v("disp"), raioSafra:v("raioSafra"), raioMuda:v("raioMuda"),
             cap: ehTrb ? num(P.capTransb) : num(P.capCam),
             // campo do transbordo que ainda segue o do caminhão
             herdado: k => ehTrb && !temValor(T[k])};
  o.raioDe = src => src==="PL01" ? o.raioMuda : o.raioSafra;   // PL01 = Colheita muda
  return o;
}

/* Tempo de ciclo (h) de uma viagem: ida carregado, volta vazio, carga e descarga,
   com os parâmetros da composição (parTransp). Única fonte da fórmula — o custo
   (atividade.js) e a aba Transporte usam esta mesma função; antes cada um tinha
   a sua cópia, e mudar uma só faria a aba mostrar um ciclo diferente do que
   entra no custo.
   Velocidade zerada (campo apagado durante a edição) dividia por zero e o
   Infinity se espalhava por horas, frota e efetivo em várias abas. Segue a
   convenção do motor para parâmetro <= 0 (ver dispTr, tch): o trecho conta 0,
   e a aba Validação acusa a velocidade zerada. */
function cicloTransporte(raio, par){
  const p = par || parTransp(null);
  const ida   = p.velC>0 ? raio/p.velC : 0;
  const volta = p.velV>0 ? raio/p.velV : 0;
  return ida + volta + (p.tCarga+p.tDesc)/60;
}

function transporte(L, MP){
  // Apenas dimensionamento. O CUSTO do transporte é carregado pelas atividades
  // CO02/PL02/CO03/PL03 (antigas TR1..TR4) no plano operacional — manter
  // aqui também geraria dupla contagem.
  const ciclo = cicloTransporte;
  function bloco(cod){
    const r = L.find(x=>x.a.cod===cod);
    if(!r) return {cod, ton:0,ciclo:0,capDia:0,tonDia:0,frota:0,frotaR:0,viagens:0,horas:0,
                   diesel:0,manut:0,mdo:0,total:0,km:0,litros:0,kmL:0,kmLInf:0,lPorT:0};
    const par  = parTransp(r.a);
    const raio = par.raioDe(r.a.src);
    const cap  = par.cap;
    const c = ciclo(raio, par);
    const capDia = c>0 ? (par.hDia/c)*cap*(par.disp/100) : 0;
    const picoMes = Math.max(...r.meses.map(num), 0);
    const tonDia = P.dias>0 ? picoMes/P.dias : 0;
    // combustível da composição: km das viagens (ida carregado e volta vazio),
    // litros do motor e o km/L que sai deles -- o informado na aba ou, sem ele,
    // o equivalente do consumo da máquina
    const km = r.partes.reduce((s,p)=>s+num(p.km),0), litros = num(r.litros);
    const kmLInf = num((P.kmLTr||{})[cod]);
    return {cod, nome:r.a.nome, tipo:par.tipo, raio, ton:r.total, ciclo:c, capDia, tonDia,
            frota:r.frota, frotaR:r.frotaR, viagens: cap>0?r.total/cap:0,
            horas:r.horas, diesel:r.cDiesel, manut:r.cManut, mdo:r.cMDO,
            total:r.direto, cap, maq:r.a.maq, imp:r.a.imp, km, litros,
            kmL: litros>0 ? km/litros : 0, kmLInf, lPorT: r.total>0 ? litros/r.total : 0};
  }
  const camSafra = bloco("CO02"), camMuda = bloco("PL02");
  const trbSafra = bloco("CO03"), trbMuda = bloco("PL03");
  const blocos = [camSafra,camMuda,trbSafra,trbMuda];
  return {blocos, camSafra, camMuda, trbSafra, trbMuda,
          total: blocos.reduce((s,b)=>s+b.total,0),
          km: blocos.reduce((s,b)=>s+num(b.km),0), litros: blocos.reduce((s,b)=>s+num(b.litros),0),
          diesel: blocos.reduce((s,b)=>s+num(b.diesel),0),
          horas: blocos.reduce((s,b)=>s+b.horas,0),
          frota: blocos.reduce((s,b)=>s+b.frotaR,0)};
}


export { CAMPOS_TRB, cicloTransporte, parTransp, transporte };

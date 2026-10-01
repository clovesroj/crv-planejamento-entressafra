import { P } from '../nucleo/estado.js';
import { num } from '../nucleo/formato.js';

/* ================== TRANSPORTE E TRANSBORDO (dimensionamento) ================== */

/* Tempo de ciclo (h) de uma viagem: ida carregado, volta vazio, carga e descarga.
   Única fonte da fórmula — o custo (atividade.js) e a aba Transporte usam esta
   mesma função; antes cada um tinha a sua cópia, e mudar uma só faria a aba
   mostrar um ciclo diferente do que entra no custo.
   Velocidade zerada (campo apagado durante a edição) dividia por zero e o
   Infinity se espalhava por horas, frota e efetivo em várias abas. Segue a
   convenção do motor para parâmetro <= 0 (ver dispTr, tch): o trecho conta 0,
   e a aba Validação acusa a velocidade zerada. */
function cicloTransporte(raio){
  const ida   = P.velC>0 ? raio/P.velC : 0;
  const volta = P.velV>0 ? raio/P.velV : 0;
  return ida + volta + (P.tCarga+P.tDesc)/60;
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
    const raio = r.a.src==="PL01" ? P.raioMuda : P.raioSafra;   // PL01 = Colheita muda (antigo A02)
    const cap  = r.a.modo==="caminhao" ? P.capCam : P.capTransb;
    const c = ciclo(raio);
    const capDia = c>0 ? (P.hDiaTr/c)*cap*(P.dispTr/100) : 0;
    const picoMes = Math.max(...r.meses.map(num), 0);
    const tonDia = P.dias>0 ? picoMes/P.dias : 0;
    // combustível da composição: km das viagens (ida carregado e volta vazio),
    // litros do motor e o km/L que sai deles -- o informado na aba ou, sem ele,
    // o equivalente do consumo da máquina
    const km = r.partes.reduce((s,p)=>s+num(p.km),0), litros = num(r.litros);
    const kmLInf = num((P.kmLTr||{})[cod]);
    return {cod, nome:r.a.nome, ton:r.total, ciclo:c, capDia, tonDia,
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


export { cicloTransporte, transporte };

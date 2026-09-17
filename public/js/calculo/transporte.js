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
  // TR1..TR4 no plano operacional — manter aqui também geraria dupla contagem.
  const ciclo = cicloTransporte;
  function bloco(cod){
    const r = L.find(x=>x.a.cod===cod);
    if(!r) return {ton:0,ciclo:0,capDia:0,tonDia:0,frota:0,frotaR:0,viagens:0,horas:0,
                   diesel:0,manut:0,mdo:0,total:0};
    const raio = r.a.src==="A02" ? P.raioMuda : P.raioSafra;
    const cap  = r.a.modo==="caminhao" ? P.capCam : P.capTransb;
    const c = ciclo(raio);
    const capDia = c>0 ? (P.hDiaTr/c)*cap*(P.dispTr/100) : 0;
    const picoMes = Math.max(...r.meses.map(num), 0);
    const tonDia = P.dias>0 ? picoMes/P.dias : 0;
    return {nome:r.a.nome, ton:r.total, ciclo:c, capDia, tonDia,
            frota:r.frota, frotaR:r.frotaR, viagens: cap>0?r.total/cap:0,
            horas:r.horas, diesel:r.cDiesel, manut:r.cManut, mdo:r.cMDO,
            total:r.direto, cap};
  }
  const camSafra = bloco("TR1"), camMuda = bloco("TR2");
  const trbSafra = bloco("TR3"), trbMuda = bloco("TR4");
  const blocos = [camSafra,camMuda,trbSafra,trbMuda];
  return {blocos, camSafra, camMuda, trbSafra, trbMuda,
          total: blocos.reduce((s,b)=>s+b.total,0),
          horas: blocos.reduce((s,b)=>s+b.horas,0),
          frota: blocos.reduce((s,b)=>s+b.frotaR,0)};
}


export { cicloTransporte, transporte };

/**
 * Parametros de referencia do transporte de cana.
 *
 * Apenas informativo na aba Transporte: nome, un, val e observacao.
 * Os valores que entram no calculo ficam em PADRAO (padroes.js).
 */

export const TRANSP_PAR = [
  {"nome":"Capacidade do transbordo","un":"t/viagem","val":24,"obs":"Transbordo canavieiro 2 eixos — capacidade típica 22–28 t"},
  {"nome":"Densidade de carga (cana picada)","un":"t/m³","val":0.32,"obs":"Referência de mercado 0,28–0,35 t/m³ para cana picada"},
  {"nome":"Volume útil do transbordo","un":"m³","val":75,"obs":"Confere com a capacidade: Volume x Densidade ≈ Capacidade"},
  {"nome":"Velocidade média carregado","un":"km/h","val":22,"obs":"Estrada rural, carreta cheia"},
  {"nome":"Velocidade média vazio","un":"km/h","val":32,"obs":"Retorno vazio, mais rápido"},
  {"nome":"Tempo de carregamento no campo","un":"min","val":22,"obs":"Tempo da colhedora enchendo o transbordo"},
  {"nome":"Tempo de descarga","un":"min","val":12,"obs":"Descarga na esteira/pátio (safra) ou no viveiro (muda)"},
  {"nome":"Horas efetivas de operação por dia","un":"h","val":20,"obs":"3 turnos, disponibilidade já considerada abaixo"},
  {"nome":"Disponibilidade mecânica do conjunto trator+transbordo","un":"%","val":0.8,"obs":"Mesma referência da frota operacional"},
  {"nome":"Consumo de diesel do conjunto (trator+transbordo)","un":"L/h","val":16,"obs":"Trator tracionando o transbordo"},
  {"nome":"Custo de manutenção de mercado do conjunto","un":"R$/h","val":19,"obs":"Peças, pneus e lubrificantes — referência de mercado"}
];

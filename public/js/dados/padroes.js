
const PADRAO = {
  // agronômicas
  dens:15, tch:60, plantio:2400, arr_ha:8000,
  // operacionais
  hdia:16.8, disp:80, dias:24,
  // turnos e escalas
  diasOper:7, diasTrab:6, hTurno:8,
  // econômicas
  diesel:6.20, arr:2050, adm:420000, imob:95000000, dep:10,
  ipreco:4,                       // % de atualização do preço dos insumos
  // transporte
  capCam:60, densCarga:0.32, volTransb:75, velC:22, velV:32,
  tCarga:22, tDesc:12, hDiaTr:20, dispTr:80, consTr:16, manutTr:19,
  raioSafra:18, raioMuda:9,
  // irrigação
  perdaCarga:15, desnivel:8, rendBomba:70, kwh:0.75, fonte:"Elétrica",
  // manutenção
  hPorMec:450, eqPorAjud:8, colPorLider:6,
  // terceirização
  tercAereaTar:70, tercSistTar:850, tercSistHa:300, tercOutros:0
};


export { PADRAO };

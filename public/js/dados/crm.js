/**
 * CRM — custos de reparo e manutencao, por item de frota.
 *
 * CRM       item -> cat (categoria) e as quatro componentes, em R$/h para
 *           maquinas e R$/km para veiculos: pecas, terc, consumo, lubrif
 * CRM_CATS  categorias na ordem de exibicao
 */

export const CRM_ITENS = {
  "Trator 4x4 230 CV": {"cat":"Máquinas","pecas":12.1,"terc":4.4,"consumo":3.3,"lubrif":2.2},
  "Uniport 3030 / Drone": {"cat":"Máquinas","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3},
  "Trator 4x4 100 CV": {"cat":"Máquinas","pecas":7.15,"terc":2.6,"consumo":1.95,"lubrif":1.3},
  "Trator 4x4 150 CV": {"cat":"Máquinas","pecas":9.35,"terc":3.4,"consumo":2.55,"lubrif":1.7},
  "Colhedora de muda": {"cat":"Máquinas","pecas":30.25,"terc":11,"consumo":8.25,"lubrif":5.5},
  "Colhedora CH570 / John Deere": {"cat":"Máquinas","pecas":41.25,"terc":15,"consumo":11.25,"lubrif":7.5},
  "Conjunto motobomba": {"cat":"Equipamentos","pecas":4.95,"terc":1.8,"consumo":1.35,"lubrif":0.9},
  "Aeronave / Drone (terceiro)": {"cat":"Equipamentos","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "Quadriciclo": {"cat":"Veículos leves","pecas":0.12,"terc":0.04,"consumo":0.03,"lubrif":0.02},
  "Equipe manual": {"cat":"Equipamentos","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "A definir": {"cat":"Equipamentos","pecas":7.7,"terc":2.8,"consumo":2.1,"lubrif":1.4},
  "Caminhão Volvo FMX 540": {"cat":"Veículos pesados","pecas":0.86,"terc":0.31,"consumo":0.23,"lubrif":0.16},
  "Caminhão bombeiro": {"cat":"Veículos pesados","pecas":0.41,"terc":0.15,"consumo":0.11,"lubrif":0.07},
  "Caçamba basculante": {"cat":"Veículos pesados","pecas":0.49,"terc":0.18,"consumo":0.13,"lubrif":0.09},
  "Motoniveladora": {"cat":"Máquinas","pecas":18.7,"terc":6.8,"consumo":5.1,"lubrif":3.4},
  "Pá mecânica / carregadeira": {"cat":"Máquinas","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3},
  "Retroescavadeira": {"cat":"Máquinas","pecas":12.1,"terc":4.4,"consumo":3.3,"lubrif":2.2},
  "Escavadeira hidráulica": {"cat":"Máquinas","pecas":20.9,"terc":7.6,"consumo":5.7,"lubrif":3.8},
  "Veículo leve de apoio": {"cat":"Veículos leves","pecas":0.18,"terc":0.07,"consumo":0.05,"lubrif":0.03},
  "Caminhão comboio": {"cat":"Veículos pesados","pecas":0.37,"terc":0.13,"consumo":0.1,"lubrif":0.07},
  "Caminhão oficina": {"cat":"Veículos pesados","pecas":0.41,"terc":0.15,"consumo":0.11,"lubrif":0.07},
  "Caminhão prancha": {"cat":"Veículos pesados","pecas":0.45,"terc":0.16,"consumo":0.12,"lubrif":0.08},
  "Caminhão munck": {"cat":"Veículos pesados","pecas":0.49,"terc":0.18,"consumo":0.13,"lubrif":0.09},
  "Trator de esteira": {"cat":"Máquinas","pecas":22,"terc":8,"consumo":6,"lubrif":4},
  "Uniport 3030": {"cat":"Máquinas","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3},
  "Drone pulverizador": {"cat":"Equipamentos","pecas":7.7,"terc":2.8,"consumo":2.1,"lubrif":1.4},
  "Adubadora autopropelida": {"cat":"Máquinas","pecas":14.3,"terc":5.2,"consumo":3.9,"lubrif":2.6},
  "Prestador de serviço": {"cat":"Equipamentos","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "Grade controle remoto 20 discos 32\"": {"cat":"Implementos","pecas":8.5,"terc":2,"consumo":1.5,"lubrif":1},
  "Grade intermediária 24 discos": {"cat":"Implementos","pecas":7,"terc":1.8,"consumo":1.2,"lubrif":0.9},
  "Grade leve 16 discos": {"cat":"Implementos","pecas":5,"terc":1.2,"consumo":1,"lubrif":0.7},
  "Subsolador 5 hastes": {"cat":"Implementos","pecas":9,"terc":2.5,"consumo":1.4,"lubrif":1},
  "Plantadora DMB PCP 6.000": {"cat":"Implementos","pecas":14,"terc":4,"consumo":2.5,"lubrif":1.8},
  "Tanque pressurizador Coagril": {"cat":"Implementos","pecas":6,"terc":1.5,"consumo":1.2,"lubrif":0.8},
  "Barra de pulverização 24 m": {"cat":"Implementos","pecas":5.5,"terc":1.4,"consumo":1,"lubrif":0.7},
  "Distribuidor de sólidos": {"cat":"Implementos","pecas":6.5,"terc":1.6,"consumo":1.1,"lubrif":0.8},
  "Distribuidor de cobertura": {"cat":"Implementos","pecas":6,"terc":1.5,"consumo":1,"lubrif":0.8},
  "Transbordo 2 eixos": {"cat":"Implementos","pecas":11,"terc":3,"consumo":2,"lubrif":1.5},
  "Rodotrem canavieiro": {"cat":"Implementos","pecas":13,"terc":3.5,"consumo":2.2,"lubrif":1.6},
  "Carroceria canavieira": {"cat":"Implementos","pecas":9,"terc":2.2,"consumo":1.6,"lubrif":1.1},
  "Cobridor com tanque de aplicação": {"cat":"Implementos","pecas":6,"terc":1.5,"consumo":1.1,"lubrif":0.8},
  "Pulverizador costal": {"cat":"Implementos","pecas":1.2,"terc":0.3,"consumo":0.4,"lubrif":0.2},
  "Ferramental manual": {"cat":"Implementos","pecas":0.8,"terc":0.2,"consumo":0.3,"lubrif":0.1},
  "Carretel / aspersão": {"cat":"Implementos","pecas":7,"terc":2,"consumo":1.3,"lubrif":1},
  "Gotejamento": {"cat":"Implementos","pecas":3,"terc":1,"consumo":0.8,"lubrif":0.5},
  "Barra pingente": {"cat":"Implementos","pecas":5.5,"terc":1.4,"consumo":1,"lubrif":0.7},
  "Carretel + tanque vinhaça": {"cat":"Implementos","pecas":8,"terc":2.3,"consumo":1.5,"lubrif":1.1},
  "Perfuratriz / carroça": {"cat":"Implementos","pecas":6.5,"terc":1.8,"consumo":1.3,"lubrif":0.9},
  "Pulverizador costal pressurizado": {"cat":"Implementos","pecas":1.8,"terc":0.5,"consumo":0.5,"lubrif":0.3}
};

export const CRM_CATS = [
  "Veículos pesados",
  "Máquinas",
  "Equipamentos",
  "Veículos leves",
  "Implementos"
];

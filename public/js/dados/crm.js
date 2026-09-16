/**
 * CRM — custos de reparo e manutencao, por item de frota.
 *
 * CRM       item -> cat (categoria), esp (especialidade da base de frota) e as
 *           quatro componentes, em R$/h para maquinas e R$/km para veiculos:
 *           pecas, terc, consumo, lubrif
 * CRM_CATS  categorias na ordem de exibicao
 *
 * `esp` liga o arquetipo do planejamento a especialidade correspondente em
 * dados/frota-base.js, e serve para agrupar — nao altera taxa nenhuma. Item de
 * servico ou mao de obra nao tem frota, logo nao tem especialidade.
 */

export const CRM_ITENS = {
  "Trator 4x4 230 CV": {"cat":"Máquinas","esp":"TRATOR - TRANSBORDO","pecas":12.1,"terc":4.4,"consumo":3.3,"lubrif":2.2,"mod":"JOHN DEERE 7230J"},
  "Uniport 3030 / Drone": {"cat":"Máquinas","esp":"MAQUINA - UNIPORT","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3,"mod":"JACTO 3030"},
  "Trator 4x4 100 CV": {"cat":"Máquinas","esp":"TRATOR - AGRICOLA","pecas":7.15,"terc":2.6,"consumo":1.95,"lubrif":1.3},
  "Trator 4x4 150 CV": {"cat":"Máquinas","esp":"TRATOR - AGRICOLA","pecas":9.35,"terc":3.4,"consumo":2.55,"lubrif":1.7},
  "Colhedora de muda": {"cat":"Máquinas","esp":"COLHEDORA - CANA","pecas":30.25,"terc":11,"consumo":8.25,"lubrif":5.5,"mod":"JOHN DEERE CH570"},
  "Colhedora CH570 / John Deere": {"cat":"Máquinas","esp":"COLHEDORA - CANA","pecas":41.25,"terc":15,"consumo":11.25,"lubrif":7.5,"mod":"JOHN DEERE CH570"},
  "Conjunto motobomba": {"cat":"Equipamentos","esp":"EQUIPAMENTO IRRIG - MOTOR IRRIGACAO","pecas":4.95,"terc":1.8,"consumo":1.35,"lubrif":0.9},
  "Aeronave / Drone (terceiro)": {"cat":"Equipamentos","esp":"DRONE - APLICACAO AEREA","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "Quadriciclo": {"cat":"Veículos leves","esp":"MOTOCICLETA - QUADRICICLO","pecas":3.24,"terc":1.08,"consumo":0.81,"lubrif":0.54,"unERP":"H","mod":"HONDA TRX 420 - HORIMETRO"},
  "Equipe manual": {"cat":"Equipamentos","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "A definir": {"cat":"Equipamentos","pecas":7.7,"terc":2.8,"consumo":2.1,"lubrif":1.4},
  "Caminhão Volvo FMX 540": {"cat":"Veículos pesados","esp":"CAMINHAO - CANAVIEIRO","pecas":0.86,"terc":0.31,"consumo":0.23,"lubrif":0.16,"mod":"VOLVO FMX 540"},
  "Caminhão bombeiro": {"cat":"Veículos pesados","esp":"CAMINHAO - BOMBEIRO","pecas":11.07,"terc":4.05,"consumo":2.97,"lubrif":1.89,"unERP":"H"},
  "Caçamba basculante": {"cat":"Veículos pesados","esp":"CAMINHAO - CACAMBA","pecas":0.49,"terc":0.18,"consumo":0.13,"lubrif":0.09},
  "Motoniveladora": {"cat":"Máquinas","esp":"MAQUINA PESADA - MOTONIVELADORA","pecas":18.7,"terc":6.8,"consumo":5.1,"lubrif":3.4},
  "Pá mecânica / carregadeira": {"cat":"Máquinas","esp":"MAQUINA PESADA - PA CARREGADEIRA","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3},
  "Retroescavadeira": {"cat":"Máquinas","esp":"MAQUINA PESADA - RETROESCAVADEIRA","pecas":12.1,"terc":4.4,"consumo":3.3,"lubrif":2.2},
  "Escavadeira hidráulica": {"cat":"Máquinas","esp":"MAQUINA PESADA - ESCAVADEIRA HIDRAULICA","pecas":20.9,"terc":7.6,"consumo":5.7,"lubrif":3.8},
  "Veículo leve de apoio": {"cat":"Veículos leves","esp":"VEICULO - ASSISTENCIA","pecas":0.18,"terc":0.07,"consumo":0.05,"lubrif":0.03},
  "Caminhão comboio": {"cat":"Veículos pesados","esp":"CAMINHAO - COMBOIO","pecas":9.99,"terc":3.51,"consumo":2.7,"lubrif":1.89,"unERP":"H"},
  "Caminhão oficina": {"cat":"Veículos pesados","esp":"CAMINHAO - OFICINA","pecas":11.07,"terc":4.05,"consumo":2.97,"lubrif":1.89,"unERP":"H"},
  "Caminhão prancha": {"cat":"Veículos pesados","esp":"CAMINHAO - PRANCHA","pecas":0.45,"terc":0.16,"consumo":0.12,"lubrif":0.08},
  "Caminhão munck": {"cat":"Veículos pesados","esp":"CAMINHAO - MUNCK","pecas":13.23,"terc":4.86,"consumo":3.51,"lubrif":2.43,"unERP":"H"},
  "Trator de esteira": {"cat":"Máquinas","esp":"MAQUINA PESADA - TRATOR ESTEIRA","pecas":22,"terc":8,"consumo":6,"lubrif":4,"mod":"CASE A8800"},
  "Uniport 3030": {"cat":"Máquinas","esp":"MAQUINA - UNIPORT","pecas":16.5,"terc":6,"consumo":4.5,"lubrif":3,"mod":"JACTO 3030"},
  "Drone pulverizador": {"cat":"Equipamentos","esp":"DRONE - APLICACAO AEREA","pecas":7.7,"terc":2.8,"consumo":2.1,"lubrif":1.4},
  "Adubadora autopropelida": {"cat":"Máquinas","esp":"MAQUINA - UNIPORT","pecas":14.3,"terc":5.2,"consumo":3.9,"lubrif":2.6},
  "Prestador de serviço": {"cat":"Equipamentos","pecas":0,"terc":0,"consumo":0,"lubrif":0},
  "Grade controle remoto 20 discos 32\"": {"cat":"Implementos","esp":"IMPLEMENTO - GRADAGEM","pecas":8.5,"terc":2,"consumo":1.5,"lubrif":1},
  "Grade intermediária 24 discos": {"cat":"Implementos","esp":"IMPLEMENTO - GRADAGEM","pecas":7,"terc":1.8,"consumo":1.2,"lubrif":0.9},
  "Grade leve 16 discos": {"cat":"Implementos","esp":"IMPLEMENTO - GRADAGEM","pecas":5,"terc":1.2,"consumo":1,"lubrif":0.7},
  "Subsolador 5 hastes": {"cat":"Implementos","esp":"IMPLEMENTO - SUBSOLADOR/CANTERIZADOR","pecas":9,"terc":2.5,"consumo":1.4,"lubrif":1},
  "Plantadora DMB PCP 6.000": {"cat":"Implementos","esp":"IMPLEMENTO - PLANTADORA CANA","pecas":14,"terc":4,"consumo":2.5,"lubrif":1.8,"mod":"DMB PCP6000"},
  "Tanque pressurizador Coagril": {"cat":"Implementos","esp":"REBOQUE - TANQUE","pecas":0.222222,"terc":0.055556,"consumo":0.044444,"lubrif":0.02963,"unERP":"K"},
  "Barra de pulverização 24 m": {"cat":"Implementos","esp":"IMPLEMENTO - APLIC. INSETICIDA","pecas":5.5,"terc":1.4,"consumo":1,"lubrif":0.7},
  "Distribuidor de sólidos": {"cat":"Implementos","esp":"IMPLEMENTO - DISTRIBUIDOR ADUBO","pecas":6.5,"terc":1.6,"consumo":1.1,"lubrif":0.8},
  "Distribuidor de cobertura": {"cat":"Implementos","esp":"IMPLEMENTO - DISTRIBUIDOR ADUBO","pecas":6,"terc":1.5,"consumo":1,"lubrif":0.8},
  "Transbordo 2 eixos": {"cat":"Implementos","esp":"REBOQUE - TRANSBORDO","pecas":11,"terc":3,"consumo":2,"lubrif":1.5,"mod":"ANTONIOSI ATA 10500"},
  "Rodotrem canavieiro": {"cat":"Implementos","esp":"REBOQUE - CANAVIEIRO","pecas":0.481481,"terc":0.12963,"consumo":0.081481,"lubrif":0.059259,"unERP":"K"},
  "Carroceria canavieira": {"cat":"Implementos","esp":"REBOQUE - CANAVIEIRO","pecas":0.333333,"terc":0.081481,"consumo":0.059259,"lubrif":0.040741,"unERP":"K","mod":"REBOQUE ST. IZABEL CA"},
  "Cobridor com tanque de aplicação": {"cat":"Implementos","esp":"IMPLEMENTO - COBRIDOR","pecas":6,"terc":1.5,"consumo":1.1,"lubrif":0.8,"mod":"COBRIDOR DMB 2 LINHA"},
  "Pulverizador costal": {"cat":"Implementos","esp":"IMPLEMENTO - HERBIPLUS E BOMBA COSTAL","pecas":1.2,"terc":0.3,"consumo":0.4,"lubrif":0.2},
  "Ferramental manual": {"cat":"Implementos","esp":"IMPLEMENTO - DIVERSOS","pecas":0.8,"terc":0.2,"consumo":0.3,"lubrif":0.1},
  "Carretel / aspersão": {"cat":"Implementos","esp":"EQUIPAMENTO IRRIG - HIDRO ROLL IRRIGACAO","pecas":7,"terc":2,"consumo":1.3,"lubrif":1},
  "Gotejamento": {"cat":"Implementos","esp":"EQUIPAMENTO IRRIG - HIDRO ROLL IRRIGACAO","pecas":3,"terc":1,"consumo":0.8,"lubrif":0.5},
  "Barra pingente": {"cat":"Implementos","esp":"IMPLEMENTO - APLIC. INSETICIDA","pecas":5.5,"terc":1.4,"consumo":1,"lubrif":0.7},
  "Carretel + tanque vinhaça": {"cat":"Implementos","esp":"EQUIPAMENTO IRRIG - HIDRO ROLL IRRIGACAO","pecas":8,"terc":2.3,"consumo":1.5,"lubrif":1.1},
  "Perfuratriz / carroça": {"cat":"Implementos","esp":"IMPLEMENTO - DIVERSOS","pecas":6.5,"terc":1.8,"consumo":1.3,"lubrif":0.9},
  "Pulverizador costal pressurizado": {"cat":"Implementos","esp":"IMPLEMENTO - HERBIPLUS E BOMBA COSTAL","pecas":1.8,"terc":0.5,"consumo":0.5,"lubrif":0.3},
};

export const CRM_CATS = [
  "Veículos pesados",
  "Máquinas",
  "Equipamentos",
  "Veículos leves",
  "Implementos"
];

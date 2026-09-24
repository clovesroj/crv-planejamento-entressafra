// public/js/dados/quadro-ctt.js
//
// Quadro CTT — colaboradores ativos do time de Corte, Transbordo e Transporte
// (CTT). Cadastro de referência, no mesmo espírito de `frota-base.js`: dado que
// vem do ERP e é consultado, não calculado nem gravado pelo app.
//
// Fonte: planilha "QUADRO CTT - FUNCIONARIOS ATIVOS.xlsx", base de 2026-09-22.
// Atualizado à mão a cada nova extração do ERP — sem carga automática por ora.
// Ver public/js/ui/quadro-ctt.js para a tela que lê estes dados.

export const QUADRO_CTT_META = {
  "base": "2026-09-22",
  "file": "QUADRO CTT - FUNCIONARIOS ATIVOS.xlsx",
  "excluir": [],
  "excluir_lab": [],
  "excluir_mat": [],
  "excluir_mat_n": 0
};

// Uma entrada por base carregada, para o card "desde a última base" na tela.
export const QUADRO_CTT_HISTORICO = [
  {
    "d": "2026-09-18",
    "total": 558,
    "com": 492
  },
  {
    "d": "2026-09-22",
    "total": 610,
    "com": 610
  }
];

// Quem entrou, quem saiu e quem mudou de função/gerência/cidade/categoria CNH
// desde a base anterior. Ausente (null) quando não há base anterior para comparar.
export const QUADRO_CTT_MOVIMENTACAO = {
  "prev": "2026-09-18",
  "entered": [
    {
      "n": "Anibal Jose de Santana",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Ronaldo da Silva Barbosa",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Luzia Maria da Conceicao Nascimento",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Pablo Gabriel de Paula Silva",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Welverson Miranda da Silva",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Wilison Gomes da Silva",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jose Marcelo do Nascimento",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Wellington Miranda da Silva",
      "f": "Auxiliar Agrícola",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Ivan Targino da Silva",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jose Francisco Silva de Melo",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Adao Pedro Aparecido da Silva",
      "f": "Operador de Máquinas Agrícolas III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jessica Gomes de Lucena",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Silene Leandro dos Santos",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Denilson Francisco",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Rosivaldo da Silva Queiroz",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Joaquim Divino da Silva",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Edilson Miranda da Silva",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Ricardo Rodrigues dos Santos",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Manoel Santos da Silva",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Adrilene Costa de Castro",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jose Humberto Rodarte",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Rodrigo Gomes Vilarinho",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Evelton Moreira Filho",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Rafael Ferreira da Silva",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Luiz Carlos dos Santos Oliveira",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jose Vagner Vieira Tenorio Ferreira",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Sebastiao Francisco de Souza",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Simone Tereza Silvino",
      "f": "Motorista II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Flavio Caetano dos Santos",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Luciano de Oliveira",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Fabio da Silva Queiroz",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Valter Dutra de Morais Junior",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Luiz Otavio Araujo Borges",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Wallisson Riesco Elias",
      "f": "Motorista II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Plinio Barbosa dos Santos",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Julmar Camargos Goncalves",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Edilson Pereira Maciel Filho",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Emerson Aparecido Menezes da Silva",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Bruna Vieira dos Reis",
      "f": "Motorista II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Maria Divani Vieira da Costa",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Selmo Marques de Oliveira",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Eliedilson Andrade da Silva",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Pedro Marcondes Santana Lima Pereira",
      "f": "Operador de Máquinas Agrícolas II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Helvio Pereira da Silva",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Cristiano Silva Venancio",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Jose Ricardo Costa",
      "f": "Motorista II",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Ricardo Abreu do Nascimento",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Daniel Satirio dos Santos",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Cicero Pereira de Souza",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Denner Paulino de Medeiros",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Antonio Rodrigues Barbosa",
      "f": "Motorista III",
      "g": "Silvio José – Irrigação Localizada"
    },
    {
      "n": "Iranildo Antonio da Silva",
      "f": "Coordenador Agrícola VI",
      "g": "Cartão Ponto Automático"
    }
  ],
  "left": [],
  "moved": []
};

// Função exercida. `l` é o rótulo para tela, `raw` é como vem do ERP (maiúsculas,
// abreviado) — mantido só para conferência/depuração.
export const QUADRO_CTT_FUNCOES = [{"l": "Assistente Agrícola I", "raw": "ASSISTENTE AGRICOLA I"}, {"l": "Auxiliar Agrícola", "raw": "AUXILIAR AGRICOLA"}, {"l": "Coordenador Agrícola III", "raw": "COORDENADOR AGRICOLA III"}, {"l": "Coordenador Agrícola VI", "raw": "COORDENADOR AGRICOLA VI"}, {"l": "Fiscal Agrícola", "raw": "FISCAL AGRICOLA"}, {"l": "Líder Agrícola II", "raw": "LIDER AGRICOLA II"}, {"l": "Líder Agrícola IV", "raw": "LIDER AGRICOLA IV"}, {"l": "Motorista I", "raw": "MOTORISTA I"}, {"l": "Motorista II", "raw": "MOTORISTA II"}, {"l": "Motorista III", "raw": "MOTORISTA III"}, {"l": "Motorista Líder", "raw": "MOTORISTA LIDER"}, {"l": "Operador de Máquinas Agrícolas I", "raw": "OP._MAQUINAS AGR. I"}, {"l": "Operador de Máquinas Agrícolas II", "raw": "OP._MAQUINAS AGR. II"}, {"l": "Operador de Máquinas Agrícolas III", "raw": "OP._MAQUINAS AGR. III"}];

// Agrupamento de funções por família (Motorista I/II/III/Líder vira "Motorista",
// por exemplo). `funcs` é a lista de índices em QUADRO_CTT_FUNCOES.
export const QUADRO_CTT_FAMILIAS = [{"l": "Operador de Máquinas Agrícolas", "funcs": [11, 12, 13]}, {"l": "Motorista", "funcs": [7, 8, 9, 10]}, {"l": "Auxiliar Agrícola", "funcs": [1]}, {"l": "Líder Agrícola", "funcs": [5, 6]}, {"l": "Fiscal Agrícola", "funcs": [4]}, {"l": "Assistente Agrícola", "funcs": [0]}, {"l": "Coordenador Agrícola", "funcs": [2, 3]}];

export const QUADRO_CTT_CIDADES = [{"l": "Canápolis", "raw": "CANAPOLIS"}, {"l": "Capinópolis", "raw": "CAPINOPOLIS"}, {"l": "Ipiaçu", "raw": "IPIACU"}, {"l": "Ituiutaba", "raw": "ITUIUTABA"}];

export const QUADRO_CTT_GERENCIAS = [{"l": "Cartão Ponto Automático", "raw": "CARTÃO PONTO AUTOMÁTICO"}, {"l": "Fábio – Treinamento & Desenv. Operac.", "raw": "FÁBIO - TREINAMENTO & DESENV. OPERAC."}, {"l": "Manoel Leão – Colheita-Muda", "raw": "MANOEL LEÃO - COLHEITA-MUDA"}, {"l": "Manoel Leão – CTT", "raw": "MANOEL LEÃO - CTT"}, {"l": "Manoel Leão – Frente 1", "raw": "MANOEL LEÃO - FRENTE 1"}, {"l": "Manoel Leão – Frente 2", "raw": "MANOEL LEÃO - FRENTE 2"}, {"l": "Manoel Leão – Frente 3", "raw": "MANOEL LEÃO - FRENTE 3"}, {"l": "Manoel Leão – Frente 4", "raw": "MANOEL LEÃO - FRENTE 4"}, {"l": "Manoel Leão – Frente 5", "raw": "MANOEL LEÃO - FRENTE 5"}, {"l": "Manoel Leão – Pátio", "raw": "MANOEL LEÃO - PATIO"}, {"l": "Manoel Leão – Plantio-Mec.", "raw": "MANOEL LEÃO - PLANTIO-MEC."}, {"l": "Mariana – Ônibus CTT", "raw": "MARIANA - ÔNIBUS CTT"}, {"l": "Silvio – Linha Amarela, Pipas, Caçambas", "raw": "SILVIO - LINHA AMARELA, PIPAS, CAÇAMBAS"}, {"l": "Silvio José – Irrigação Localizada", "raw": "SILVIO JOSE - IRRIGAÇÃO LOCALIZADA"}, {"l": "Silvio José – Preparo de Solo", "raw": "SILVIO JOSE - PREPARO DE SOLO"}];

// -1 em `c` (abaixo) significa "sem CNH cadastrada", não índice 0.
export const QUADRO_CTT_CATEGORIAS_CNH = ["AE", "B", "AB", "AD", "E", "D", "AC", "C"];

// m: matrícula · n: nome · f: índice em QUADRO_CTT_FUNCOES ·
// c: índice em QUADRO_CTT_CATEGORIAS_CNH (-1 = sem CNH) ·
// ci: índice em QUADRO_CTT_CIDADES · g: índice em QUADRO_CTT_GERENCIAS
export const QUADRO_CTT_COLABORADORES = [{"m":21982,"n":"Jose Carlos da Silva","f":1,"c":-1,"ci":1,"g":4},{"m":22160,"n":"Iranice Alves Castro","f":1,"c":-1,"ci":1,"g":4},{"m":23838,"n":"Dinair Ramos dos Santos","f":1,"c":-1,"ci":1,"g":6},{"m":25008,"n":"Erivaldo Ferreira de Lima","f":1,"c":-1,"ci":1,"g":5},{"m":25069,"n":"Jose Francisco Oliveira da Silva","f":1,"c":-1,"ci":3,"g":9},{"m":25616,"n":"Anibal Jose de Santana","f":1,"c":-1,"ci":1,"g":13},{"m":25641,"n":"Edvaldo dos Santos Silva","f":1,"c":-1,"ci":3,"g":12},{"m":25811,"n":"Ronaldo da Silva Barbosa","f":1,"c":-1,"ci":3,"g":13},{"m":26402,"n":"Assis Pereira de Araujo","f":1,"c":-1,"ci":1,"g":9},{"m":26670,"n":"Virmondes Duran Duarte Junior","f":1,"c":-1,"ci":3,"g":9},{"m":27091,"n":"Lenilda Marques da Silva Morais","f":1,"c":-1,"ci":3,"g":8},{"m":30053,"n":"Daniel Claudio da Silva","f":1,"c":-1,"ci":1,"g":4},{"m":30065,"n":"Jose Sales","f":1,"c":-1,"ci":1,"g":4},{"m":30181,"n":"Cleudiomar da Silva Santos","f":1,"c":-1,"ci":1,"g":6},{"m":30260,"n":"Josue da Silva","f":1,"c":-1,"ci":1,"g":6},{"m":32840,"n":"Luzia Maria da Conceicao Nascimento","f":1,"c":-1,"ci":1,"g":13},{"m":33054,"n":"Sandoval Celestino de Jesus","f":1,"c":-1,"ci":1,"g":12},{"m":33066,"n":"Pablo Gabriel de Paula Silva","f":1,"c":-1,"ci":3,"g":13},{"m":33108,"n":"Joenes Jeovani Bezerra","f":1,"c":-1,"ci":1,"g":9},{"m":33261,"n":"Marcos da Costa Silva Maximiano","f":1,"c":3,"ci":1,"g":9},{"m":35130,"n":"Welverson Miranda da Silva","f":1,"c":-1,"ci":1,"g":13},{"m":36845,"n":"Andre Miguel Costa Nisrala","f":1,"c":-1,"ci":1,"g":6},{"m":37497,"n":"Wesley Gabriel Correia da Silva","f":1,"c":-1,"ci":3,"g":7},{"m":40435,"n":"Jose Valcir da Silva Pontes","f":1,"c":-1,"ci":3,"g":7},{"m":42195,"n":"Jose Raimundo Silva Matos","f":1,"c":-1,"ci":1,"g":4},{"m":42535,"n":"Wilison Gomes da Silva","f":1,"c":-1,"ci":1,"g":13},{"m":42778,"n":"Pedro Henrique Oliveira Ferreira","f":1,"c":-1,"ci":3,"g":7},{"m":43450,"n":"Martim Luiz dos Santos","f":1,"c":-1,"ci":1,"g":8},{"m":43813,"n":"Jose Marcelo do Nascimento","f":1,"c":-1,"ci":1,"g":13},{"m":44052,"n":"Raylan Silva Souza","f":1,"c":2,"ci":3,"g":9},{"m":44120,"n":"Alvaro Victor Barbosa dos Santos","f":1,"c":-1,"ci":1,"g":5},{"m":44167,"n":"Roni Ferreira Ramos","f":1,"c":-1,"ci":1,"g":6},{"m":44179,"n":"Wedson Miranda da Silva","f":1,"c":-1,"ci":1,"g":5},{"m":44271,"n":"Geovano Isidio dos Santos","f":1,"c":-1,"ci":2,"g":9},{"m":44283,"n":"Anderson Oliveira Santos","f":1,"c":-1,"ci":2,"g":5},{"m":44386,"n":"Rafael Lucas do Nascimento","f":1,"c":-1,"ci":2,"g":5},{"m":44398,"n":"Jonathan Isidio dos Santos","f":1,"c":-1,"ci":2,"g":9},{"m":44507,"n":"Wellington Miranda da Silva","f":1,"c":-1,"ci":1,"g":13},{"m":44805,"n":"Adriciel Cardoso dos Santos","f":1,"c":-1,"ci":3,"g":9},{"m":46449,"n":"Nerison Ipolito da Silveira","f":1,"c":1,"ci":3,"g":7},{"m":46450,"n":"Willian Lima Silva","f":1,"c":-1,"ci":3,"g":8},{"m":46462,"n":"Jaedson Pedro Santos da Silva Junior","f":1,"c":-1,"ci":3,"g":8},{"m":46516,"n":"Natanael dos Santos","f":1,"c":-1,"ci":3,"g":9},{"m":46723,"n":"Joao Batista Franco de Souza","f":1,"c":2,"ci":1,"g":7},{"m":46747,"n":"Rogeria Soares Silva","f":1,"c":-1,"ci":3,"g":7},{"m":46966,"n":"Jose Wellington da Silva Santos Caetano","f":1,"c":-1,"ci":3,"g":8},{"m":47454,"n":"Jose Victor Oliveira da Silva","f":1,"c":-1,"ci":1,"g":9},{"m":47508,"n":"Thiago Henrique Lima Silva","f":1,"c":-1,"ci":3,"g":6},{"m":47510,"n":"Dener Rodrigues de Souza","f":1,"c":-1,"ci":1,"g":5},{"m":47521,"n":"Eberte Eduardo Oliveira Guimaraes","f":1,"c":-1,"ci":1,"g":12},{"m":18788,"n":"Clarindo Rodrigues Xavier","f":12,"c":1,"ci":3,"g":9},{"m":20758,"n":"Eder Linhaes Silva","f":6,"c":5,"ci":1,"g":4},{"m":20760,"n":"Francisco de Assis de Castro Silva","f":13,"c":-1,"ci":1,"g":4},{"m":20783,"n":"Fagner Rodrigues da Silva","f":6,"c":3,"ci":2,"g":12},{"m":20801,"n":"Jose Wilson dos Santos","f":9,"c":0,"ci":3,"g":9},{"m":20837,"n":"Jesusmar Maximiano da Silva","f":13,"c":1,"ci":1,"g":12},{"m":20850,"n":"Jorge Luis Silva Matias","f":9,"c":0,"ci":1,"g":6},{"m":20898,"n":"Ivan Targino da Silva","f":12,"c":-1,"ci":1,"g":13},{"m":20904,"n":"Cleudilson Targino da Silva","f":12,"c":1,"ci":1,"g":4},{"m":20928,"n":"Jose Francisco Silva de Melo","f":9,"c":0,"ci":1,"g":13},{"m":20953,"n":"Fabio Sebastiao Nunes","f":9,"c":4,"ci":1,"g":9},{"m":20989,"n":"Jose Carlos de Araujo Silva","f":13,"c":5,"ci":1,"g":4},{"m":21027,"n":"Sinomar Aparecido Alves","f":12,"c":2,"ci":1,"g":12},{"m":21088,"n":"Adao Pedro Aparecido da Silva","f":13,"c":-1,"ci":1,"g":13},{"m":21106,"n":"Dionata Leonel Amorim Silva","f":13,"c":1,"ci":2,"g":5},{"m":21179,"n":"Sergio Jose Ferreira","f":13,"c":-1,"ci":1,"g":12},{"m":21209,"n":"Claudio Jose da Silva","f":13,"c":0,"ci":1,"g":4},{"m":21222,"n":"Simael Nogueira Siqueira","f":8,"c":5,"ci":1,"g":11},{"m":21362,"n":"Jessica Gomes de Lucena","f":9,"c":0,"ci":1,"g":13},{"m":21386,"n":"Silene Leandro dos Santos","f":12,"c":1,"ci":1,"g":13},{"m":21520,"n":"Joanilson Rodrigues Alves","f":10,"c":0,"ci":1,"g":6},{"m":21532,"n":"Leandro Ribeiro da Silveira","f":5,"c":1,"ci":1,"g":4},{"m":21556,"n":"Ranier Antonio Araujo","f":9,"c":4,"ci":1,"g":12},{"m":21568,"n":"Verinaldo dos Santos Silva","f":9,"c":3,"ci":1,"g":4},{"m":21570,"n":"Silvio Dantas de Medeiros","f":12,"c":2,"ci":1,"g":4},{"m":21581,"n":"Edmar Rodrigues Batista","f":12,"c":0,"ci":2,"g":5},{"m":21600,"n":"Benedito Jose da Silva","f":9,"c":0,"ci":1,"g":9},{"m":21611,"n":"Denilson Francisco","f":9,"c":0,"ci":1,"g":13},{"m":21623,"n":"Jose Dimas da Silva","f":8,"c":0,"ci":2,"g":12},{"m":21635,"n":"Oliveira Jose de Medeiros","f":6,"c":3,"ci":2,"g":5},{"m":21647,"n":"Wellington Oliones Nogueira","f":13,"c":4,"ci":1,"g":9},{"m":21659,"n":"Renato Jose Araujo","f":9,"c":0,"ci":1,"g":9},{"m":21660,"n":"Genivaldo da Silva Queiroz","f":13,"c":5,"ci":1,"g":4},{"m":21672,"n":"Rosivaldo da Silva Queiroz","f":12,"c":1,"ci":1,"g":13},{"m":21726,"n":"Jose Marcio dos Santos","f":9,"c":4,"ci":2,"g":9},{"m":21738,"n":"Sidnei Antonio Moura","f":9,"c":0,"ci":1,"g":9},{"m":21763,"n":"Jose Paulo da Silva","f":13,"c":-1,"ci":1,"g":4},{"m":21775,"n":"Girvaine Jose Teodoro","f":13,"c":3,"ci":1,"g":4},{"m":21799,"n":"Getulio de Jesus Santos","f":13,"c":3,"ci":1,"g":8},{"m":21817,"n":"Erivaldo Silva Mota","f":13,"c":5,"ci":1,"g":12},{"m":21830,"n":"Andre Marcos Pereira Dutra","f":9,"c":0,"ci":2,"g":5},{"m":21842,"n":"Reniel Vieira de Barros","f":9,"c":0,"ci":1,"g":9},{"m":21866,"n":"Jose Claudio Martins","f":12,"c":3,"ci":1,"g":4},{"m":21933,"n":"Joaquim Carlos Santos","f":12,"c":3,"ci":1,"g":4},{"m":22135,"n":"Raimundo Nonato Ferreira dos Santos","f":12,"c":-1,"ci":1,"g":12},{"m":22196,"n":"Jose Fernando de Araujo","f":9,"c":0,"ci":1,"g":9},{"m":22226,"n":"Josmar Silva Souza","f":9,"c":0,"ci":1,"g":4},{"m":22238,"n":"Joaquim Divino da Silva","f":9,"c":0,"ci":1,"g":13},{"m":22275,"n":"Genilson Rodrigues da Silva","f":12,"c":2,"ci":3,"g":9},{"m":22287,"n":"Edilson Miranda da Silva","f":12,"c":2,"ci":1,"g":13},{"m":22299,"n":"Ricardo Rodrigues dos Santos","f":12,"c":2,"ci":1,"g":13},{"m":22305,"n":"Joao Mateus Freitas Lima","f":13,"c":3,"ci":2,"g":5},{"m":22329,"n":"Itamar Bernardes de Aguiar","f":9,"c":0,"ci":1,"g":9},{"m":22354,"n":"Manoel Santos da Silva","f":9,"c":4,"ci":1,"g":13},{"m":22410,"n":"Elizama Caetano Rodrigues","f":9,"c":4,"ci":1,"g":9},{"m":22421,"n":"Adrilene Costa de Castro","f":9,"c":4,"ci":1,"g":13},{"m":22445,"n":"Jose Luciano dos Santos da Conceicao","f":12,"c":2,"ci":1,"g":5},{"m":22457,"n":"Alexandre Elias Santos Silva","f":13,"c":3,"ci":2,"g":5},{"m":22469,"n":"Jose Humberto Rodarte","f":9,"c":0,"ci":1,"g":13},{"m":22500,"n":"Alexandre Serafim de Almeida","f":13,"c":5,"ci":1,"g":4},{"m":22585,"n":"Denner Ralf da Silva","f":13,"c":2,"ci":2,"g":5},{"m":22603,"n":"Ademildo Silveira de Menezes","f":8,"c":5,"ci":1,"g":11},{"m":22639,"n":"Agnaldo Wellington Rodrigues","f":6,"c":0,"ci":1,"g":11},{"m":22652,"n":"Euripedes Matias da Costa","f":12,"c":1,"ci":1,"g":4},{"m":22676,"n":"Sergio Barbosa Pereira","f":13,"c":3,"ci":1,"g":4},{"m":22706,"n":"Joao Maria Felix de Lima","f":9,"c":4,"ci":1,"g":9},{"m":22743,"n":"Jose de Deus Barbosa","f":9,"c":0,"ci":1,"g":12},{"m":22780,"n":"Edson Petraglia","f":9,"c":0,"ci":3,"g":12},{"m":22871,"n":"Osvaldir Euripedes Cota","f":13,"c":5,"ci":3,"g":8},{"m":22925,"n":"Adolfo Silva Goncalves","f":13,"c":-1,"ci":1,"g":6},{"m":22998,"n":"Sergio Vitorino da Fonseca","f":13,"c":3,"ci":3,"g":12},{"m":23188,"n":"Hamilton Mendes da Silva","f":9,"c":0,"ci":3,"g":9},{"m":23218,"n":"Ayton Jose da Silva","f":12,"c":-1,"ci":2,"g":5},{"m":23220,"n":"Rodrigo Gomes Vilarinho","f":12,"c":3,"ci":1,"g":13},{"m":23231,"n":"Hugo Eduardo Felipe dos Santos Oliveira","f":13,"c":3,"ci":2,"g":5},{"m":23280,"n":"Monise Souza Dias","f":6,"c":-1,"ci":1,"g":11},{"m":23334,"n":"Adiel Ribeiro da Silva","f":12,"c":1,"ci":1,"g":4},{"m":23346,"n":"Lucas Ramos da Silva","f":12,"c":-1,"ci":2,"g":5},{"m":23413,"n":"Manoel Tavares da Silva Neto","f":9,"c":0,"ci":3,"g":9},{"m":23449,"n":"Valdeci Barbosa","f":8,"c":0,"ci":2,"g":12},{"m":23450,"n":"Elson Goncalves Aguiar Junior","f":8,"c":3,"ci":1,"g":11},{"m":23462,"n":"Jose Antonio dos Santos Junior","f":12,"c":-1,"ci":1,"g":4},{"m":23516,"n":"Alexandre da Silva Uchoa","f":9,"c":0,"ci":1,"g":0},{"m":23565,"n":"Francisco de Assis de Araujo","f":9,"c":4,"ci":1,"g":9},{"m":23577,"n":"Jeri Adriano Felix de Lima","f":8,"c":0,"ci":1,"g":12},{"m":23607,"n":"Rafael Tano Diniz","f":9,"c":0,"ci":1,"g":9},{"m":23619,"n":"Lucivaldo Soares de Lima","f":9,"c":4,"ci":2,"g":5},{"m":23620,"n":"Manoel Vieira Alves","f":9,"c":0,"ci":1,"g":9},{"m":23632,"n":"Edson da Silva Medeiros","f":8,"c":5,"ci":1,"g":12},{"m":23644,"n":"Elcio Dutra de Moraes","f":9,"c":0,"ci":1,"g":9},{"m":23656,"n":"Evelton Moreira Filho","f":9,"c":0,"ci":1,"g":13},{"m":23668,"n":"Rafael Ferreira da Silva","f":12,"c":2,"ci":1,"g":13},{"m":23681,"n":"Geraldo Ferreira da Silva Neto","f":13,"c":2,"ci":2,"g":5},{"m":23711,"n":"Sidnei Alberto Alves","f":9,"c":0,"ci":3,"g":12},{"m":23723,"n":"Cesar Vieira Martins","f":13,"c":1,"ci":1,"g":4},{"m":23747,"n":"Divino Tomaz dos Santos","f":13,"c":5,"ci":1,"g":12},{"m":23760,"n":"Luiz Carlos dos Santos Oliveira","f":12,"c":1,"ci":1,"g":13},{"m":23802,"n":"Noberto Lourenco da Silva","f":13,"c":1,"ci":1,"g":4},{"m":23840,"n":"Tiago Pereira da Silva","f":12,"c":-1,"ci":1,"g":4},{"m":23966,"n":"Manoel Messias da Silva","f":13,"c":3,"ci":1,"g":9},{"m":24016,"n":"Jose Vagner Vieira Tenorio Ferreira","f":9,"c":0,"ci":1,"g":13},{"m":24030,"n":"Sebastiao Francisco de Souza","f":12,"c":1,"ci":3,"g":13},{"m":24065,"n":"Pedro Henrique Ramos Rodrigues","f":13,"c":-1,"ci":1,"g":6},{"m":24119,"n":"Hobber Denillo Nogueira da Silva","f":13,"c":2,"ci":2,"g":5},{"m":24193,"n":"Simone Tereza Silvino","f":8,"c":5,"ci":1,"g":13},{"m":24200,"n":"Mariana de Araujo Musse","f":6,"c":5,"ci":2,"g":11},{"m":24235,"n":"Flavio Caetano dos Santos","f":9,"c":4,"ci":1,"g":13},{"m":24260,"n":"Honorio Emiliano Filho","f":8,"c":4,"ci":3,"g":11},{"m":24417,"n":"Airton Vicente dos Santos","f":8,"c":3,"ci":3,"g":12},{"m":24430,"n":"Luiz Fernando Martins Cunha","f":12,"c":5,"ci":1,"g":12},{"m":24570,"n":"Warley do Nascimento Barbosa","f":8,"c":5,"ci":1,"g":11},{"m":24600,"n":"Ademar Guilherme de Araujo Junior","f":12,"c":5,"ci":2,"g":12},{"m":24624,"n":"Lucas Felix da Silva","f":13,"c":1,"ci":2,"g":5},{"m":24636,"n":"Melissa Soares da Silva","f":12,"c":1,"ci":1,"g":4},{"m":24648,"n":"Antonio Batista Nascimento","f":12,"c":5,"ci":3,"g":9},{"m":24661,"n":"Fabiano do Nascimento Silva","f":9,"c":4,"ci":1,"g":4},{"m":24673,"n":"Luis Carlos Carvalho","f":9,"c":4,"ci":3,"g":9},{"m":24697,"n":"Paulo Cesar Ramos da Silva","f":12,"c":1,"ci":1,"g":12},{"m":24703,"n":"Marcone Tomaz Flausino Franco","f":12,"c":2,"ci":1,"g":4},{"m":24727,"n":"Luis Fernando de Oliveira","f":12,"c":2,"ci":3,"g":8},{"m":24752,"n":"Roberto Candido Martins","f":9,"c":4,"ci":3,"g":9},{"m":24764,"n":"Helio Carlos de Lima","f":9,"c":4,"ci":3,"g":11},{"m":24776,"n":"Gilberto Candido dos Santos","f":9,"c":4,"ci":3,"g":9},{"m":24788,"n":"Jurandir Ramos","f":9,"c":4,"ci":3,"g":9},{"m":24790,"n":"Silmar Dantas de Medeiros","f":8,"c":5,"ci":1,"g":12},{"m":24843,"n":"Guilherme Alexandre Barbosa","f":12,"c":2,"ci":1,"g":4},{"m":24855,"n":"Luiz Carlos dos Reis","f":13,"c":5,"ci":2,"g":5},{"m":24867,"n":"Marco Antonio Cordeiro Buiatti","f":12,"c":1,"ci":2,"g":5},{"m":24880,"n":"Josival do Carmo dos Santos","f":12,"c":-1,"ci":1,"g":5},{"m":24934,"n":"Francielio Jose de Medeiros","f":12,"c":-1,"ci":1,"g":4},{"m":24946,"n":"Jonas dos Santos Mendonca","f":12,"c":-1,"ci":1,"g":4},{"m":24971,"n":"Erielton de Freitas Pinheiro","f":13,"c":-1,"ci":1,"g":6},{"m":24983,"n":"Paulo da Silva","f":9,"c":0,"ci":3,"g":9},{"m":24995,"n":"Luiz Fernando da Silva","f":13,"c":3,"ci":3,"g":7},{"m":25112,"n":"Anderson Aparecido da Silva Santos","f":13,"c":1,"ci":3,"g":8},{"m":25161,"n":"Luciano de Oliveira","f":9,"c":4,"ci":1,"g":13},{"m":25252,"n":"Felipe Augusto de Azevedo Sant Anna","f":13,"c":3,"ci":3,"g":8},{"m":25318,"n":"Tiago Soares da Silva","f":13,"c":3,"ci":1,"g":6},{"m":25320,"n":"Luiz Carlos Amaro","f":8,"c":1,"ci":1,"g":11},{"m":25367,"n":"Pedro Lazaro de Oliveira Neto","f":8,"c":3,"ci":3,"g":12},{"m":25409,"n":"Marcio Jose Guedes","f":9,"c":0,"ci":3,"g":9},{"m":25422,"n":"Gustavo Freitas Silva","f":13,"c":-1,"ci":3,"g":8},{"m":25434,"n":"Leandro Sena Ribeiro","f":12,"c":2,"ci":3,"g":7},{"m":25562,"n":"Murilo Jorge Rocha do Nascimento","f":6,"c":3,"ci":1,"g":9},{"m":25598,"n":"Jose Geraldo Oliveira dos Santos","f":9,"c":0,"ci":3,"g":8},{"m":25630,"n":"Joabes das Merces Oliveira","f":13,"c":2,"ci":1,"g":12},{"m":25689,"n":"Wemerson Diego Chagas dos Santos","f":12,"c":2,"ci":1,"g":6},{"m":25781,"n":"Jose Ernane Possidonio da Silva","f":12,"c":-1,"ci":3,"g":7},{"m":25793,"n":"Jose Cicero Cardoso da Silva","f":12,"c":1,"ci":3,"g":7},{"m":25847,"n":"Rogerio Alves Fortuoso","f":9,"c":0,"ci":3,"g":9},{"m":25902,"n":"Weslley Aparecido Candido de Lima","f":9,"c":0,"ci":3,"g":9},{"m":25940,"n":"Rubens Fidelis de Araujo","f":9,"c":0,"ci":3,"g":9},{"m":25963,"n":"Fabio da Silva Queiroz","f":12,"c":1,"ci":1,"g":13},{"m":25975,"n":"Valter Dutra de Morais Junior","f":9,"c":0,"ci":1,"g":13},{"m":25999,"n":"Jose da Silva","f":13,"c":5,"ci":3,"g":7},{"m":26074,"n":"Karita Oliveira de Andrade","f":12,"c":3,"ci":3,"g":7},{"m":26086,"n":"Luiz Otavio Araujo Borges","f":12,"c":2,"ci":3,"g":13},{"m":26098,"n":"Ezequiel Vicente dos Santos","f":13,"c":1,"ci":2,"g":5},{"m":26116,"n":"Raul Pereira Alves","f":12,"c":-1,"ci":1,"g":6},{"m":26189,"n":"Jose Jamilton Goncalves","f":13,"c":3,"ci":3,"g":7},{"m":26190,"n":"Antonio Inocencio da Silva","f":12,"c":-1,"ci":1,"g":4},{"m":26207,"n":"Rogerio Lopes de Souza","f":12,"c":2,"ci":1,"g":6},{"m":26244,"n":"Lavozier Manoel Filho","f":8,"c":6,"ci":2,"g":12},{"m":26359,"n":"Joao Batista de Araujo Silva","f":13,"c":1,"ci":1,"g":4},{"m":26372,"n":"Luan Roberto dos Santos","f":13,"c":2,"ci":3,"g":7},{"m":26451,"n":"Nivaldo da Silva","f":13,"c":3,"ci":3,"g":7},{"m":26724,"n":"Rafael Reis Silva","f":13,"c":5,"ci":3,"g":8},{"m":26773,"n":"Wallisson Riesco Elias","f":8,"c":0,"ci":3,"g":13},{"m":26785,"n":"Jackeline Alves da Silva","f":13,"c":2,"ci":3,"g":7},{"m":26797,"n":"Jose Josivaldo dos Santos","f":13,"c":2,"ci":3,"g":8},{"m":26840,"n":"Diogo Marques dos Santos","f":8,"c":3,"ci":1,"g":11},{"m":26852,"n":"Plinio Barbosa dos Santos","f":12,"c":2,"ci":1,"g":13},{"m":26864,"n":"Rildo Jose da Silva","f":12,"c":1,"ci":1,"g":4},{"m":26876,"n":"Rosivaldo Vieira Monteiro","f":9,"c":0,"ci":1,"g":9},{"m":26906,"n":"Makcciel Rodrigues Benevides","f":9,"c":0,"ci":1,"g":9},{"m":26920,"n":"Paulo Jose da Silva","f":8,"c":5,"ci":3,"g":12},{"m":26955,"n":"Julmar Camargos Goncalves","f":9,"c":0,"ci":3,"g":13},{"m":26967,"n":"Jonathan Feliciano de Jesus Nunes","f":12,"c":1,"ci":3,"g":7},{"m":27030,"n":"Genilson Luiz Soares","f":13,"c":2,"ci":1,"g":6},{"m":27108,"n":"Ruanderson Morais da Silva","f":12,"c":2,"ci":3,"g":7},{"m":27133,"n":"Elton Leonel Linhaes","f":13,"c":2,"ci":3,"g":8},{"m":27170,"n":"Joaquim Carvalho da Costa Neto","f":12,"c":2,"ci":3,"g":8},{"m":27182,"n":"Victor Hugo Napolitano Goncalves","f":9,"c":0,"ci":3,"g":9},{"m":27297,"n":"Jose Carlos da Silva Santos","f":13,"c":1,"ci":2,"g":5},{"m":27522,"n":"Rafael Firmino dos Santos","f":12,"c":2,"ci":1,"g":4},{"m":27595,"n":"Edmilson Batista de Araujo","f":9,"c":0,"ci":3,"g":12},{"m":27613,"n":"Jose Elias dos Santos","f":9,"c":4,"ci":1,"g":9},{"m":27686,"n":"Paulo Cesar Goncalves","f":9,"c":0,"ci":3,"g":9},{"m":27698,"n":"Mateus Morais Silva","f":5,"c":1,"ci":0,"g":6},{"m":27819,"n":"Matheus Henrique Xavier Cordeiro","f":12,"c":-1,"ci":3,"g":8},{"m":27844,"n":"Suel Ribeiro Moraes","f":12,"c":3,"ci":2,"g":5},{"m":28083,"n":"Emerson Barbosa Guimaraes","f":5,"c":1,"ci":3,"g":10},{"m":28186,"n":"Manoel Vieira de Souza Neto","f":13,"c":1,"ci":1,"g":4},{"m":28290,"n":"Garibaldi Batista da Silva Junior","f":9,"c":0,"ci":3,"g":9},{"m":28332,"n":"Reginaldo Alves da Silva","f":13,"c":5,"ci":1,"g":12},{"m":28423,"n":"Francisco Jose de Medeiros","f":12,"c":2,"ci":1,"g":4},{"m":28447,"n":"Eronildo Barbosa da Silva","f":12,"c":2,"ci":3,"g":8},{"m":28496,"n":"Wemerson da Luz Lima","f":9,"c":0,"ci":3,"g":9},{"m":28502,"n":"Andriel Ramos Rodrigues","f":12,"c":1,"ci":1,"g":6},{"m":28680,"n":"Joao Batista da Silva","f":13,"c":5,"ci":3,"g":7},{"m":28691,"n":"Francisco da Silva Freitas","f":13,"c":2,"ci":1,"g":6},{"m":28745,"n":"Joao Rodrigues da Costa Neto","f":12,"c":2,"ci":1,"g":6},{"m":28782,"n":"Maicon Douglas de Oliveira Araujo","f":12,"c":3,"ci":1,"g":6},{"m":28964,"n":"Waldiney Justino Ferreira","f":12,"c":1,"ci":1,"g":6},{"m":28988,"n":"Marcos Alberto Vilela","f":9,"c":4,"ci":3,"g":8},{"m":28990,"n":"Andre Fernandes dos Santos","f":13,"c":1,"ci":1,"g":6},{"m":29129,"n":"Edilson Pereira da Silva","f":12,"c":1,"ci":1,"g":6},{"m":29336,"n":"Julio Cesar da Silva Souza Filho","f":9,"c":0,"ci":3,"g":9},{"m":29361,"n":"Joao Vitor Amorim dos Santos","f":13,"c":2,"ci":1,"g":12},{"m":29452,"n":"Leandro Goncalves da Silva","f":12,"c":2,"ci":1,"g":4},{"m":29506,"n":"Cristiano da Silva Brunes","f":8,"c":0,"ci":3,"g":12},{"m":29531,"n":"Lucas Bressane Machado Furtuoso","f":12,"c":2,"ci":2,"g":5},{"m":29579,"n":"Bruno Martins Barros","f":12,"c":2,"ci":3,"g":8},{"m":29749,"n":"Otavio Augusto Martins de Araujo","f":5,"c":-1,"ci":1,"g":9},{"m":29750,"n":"Paulo Henrique Santana Tavares","f":9,"c":4,"ci":1,"g":9},{"m":29762,"n":"Eder de Souza Costa Junior","f":9,"c":0,"ci":3,"g":9},{"m":29828,"n":"Riverson Alves Moreira","f":5,"c":3,"ci":1,"g":6},{"m":29877,"n":"Joander Charles Carvalho Silva","f":13,"c":0,"ci":2,"g":9},{"m":29932,"n":"Lucas Eduardo Mendes","f":12,"c":2,"ci":3,"g":8},{"m":29970,"n":"Divina Maria de Jesus","f":12,"c":5,"ci":3,"g":8},{"m":29981,"n":"Tainara Silvestre de Souza","f":12,"c":1,"ci":1,"g":6},{"m":30028,"n":"Hygor Ryan Santos Alves","f":12,"c":1,"ci":1,"g":12},{"m":30120,"n":"Lucas Henrique Costa Silva","f":12,"c":1,"ci":2,"g":5},{"m":30132,"n":"Claudio Marcio dos Santos","f":13,"c":4,"ci":1,"g":6},{"m":30272,"n":"Janeilson Balbino da Silva","f":13,"c":1,"ci":1,"g":5},{"m":30284,"n":"Marcio Carmo Borges","f":9,"c":4,"ci":3,"g":9},{"m":30326,"n":"Ruan Pablo Souza Castagnoli","f":13,"c":1,"ci":3,"g":7},{"m":30338,"n":"Jose Maria Junior","f":9,"c":0,"ci":3,"g":9},{"m":30363,"n":"Jailton Miguel Pereira da Silva","f":9,"c":0,"ci":1,"g":9},{"m":30521,"n":"Jailton Miguel Pereira da Silva Junior","f":8,"c":3,"ci":1,"g":0},{"m":30612,"n":"Jose Maria da Conceicao","f":8,"c":5,"ci":1,"g":11},{"m":30648,"n":"Cicero dos Santos","f":8,"c":3,"ci":3,"g":12},{"m":30650,"n":"Ronaldo Laurindo Carvalho","f":9,"c":0,"ci":3,"g":9},{"m":30715,"n":"Jose Luiz Pereira da Silva","f":9,"c":4,"ci":3,"g":9},{"m":30727,"n":"Evilasio da Silva Magalhaes","f":9,"c":0,"ci":3,"g":9},{"m":30740,"n":"Ronival Monteiro da Silva","f":12,"c":1,"ci":3,"g":9},{"m":30752,"n":"Christoffer Candido de Morais","f":13,"c":2,"ci":1,"g":7},{"m":30879,"n":"Alan Diego dos Santos Costa","f":13,"c":-1,"ci":3,"g":7},{"m":31203,"n":"Edilson Pereira Maciel Filho","f":12,"c":1,"ci":1,"g":13},{"m":31306,"n":"Everson Rondinerisson Rodrigues da Silva","f":9,"c":0,"ci":1,"g":6},{"m":31379,"n":"Joao Batista Pinheiro","f":12,"c":0,"ci":3,"g":8},{"m":31549,"n":"Romer Rodrigues da Silva","f":8,"c":4,"ci":1,"g":11},{"m":31689,"n":"Luciene Batista dos Santos","f":13,"c":1,"ci":3,"g":8},{"m":32001,"n":"Osvaldo Ferreira de Lima","f":8,"c":0,"ci":1,"g":11},{"m":32049,"n":"Renato Trindade Silva","f":12,"c":3,"ci":1,"g":12},{"m":32128,"n":"Ronilson Lima de Oliveira","f":13,"c":1,"ci":1,"g":6},{"m":32750,"n":"Ronilson Aparecido da Silva","f":8,"c":4,"ci":1,"g":11},{"m":32827,"n":"Elielson Miranda da Silva","f":12,"c":1,"ci":1,"g":5},{"m":32888,"n":"Jucemar Nunes de Medeiros","f":9,"c":4,"ci":3,"g":9},{"m":32967,"n":"Emerson Aparecido Menezes da Silva","f":12,"c":2,"ci":3,"g":13},{"m":33145,"n":"Leandro Cabral de Araujo","f":9,"c":0,"ci":3,"g":9},{"m":33212,"n":"Luiz Fernando da Cruz","f":8,"c":3,"ci":3,"g":12},{"m":33352,"n":"Fabiane Cristina dos Santos","f":9,"c":0,"ci":3,"g":11},{"m":33364,"n":"Erivaldo Cardoso da Silva","f":12,"c":5,"ci":2,"g":12},{"m":33390,"n":"Aurelio Lemes de Araujo","f":13,"c":2,"ci":2,"g":5},{"m":33716,"n":"Claudinei Aparecido dos Santos","f":12,"c":1,"ci":2,"g":5},{"m":33730,"n":"Victor Leandro Vieira Domingues","f":12,"c":2,"ci":3,"g":8},{"m":33741,"n":"Vyvian Rodrigues Domingos","f":13,"c":2,"ci":3,"g":7},{"m":33972,"n":"Kleydson Elias Silva Moura","f":9,"c":0,"ci":3,"g":9},{"m":34009,"n":"Fabio Martins","f":13,"c":1,"ci":1,"g":4},{"m":34060,"n":"Gabriel Igor de Almeida de Souza","f":8,"c":5,"ci":3,"g":12},{"m":34095,"n":"Juliano Francelino de Queiroz","f":12,"c":2,"ci":2,"g":5},{"m":34411,"n":"Adriciano Cardoso dos Santos","f":9,"c":4,"ci":3,"g":9},{"m":34435,"n":"Alexandre Alves Pereira","f":13,"c":2,"ci":3,"g":7},{"m":34605,"n":"Denilson Avelino da Silva","f":9,"c":0,"ci":3,"g":9},{"m":34812,"n":"Alfredo Alves Diniz","f":12,"c":1,"ci":3,"g":8},{"m":34915,"n":"Cicero Messias de Oliveira","f":13,"c":2,"ci":1,"g":9},{"m":35117,"n":"Edilene Conceicao de Oliveira","f":12,"c":3,"ci":3,"g":8},{"m":35129,"n":"Bruna Vieira dos Reis","f":8,"c":5,"ci":1,"g":13},{"m":35142,"n":"Marinaldo da Costa Lima","f":9,"c":0,"ci":3,"g":12},{"m":35166,"n":"Uelton Dutra de Almeida","f":9,"c":0,"ci":1,"g":12},{"m":35385,"n":"Roberto Carlos da Silva","f":5,"c":3,"ci":1,"g":2},{"m":35610,"n":"Henrique Fernando de Lima","f":9,"c":4,"ci":3,"g":9},{"m":35968,"n":"Vilson Rodrigues Santana","f":12,"c":1,"ci":2,"g":5},{"m":36018,"n":"Leociatone Chaves Silva","f":9,"c":4,"ci":3,"g":12},{"m":36043,"n":"Jose Ademir Pereira da Silva","f":9,"c":0,"ci":3,"g":8},{"m":36201,"n":"Wanderley Figueira Coelho Neto","f":12,"c":1,"ci":1,"g":6},{"m":36262,"n":"Jose Lucas de Souza","f":13,"c":2,"ci":1,"g":6},{"m":36341,"n":"Caique Adriano Nunes da Silva","f":13,"c":2,"ci":2,"g":5},{"m":36353,"n":"Douglas Vitor Carneiro de Oliveira","f":9,"c":4,"ci":1,"g":9},{"m":36444,"n":"Amanda Pereira de Souza","f":12,"c":1,"ci":3,"g":8},{"m":36535,"n":"Daiane Francelino Santos da Silva","f":13,"c":3,"ci":3,"g":7},{"m":36596,"n":"Cristiane Faustino da Silva","f":12,"c":2,"ci":3,"g":6},{"m":36626,"n":"Grasielle Araujo Dantas","f":5,"c":2,"ci":3,"g":8},{"m":36638,"n":"Jackeline Aparecida de Souza","f":12,"c":1,"ci":3,"g":8},{"m":36717,"n":"Tatiane Marcelino Vieira","f":8,"c":4,"ci":2,"g":12},{"m":36730,"n":"Maria Divani Vieira da Costa","f":9,"c":0,"ci":3,"g":13},{"m":36742,"n":"Ana Lucia Costa Ferreira","f":8,"c":3,"ci":3,"g":12},{"m":36900,"n":"Irone Jose da Silva","f":13,"c":3,"ci":1,"g":12},{"m":36948,"n":"Marco Antonio Guedes","f":9,"c":0,"ci":3,"g":9},{"m":37217,"n":"Jose Aparecido Oliones Nogueira","f":13,"c":1,"ci":1,"g":6},{"m":37461,"n":"Victor Diogo Francisco","f":8,"c":5,"ci":3,"g":12},{"m":37540,"n":"Victor Hugo Monteiro Silva","f":13,"c":1,"ci":1,"g":12},{"m":37588,"n":"Silvio de Oliveira","f":8,"c":3,"ci":2,"g":12},{"m":38120,"n":"Leandra da Silva Barreto","f":5,"c":1,"ci":1,"g":14},{"m":38131,"n":"Barbara Fernanda Lima Azevedo","f":5,"c":2,"ci":3,"g":9},{"m":38143,"n":"Ana Laura Mamede Nunes","f":5,"c":1,"ci":3,"g":9},{"m":38647,"n":"Charles Henrique Messias Silva","f":12,"c":1,"ci":3,"g":8},{"m":38659,"n":"Renato Bruno Vercosa Barros","f":12,"c":1,"ci":1,"g":4},{"m":38684,"n":"Igor Vilela Macedo","f":9,"c":0,"ci":3,"g":9},{"m":38702,"n":"Geraldo Santos Silva","f":9,"c":0,"ci":3,"g":9},{"m":38726,"n":"Edvaldo Moreira de Araujo","f":9,"c":0,"ci":3,"g":9},{"m":38957,"n":"Kleber Leite da Silva Junior","f":12,"c":5,"ci":3,"g":7},{"m":38969,"n":"Elias de Paulo Pereira","f":9,"c":0,"ci":3,"g":9},{"m":38994,"n":"Paulo Cesar de Faria Junior","f":12,"c":2,"ci":2,"g":5},{"m":39019,"n":"Joao Victor Freitas Guimaraes","f":12,"c":1,"ci":3,"g":7},{"m":39020,"n":"Betaniel Roberto Silva","f":9,"c":0,"ci":3,"g":9},{"m":39032,"n":"Roberval Rosendo da Costa","f":13,"c":1,"ci":3,"g":5},{"m":39070,"n":"Cicero Costa Cordeiro","f":5,"c":0,"ci":1,"g":2},{"m":39081,"n":"Armando Severino da Silva","f":5,"c":2,"ci":1,"g":2},{"m":39123,"n":"Jaqueline Aparecida Costa","f":8,"c":0,"ci":3,"g":12},{"m":39135,"n":"Ivaldo Apolinario de Oliveira Junior","f":12,"c":1,"ci":1,"g":6},{"m":39184,"n":"Edson Euripedes de Souza","f":9,"c":0,"ci":3,"g":9},{"m":39196,"n":"Rodrigo Aparecido Alves da Costa","f":12,"c":1,"ci":3,"g":8},{"m":39238,"n":"Denis Caldeira Calixto","f":9,"c":0,"ci":3,"g":4},{"m":39263,"n":"Elton Candido de Souza","f":13,"c":3,"ci":3,"g":7},{"m":39329,"n":"Jose Francisco Guedes da Silva","f":12,"c":5,"ci":3,"g":8},{"m":39342,"n":"Jose Nilson dos Santos","f":9,"c":0,"ci":3,"g":9},{"m":39380,"n":"Marcelo Matheus Coelho Silva","f":12,"c":5,"ci":3,"g":7},{"m":39410,"n":"Paulo Costa Silva","f":9,"c":0,"ci":3,"g":12},{"m":39457,"n":"Carlos Henrique Silva Oliveira","f":9,"c":4,"ci":3,"g":9},{"m":39469,"n":"Marcio Nogueira Silva","f":12,"c":1,"ci":2,"g":5},{"m":39470,"n":"Andre Aparecido de Castro Avelino","f":9,"c":0,"ci":3,"g":8},{"m":39482,"n":"Vinicius Gomes da Silva","f":9,"c":4,"ci":3,"g":9},{"m":39500,"n":"Valdivino Mendes Carvalho","f":9,"c":0,"ci":3,"g":9},{"m":39512,"n":"Aparecido Carlos da Conceicao Silva","f":9,"c":0,"ci":3,"g":12},{"m":39524,"n":"Claudivino Mendes Pereira","f":9,"c":0,"ci":1,"g":9},{"m":39536,"n":"Thiago de Lima Ferreira","f":9,"c":0,"ci":3,"g":9},{"m":39548,"n":"Selmo Marques de Oliveira","f":9,"c":0,"ci":1,"g":13},{"m":39603,"n":"Eronildo Jose dos Santos","f":9,"c":0,"ci":3,"g":9},{"m":39615,"n":"Paulo Rodrigo Cavalcante Silva","f":9,"c":0,"ci":2,"g":9},{"m":39639,"n":"Gabriela Alves Costa da Silva","f":12,"c":2,"ci":1,"g":5},{"m":39664,"n":"Eliedilson Andrade da Silva","f":9,"c":0,"ci":1,"g":13},{"m":39688,"n":"Pedro Marcondes Santana Lima Pereira","f":12,"c":1,"ci":3,"g":13},{"m":39895,"n":"Helvio Pereira da Silva","f":9,"c":0,"ci":3,"g":13},{"m":39913,"n":"Afranio Julio Pereira Alves","f":12,"c":1,"ci":1,"g":4},{"m":39925,"n":"Wellinton Silva","f":9,"c":0,"ci":0,"g":9},{"m":39949,"n":"Carlos Eduardo Ferreira Silva","f":12,"c":1,"ci":2,"g":5},{"m":39950,"n":"Joseildo Almeida da Silva","f":12,"c":1,"ci":3,"g":7},{"m":39962,"n":"Angelo Douglas Oliveira Santos","f":12,"c":1,"ci":1,"g":4},{"m":39986,"n":"Michael de Freitas Rodrigues","f":12,"c":1,"ci":3,"g":7},{"m":40058,"n":"Paulo Sergio da Silva","f":9,"c":0,"ci":3,"g":9},{"m":40060,"n":"Jose Edvanio Tavares dos Santos","f":9,"c":0,"ci":1,"g":9},{"m":40137,"n":"Jose Adriano da Silva Santos","f":13,"c":2,"ci":1,"g":5},{"m":40204,"n":"Agnaelson Carneiro Baldoino","f":9,"c":0,"ci":0,"g":9},{"m":40228,"n":"Jose Divino Martins de Araujo","f":8,"c":4,"ci":0,"g":12},{"m":40230,"n":"Alex Borges Cardoso","f":8,"c":0,"ci":1,"g":11},{"m":40241,"n":"Pedro Henrique Sousa Santana","f":12,"c":2,"ci":0,"g":6},{"m":40253,"n":"Victor Leonardo Silva","f":12,"c":2,"ci":0,"g":6},{"m":40319,"n":"Robson da Silva","f":12,"c":-1,"ci":3,"g":8},{"m":40320,"n":"Adriano Paulo da Silva","f":12,"c":2,"ci":0,"g":6},{"m":40393,"n":"Jose Henrique Aparecido Venancio","f":9,"c":0,"ci":0,"g":9},{"m":40459,"n":"Tulio Leonardo da Silva","f":12,"c":3,"ci":3,"g":8},{"m":40472,"n":"Eliomar Alves da Silva Santos","f":9,"c":0,"ci":1,"g":9},{"m":40496,"n":"Renucio Antonio de Oliveira","f":9,"c":4,"ci":1,"g":9},{"m":40514,"n":"Cristiano Aparecido de Medeiros Menezes","f":9,"c":0,"ci":3,"g":9},{"m":40538,"n":"Celio Rodrigues Barbosa","f":9,"c":0,"ci":3,"g":11},{"m":40848,"n":"Nilson Borges Medeiros","f":9,"c":0,"ci":0,"g":9},{"m":40915,"n":"Cristiano Silva Venancio","f":9,"c":0,"ci":3,"g":13},{"m":40939,"n":"Fabio Henrique Souza Campos","f":8,"c":3,"ci":3,"g":12},{"m":40952,"n":"Eduardo Martinho da Silva","f":12,"c":0,"ci":0,"g":6},{"m":41038,"n":"Edilson Lino da Silva","f":8,"c":3,"ci":1,"g":12},{"m":41099,"n":"Wagner de Lima Alves","f":8,"c":0,"ci":1,"g":12},{"m":41105,"n":"Antonio Carlos Teixeira","f":9,"c":0,"ci":3,"g":9},{"m":41154,"n":"Jones Marques Santos da Silva","f":12,"c":5,"ci":3,"g":8},{"m":41300,"n":"Jose Pereira Mendes","f":12,"c":2,"ci":1,"g":12},{"m":41415,"n":"Jose Ricardo Costa","f":8,"c":0,"ci":1,"g":13},{"m":41439,"n":"Gian Carlos Rodrigues Malaquias","f":5,"c":2,"ci":1,"g":0},{"m":41506,"n":"Geraldo Faleiros Barbosa Neto","f":12,"c":1,"ci":1,"g":4},{"m":41520,"n":"Renato Batista de Souza","f":9,"c":0,"ci":3,"g":9},{"m":41543,"n":"Alexandre Oliones Nogueira Silva","f":9,"c":4,"ci":1,"g":9},{"m":41555,"n":"Brener Alves da Silva","f":13,"c":2,"ci":1,"g":4},{"m":41567,"n":"Mailon Lourenco Ferreira","f":13,"c":1,"ci":1,"g":4},{"m":41579,"n":"Mateus Henrique Teixeira","f":13,"c":2,"ci":1,"g":6},{"m":41580,"n":"Michael da Silva","f":9,"c":0,"ci":3,"g":9},{"m":41592,"n":"Regis Sebastiao Muniz","f":9,"c":0,"ci":3,"g":8},{"m":41609,"n":"Humberto Pereira Goncalves","f":9,"c":0,"ci":3,"g":9},{"m":41622,"n":"Paulo Fernando da Silva","f":13,"c":5,"ci":1,"g":6},{"m":41634,"n":"Ernandes Pereira da Silva","f":9,"c":0,"ci":1,"g":9},{"m":41660,"n":"Ueslei Alves Silva","f":12,"c":1,"ci":1,"g":6},{"m":41671,"n":"Eduardo Divino Reis","f":8,"c":4,"ci":0,"g":12},{"m":41877,"n":"Jeferson Ferreira Andrade dos Santos","f":12,"c":1,"ci":1,"g":4},{"m":41890,"n":"Severino de Moura Marques","f":12,"c":1,"ci":1,"g":6},{"m":41907,"n":"Joao Paulo Costa","f":9,"c":0,"ci":3,"g":9},{"m":41919,"n":"Ana Paula Ribeiro da Silva","f":12,"c":2,"ci":1,"g":6},{"m":41932,"n":"Franciele Aparecida da Silva Costa","f":12,"c":1,"ci":1,"g":4},{"m":41993,"n":"Gil Cleber Freitas Santos","f":12,"c":2,"ci":2,"g":5},{"m":42020,"n":"Joao Victor Souza de Abreu","f":12,"c":2,"ci":1,"g":6},{"m":42043,"n":"Lucas Gabriel Belarmino da Silva Santos","f":12,"c":1,"ci":1,"g":6},{"m":42080,"n":"Wellington de Oliveira","f":8,"c":3,"ci":3,"g":12},{"m":42092,"n":"Jheyme Quaresma de Melo","f":8,"c":3,"ci":3,"g":12},{"m":42109,"n":"Gilvan Eugenio de Araujo","f":9,"c":0,"ci":1,"g":9},{"m":42110,"n":"Elaine Aparecida Freitas de Sousa","f":12,"c":5,"ci":3,"g":7},{"m":42134,"n":"Jaider Eduardo Santos Silva","f":8,"c":0,"ci":3,"g":12},{"m":42158,"n":"Jose Edenilton Silva Gomes","f":13,"c":4,"ci":1,"g":7},{"m":42160,"n":"Thallyson Kennedy Nascimento Miranda","f":12,"c":1,"ci":3,"g":8},{"m":42183,"n":"Divino dos Reis de Andrade","f":8,"c":0,"ci":3,"g":12},{"m":42201,"n":"Paulo Rivenis Rodrigues","f":8,"c":5,"ci":1,"g":12},{"m":42225,"n":"Ronei Luiz Santos","f":8,"c":5,"ci":2,"g":12},{"m":42237,"n":"Kylmis Dayan Costa Laurentino","f":12,"c":1,"ci":1,"g":5},{"m":42249,"n":"Wender Luis Pereira","f":6,"c":5,"ci":3,"g":0},{"m":42262,"n":"Renata Ferreira Borges","f":8,"c":3,"ci":1,"g":12},{"m":42298,"n":"Igor Henrique da Silva","f":12,"c":2,"ci":3,"g":7},{"m":42304,"n":"Alessandra Vilela Pereira","f":12,"c":1,"ci":3,"g":8},{"m":42316,"n":"Simone Santos Scherer","f":12,"c":2,"ci":3,"g":8},{"m":42328,"n":"Anderson da Silva Barbosa","f":12,"c":1,"ci":3,"g":7},{"m":42330,"n":"Washington Luiz Faria","f":12,"c":-1,"ci":3,"g":8},{"m":42341,"n":"Rafael da Costa Freitas","f":12,"c":3,"ci":3,"g":7},{"m":42353,"n":"Jose Edilson da Silva Bezerra","f":12,"c":1,"ci":3,"g":7},{"m":42365,"n":"Ricardo Silva dos Santos","f":12,"c":1,"ci":1,"g":5},{"m":42377,"n":"Jose Sergio Arantes","f":9,"c":0,"ci":3,"g":9},{"m":42407,"n":"Antonio Francisco da Silva","f":12,"c":2,"ci":3,"g":7},{"m":42717,"n":"Alex Gabriel Dias Albuquerque","f":12,"c":2,"ci":3,"g":8},{"m":42729,"n":"Jose Celio Ramos da Silva","f":13,"c":2,"ci":1,"g":8},{"m":42833,"n":"Sebastiao Pereira Luz","f":9,"c":0,"ci":3,"g":9},{"m":42845,"n":"Genivaldo Caetano dos Santos","f":9,"c":4,"ci":1,"g":9},{"m":42882,"n":"Leandro Camargos Oliveira","f":9,"c":0,"ci":3,"g":9},{"m":42948,"n":"Manoel Alves Vilarinho Neto","f":9,"c":4,"ci":1,"g":9},{"m":42950,"n":"Ricardo Abreu do Nascimento","f":9,"c":0,"ci":3,"g":13},{"m":42985,"n":"Leidiane Aparecida de Assis","f":12,"c":1,"ci":0,"g":6},{"m":43000,"n":"Charles Batista do Carmo","f":9,"c":0,"ci":3,"g":12},{"m":43035,"n":"Felix Blender Silva Soares","f":8,"c":5,"ci":0,"g":11},{"m":43059,"n":"Jean Nonato de Jesus Alves","f":8,"c":3,"ci":3,"g":12},{"m":43060,"n":"Claudlanio Silva de Melo","f":12,"c":1,"ci":1,"g":10},{"m":43072,"n":"Eslander Linhaes Silva","f":5,"c":2,"ci":1,"g":0},{"m":43084,"n":"Kaue Feliciano Laranjeira","f":12,"c":2,"ci":0,"g":6},{"m":43126,"n":"Claudio Marcio dos Santos Junior","f":13,"c":1,"ci":1,"g":7},{"m":43163,"n":"Bruno Guimaraes Bernardes","f":12,"c":1,"ci":3,"g":7},{"m":43217,"n":"Glauco Souza e Silva","f":8,"c":0,"ci":1,"g":11},{"m":43254,"n":"Luiz Carlos Silva dos Santos","f":12,"c":1,"ci":2,"g":5},{"m":43266,"n":"Mathias dos Santos","f":12,"c":2,"ci":1,"g":7},{"m":43280,"n":"Reginaldo de Vasconcelos Barros","f":12,"c":1,"ci":1,"g":6},{"m":43291,"n":"Clayton Alexandre Silva Filho","f":8,"c":5,"ci":1,"g":11},{"m":43321,"n":"Guiliarde Ribeiro de Oliveira","f":13,"c":-1,"ci":1,"g":8},{"m":43370,"n":"Wendson Pereira da Mota","f":9,"c":0,"ci":1,"g":9},{"m":43400,"n":"Adilson Pereira da Silva","f":9,"c":0,"ci":1,"g":9},{"m":43424,"n":"Adeilton dos Santos","f":9,"c":4,"ci":1,"g":9},{"m":43485,"n":"Rodrigo Miranda Junior","f":12,"c":2,"ci":1,"g":4},{"m":43515,"n":"Jose Vieira Filho","f":5,"c":1,"ci":1,"g":0},{"m":43527,"n":"Alef da Silva Brito","f":8,"c":3,"ci":1,"g":11},{"m":43576,"n":"Milton Moura Dutra Junior","f":9,"c":0,"ci":3,"g":9},{"m":43588,"n":"Fabricio Ferreira de Assis","f":8,"c":3,"ci":1,"g":12},{"m":43606,"n":"Edson Oliveira de Lima Filho","f":12,"c":1,"ci":1,"g":6},{"m":43620,"n":"John Lenon de Araujo Silva","f":12,"c":4,"ci":1,"g":4},{"m":43631,"n":"Gizeldo Severino da Silva Santana","f":9,"c":0,"ci":1,"g":9},{"m":43679,"n":"Carlos Eduardo do Nascimento da Silva","f":13,"c":1,"ci":3,"g":7},{"m":43710,"n":"Robson Carlos Silva de Lima","f":9,"c":0,"ci":1,"g":9},{"m":43722,"n":"Daniel Satirio dos Santos","f":9,"c":4,"ci":1,"g":13},{"m":43734,"n":"Jonathan Wesley Mariano da Silva","f":9,"c":0,"ci":1,"g":9},{"m":43746,"n":"Amilton Tenorio Alves","f":8,"c":0,"ci":1,"g":11},{"m":43758,"n":"Pedro Bispo dos Santos","f":13,"c":2,"ci":1,"g":4},{"m":43783,"n":"Isadora Giacomazzi Zucco","f":4,"c":2,"ci":3,"g":9},{"m":43795,"n":"Leticia Menezes Silva","f":4,"c":2,"ci":0,"g":9},{"m":43849,"n":"Jose Divino da Costa","f":8,"c":5,"ci":2,"g":12},{"m":43862,"n":"Paulo Sergio Coqueiro Castro","f":12,"c":2,"ci":1,"g":6},{"m":43916,"n":"Francisco Gregorio de Medeiros","f":9,"c":4,"ci":1,"g":9},{"m":43941,"n":"Elton Luiz de Souza Silva","f":8,"c":3,"ci":1,"g":12},{"m":43953,"n":"Jose Roberto da Silva","f":12,"c":2,"ci":1,"g":5},{"m":43965,"n":"Manoel Andre da Silva","f":9,"c":0,"ci":3,"g":9},{"m":44088,"n":"Diego Silva Santos","f":12,"c":1,"ci":2,"g":5},{"m":44131,"n":"Thiago Augusto de Azevedo","f":9,"c":0,"ci":3,"g":12},{"m":44192,"n":"Joelson Elias de Morais","f":9,"c":4,"ci":3,"g":9},{"m":44209,"n":"Aldenor da Silva Rodrigues","f":13,"c":0,"ci":1,"g":12},{"m":44210,"n":"Cicero Pereira de Souza","f":9,"c":4,"ci":1,"g":13},{"m":44337,"n":"Claiton Eduardo Martins","f":13,"c":3,"ci":1,"g":5},{"m":44349,"n":"Abidias Teixeira de Lima Filho","f":12,"c":1,"ci":1,"g":6},{"m":44453,"n":"Gabriel Shingler de Almeida Silva","f":12,"c":7,"ci":3,"g":8},{"m":44477,"n":"Lais Amario dos Santos","f":5,"c":-1,"ci":1,"g":0},{"m":44519,"n":"Luiz Paulo Silva","f":12,"c":1,"ci":1,"g":5},{"m":44532,"n":"Darlhin Araujo da Silva","f":8,"c":3,"ci":1,"g":12},{"m":44556,"n":"Robson Felix de Jesus","f":9,"c":0,"ci":3,"g":9},{"m":44568,"n":"Enus Ribeiro da Silva","f":9,"c":4,"ci":3,"g":9},{"m":44593,"n":"Cristian Carlos de Araujo","f":9,"c":4,"ci":1,"g":9},{"m":44600,"n":"Geovane Souza Silva","f":9,"c":0,"ci":2,"g":9},{"m":44611,"n":"Denner Paulino de Medeiros","f":9,"c":4,"ci":3,"g":13},{"m":44623,"n":"Lindomar Angelo Targino","f":8,"c":5,"ci":3,"g":12},{"m":44714,"n":"Alecsandro Soares de Albuquerque","f":9,"c":0,"ci":1,"g":9},{"m":44751,"n":"Paulo Cesar de Sousa Alcantara Junior","f":12,"c":3,"ci":3,"g":8},{"m":44763,"n":"Leandro Bezerra da Silva Neto","f":12,"c":2,"ci":1,"g":6},{"m":44775,"n":"Claudene Cosmo Vitalino dos Santos","f":8,"c":4,"ci":3,"g":12},{"m":44854,"n":"Calisson Henrique Silva Dutra","f":12,"c":1,"ci":3,"g":9},{"m":44891,"n":"Carlos Alberto da Silva Santos","f":12,"c":1,"ci":1,"g":12},{"m":44910,"n":"Antonio Rodrigues Barbosa","f":9,"c":0,"ci":3,"g":13},{"m":44933,"n":"Lucas Vinicius Machado","f":12,"c":2,"ci":3,"g":7},{"m":44945,"n":"Anselmo dos Santos Silva","f":12,"c":2,"ci":3,"g":7},{"m":44969,"n":"Paulo Rogerio da Silva","f":12,"c":2,"ci":3,"g":8},{"m":44970,"n":"Alberti Souza Gomes","f":12,"c":1,"ci":1,"g":6},{"m":44982,"n":"Tomaz Franco","f":8,"c":5,"ci":3,"g":12},{"m":44994,"n":"Severino Fernandes da Silva","f":6,"c":0,"ci":3,"g":0},{"m":45007,"n":"Rafael Silva Vilela","f":12,"c":1,"ci":3,"g":7},{"m":45019,"n":"Iracema Nunes da Conceicao","f":8,"c":0,"ci":0,"g":12},{"m":45070,"n":"Marciel Ferreira Moura","f":12,"c":1,"ci":1,"g":7},{"m":45135,"n":"Sivaldo Antonio Marques","f":13,"c":5,"ci":3,"g":12},{"m":45196,"n":"Deonice Maria da Costa","f":8,"c":5,"ci":1,"g":12},{"m":45202,"n":"Cicero da Silva","f":9,"c":4,"ci":1,"g":9},{"m":45214,"n":"Ivan Moura de Sousa Junior","f":9,"c":0,"ci":0,"g":9},{"m":45226,"n":"Rondinele de Souza Barbosa","f":9,"c":0,"ci":3,"g":9},{"m":45240,"n":"Jose Gilvan de Oliveira","f":9,"c":0,"ci":3,"g":9},{"m":45251,"n":"Warley Henrique de Paula","f":13,"c":-1,"ci":1,"g":6},{"m":45287,"n":"Daniel Aparecido Silva","f":9,"c":0,"ci":2,"g":9},{"m":45299,"n":"Edvaldo da Silva Queiroz","f":13,"c":2,"ci":1,"g":4},{"m":45445,"n":"Douglas Cavalcante Silva","f":8,"c":3,"ci":3,"g":12},{"m":45688,"n":"Ana Lucia de Oliveira","f":13,"c":3,"ci":0,"g":6},{"m":45809,"n":"Jhurdy Nycollas Oliveira Castro","f":11,"c":2,"ci":0,"g":1},{"m":45834,"n":"Arilson Oliveira Leal","f":9,"c":0,"ci":3,"g":9},{"m":45860,"n":"Pedro Henrique Manoel Silva","f":9,"c":0,"ci":2,"g":9},{"m":45913,"n":"Euripedes Donizete dos Santos","f":8,"c":0,"ci":1,"g":12},{"m":45925,"n":"Amaro Pereira de Lima Filho","f":6,"c":1,"ci":3,"g":0},{"m":45950,"n":"Rodolfo Araujo Guimaraes","f":8,"c":0,"ci":3,"g":12},{"m":45962,"n":"Celio Carvalho de Moraes","f":8,"c":3,"ci":3,"g":12},{"m":45974,"n":"Uilson Jose dos Santos Silva","f":9,"c":4,"ci":1,"g":9},{"m":46036,"n":"Joao Macedo de Oliveira Neto","f":11,"c":1,"ci":3,"g":1},{"m":46048,"n":"Fabio Santos Lima","f":9,"c":0,"ci":3,"g":9},{"m":46050,"n":"Joao Vitor Francelino dos Santos Silva","f":11,"c":1,"ci":3,"g":1},{"m":46061,"n":"Jean Marcel da Silva","f":11,"c":2,"ci":1,"g":1},{"m":46073,"n":"Marcos Aparecido Dantas","f":12,"c":2,"ci":2,"g":5},{"m":46139,"n":"Pedro Henrique Bezerra Azevedo","f":12,"c":1,"ci":2,"g":5},{"m":46140,"n":"Jonathan Juvino da Silva","f":8,"c":3,"ci":3,"g":12},{"m":46164,"n":"Samuel Henrique Ramos da Silva","f":12,"c":2,"ci":1,"g":4},{"m":46279,"n":"Fabiano dos Santos","f":9,"c":0,"ci":3,"g":9},{"m":46322,"n":"Flavio dos Santos","f":11,"c":1,"ci":3,"g":1},{"m":46346,"n":"Raimundo Vieira dos Santos","f":9,"c":4,"ci":3,"g":9},{"m":46413,"n":"Taciana Santos da Silva","f":11,"c":2,"ci":1,"g":1},{"m":46425,"n":"Aline Joana de Lima","f":11,"c":3,"ci":1,"g":1},{"m":46498,"n":"Noel Gerino Mendes de Souza","f":9,"c":4,"ci":1,"g":9},{"m":46504,"n":"Aldo Ferreira de Sousa Junior","f":12,"c":2,"ci":0,"g":6},{"m":46528,"n":"Gilmar Lazaro da Silva","f":9,"c":0,"ci":1,"g":9},{"m":46530,"n":"Joao Paulo Alves de Almeida","f":8,"c":3,"ci":1,"g":12},{"m":46553,"n":"Luis Fernando da Silva Andrade","f":13,"c":1,"ci":3,"g":7},{"m":46607,"n":"Jessica Bianca dos Santos Goncalves","f":9,"c":0,"ci":2,"g":9},{"m":46620,"n":"Miguel Goncalves de Freitas Gama","f":12,"c":1,"ci":1,"g":4},{"m":46670,"n":"Jose Anderson Domingos da Silva","f":13,"c":2,"ci":3,"g":8},{"m":46700,"n":"Marcos Henrique Assis Filho","f":12,"c":2,"ci":0,"g":5},{"m":46759,"n":"Odair Domingos de Moura","f":9,"c":0,"ci":3,"g":9},{"m":46760,"n":"Jose Sandro da Silva Matias","f":8,"c":3,"ci":3,"g":11},{"m":46814,"n":"Jose Augusto Queiroz dos Santos","f":12,"c":2,"ci":1,"g":7},{"m":46826,"n":"Paulo Henrique de Souza","f":9,"c":4,"ci":1,"g":9},{"m":46851,"n":"Guilherme Uiliam da Silva","f":11,"c":2,"ci":1,"g":1},{"m":46875,"n":"Joao Victor Bressani Vitorino Barra","f":12,"c":2,"ci":1,"g":5},{"m":46887,"n":"Fabricio Fernandes Silva","f":8,"c":5,"ci":1,"g":11},{"m":46978,"n":"Raquel Andrade Silva","f":11,"c":2,"ci":3,"g":1},{"m":46980,"n":"Gabriel Gualberto da Silva","f":12,"c":5,"ci":0,"g":6},{"m":46991,"n":"Adriano de Jesus Silva","f":13,"c":3,"ci":3,"g":8},{"m":47235,"n":"Fernando Luiz Ferreira","f":9,"c":4,"ci":3,"g":1},{"m":47247,"n":"Graziele Viana Prates Custodio","f":12,"c":2,"ci":3,"g":7},{"m":47340,"n":"Joao Augusto Oliveira de Jesus","f":12,"c":2,"ci":1,"g":5},{"m":47351,"n":"Luis Felipe Galvao Vitorino Alves","f":12,"c":1,"ci":3,"g":7},{"m":47363,"n":"Jose Messias dos Santos","f":12,"c":3,"ci":3,"g":7},{"m":47375,"n":"Maxwell Fidelis Bezerra","f":8,"c":5,"ci":3,"g":12},{"m":47399,"n":"Ricardo da Cruz Goncalves","f":8,"c":3,"ci":3,"g":11},{"m":47491,"n":"Wlysses Souza Bertolino","f":9,"c":0,"ci":2,"g":9},{"m":47533,"n":"Valdeni Divino de Freitas","f":8,"c":0,"ci":3,"g":11},{"m":21118,"n":"Iranildo Antonio da Silva","f":3,"c":2,"ci":1,"g":0},{"m":21490,"n":"Manoel Leao dos Santos","f":3,"c":1,"ci":1,"g":0},{"m":32062,"n":"Silvio Jose da Silva","f":2,"c":0,"ci":1,"g":0},{"m":45615,"n":"Thiago Matias Franca","f":7,"c":3,"ci":3,"g":1},{"m":45627,"n":"Maciel da Silva","f":7,"c":3,"ci":3,"g":1},{"m":45639,"n":"Juliana Freitas dos Santos","f":7,"c":3,"ci":3,"g":1},{"m":21349,"n":"Claudevan de Franca","f":0,"c":5,"ci":1,"g":3},{"m":24211,"n":"Amanda Karoline Vieira Borges","f":0,"c":-1,"ci":1,"g":3}];

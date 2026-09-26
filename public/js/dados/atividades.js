/**
 * Cadastro de atividades do plano operacional.
 *
 * 48 atividades. Cada linha e uma operacao agricola ou de transporte.
 *
 * cod    codigo unico (A01..., TR1... para transporte)
 * etapa  PREPARO DE SOLO | PLANTIO | TRATOS CULTURAIS | COLHEITA | APOIO E CONSERVACAO
 * un     unidade de lancamento: "ha/mes" ou "ton/mes"
 * rend   rendimento operacional na unidade/hora
 * maq    maquina base; imp: implemento acoplado
 * ops    operadores por equipamento; turnos: turnos/dia; util: fator de utilizacao
 * tipo   "transp" marca transporte, que puxa o volume da atividade em "src"
 * modo   "caminhao" ou "transbordo" (so em tipo=transp)
 * modoCfg ajusta maquina/implemento/rendimento de um modo de execucao nesta
 *        atividade (todo modo vale para toda atividade, exceto transporte)
 * cultura "Soca" ou "Planta" — usado no rateio de TRATOS CULTURAIS
 * junto  codigo da atividade que executa esta na mesma passada (A39 e A19 vao
 *        na plantadora da A10): a area e a dela, mes a mes, e a mecanizacao
 *        tambem — aqui so entra o tratamento (insumo)
 */

/* Versao do cadastro base de atividades. SOBE em uma unidade sempre que
   atividade nova entrar em ATIVIDADES: e por ela que o documento ja salvo
   sabe que tem atividade nova para receber (calculo/atividade.js mescla na
   leitura, mesmo mecanismo de INSUMOS_V/mesclarBaseInsumos).
     1  cadastro base, 48 atividades (44 originais + A40-A43 da importacao
        de herbicida) — ponto de partida da aba Cadastro de Atividades
     2  A44-A53, Controle Fitossanitario (Broca e Cigarrinha) da planilha
        Plano Inseticida — 58 atividades no total
     3  A02, TR2 e TR4 (muda) passam de COLHEITA para PLANTIO — ver
        CORRECOES_ATIVIDADE abaixo
     4  A22 (Dessecacao, duplicava a A03) sai tambem do documento ja salvo —
        ver REMOCOES_ATIVIDADE abaixo
     5  A39 (adubacao de fundacao) e A19 (tratos fitossanitarios no plantio)
        passam a ir junto com a A10, na plantadora; a A19 vai para PLANTIO
     6  A10 (Plantio) passa de 2 para 1 operador por equipamento: a plantadora
        e de um operador
     7  A54-A63: operacoes que o ERP aponta e o plano nao tinha — limpeza de
        area, sistematizacao, sulcacao, cobricao do plantio manual, plantio com
        semeadeira, maturador, inibidor de florescimento, fungicida,
        micronutrientes e conservacao de estradas e cercas. O codigo de cada uma
        no ERP esta em dados/atividades-erp.js
     8  o codigo interno deixa de ser A01/TR1/AD1/AP1... e passa a ser o mesmo
        que ja era so exibido (PS01, CO01, MF06...) — RENOMEACOES_ATIVIDADE
        abaixo e o de-para, unico e congelado. Antes disso o codigo real
        (chave de PLANO, Dimensionamento, tarifa de terceiro, realizado) e o
        exibido eram dois numeros diferentes por desenho, ver o comentario
        antigo de nucleo/codigo-atividade.js (removido nesta versao: o
        codigo exibido agora E o codigo real, calcula-lo por cima so
        reintroduziria a instabilidade que a camada de exibicao evitava).
        A troca tambem entra nos 6 lugares do motor que comparavam o codigo
        por texto (a.src==="A02" etc. — ver calculo/atividade.js,
        fornecedores.js, modelo-pecege.js, pessoas.js, rastro.js,
        transporte.js) e no de-para do ERP (dados/atividades-erp.js).
   So tirar atividade daqui nao a tira do documento ja salvo (ATVX): ela
   deixa de ser "do sistema" e ganha o botao Remover na aba Cadastro de
   Atividades. Para ela sumir de todo plano gravado, entra tambem em
   REMOCOES_ATIVIDADE e a versao sobe. */
export const ATIVIDADES_V = 8;

/* De-para do codigo antigo para o novo (item 8 acima), aplicado uma vez por
   mesclarBaseAtividades() na virada de versao — mesmo padrao de
   CORRECOES_ATIVIDADE, so que trocando o proprio `cod` em vez de um campo
   qualquer, e por isso cascateando tambem PLANO/DIM/TERC_TAR/TERC_SUB/REAL
   (as chaves que ja dependem do cod da atividade, mesma lista que
   removerAtividadesRetiradas() usa) e os campos `src`/`junto` de QUALQUER
   atividade que apontava para um codigo renomeado. Congelado a partir do
   mapaCodigos() do cadastro de hoje: NAO recalcular depois — e exatamente
   esse recalculo por posicao que o codigo novo deixa de precisar. */
export const RENOMEACOES_ATIVIDADE = {
  A01:"CO01", A02:"PL01", TR1:"CO02", TR2:"PL02", TR3:"CO03", TR4:"PL03", A03:"PS01",
  A04:"PS02", A05:"PS03", A06:"PS04", A07:"PS05", A08:"PS06", A09:"PS07", A10:"PL04",
  A39:"PL05", A11:"TC01", A12:"TC02", A13:"TC03", A14:"TC04", A15:"TC05", A16:"TC06",
  A17:"TC07", A18:"TC08", A19:"PL06", A20:"TC09", A21:"TC10", A23:"TC11", A24:"TC12",
  A25:"TC13", A26:"TC14", A27:"TC15", A28:"TC16", A37:"TC17", A38:"TC18", A30:"TC19",
  A31:"TC20", A32:"TC21", A33:"TC22", A34:"TC23", A35:"TC24", A36:"TC25", AD1:"TC26",
  AD2:"TC27", A29:"AC01", AP1:"AC02", AP2:"AC03", A40:"TC28", A41:"TC29", A42:"TC30",
  A43:"TC31", A44:"MF01", A45:"MF02", A46:"MF03", A47:"MF04", A48:"MF05", A49:"MF06",
  A50:"MF07", A51:"MF08", A52:"MF09", A53:"MF10", A54:"PS08", A55:"PS09", A56:"PL07",
  A57:"PL08", A58:"PL09", A59:"TC32", A60:"TC33", A61:"TC34", A62:"TC35", A63:"AC04",
};

/* Correcao de campo de atividade que JA existe no documento salvo.
   O merge da base so acrescenta atividade nova; nunca mexe em atividade que ja
   esta la, para nao apagar o que o usuario ajustou no Cadastro de Atividades.
   Mas cadastro errado precisa de conserto, e um plano gravado antes nunca o
   receberia. Esta lista e o conserto, aplicado uma vez na virada de versao.

   Muda nao e colheita: cortar, transportar e transbordar muda e etapa de
   PLANTIO -- a cana sai do viveiro para ser plantada, nao para ir a moenda.
   Com a etapa errada, o custo da muda entrava em COLHEITA e o custo por
   tonelada colhida saia inflado, enquanto o plantio saia barato demais. */
export const CORRECOES_ATIVIDADE = [
  {cod:"A02", campo:"etapa", de:"COLHEITA", para:"PLANTIO"},
  {cod:"TR2", campo:"etapa", de:"COLHEITA", para:"PLANTIO"},
  {cod:"TR4", campo:"etapa", de:"COLHEITA", para:"PLANTIO"},
  /* Adubacao de fundacao e inseticida do plantio saem da plantadora, na mesma
     passada do plantio: o adubo no sulco e o inseticida sobre a muda, antes da
     cobricao. Eram tres atividades com tres frotas, tres equipes e tres contas
     de diesel para uma maquina so. Agora a mecanizacao e a da A10, e A39 e A19
     ficam como linhas de tratamento dela (campo `junto`). A A19 acontece no ato
     do plantio, entao e PLANTIO, nao trato de cana planta. */
  {cod:"A39", campo:"junto", de:undefined, para:"A10"},
  {cod:"A19", campo:"junto", de:undefined, para:"A10"},
  {cod:"A19", campo:"etapa", de:"TRATOS CULTURAIS", para:"PLANTIO"},
  /* A plantadora e de UM operador. Com dois, uma frente de 10 conjuntos em tres
     turnos na escala 5x1 pedia 72 operadores onde precisa de 36 -- e pagava os
     72 na folha. */
  {cod:"A10", campo:"ops", de:2, para:1},
];

/* Atividade que saiu do cadastro base e tem de sair tambem do documento ja
   salvo, com o que estiver lancado nela (Plano Operacional, Dimensionamento,
   tarifa de terceiro, realizado) — o mesmo que o botao Remover da aba
   Cadastro de Atividades faz, aplicado na leitura do documento.

   A22 era a Dessecacao em duplicata da A03: mesmo nome, mesma maquina (Uniport
   3030 / Drone), mesma barra de 24 m e o mesmo 1,65 ha/h. A dessecacao do plano
   e a A03. */
export const REMOCOES_ATIVIDADE = ["A22"];

export const ATIVIDADES = [
  {"cod":"CO01","etapa":"COLHEITA","nome":"Colheita safra 2026","un":"ton/mês","rend":45,"maq":"Colhedora CH570 / John Deere","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1},
  {"cod":"PL01","etapa":"PLANTIO","nome":"Colheita muda","un":"ton/mês","rend":35,"maq":"Colhedora de muda","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.6},
  {"cod":"CO02","etapa":"COLHEITA","nome":"Transporte de cana colheita","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Rodotrem canavieiro","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"CO01","modo":"caminhao"},
  {"cod":"PL02","etapa":"PLANTIO","nome":"Transporte de cana muda","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Carroceria canavieira","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"PL01","modo":"caminhao"},
  {"cod":"CO03","etapa":"COLHEITA","nome":"Transbordo colheita","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"CO01","modo":"transbordo"},
  {"cod":"PL03","etapa":"PLANTIO","nome":"Transbordo muda","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"PL01","modo":"transbordo"},
  {"cod":"PS01","etapa":"PREPARO DE SOLO","nome":"Dessecação","un":"ha/mês","rend":1.65,"maq":"Uniport 3030 / Drone","imp":"Barra de pulverização 24 m","ops":1,"turnos":3,"util":0.8},
  {"cod":"PS02","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"PS03","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"PS04","etapa":"PREPARO DE SOLO","nome":"Gradagem leve","un":"ha/mês","rend":1.3,"maq":"Trator 4x4 150 CV","imp":"Grade leve 16 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"PS05","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"PS06","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"PS07","etapa":"PREPARO DE SOLO","nome":"Subsolagem","un":"ha/mês","rend":0.5,"maq":"Trator 4x4 230 CV","imp":"Subsolador 5 hastes","ops":1,"turnos":3,"util":0.9},
  {"cod":"PL04","etapa":"PLANTIO","nome":"Plantio","un":"ha/mês","rend":0.84,"maq":"Trator 4x4 230 CV","imp":"Plantadora DMB PCP 6.000","ops":1,"turnos":2,"util":1},
  {"cod":"PL05","etapa":"PLANTIO","junto":"PL04","nome":"Adubação de fundação","un":"ha/mês","rend":4.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":4.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"TC01","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"TC02","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"TC03","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria pingente","un":"ha/mês","rend":1.8,"maq":"Trator 4x4 150 CV","imp":"Barra pingente","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"TC04","etapa":"TRATOS CULTURAIS","nome":"Bordaduras","un":"ha/mês","rend":1.2,"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","ops":1,"turnos":1,"util":0.6,"cultura":"Soca"},
  {"cod":"TC05","etapa":"TRATOS CULTURAIS","nome":"Catação quadriciclo","un":"ha/mês","rend":1.5,"maq":"Quadriciclo","imp":"Pulverizador costal","ops":1,"turnos":1,"util":0.6,"cultura":"Soca"},
  {"cod":"TC06","etapa":"TRATOS CULTURAIS","nome":"1ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"TC07","etapa":"TRATOS CULTURAIS","nome":"2ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"TC08","etapa":"TRATOS CULTURAIS","nome":"Colheitabilidade","un":"ha/mês","rend":1,"maq":"Equipe manual","imp":"----","ops":0,"turnos":1,"util":0.7,"cultura":"Soca"},
  {"cod":"PL06","etapa":"PLANTIO","junto":"PL04","nome":"Tratos Fitossanitários no Plantio","un":"ha/mês","rend":2.3,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"TC09","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"TC10","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida aéreo","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  {"cod":"TC11","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Planta"},
  {"cod":"TC12","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Planta"},
  {"cod":"TC13","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria muda","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"TC14","etapa":"TRATOS CULTURAIS","nome":"Quebra-lombo","un":"ha/mês","rend":1.1,"maq":"Trator 4x4 100 CV","imp":"Cobridor com tanque de aplicação","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"TC15","etapa":"TRATOS CULTURAIS","nome":"1ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Planta"},
  {"cod":"TC16","etapa":"TRATOS CULTURAIS","nome":"2ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Planta"},
  {"cod":"TC17","etapa":"TRATOS CULTURAIS","nome":"Aplicação de calcário","un":"ha/mês","rend":5.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"TC18","etapa":"TRATOS CULTURAIS","nome":"Aplicação de gesso","un":"ha/mês","rend":5.5,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.5,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"TC19","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"TC20","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel + tanque vinhaça","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"TC21","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"TC22","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"TC23","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional plantio","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"TC24","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"TC25","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"TC26","etapa":"TRATOS CULTURAIS","nome":"Adubação de socaria","un":"ha/mês","rend":1.8,"maq":"Adubadora autopropelida","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"TC27","etapa":"TRATOS CULTURAIS","nome":"Adubação de cobertura","un":"ha/mês","rend":2,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de cobertura","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"AC01","etapa":"APOIO E CONSERVAÇÃO","nome":"Reflorestamento","un":"ha/mês","rend":0.3,"maq":"Trator 4x4 100 CV","imp":"Perfuratriz / carroça","ops":1,"turnos":1,"util":0.4},
  {"cod":"AC02","etapa":"APOIO E CONSERVAÇÃO","nome":"Apoio operacional","un":"ha/mês","rend":2.5,"maq":"Veículo leve de apoio","imp":"----","ops":1,"turnos":2,"util":0.7},
  {"cod":"AC03","etapa":"APOIO E CONSERVAÇÃO","nome":"Auxiliares agrícolas","un":"ha/mês","rend":1.2,"maq":"Equipe manual","imp":"Ferramental manual","ops":1,"turnos":1,"util":0.8},
  /* A40-A43: atividades novas da importação da planilha PLAN.HERB SAFRA 26-27
     (Herbicida Safra 2026 + ENTRE SAFRA 2026) sem equivalente no cadastro
     anterior. rend/maq/imp/turnos/util são ESTIMATIVA a partir da atividade
     mais parecida (indicada em cada uma) — a planilha de origem não informa
     rendimento operacional, só dose e área. Conferir com o time antes de
     tratar como definitivo. */
  {"cod":"TC28","etapa":"TRATOS CULTURAIS","nome":"Bordaduras cana planta (reforço)","un":"ha/mês","rend":1.2,"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","ops":1,"turnos":1,"util":0.6,"cultura":"Planta"},
  {"cod":"TC29","etapa":"TRATOS CULTURAIS","nome":"Catação canto de árvores","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"TC30","etapa":"TRATOS CULTURAIS","nome":"Catação folha larga (drone)","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  {"cod":"TC31","etapa":"TRATOS CULTURAIS","nome":"Aplicação pós-emergência pontual (drone)","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  /* A44-A53: Controle Fitossanitário (Broca e Cigarrinha), da planilha
     "Planejamento Safra 2026" aba "Plano Inseticida". rend/maq/imp são
     estimativa a partir da atividade de aplicação de inseticida mais
     parecida (A20/A21/A42) — a planilha de origem só dá dose e área, não
     rendimento operacional. A
     tarifa de terceiro (R$/ha aéreo e terrestre da planilha) é dado de
     plano, não de cadastro, e entra em TERC_TAR por safra. */
  {"cod":"MF01","etapa":"TRATOS CULTURAIS","nome":"Broca 1ª Cana Planta","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"MF02","etapa":"TRATOS CULTURAIS","nome":"Broca 2ª Cana Planta","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"MF03","etapa":"TRATOS CULTURAIS","nome":"Broca 1ª Soca Muda","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"MF04","etapa":"TRATOS CULTURAIS","nome":"Broca 2ª Soca Muda","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"MF05","etapa":"TRATOS CULTURAIS","nome":"Broca 1ª Aplicação Soca Moagem","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"MF06","etapa":"TRATOS CULTURAIS","nome":"Broca 2ª Aplicação Soca Moagem","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"MF07","etapa":"TRATOS CULTURAIS","nome":"Cigarrinha 1ª Aplicação Terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"MF08","etapa":"TRATOS CULTURAIS","nome":"Cigarrinha 2ª Aplicação Terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"MF09","etapa":"TRATOS CULTURAIS","nome":"Cigarrinha 1ª Aplicação Aérea","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  /* ===== Operacoes que o ERP aponta e o plano nao tinha (ATIVIDADES_V 7) =====
     Rendimento, maquina e implemento sao o padrao de partida, do porte de
     equipamento que a operacao usa hoje; quem monta a frente ajusta no
     Dimensionamento, como em qualquer atividade. Enquanto nao houver area ou
     tonelada lancada no Plano Operacional, nenhuma delas custa nada.
     O codigo de cada uma na Plataforma Controladoria esta no de-para
     (dados/atividades-erp.js). */
  {"cod":"PS08","etapa":"PREPARO DE SOLO","nome":"Limpeza de área e supressão de vegetação","un":"ha/mês","rend":0.3,"maq":"Escavadeira hidráulica","imp":"----","ops":1,"turnos":2,"util":0.8},
  {"cod":"PS09","etapa":"PREPARO DE SOLO","nome":"Sistematização de área","un":"ha/mês","rend":0.5,"maq":"Motoniveladora","imp":"----","ops":1,"turnos":2,"util":0.8},
  {"cod":"PL07","etapa":"PLANTIO","nome":"Sulcação","un":"ha/mês","rend":0.9,"maq":"Trator 4x4 230 CV","imp":"Sulcador adubador 5 linhas","ops":1,"turnos":2,"util":0.9},
  {"cod":"PL08","etapa":"PLANTIO","nome":"Cobrição do plantio manual","un":"ha/mês","rend":1.2,"maq":"Trator 4x4 150 CV","imp":"Cobridor de sulco","ops":1,"turnos":2,"util":0.85},
  {"cod":"PL09","etapa":"PLANTIO","nome":"Plantio com semeadeira","un":"ha/mês","rend":0.8,"maq":"Trator 4x4 230 CV","imp":"Semeadeira distribuidora de cana","ops":1,"turnos":2,"util":1},
  {"cod":"TC32","etapa":"TRATOS CULTURAIS","nome":"Aplicação de maturador","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"TC33","etapa":"TRATOS CULTURAIS","nome":"Aplicação de inibidor de florescimento","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"TC34","etapa":"TRATOS CULTURAIS","nome":"Aplicação de fungicida","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"TC35","etapa":"TRATOS CULTURAIS","nome":"Aplicação de micronutrientes","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  /* Estrada e cerca se medem em quilometro, mas a unidade do cadastro so
     conhece ha e ton, e o que nao e ha entra como TONELADA no rateio das etapas
     (calculo/index.js). Fica em ha/mes, como o Reflorestamento e o Apoio
     operacional, que tambem nao sao area de cana. */
  {"cod":"AC04","etapa":"APOIO E CONSERVAÇÃO","nome":"Conservação de estradas e cercas","un":"ha/mês","rend":0.6,"maq":"Motoniveladora","imp":"----","ops":1,"turnos":2,"util":0.7},
  {"cod":"MF10","etapa":"TRATOS CULTURAIS","nome":"Cigarrinha 2ª Aplicação Aérea","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"}
];

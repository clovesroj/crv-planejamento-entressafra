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
 * manejo "broca" | "cigarrinha" | ausente — classifica a atividade para a
 *        aba/relatorio Manejo Fitossanitario (ui/fitossanitario.js). E so
 *        essa marcacao: a etapa continua sendo TRATOS CULTURAIS, sem rateio
 *        proprio nem etapa nova no sistema.
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
     8  Campo "manejo" (broca/cigarrinha) em A44-A53 — antes essa classificacao
        vivia numa lista fixa de codigos presa no codigo-fonte de
        ui/fitossanitario.js, e so um programador conseguia incluir atividade
        nova ali. Agora esta no cadastro: a coluna "Manejo Fitossanitario" da
        aba Cadastro de Atividades atribui, e a tela/relatorio Manejo
        Fitossanitario le esse campo em vez da lista fixa. Documento ja salvo
        recebe a classificacao das 10 atividades originais via
        CORRECOES_ATIVIDADE (o campo nao existia antes, entao "de:undefined").
   So tirar atividade daqui nao a tira do documento ja salvo (ATVX): ela
   deixa de ser "do sistema" e ganha o botao Remover na aba Cadastro de
   Atividades. Para ela sumir de todo plano gravado, entra tambem em
   REMOCOES_ATIVIDADE e a versao sobe. */
export const ATIVIDADES_V = 8;

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
  /* Classificacao Broca/Cigarrinha (ver ATIVIDADES_V 8): o campo "manejo" nao
     existia antes, entao "de:undefined" -- documento ja salvo nunca teve
     chance de ter outra coisa aqui. Quem ja tiver ajustado a mao (por ex.
     trocado de praga) fica como esta -- a correcao so troca o que ainda e
     undefined. */
  {cod:"A44", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A45", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A46", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A47", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A48", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A49", campo:"manejo", de:undefined, para:"broca"},
  {cod:"A50", campo:"manejo", de:undefined, para:"cigarrinha"},
  {cod:"A51", campo:"manejo", de:undefined, para:"cigarrinha"},
  {cod:"A52", campo:"manejo", de:undefined, para:"cigarrinha"},
  {cod:"A53", campo:"manejo", de:undefined, para:"cigarrinha"},
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
  {"cod":"A01","etapa":"COLHEITA","nome":"Colheita safra 2026","un":"ton/mês","rend":45,"maq":"Colhedora CH570 / John Deere","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1},
  {"cod":"A02","etapa":"PLANTIO","nome":"Colheita muda","un":"ton/mês","rend":35,"maq":"Colhedora de muda","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.6},
  {"cod":"TR1","etapa":"COLHEITA","nome":"Transporte de cana colheita","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Rodotrem canavieiro","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"A01","modo":"caminhao"},
  {"cod":"TR2","etapa":"PLANTIO","nome":"Transporte de cana muda","un":"ton/mês","rend":0,"maq":"Caminhão Volvo FMX 540","imp":"Carroceria canavieira","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"A02","modo":"caminhao"},
  {"cod":"TR3","etapa":"COLHEITA","nome":"Transbordo colheita","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":3,"util":1,"tipo":"transp","src":"A01","modo":"transbordo"},
  {"cod":"TR4","etapa":"PLANTIO","nome":"Transbordo muda","un":"ton/mês","rend":0,"maq":"Trator 4x4 230 CV","imp":"Transbordo 2 eixos","ops":1,"turnos":2,"util":0.7,"tipo":"transp","src":"A02","modo":"transbordo"},
  {"cod":"A03","etapa":"PREPARO DE SOLO","nome":"Dessecação","un":"ha/mês","rend":1.65,"maq":"Uniport 3030 / Drone","imp":"Barra de pulverização 24 m","ops":1,"turnos":3,"util":0.8},
  {"cod":"A04","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"A05","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem pesada","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade controle remoto 20 discos 32\"","ops":1,"turnos":3,"util":0.9},
  {"cod":"A06","etapa":"PREPARO DE SOLO","nome":"Gradagem leve","un":"ha/mês","rend":1.3,"maq":"Trator 4x4 150 CV","imp":"Grade leve 16 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A07","etapa":"PREPARO DE SOLO","nome":"1ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A08","etapa":"PREPARO DE SOLO","nome":"2ª Gradagem média","un":"ha/mês","rend":0.7,"maq":"Trator 4x4 230 CV","imp":"Grade intermediária 24 discos","ops":1,"turnos":3,"util":0.9},
  {"cod":"A09","etapa":"PREPARO DE SOLO","nome":"Subsolagem","un":"ha/mês","rend":0.5,"maq":"Trator 4x4 230 CV","imp":"Subsolador 5 hastes","ops":1,"turnos":3,"util":0.9},
  {"cod":"A10","etapa":"PLANTIO","nome":"Plantio","un":"ha/mês","rend":0.84,"maq":"Trator 4x4 230 CV","imp":"Plantadora DMB PCP 6.000","ops":1,"turnos":2,"util":1},
  {"cod":"A39","etapa":"PLANTIO","junto":"A10","nome":"Adubação de fundação","un":"ha/mês","rend":4.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":4.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A11","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"A12","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"A13","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência socaria pingente","un":"ha/mês","rend":1.8,"maq":"Trator 4x4 150 CV","imp":"Barra pingente","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A14","etapa":"TRATOS CULTURAIS","nome":"Bordaduras","un":"ha/mês","rend":1.2,"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","ops":1,"turnos":1,"util":0.6,"cultura":"Soca"},
  {"cod":"A15","etapa":"TRATOS CULTURAIS","nome":"Catação quadriciclo","un":"ha/mês","rend":1.5,"maq":"Quadriciclo","imp":"Pulverizador costal","ops":1,"turnos":1,"util":0.6,"cultura":"Soca"},
  {"cod":"A16","etapa":"TRATOS CULTURAIS","nome":"1ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"A17","etapa":"TRATOS CULTURAIS","nome":"2ª Catação socaria","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"A18","etapa":"TRATOS CULTURAIS","nome":"Colheitabilidade","un":"ha/mês","rend":1,"maq":"Equipe manual","imp":"----","ops":0,"turnos":1,"util":0.7,"cultura":"Soca"},
  {"cod":"A19","etapa":"PLANTIO","junto":"A10","nome":"Tratos Fitossanitários no Plantio","un":"ha/mês","rend":2.3,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A20","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"A21","etapa":"TRATOS CULTURAIS","nome":"Aplicação de Inseticida aéreo","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  {"cod":"A23","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Planta"},
  {"cod":"A24","etapa":"TRATOS CULTURAIS","nome":"2ª Pré-emergência plantio","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.85,"cultura":"Planta"},
  {"cod":"A25","etapa":"TRATOS CULTURAIS","nome":"1ª Pré-emergência socaria muda","un":"ha/mês","rend":2.2,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"A26","etapa":"TRATOS CULTURAIS","nome":"Quebra-lombo","un":"ha/mês","rend":1.1,"maq":"Trator 4x4 100 CV","imp":"Cobridor com tanque de aplicação","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A27","etapa":"TRATOS CULTURAIS","nome":"1ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Planta"},
  {"cod":"A28","etapa":"TRATOS CULTURAIS","nome":"2ª Catação plantio","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Planta"},
  {"cod":"A37","etapa":"TRATOS CULTURAIS","nome":"Aplicação de calcário","un":"ha/mês","rend":5.0,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.0,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A38","etapa":"TRATOS CULTURAIS","nome":"Aplicação de gesso","un":"ha/mês","rend":5.5,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.8,"modoCfg":{"Trator":{"imp":"Distribuidor de sólidos","rend":5.5,"fcod":"918","turnos":2}},"cultura":"Planta"},
  {"cod":"A30","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A31","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação convencional socaria","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel + tanque vinhaça","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A32","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A33","etapa":"TRATOS CULTURAIS","nome":"Fertirrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"A34","etapa":"TRATOS CULTURAIS","nome":"Irrigação convencional plantio","un":"ha/mês","rend":0.6,"maq":"Trator 4x4 100 CV","imp":"Carretel / aspersão","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"A35","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada socaria","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Soca"},
  {"cod":"A36","etapa":"TRATOS CULTURAIS","nome":"Irrigação localizada plantio","un":"ha/mês","rend":0.9,"maq":"Conjunto motobomba","imp":"Gotejamento","ops":1,"turnos":2,"util":0.7,"cultura":"Planta"},
  {"cod":"AD1","etapa":"TRATOS CULTURAIS","nome":"Adubação de socaria","un":"ha/mês","rend":1.8,"maq":"Adubadora autopropelida","imp":"Distribuidor de sólidos","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"AD2","etapa":"TRATOS CULTURAIS","nome":"Adubação de cobertura","un":"ha/mês","rend":2,"maq":"Trator 4x4 150 CV","imp":"Distribuidor de cobertura","ops":1,"turnos":2,"util":0.85,"cultura":"Soca"},
  {"cod":"A29","etapa":"APOIO E CONSERVAÇÃO","nome":"Reflorestamento","un":"ha/mês","rend":0.3,"maq":"Trator 4x4 100 CV","imp":"Perfuratriz / carroça","ops":1,"turnos":1,"util":0.4},
  {"cod":"AP1","etapa":"APOIO E CONSERVAÇÃO","nome":"Apoio operacional","un":"ha/mês","rend":2.5,"maq":"Veículo leve de apoio","imp":"----","ops":1,"turnos":2,"util":0.7},
  {"cod":"AP2","etapa":"APOIO E CONSERVAÇÃO","nome":"Auxiliares agrícolas","un":"ha/mês","rend":1.2,"maq":"Equipe manual","imp":"Ferramental manual","ops":1,"turnos":1,"util":0.8},
  /* A40-A43: atividades novas da importação da planilha PLAN.HERB SAFRA 26-27
     (Herbicida Safra 2026 + ENTRE SAFRA 2026) sem equivalente no cadastro
     anterior. rend/maq/imp/turnos/util são ESTIMATIVA a partir da atividade
     mais parecida (indicada em cada uma) — a planilha de origem não informa
     rendimento operacional, só dose e área. Conferir com o time antes de
     tratar como definitivo. */
  {"cod":"A40","etapa":"TRATOS CULTURAIS","nome":"Bordaduras cana planta (reforço)","un":"ha/mês","rend":1.2,"maq":"Quadriciclo","imp":"Pulverizador costal pressurizado","ops":1,"turnos":1,"util":0.6,"cultura":"Planta"},
  {"cod":"A41","etapa":"TRATOS CULTURAIS","nome":"Catação canto de árvores","un":"ha/mês","rend":0.8,"maq":"Equipe manual","imp":"Pulverizador costal","ops":0,"turnos":1,"util":0.8,"cultura":"Soca"},
  {"cod":"A42","etapa":"TRATOS CULTURAIS","nome":"Catação folha larga (drone)","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  {"cod":"A43","etapa":"TRATOS CULTURAIS","nome":"Aplicação pós-emergência pontual (drone)","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  /* A44-A53: Controle Fitossanitário (Broca e Cigarrinha), da planilha
     "Planejamento Safra 2026" aba "Plano Inseticida". rend/maq/imp são
     estimativa a partir da atividade de aplicação de inseticida mais
     parecida (A20/A21/A42) — a planilha de origem só dá dose e área, não
     rendimento operacional. A
     tarifa de terceiro (R$/ha aéreo e terrestre da planilha) é dado de
     plano, não de cadastro, e entra em TERC_TAR por safra. */
  {"cod":"A44","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 1ª Cana Planta","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A45","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 2ª Cana Planta","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A46","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 1ª Soca Muda","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A47","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 2ª Soca Muda","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Planta"},
  {"cod":"A48","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 1ª Aplicação Soca Moagem","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"A49","etapa":"TRATOS CULTURAIS","manejo":"broca","nome":"Broca 2ª Aplicação Soca Moagem","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"A50","etapa":"TRATOS CULTURAIS","manejo":"cigarrinha","nome":"Cigarrinha 1ª Aplicação Terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"A51","etapa":"TRATOS CULTURAIS","manejo":"cigarrinha","nome":"Cigarrinha 2ª Aplicação Terrestre","un":"ha/mês","rend":2.5,"maq":"Trator 4x4 150 CV","imp":"Tanque pressurizador Coagril","ops":1,"turnos":2,"util":0.8,"cultura":"Soca"},
  {"cod":"A52","etapa":"TRATOS CULTURAIS","manejo":"cigarrinha","nome":"Cigarrinha 1ª Aplicação Aérea","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"},
  /* ===== Operacoes que o ERP aponta e o plano nao tinha (ATIVIDADES_V 7) =====
     Rendimento, maquina e implemento sao o padrao de partida, do porte de
     equipamento que a operacao usa hoje; quem monta a frente ajusta no
     Dimensionamento, como em qualquer atividade. Enquanto nao houver area ou
     tonelada lancada no Plano Operacional, nenhuma delas custa nada.
     O codigo de cada uma na Plataforma Controladoria esta no de-para
     (dados/atividades-erp.js). */
  {"cod":"A54","etapa":"PREPARO DE SOLO","nome":"Limpeza de área e supressão de vegetação","un":"ha/mês","rend":0.3,"maq":"Escavadeira hidráulica","imp":"----","ops":1,"turnos":2,"util":0.8},
  {"cod":"A55","etapa":"PREPARO DE SOLO","nome":"Sistematização de área","un":"ha/mês","rend":0.5,"maq":"Motoniveladora","imp":"----","ops":1,"turnos":2,"util":0.8},
  {"cod":"A56","etapa":"PLANTIO","nome":"Sulcação","un":"ha/mês","rend":0.9,"maq":"Trator 4x4 230 CV","imp":"Sulcador adubador 5 linhas","ops":1,"turnos":2,"util":0.9},
  {"cod":"A57","etapa":"PLANTIO","nome":"Cobrição do plantio manual","un":"ha/mês","rend":1.2,"maq":"Trator 4x4 150 CV","imp":"Cobridor de sulco","ops":1,"turnos":2,"util":0.85},
  {"cod":"A58","etapa":"PLANTIO","nome":"Plantio com semeadeira","un":"ha/mês","rend":0.8,"maq":"Trator 4x4 230 CV","imp":"Semeadeira distribuidora de cana","ops":1,"turnos":2,"util":1},
  {"cod":"A59","etapa":"TRATOS CULTURAIS","nome":"Aplicação de maturador","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"A60","etapa":"TRATOS CULTURAIS","nome":"Aplicação de inibidor de florescimento","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"A61","etapa":"TRATOS CULTURAIS","nome":"Aplicação de fungicida","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  {"cod":"A62","etapa":"TRATOS CULTURAIS","nome":"Aplicação de micronutrientes","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"modoOn":true,"cultura":"Soca"},
  /* Estrada e cerca se medem em quilometro, mas a unidade do cadastro so
     conhece ha e ton, e o que nao e ha entra como TONELADA no rateio das etapas
     (calculo/index.js). Fica em ha/mes, como o Reflorestamento e o Apoio
     operacional, que tambem nao sao area de cana. */
  {"cod":"A63","etapa":"APOIO E CONSERVAÇÃO","nome":"Conservação de estradas e cercas","un":"ha/mês","rend":0.6,"maq":"Motoniveladora","imp":"----","ops":1,"turnos":2,"util":0.7},
  {"cod":"A53","etapa":"TRATOS CULTURAIS","manejo":"cigarrinha","nome":"Cigarrinha 2ª Aplicação Aérea","un":"ha/mês","rend":1,"maq":"Aeronave / Drone (terceiro)","imp":"----","ops":0,"turnos":1,"util":1,"cultura":"Soca"}
];

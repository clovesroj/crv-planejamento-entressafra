# Histórico de mudanças

## 2.42.1 — 2026-09-23 · Gráfico mensal segue o período escolhido

Com **Entressafra** selecionado no topo, o gráfico do fluxo mensal do Resumo de
Pessoas continuava desenhando os doze meses: a tabela logo acima já mostrava só
dezembro a março, e o gráfico mostrava abril a novembro também. Agora ele
desenha só os meses do período — Ano todo (12), Safra (abr–nov), Entressafra
(dez–mar) ou os meses escolhidos em "Meses".

O mesmo acontecia em mais três gráficos de barras mensais, corrigidos junto:
**custo por mês** do Painel, **litros de diesel por mês** da aba Combustível e
**pagamento de arrendamento por mês** da aba Arrendamentos. Os quatro usam agora
`serieDoPeriodo()` (`ui/componentes.js`), que monta a série a partir do recorte
da barra do topo.

Só a exibição muda; nenhum número. 29 abas sem erro.

## 2.42.0 — 2026-09-23 · O catálogo do ERP entra no plano

Da planilha **Cashflow Diário — Plataforma Controladoria**: 272 linhas, **151
atividades** com código, nome e especialidade de frota.

- **O código do ERP é um campo, não a chave.** A correspondência não é de um
  para um: o Plantio (A10) é, no ERP, o trator da plantadeira e o implemento
  mais oito códigos de apoio; na volta, o ERP tem um código só para a 1ª e a 2ª
  gradagem pesada, que no plano são atividades separadas. Trocar a chave
  escolheria um dos dez e jogaria fora o resto.
- **As 151 têm lugar, cada uma em um só.** O de‑para separa **núcleo** (o
  equipamento que faz a operação) de **apoio** (pipa, área de vivência,
  transporte de pessoal, auxiliar rural, carrego de insumo). Quatro atividades
  do plano ficam sem correspondente porque o ERP não as tem.
- **A frente abre no Plano Operacional.** A seta ao lado do nome abre, além da
  área por tratamento, as atividades do ERP daquela frente — no Plantio, o
  trator e o implemento como núcleo e, embaixo, o auxiliar rural, a área de
  vivência, a pipa, o roll on/off e o transporte de pessoal. Só leitura: o custo
  já está na frente.
- **Dez operações novas** que o ERP aponta e o plano não tinha: limpeza de área,
  sistematização, sulcação, cobrição do plantio manual, plantio com semeadeira,
  maturador, inibidor de florescimento, fungicida, micronutrientes e conservação
  de estradas e cercas. Enquanto não houver área lançada, nenhuma custa nada.

## 2.41.0 — 2026-09-23 · FAT na mão de obra e apoio operacional no Dimensionamento

### FAT — Fundo de Amparo ao Trabalhador (aba Mão de Obra)

Página nova na aba Mão de Obra para os funcionários com o **contrato suspenso
para qualificação** (art. 476-A da CLT), com a bolsa paga pelo FAT. Uma linha
por função:

- **pessoas** que entram no FAT;
- **meses** em que ficam suspensas (linha nova já vem com a entressafra marcada);
- **benefício por pessoa por mês** que a empresa paga no período (ajuda
  compensatória, cesta, plano de saúde...) e a descrição dele.

Custo = pessoas × benefício × meses marcados. No período não há salário nem
encargo, só o benefício. O custo **soma no total de mão de obra**, cai
exatamente nos meses marcados (não é espalhado pela área operada) e entra no
indireto das etapas como o resto da mão de obra fora das atividades.

Essas pessoas **contam no efetivo, mas não ficam disponíveis para a
operação**. No Resumo de Pessoas:

- departamento próprio, **FAT — fora da operação**, que soma no efetivo e no
  custo;
- **não entra na necessidade**: o confronto com o quadro ganha a coluna **No FAT
  (pico)**, e nos meses de FAT o disponível da função cai (a célula mostra
  "−20 FAT", e o título diz "disponível 185 = 205 menos 20 no FAT"). A
  contratação é calculada contra necessidade + FAT de cada mês;
- o custo médio por pessoa mobilizada não conta o FAT.

No Plano de Contas o benefício do FAT fica em linha própria, sem conta (o plano
não tem conta para ajuda compensatória), e o total continua fechando.

### Mão de obra de apoio operacional (aba Dimensionamento)

Tabela nova abaixo das atividades para lançar a gente que a operação precisa e
que não sai de nenhuma atividade — fiscal de campo, apontador, líder de frente,
bituqueiro, vigia. Uma linha por função e frente, com **pessoas** e **meses**
(linha nova vem com os doze marcados).

Custo = pessoas × custo mensal cheio da função (salário, encargos e benefícios
da aba Mão de Obra) × meses marcados. Soma no total de mão de obra nos meses
marcados, abre pela composição da função na conta 200-17 do Plano de Contas e
entra na **necessidade** do Resumo de Pessoas, departamento **Apoio
operacional**.

### Onde mais aparece

- Natureza de custo (aba Custos, Painel e rastro de mão de obra): "MDO apoio
  operacional" e "FAT (contrato suspenso)".
- Relatórios: o de mão de obra traz a linha do FAT antes do total; o de pessoas
  por atividade, a linha do FAT fora da necessidade; o fluxo mensal, a coluna
  "No FAT".
- Validação: avisa linha de FAT ou de apoio sem pessoas ou sem mês, e FAT sem
  benefício — o botão leva direto ao campo.
- Permissões: `FAT` é da aba Mão de Obra e `MO_APOIO` do Dimensionamento
  (`server/permissoes.js`). As duas chaves entram no documento salvo;
  documento antigo abre sem elas, e o `aplicar()` só as troca quando vêm —
  a recuperação de alteração pendente manda documento parcial.

Sem nada lançado não muda número: plano vazio segue 39.270.751,842344 e o plano
da auditoria fica idêntico. Com 23 pessoas no FAT e 6 de apoio, o total sobe
exatamente o FAT (20 × R$ 850 × 4 meses + 3 × R$ 500 × 2 meses = R$ 71.000)
mais o apoio (R$ 438.027,60). 51 invariantes sem falha (6 novos, de FAT e
apoio); 29 abas, 121 rastros e 132 relatórios sem erro; gravar e reabrir
devolve as duas listas.

## 2.40.2 — 2026-09-23 · Combustível sem a referência de mercado da ANP

Sai da aba Combustível o bloco **Referência de mercado (ANP)** — consulta do
preço semanal por município, combustível e posto pesquisado. Era só consulta:
nenhum cálculo do plano usava o preço de lá. A aba fica com **Preço e volume** e
**Consumo**.

Saiu junto tudo o que só servia a ele: `public/js/ui/anp.js`,
`public/js/io/anp.js`, `server/anp.js` (que baixava as planilhas do site da ANP)
e as rotas `/api/anp/semanas`, `/api/anp/resumo-semanal` e `/api/anp/postos`,
além do CSS e das travas de permissão dos campos do bloco. O SheetJS continua:
é o do relatório em Excel.

Não muda número: total do plano da auditoria idêntico (222.645.641,87); 45
invariantes sem falha; 29 abas, 121 rastros e 132 relatórios sem erro.

## 2.40.1 — 2026-09-23 · Custo/ha do produto respeita a unidade da dose

Na composição do tratamento, dose em ml/ha de um produto com preço por litro
entrava crua na conta: **Flumyzin a 50 ml/ha, R$ 143,52/L, custava
R$ 7.176,00/ha — o certo é R$ 7,18** (0,05 L × R$ 143,52). O mesmo com g/ha
contra preço por kg, e kg/ha contra preço por tonelada.

A conversão já existia (`nucleo/unidades.js`), mas falhava em dois casos:

- **Unidade escrita de outro jeito.** Só "lt", "kg", "ml", "g" e "ton" exatos
  eram reconhecidos; "lt/ha", "Kg", "lt/há" ou "L" passavam sem converter. Agora
  toda unidade é normalizada antes da conta (minúscula, sem "/ha", com
  sinônimos: L, litro, gr, grama, t, tonelada...).
- **Produto sem unidade no cadastro** — 72 produtos entraram só com nome e
  preço, e o Flumyzin é um deles. Sem unidade não havia base para converter.
  O preço desses é por litro ou por quilo (é como veio da planilha e do ERP),
  então a base passa a ser a unidade de preço da família da dose: **litro para
  ml/lt, quilo para g/kg/ton**.

Na tela da composição:

- O preço corrigido mostra a unidade a que se refere: **R$ 143,52/lt**,
  R$ 27,56/kg. É contra ela que a dose é convertida.
- Produto sem unidade no cadastro passa a ter o seletor de unidade da dose com
  as cinco opções (ml, lt, g, kg, ton); com unidade no cadastro, as da família
  dela, como antes.

Vale em todo lugar que multiplica dose por preço: custo/ha do tratamento,
insumo das atividades no plano, tabela de custo por hectare do Painel e volumes
do Manejo Fitossanitário.

Nenhum dos 38 tratamentos do cadastro base muda de custo (todas as 157 linhas
já tinham a dose na unidade do preço), e o plano vazio segue 39.270.751,842344:
muda só o tratamento com dose lançada em outra unidade, como o 1 BS do
Bordadura. 45 invariantes sem falha; 29 abas, 121 rastros e 132 relatórios sem
erro nem resíduo.

## 2.40.0 — 2026-09-23 · A plantadora é de um operador

Uma frente de 10 conjuntos de plantio, três turnos, escala 5x1 com folguista,
mostrava **72 operadores onde precisa de 36** — e pagava os 72 na folha. A conta
é `frota × operadores por equipamento × turnos × fator de escala`, e o
"operadores por equipamento" da A10 estava **2** no cadastro base.

- **Cadastro corrigido**: A10 (Plantio) passa de 2 para 1 operador. Como o merge
  da base só acrescenta atividade nova, entra também na lista de correções, com a
  versão subindo — só assim o plano já gravado recebe o conserto. Quem tiver
  ajustado à mão para outro valor fica como está.
- **A conta aparece no modal**: *"Como se chega ao efetivo: 10 × 1 × 3 × 1,20 =
  36"*. O número saía de quatro fatores e nenhum deles estava na tela.
- **Operadores por equipamento vira ajuste da atividade**, ao lado de escala e
  turnos: em branco vale o do cadastro, preenchido vale o da frente — o mesmo
  desenho de rendimento e utilização.

**Impacto em custo:** no plano vazio nada muda (39.270.751,842344 antes e depois
— sem volume, a frente não é paga). Num plano de teste com volume em toda
atividade, o efetivo da A10 cai de 10 para 5, a mão de obra dela de R$ 292.018
para R$ 146.009, e o total do plano cai o mesmo valor. No plano de verdade o
efeito é proporcional à frota e aos turnos lançados no plantio.

## 2.39.0 — 2026-09-23 · Quando a frente começa e termina, e motorista longe de operador

Na tabela de necessidade por origem, duas coisas que a coluna de mês não contava.

- **Início e fim.** Uma coluna cheia de gente dava a entender mês inteiro
  ocupado, e não é: uma atividade acaba no dia 12 e a seguinte começa no 13, com
  a mesma turma. Entraram duas colunas com o começo e o fim da frente — a data
  lançada na atividade quando há; sem data, o primeiro e o último mês com gente.
  E o mês que a janela corta no meio vem **marcado**, com o título dizendo
  quantos dos dias do mês a frente cobre.
- **Motorista não é operador.** Dentro da etapa, uma segunda faixa separa por
  **tipo de gente**, com subtotal próprio: operadores de máquina, motoristas,
  manutenção, equipe de campo, liderança e apoio técnico. São quadros diferentes
  — habilitação, treinamento, escala e negociação não se misturam —, e a
  contratação se faz por um ou por outro, nunca pela soma. Na colheita do
  cenário de teste: 332 operadores e 112 motoristas, que antes eram só 444.
- A categoria sai do nome do cargo do ERP, por palavra: "MOTORISTA LIDER" cai em
  Motoristas e "OP. DE MAQUINAS AGRICOLAS LIDER" em Operadores. Cargo que não
  casar com nenhuma aparece em "Outras funções", em vez de sumir.
- A busca por nome aprendeu o segundo nível, e o relatório **Necessidade de
  Pessoas** ganhou as mesmas colunas.

## 2.38.0 — 2026-09-23 · Adubação de fundação e inseticida do plantio vão na plantadora

A plantadora faz três coisas na mesma passada: planta (A10), aduba o sulco (A39,
adubação de fundação) e aplica o inseticida sobre a muda (A19, tratos
fitossanitários no plantio). O plano tratava as três como operações separadas,
cada uma com a própria frota, equipe, diesel e manutenção. A mecanização era
contada três vezes para uma máquina só.

Agora A39 e A19 vão **junto da A10**:

- **Área** — é a da A10, mês a mês. Não se lança mais área nelas.
- **Mecanização** — uma só, a da A10. A39 e A19 ficam sem frota, horas, diesel,
  mão de obra, manutenção e terceiro próprios.
- **Tratamento** — continua em cada uma: é por ela que se escolhe o adubo da
  fundação e o inseticida do plantio, e o custo do insumo é área da A10 ×
  custo por hectare do tratamento.
- **Plano Operacional** — A39 e A19 aparecem como linhas logo abaixo da A10
  (↳, "junto da A10"), com o tratamento editável e, quando houver, a abertura
  por tratamento com área própria. A linha da A10 mostra "+ A39, A19".
- **A19 passa para PLANTIO.** Acontece no ato do plantio, não é trato de cana
  planta. O custo sai de Tratos Culturais e entra em Plantio; a formação do
  canavial (preparo + plantio + tratos de cana planta) não muda de composição.
- **Dimensionamento, Resumo de Frota, metas e relatório de Dimensionamento** —
  A39 e A19 saem: não têm máquina nem equipe para dimensionar. A A10 diz o que
  leva junto.
- **Aba Insumos** — ao abrir o tratamento da A39 ou da A19, a área e as datas
  aparecem só para leitura (são as da A10), sem editor de modo de execução.
- **Modo de execução** — liberado para toda atividade hoje (as 6 opções, `93554aa`), não
  aparece na A39 nem na A19: a máquina é a da A10.
- **ha-operação** — A39 e A19 não somam de novo o hectare que a A10 já contou.
- **Rastro** da A39 e da A19 — mostra a área, o tratamento e aponta para a A10
  como a atividade que tem a mecanização.

Plano já salvo recebe a mudança na leitura (`ATIVIDADES_V` 5, campo `junto` e
etapa da A19 em `CORRECOES_ATIVIDADE`). **Área lançada à parte na A39 ou na A19
deixa de valer**: vale a da A10.

Também corrigido: o rastro "Pico de mobilização" (Resumo de Pessoas) quebrava
com `r is not defined` ao abrir.

No plano de teste da auditoria, o total cai R$ 696.086 (de 223.524.240 para
222.828.153): sai a mecanização da A39 (R$ 185.611) e da A19 (R$ 255.032), e o
insumo passa a cobrir a área plantada (1.681 ha) em vez das áreas lançadas à
parte (1.718 e 2.051 ha). Plano vazio segue 39.270.751,842344. 45 invariantes
sem falha; 29 abas, 121 rastros e 132 relatórios sem erro nem resíduo.

## 2.37.1 — 2026-09-23 · A22 (Dessecação) sai também do plano já salvo

A A22 era a Dessecação em duplicata da A03: mesmo nome, mesma máquina (Uniport
3030 / Drone), mesma barra de 24 m, 1,65 ha/h. Ela já tinha saído do cadastro
base, mas isso não a tirava do documento gravado: o plano em uso continuava com
ela, agora com o botão Remover na aba Cadastro de Atividades.

Agora ela sai sozinha na leitura do documento, uma vez, com o que estiver
lançado nela — Plano Operacional, Dimensionamento, tarifa e subtarefa de
terceiro e realizado —, o mesmo que o botão Remover faz. A dessecação do plano
fica na A03.

- `dados/atividades.js` ganha `REMOCOES_ATIVIDADE` (hoje só `A22`), e
  `ATIVIDADES_V` sobe para 4: é a versão que faz o documento gravado antes
  receber a remoção.
- Vale também para documento sem cadastro próprio de atividades: lançamento
  órfão da A22 no `PLANO` sai do que é gravado.
- **Área ou tratamento lançado na A22 sai do plano.** Se a dessecação estava
  lançada nela e não na A03, lance na A03.

Plano vazio segue 39.270.751,842344. Testado com um documento gravado na versão
3 com a A22 lançada (600 ha): depois da leitura ela não está no cadastro, no
Plano, no Dimensionamento, no realizado nem no motor; a A03 fica; e o total é
idêntico ao do mesmo documento sem a A22. Auditoria com 45 invariantes sem
falha, 29 abas e 132 relatórios sem erro, nenhuma "A22" na tela.

## 2.37.0 — 2026-09-23 · A função da atividade passa a ser um campo

- **Função editável no detalhe da atividade.** Era só leitura, e quando o código
  não existia no cadastro de funções a linha virava "F02 — F02". Não era
  cosmético: **função desconhecida não tem salário, então a atividade entrava
  com mão de obra zero**. Medido na A05 (2ª Gradagem pesada, 11 pessoas): R$ 0
  de MDO com "F02", R$ 240.915 depois de apontar para 918 — OP. DE MAQUINAS
  AGRICOLAS II. Código fora do cadastro entra como primeira opção do select,
  marcado, em vez de o campo mostrar outra função como se fosse a da atividade.
- **"Frota fixa da atividade" saiu do modal.** A frota se ajusta mês a mês, no
  botão **mês**; ter o mesmo número em dois lugares é o que faz um contradizer o
  outro — o próprio campo já avisava "suspensa agora". O valor não some junto:
  plano que já tem frota fixada mostra a leitura dela e um botão **remover**.
- A permissão do campo de função acompanha o dado, não a tela: ele grava
  `PLANO[cod].fcod`, então pede a permissão do Plano Operacional.

## 2.36.1 — 2026-09-23 · Alteração não confirmada sobrevive ao recarregar

Célula apagada no Plano Operacional voltava depois do F5. Não era a tela: era a
gravação que nunca chegou ao servidor, e ninguém guardava o que ficou pelo
caminho. Dois furos, o mesmo sintoma:

- **A gravação em voo não contava como pendente.** `gravar()` zerava o sinal de
  "há coisa para salvar" *antes* de esperar o servidor. Entre o disparo e a
  resposta — no Render, com plano grande, mais de um segundo — a alteração só
  existia na requisição; recarregar ali a cancelava, e o disparo de emergência
  do `pagehide` saía na primeira linha porque o sinal já estava desligado.
- **O beacon recusado caía num fetch que a navegação cancela.** `sendBeacon` não
  aceita payload grande, e uma sessão que passou pelo cadastro de insumos manda
  bem mais do que o limite.

Agora a alteração é **marcada no navegador antes de ir ao fio** e só sai de lá
quando o servidor confirma. Na abertura seguinte, o que ficou pendente é
comparado com o documento do servidor: se ele já tem, a marca é apagada em
silêncio; se não tem, é reaplicado, reenviado e anunciado. Cobre também rede
fora, aba fechada no meio e navegador matando a aba.

## 2.36.0 — 2026-09-23 · Cada leitura na tela que responde por ela

Os três dimensionamentos na mesma tela viraram três telas empilhadas numa
rolagem só: quem vinha ver frota passava por duas antes, e quem vinha ver gente
passava por todas. Cada leitura foi morar ao lado das tabelas que já respondiam
a mesma pergunta.

- **Dimensionamento** fica com o planejamento da atividade, e só — sem blocos e
  sem submenu, a tela abre na tabela.
- **Resumo de Frota** ganha a página **Necessidade do plano**: a frota por mês em
  cada atividade e o confronto com a frota cadastrada, por especialidade. E
  perdeu uma duplicata — havia duas tabelas de frota de apoio, da mesma fonte,
  uma só de leitura e outra com a quantidade digitável. Ficou a que deixa
  ajustar.
- **Resumo de Pessoas** ganha a página **Necessidade x quadro ativo**, que abre a
  tela: o confronto por função com férias e demissões, e a necessidade mês a mês
  contra o disponível.
- **"Detalhe por origem" passa a ser mês a mês, sem custo e com subtotal por
  etapa.** Eram efetivo, meses mobilizado e custo — três números que não dizem em
  *que* mês a gente é necessária. Agora é uma coluna por mês, e a faixa de cada
  etapa é o subtotal dela, na mesma coluna das linhas que soma. O custo saiu:
  tem tabela própria no Fluxo mensal.
- **Permissões**: `QUADRO` ganhou `pessoas` como aba dona e `APOIO_FIXO` ganhou
  `resumofrota`; as duas continuam em `dimens`, porque uma chave pode ter mais de
  uma aba dona — assim nenhum perfil existente perde edição.

## 2.35.0 — 2026-09-23 · De onde vem cada pessoa do quadro

O quadro por função responde *quantos* motoristas é preciso ter. Faltava a
pergunta que vem logo depois, e que é a que monta escala: **de onde vem cada um
deles** — em que etapa, em que atividade, em que mês. 174 motoristas não viram
escala sem saber que 44 são do transbordo em outubro e nenhum em fevereiro.

- **Necessidade por etapa, atividade e função, mês a mês**, no Dimensionamento
  de pessoas: uma linha por atividade e função, faixa por etapa com o pico da
  etapa, uma coluna por mês e o pico fechando a linha. Mês sem volume no Plano
  Operacional vem vazio, porque a frente não opera. Busca por atividade ou
  função, e o filtro de período do topo recorta as colunas.
- **Relatório "Necessidade de Pessoas"** (novo; 22 no total), e a mesma folha
  dentro do Orçamento de Mão de Obra e do anual detalhado, com o código da
  função e o custo de MDO do período em cada linha.
- Não recalcula nada: agrupa os itens que a conta de pessoas já monta, os
  mesmos que somam o custo de mão de obra. Por isso **fecha** — a soma das
  linhas bate mês a mês com a necessidade total, o efetivo somado bate com o
  total e o custo bate com a mão de obra do plano. Apoio, manutenção e
  estrutura agrícola aparecem nas suas próprias faixas, sem código de
  atividade, porque não vêm de atividade do plano.

### Corrigido

- **"Necessidade mês a mês x disponível" estava vazia desde a 2.33.x.** Ao tirar
  os cartões do Dimensionamento, o painter da tabela foi junto, e ficaram só o
  título e as duas linhas de explicação. Restaurada como era: função,
  disponível, os doze meses com a célula em vermelho onde a necessidade passa o
  disponível, o mês de pico em negrito e a linha "a contratar no mês".

## 2.34.0 — 2026-09-22 · Um número só para a mesma pergunta

Auditoria pedida depois que a frota do Plano Operacional discordava da do
Dimensionamento: **44 numa tela, 70 na outra, para o mesmo transbordo**. O mesmo
erro estava em mais quatro lugares, e a raiz é sempre a mesma — quem *mostra* o
número recalculava por conta própria, com premissa diferente de quem o *calcula*.

### Frota e equipe

- **A frota da atividade é uma só em todo lugar.** Plano, Dimensionamento,
  modal, rastro, metas por gerência, os 21 relatórios e o CSV mostram a frota do
  **mês que mais pede** — a que tem de existir no pátio. Onde o número é a média
  da janela (a que rateia custo) ele está rotulado como média: no rastro as duas
  aparecem lado a lado, e o relatório de Dimensionamento ganhou uma coluna para
  cada, com o mês do pico.
- **A equipe do mês segue a frota do mês.** A linha do transbordo dizia 207
  pessoas e o mês aberto logo abaixo dela dizia 154. A série mensal de pessoas
  passa a sair da frota de cada mês; o custo não passa por aí — a folha continua
  vindo do efetivo médio do motor. No cenário de teste o pico do quadro cai de
  542 para 490, que é o número certo: 542 contratava gente para uma frota que
  aquele mês não tem.

### Premissas de transporte

- **O transporte explica o próprio número com as premissas dele.** O motor sempre
  dimensionou o caminhão com jornada e disponibilidade próprias (20 h), mas a
  meta, o critério por mês, o rastro e o modal usavam as gerais (16,8 h): o modal
  do transbordo acusava o mês de não caber enquanto o motor dizia que cabia.
  Agora há uma função só — `premissasDe()` — e as duas falam a mesma língua. No
  TR3, Out/26 passa de 14.192 h para **16.896 h** de capacidade.
- **A capacidade do transporte ficava sem a eficiência operacional.** A hora
  efetiva é jornada × disponibilidade × utilização × eficiência, e o transporte
  perdia o último fator: chuva encolhia o dia da colhedora e não o do caminhão.
  Com eficiência em 100% (o padrão, e o que está gravado) **não muda número
  nenhum** — medido, total idêntico até a última casa. Com eficiência em 80%, o
  transbordo vai de 59 para 73 equipamentos e o total sobe R$ 1.674.010,84
  (+2,17%).

### Ordem e layout

- **Ordem da etapa.** A correção da muda para PLANTIO deixou a lista alternando
  COLHEITA / PLANTIO / COLHEITA: o Plano pintava **12 faixas de grupo para 6
  etapas**. Plano, Dimensionamento e Cadastro de Atividades saem na ordem em que
  o ano acontece — preparo, plantio, tratos, colheita, apoio. Dentro da etapa
  nada muda de lugar, e o Manejo Fitossanitário fica sempre no fim dos tratos.
- **O cabeçalho cai no eixo do dado, nas 86 tabelas.** O `th` era centralizado em
  toda tabela enquanto a célula ia para a esquerda (texto) ou para a direita
  (número): **616 colunas em 68 tabelas** com o rótulo fora do eixo do próprio
  conteúdo. Agora a regra é uma só, por CSS. Onde a célula é campo de digitação
  ou célula composta — Plano Operacional e Dimensionamento — as duas ficam ao
  centro.
- **13 colunas em que o cabeçalho contradizia a célula** apareceram quando o
  centro saiu da frente, e foram corrigidas na origem: "Usado em" no Cadastro de
  Insumos, as seis colunas da tabela CTTA no Painel, "Atividades" no
  Acompanhamento e a coluna da seta nas duas tabelas do Manejo Fitossanitário.

**Conferido** — plano vazio em 39.270.751,842344, igual ao contrato de
regressão; cenário de teste com eficiência em 100% com total idêntico antes e
depois (76.791.211,82345276); 8 invariantes do motor num plano com volume em
toda atividade (total = variável + fixo = soma dos meses = safra + entressafra =
soma das etapas, CRM por etapa, mão de obra, custo direto por atividade, frentes
somando a atividade); as 29 abas sem `NaN`, `undefined` ou `Infinity`; 68
rastros limpos; 21 relatórios nos dois níveis com toda linha do tamanho do
cabeçalho; auditoria automática de alinhamento nas 86 tabelas com 0 divergência,
contra 616 antes.

## 2.33.1 — 2026-09-22 · Nome da referência fora das telas

Nenhuma tela, rastro ou relatório cita mais "PECEGE" ou "modelo PECEGE". O
método não mudou: só o rótulo.

- **Painel** — "Custo por hectare — modelo PECEGE" virou **Custo por hectare —
  visão por operação**; "Sistema de colheita (R$/t) — modelo PECEGE" virou
  **Sistema de colheita (R$/t)**; a linha "Base PECEGE" virou **Base de
  comparação**; "Aderência PECEGE/USP" virou **Aderência à referência
  setorial**.
- **Arrendamentos e Custos** — "referência PECEGE/USP" virou **referência
  setorial**, e "relatório de custos PECEGE/USP" virou **relatório de custos de
  referência**.
- **Rastros** — o percentual de rateio do arrendamento e a nota da muda passaram
  a falar em referência setorial e na tabela de custo por hectare do Painel.

Conferido com o plano montado: 29 abas, 124 rastros e os 126 relatórios sem
nenhuma ocorrência do nome, e a auditoria segue com 45 invariantes sem falha.

## 2.33.0 — 2026-09-22 · Custo por hectare plantado: só o que forma o canavial

O indicador **Custo por ha plantado** dividia o custo do plano inteiro pela área
de plantio: colheita, tratos de cana soca e apoio entravam na conta do hectare
que foi plantado. Agora ele é a **formação do canavial ÷ área de plantio**, e a
formação é o que o modelo PECEGE chama de formação: **preparo de solo + plantio
+ tratos culturais de cana planta**.

No plano de referência o indicador sai de R$ 20.163/ha (custo total ÷ 2.400 ha)
para R$ 29.971/ha (R$ 71.931.300 de formação ÷ 2.400 ha).

### O que mudou

- **Preparo de solo entrou na formação.** Antes a formação era plantio + tratos
  de cana planta. O preparo acontece na área que vai ser plantada e é custo de
  formação; agora conta, e a base física do preparo passou a ser a área de
  plantio (antes era a soma das passadas das atividades, que contava o mesmo
  talhão uma vez por operação).
- **Cartões iguais nas três telas.** Painel, Capa e Custos mostram o mesmo
  número, com a nota "preparo + plantio + tratos de cana planta".
- **Relatórios.** O Resumo Executivo e os Indicadores trazem duas linhas
  separadas: *Custo por hectare plantado (formação do canavial)* e *Custo do
  plano por hectare de plantio*, que é a conta antiga — útil, mas outra coisa.
- **Rastro reescrito.** Abre a conta ("Formação do canavial ÷ área de plantio"),
  as três etapas que formam o canavial com o peso de cada uma, o que entra
  (operação e rateios) e o que fica fora — cana soca, colheita e apoio —,
  fechando com o custo total do plano.

### Mudas

A colheita, o transbordo e o transporte de muda estão na etapa Colheita do Plano
Operacional, e é lá que este indicador os deixa. A tabela do modelo PECEGE, no
Painel, os conta como insumo do plantio — é a diferença de R$ 736/ha entre a
coluna Formação daquela tabela e o cartão. As duas telas agora dizem isso: o
rastro mostra a linha da muda dentro da colheita e a nota da tabela explica a
diferença.

### Auditoria

45 invariantes do motor sem falha, 29 abas e 124 rastros sem NaN, undefined ou
Infinity, e os 126 relatórios (21 × 2 níveis × 3 períodos) sem resíduo. A soma
das três etapas da formação fecha com as etapas PREPARO DE SOLO e PLANTIO mais
a operação de tratos de cana planta, com diferença zero.

## 2.32.0 — 2026-09-22 · Painel: tabelas no modelo PECEGE

O Painel ganhou as duas tabelas do relatório de custos PECEGE/USP, montadas
com os números do plano, logo abaixo dos indicadores de tratos.

### Custo por hectare

Colunas **Preparo · Plantio · Tratos planta · Formação do canavial · Tratos
soca**, cada uma com R$/ha e o peso no total. Linhas como no modelo:
Operação (Máq + mão de obra, Irrigação/Fertirrigação), Insumos (Mudas,
Adubação corretiva, Fertilizantes, Defensivos — herbicidas, inseticidas,
fungicidas, nematicidas —, Controle biológico, Maturador, Inibidor, Torta de
filtro, Outros) e Administrativo (Administrativo, Royalties).

Acrescentado o que o plano calcula e o modelo não mostra: **serviços
terceirizados**, e o grupo **Outros custos (rateios)** — arrendamento,
depreciação, diesel dos equipamentos de apoio e demais custos gerais. A linha
**Base PECEGE** soma só operação, insumos e administrativo, para comparar com o
relatório; o Total é o custo completo.

- Formação do canavial = **preparo + plantio + tratos planta**, como no
  modelo. (Na aba Custos, a formação continua plantio + tratos planta.)
- Preparo, plantio e formação por hectare de plantio; tratos planta e soca pela
  área de cada cultura — o bloco Base física dos custos, da aba Premissas.
- Insumos pela classe agronômica do produto; os fertilizantes e corretivos sem
  classe são reconhecidos pelo nome (fórmula NPK, ureia, KCl, calcário).
- **Mudas**: colheita, transbordo e transporte de muda estão na etapa Colheita
  do Plano Operacional; aqui, como no modelo, entram no plantio — custo direto
  mais a parte delas nos rateios da colheita.

### Sistema de colheita (R$/t)

Colunas **Corte (C) · Transbordo (T) · C + T · Transporte (T) · Apoio + Adm (A)
· CTTA**; linhas Operador, Diesel, Manutenção, Locação e Outros com o custo
direto das atividades, e — acrescentado — o Apoio + Adm aberto em equipamentos
de apoio e custos gerais, administrativo e depreciação. R$ por tonelada colhida
(premissa de volume de colheita, ou as toneladas do corte). Colheita de muda
fica no plantio; o arrendamento rateado à colheita aparece em nota, fora do
CTTA.

**Conferido:** cada coluna soma as suas linhas; as colunas batem com o custo
por operação da aba Custos; formação = preparo + plantio + tratos planta; e
plantio (com mudas) + CTTA + arrendamento da colheita = etapas Plantio +
Colheita, no centavo.

### Validação

Nova pendência **Insumo usado no plano sem classe agronômica**: lista os
produtos dos tratamentos lançados que caem em "Outros insumos" (e sem conta no
Plano de Contas) e leva ao grupo "Outros" do cadastro de insumos, onde se
escolhe o Grupo de cada um.

## 2.31.0 — 2026-09-22 · Validação leva direto ao ponto de correção

Na aba **Validação**, cada pendência virou um botão com o nome da aba onde se
corrige ("Premissas →", "Plano Operacional →"…). O clique:

- abre a aba e, quando ela tem páginas, a página certa;
- rola até o ponto exato e o destaca por alguns segundos — o campo da
  premissa, a linha do contrato, a linha da atividade, a linha do benefício;
- põe o cursor no campo, quando o ponto é um campo.

As pendências aparecem **no topo da lista**, antes das verificações que estão
OK. O detalhe da pendência também ficou mais útil onde era só um número:
"Atividade em ha sem tratamento" e "Atividade com mais de 12 equipamentos"
passam a listar os códigos, e rendimento zerado, utilização fora da faixa e
salário não preenchido dizem qual atividade ou função.

Exemplos de destino: diesel, horas por dia, disponibilidade, bases físicas →
campo em Premissas; velocidades e capacidade → aba Transporte; contrato sem
valor ou sem pagamento → a linha na aba Arrendamentos; atividade sem
tratamento → o seletor de tratamento dela no Plano Operacional; frota acima de
12 → a atividade no Dimensionamento; benefício de transporte em dobro → a
linha do benefício em Mão de Obra; custo sem conta → a linha "Sem conta" do
Plano de Contas; área própria → o campo em Fornecedores de Cana.

Das 51 verificações, 49 têm destino; as outras duas são informativas e nunca
ficam pendentes. Quando a linha exata não está na tela (grupo recolhido, por
exemplo), o destaque cai na tabela onde ela fica.

## 2.30.0 — 2026-09-22 · Mês de alocação dos materiais de manutenção

Na aba Insumos, a tabela **Materiais de manutenção** ganhou a coluna **Mês de
alocação**: o mês em que o recurso financeiro de cada material é alocado.

- Com mês marcado, o valor do material cai **inteiro naquele mês** no custo
  mensal, na grande conta de manutenção, no custo das etapas mês a mês, no
  fluxo de caixa, no filtro de período e nos relatórios por período.
- Em **"Distribuído no ano"** (o padrão), o valor se espalha pelos meses
  conforme a área operada, como era antes. Nenhum número muda até alguém marcar
  um mês.
- O total do ano não muda: marcar o mês só muda **quando** o recurso entra.
- Embaixo da tabela, a alocação mês a mês; no detalhamento de cada mês (clique
  no mês na aba Custos), os materiais alocados nele.

### Correção

O detalhamento de um mês ainda calculava o valor de cada atividade dividindo a
mão de obra pelo volume do mês — resto da mudança da 2.29.0, em que a MDO passou
a ser a equipe paga mês cheio. Agora usa a mesma regra do motor.

## 2.29.0 — 2026-09-22 · Mão de obra direta pelo efetivo, mês cheio

Decisão da auditoria 2.28.0. A mão de obra das atividades era cobrada por
**hora de máquina**: salário mensal ÷ 403 h (24 dias × 16,8 h da máquina) ×
horas × operadores × fator de escala. Os **turnos não entravam**, então cada
máquina pagava um operador onde o efetivo conta dois ou três. No plano de teste
isso dava R$ 7,4 mi de MDO direta para um efetivo que, pelos meses em que
trabalha, custa R$ 27,4 mi — e o Resumo de Pessoas mostrava R$ 2.840 por
pessoa/mês, abaixo do custo de qualquer função.

Agora a equipe de cada frente — **frota × operadores × turnos × fator de
escala**, o mesmo efetivo do Dimensionamento e do Resumo de Pessoas — é paga o
**mês cheio em todo mês em que a atividade tem volume**, ao custo mensal da
função (salário, encargos e benefícios).

- Na colheita do plano de teste: 112 pessoas × 4 meses × R$ 8.196/mês =
  R$ 3.671.904, R$ 917.976 em cada mês de safra. Antes eram R$ 948.636.
- Custo mensal, grandes contas e etapas mês a mês usam a equipe de cada mês,
  não mais a divisão pelo volume: mês com pouco volume paga a equipe inteira.
- O Resumo de Pessoas passa a R$ 5.432 por pessoa/mês no teste.
- O detalhamento da atividade mostra a conta: pessoas × meses com volume ×
  custo mensal da função.
- O relatório por período e o custo operacional acompanham.

**O custo total do plano sobe.** No plano de teste, de R$ 217,8 mi para
R$ 237,8 mi (+R$ 20,0 mi, todo em MDO direta). As 45 conferências da auditoria
seguem fechando no centavo, e as da aba Validação ficam verdes.

## 2.28.0 — 2026-09-21 · Auditoria do cálculo

Auditoria de toda a parte de cálculo, com um plano de teste completo: todas as
atividades com volume, tratamentos, arrendamentos, esporádico, bases físicas e
veículos em L/km.

**O que foi conferido e fechou no centavo** — 45 invariantes, em três cenários:

- custo total = variável + fixo = soma dos meses = soma das etapas = soma das
  grandes contas = safra + entressafra = naturezas = operações (contábil);
- mês a mês, as grandes contas e as etapas somam o custo do mês;
- atividades: custo direto = diesel + MDO + CRM + insumos + terceiros; frentes
  somam a atividade; meses somam diesel, litros e volume;
- diesel (atividades + apoio, mês a mês, por etapa), CRM (alocado + excedente,
  componentes, destinos), pessoas = mão de obra, arrendamento (meses, contratos,
  rateio), administrativo (etapas + sem base), insumos, irrigação, terceiros,
  transporte e matéria-prima.

Também: as 29 abas renderizam sem `NaN`, `undefined` ou `Infinity`; os 122
detalhamentos abrem; os 126 relatórios geram com toda linha do tamanho do
cabeçalho. Com o plano vazio também. Premissas propagam exatamente o efeito
esperado: diesel +10%, preço de insumos, consumo L/km, arrendamento,
esporádico e administrativo. Base física não muda custo, só o unitário.

### Corrigido

**Plano de Contas não fechava com o custo total.** No plano de teste somava
R$ 157,0 mi para R$ 217,8 mi de custo. Três defeitos:

- **Insumos agronômicos não caíam em conta nenhuma** (R$ 77 mi). Agora entram
  pela família do produto: herbicidas INS-01; inseticidas, fungicidas e
  biológicos INS-02; fertilizantes e corretivos INS-03; foliares,
  micronutrientes e bioestimulantes INS-04.
- **Mão de obra entrava duas vezes.** As contas de salário recebiam o custo
  cheio e os benefícios eram somados de novo à parte (R$ 18 mi), estimados por
  efetivo × 12 meses; os encargos, por subtração, saíam negativos. Agora o custo
  de cada função se abre pela sua composição: salário-base e provisões (13º,
  férias, aviso) na conta de salário do grupo; INSS, RAT e Terceiros na 200-35;
  FGTS na 200-36; cada benefício na sua conta. O MDO dos equipamentos de apoio,
  que não tinha conta, vai para 200-17.
- A lógica existia **em duas cópias** (tela e rastro). Agora mora num lugar só,
  `calculo/contas.js`, lido pela aba, pelo relatório, pelo rastro e pela
  Validação.

O que não tem conta no plano — reguladores, adjuvantes, **produtos sem classe
agronômica** e esporádicos — aparece numa linha "Sem conta" no fim da aba. A
soma sempre fecha com o custo total. A maior parte é insumo antigo sem classe:
basta escolher o Grupo do produto na aba Insumos para ele ir para a conta certa.

**Custo variável + custo fixo não davam o total com o filtro de período.**
Com "Safra" na barra de cima, os cartões da aba Custos mostravam variável +
fixo R$ 6,3 mi abaixo do total (acima na entressafra). O variável era uma
fração proporcional do ano, mas o custo não cai proporcional. Agora sai da
série mensal: fixo = administrativo + depreciação + arrendamento nos meses do
período, variável = total − fixo. O detalhamento dos dois cartões segue a
mesma conta.

### Novos avisos na Validação

- As conferências principais da auditoria rodam a cada recálculo: grandes
  contas, safra + entressafra, diesel mês a mês, CRM, pessoas = MDO,
  operações = total.
- **Todo custo tem conta no plano de contas** — pendente enquanto houver valor
  na linha "Sem conta".
- **Transporte de pessoal contado uma vez só** — o benefício "Transporte de
  pessoal" (R$ 340/pessoa/mês, dentro do custo de toda função) e as rotas da aba
  Transporte de Pessoal vão para a mesma conta 200-127. Se forem o mesmo
  ônibus, o custo está em dobro. A decisão é da usina; o sistema só avisa.

### Para decidir — mão de obra direta

O custo de MDO das atividades é cobrado por **hora de máquina**, a salário
mensal ÷ 403 h (24 dias × 16,8 h da máquina), e **não multiplica pelos
turnos**. O efetivo, por sua vez, conta frota × operadores × turnos. No plano
de teste, a MDO direta sai R$ 7,4 mi, e as mesmas pessoas do efetivo, pelos
meses em que trabalham, custariam R$ 27,4 mi (3,7×). Não foi alterado: muda
milhões no total e depende de como a usina contrata (por mês ou por hora
produtiva).

## 2.27.1 — 2026-09-21 · Unidade do Cadastro de Atividades em ha/h e ton/h

No Cadastro de Atividades, a coluna **Unidade** mostrava "ha/mês" e "ton/mês"
ao lado do **Rendimento**, que é por hora (colheita 45 t/h, gradagem 0,7 ha/h).
Agora mostra **ha/h** e **ton/h**, e a coluna se chama "Rendimento (por hora)".
O seletor das atividades criadas pelo usuário também oferece ha/h e ton/h.

O dado guardado não muda. A atividade continua registrando a unidade do volume
lançado **por mês** no Plano Operacional — lá, ao lado dos meses, "ha/mês" é a
unidade certa. O sistema só lê a parte "ha" ou "ton", então custos, documentos
salvos e demais telas ficam como estavam. As outras telas que mostram
rendimento (Dimensionamento, Acompanhamento, metas, critério por mês) já usavam
"/h".

## 2.27.0 — 2026-09-21 · Consumo de diesel em L/h ou L/km

A tabela **Consumo por equipamento** da aba Combustível agora é editável:

- **Unidade** por equipamento: **L/h** para máquinas (trator, colhedora,
  motobomba) ou **L/km** para veículos (caminhão, veículo leve).
- **Consumo** editável na própria linha. É o mesmo consumo do cadastro de
  máquinas da aba Manutenção de Frota: alterar em uma aba altera na outra.
- **Velocidade média** (km/h), editável, usada quando o km sai das horas.
- Colunas novas de **horas** e **km** projetados, e uma linha de total.

**Horas e km são projetados sozinhos, pelas premissas.**
- Horas das máquinas: área ÷ rendimento de cada atividade; no transporte,
  viagens × ciclo. Isso já era assim e continua.
- Km do transporte de cana: **viagens × ida e volta do raio** (capacidade e
  raio da aba Transporte). No plano de teste, transporte de cana da colheita:
  30.000 viagens × 2 × 18 km = 1.080.000 km.
- Km dos demais veículos: **horas × velocidade média**. O padrão da velocidade
  é a média de carregado e vazio da aba Transporte.

**A unidade vale para a conta, não só para a tela.** Litros = horas × L/h ou
km × L/km, e isso entra no diesel da atividade, do apoio, das etapas, do
custo mensal, dos relatórios e do rastro.

**Todo equipamento continua em L/h até alguém trocar.** Nenhum número mudou
com esta versão. Ao passar para L/km, o consumo começa no equivalente do L/h
na velocidade média (em itálico, marcado como padrão). Esse equivalente só vale
com o veículo rodando: as horas do plano contam o tempo parado na carga e
descarga, os km não. Por isso, só de trocar, os litros tendem a cair — no
teste, o caminhão caiu 45%. O consumo real por km (fabricante ou telemetria)
deve ser digitado. Campo apagado volta ao padrão.

A aba Combustível passa a gravar o cadastro de máquinas (`MAQ`) no controle de
permissões do servidor.

## 2.26.0 — 2026-09-21 · Base física dos custos na aba Premissas

A aba Premissas ganhou o bloco **Base física dos custos**, o primeiro da aba:

- **Área de plantio (ha)** — já existia, mudou de lugar;
- **Área de tratos culturais — cana planta (ha)**;
- **Área de tratos culturais — cana soca (ha)**;
- **Área de colheita (ha)**;
- **Volume estimado de colheita (t)**.

Esses números passam a ser a base de todo custo por hectare e por tonelada:
Painel, aba Custos (custo por etapa, custo operacional, custo contábil),
Arrendamentos, Custos Administrativos, relatórios e rastro. A regra mora num
lugar só, `calculo/base-fisica.js`, e toda tela usa a mesma:

| Operação | Divide por |
|---|---|
| Plantio e formação do canavial | área de plantio |
| Tratos de cana planta | área de cana planta |
| Tratos de cana soca | área de cana soca |
| Tratos (etapa inteira) | área de cana planta + área de cana soca |
| Colheita | volume colhido, e também a área colhida quando informada ("R$/t · R$/ha colhido") |
| Preparo de solo, apoio e conservação | hectares operados (não têm premissa de área) |

**Campo em branco não é zero, é "não informado".** A base cai no que o plano
já sabe: tratos de cana planta usa a área de plantio, e cana soca e colheita
usam a soma lançada nas atividades. A tela escreve "(soma das atividades)"
quando a base veio daí. Embaixo de cada campo, uma dica diz o que está sendo
usado. Com os campos em branco, os valores ficam exatamente como estavam na
versão anterior.

**Só o divisor muda.** Os custos totais continuam os mesmos; muda o custo
unitário. No plano de teste, com 8.000 ha de soca informados, tratos de cana
soca foi de R$ 180/ha operado para R$ 1.487/ha de soca.

**Validação** ganhou dois avisos: premissa de base física em branco, e volume
estimado de colheita a mais de 10% das toneladas lançadas na colheita do plano.

As premissas novas entram na lista de campos da aba Premissas em
`server/permissoes.js`: quem edita Premissas grava esses campos.

O consumo de diesel por unidade (L/ha) da aba Combustível segue por hectare
operado. É um índice técnico de consumo por passada, não um custo.

## 2.25.0 — 2026-09-21 · Formação do canavial e cartões que abrem o próprio detalhe

### Formação do canavial

**Plantio + tratos culturais de cana planta** agora aparecem somados como
**Formação do canavial**, em linha de subtotal logo abaixo das duas
operações, nas páginas *Custo operacional* e *Custo total (contábil)* da aba
Custos. Também ganham cartão próprio nessas páginas e no Painel, e entram no
relatório.

Plantio, tratos de cana planta e a formação passam a ser divididos pela **área
física do plantio** (premissa "Área de plantio"), não mais pela soma dos
hectares das atividades. Dez operações no mesmo talhão são um hectare
plantado, não dez. No plano de teste, tratos de cana planta ia de R$ 190/ha
(sobre 43.901 ha operados) para R$ 3.476/ha plantado (sobre 2.400 ha). A base
física mostra "ha plantados" e, ao passar o mouse, os hectares operados. Cana
soca segue por hectare operado e colheita por tonelada.

Os cartões "Tratos — cana planta" e "Tratos — cana soca" do Painel passam a
usar a divisão que inclui a irrigação de cada cultura, a mesma da aba Custos.

### Cartões que abriam o detalhamento errado

No Painel, "Custo / ha plantado" abria o detalhamento do custo total. Agora
abre a própria conta: custo total ÷ área de plantio, quanto cada etapa e cada
grande conta pesam no hectare, e a formação do canavial. O mesmo valeu para a
Capa e a aba Custos.

A varredura de todos os cartões clicáveis achou o mesmo defeito em outros, e
eles ganharam o próprio detalhamento:

- **Custo na safra / na entressafra** (Painel e Custos): o custo do período,
  mês a mês, por etapa e por grande conta.
- **Custo de colheita** (só corte): a conta do cartão — direto do corte mais a
  parte dele no indireto e no arrendamento — em vez da etapa inteira.
- **Tratos — cana planta / soca** e **Formação do canavial**: a própria
  operação, com custo operacional por natureza, cada rateio e as atividades,
  em vez da etapa inteira de tratos.
- **Custo variável / Custo fixo**: a composição de cada um.
- Os cartões das páginas operacional e contábil abrem a operação com o mesmo
  número do cartão.

Dos 36 cartões clicáveis de Painel, Capa e Custos, 32 abrem com o mesmo número
do cartão. Os outros 4 são médias ou índices — CRM por hora, arrendamento por
hectare, média mensal da safra e da entressafra — e abrem o total de onde o
índice sai.

## 2.24.0 — 2026-09-21 · Custo operacional x custo contábil

A aba Custos ganhou duas páginas, que agora abrem a aba. Elas separam o que
custa **fazer** cada operação do que ela **carrega** com os rateios.
Operações: plantio, tratos culturais de cana planta, tratos culturais de cana
soca e colheita. Preparo de solo e apoio e conservação vêm abaixo, para o total
fechar com o plano.

**Custo operacional** — custo efetivo da operação: diesel das máquinas da
operação, mão de obra, manutenção (CRM), insumos e terceirização das
atividades e, em tratos, a irrigação (energia, água e materiais). Nenhum
rateio entra. Custo unitário por hectare operado ou por tonelada.

**Custo total (contábil)** — o operacional mais os rateios, cada um na sua
coluna: diesel dos equipamentos de apoio, arrendamento, administrativo,
depreciação e demais custos gerais (apoio, estrutura indireta, equipe de
manutenção, transporte de pessoal, terceirizações por contrato, esporádicos).
Também mostra quanto os rateios acrescentam sobre o operacional e o peso da
operação no custo total.

Nada é conta nova: tudo sai do motor, com os mesmos critérios de rateio. A
depreciação, que antes ficava dentro do "indireto", ganhou coluna própria, com
o critério que o motor já usava (custo direto de cada etapa).

### Correção — cana planta x cana soca

As linhas "↳ Cana soca" e "↳ Cana planta" da tabela de custo por etapa não
incluíam a irrigação. As duas somavam cerca de R$ 2,6 mi menos que o total de
tratos no plano de teste: a irrigação mais a parte dela no rateio geral. Agora
a irrigação entra em cada cultura pela modalidade ("socaria" → soca,
"plantio" → planta), e planta + soca fecha com tratos no centavo. A mesma
tabela ganhou a coluna **Administrativo**: ele fazia parte do total da linha,
mas não aparecia em nenhuma coluna.

### Relatórios

As duas visões entram no *Orçamento por Centro de Custo* e no nível
detalhado do *Orçamento Agrícola Anual*. São do ano: no recorte por período,
o título diz "ano todo".

**Conferido:** operacional + rateios = contábil em cada linha; planta + soca
= tratos; cada operação bate com o total da sua etapa; depreciação,
arrendamento, administrativo e irrigação batem com os totais do plano; e a
soma de todas as operações é o custo total do plano.

## 2.23.1 — 2026-09-21 · Método da irrigação localizada

Na aba Irrigação, as modalidades **Irrigação localizada socaria** e **Irrigação
localizada plantio** passam a ter o método **Aspersão localizada** — estava
"Gotejamento superficial". Muda só o nome do método: eficiência, lâmina,
turno, pressão e custos continuam os mesmos. As modalidades de fertirrigação
localizada seguem como gotejamento subsuperficial.

## 2.23.0 — 2026-09-21 · Relatório por período: safra, entressafra ou os dois

A janela de gerar relatório ganhou o campo **Período**: *Safra e entressafra
(ano todo)*, *Safra (abr a nov)* ou *Entressafra (dez a mar)*. Vale para PDF,
Excel, CSV e pré-visualização, em todos os 21 relatórios.

**Como o recorte é feito.** Pelo critério do próprio motor, sem conta nova:

- série mensal — custo do mês, grandes contas, diesel, pessoas, pagamentos do
  arrendamento — soma só os meses do período;
- custo de atividade cai nos meses pela quantidade lançada, e o diesel pelo
  litro e preço de cada mês;
- administrativo e depreciação são iguais todo mês; o arrendamento segue os
  meses de pagamento; a irrigação segue a área operada; os equipamentos de
  apoio trabalham as mesmas horas todo mês.

**O que é recortado:** resumo executivo, orçamento de cada etapa, custo por
etapa, centro de custo, por atividade, natureza (pelas grandes contas),
mensal, fluxo de caixa, cenários, indicadores, mão de obra, pessoas por
departamento, fluxo de MDO, tratamentos, arrendamentos, administração,
combustível, plano operacional, dimensionamento (atividades e horas do
período), acompanhamento e critério por mês.

**O que fica do ano:** premissas, área, produção, transporte, frota, CRM,
insumos, fornecedores, plano de contas, logística, apoio e irrigação — não têm
série mensal no motor. No recorte, o título dessas tabelas diz "ano todo (sem
série mensal)", para ninguém ler um número do ano como sendo do período. Frota
e efetivo são o dimensionamento do plano e aparecem marcados como tal.

**Conferido:** no ano todo o relatório sai idêntico ao de antes — só ganhou a
linha "Período do relatório" no resumo e três rótulos mais claros; nenhum
número mudou. Safra + entressafra fecha com o ano em cada tabela recortada,
no R$ 1 de arredondamento. O cabeçalho do PDF, do CSV e de cada aba do Excel
diz o período, e o nome do arquivo ganha `_safra` ou `_entressafra`.

## 2.22.1 — 2026-09-17 · Revisão de continuidade dos commits do dia

Revisão conduzida por **Caio Souza** sobre os commits de 17/09 (perfis, janela
de 12 meses, datas no Plano, cadastro de tratamentos, AGROFIT). Nenhum número
muda para dado válido: com a fixture de produção, o motor de cálculo e as 24
telas saem idênticos ao HEAD anterior — só a aba Validação muda, porque ganhou
checagens.

### Migração de 9 para 12 meses gravada pela metade com perfil restrito

O navegador migra PLANO, DIESEL_MES e ARREND juntos ao abrir, mas só reconhece
o formato antigo pelo PLANO. Com perfis, as três chaves deixaram de chegar
juntas ao banco:

- quem edita a Irrigação gravava PLANO já em 12 meses e tinha arrendamento e
  diesel descartados. Na abertura seguinte a migração não rodava mais, e o
  pagamento do arrendamento em Out/26 (índice antigo 0) passava a ser lido
  como Abr/26;
- quem edita só Arrendamento gravava o contrato migrado com o PLANO ainda em 9
  meses, e o arrendamento era migrado de novo a cada abertura.

Agora o servidor completa a migração das chaves que o perfil não grava, com a
mesma regra do navegador (`server/janela.js`), na primeira gravação que chega
no formato novo. Conferido com três perfis: o banco fica inteiro em 12 meses e
igual ao que o navegador tinha.

### Janela de datas do Plano Operacional

- **Janela fora do ano agrícola** (ano digitado errado, por exemplo 2025) era
  aceita: a frota e o efetivo eram dimensionados para um período sem nenhum
  mês do orçamento. Agora vale o mesmo que uma janela invertida: a atividade
  usa os meses com volume.
- **Janela que passa do ano agrícola** (começa antes de Abr/26 ou termina
  depois de Mar/27) marcava todos os meses como fora da janela no Plano.
  Agora marca os meses de dentro. Os números não mudam.
- **Validação** ganhou três checagens: janela de datas utilizável (só uma data,
  data inválida, fim antes do início, fora do ano), janela dentro do ano
  agrícola, e volume programado dentro da janela de datas. Antes a janela
  descartada não aparecia em lugar nenhum.

### Código de tratamento

O código ficou editável nesta versão e vai cru para a tela em quase cem
lugares (select do Plano, rastro, relatórios). Um código com `<` ou aspas virava
marcação. Agora aceita só letras, números, espaço e `. _ / + ( ) % , -` (até 60
caracteres), com aviso próprio ao criar e ao renomear. Todos os códigos da base
já estão nesse formato.

O aviso "o vínculo das atividades não será salvo", ao renomear ou remover um
tratamento, aparecia também para quem edita a Irrigação, que grava esse
vínculo (PLANO tem duas abas donas). Agora só aparece quando o vínculo é de
fato descartado.

### AGROFIT

- Chamadas à Embrapa com prazo de 15 s, inclusive na leitura da resposta. Antes
  uma API lenta segurava a requisição e o "Buscando..." indefinidamente.
- Resposta que não é JSON (página de erro do gateway) e autenticação sem token
  viram erro legível (424) em vez de "falha interna".
- O link da bula só vira link se for `http(s)`: `esc()` segura a aspa, mas não
  impedia um `javascript:` gravado no documento.

## 17/09 — mudanças registradas só no git (consolidadas na 2.22.1)

No dia 17/09 quatro pessoas publicaram direto no `main`, e 28 commits entraram
sem entrada neste arquivo — o registro ficou só na mensagem do commit. Estão
reunidos aqui por assunto, para quem chegar não precisar ler o `git log`. O
detalhe de cada um (a conta conferida, o caso que motivou) continua na
mensagem: `git show <hash>`.

Autores: **tkaique9-cloud**, **Caio Souza** (os commits aparecem também como
CAIO ROBERTO DE SOUZA, o e-mail corporativo), **aureniorg3** e **clovesroj**
(este com entradas próprias, da 2.18.0 à 2.22.0).

Só um item muda custo em plano que já existia: o transporte herdando a janela
da colheita (`59bd87b`). Os demais são leitura, tela ou valem só para quem usar
o recurso novo.

### Filtro de período na barra superior — tkaique9-cloud

- **Um seletor só para o app inteiro** (`3c4989d`): Ano todo, Safra,
  Entressafra e Meses valem em toda tabela mensal — Plano, Arrendamentos,
  Combustível, Fornecedores, Pessoas, Dimensionamento, Painel, Custos e
  Acompanhamento. O "Mostrar meses" próprio do Plano deixou de existir.
- **Meses a dedo** (`4991e2a`): o botão Meses abre os doze para marcar; os
  atalhos Safra e Entressafra servem de ponto de partida. Seleção vazia não
  filtra (zerar a lista levaria a uma tela de zeros sem explicação).
- **O total segue o filtro**: `somaSel()` e `maxSel()` refecham a soma sobre os
  meses à mostra, e o cabeçalho passa a dizer "Total do período". No
  Acompanhamento, a aderência passa a ser a do período escolhido.
- **Como funciona:** toda coluna de mês leva `clsMes(i)` (classe do período e
  índice `m0`..`m11`, em `nucleo/calendario.js`), e `render()` escreve uma
  regra CSS única que esconde os meses de fora. Tabela mensal nova precisa usar
  `clsMes(i)` no cabeçalho **e** na célula, ou desalinha com o filtro.
- Fica de fora, de propósito, o modal de rendimento mensal: filtrar ali
  esconderia campo de entrada.

### Dimensionamento e critério por mês — tkaique9-cloud

- **Frota como entrada** (`f6383b7`): a coluna Frota do Dimensionamento virou
  campo. Em branco, a frota sai do rendimento, como antes. Preenchida, a conta se
  inverte e o rendimento vira número calculado (tarja *da frota*): "com estas
  máquinas, que rendimento cada uma tem de entregar". Só em atividade de frente
  única.
- **Critério por mês** (`f6383b7`, `5941db4`): o modal de rendimento mensal virou
  um cartão por mês — o que entregar (produção por dia e por equipamento), com o
  que contar (frota, rendimento, disponibilidade, utilização) e o que isso
  obriga (rendimento, disponibilidade ou utilização necessária; são
  alternativas, não se somam). Mês que não cabe fica marcado. Campo em branco
  herda da atividade.
  - Critério lançado em algum mês **manda na frota alvo da atividade**, que fica
    suspensa com a tarja *frota do mês manda*.
  - A conta é uma só, `criterioMensal()` em `calculo/atividade.js`, e é ela que
    modal, rastro, motor e relatórios leem.
- **Eficiência operacional** (`67b1fe1`): a hora efetiva passa a ser jornada ×
  disponibilidade × utilização × **eficiência**. Premissa `P.efic` (padrão
  100%, então nada muda para quem não usa) e campo por mês. Disponibilidade é da
  manutenção (quebra); eficiência é da operação (chuva, manobra, espera).
- **Meta diária em duas leituras** (`78dfc3a`, `301e8a4`): por dia **efetivo**
  (÷ dias de operação do mês — é a meta) e por dia **corrido** (÷ dias reais do
  calendário, `diasCorridos()` — é o termômetro). As duas aparecem sempre juntas,
  com o divisor ao lado.
- **Mês parcial** (`2b04682`): `diasDoMes()` recorta o mês pela janela de datas
  da atividade — dezembro que termina no dia 15 vale 15 dias. O mês cortado sai
  marcado *mês parcial*. Volume lançado fora da janela usa o mês cheio. Frota
  fixada por mês também respeita a janela (só toca custo de quem usa frota por
  mês).
- **Transporte e transbordo herdam a janela da colheita** (`59bd87b`) quando não
  têm data própria. **Muda custo**: no cenário conferido, +0,167% — era a frota
  de transporte subdimensionada. Data digitada no transporte continua mandando.

### Acompanhamento e relatórios — tkaique9-cloud

- **Critério por mês na reunião** (`a6e26a0`): painel novo no Acompanhamento do
  Plano, uma linha por atividade e mês, com filtros por gerência e *só o que não
  cabe*, e um KPI com quantos meses estão fora do critério.
- **Relatório novo, "Critério Operacional por Mês"** — são 21 relatórios agora.
  As Metas por gerência e o Acompanhamento ganharam as seções `criterioMes` e
  `criterioApertado`. Tudo sai de `criterioPorMes()`, que chama
  `criterioMensal()`: a folha impressa não recalcula meta.
- **Gerências** (`98a8afb`): a lista passou a ser a da agrícola — só tratos
  culturais, irrigação incluída (29 atividades). Todo o resto, inclusive etapa
  nova, é logística (18). Só rótulo no acompanhamento; não mexe em custo.

### Cadastro de insumos — tkaique9-cloud, aureniorg3, Caio Souza

- **Quebra por família** (`ad8f68d`): o cadastro sai em blocos deduzidos da
  classe agronômica por palavra-chave (`FAMILIAS_INSUMO` em `dados/insumos.js` —
  vale o primeiro termo que casa, então a ordem do catálogo é a regra de
  desempate), e dentro do bloco em ordem de princípio ativo.
  - A linha carrega `data-in` com a **posição original** em `insLista()`. Reordenar
    a exibição não pode trocar o índice, senão editar um produto altera outro.
- **Coluna Grupo** (`01aa116`): campo `fam` põe o produto no bloco escolhido sem
  reescrever a classe técnica. Em branco, vale a dedução.
- **Filtrar e recolher grupo** (`9a32467`, `e5c7924`, `28f57e1`): seletor com a
  contagem de cada grupo, faixa que dobra no clique, "Recolher todos". É visão,
  não dado. As larguras vêm de um `colgroup` com `table-layout:fixed`, para
  dobrar não mexer na tabela.
- **Ficha técnica em modal** (`13cab17`): `INS_ABERTO` deu lugar a `INS_FICHA`
  (um produto por vez).
- **Dois grupos novos** (`8fea47b`): Fertilizantes foliares e Bioestimulantes,
  antes de "fertilizante" na ordem; 11 produtos mudaram de bloco.
- **Busca por nome** nas tabelas de cadastro, tratamentos e materiais
  (`0eb0b5f`, Caio Souza).
- **Configurações** (`6e784ed`, aureniorg3): grupo novo no menu com duas abas.
  *Cadastro de Insumos* saiu da aba Insumos, que ficou com tratamentos e
  materiais. *Grupos de Insumos* cria, renomeia e exclui grupo personalizado
  (`GRUPOS_INS`); só exclui grupo sem insumo usando. As duas usam a permissão da
  aba Insumos.
- **Bula pela AGROFIT** (`87e3801`, aureniorg3): o botão *Buscar* consulta a API
  da Embrapa pelo nome comercial, e quem cadastra confirma o candidato antes de
  gravar o link (`bula_url`, `agrofit_registro`, `agrofit_titular` no insumo).
  - A autenticação OAuth2 fica no servidor (`server/agrofit.js`).
  - As credenciais `AGROFIT_CLIENT_ID` e `AGROFIT_CLIENT_SECRET` vêm do `.env`
    local (`server/env.js`) ou do painel do Render. **Não estão no
    `render.yaml`:** precisam ser criadas à mão em *Environment*. Sem elas, o
    botão responde "AGROFIT não configurado" e o resto funciona.
  - A rota `/api/agrofit/produtos-formulados` exige a permissão de Insumos.

### Interface — Caio Souza

- **Busca por nome em toda tabela** (`95b41ca`, `3c13d97`): qualquer
  `<input class="tbl-busca" data-alvo="#tabela">` funciona sozinho — um handler
  delegado em `app/eventos.js`, uma entrada `.tbl-busca` em `VISUAIS`. Está em 45
  das 72 tabelas; ficaram de fora as grades de mês e as tabelas pequenas de
  comparação.
- **Coluna arrastável** nas mesmas 45 tabelas (`3c13d97`). A ordem fica no
  `localStorage` **por usuário** (login na chave), nunca no documento
  compartilhado. `#t_plano` tranca as duas primeiras colunas (congeladas na
  rolagem). Arrastar troca só as duas colunas (`8642287`), e o `colgroup` vai
  junto (`9b8e9df`).
- Busca e arrasto são aplicados no fim de `render()` (`reaplicarBuscas()`,
  `habilitarReordenacao()` em `ui/componentes.js`): tela nova não precisa de
  código próprio para ter os dois.
- **Menu lateral** (`21b179d`, `2d4bb42`): abre e fecha animado. *Relatório*
  virou atalho no menu, com os 21 relatórios. O botão da barra superior saiu, e o
  painel de gerar virou modal com **pré-visualização** na tela
  (`montarHtmlRelatorio()`, o mesmo HTML do PDF).
- **Chip "Somente visualização" aparecendo para o administrador** (`88bbd12`):
  `.chip{display:inline-flex}` vencia o atributo `hidden`. Elemento com `display`
  próprio precisa de regra `[hidden]{display:none}` explícita.

### Relatório em PDF — Caio Souza

- Folha A4 fixa, texto que quebra linha em vez de cortar coluna, e cabeçalho que
  se repete em cada página (`10d2c00`).
- `table-layout` voltou a `auto` (`f6081d5`): com largura igual para 24
  colunas, a linha ficava maior que a página e gerava página em branco.
- Página em branco no início do relatório impresso removida (`75b1951`).

## 2.22.0 — 2026-09-17 · Valor do arrendamento é o de cada pagamento

**Reverte a opção "Valor informado" da 2.20.0** e corrige a conta direto, sem
chave para o usuário virar.

O valor cadastrado no contrato é o de **cada pagamento**, por hectare. O custo
anual é a parcela vezes os pagamentos do contrato. Até a 2.19.0 o valor era
tratado como anual e dividido entre as parcelas — daí um contrato semestral
aparecer com metade do valor em cada mês (R$ 1.745.688 em vez de
R$ 3.491.375). A 2.20.0 tentou resolver com uma opção por contrato; agora é o
comportamento único.

- **Qtd por ha em cada pagamento** é o nome da coluna, e as formas de pagamento
  passam a dizer o mesmo: "R$ fixo por ha em cada pagamento", "t de cana por ha
  em cada pagamento", "kg de ATR por ha em cada pagamento", "parceria — % da
  produção em cada pagamento".
- **R$/ha/ano** continua mostrando o valor anual por hectare (parcela × pagamentos
  por ano), para comparar fazendas na mesma unidade.
- Pagamentos por ano vêm da periodicidade — mensal 12, bimestral 6, trimestral 4,
  semestral 2, anual 1 — e, em "meses específicos", dos meses marcados.
- **Contrato anual não muda de valor.** Contrato com mais de um pagamento por ano
  passa a custar a parcela vezes o número de pagamentos: semestral dobra, mensal
  multiplica por doze. É o que o contrato diz.

### Meses de pagamento no cadastro do contrato

A marcação dos meses estava só na grade Distribuição mensal. Agora está também
na **linha do contrato**, coluna "Meses de pagamento": uma caixa por mês da
janela, para o contrato que paga em meses escolhidos, **seguidos ou não**.

- Marcar ou desmarcar leva a periodicidade para "Meses específicos" e a agenda
  passa a ser a que está marcada; a periodicidade continua gerando a série
  sozinha a partir do 1º pagamento.
- As caixas do cadastro mostram os doze meses em qualquer filtro de período —
  diferente da grade mensal, que segue o filtro da barra de cima. Configuração
  não se esconde: era o que impediria marcar Dez/Jan com a safra filtrada.
- A grade Distribuição mensal marca os mesmos meses, com o valor de cada
  pagamento à vista.

## 2.21.0 — 2026-09-17 · A classificação técnica chega ao cadastro salvo

A planilha entrou no código na 2.19.0, mas quem já usava o sistema não via os
produtos novos. Motivo: o cadastro de insumos é editável, então ele mora no
**documento salvo** — e o documento manda sobre a base do código. Documento
gravado antes da 2.19.0 seguia com os 57 produtos antigos.

Agora o documento recebe o que a base tem de novo, na primeira abertura:

- Produto que falta **entra**; campo técnico vazio (princípio ativo, código do
  material, unidade, concentração, classe, categoria, formulação, modo e
  mecanismo de ação, grupo químico, fabricante, toxicológica, culturas, estádio)
  **se completa**; nome, preço e estoque que o usuário ajustou **ficam como
  estão**; produto que existe só no cadastro do usuário **fica onde está**.
- A mesclagem roda **uma vez por versão da base** (`INSUMOS_V` em
  `dados/insumos.js`, `INSX_V` no documento). Assim, produto removido de
  propósito não volta a cada abertura.
- O botão **Atualizar com a classificação técnica**, na aba Insumos, refaz a
  mesclagem quando o usuário quiser e diz quantos produtos entraram e quantos
  tiveram a ficha completada.
- Quem adicionar produto novo em `INSUMOS` de agora em diante sobe `INSUMOS_V`
  em um — é o que faz o documento já salvo receber a novidade.

Num documento com os 57 produtos antigos, preço do Sencor e estoque da Ureia
editados e um produto próprio da usina: passa a 160 produtos, o preço e o
estoque editados continuam, a Ureia ganha o princípio ativo e o produto próprio
permanece.

## 2.20.0 — 2026-09-17 · Valor do arrendamento por ano ou por pagamento

O contrato de arrendamento passa a dizer **o que o valor cadastrado representa**:

| Valor informado | Como entra na conta |
|---|---|
| **Por ha/ano** (como era) | o valor anual se divide entre os pagamentos do contrato |
| **Por ha em cada pagamento** | cada pagamento vale área × valor, e o custo anual é a parcela vezes o número de pagamentos do contrato |

Era daí que vinha a parcela pela metade: um contrato semestral cotado por
pagamento aparecia como metade do valor em cada mês, porque o sistema tratava o
valor como anual e dividia por dois. Contrato cotado por pagamento agora mostra
a parcela cheia — R$ 3.491.375 em cada um dos dois meses, e R$ 6.982.750 de
custo anual.

- A coluna **Valor informado** fica na linha do contrato, ao lado da unidade. O
  padrão é **por ha/ano**, então nenhum contrato já cadastrado muda de valor
  sozinho: quem cota por pagamento troca a opção no contrato.
- A coluna **Parcela** mostra quantas parcelas na janela, o valor de cada uma e,
  embaixo, quantos pagamentos o contrato tem por ano e em que base está cotado.
- **R$/ha/ano** passa a mostrar o valor anual por hectare mesmo quando o
  contrato é cotado por pagamento (valor × pagamentos por ano), para o
  comparativo entre fazendas continuar na mesma unidade.
- Pagamentos por ano vêm da periodicidade — mensal 12, bimestral 6, trimestral
  4, semestral 2, anual 1 — e, em "meses específicos", dos meses marcados.
- Relatório de Arrendamentos e rastro do custo mostram a base do valor, os
  pagamentos por ano e o valor da parcela.

### Correção

A linha TOTAL da tabela de fazendas estava deslocada uma coluna desde a versão
2.18.0: o R$/ha/ano do total caía embaixo de "Parcela". Eram 15 colunas no
cabeçalho e 14 na linha de total.

## 2.19.0 — 2026-09-17 · Classificação técnica dos insumos e cadastro de tratamentos

### Cadastro de insumos

A planilha "Classificação Técnica dos Insumos CRV" entrou no cadastro, mesclada
com o que já existia:

- **159 produtos** — os 57 que já estavam mais 102 da planilha.
- **12 produtos** apareciam nas duas listas e receberam a classificação técnica
  mantendo nome, preço e estoque: Provence total, Reator, Combine 500 SC, Alion,
  Lumica, Dontor, Zapp WG, Actara 750, Curbix, Almax, Moddus e Ureia. O nome do
  cadastro foi preservado de propósito — é por ele que os tratamentos citam o
  produto.
- **45 produtos** que não estão na planilha ficaram exatamente como estavam.
- A tabela começa por **nome comercial** e **princípio ativo**, seguidos de
  código do material, unidade de venda, concentração e classe agronômica.
  O botão **Ficha** abre a classificação técnica do produto: categoria
  operacional, formulação, modo e mecanismo de ação, grupo químico, fabricante,
  classificação toxicológica, culturas registradas, estádio dos alvos, status da
  validação e observação técnica.
- Unidade de venda ganhou ton, pc e un, além de kg e lt, e "—" para o produto
  que ainda não tem unidade informada.
- Produto da planilha entra **sem preço e sem estoque**. Enquanto faltar, a
  linha aparece marcada e a Validação separa o que é pendência de verdade —
  insumo sem preço usado em algum tratamento — do que é só cadastro a completar.

### Cadastro de tratamentos

- **Incluir e excluir tratamentos.** "Adicionar tratamento" cria o código, que
  já pode ser vinculado a uma atividade no Plano Operacional antes de ter
  produto. Remover desvincula as atividades que o usavam, e vale também para os
  tratamentos que vinham do cadastro base.
- **Alterar o código**, na própria linha do cadastro ou no editor de composição.
  A mudança leva a composição, o nome, as etapas e as atividades do Plano
  Operacional que já apontavam para o código antigo. Código repetido é recusado.
- **Etapa de uso**, marcada por caixas na linha do tratamento e no editor:
  PS preparo de solo · PL plantio · TP tratos culturais de cana planta ·
  TS tratos culturais de cana soca · CO colheita (maturação) ·
  AC apoio e conservação. Sem marcação, a célula mostra em que etapa o plano
  está usando o tratamento, em vez de inventar uma marca.
- A Validação passou a comparar as duas coisas e avisa quando um tratamento
  marcado para uma etapa é aplicado em atividade de outra.
- O nome do tratamento também é editável na linha, e o relatório ganhou a aba
  **Tratamentos** — composição, etapas marcadas, etapas de uso no plano,
  custo/ha, atividades e área tratada — dentro dos relatórios de Plantio e de
  Tratos.

### Correção

Os tratamentos **1 PF** e **2 PF** citavam "MicroGeo" e o cadastro tem
"Microgeo": o produto não era encontrado, entrava no custo como zero e ninguém
via. Corrigido o nome nas duas linhas. O efeito é 1,5 kg/ha × R$ 36 × 1,04 de
atualização = **R$ 56,16/ha a mais** em cada um dos dois tratamentos (1 PF foi
de R$ 373,81 para R$ 429,97/ha; 2 PF, de R$ 298,36 para R$ 354,52/ha). No custo
do plano o efeito depende das áreas em que esses dois tratamentos estão
lançados.

## 2.18.0 — 2026-09-17 · Meses de pagamento do arrendamento

Cada contrato de arrendamento passa a ter os seus meses de pagamento, seguidos
ou não.

- **Periodicidade** ganhou Bimestral, Trimestral e **Meses específicos**, além de
  Mensal, Semestral e Anual. A periodicidade gera a série a partir do mês do 1º
  pagamento; "Meses específicos" começa da série que estava valendo, para
  ajustar em cima dela.
- Na grade **Distribuição mensal**, cada célula-mês virou um pagamento do
  contrato: clicar marca ou desmarca, a periodicidade passa a "Meses
  específicos" e o valor anual se divide em parcelas iguais entre os meses
  marcados. Os meses podem ser quaisquer — Mai, Ago e Fev, por exemplo.
- A tabela de fazendas mostra a agenda de cada contrato, quantas parcelas e o
  valor de cada uma; a grade mostra o número de parcelas por contrato.
- Pagamento que cairia fora da janela do orçamento não entra, e a **Validação**
  avisa quando um contrato fica sem nenhum pagamento dentro dela.
- Os meses valem no critério **Caixa**. Em **Competência** cada mês continua
  recebendo 1/12 do valor anual, e a agenda fica como registro do contrato.
- O relatório de Arrendamentos ganhou periodicidade, meses de pagamento,
  parcelas, valor da parcela e uma linha por mês do orçamento; o rastro de
  custo mostra a agenda junto de área e R$/ha/ano.

### Correção

O campo **1º pagamento** nunca mostrava o mês salvo — a linha calculada
sobrescrevia `mes` com o vetor mensal de valores e o select caía em "Fora do
período". O índice do primeiro pagamento agora vem em `mes0`.

## 2.17.0 — 2026-09-17 · Perfis e permissões de edição

Gestão de perfis por **Caio Souza**.

Todo usuário logado continua **vendo todas as abas**. O que muda é que cada
**perfil** define em quais abas o usuário **edita**. Nas outras, campos e botões
ficam desativados com o aviso *Somente visualização*, e filtros, detalhamentos,
exportar e tema seguem funcionando.

### Como se usa

Aba **Usuários › Perfis e permissões** (só administrador):

- **Criar perfil** pelo nome (*Agrícola*, *Logística*…). Nasce só com
  visualização.
- **Matriz aba × perfil**, agrupada como o menu: marcar a aba libera a edição
  dela. *Edita tudo* libera todas, inclusive abas criadas no futuro; desmarcá-lo
  mantém as abas de hoje marcadas, para não cortar a edição de uma equipe por um
  clique.
- **Trocar o perfil** de um usuário direto na tabela de usuários.
- **Renomear** e **excluir** perfil (só se ninguém o usa).

A mudança de permissão vale na hora, inclusive para quem já está com o sistema
aberto.

### Nada muda para quem já usa

- **Usuário**, o perfil de todos os não-administradores de hoje, nasce com *Edita
  tudo* — mesmo acesso de antes.
- **Administrador** continua editando tudo e é o único que gerencia usuários e
  perfis.
- O cálculo não foi tocado: resultado idêntico ao da 2.16.1.

### A regra vale no servidor, não só na tela

[`server/permissoes.js`](server/permissoes.js) filtra **toda gravação** do plano:
o que o perfil não pode alterar é descartado antes do banco. Sem isso, qualquer
usuário logado editaria tudo chamando a API direto. O navegador sempre envia o
documento inteiro, então só volta como *ignorado* o que chegou diferente do banco,
e o rodapé avisa *Salvo — sem permissão para alterar: …*.

O catálogo de abas × dados foi **medido na interface**, acionando cada controle
de cada aba e anotando que dado mudou — foi assim que apareceram, por exemplo,
a área irrigada (gravada no Plano, mas editada na Irrigação) e o destino das
unidades de frota (editado em quatro abas, uma delas só visível com a lista
expandida).

### Proteções

- Perfil apagado ou inexistente cai em **somente visualização**, nunca em acesso
  total.
- O sistema nunca fica sem **administrador ativo**: a API recusa rebaixar ou
  desativar o último, e ninguém rebaixa nem desativa a si mesmo.
- Perfil em uso não pode ser excluído; *Administrador* e *Usuário* são fixos.
- A aba Validação ganha *"Todo dado editável tem aba de permissão"*: se alguém
  criar um dado novo no plano e esquecer de ligá-lo a uma aba, a gravação por
  perfis restritos seria descartada em silêncio — agora isso aparece.

### Banco de dados

[`schema.sql`](server/store/schema.sql) ganha a tabela `perfis` e remove o
`CHECK` que prendia `usuarios.papel` a admin/usuario. Tudo idempotente, roda
sozinho no primeiro acesso após o deploy, sem migração manual.

### Como foi verificado

- **31 testes da API**: quem grava o quê, chaves reordenadas pelo banco, `PUT`
  restrito, perfil apagado, permissão trocada com sessão aberta, perfil em uso,
  último administrador.
- **Tela real contra o servidor real**, no navegador: um perfil restrito forçou
  edição — por script, inclusive em controle desativado — em 143 tipos de
  controle; no banco só mudaram dados das abas permitidas. Filtros e
  detalhamentos continuaram funcionando nas abas travadas.
- Encontrado e corrigido durante o teste: o app normaliza listas ao abrir, e todo
  perfil restrito via um aviso falso de "sem permissão" a cada gravação.
- Motor de cálculo idêntico (impressão digital `a3e20bfd`).

### Pendente

A troca da própria senha fica na aba Usuários, que só o administrador vê — para
os demais perfis, quem redefine a senha é o administrador.

## 2.16.1 — 2026-09-17 · Correções de continuidade e robustez

Varredura de bugs em todas as abas, sem mudar estrutura nem regra de cálculo.
Cada bug abaixo foi **reproduzido pela interface antes** de ser corrigido e
**reproduzido de novo depois** para confirmar a correção.

**O que não mudou:** com os dados de teste, o resultado de
`calcularCompleto()` é idêntico ao da 2.16.0, bit a bit (impressão digital
`a3e20bfd`, total R$ 47.488.025,98). Das 24 abas, 21 renderizam HTML idêntico;
as três que mudaram estão explicadas no fim desta entrada.

### Bugs corrigidos

1. **Cursor sumia ao digitar a área na aba Irrigação.** Irrigação e Plano geram
   campos com o mesmo `data-c`/`data-m`; `leve()` procurava o campo no documento
   inteiro, achava primeiro o da aba escondida, o `focus()` falhava em silêncio e
   o resto da digitação se perdia. Agora procura primeiro na aba de origem.
   [app/ciclo.js](public/js/app/ciclo.js)

2. **Velocidade do transporte zerada quebrava 5 abas.** Apagar `velC` ou `velV`
   dividia por zero; o `Infinity` se espalhava por horas, frota e efetivo e
   aparecia como texto na Capa, Plano, Dimensionamento, Mão de Obra e
   Acompanhamento. A fórmula do ciclo também estava **duplicada** (custo e aba
   Transporte, cada um com sua cópia): virou uma função só,
   `cicloTransporte()`, com a mesma proteção que o motor já usa em `dispTr` e
   `tch`. Para velocidades válidas a conta é idêntica.
   [calculo/transporte.js](public/js/calculo/transporte.js) ·
   [calculo/atividade.js](public/js/calculo/atividade.js)

3. **`dias` zerado gerava `NaN` em `tonDia` do transporte.** Mesma proteção.

4. **Texto com aspas corrompia dados.** Em 10 campos de texto livre, uma aspa
   fechava o `value="..."` antes da hora: o campo exibia o nome cortado e a
   próxima edição **gravava o nome cortado**. Isso já acontecia com dado real:
   `Filtro de disco 3"` e `Mangueira hidráulica 1/2"` apareciam sem a polegada.
   Em Insumos era pior — preço e estoque são gravados com o nome como chave
   (`data-ip`), e a chave quebrava. Afetava apoio, rotas e veículos, produto,
   princípio ativo, concentração, nome de tratamento (49 pontos da tela) e
   materiais. `esc()`, que estava **copiado em 5 telas** — uma delas sem tratar
   a aspa —, virou uma função única em
   [nucleo/formato.js](public/js/nucleo/formato.js) e passou a ser aplicada em
   todo texto digitado pelo usuário, inclusive no modal de rastro.

5. **Renomear um insumo zerava o custo dos tratamentos-base.** O renome só
   alcançava tratamentos customizados; os do cadastro seguiam citando o nome
   antigo, sem preço. Ex.: renomear *Provence total* derrubava o tratamento
   *1 SE* de R$ 301,85/ha para R$ 138,57/ha. Agora o tratamento-base é trazido
   para os customizados (`destravar()`, o mesmo passo de editar uma dose) antes
   do renome. [app/eventos.js](public/js/app/eventos.js)

6. **Cache de tratamentos preso em valor velho.** A chave do cache não incluía o
   cadastro editável de insumos, que o cálculo lê. Consequência visível:
   renomear e desfazer o renome **não recuperava o custo**.
   [calculo/insumos.js](public/js/calculo/insumos.js)

7. **Relatório PDF interpretava texto como HTML.** Nome com aspa ou `<` virava
   marcação no relatório impresso. O Excel e o CSV não tinham o problema.
   [io/relatorio.js](public/js/io/relatorio.js)

8. **"−26 pessoas" no detalhamento do efetivo.** A linha de reconciliação fazia
   `efetivo da Capa − soma dos departamentos`, que dá negativo porque os
   departamentos incluem os operadores de apoio e a Capa não inclui — de
   propósito, como explica a aba Pessoas. Agora a linha diz o que é:
   *Operadores de apoio — no detalhamento, fora do efetivo total: 26 pessoas*.
   No detalhamento da frota, o título conta conjuntos e a lista conta máquinas e
   implementos separados (90 × 169+); os dois rótulos agora dizem isso.
   [calculo/rastro.js](public/js/calculo/rastro.js)

9. **Validação aprovava insumo sem preço.** A checagem lia o cadastro original
   (`CFG.insumos`), não o editado: insumo incluído pelo usuário sem preço
   passava como ✓. [ui/validacao.js](public/js/ui/validacao.js)

### Prevenção: conferências novas na aba Validação

- **Velocidades do transporte preenchidas** — o motor não quebra mais com
  velocidade zerada, mas o transporte sai subdimensionado; isso precisa aparecer.
- **Plano de Contas confere com o total** — no mesmo padrão das conferências de
  meses e etapas. **Hoje ela aparece como pendência**, ver abaixo.

### Encontrado e não corrigido — precisa de decisão

**O Plano de Contas soma R$ 53,7 mi contra um custo total de R$ 47,5 mi
(113,1%).** A diferença, R$ 6.197.384, está inteira nas contas de mão de obra;
todas as outras batem com o motor ao centavo. Causas:

- as contas 200-15 a 200-18 já recebem o custo de mão de obra **cheio** (o
  custo-hora embute encargos e benefícios), e 200-35/36 e 200-51 a 200-77
  lançam encargos e benefícios **de novo**;
- os benefícios são estimados como *efetivo × benefício × 12 meses*, o que passa
  do total de mão de obra e deixa **INSS + FGTS negativos** (−R$ 147.135);
- os benefícios das contas usam o valor do cadastro e **ignoram o ajuste feito
  na aba Mão de Obra**;
- a mão de obra do Apoio (R$ 60.793) não entra em conta nenhuma.

Não foi corrigido porque a forma de repartir mão de obra entre salário, encargo
e benefício é decisão contábil e mudaria números usados pela gestão. Está em
[ui/contas.js](public/js/ui/contas.js), `contasValores()`.

### As três abas cujo HTML mudou

- **Validação** — as conferências novas.
- **Capa** — contador de pendências de 7 para 8 (a do Plano de Contas).
- **Insumos** — `Filtro de disco 3"` e `Mangueira hidráulica 1/2"` passam a
  aparecer com a polegada (bug 4).

### Como foi verificado

App rodado com a API simulada (sessão e plano de produção como fixture) e
exercitado pela interface: os 1.791 campos editáveis agrupados em 148 tipos
(nenhuma exceção, mapa campo → estado idêntico antes e depois), as 41 premissas
e os 101 tipos de campo numérico zerados, os 14 campos de texto com aspas e
HTML, os 107 nós do modal de rastro abertos, relatórios resumido e detalhado.
Grafo de importação: 86 módulos, 344 importações, sem ciclo.

## 2.16.0 — 2026-09-16 · KPIs interativos em todo o app

Todo cartão de indicador (82 KPIs, nas 19 abas) agora abre a explicação de
onde o número vem — estende a gaveta de rastreabilidade da versão anterior
em vez de duplicá-la.

### Modal com blur, no lugar da gaveta lateral

`#rastro`/`#rastro_fundo` deixam de ser uma gaveta fixa na lateral e viram
um modal centralizado (`.ra-modal`) com blur no fundo (`backdrop-filter`) e
entrada animada — só na transição fechado→aberto, não a cada tecla digitada
em outro campo (`pintarRastro()` roda a cada `render()`, então sem esse
cuidado a animação piscaria o tempo todo com o modal já aberto).

### Filtro de período

Indicadores com granularidade mensal (diesel, pico de mobilização) ganham
um seletor **Ano todo / Safra / Entressafra** dentro do próprio modal, que
recalcula a partir do último resultado já computado — sem recalcular o
plano inteiro.

### Famílias novas em `calculo/rastro.js`

O rastro só cobria composição de custo (R$). Oito famílias novas cobrem o
que não é custo: `pessoas:*` (efetivo, com drill-down por departamento e
função), `frota:*` (horas, frota operacional/apoio, CRM, transbordos,
reforma), `diesel:*`, `insumos:*`, `forn:*` (matéria-prima), `tpess:*`
(transporte de pessoal), `contas:*` (plano de contas) e `hect:*` (hectares
operados). Cada uma só **lê** o objeto que o `calculo/<domínio>.js`
correspondente já calcula — nenhuma lógica de cálculo foi tocada.

### Arquivos

`kpi()` em [componentes.js](public/js/ui/componentes.js) ganha um 5º
argumento opcional (a chave do rastro). As 17 telas com KPI (`ui/*.js`)
passam a chave certa em cada chamada — mecânico, sem mudar nenhum número
exibido.


## 2.15.0 — 2026-09-16 · Relatórios e exportação

Dezesseis relatórios nomeados, escolhidos no botão **Relatório** do topo, e três
formatos de saída para cada um: PDF, Excel e CSV.

### Relatórios

| Relatório | O que traz |
|---|---|
| Orçamento Agrícola Anual | o orçamento inteiro, nas 20 abas padronizadas |
| Orçamento por Fazenda | fazendas arrendadas, áreas próprias e fornecedores, com R$/ha |
| Orçamento por Centro de Custo | etapa a etapa, com direto, arrendamento, administrativo e indireto |
| Orçamento por Atividade | cada atividade com volume, horas, frota, efetivo e R$/un |
| Orçamento por Natureza | composição por natureza e plano de contas |
| Orçamento Mensal | mês a mês, grandes contas e períodos |
| Orçamento de Plantio | plantio e preparo de solo, insumos e dimensionamento |
| Orçamento de Tratos | tratos culturais, insumos e irrigação |
| Orçamento de Colheita | colheita, transporte e combustível |
| Orçamento de Logística | transporte de cana, de pessoal e frete de fornecedor |
| Orçamento de Frota | necessidade, frota cadastrada, manutenção e apoio |
| Orçamento de Mão de Obra | cargos, efetivo, departamento e fluxo mensal |
| Orçamento de Arrendamentos | fazendas, formas de pagamento e rateio por etapa |
| Orçamento de Fornecedores | contratos, produção por origem e logística |
| Fluxo de Caixa Agrícola | desembolso mensal, acumulado e participação |
| Indicadores de Custo | R$/ha, R$/t, R$/kg de ATR, L/ha, custo-hora, pesos |

### As 20 abas do Excel

Resumo Executivo · Premissas · Área · Produção · Plantio · Tratos · Colheita ·
Transporte · Frota · Manutenção · Mão de Obra · Insumos · Arrendamentos ·
Fornecedores · Administração · Custos · Plano de Contas · Fluxo de Caixa ·
Cenários · Validação

Abas novas nesta versão: **Premissas** (cada premissa com onde ela entra no
cálculo), **Área**, **Produção**, **Transporte**, **Administração**, **Fluxo de
Caixa** (desembolso, acumulado e percentual), **Cenários** (sensibilidade de
±5% e ±10% em diesel, mão de obra, insumos, manutenção, arrendamento e
administração, com o efeito no custo total e no R$/ha) e **Validação**.

### Exportação

- **Excel** — uma aba por seção, largura de coluna ajustada ao conteúdo e nome
  de arquivo com o relatório escolhido.
- **PDF** — mesmas tabelas, com o nome do relatório no cabeçalho.
- **CSV** — arquivo único com as seções em sequência, separador `;` e BOM, que é
  o que o Excel em português abre sem pedir importação.
- O nível **detalhado** acrescenta ao relatório anual as abas de apoio: plano
  operacional, dimensionamento, por atividade, por centro de custo, por fazenda,
  mensal, períodos, natureza, combustível, apoio, irrigação, pessoas, logística,
  indicadores, frota cadastrada e modelos da frota.

### Estrutura

As seções saíram de `io/relatorio.js` para `io/secoes.js`, cada uma uma função
pura de `R` para `{aba, titulo, cab, linhas}`. `io/relatorio.js` ficou só com o
catálogo dos relatórios e a escrita dos três formatos.

### Ressalva

O plano operacional não é lançado por fazenda. No Orçamento por Fazenda, a
parcela de cada fazenda arrendada vem da proporção de área dentro do total
arrendado — é o que o modelo sabe hoje. Para orçar fazenda a fazenda de verdade,
o plano precisaria de área por fazenda em cada atividade.

## 2.14.0 — 2026-09-16 · Rastreabilidade dos cálculos

Clicar num custo abre uma gaveta que explica a composição dele, descendo a
cadeia até a premissa:

    custo total → centro de custo → etapa → atividade → área → horas
    → equipamento → consumo → preço → premissa

### Onde se clica

| Ponto | Abre |
|---|---|
| Botão "Explicar o custo total", em Custos e no Painel | o plano inteiro por centro de custo, natureza e período |
| Total de uma etapa, na tabela de custo por etapa | atividades, naturezas e os rateios que a etapa recebe |
| Linha de natureza, na composição por natureza | as atividades que geram aquele custo |
| Linha de mês, no custo mensal | grandes contas e atividades lançadas no mês |
| Qualquer linha com seta, dentro da gaveta | desce um nível |

### O que a gaveta mostra numa atividade

Centro de custo e etapa; área ou volume lançado mês a mês; rendimento,
utilização, horas, capacidade por equipamento, frota, turnos, escala e efetivo;
uma linha por frente com máquina, implemento, horas, litros e consumo em L/h;
diesel com o preço médio ponderado dos meses, mão de obra com o custo-hora do
cargo, CRM, insumos com o tratamento e a dose por hectare, e a tarifa de
terceirização. No pé, as premissas usadas — dias, horas por dia,
disponibilidade, preço do diesel, salário do cargo, encargos.

A gaveta tem caminho de navegação, botão voltar, fecha com Esc ou clique fora,
e é redesenhada a cada recálculo, então acompanha qualquer edição.

`calculo/rastro.js` monta a explicação como função pura do resultado
consolidado; `ui/rastro.js` só desenha.


## 2.13.0 — 2026-09-16 · Módulo de custos administrativos

Nova aba **Custos Administrativos**. A administração deixa de ser um valor
global nas Premissas e passa a ser um cadastro de linhas, cada uma com o seu
critério de rateio entre as etapas do plano.

### Naturezas cadastradas

Estrutura administrativa; salários, encargos e benefícios da administração;
tecnologia, softwares e comunicação; aluguel e energia; viagens, treinamentos,
EPIs e segurança; consultorias, auditorias e serviços especializados; despesas
gerais. Dá para incluir e remover linhas.

### Critérios de rateio

| Critério | Distribui |
|---|---|
| Hectare operado | proporcional aos hectares da etapa |
| Tonelada | proporcional às toneladas da etapa |
| Horas-máquina | proporcional às horas da etapa |
| Custo direto | proporcional ao custo direto da etapa |
| Percentual por etapa | pelos percentuais informados na aba |
| Centro de custo | a linha inteira vai para a etapa escolhida |

Linha cujo critério não tem base no plano — tonelada sem colheita lançada, por
exemplo — fica **sem rateio** e volta para o rateio indireto geral, com aviso na
coluna Rateio, em vez de ser distribuída por um peso inventado.

### Integração

O total alimenta a natureza Administração na aba Custos, a conta EST-01 no Plano
de Contas e os fixos do Painel. O campo Administração nas Premissas virou campo
calculado. No primeiro uso o módulo herda o valor global que estava lá, para o
custo do plano não mudar sozinho.

As etapas ganharam a coluna de horas, que serve de base ao critério por horas, e
o custo administrativo rateado entra no total de cada etapa, ao lado do
arrendamento.


## 2.12.0 — 2026-09-16 · Adubação de fundação

Nova operação no Plano Operacional: **A39 Adubação de fundação**, em ha/mês,
dentro de PLANTIO, logo depois do Plantio, classificada como cana planta.

Trator 4x4 150 CV com distribuidor de sólidos, operador de máquinas agrícolas
II, rendimento de partida 4,0 ha/h. Aceita os mesmos dois modos das outras
aplicações de sólidos: **trator** próprio ou **terceiro** pela tarifa em R$/ha,
com divisão de área entre os dois.

O adubo em si entra por tratamento, na aba Insumos — MAP, KCL e ureia já estão
no cadastro.


## 2.11.0 — 2026-09-16 · As funções do plano passam a ser os cargos do ERP

O cadastro de 14 funções inventadas (F01 a F14) sai. Entram os **31 cargos
ativos do ERP**, com o código e o nome como estão lá, mais os **3 cargos de
oficina** — mecânico, líder de equipe e ajudante — que a extração agrícola não
traz mas o plano precisa para a equipe de manutenção. Total: 34 cargos.

### Salários

Cada cargo herdou salário e adicional do cargo equivalente do cadastro
anterior, e o valor ficou **editável na aba Mão de Obra**. São valores de
partida, a confirmar com a folha:

| Cargo do ERP | Herdou de | Salário |
|---|---|---|
| OP. DE MAQUINAS AGRICOLAS I | F01 operador de máquinas | 1.895,50 |
| OP. DE MAQUINAS AGRICOLAS II | F11 operador de transbordo | 2.900,00 |
| OP. DE MAQUINAS AGRICOLAS III | F02 operador de colhedora | 3.348,46 |
| MOTORISTA II e III | F03 motorista de caminhão | 1.895,50 |
| MOTORISTA I e de diretoria | F12 motorista de veículo leve | 1.895,50 |
| TRABALHADOR RURAL | F04 operário rural | 1.621,00 |
| AUXILIAR AGRICOLA | F06 auxiliar rural | 1.621,00 |
| LIDER AGRICOLA I a IV | F07 líder de turma | 4.200,00 |
| ASSISTENTE e AUXILIAR ADMINISTRATIVO | F08 assistente agrícola | 2.703,71 |
| FISCAL, SUPERVISOR, COORDENADOR, GERENTE, TOPOGRAFO | F10 técnico agrícola | 5.200,00 |

### Níveis I a V saem

O nível agora está no próprio cargo (Motorista II e III, Op. Máquinas I, II e
III), como no ERP. Sumiram o seletor de nível do Plano Operacional, do
Dimensionamento e do Apoio, e o editor de cinco faixas da aba Mão de Obra. A
**gratificação por cargo** continua, em painel próprio.

O quadro de funções passa a mostrar o salário do cargo, editável ali mesmo.

### Quadro ativo

`funcionarios-base.js` foi regerado: cada linha aponta para o próprio cargo do
ERP, então não existe mais "cargo sem função equivalente" — todos os 871 ativos
caem numa função, e os 33 afastados seguem à parte.


## 2.10.0 — 2026-09-16 · Base de funcionários ativos do ERP

`dados/funcionarios-base.js`: quadro ativo da CRV-MG em 16/09/2026, **904
pessoas**, por cargo, especialidade e departamento — 120 combinações.

**Sem dado pessoal.** A planilha de origem traz nome, matrícula e datas de
nascimento e admissão de cada pessoa, e este repositório é público. Só a
contagem entrou.

### Mapeamento para as funções do plano

Cada combinação de cargo e especialidade aponta para a função equivalente:
colhedora para F02, trator transbordo para F11, caminhão para F03, máquinas
herbicida e uniport para F05, demais operadores para F01, trabalhador rural
para F04, auxiliar agrícola para F06, liderança para F07, fiscal e topografia
para F10, assistente agrícola para F08, veículo leve para F12.

| | Pessoas |
|---|---|
| Disponível para a operação | 836 |
| Cargo sem função equivalente (supervisão, coordenação, gerência, administrativo, ônibus) | 35 |
| Afastados e desistentes | 33 |
| **Total no ERP** | **904** |

### Na tela

No bloco Dimensionamento de pessoas entrou a tabela **Quadro ativo do ERP**, com
a base como veio e os três totais acima.

A tabela por função ganhou a coluna **Ativos ERP**, que alimenta o disponível
direto da base, e a coluna **Ajuste**, opcional, que sobrepõe a base quando
preenchida — em branco, vale o ERP. A comparação mês a mês passa a rodar contra
o quadro real.

A extração é da área agrícola: mecânicos e ajudantes de oficina (F09, F13, F14)
não vêm nela e aparecem com zero até serem informados no ajuste.

## 2.9.0 — 2026-09-16 · Login e gestão de usuários

O sistema deixa de ficar aberto na internet — resolve a dívida nº1 do
[CLAUDE.md](CLAUDE.md). Tela de login, aba **Usuários** (só-admin) e sessão
por cookie.

### Autenticação

Hash de senha com `crypto.scrypt` nativo do Node — nenhuma dependência nova
(`package.json` segue só com `pg`). Sessão é um token opaco guardado na tabela
`sessoes`, não JWT: cada requisição confere contra o banco, então desativar um
usuário ou fazer logout derruba o acesso na hora. Cookie `httpOnly`,
`SameSite=Lax`, validade de 30 dias.

Duas tabelas novas em [schema.sql](server/store/schema.sql): `usuarios` e
`sessoes`. Implementado nos dois destinos de armazenamento — Postgres e o
modo arquivo local (`.data/usuarios.json`), mesma interface das duas.

### Primeiro usuário, sem senha no código

`POST /api/auth/bootstrap` cria o primeiro usuário (sempre admin) e só
funciona uma vez, enquanto a tabela estiver vazia — depois disso é sempre
409. Não há login nem senha fixos em nenhum arquivo do repositório.

### Papéis

**admin**: tudo, inclusive a aba Usuários (criar, ativar/desativar, redefinir
senha de qualquer um). **usuário**: lê e edita o plano normalmente, e pode
trocar a própria senha.

### Tela de login

Fundo animado exclusivo dessa tela — grade de pontos que reage ao cursor
(proximidade esquenta a cor, clique empurra com física de mola-amortecedor),
portado pra canvas + JS vanilla sem dependência nova.

### Arquivos

`server/auth.js` (novo), métodos de usuário/sessão em `server/store/postgres.js`
e `server/store/arquivo.js`, rotas novas em `server/api.js`.
`public/js/nucleo/sessao.js`, `public/js/io/autenticacao.js`,
`public/js/ui/login.js`, `public/js/ui/usuarios.js`,
`public/js/ui/fundo-login.js` (todos novos). O motor de cálculo não foi
alterado.


## 2.8.0 — 2026-09-16 · Turnos por atividade e necessidade mês a mês

### Turnos na atividade

Ao lado da escala, cada atividade agora escolhe os turnos: **1t, 2t ou 3t**, ou
Padrão, que segue o modo de execução ou o cadastro. A escolha grava em
`DIM[cod].turnos` e entra no efetivo junto com a escala. Na colheita do teste:
1t = 4 pessoas, 2t = 7, 3t = 11.

A coluna Ativos da função mostra, em cada linha, o quadro ativo informado para
aquela função — é conferência visual; o cruzamento que vale é por função,
na tabela abaixo.

### Necessidade x quadro ativo

A tabela por função passa a abrir com os campos informados — quadro ativo,
férias e demissões — seguidos de disponível, necessidade, pico mensal, a
contratar e excedente.

Abaixo dela, tabela nova: **necessidade mês a mês x disponível**. Uma linha por
função, uma coluna por mês do orçamento, o mês de pico em negrito e a célula em
vermelho quando a necessidade do mês passa o disponível. No rodapé, a
necessidade total de cada mês e quanto falta contratar naquele mês.

Enquanto nada é informado no quadro, a matriz não pinta falta — não há com o
que comparar.


## 2.7.0 — 2026-09-16 · Nível e escala por atividade

No bloco Dimensionamento de pessoas, cada atividade passa a ter uma linha com
**seletor de nível da função** e **seletor de escala**, e as frentes aparecem
como sub-linhas. A coluna Fator mostra o que a escala exige de gente por posto.

Escalas em `dados/escalas.js`: 6x1 (1,17), 5x1 (1,20), 5x2 (1,40), 4x1 (1,25) e
12x36 (2,00). Em branco, a atividade usa o fator das Premissas de Mão de Obra,
como antes. A escolha é gravada em `DIM[cod].esc`.

O fator entra no efetivo e no custo de mão de obra daquela atividade. Exemplo:
colheita com 11 pessoas no 6x1 passa a 13 no 5x2, e a mão de obra sobe de
R$ 184.457 para R$ 221.348.

### Correção

O seletor de nível do Plano Operacional estava sem efeito desde a entrada do
módulo de fornecedores: as duas telas usavam `data-fn`, e o handler de
fornecedor, que vem antes, engolia o evento. As linhas de fornecedor passaram a
usar `data-fnr`.


## 2.6.0 — 2026-09-16 · Dimensionamento em três blocos

A aba Dimensionamento passa a ter três dimensionamentos separados, cada um num
bloco recolhível com título destacado e um resumo que continua legível com o
bloco fechado. São `<details>` nativos: recolhem sem JavaScript e respondem ao
teclado.

| Bloco | Conteúdo |
|---|---|
| Dimensionamento por atividade | indicadores e a tabela de atividades e frentes |
| Dimensionamento de frota | frota por tipo de máquina, necessidade x base do ERP, frota de apoio |
| Dimensionamento de pessoas | **novo** |

### Dimensionamento de pessoas

Primeira tabela: atividade › especialidade › função › pessoas, uma linha por
frente, com frota e horas. A especialidade vem da base de frota do ERP quando a
máquina está cadastrada lá.

Segunda tabela, por função: necessidade dimensionada, pico mensal (com o mês),
quadro ativo, férias programadas e demissões programadas — os três editáveis —
mais disponível, a contratar e excedente. Disponível = ativo − férias −
demissões; a contratar compara o disponível com o **pico mensal**, não com a
soma do dimensionamento, que contrataria gente para mês em que a atividade não
roda.

O quadro informado é gravado no documento (`QUADRO`, por função).

Falta o modelo do cliente para estender: nível e escala por linha, colunas por
período (entressafra e safra) e o par equipamento/pessoas da planilha de mão de
obra agrícola.

## 2.3.0 — 2026-09-16 · Calcário e gesso em tratos culturais

Duas operações novas no Plano Operacional, dentro de TRATOS CULTURAIS:
**A37 Aplicação de calcário** e **A38 Aplicação de gesso**, em ha/mês.

Cada uma aceita só dois modos de execução, marcados na coluna Modo de execução:
**Trator** (Trator 4x4 150 CV + Distribuidor de sólidos, operador de máquinas
agrícolas) ou **Terceiro** (prestador de serviço pela tarifa em R$/ha, sem frota
nem efetivo próprios). Dá para dividir a área entre os dois.

Para isso o cadastro de atividade ganhou dois campos opcionais, lidos em
`calculo/atividade.js`: `modos`, que limita os modos oferecidos, e `modoCfg`,
que ajusta máquina, implemento, rendimento ou função de um modo naquela
atividade. Atividade sem esses campos continua com os cinco modos de sempre.

Rendimentos de partida: 5,0 ha/h para calcário e 5,5 ha/h para gesso; ambas
classificadas como cana planta no rateio de tratos. Ajustáveis na aba
Dimensionamento e no cadastro.


## 2.2.0 — 2026-09-16 · Ano agrícola completo no Plano Operacional

### Janela do orçamento: 9 para 12 meses

De Out/26–Jun/27 para **Abr/26 a Mar/27**, o ano agrícola inteiro: oito meses de
safra (abr a nov) seguidos dos quatro de entressafra (dez a mar).

**O orçamento muda de tamanho.** Custos mensais e fixos — administração,
depreciação, arrendamento, estrutura indireta, equipe de manutenção, apoio —
passam a contar 12 meses em vez de 9. O total projetado sobe por consequência.

### Migração do documento gravado

`io/persistencia.js` remapeia o documento de 9 meses pelo **nome** do mês, não
pelo índice: Out/26 continua em Out/26. Abr/27, Mai/27 e Jun/27 não existem na
janela nova e vão para o mês equivalente do novo ano (Abr/26, Mai/26, Jun/26) —
nada se perde. Remapeia `PLANO`, `DIESEL_MES`, o mês de pagamento de `ARREND` e
o mês dos lançamentos esporádicos.

### Plano Operacional

- Colunas de safra em verde e de entressafra em palha, com legenda.
- Filtro **Mostrar meses**: todos, só safra ou só entressafra. Esconde colunas,
  nunca apaga lançamento.
- Setas do teclado, Tab e Enter andam entre as células como numa planilha. As
  setas laterais só trocam de célula quando o cursor está na ponta do texto, e
  pulam as colunas escondidas pelo filtro.

### Atenção

O contrato de regressão em [CLAUDE.md](CLAUDE.md) foi capturado com a janela de
9 meses. Os totais e as impressões digitais de lá não valem mais e precisam ser
recapturados.


## 2.1.0 — 2026-09-16 · Módulo de fornecedores de cana

Nova aba **Fornecedores de Cana** e consolidação da matéria-prima por origem.

### Cadastro

Fornecedor, propriedade, área, toneladas contratadas e estimadas, TCH, ATR,
distância, período de entrega, modalidade de contrato, preço, prêmio, descontos,
frete, logística, qualidade e histórico da safra anterior.

Modalidades: Consecana (ATR × preço do kg), preço fixo por tonelada, parceria
(% da produção) e permuta (cana por área, valorada pelo Consecana). Tonelada
estimada em branco usa área × TCH; frete em branco usa distância × tarifa/km.

### Origens, sem misturar naturezas contábeis

| Origem | Natureza | De onde vem o custo |
|---|---|---|
| Cana própria | Custo de produção — área própria | plano agrícola, parcela da área própria |
| Cana arrendada | Custo de produção + arrendamento | plano agrícola + todo o arrendamento |
| Cana de fornecedor | Aquisição de matéria-prima | contrato de compra |
| Cana de parceria | Aquisição — partilha da produção | contrato de parceria |

Própria e arrendada somadas reproduzem exatamente o custo total do plano — não há
dupla contagem. A aquisição de terceiros fica à parte e só se junta no custo médio
ponderado da tonelada.

### Indicadores

Custo da cana própria, custo da cana de fornecedor, custo médio ponderado, R$/t,
R$/kg de ATR e participação percentual por origem, em tonelada e em custo. Também
a entrada de cana por mês e origem.

O custo médio ponderado considera só origem com tonelada lançada: enquanto a
colheita (A01) não estiver no Plano Operacional, o custo agrícola aparece à parte
em vez de inflar o R$/t.

### Arquivos

`public/js/dados/fornecedores.js` (cadastro), `public/js/calculo/fornecedores.js`
(cálculo puro), `public/js/ui/fornecedores.js` (tela), seção em `public/index.html`
e campos `FORN` e `FORN_PAR` em `nucleo/estado.js` e `io/persistencia.js`.
Relatório, CSV e Validação incluídos. O motor de custo do plano não foi alterado.


## 2.0.0 — 2026-09-15 · Separação em front, back e dados

Reestruturação conduzida por **Caio Souza**.

Nenhuma mudança de comportamento, de número ou de tela. O sistema calcula e
renderiza exatamente o mesmo que na versão 1.0.0 — isso foi verificado por
impressão digital, não presumido. Ver [CLAUDE.md](CLAUDE.md) para os invariantes
e o contrato de regressão.

### Estrutura

De 6 arquivos para 82. O `index.html` de 3.495 linhas (273 KB) virou:

| Antes | Depois |
|---|---|
| `index.html` — CSS, marcação, JS e dados juntos | `public/index.html` — 552 linhas, só marcação |
| CSS embutido, 338 linhas | `public/css/` — 5 arquivos por responsabilidade |
| `const CFG` — 46 KB **numa única linha** | `public/js/dados/` — 12 arquivos, 789 linhas legíveis |
| `const LOGO` — 14 KB numa linha | `public/js/dados/logo.js` |
| 2.608 linhas de JavaScript | 45 módulos ES em `nucleo/ calculo/ ui/ io/ app/` |
| `server.js` — 297 linhas | `server/` — 8 arquivos, com `store/schema.sql` à parte |

Maior arquivo JavaScript hoje: 238 linhas. O grafo de dependências é acíclico e
sobe numa direção só: `dados → nucleo → calculo → ui → app`.

### Como a equivalência foi provada

- **Extração byte a byte.** O JavaScript foi recortado por um manifesto contíguo
  e sem buracos; reconcatenar na ordem reproduz o original exatamente.
- **Contrato de regressão** capturado do original *antes* de qualquer alteração,
  usando os dados reais de produção como fixture. Depois: as 56 chaves de
  `calcularCompleto()` idênticas, `total` igual ao centavo.
- **DOM renderizado**: as 19 seções, o menu e a barra superior com hash idêntico.
- **Interações**: digitação em premissa e em célula do plano, navegação, tema,
  botões de adicionar e remover, debounce de gravação, montagem do relatório.
- **Back-end**: grafo de módulos carregado e rotas exercitadas — `health`, `GET`,
  `PATCH`, merge preservando gravação anterior, e os erros 405 / 404 / 400.
- 97 de 97 funções do original presentes.

### Corrigido no caminho

- **Cache de módulos.** O `index.html` único era servido com `no-cache`, então um
  deploy valia na hora. Fatiado em ~50 arquivos com `max-age=3600`, um usuário
  que recarregasse após um deploy rodaria HTML novo com JavaScript velho. Agora
  `.html`, `.js` e `.css` revalidam; imagem e fonte ficam em cache longo.
- **Lista de arquivos ocultos eliminada.** O servidor estático recusava
  `server.js`, `package.json` e afins um a um. Com o código do servidor fora de
  `public/`, não há rota que chegue neles.
- **DDL fora do código.** O esquema da tabela `plano` virou
  `server/store/schema.sql`.

### Compatibilidade

- **O formato do documento salvo não mudou**: mesmas chaves em `estado()`, mesmo
  `v:10`, mesma chave `crv_plano_v10` no `localStorage`. O plano gravado no
  Postgres continua sendo lido sem migração.
- `render.yaml` inalterado. O `npm start` passou a apontar para
  `server/index.js`; [`server.js`](server.js) permanece como atalho de
  compatibilidade caso o Start Command no painel do Render ainda seja
  `node server.js`.
- **Abrir `public/index.html` por `file://` deixou de funcionar** — única
  capacidade perdida. Módulos ES exigem origem HTTP. Use `npm start`.

## 1.0.0 — até 2026-09-15

Sistema em arquivo único. Ver o histórico do git até `c8d4ee7`.

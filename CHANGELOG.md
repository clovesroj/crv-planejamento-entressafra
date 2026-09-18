# Histórico de mudanças

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

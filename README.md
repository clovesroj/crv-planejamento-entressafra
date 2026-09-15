# CRV Industrial — Sistema de Planejamento de Entressafra

Sistema web de planejamento operacional e de custos da entressafra — **Safra 2026/2027, Unidade Capinópolis-MG**, Departamento Agrícola.

A interface é um arquivo único (`index.html`), sem build. Pode ser aberta direto no
navegador ou servida pelo `server.js`, que acrescenta o plano compartilhado entre
todos os usuários.

## Módulos

| Aba | Conteúdo |
|---|---|
| Premissas | Parâmetros agronômicos, operacionais e econômicos |
| Mão de Obra | Encargos, benefícios, funções, níveis salariais e escalas |
| Plano Operacional | Área/tonelada por atividade e mês, tratamentos vinculados |
| Dimensionamento | Horas, rendimento, frota e efetivo por atividade |
| Transporte | Transbordo e transporte de cana por raio, ciclo e capacidade |
| Apoio | Equipamentos de apoio por quantidade e horas |
| Manutenção de Frota | CRM por equipamento (R$/h máquinas, R$/km veículos) |
| Transporte de Pessoal | Rotas, diárias de ônibus e quilometragem |
| Irrigação | Dimensionamento hidráulico e energia por modalidade |
| Insumos | Cadastro, composição de tratamentos e volume demandado |
| Custos | Custo por etapa, por natureza e mensal |
| Plano de Contas | Custo projetado por conta contábil |
| Resumo de Frota | Necessidade consolidada de veículos e equipamentos |
| Painel | Indicadores, custo de colheita R$/t, grandes contas por mês |
| Validação | Checagens automáticas de consistência |

Relatórios resumido ou detalhado em **PDF** e **Excel** pelo botão *Relatório* no cabeçalho,
e exportação em CSV pela aba Plano Operacional.

## Persistência

O app procura um destino compartilhado nesta ordem e usa o primeiro que responder:

| Destino | Quando | Rodapé mostra |
|---|---|---|
| API deste repositório (`/api/plano`) | Servido pelo `server.js` — Render ou qualquer host Node | *Salvo no servidor* |
| Banco do Artifact da Claude | Publicado como Artifact | *Salvo no servidor* |
| `localStorage` | Arquivo aberto direto, ou os dois acima fora do ar | *Salvo neste navegador* |

O `localStorage` é sempre gravado como rascunho, mesmo com servidor ativo: fechar a aba
no meio de uma gravação não perde o que foi digitado. Quando o servidor cai, o rodapé
passa a dizer *Servidor fora — salvo neste navegador*, porque nesse momento os outros
usuários ainda não estão vendo a alteração.

As gravações usam merge por campo: uma sessão nunca apaga dados preenchidos por outra.
No Postgres o merge acontece dentro do próprio `UPDATE` (operador `||` de `jsonb`), e não
em ler-alterar-gravar, então duas pessoas salvando ao mesmo tempo não se sobrescrevem.

## Hospedagem no Render

O repositório traz um [`render.yaml`](render.yaml) que cria o web service e o Postgres já
conectados. No painel do Render: **New › Blueprint**, aponte para este repositório e
confirme. Não há variável para preencher à mão — o `DATABASE_URL` é injetado pelo próprio
blueprint.

Para criar os serviços manualmente, em vez do blueprint:

1. **New › Postgres**, plano *Free*, região *Ohio*.
2. **New › Web Service** apontando para este repositório, runtime *Node*,
   build `npm install`, start `npm start`, health check `/api/health`.
3. No web service, adicione a variável `DATABASE_URL` com a *Internal Database URL* do
   Postgres criado no passo 1 (a interna exige que os dois estejam na mesma região).

O `server.js` cria a tabela `plano` sozinho no primeiro acesso.

### Limites do plano gratuito

- O web service **hiberna após 15 minutos** sem acesso; o primeiro acesso seguinte leva
  cerca de 50 segundos para responder.
- O **Postgres gratuito expira em 30 dias**. Antes disso é preciso migrar para o plano
  pago ou criar outro banco — expirado, os dados são apagados. Para exportar, use o botão
  *Relatório › Excel* ou `pg_dump` na *External Database URL*.

### Verificar um deploy

```bash
curl -s https://SEU-SERVICO.onrender.com/api/health
```

Deve responder `"armazenamento":"postgres"` e `"banco":"ok"`. Se vier
`"armazenamento":"arquivo"`, o `DATABASE_URL` não chegou ao serviço e os dados serão
perdidos no próximo deploy — o rodapé do app avisa com *(temporário)*.

## Rodar localmente

```bash
npm install && npm start
```

Abre em `http://localhost:10000`. Sem `DATABASE_URL`, grava em `.data/plano.json` — bom
para testar, mas sem o compartilhamento real. Para usar um Postgres:

```bash
DATABASE_URL=postgres://usuario:senha@host:5432/banco npm start
```

## Acesso

O serviço fica **aberto na internet**: qualquer pessoa com o endereço lê e edita o plano,
incluindo salários, custos e programação de safra. Se isso mudar, o ponto de entrada para
colocar autenticação é a função `api()` do [`server.js`](server.js).

## Premissas a confirmar

- Densidade de muda e TCH da cana-muda — time agronômico
- Salários e benefícios — CCT do sindicato rural de Capinópolis/MG
- Custo de manutenção e consumo de diesel — ajustar pela frota real
- Depreciação, administração e área arrendada — orçamento oficial

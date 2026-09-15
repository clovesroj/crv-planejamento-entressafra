# CRV Industrial — Sistema de Planejamento de Entressafra

Sistema web de planejamento operacional e de custos da entressafra — **Safra 2026/2027, Unidade Capinópolis-MG**, Departamento Agrícola.

Aplicação em arquivo único (`index.html`), sem servidor nem build: abra no navegador.

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

Relatórios resumido ou detalhado em **PDF** e **Excel** pelo botão *Relatório* no cabeçalho.

## Persistência

Publicado como Artifact na Claude, os dados são gravados no banco do próprio artefato (documento `plano/atual`), compartilhado entre os usuários autenticados da organização. Aberto localmente, grava no `localStorage` do navegador.

As gravações usam merge por campo: uma sessão nunca apaga dados preenchidos por outra.

## Premissas a confirmar

- Densidade de muda e TCH da cana-muda — time agronômico
- Salários e benefícios — CCT do sindicato rural de Capinópolis/MG
- Custo de manutenção e consumo de diesel — ajustar pela frota real
- Depreciação, administração e área arrendada — orçamento oficial

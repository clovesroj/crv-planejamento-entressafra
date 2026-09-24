// public/js/dados/planejamento-ctt.js
//
// Planejamento Entressafra CTT — cronograma de atividades (preparo de solo,
// muda, plantio, tratos, apoio), frota/equipamentos e efetivo ativo por
// função. Cadastro de referência do time de CTT para a janela Dez/26-Abr/27,
// vindo do relatório que o colaborador já usava; atualizado à mão a cada novo
// planejamento, sem carga automática por ora. Ver
// public/js/calculo/planejamento-ctt.js e public/js/ui/planejamento-ctt.js.

export const PLANO_CTT_CATEGORIAS = {
  preparo: "Preparo de solo",
  muda: "Muda",
  plantio: "Plantio",
  tratos: "Tratos e irrigação",
  apoio: "Apoio",
};
export const PLANO_CTT_CATEGORIAS_ORDEM = ["preparo", "muda", "plantio", "tratos", "apoio"];

export const PLANO_CTT_FUNCOES = ["Operador II", "Operador III", "Motorista II", "Motorista III", "Auxiliar"];

// Efetivo ativo hoje por função, para o balanço "ativos x necessidade".
export const PLANO_CTT_ATIVOS = {
  "Operador I": 17,
  "Operador II": 200,
  "Operador III": 105,
  "Motorista I": 4,
  "Motorista II": 84,
  "Motorista III": 174,
};
export const PLANO_CTT_OPERADORES = ["Operador I", "Operador II", "Operador III"];
export const PLANO_CTT_MOTORISTAS = ["Motorista I", "Motorista II", "Motorista III"];

const item = (equipamento, qtd, funcao, pessoas) => ({ eq: equipamento, q: qtd, role: funcao, p: pessoas });

// Cada atividade: janela de datas (ini/fim), categoria e os itens de
// equipamento/função/pessoas que ela demanda no pico.
export const PLANO_CTT_ATIVIDADES = [
  { id: "preparo", nome: "Preparo de solo", cat: "preparo", ini: "2026-12-01", fim: "2027-02-28",
    itens: [item("Trator", 12, "Operador II", 44)] },
  { id: "muda1", nome: "Muda Frente 1", cat: "muda", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Caminhão", 5, "Motorista III", 18), item("Colhedora", 2, "Operador III", 9),
      item("Trator", 5, "Operador II", 18), item("Bombeiro pipa", 1, "Motorista II", 3),
      item("Auxiliares", 0, "Auxiliar", 3)] },
  { id: "plantio1", nome: "Plantio Frente 1", cat: "plantio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Plantadora", 5, "Operador III", 18), item("Trator pega bag", 1, "Operador II", 3),
      item("Calda pronta (pipa)", 1, "Motorista II", 3), item("Auxiliares", 0, "Auxiliar", 3)] },
  { id: "muda2", nome: "Muda Frente 2", cat: "muda", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Caminhão", 5, "Motorista III", 18), item("Colhedora", 2, "Operador II", 9),
      item("Trator", 5, "Operador II", 18), item("Bombeiro pipa", 1, "Motorista II", 3),
      item("Auxiliares", 0, "Auxiliar", 3)] },
  { id: "plantio2", nome: "Plantio Frente 2", cat: "plantio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Plantadora", 5, "Operador III", 18), item("Trator pega bag", 1, "Operador II", 3),
      item("Calda pronta (pipa)", 1, "Motorista II", 3), item("Auxiliares", 0, "Auxiliar", 3)] },
  { id: "tratos", nome: "Tratos", cat: "tratos", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Ônibus tratos", 2, "Motorista II", 4), item("Caminhão pipa herbicida", 2, "Motorista II", 5),
      item("Máquina herbicida", 11, "Operador II", 11), item("Reflorestamento", 0, "Operador II", 1),
      item("Retroescavadeira", 1, "Operador II", 2), item("Carregadeira adubação", 1, "Operador II", 1),
      item("Uniport", 1, "Operador II", 3)] },
  { id: "irrigacao", nome: "Irrigação", cat: "tratos", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Trator irrigação apoio", 3, "Operador II", 33), item("Motorista irrigação apoio", 0, "Motorista II", 1)] },
  { id: "brigada", nome: "Brigada", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Bombeiro pipa", 2, "Motorista II", 7)] },
  { id: "linha", nome: "Linha Amarela", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Motoniveladora", 2, "Operador III", 7), item("Escavadeira hidráulica", 1, "Operador III", 3),
      item("Pá carregadeira", 1, "Operador II", 2), item("Caçamba", 3, "Motorista II", 11)] },
  { id: "patio", nome: "Pátio", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Trator de apoio", 1, "Operador II", 2), item("Trator eletroimã", 1, "Operador II", 1),
      item("Caminhão", 1, "Motorista III", 6), item("Pipa apoio", 2, "Motorista II", 10),
      item("Prancha", 3, "Motorista III", 10), item("Caminhão roll off", 1, "Motorista II", 2),
      item("Comboio", 3, "Motorista III", 9), item("Auxiliares", 0, "Auxiliar", 2)] },
  { id: "onibus", nome: "Ônibus", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Ônibus", 4, "Motorista II", 8)] },
  { id: "oficina", nome: "Oficina", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Mantenedores", 0, "Operador III", 10)] },
  { id: "adm", nome: "Adm", cat: "apoio", ini: "2027-02-15", fim: "2027-04-15",
    itens: [item("Motoristas", 0, "Motorista III", 3), item("Motoristas", 0, "Motorista II", 3)] },
];

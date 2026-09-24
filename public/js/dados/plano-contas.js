/**
 * Plano de contas contabil e centros de custo.
 *
 * CONTAS    conta, descricao, grupo, natureza, classificacao (Fixo/Variavel),
 *           cd (Custo/Despesa) e dir (criterio de direcionamento)
 * CC_LIST   centros de custo oferecidos no lancamento de gastos esporadicos
 */

export const CONTAS = [
  {"conta":"200-15","desc":"Salários - Adm. Agrícola","grupo":"1. MDO","nat":"Mão de obra","cls":"Fixo","cd":"Despesa","dir":"Estrutura fixa mensal"},
  {"conta":"200-16","desc":"Salários - Oficina","grupo":"1. MDO","nat":"Mão de obra","cls":"Fixo","cd":"Custo","dir":"Estrutura fixa mensal"},
  {"conta":"200-17","desc":"Salários - Motoristas e Operadores","grupo":"1. MDO","nat":"Mão de obra","cls":"Variável","cd":"Custo","dir":"Horas-máquina / área operada"},
  {"conta":"200-18","desc":"Salários - Rurais","grupo":"1. MDO","nat":"Mão de obra","cls":"Variável","cd":"Custo","dir":"Área operada (ha)"},
  {"conta":"200-35","desc":"INSS Empregador","grupo":"1. MDO","nat":"Encargos","cls":"Variável","cd":"Custo","dir":"% sobre folha"},
  {"conta":"200-36","desc":"FGTS","grupo":"1. MDO","nat":"Encargos","cls":"Variável","cd":"Custo","dir":"% sobre folha"},
  {"conta":"200-51","desc":"Vale Refeição","grupo":"1. MDO","nat":"Benefícios","cls":"Variável","cd":"Custo","dir":"Nº de colaboradores"},
  {"conta":"200-52","desc":"Vale Alimentação","grupo":"1. MDO","nat":"Benefícios","cls":"Variável","cd":"Custo","dir":"Nº de colaboradores"},
  {"conta":"200-53","desc":"Plano de Saúde","grupo":"1. MDO","nat":"Benefícios","cls":"Fixo","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-54","desc":"Plano Odontológico","grupo":"1. MDO","nat":"Benefícios","cls":"Fixo","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-55","desc":"Seguro de Vida","grupo":"1. MDO","nat":"Benefícios","cls":"Fixo","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-72","desc":"Uniformes","grupo":"1. MDO","nat":"Benefícios","cls":"Variável","cd":"Custo","dir":"Nº de colaboradores"},
  {"conta":"200-73","desc":"EPI","grupo":"1. MDO","nat":"Segurança","cls":"Variável","cd":"Custo","dir":"Nº de colaboradores"},
  {"conta":"200-74","desc":"EPC","grupo":"1. MDO","nat":"Segurança","cls":"Fixo","cd":"Custo","dir":"Estrutura fixa mensal"},
  {"conta":"200-75","desc":"Assistência Médica","grupo":"1. MDO","nat":"Benefícios","cls":"Fixo","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-76","desc":"Cursos e Treinamentos","grupo":"1. MDO","nat":"Desenvolvimento","cls":"Fixo","cd":"Despesa","dir":"Estrutura fixa mensal"},
  {"conta":"200-77","desc":"Lanches e Copa","grupo":"1. MDO","nat":"Benefícios","cls":"Variável","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-79","desc":"Alimento Rurícolas (Soro)","grupo":"1. MDO","nat":"Benefícios","cls":"Variável","cd":"Custo","dir":"Nº de rurícolas"},
  {"conta":"200-93","desc":"Peças","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-94","desc":"Serviços de Manutenção","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-95","desc":"Material de Uso e Consumo","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-96","desc":"Pneus Novos","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-97","desc":"Pneus Recapados","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-98","desc":"Lubrificantes","grupo":"2. Manutenção","nat":"Manutenção","cls":"Variável","cd":"Custo","dir":"Horas-máquina"},
  {"conta":"200-99","desc":"Equipamentos e Ferramentas","grupo":"2. Manutenção","nat":"Manutenção","cls":"Fixo","cd":"Custo","dir":"Estrutura fixa mensal"},
  {"conta":"200-100","desc":"Fretes de Peças e Materiais","grupo":"2. Manutenção","nat":"Logística","cls":"Variável","cd":"Custo","dir":"Volume de compras"},
  {"conta":"200-110","desc":"Combustível (Diesel)","grupo":"3. Combustível","nat":"Combustível","cls":"Variável","cd":"Custo","dir":"Horas-máquina x L/h"},
  {"conta":"200-124","desc":"Locação de Veículos, Máq. e Equip.","grupo":"4. Terceirização","nat":"Terceiros","cls":"Variável","cd":"Custo","dir":"Área terceirizada (ha)"},
  {"conta":"200-126","desc":"Aplicação Aérea","grupo":"4. Terceirização","nat":"Terceiros","cls":"Variável","cd":"Custo","dir":"Área aplicada (ha)"},
  {"conta":"200-127","desc":"Transporte de Pessoal","grupo":"4. Terceirização","nat":"Terceiros","cls":"Fixo","cd":"Despesa","dir":"Nº de colaboradores"},
  {"conta":"200-128","desc":"Locação de Armazém","grupo":"4. Terceirização","nat":"Terceiros","cls":"Fixo","cd":"Despesa","dir":"Estrutura fixa mensal"},
  {"conta":"200-129","desc":"Locação GPS e Tecnologia Agro","grupo":"4. Terceirização","nat":"Terceiros","cls":"Fixo","cd":"Despesa","dir":"Nº de equipamentos"},
  {"conta":"INS-01","desc":"Herbicidas","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área x dose"},
  {"conta":"INS-02","desc":"Inseticidas / Fungicidas","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área x dose"},
  {"conta":"INS-03","desc":"Fertilizantes e Corretivos","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área x dose"},
  {"conta":"INS-04","desc":"Fertilizantes Líquidos e Foliares","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área x dose"},
  {"conta":"INS-05","desc":"Fertirrigação / Gotejamento","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área irrigada x dose"},
  /* Adjuvante, regulador/maturador e grupo criado na aba Grupos de Insumos nao
     tinham conta nenhuma: o custo deles ficava fora do plano de contas e a tela
     acusava "insumo sem grupo agronomico" -- para produtos que TEM grupo. Esta
     conta e o destino deles dentro de 5. Insumos. */
  {"conta":"INS-06","desc":"Adjuvantes, Reguladores e Outros Insumos","grupo":"5. Insumos","nat":"Insumos","cls":"Variável","cd":"Custo","dir":"Área x dose"},
  {"conta":"DEP-01","desc":"Depreciação de Máquinas e Implementos","grupo":"6. Capital","nat":"Depreciação","cls":"Fixo","cd":"Custo","dir":"Valor do imobilizado"},
  {"conta":"ARR-01","desc":"Arrendamento de Terras","grupo":"6. Capital","nat":"Arrendamento","cls":"Fixo","cd":"Custo","dir":"Área arrendada x forma de pagamento"},
  {"conta":"EST-01","desc":"Estrutura / Administração Agrícola","grupo":"6. Capital","nat":"Estrutura","cls":"Fixo","cd":"Despesa","dir":"Estrutura fixa mensal"}
];

export const CC_LIST = [
  "200-100 Fretes de Peças e Materiais",
  "200-124 Locação de Veículos/Máquinas",
  "200-126 Aplicação Aérea",
  "200-127 Transporte de Pessoal",
  "200-129 Locação GPS/Tecnologia"
];

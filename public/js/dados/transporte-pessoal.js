/**
 * Rotas de transporte de pessoal.
 *
 * rota, veic, cap (lugares), qtd, kmDia, diasMes, rsKm,
 * diaria (R$/dia do onibus), kmExtra e rsKmExtra.
 *
 * Os campos acima sao os da SAFRA; `ent` guarda o que muda na ENTRESSAFRA e,
 * quando a chave nao existe ali, o periodo herda o valor da safra -- a mesma
 * regra de calculo/transporte-pessoal.js (campo()).
 *
 * De onde vieram estes numeros: sao as rotas que a operacao tinha lancado na
 * aba Transporte de Pessoal, recuperadas do arquivo exportado da propria tela
 * (t_tp.xls, 28/09/2026) depois que o documento voltou a mostrar as quatro
 * rotas de exemplo. Conferem com o exportado no centavo: R$ 815.200 no ano,
 * 679 lugares e 17 veiculos no pico. Antes havia aqui um exemplo generico
 * ("Fazendas Norte", "Fazendas Sul"...) -- e era ele que aparecia toda vez que
 * o documento ficava sem a chave TPESS ou alguem usava "Restaurar as rotas
 * padrao". Com o cadastro real no lugar, um reset acidental devolve o que a
 * usina de fato opera.
 */

export const TPESS_ROTAS = [
  {"rota":"Rota 1 — Capinópolis / CRV","veic":"46104 / 46105 / 46126 /46125 /46225 /","cap":48,"qtd":0,"kmDia":120,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":5,"kmDia":100,"diasMes":30,"kmExtra":0}},
  {"rota":"Rota 2 — Canápolis / Capinópolis / CRV / /cr","veic":"Van","cap":16,"qtd":0,"kmDia":140,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":1,"kmDia":150,"diasMes":30,"kmExtra":200}},
  // diasMes e kmExtra sem valor na entressafra: herdam a safra (30 dias, 0 km extra)
  {"rota":"Rota 3 —Ituiutaba / CRV","veic":"46236 / 46232","cap":48,"qtd":0,"kmDia":90,"diasMes":30,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":2,"kmDia":100}},
  // kmDia e diasMes herdam a safra (70 km/dia, 26 dias)
  {"rota":"Rota 4 - Ituiutaba - Defensivos","veic":"46111 / 46222","cap":35,"qtd":0,"kmDia":70,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":2,"kmExtra":400}},
  {"rota":"Rota 5 - Ituiutaba / Capinópolis / Reflorestamento","veic":"46100","cap":33,"qtd":0,"kmDia":80,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":1,"kmDia":150,"kmExtra":400}},
  {"rota":"Rota 6 - Ipiaçu / CRV","veic":"46224 / 46127","cap":48,"qtd":0,"kmDia":80,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":2,"kmDia":120,"kmExtra":150}},
  {"rota":"Rota 7 - Plantio","veic":"Veículo","cap":48,"qtd":0,"kmDia":80,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":2,"kmDia":150,"diasMes":30,"kmExtra":400}},
  {"rota":"Rota 8 - Colheita Muda","veic":"Veículo","cap":16,"qtd":0,"kmDia":80,"diasMes":26,"rsKm":0,"diaria":400,"kmExtra":0,"rsKmExtra":4,
   "ent":{"qtd":2,"kmDia":150,"diasMes":30,"kmExtra":400}}
];

/* As rotas genéricas que eram o padrão até a 2.50.4. Servem só para
   reconhecer um plano cujas rotas foram sobrescritas pelo padrão antigo (ver
   restaurarRotasPerdidas em main.js) e trocá-las pelas rotas da usina acima --
   a tabela exportada da aba (t_tp.xls) antes da perda, total R$ 815.200. */
export const TPESS_ROTAS_V1 = [
  {"rota":"Rota 1 — Capinópolis / Fazendas Norte","veic":"Ônibus rodoviário 44 lugares","cap":44,"qtd":2,"kmDia":120,"diasMes":26,"rsKm":4.2,"diaria":95,"kmExtra":400,"rsKmExtra":5.1},
  {"rota":"Rota 2 — Capinópolis / Fazendas Sul","veic":"Ônibus rodoviário 44 lugares","cap":44,"qtd":2,"kmDia":140,"diasMes":26,"rsKm":4.2,"diaria":95,"kmExtra":400,"rsKmExtra":5.1},
  {"rota":"Rota 3 — Turno noturno / colheita","veic":"Micro-ônibus 28 lugares","cap":28,"qtd":2,"kmDia":90,"diasMes":30,"rsKm":3.4,"diaria":110,"kmExtra":300,"rsKmExtra":4.3},
  {"rota":"Apoio — deslocamento de equipes","veic":"Van 15 lugares","cap":15,"qtd":3,"kmDia":70,"diasMes":26,"rsKm":2.6,"diaria":80,"kmExtra":250,"rsKmExtra":3.3}
];

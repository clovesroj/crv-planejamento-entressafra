// public/js/calculo/desligamentos-ctt.js
//
// Cálculo puro (sem DOM/IO) da página Desligamentos do Planejamento
// Entressafra CTT: ler a planilha semanal (aba BASE) que o RH exporta do
// ERP, agrupar por mês/tipo/motivo/função e aplicar os filtros em cascata.
// A leitura do arquivo em si (`XLSX.read`, escolha do arquivo) é da tela —
// aqui só entra a extração da matriz de células já carregada.

export const MESES_ORDEM = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro","Não informado"];

/** Agrupa motivos de saída em texto livre num rótulo padrão, pros gráficos não
 * virarem uma barra por frase digitada diferente no ERP. Motivo que não bate
 * em nenhuma regra aparece como o próprio texto (não força numa caixa errada). */
export function categorizarMotivo(bruto) {
  if (!bruto) return "Não informado";
  const t = bruto.toLowerCase();
  const regras = [
    [/droga/, "Uso de Substâncias"],
    [/salari/, "Questões Salariais"],
    [/novo emprego/, "Novo Emprego"],
    [/mudan[çc]a de cidade/, "Mudança de Cidade"],
    [/oportunidade de crescimento/, "Falta de Oportunidade"],
    [/incompatibilidade/, "Incompatibilidade com Função"],
    [/baixo desempenho/, "Baixo Desempenho"],
    [/atestado|falta/, "Absenteísmo / Atestados"],
    [/indisciplina/, "Indisciplina"],
    [/comportament/, "Comportamental"],
    [/conduta/, "Conduta Inadequada"],
    [/lideran/, "Relacionamento com Liderança"],
    [/ambiente de trabalho/, "Ambiente de Trabalho"],
  ];
  for (const [re, label] of regras) if (re.test(t)) return label;
  return bruto.trim();
}

function normalizarCabecalho(h) {
  return String(h == null ? "" : h).replace(/\s+/g, " ").trim();
}

/**
 * Extrai os registros da planilha "BASE" de um workbook já lido pelo XLSX
 * (SheetJS, carregado globalmente em index.html). `linhas` é o resultado de
 * `XLSX.utils.sheet_to_json(sheet, {header:1, defval:null, raw:true})`.
 */
export function extrairRegistrosBase(linhas) {
  let dataBase = null;
  for (let i = 0; i < Math.min(linhas.length, 20); i++) {
    for (const cel of (linhas[i] || [])) {
      if (typeof cel === "string" && /data base/i.test(cel)) {
        const m = cel.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (m) dataBase = m[1];
      }
    }
  }
  let linhaCabecalho = -1;
  for (let i = 0; i < linhas.length; i++) {
    if ((linhas[i] || []).some(c => normalizarCabecalho(c) === "Matrícula")) { linhaCabecalho = i; break; }
  }
  const registros = [];
  if (linhaCabecalho >= 0) {
    const cab = linhas[linhaCabecalho].map(normalizarCabecalho);
    const col = nome => cab.indexOf(nome);
    const idx = {
      matricula: col("Matrícula"), funcionario: col("Funcionário"), funcao: col("Função"),
      admissao: col("Admissão"), atestado: col("Atestado"), falta: col("Falta"),
      faltaJust: col("Falta Justificada"), advertencia: col("Advertência"), suspensao: col("Suspensão"),
      totalOcorrencia: col("Total de Ocorrência"), tipoRescisao: col("Tipo de Rescisão"),
      motivo: col("Motivo"), mes: col("Mês"),
    };
    for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
      const row = linhas[i] || [];
      const funcionario = row[idx.funcionario];
      if (funcionario == null || funcionario === "" || funcionario === "-") continue;
      if (idx.matricula < 0 || row[idx.matricula] == null) continue;
      let admissao = row[idx.admissao];
      admissao = admissao instanceof Date ? admissao.toLocaleDateString("pt-BR") : (admissao ? String(admissao) : null);
      registros.push({
        matricula: row[idx.matricula],
        funcionario: String(funcionario).trim(),
        funcao: idx.funcao >= 0 && row[idx.funcao] ? String(row[idx.funcao]).trim() : "",
        admissao,
        atestado: idx.atestado >= 0 ? row[idx.atestado] : null,
        falta: idx.falta >= 0 ? row[idx.falta] : null,
        faltaJustificada: idx.faltaJust >= 0 ? row[idx.faltaJust] : null,
        advertencia: idx.advertencia >= 0 ? row[idx.advertencia] : null,
        suspensao: idx.suspensao >= 0 ? row[idx.suspensao] : null,
        totalOcorrencia: idx.totalOcorrencia >= 0 ? row[idx.totalOcorrencia] : null,
        tipoRescisao: idx.tipoRescisao >= 0 && row[idx.tipoRescisao] ? String(row[idx.tipoRescisao]).trim() : "Não informado",
        motivo: idx.motivo >= 0 && row[idx.motivo] ? String(row[idx.motivo]).trim() : "Não informado",
        mes: idx.mes >= 0 && row[idx.mes] ? String(row[idx.mes]).trim() : "Não informado",
      });
    }
  }
  return { registros, dataBase };
}

export function contarPor(registros, chaveDe) {
  const mapa = new Map();
  registros.forEach(r => { const k = chaveDe(r); mapa.set(k, (mapa.get(k) || 0) + 1); });
  return mapa;
}
export function predominante(mapa) {
  let chave = "—", n = 0;
  mapa.forEach((v, k) => { if (v > n) { n = v; chave = k; } });
  return { chave, n };
}

/** Filtros em cascata: cada dimensão exclui a si mesma do filtro, pra permitir
 * multi-seleção dentro da própria dimensão (clicar em duas barras do mesmo
 * gráfico) sem que ela se auto-filtre a zero. */
export function filtrarExceto(registros, filtros, dimensao) {
  return registros.filter(r => {
    if (dimensao !== "mes" && filtros.mes.size && !filtros.mes.has(r.mes)) return false;
    if (dimensao !== "tipo" && filtros.tipo.size && !filtros.tipo.has(r.tipoRescisao)) return false;
    if (dimensao !== "motivo" && filtros.motivo.size && !filtros.motivo.has(categorizarMotivo(r.motivo))) return false;
    if (dimensao !== "funcao" && filtros.funcao.size && !filtros.funcao.has((r.funcao || "").trim())) return false;
    return true;
  });
}
export function aplicarFiltros(registros, filtros) {
  return registros.filter(r => {
    if (filtros.mes.size && !filtros.mes.has(r.mes)) return false;
    if (filtros.tipo.size && !filtros.tipo.has(r.tipoRescisao)) return false;
    if (filtros.motivo.size && !filtros.motivo.has(categorizarMotivo(r.motivo))) return false;
    if (filtros.funcao.size && !filtros.funcao.has((r.funcao || "").trim())) return false;
    return true;
  });
}

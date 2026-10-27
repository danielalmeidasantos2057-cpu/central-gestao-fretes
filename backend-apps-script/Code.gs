const CFG = {
  SHEETS: { CADASTRO: "CADASTRO", HISTORICO: "HISTÓRICO", TRANSPORTADOR: "TRANSPORTADOR" },
  CADASTRO_COLS: 12,
  HISTORICO_COLS: 23,
  HEADER_ROW: 1,
  FIRST_DATA_ROW: 2,
  MAX_SEARCH: 10,
  TIMEZONE: Session.getScriptTimeZone() || "America/Sao_Paulo",
  SPREADSHEET_ID_PROPERTY: "FRETES_SPREADSHEET_ID"
};

/**
 * Aplicação web: implantar como Web App, executar como proprietário
 * e restringir o acesso conforme a política da organização.
 */
function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Central de Gestão de Fretes")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}


/** API privada para o frontend Next.js. Configure FRETES_API_TOKEN em Propriedades do script. */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expected = PropertiesService.getScriptProperties().getProperty("FRETES_API_TOKEN");
    if (!expected || !body.token || body.token !== expected) return jsonApi_({ ok:false, error:"Não autorizado." });
    const p = body.payload || {};
    let result;
    switch (body.action) {
      case "initial": result = getInitialData(); break;
      case "dashboard": result = getDashboardData(p.filters || {}); break;
      case "searchClients": result = { clients: searchClients(p.query || "") }; break;
      case "getClientByCode": result = { client: getClientByCode(p.code || "") }; break;
      case "searchCarriers": result = { carriers: searchCarriers(p.query || "") }; break;
      case "history": result = getHistory(p); break;
      case "historyDetail": result = getHistoryDetail(p.rowNumber); break;
      case "submitFreight": result = submitFreight(p); break;
      default: return jsonApi_({ ok:false, error:"Ação desconhecida." });
    }
    return jsonApi_({ ok:true, data:result });
  } catch (err) {
    return jsonApi_({ ok:false, error: err && err.message ? err.message : String(err) });
  }
}
function jsonApi_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getInitialData() {
  const ss = getSpreadsheet_();
  validateRequiredSheets_(ss);
  // Uma única leitura do histórico alimenta os KPIs e a lista recente.
  const rows = readHistory_(ss);
  const recent = rows.slice().sort((a, b) => (b.rowNumber || 0) - (a.rowNumber || 0))
    .slice(0, 8).map(historyPublicRow_);
  return {
    ok: true,
    spreadsheetName: ss.getName(),
    supportsOperationalType: true,
    dashboard: buildDashboardData_(rows, {}),
    recent,
    generatedAt: Utilities.formatDate(new Date(), CFG.TIMEZONE, "dd/MM/yyyy HH:mm")
  };
}

function getDashboardData(filters) {
  const ss = getSpreadsheet_();
  validateRequiredSheets_(ss);
  return buildDashboardData_(readHistory_(ss), filters || {});
}

/** Calcula o dashboard a partir de uma leitura já realizada do histórico. */
function buildDashboardData_(rows, filters) {
  const f = normalizeFilters_(filters || {});
  const filtered = rows.filter(r => matchesFilters_(r, f));
  let totalFrete = 0, totalNota = 0, peso = 0, volumes = 0;
  const byTransportadora = {}, byTipo = {}, byMes = {}, byFilial = {};
  filtered.forEach(r => {
    totalFrete += number_(r.valorFrete);
    totalNota += number_(r.valorNota);
    peso += number_(r.peso);
    volumes += number_(r.volumes);
    increment_(byTransportadora, r.transportadora || "Não informado", number_(r.valorFrete));
    increment_(byTipo, r.tipo || "Não informado", 1);
    increment_(byFilial, r.filial || "Não informada", number_(r.valorFrete));
    const d = parseDate_(r.dataInsercao);
    const month = d ? Utilities.formatDate(d, CFG.TIMEZONE, "yyyy-MM") : "Sem data";
    increment_(byMes, month, number_(r.valorFrete));
  });
  return {
    kpis: {
      count: filtered.length, totalFrete, totalNota, peso, volumes,
      averageFrete: filtered.length ? totalFrete / filtered.length : 0
    },
    byTransportadora: objectToSortedArray_(byTransportadora, "name", "value", 8),
    byTipo: objectToSortedArray_(byTipo, "name", "value", 10),
    byFilial: objectToSortedArray_(byFilial, "name", "value", 10),
    byMes: Object.keys(byMes).sort().slice(-12).map(k => ({ name: k, value: byMes[k] })),
    count: filtered.length
  };
}

/** Busca ambígua sob demanda. TextFinder pesquisa no Sheets sem transferir toda a tabela para o Apps Script. */
function searchClients(query) {
  const raw = string_(query);
  if (raw.length < 2) return [];
  const ss = getSpreadsheet_();
  const sh = getSheet_(CFG.SHEETS.CADASTRO, ss);
  const last = sh.getLastRow();
  if (last < CFG.FIRST_DATA_ROW) return [];

  const candidateRows = new Set();
  const maxPerColumn = Math.max(CFG.MAX_SEARCH, 20);
  [1, 2, 8].forEach(col => {
    const range = sh.getRange(CFG.FIRST_DATA_ROW, col, last - CFG.FIRST_DATA_ROW + 1, 1);
    // Pesquisa parcial, insensível a maiúsculas e com equivalências de acentos.
    const pattern = buildAccentInsensitiveRegex_(normalizeText_(raw));
    const finder = range.createTextFinder(pattern).useRegularExpression(true).matchCase(false).matchEntireCell(false);
    let cell, found = 0;
    while (found < maxPerColumn && (cell = finder.findNext())) {
      candidateRows.add(cell.getRow());
      found++;
    }
  });
  if (!candidateRows.size) return [];

  // Lê somente as linhas candidatas, agrupando linhas adjacentes para reduzir chamadas à planilha.
  const sortedRows = Array.from(candidateRows).sort((a,b) => a-b);
  const clientsByRow = new Map();
  let groupStart = sortedRows[0], previous = sortedRows[0], groups = [];
  for (let i = 1; i < sortedRows.length; i++) {
    const row = sortedRows[i];
    if (row === previous + 1) { previous = row; continue; }
    groups.push([groupStart, previous]);
    groupStart = previous = row;
  }
  groups.push([groupStart, previous]);
  groups.forEach(([first, lastRow]) => {
    const vals = sh.getRange(first, 1, lastRow - first + 1, CFG.CADASTRO_COLS).getDisplayValues();
    vals.forEach((r, offset) => {
      const rowNumber = first + offset;
      if (!candidateRows.has(rowNumber)) return;
      clientsByRow.set(rowNumber, clientFromRow_(r, rowNumber));
    });
  });

  const q = normalizeText_(raw);
  return Array.from(clientsByRow.values()).map(c => {
    const code = normalizeText_(c.code), name = normalizeText_(c.name), city = normalizeText_(c.cidade);
    const rank = code === q ? 0 : code.startsWith(q) ? 1 : name === q ? 2 : (code.includes(q) ? 3 : name.includes(q) ? 4 : city.includes(q) ? 5 : 6);
    return { client: c, rank };
  }).sort((a,b) => a.rank - b.rank || a.client.name.localeCompare(b.client.name, 'pt-BR'))
    .slice(0, CFG.MAX_SEARCH).map(x => x.client);
}

/** Busca exata de CODCLI para o botão Inserir; não executa pesquisa parcial. */
function getClientByCode(code) {
  const exactCode = string_(code);
  if (!exactCode) throw new Error("Digite o CODCLI antes de clicar em Inserir.");
  const sh = getSheet_(CFG.SHEETS.CADASTRO, getSpreadsheet_());
  const client = findClientByCode_(sh, exactCode);
  return client ? client : null;
}

function clientFromRow_(r, rowNumber) {
  return {
    row: rowNumber, code: string_(r[0]), name: string_(r[1]), cnpj: string_(r[2]),
    filial: string_(r[3]), uf: string_(r[4]), regiao: string_(r[5]), rota: string_(r[6]),
    cidade: string_(r[7]), bairro: string_(r[8]), endereco: string_(r[9]),
    transportadora: string_(r[10]), tipo: string_(r[11])
  };
}

function searchCarriers(query) {
  const q = normalizeText_(query);
  const ss = getSpreadsheet_();
  const sh = getSheet_(CFG.SHEETS.TRANSPORTADOR, ss);
  const last = sh.getLastRow();
  if (last < CFG.FIRST_DATA_ROW) return [];
  const values = sh.getRange(CFG.FIRST_DATA_ROW, 1, last - 1, 1).getDisplayValues().flat();
  const seen = new Set(), out = [];
  values.forEach(v => {
    const name = String(v || "").trim();
    const normalized = normalizeText_(name);
    if (name && (!q || normalized.includes(q)) && !seen.has(normalized) && out.length < (q ? CFG.MAX_SEARCH : 200)) {
      seen.add(normalized); out.push(name);
    }
  });
  return out;
}

function getHistory(params) {
  params = params || {};
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const ss = getSpreadsheet_();
  validateRequiredSheets_(ss);
  const f = normalizeFilters_(params.filters || {});
  const all = readHistory_(ss).filter(r => matchesFilters_(r, f));
  all.sort((a, b) => (b.rowNumber || 0) - (a.rowNumber || 0));
  const start = (page - 1) * pageSize;
  return {
    rows: all.slice(start, start + pageSize).map(historyPublicRow_),
    total: all.length, page, pageSize, pages: Math.max(1, Math.ceil(all.length / pageSize))
  };
}

function getHistoryDetail(rowNumber) {
  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < CFG.FIRST_DATA_ROW) throw new Error("Registro inválido.");
  const ss = getSpreadsheet_();
  const sh = getSheet_(CFG.SHEETS.HISTORICO, ss);
  if (row > sh.getLastRow()) throw new Error("Registro não encontrado.");
  const columns = getHistoryColumnMap_(sh);
  const values = sh.getRange(row, 1, 1, CFG.HISTORICO_COLS).getValues()[0];
  const item = historyRowToObject_(values, row, columns);
  return {
    rowNumber: row,
    dataInsercao: formatDateTime_(item.dataInsercao), dataEntrega: formatDate_(item.dataEntrega),
    codcli: item.codcli, cliente: item.cliente, cnpj: item.cnpj, filial: item.filial,
    origem: item.origem, destino: item.destino, rota: item.rota, cidade: item.cidade,
    bairro: item.bairro, regiao: item.regiao, uf: item.uf, tipo: item.tipo,
    codigoNF: item.codigoNF, valorNota: number_(item.valorNota),
    peso: number_(item.peso), volumes: number_(item.volumes), modal: item.modal,
    transportadora: item.transportadora, valorFrete: number_(item.valorFrete),
    motivoDedicada: item.motivoDedicada, observacao: item.observacao
  };
}

/**
 * Grava um lançamento. O lock cobre a verificação de duplicidade do CODCLI
 * e a escrita. Não há bloqueio/proteção de células no sistema.
 */
function submitFreight(payload) {
  payload = payload || {};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error("O sistema está ocupado. Tente novamente em alguns segundos.");
  let cadastro = null, newClientRow = null, historyWritten = false;
  try {
    const ss = getSpreadsheet_();
    validateRequiredSheets_(ss);
    cadastro = getSheet_(CFG.SHEETS.CADASTRO, ss);
    const hist = getSheet_(CFG.SHEETS.HISTORICO, ss);
    const columns = getHistoryColumnMap_(hist);
    const form = normalizePayload_(payload);
    validatePayload_(form);

    let client = null;
    if (form.codcli) client = findClientByCode_(cadastro, form.codcli);
    if (!client && form.cliente) {
      const matches = findClientsByExactName_(cadastro, form.cliente);
      if (matches.length > 1) throw new Error("Há mais de um cliente com esse nome. Use a lupa de pesquisa e selecione o CODCLI correto.");
      if (matches.length === 1) client = matches[0];
    }

    let clientCreated = false;
    if (!client) {
      if (!form.codcli) throw new Error("Para cadastrar um cliente novo, informe o CODCLI.");
      if (findClientByCode_(cadastro, form.codcli)) throw new Error("O CODCLI já existe. Clique em Inserir ou use a lupa para localizar o cadastro.");
      if (findClientsByExactName_(cadastro, form.cliente).length) throw new Error("Já existe um cliente com esse nome. Localize e selecione o cadastro existente.");
      // O TIPO da CADASTRO é atributo do cadastro do cliente, não do frete recém-lançado.
      // Mantém vazio para não gravar CIF/FOB como classificação permanente do cliente.
      const clientType = ["DEDICADO", "TRANSFERENCIA"].includes(form.tipo) ? form.tipo : "";
      const newRow = [form.codcli, form.cliente, form.cnpj, form.filial, form.uf, form.regiao,
        form.rota, form.cidade, form.bairro, "", form.transportadora, clientType];
      newClientRow = Math.max(2, cadastro.getLastRow() + 1);
      cadastro.getRange(newClientRow, 1, 1, CFG.CADASTRO_COLS).setValues([newRow]);
      clientCreated = true;
    } else {
      form.codcli = String(client.code);
      form.cliente = String(client.name);
    }

    const targetRow = getNextHistoryRow_(hist);
    const dataEntrega = form.dataEntrega ? parseDateInput_(form.dataEntrega) : "";
    const record = buildHistoryRecord_(hist, columns, {
      dataInsercao: new Date(), dataEntrega, codcli: form.codcli, cliente: form.cliente,
      cnpj: form.cnpj, filial: form.filial, origem: form.origem, destino: form.destino,
      rota: form.rota, cidade: form.cidade, bairro: form.bairro, regiao: form.regiao,
      uf: form.uf, tipo: form.tipo, codigoNF: form.codigoNF,
      valorNota: number_(form.valorNota), peso: number_(form.peso), volumes: number_(form.volumes),
      modal: form.modal, transportadora: form.transportadora, valorFrete: number_(form.valorFrete),
      motivoDedicada: form.motivoDedicada, observacao: form.observacao
    });
    // Grava apenas A:W; não cria nem escreve uma nova coluna X.
    hist.getRange(targetRow, 1, 1, CFG.HISTORICO_COLS).setValues([record]);
    historyWritten = true;
    hist.getRange(targetRow, 1).setNumberFormat("dd/MM/yyyy HH:mm");
    hist.getRange(targetRow, 2).setNumberFormat("dd/MM/yyyy");
    return {
      ok: true, rowNumber: targetRow, clientCreated,
      typeStored: true, typeColumn: "N",
      message: clientCreated ? "Cliente cadastrado e frete gravado no histórico." : "Frete gravado no histórico com sucesso."
    };
  } catch (err) {
    // Evita deixar cadastro novo órfão quando a gravação do histórico falha.
    if (newClientRow && cadastro && !historyWritten) {
      try { cadastro.deleteRow(newClientRow); } catch (rollbackErr) { console.error("Falha ao reverter cadastro criado: " + rollbackErr); }
    }
    throw new Error(err && err.message ? err.message : String(err));
  } finally {
    lock.releaseLock();
  }
}

function normalizePayload_(p) {
  return {
    dataEntrega: string_(p.dataEntrega), codcli: string_(p.codcli), cliente: string_(p.cliente),
    cnpj: string_(p.cnpj), filial: string_(p.filial), origem: string_(p.origem),
    destino: string_(p.destino), rota: string_(p.rota), cidade: string_(p.cidade),
    bairro: string_(p.bairro), regiao: string_(p.regiao), uf: string_(p.uf).toUpperCase(),
    tipo: normalizeFreightType_(p.tipo),
    codigoNF: string_(p.codigoNF), valorNota: p.valorNota,
    peso: p.peso, volumes: p.volumes, modal: string_(p.modal),
    transportadora: string_(p.transportadora), valorFrete: p.valorFrete,
    motivoDedicada: string_(p.motivoDedicada), observacao: string_(p.observacao)
  };
}

function validatePayload_(p) {
  const required = [];
  const allowedTypes = ["DEDICADO", "TRANSFERENCIA", "CIF", "FOB"];
  if (!p.cliente) required.push("Cliente");
  if (!p.filial) required.push("Filial");
  if (!allowedTypes.includes(p.tipo)) required.push("Tipo: selecione Dedicado, Transferência, CIF ou FOB");
  if (!p.transportadora) required.push("Transportadora");
  if (p.valorNota === "" || p.valorNota == null || !isFinite(Number(p.valorNota)) || Number(p.valorNota) < 0) required.push("Valor da nota válido");
  if (p.peso === "" || p.peso == null || !isFinite(Number(p.peso)) || Number(p.peso) < 0) required.push("Peso válido");
  if (p.volumes === "" || p.volumes == null || !Number.isInteger(Number(p.volumes)) || Number(p.volumes) < 0) required.push("Volumes (número inteiro)");
  if (p.valorFrete === "" || p.valorFrete == null || !isFinite(Number(p.valorFrete)) || Number(p.valorFrete) < 0) required.push("Valor do frete válido");
  if (!p.codcli && !p.cliente) required.push("CODCLI ou cliente");
  if (p.tipo === "DEDICADO" && !p.motivoDedicada) required.push("Motivo da dedicada");
  // Preserva a regra anterior: NF não é exigida para dedicado/transferência; exigida para CIF/FOB.
  if (["CIF", "FOB"].includes(p.tipo) && !p.codigoNF) required.push("Código NF");
  if (required.length) throw new Error("Revise os campos obrigatórios:\n• " + [...new Set(required)].join("\n• "));
}

function normalizeFreightType_(value) {
  const valueNormalized = normalizeText_(value).replace(/\s+/g, " ");
  const aliases = {
    "DEDICADO": "DEDICADO", "DEDICADA": "DEDICADO",
    "TRANSFERENCIA": "TRANSFERENCIA", "TRANSFER": "TRANSFERENCIA",
    "CIF": "CIF", "FOB": "FOB"
  };
  return aliases[valueNormalized] || valueNormalized;
}

function readHistory_(ss) {
  const spreadsheet = ss || getSpreadsheet_();
  const sh = getSheet_(CFG.SHEETS.HISTORICO, spreadsheet);
  const last = sh.getLastRow();
  if (last < CFG.FIRST_DATA_ROW) return [];
  const columns = getHistoryColumnMap_(sh);
  // Lê somente A:W. X:AB contêm cálculos da própria planilha e não são sobrescritos.
  const values = sh.getRange(CFG.FIRST_DATA_ROW, 1, last - 1, CFG.HISTORICO_COLS).getValues();
  return values.map((v, i) => historyRowToObject_(v, i + CFG.FIRST_DATA_ROW, columns))
    .filter(r => r.cliente || r.codcli || r.codigoNF || r.valorFrete);
}

function historyRowToObject_(v, rowNumber, columns) {
  const get = field => {
    const col = columns[field];
    return col ? v[col - 1] : "";
  };
  return {
    rowNumber, dataInsercao: get("dataInsercao"), dataEntrega: get("dataEntrega"),
    codcli: string_(get("codcli")), cliente: string_(get("cliente")), cnpj: string_(get("cnpj")),
    filial: string_(get("filial")), origem: string_(get("origem")), destino: string_(get("destino")),
    rota: string_(get("rota")), cidade: string_(get("cidade")), bairro: string_(get("bairro")),
    regiao: string_(get("regiao")), uf: string_(get("uf")), tipo: normalizeFreightType_(get("tipo")),
    codigoNF: string_(get("codigoNF")), valorNota: number_(get("valorNota")),
    peso: number_(get("peso")), volumes: number_(get("volumes")), modal: string_(get("modal")),
    transportadora: string_(get("transportadora")), valorFrete: number_(get("valorFrete")),
    motivoDedicada: string_(get("motivoDedicada")), observacao: string_(get("observacao"))
  };
}

/** Mapeamento conferido contra HISTORICO DE FRETES.xlsx: A:W são os 23 campos de lançamento. */
function getHistoryColumnMap_(sh) {
  const headers = sh.getRange(CFG.HEADER_ROW, 1, 1, CFG.HISTORICO_COLS).getDisplayValues()[0];
  const normalized = headers.map(h => normalizeHeaderKey_(h));
  if (normalized[13] !== "TIPO") {
    throw new Error('Estrutura inesperada na aba HISTÓRICO: a coluna N deve ter o cabeçalho "Tipo". O lançamento foi interrompido para proteger os dados.');
  }
  const aliases = {
    dataInsercao: ["DATAHORAINSERCAO", "DATAINSERCAO", "DATAINSERCAO", "DATAHORA", "DTHRINSERCAO"],
    dataEntrega: ["DATAENTREGA", "DATAENTREGAPREVISTA", "DATAENTREGAAGENDADA"],
    codcli: ["CODCLI", "CODCLIENTE", "CODIGODOCLIENTE", "CODIGOCLIENTE"],
    cliente: ["CLIENTE", "NOMECLIENTE", "RAZAOSOCIAL"], cnpj: ["CNPJ", "CPFCNPJ"],
    filial: ["FILIAL", "CODFILIAL", "UNIDADE"], origem: ["ORIGEM"], destino: ["DESTINO"],
    rota: ["ROTA"], cidade: ["CIDADE"], bairro: ["BAIRRO"], regiao: ["REGIAO"], uf: ["UF", "ESTADO"],
    codigoNF: ["NF", "CODIGONF", "CODNF", "NOTAFISCAL", "NUMERONF"],
    valorNota: ["VALORDANF", "VALORDA NF", "VALORNOTA", "VALORNF", "VLRNOTA", "VLNOTA"],
    peso: ["PESOKG", "PESO"], volumes: ["VOLUMES", "TOTALVOLUMES", "QTDEVOLUMES"],
    modal: ["MODAL", "MODALIDADETRANSPORTE"],
    transportadora: ["TRANSPORTADORAAGREGADO", "TRANSPORTADORA", "TRANSPORTADOR", "AGREGADO"],
    valorFrete: ["VALORDOFRETE", "VALORFRETE", "VLRFRETE", "VLFRETE"],
    motivoDedicada: ["MOTIVODADEDICADA", "MOTIVODEDICADA", "MOTIVODEDICADO"],
    observacao: ["OBSERVACAO", "OBSERVACOES", "OBS"]
  };
  const fallback = {
    dataInsercao: 1, dataEntrega: 2, codcli: 3, cliente: 4, cnpj: 5, filial: 6,
    origem: 7, destino: 8, rota: 9, cidade: 10, bairro: 11, regiao: 12, uf: 13,
    tipo: 14, codigoNF: 15, valorNota: 16, peso: 17, volumes: 18, modal: 19,
    transportadora: 20, valorFrete: 21, motivoDedicada: 22, observacao: 23
  };
  const map = {};
  Object.keys(fallback).forEach(field => {
    if (field === "tipo") { map.tipo = 14; return; }
    const match = findHeaderColumn_(normalized, aliases[field] || [], 14);
    map[field] = match && match <= CFG.HISTORICO_COLS ? match : fallback[field];
  });
  return map;
}

function findHeaderColumn_(headers, candidates, excludedColumn) {
  for (const alias of candidates || []) {
    const index = headers.findIndex((h, i) => h === alias && i + 1 !== excludedColumn);
    if (index >= 0) return index + 1;
  }
  return null;
}
function normalizeHeaderKey_(value) {
  return normalizeText_(value).replace(/[^A-Z0-9]/g, "");
}
function buildAccentInsensitiveRegex_(value) {
  const classes = {
    a: "[aàáâãäå]", e: "[eèéêë]", i: "[iìíîï]", o: "[oòóôõö]",
    u: "[uùúûü]", c: "[cç]", n: "[nñ]"
  };
  return Array.from(string_(value)).map(ch => {
    const lower = ch.toLowerCase();
    if (classes[lower]) return classes[lower];
    return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
}

function buildHistoryRecord_(sh, columns, item) {
  const row = Array(CFG.HISTORICO_COLS).fill("");
  const usedColumns = new Map();
  Object.keys(item).forEach(field => {
    const col = columns[field];
    if (!col) return;
    if (col < 1 || col > CFG.HISTORICO_COLS) throw new Error("O campo " + field + " está mapeado fora das 23 colunas existentes do HISTÓRICO.");
    if (usedColumns.has(col)) throw new Error("A estrutura do HISTÓRICO associa dois campos à coluna " + col + ". Confira os cabeçalhos da aba.");
    usedColumns.set(col, field);
    row[col - 1] = item[field] == null ? "" : item[field];
  });
  if (normalizeText_(row[13]) !== normalizeFreightType_(item.tipo)) {
    throw new Error("Falha de validação interna: o Tipo não foi mapeado para a coluna N.");
  }
  return row;
}

function historyPublicRow_(r) {
  return {
    rowNumber: r.rowNumber,
    dataInsercao: formatDateTime_(r.dataInsercao), dataEntrega: formatDate_(r.dataEntrega),
    codcli: r.codcli, cliente: r.cliente, filial: r.filial, cidade: r.cidade, uf: r.uf,
    tipo: r.tipo, codigoNF: r.codigoNF,
    transportadora: r.transportadora, valorNota: r.valorNota, valorFrete: r.valorFrete,
    peso: r.peso, volumes: r.volumes
  };
}

function normalizeFilters_(f) {
  return {
    query: normalizeText_(f.query || ""), filial: normalizeText_(f.filial || ""),
    tipo: normalizeFreightType_(f.tipo || ""),
    transportadora: normalizeText_(f.transportadora || ""),
    from: string_(f.from), to: string_(f.to)
  };
}
function matchesFilters_(r, f) {
  const blob = normalizeText_([r.codcli, r.cliente, r.codigoNF, r.cnpj, r.cidade, r.uf, r.filial, r.tipo, r.transportadora].join(" "));
  if (f.query && !blob.includes(f.query)) return false;
  if (f.filial && !normalizeText_(r.filial).includes(f.filial)) return false;
  if (f.tipo && normalizeFreightType_(r.tipo) !== f.tipo) return false;
  if (f.transportadora && !normalizeText_(r.transportadora).includes(f.transportadora)) return false;
  const d = parseDate_(r.dataInsercao);
  if ((f.from || f.to) && !d) return false;
  if (d && f.from && Utilities.formatDate(d, CFG.TIMEZONE, "yyyy-MM-dd") < f.from) return false;
  if (d && f.to && Utilities.formatDate(d, CFG.TIMEZONE, "yyyy-MM-dd") > f.to) return false;
  return true;
}

function findClientByCode_(sh, code) {
  const last = sh.getLastRow();
  if (last < CFG.FIRST_DATA_ROW) return null;
  const exactCode = string_(code);
  const finder = sh.getRange(CFG.FIRST_DATA_ROW, 1, last - CFG.FIRST_DATA_ROW + 1, 1)
    .createTextFinder(exactCode).matchEntireCell(true).matchCase(false);
  const cell = finder.findNext();
  if (!cell) return null;
  return clientFromRow_(sh.getRange(cell.getRow(), 1, 1, CFG.CADASTRO_COLS).getDisplayValues()[0], cell.getRow());
}
function findClientsByExactName_(sh, name) {
  const last = sh.getLastRow();
  const exactName = string_(name);
  if (last < CFG.FIRST_DATA_ROW || !exactName) return [];
  const finder = sh.getRange(CFG.FIRST_DATA_ROW, 2, last - CFG.FIRST_DATA_ROW + 1, 1)
    .createTextFinder(exactName).matchEntireCell(true).matchCase(false);
  const out = [];
  let cell;
  while ((cell = finder.findNext()) && out.length < 10) {
    const row = cell.getRow();
    const values = sh.getRange(row, 1, 1, CFG.CADASTRO_COLS).getDisplayValues()[0];
    const c = clientFromRow_(values, row);
    if (normalizeText_(c.name) === normalizeText_(exactName)) out.push(c);
  }
  return out;
}

function validateRequiredSheets_(ss) {
  if (!ss) throw new Error("Não foi possível identificar a planilha de fretes.");
  [CFG.SHEETS.CADASTRO, CFG.SHEETS.HISTORICO, CFG.SHEETS.TRANSPORTADOR].forEach(name => {
    if (!ss.getSheetByName(name)) throw new Error('A aba obrigatória "' + name + '" não foi encontrada.');
  });
  if (ss.getSheetByName(CFG.SHEETS.CADASTRO).getMaxColumns() < CFG.CADASTRO_COLS) {
    throw new Error("A aba CADASTRO precisa ter pelo menos 12 colunas na ordem esperada.");
  }
  const hist = ss.getSheetByName(CFG.SHEETS.HISTORICO);
  if (hist.getMaxColumns() < CFG.HISTORICO_COLS) {
    throw new Error("A aba HISTÓRICO precisa ter as 23 colunas existentes de A a W. O painel não cria colunas.");
  }
  getHistoryColumnMap_(hist);
}

/** Encontra a última linha real pela coluna A (data de inserção), ignorando fórmulas pré-preenchidas em X:AB. */
function getNextHistoryRow_(sh) {
  const last = sh.getLastRow();
  if (last < CFG.FIRST_DATA_ROW) return CFG.FIRST_DATA_ROW;
  const values = sh.getRange(CFG.FIRST_DATA_ROW, 1, last - CFG.HEADER_ROW, 1).getDisplayValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (string_(values[i][0])) return CFG.FIRST_DATA_ROW + i + 1;
  }
  return CFG.FIRST_DATA_ROW;
}

function getSheet_(name, ss) {
  const spreadsheet = ss || getSpreadsheet_();
  const sh = spreadsheet.getSheetByName(name);
  if (!sh) throw new Error('Aba "' + name + '" não encontrada na planilha configurada.');
  return sh;
}

/** Execute uma vez pelo Apps Script vinculado à planilha correta de fretes. */
function configurarPlanilhaFretes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Abra a planilha de fretes e execute esta função pelo Apps Script vinculado a ela.");
  validateRequiredSheets_(ss);
  PropertiesService.getScriptProperties().setProperty(CFG.SPREADSHEET_ID_PROPERTY, ss.getId());
  const result = { ok: true, spreadsheetName: ss.getName(), spreadsheetId: ss.getId(),
    sheets: [CFG.SHEETS.CADASTRO, CFG.SHEETS.HISTORICO, CFG.SHEETS.TRANSPORTADOR], historyTypeColumn: "N (Tipo: DEDICADO, TRANSFERENCIA, CIF, FOB)" };
  console.log("Configuração de fretes concluída: " + JSON.stringify(result));
  return result;
}

/** Diagnóstico rápido para confirmar conexão e estrutura mínima do painel. */
function diagnosticoFretes() {
  const ss = getSpreadsheet_();
  validateRequiredSheets_(ss);
  const result = {
    ok: true, spreadsheetName: ss.getName(), spreadsheetId: ss.getId(),
    sheets: [CFG.SHEETS.CADASTRO, CFG.SHEETS.HISTORICO, CFG.SHEETS.TRANSPORTADOR].map(name => ({
      name, lastRow: ss.getSheetByName(name).getLastRow(), lastColumn: ss.getSheetByName(name).getLastColumn()
    })),
    typeColumn: "N (Tipo: DEDICADO, TRANSFERENCIA, CIF, FOB)",
    generatedAt: Utilities.formatDate(new Date(), CFG.TIMEZONE, "dd/MM/yyyy HH:mm:ss")
  };
  console.log("Diagnóstico de fretes: " + JSON.stringify(result));
  return result;
}

function getSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty(CFG.SPREADSHEET_ID_PROPERTY);
  if (id) {
    try { return SpreadsheetApp.openById(id); }
    catch (err) {
      throw new Error("Não foi possível abrir a planilha de fretes configurada. Abra a planilha correta e execute configurarPlanilhaFretes() novamente. Detalhe: " + (err && err.message ? err.message : err));
    }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("Planilha não configurada para a Web App. Abra a planilha de fretes, entre em Extensões → Apps Script e execute configurarPlanilhaFretes() uma vez.");
}
function increment_(o, k, n) { o[k] = (o[k] || 0) + n; }
function objectToSortedArray_(o, keyName, valueName, limit) { return Object.keys(o).map(k => ({ [keyName]: k, [valueName]: o[k] })).sort((a,b) => b[valueName]-a[valueName]).slice(0,limit); }
function string_(v) { return v == null ? "" : String(v).trim(); }
function number_(v) { const n = typeof v === "number" ? v : Number(String(v || "0").replace(",", ".")); return isFinite(n) ? n : 0; }
function normalizeText_(v) { return string_(v).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
function parseDateInput_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) throw new Error("Data de entrega inválida.");
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) throw new Error("Data de entrega inválida.");
  return d;
}
function parseDate_(v) { if (v instanceof Date && !isNaN(v)) return v; if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; }
function formatDate_(v) { const d = parseDate_(v); return d ? Utilities.formatDate(d, CFG.TIMEZONE, "dd/MM/yyyy") : ""; }
function formatDateTime_(v) { const d = parseDate_(v); return d ? Utilities.formatDate(d, CFG.TIMEZONE, "dd/MM/yyyy HH:mm") : ""; }

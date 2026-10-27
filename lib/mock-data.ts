// Todos os dados deste arquivo são FICTÍCIOS e servem apenas para visualizar o protótipo.

export type FreightType = "Dedicado" | "Transferência" | "CIF" | "FOB"
export type Incoterm = "CIF" | "FOB"
export type Modal = "Rodoviário" | "Aéreo" | "Ferroviário" | "Cabotagem"
export type DeliveryStatus = "Entregue" | "Em trânsito" | "Aguardando" | "Pendente"

export interface Client {
  codcli: string
  nome: string
  cidade: string
  uf: string
  cnpj?: string
  filial?: string
  regiao?: string
  rota?: string
  bairro?: string
}

export interface Carrier {
  id: string
  nome: string
  fretes: number
  valor: number
  pontualidade: number
}

export interface Launch {
  id: string
  lancadoEm: string
  coleta: string
  entrega: string | null
  cliente: Client
  transportadora: string
  tipo: FreightType
  incoterm: Incoterm
  origem: string
  destino: string
  nf: string
  valorNota: number
  peso: number
  volumes: number
  modal: Modal
  valorFrete: number
  status: DeliveryStatus
  motivoDedicada?: string
  observacoes?: string
}

export const FREIGHT_TYPES: FreightType[] = ["Dedicado", "Transferência", "CIF", "FOB"]
export const INCOTERMS: Incoterm[] = ["CIF", "FOB"]
export const MODALS: Modal[] = ["Rodoviário", "Aéreo", "Ferroviário", "Cabotagem"]
export const STATUSES: DeliveryStatus[] = ["Entregue", "Em trânsito", "Aguardando", "Pendente"]
export const DEDICATED_REASONS = [
  "Urgência do cliente",
  "Carga de alto valor",
  "Volume acima da capacidade fracionada",
  "Restrição de manuseio",
  "Janela de entrega específica",
]

export const CLIENTS: Client[] = [
  { codcli: "10021", nome: "Cliente Demo Alfa Atacado", cidade: "São Paulo", uf: "SP" },
  { codcli: "10022", nome: "Cliente Demo Alfa Varejo", cidade: "Campinas", uf: "SP" },
  { codcli: "10345", nome: "Exemplo Beta Distribuidora", cidade: "Curitiba", uf: "PR" },
  { codcli: "10346", nome: "Exemplo Beta Filial Sul", cidade: "Londrina", uf: "PR" },
  { codcli: "11002", nome: "Fictícia Gama Indústria", cidade: "Belo Horizonte", uf: "MG" },
  { codcli: "11078", nome: "Modelo Delta Comércio", cidade: "Ribeirão Preto", uf: "SP" },
  { codcli: "12210", nome: "Teste Épsilon Alimentos", cidade: "Goiânia", uf: "GO" },
  { codcli: "12450", nome: "Amostra Zeta Materiais", cidade: "Rio de Janeiro", uf: "RJ" },
  { codcli: "13001", nome: "Demo Eta Farmacêutica", cidade: "Campinas", uf: "SP" },
  { codcli: "13999", nome: "Exemplo Teta Logística", cidade: "Campo Grande", uf: "MS" },
]

export const CARRIERS: Carrier[] = [
  { id: "t1", nome: "Transportadora Demo A", fretes: 28, valor: 61240, pontualidade: 96 },
  { id: "t2", nome: "Transportadora Demo B", fretes: 24, valor: 48710, pontualidade: 92 },
  { id: "t3", nome: "Transportadora Demo C", fretes: 18, valor: 39880, pontualidade: 89 },
  { id: "t4", nome: "Transportadora Demo D", fretes: 12, valor: 27150, pontualidade: 94 },
  { id: "t5", nome: "Transportadora Demo E", fretes: 10, valor: 19960, pontualidade: 85 },
  { id: "t6", nome: "Transportadora Demo F", fretes: 7, valor: 14320, pontualidade: 90 },
]

export const KPIS = {
  fretes: { value: 128, delta: 12 },
  valor: { value: 256430.5, delta: 18 },
  entregues: { value: 112, delta: 9 },
  transito: { value: 14, delta: 0 },
  pendencias: { value: 5, delta: 25 },
}

export const MONTHLY = [
  { mes: "Mai", valor: 32000, quantidade: 78 },
  { mes: "Jun", valor: 61000, quantidade: 92 },
  { mes: "Jul", valor: 54000, quantidade: 88 },
  { mes: "Ago", valor: 112000, quantidade: 109 },
  { mes: "Set", valor: 96000, quantidade: 121 },
  { mes: "Out", valor: 148000, quantidade: 128 },
]

export const TYPE_COLORS: Record<FreightType, string> = {
  Dedicado: "#3b82f6",
  Transferência: "#8b5cf6",
  CIF: "#22d3ee",
  FOB: "#f59e0b",
}

export const TYPE_DISTRIBUTION: { tipo: FreightType; total: number }[] = [
  { tipo: "Dedicado", total: 42 },
  { tipo: "Transferência", total: 28 },
  { tipo: "CIF", total: 24 },
  { tipo: "FOB", total: 16 },
]

export const STATUS_COLORS: Record<DeliveryStatus, string> = {
  Entregue: "#22c55e",
  "Em trânsito": "#3b82f6",
  Aguardando: "#f59e0b",
  Pendente: "#fb5174",
}

export const STATUS_DISTRIBUTION: { status: DeliveryStatus; total: number }[] = [
  { status: "Entregue", total: 107 },
  { status: "Em trânsito", total: 14 },
  { status: "Aguardando", total: 2 },
  { status: "Pendente", total: 5 },
]

export const DESTINATIONS = [
  { cidade: "São Paulo - SP", fretes: 32 },
  { cidade: "Campinas - SP", fretes: 18 },
  { cidade: "Ribeirão Preto - SP", fretes: 12 },
  { cidade: "Curitiba - PR", fretes: 10 },
  { cidade: "Belo Horizonte - MG", fretes: 9 },
  { cidade: "Goiânia - GO", fretes: 7 },
]

const CITIES = ["São Paulo - SP", "Curitiba - PR", "Belo Horizonte - MG", "Rio de Janeiro - RJ", "Campinas - SP", "Goiânia - GO"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function buildLaunches(): Launch[] {
  const list: Launch[] = []
  for (let i = 0; i < 46; i++) {
    const day = 26 - Math.floor(i / 2)
    const month = day > 0 ? 10 : 9
    const realDay = day > 0 ? day : 30 + day
    const date = `2026-${pad(month)}-${pad(realDay)}`
    const cliente = CLIENTS[(i * 3) % CLIENTS.length]
    const tipo = FREIGHT_TYPES[(i * 7) % FREIGHT_TYPES.length]
    const status = STATUSES[i % 9 === 0 ? 3 : i % 5 === 0 ? 2 : i < 8 ? 1 : 0]
    const origem = CITIES[i % CITIES.length]
    let destino = CITIES[(i * 5 + 2) % CITIES.length]
    if (destino === origem) destino = CITIES[(i + 1) % CITIES.length]
    const deliveryDay = Math.min(28, realDay + 2)
    list.push({
      id: `DEMO-${String(1280 - i).padStart(5, "0")}`,
      lancadoEm: date,
      coleta: date,
      entrega: status === "Entregue" ? `2026-${pad(month)}-${pad(deliveryDay)}` : null,
      cliente,
      transportadora: CARRIERS[(i * 2) % CARRIERS.length].nome,
      tipo,
      incoterm: i % 3 === 0 ? "FOB" : "CIF",
      origem,
      destino,
      nf: `000${45120 + i * 13}`,
      valorNota: 8000 + ((i * 3791) % 52000),
      peso: 120 + ((i * 457) % 4800),
      volumes: 2 + ((i * 7) % 40),
      modal: MODALS[i % 11 === 0 ? 1 : i % 13 === 0 ? 2 : 0],
      valorFrete: 980 + ((i * 1237) % 5200),
      status,
      motivoDedicada: tipo === "Dedicado" ? DEDICATED_REASONS[i % DEDICATED_REASONS.length] : undefined,
      observacoes: i % 4 === 0 ? "Agendar recebimento com 24h de antecedência (exemplo)." : undefined,
    })
  }
  return list
}

export const LAUNCHES: Launch[] = buildLaunches()

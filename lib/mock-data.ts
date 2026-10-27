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

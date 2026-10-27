export type ApiClient = { row?: number; code: string; name: string; city?: string; cidade?: string; uf?: string; cnpj?: string; filial?: string; regiao?: string; rota?: string; bairro?: string; endereco?: string; transportadora?: string; tipo?: string };
export type HistoryRow = { rowNumber:number; dataInsercao:string; dataEntrega?:string; codcli:string; cliente:string; filial:string; cidade:string; uf:string; tipo:string; codigoNF:string; transportadora:string; valorNota:number; valorFrete:number; peso:number; volumes:number };
export type DashboardData = { kpis:{count:number;totalFrete:number;totalNota:number;peso:number;volumes:number;averageFrete:number}; byTransportadora:{name:string;value:number}[]; byTipo:{name:string;value:number}[]; byFilial:{name:string;value:number}[]; byMes:{name:string;value:number}[]; count:number };
export type ApiResult<T> = { ok?: boolean; error?: string; message?: string; data?: T } & T;

export async function freightApi<T>(action: string, payload: unknown = {}): Promise<ApiResult<T>> {
  const res = await fetch(`/api/fretes/${encodeURIComponent(action)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.message || `Falha na integração (${res.status}).`);
  return ({ ...(data.data && typeof data.data === "object" ? data.data : {}), ...data } as ApiResult<T>);
}
export async function searchClients(query: string): Promise<ApiClient[]> { return (await freightApi<{ clients: ApiClient[] }>("searchClients", { query })).clients || []; }
export async function getClientByCode(code: string): Promise<ApiClient | null> { return (await freightApi<{ client: ApiClient | null }>("getClientByCode", { code })).client ?? null; }
export async function searchCarriers(query = ""): Promise<string[]> { return (await freightApi<{ carriers: string[] }>("searchCarriers", { query })).carriers || []; }
export async function getDashboard(filters: Record<string, unknown> = {}): Promise<DashboardData> { return await freightApi<DashboardData>("dashboard", { filters }) as DashboardData; }
export async function getHistory(params: {page?:number;pageSize?:number;filters?:Record<string,unknown>} = {}) { return await freightApi<{rows:HistoryRow[];total:number;page:number;pageSize:number;pages:number}>("history", params); }
export async function getInitial() { return await freightApi<{spreadsheetName:string;dashboard:DashboardData;recent:HistoryRow[];generatedAt:string}>("initial", {}); }
export async function getHistoryDetail(rowNumber:number) { return await freightApi<Record<string,unknown>>("historyDetail", {rowNumber}); }

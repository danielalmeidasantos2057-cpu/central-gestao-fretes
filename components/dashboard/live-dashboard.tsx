"use client"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, CircleDollarSign, Package, Truck } from "lucide-react"
import { getInitial, type DashboardData, type HistoryRow } from "@/lib/api"
import { formatBRL, formatNumber } from "@/lib/utils"
import { Panel, EmptyState } from "@/components/ui-kit"
import Link from "next/link"
import { buttonClass } from "@/components/ui-kit"

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"]
export function LiveDashboard() {
 const [data,setData] = useState<DashboardData|null>(null); const [recent,setRecent] = useState<HistoryRow[]>([]); const [sheet,setSheet] = useState(""); const [stamp,setStamp] = useState(""); const [error,setError] = useState(""); const [loading,setLoading] = useState(true)
 useEffect(()=>{ let active=true; getInitial().then(r=>{if(!active)return;setData(r.dashboard);setRecent(r.recent||[]);setSheet(r.spreadsheetName||"");setStamp(r.generatedAt||"")}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Falha ao carregar dados reais.")}).finally(()=>{if(active)setLoading(false)}); return ()=>{active=false} },[])
 if(loading) return <div className="rounded-2xl border border-line bg-surface p-8 text-muted">Carregando dados da planilha...</div>
 if(error || !data) return <div className="rounded-2xl border border-danger/40 bg-surface p-6"><h2 className="font-semibold text-foreground">Painel aguardando conexão</h2><p className="mt-2 text-sm text-muted">{error || "A API não retornou dados."}</p><p className="mt-2 text-sm text-muted">Configure a URL do Apps Script e o token no servidor. Nenhum dado de demonstração será exibido como se fosse real.</p></div>
 const k=data.kpis
 const cards=[{label:"Lançamentos",value:formatNumber(k.count),icon:Truck},{label:"Valor total de fretes",value:formatBRL(k.totalFrete),icon:CircleDollarSign},{label:"Valor total das notas",value:formatBRL(k.totalNota),icon:Package},{label:"Peso total",value:`${formatNumber(k.peso)} kg`,icon:AlertTriangle}]
 return <div className="flex flex-col gap-5">
  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted"><span>Fonte: {sheet || "planilha configurada"}</span><span>Atualizado em {stamp || "—"}</span></div>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(c=><article key={c.label} className="rounded-2xl border border-line bg-surface p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted">{c.label}</span><c.icon className="size-5 text-primary" aria-hidden/></div><p className="mt-3 text-2xl font-semibold text-foreground tabular-nums">{c.value}</p></article>)}</div>
  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
   <Panel title="Valor de frete por mês" description="Agrupado pela data de inserção"><div className="h-72">{data.byMes.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={data.byMes}><CartesianGrid strokeDasharray="3 3" stroke="#27345f"/><XAxis dataKey="name" stroke="#a3b0d6"/><YAxis stroke="#a3b0d6"/><Tooltip formatter={(v)=>formatBRL(Number(v))}/><Bar dataKey="value" name="Valor" fill="#3b82f6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<EmptyState title="Sem dados mensais" description="Não há lançamentos suficientes para montar o gráfico."/>}</div></Panel>
   <Panel title="Distribuição por tipo" description="Dedicado, Transferência, CIF e FOB"><div className="h-72">{data.byTipo.length?<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.byTipo} dataKey="value" nameKey="name" outerRadius={95} label>{data.byTipo.map((v,i)=><Cell key={v.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>formatBRL(Number(v))}/></PieChart></ResponsiveContainer>:<EmptyState title="Sem dados por tipo" description="Não há lançamentos classificados."/>}</div></Panel>
  </div>
  <Panel title="Lançamentos recentes" description="Registros retornados pela aba HISTÓRICO" action={<Link href="/historico" className={buttonClass("secondary","sm")}>Ver histórico completo</Link>} bodyClassName="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-muted"><tr className="border-b border-line"><th className="px-5 py-3">Cliente / CODCLI</th><th className="px-5 py-3">NF</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Transportadora</th><th className="px-5 py-3 text-right">Valor frete</th><th className="px-5 py-3">Inserido em</th></tr></thead><tbody>{recent.map(r=><tr key={r.rowNumber} className="border-b border-line/60"><td className="px-5 py-3"><span className="block font-medium text-foreground">{r.cliente||"—"}</span><span className="font-mono text-xs text-muted">{r.codcli}</span></td><td className="px-5 py-3">{r.codigoNF||"—"}</td><td className="px-5 py-3">{r.tipo||"—"}</td><td className="px-5 py-3">{r.transportadora||"—"}</td><td className="px-5 py-3 text-right tabular-nums">{formatBRL(r.valorFrete)}</td><td className="px-5 py-3">{r.dataInsercao||"—"}</td></tr>)}</tbody></table>{!recent.length&&<p className="p-5 text-sm text-muted">Nenhum lançamento encontrado.</p>}</div></Panel>
 </div>
}

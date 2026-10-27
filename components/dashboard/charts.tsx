"use client"

import { useState } from "react"
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, PieChart as PieIcon, ShieldCheck } from "lucide-react"
import { Panel } from "@/components/ui-kit"
import { MONTHLY, STATUS_COLORS, STATUS_DISTRIBUTION, TYPE_COLORS, TYPE_DISTRIBUTION } from "@/lib/mock-data"
import { formatBRL } from "@/lib/utils"

const tooltipStyle = {
  background: "#101a3e",
  border: "1px solid #2e3f7d",
  borderRadius: 12,
  color: "#e8edff",
  fontSize: 14,
}

export function EvolutionChart() {
  const [range, setRange] = useState("6")
  const data = range === "3" ? MONTHLY.slice(-3) : MONTHLY

  return (
    <Panel
      title="Evolução mensal dos fretes"
      description="Valor (R$) e quantidade por mês"
      icon={BarChart3}
      action={
        <>
          <label htmlFor="evolution-range" className="sr-only">
            Período
          </label>
          <select
            id="evolution-range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-foreground"
          >
            <option value="6">Últimos 6 meses</option>
            <option value="3">Últimos 3 meses</option>
          </select>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-5 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-primary" aria-hidden /> Valor (R$)
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-violet" aria-hidden /> Quantidade
        </span>
      </div>
      <div className="h-72" role="img" aria-label="Gráfico de barras e linha com valor e quantidade de fretes por mês (dados fictícios)">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2c5c" vertical={false} />
            <XAxis dataKey="mes" stroke="#a3b0d6" tickLine={false} axisLine={false} fontSize={13} />
            <YAxis
              yAxisId="valor"
              stroke="#a3b0d6"
              tickLine={false}
              axisLine={false}
              fontSize={13}
              width={52}
              tickFormatter={(v: number) => `${v / 1000}k`}
            />
            <YAxis yAxisId="qtd" orientation="right" stroke="#a3b0d6" tickLine={false} axisLine={false} fontSize={13} width={36} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgb(59 130 246 / 0.08)" }}
              formatter={(value, name) => (name === "valor" ? [formatBRL(Number(value)), "Valor"] : [value, "Quantidade"])}
            />
            <Bar yAxisId="valor" dataKey="valor" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            <Line yAxisId="qtd" dataKey="quantidade" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function Donut({
  data,
  label,
}: {
  data: { name: string; value: number; color: string }[]
  label: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
      <div className="relative size-44 shrink-0" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#e8edff" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums text-foreground">{total}</span>
          <span className="text-sm text-muted">Total</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5 text-foreground">
              <span className="size-3 rounded-full" style={{ background: d.color }} aria-hidden />
              {d.name}
            </span>
            <span className="tabular-nums text-muted">
              <span className="font-semibold text-foreground">{d.value}</span> ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TypeDistribution() {
  return (
    <Panel title="Distribuição por tipo de frete" description="Tipo operacional no mês" icon={PieIcon}>
      <Donut
        label="Distribuição de fretes por tipo operacional (dados fictícios)"
        data={TYPE_DISTRIBUTION.map((d) => ({ name: d.tipo, value: d.total, color: TYPE_COLORS[d.tipo] }))}
      />
    </Panel>
  )
}

export function StatusDistribution() {
  return (
    <Panel title="Status das entregas" description="Situação atual dos fretes do mês" icon={ShieldCheck}>
      <Donut
        label="Distribuição de fretes por status de entrega (dados fictícios)"
        data={STATUS_DISTRIBUTION.map((d) => ({ name: d.status, value: d.total, color: STATUS_COLORS[d.status] }))}
      />
    </Panel>
  )
}

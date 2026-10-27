import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CircleDollarSign, Clock, PackageCheck, Truck, type LucideIcon } from "lucide-react"
import { KPIS } from "@/lib/mock-data"
import { cn, formatBRL, formatNumber } from "@/lib/utils"

type Tone = "primary" | "warning" | "success" | "cyan" | "danger"

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/12 text-info-fg",
  warning: "bg-warning/12 text-warning-fg",
  success: "bg-success/12 text-success-fg",
  cyan: "bg-cyan/12 text-cyan",
  danger: "bg-danger/12 text-danger-fg",
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  invertDelta,
}: {
  label: string
  value: string
  delta: number
  icon: LucideIcon
  tone: Tone
  invertDelta?: boolean
}) {
  const good = invertDelta ? delta < 0 : delta > 0
  const DeltaIcon = delta === 0 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-muted">{label}</h3>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-foreground tabular-nums xl:text-2xl 2xl:text-[26px]">
        {value}
      </p>
      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-3 text-sm">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
            delta === 0 ? "bg-surface-3 text-muted" : good ? "bg-success/10 text-success-fg" : "bg-danger/10 text-danger-fg",
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden />
          {delta}%
        </span>
        <span className="text-muted">{delta === 0 ? "sem variação" : "em relação ao mês anterior"}</span>
      </p>
    </article>
  )
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard label="Fretes lançados" value={formatNumber(KPIS.fretes.value)} delta={KPIS.fretes.delta} icon={Truck} tone="primary" />
      <KpiCard label="Valor total do frete" value={formatBRL(KPIS.valor.value)} delta={KPIS.valor.delta} icon={CircleDollarSign} tone="warning" />
      <KpiCard label="Entregas realizadas" value={formatNumber(KPIS.entregues.value)} delta={KPIS.entregues.delta} icon={PackageCheck} tone="success" />
      <KpiCard label="Em trânsito" value={formatNumber(KPIS.transito.value)} delta={KPIS.transito.delta} icon={Clock} tone="cyan" />
      <KpiCard label="Pendências" value={formatNumber(KPIS.pendencias.value)} delta={KPIS.pendencias.delta} icon={AlertTriangle} tone="danger" invertDelta />
    </div>
  )
}

import Link from "next/link"
import { ArrowRight, MapPin, Trophy } from "lucide-react"
import { Panel, StatusBadge, TypeTag } from "@/components/ui-kit"
import { CARRIERS, DESTINATIONS, LAUNCHES } from "@/lib/mock-data"
import { cn, formatBRL, formatDate } from "@/lib/utils"

export function Destinations() {
  const max = Math.max(...DESTINATIONS.map((d) => d.fretes))
  return (
    <Panel title="Principais destinos" description="Fretes por cidade de destino" icon={MapPin}>
      <ol className="flex flex-col gap-4">
        {DESTINATIONS.map((d, i) => (
          <li key={d.cidade}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-foreground">
                <span className="mr-2 font-mono text-muted">{String(i + 1).padStart(2, "0")}</span>
                {d.cidade}
              </span>
              <span className="tabular-nums text-muted">
                <span className="font-semibold text-foreground">{d.fretes}</span> fretes
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan to-primary" style={{ width: `${(d.fretes / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

const rankColors = ["from-primary to-cyan", "from-violet to-primary", "from-cyan to-success", "from-warning to-danger", "from-danger to-violet"]

export function CarrierRanking() {
  const top = CARRIERS.slice(0, 5)
  const max = top[0].fretes
  return (
    <Panel title="Ranking de transportadoras" description="Por quantidade de fretes no mês" icon={Trophy}>
      <ol className="flex flex-col gap-4">
        {top.map((c, i) => (
          <li key={c.id} className="flex items-center gap-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                i === 0 ? "border-warning/60 bg-warning/15 text-[#fcd34d]" : "border-line-strong bg-surface-3 text-foreground",
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-foreground">{c.nome}</span>
                <span className="tabular-nums font-semibold text-foreground">{c.fretes}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div className={cn("h-full rounded-full bg-gradient-to-r", rankColors[i])} style={{ width: `${(c.fretes / max) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

export function RecentLaunches() {
  const rows = LAUNCHES.slice(0, 6)
  return (
    <Panel
      title="Lançamentos recentes"
      icon={ArrowRight}
      bodyClassName="p-0"
      action={
        <Link href="/historico" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm text-foreground hover:bg-surface-2">
          Ver histórico <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-5 py-3 font-medium">Data</th>
              <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-5 py-3 font-medium">Rota</th>
              <th scope="col" className="px-5 py-3 font-medium">Tipo</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Valor</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/60">
                <td className="px-5 py-3.5 tabular-nums text-muted">{formatDate(r.lancadoEm)}</td>
                <td className="px-5 py-3.5 text-foreground">{r.cliente.nome}</td>
                <td className="px-5 py-3.5 text-muted">
                  {r.origem.split(" - ")[1]} → {r.destino.split(" - ")[1]}
                </td>
                <td className="px-5 py-3.5"><TypeTag tipo={r.tipo} /></td>
                <td className="px-5 py-3.5 text-right tabular-nums text-foreground">{formatBRL(r.valorFrete)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

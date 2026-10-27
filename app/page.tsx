import { LiveDashboard } from "@/components/dashboard/live-dashboard"
import { PageHeader, buttonClass } from "@/components/ui-kit"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function DashboardPage() {
  return <>
    <PageHeader title="Dashboard" description="Indicadores calculados a partir dos registros reais da aba HISTÓRICO." actions={<Link href="/lancamento" className={buttonClass("primary", "md")}><Plus className="size-4" aria-hidden />Novo lançamento</Link>} />
    <LiveDashboard />
  </>
}

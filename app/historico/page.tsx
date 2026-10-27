import type { Metadata } from "next"
import { HistoryView } from "@/components/historico/history-view"
import { PageHeader } from "@/components/ui-kit"

export const metadata: Metadata = { title: "Histórico · Central de Gestão de Fretes" }

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <>
      <PageHeader title="Histórico" description="Todos os lançamentos de frete, com filtros, pesquisa e detalhes." />
      <HistoryView key={q ?? ""} initialQuery={q ?? ""} />
    </>
  )
}

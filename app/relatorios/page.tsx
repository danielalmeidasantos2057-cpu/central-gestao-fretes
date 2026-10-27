import type { Metadata } from "next"
import { ReportList } from "@/components/relatorios/report-list"
import { PageHeader } from "@/components/ui-kit"

export const metadata: Metadata = { title: "Relatórios · Central de Gestão de Fretes" }

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader title="Relatórios" description="Exporte relatórios CSV construídos a partir dos registros reais do HISTÓRICO." />
      <ReportList />
    </>
  )
}

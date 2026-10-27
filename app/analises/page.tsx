import type { Metadata } from "next"
import { AnalysisCharts } from "@/components/analises/analysis-charts"
import { PageHeader } from "@/components/ui-kit"

export const metadata: Metadata = { title: "Análises · Central de Gestão de Fretes" }

export default function AnalisesPage() {
  return (
    <>
      <PageHeader title="Análises" description="Indicadores de custo e composição dos fretes para apoiar decisões." />
      <AnalysisCharts />
    </>
  )
}

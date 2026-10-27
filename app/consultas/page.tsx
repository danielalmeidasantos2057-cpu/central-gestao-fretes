import type { Metadata } from "next"
import { QuickLookup } from "@/components/consultas/quick-lookup"
import { PageHeader } from "@/components/ui-kit"

export const metadata: Metadata = { title: "Consultas · Central de Gestão de Fretes" }

export default function ConsultasPage() {
  return (
    <>
      <PageHeader title="Consultas" description="Consulta exata por número de nota fiscal ou CODCLI, usando os dados reais do HISTÓRICO." />
      <QuickLookup />
    </>
  )
}

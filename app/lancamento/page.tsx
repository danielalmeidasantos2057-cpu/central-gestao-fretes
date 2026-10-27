import type { Metadata } from "next"
import { FreightForm } from "@/components/lancamento/freight-form"
import { PageHeader } from "@/components/ui-kit"

export const metadata: Metadata = { title: "Lançamento de Frete · Central de Gestão de Fretes" }

export default function LancamentoPage() {
  return (
    <>
      <PageHeader
        title="Lançamento de Frete"
        description="Preencha as etapas abaixo. O lançamento será confirmado somente após resposta positiva da planilha."
      />
      <FreightForm />
    </>
  )
}

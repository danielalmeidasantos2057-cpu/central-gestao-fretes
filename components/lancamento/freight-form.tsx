"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Eraser, Info, Plus } from "lucide-react"
import { ClientPicker } from "@/components/lancamento/client-picker"
import { Button, Field, Panel, Spinner, inputClass } from "@/components/ui-kit"
import {
  DEDICATED_REASONS,
  MODALS,
  type Client,
} from "@/lib/mock-data"
import { cn, formatBRL, formatDate, formatNumber, parseDecimal } from "@/lib/utils"
import { freightApi, searchCarriers } from "@/lib/api"

interface FormState {
  cliente: Client | null
  transportadora: string
  tipo: "Dedicado" | "Transferência" | "CIF" | "FOB" | ""
  motivoDedicada: string
  origem: string
  destino: string
  modal: string
  coleta: string
  entrega: string
  nf: string
  valorNota: string
  peso: string
  volumes: string
  valorFrete: string
  observacoes: string
}

const EMPTY: FormState = {
  cliente: null,
  transportadora: "",
  tipo: "",
  motivoDedicada: "",
  origem: "",
  destino: "",
  modal: "Rodoviário",
  coleta: "",
  entrega: "",
  nf: "",
  valorNota: "",
  peso: "",
  volumes: "",
  valorFrete: "",
  observacoes: "",
}

const STEPS = [
  { title: "Cliente e operação", description: "Quem, com quem e como" },
  { title: "Rota e datas", description: "Origem, destino e prazos" },
  { title: "Carga e valores", description: "Nota fiscal e frete" },
  { title: "Revisão", description: "Conferir e confirmar" },
]

type Errors = Partial<Record<keyof FormState, string>>

function positive(value: string, label: string, integer = false) {
  if (!value.trim()) return `Informe ${label}.`
  const n = parseDecimal(value)
  if (n === null || n <= 0) return `${label[0].toUpperCase()}${label.slice(1)} deve ser maior que zero.`
  if (integer && !Number.isInteger(n)) return "Use um número inteiro."
  return undefined
}

function validate(step: number, f: FormState): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!f.cliente) e.cliente = "Selecione um cliente pelo CODCLI exato ou pela pesquisa avançada."
    if (!f.transportadora) e.transportadora = "Selecione a transportadora."
    if (!f.tipo) e.tipo = "Escolha o tipo operacional do frete."
    if (f.tipo === "Dedicado" && !f.motivoDedicada) e.motivoDedicada = "Informe o motivo da dedicada."
  }
  if (step === 1) {
    if (f.origem.trim().length < 3) e.origem = "Informe a cidade de origem."
    if (f.destino.trim().length < 3) e.destino = "Informe a cidade de destino."
    if (!f.coleta) e.coleta = "Informe a data de coleta."
    if (f.entrega && f.coleta && f.entrega < f.coleta) e.entrega = "A entrega não pode ser anterior à coleta."
  }
  if (step === 2) {
    if (["CIF", "FOB"].includes(f.tipo) && !/^\d{1,9}$/.test(f.nf.trim())) e.nf = "Para CIF/FOB, informe o número da NF (somente dígitos)."
    e.valorNota = positive(f.valorNota, "o valor da nota")
    e.peso = positive(f.peso, "o peso")
    e.volumes = positive(f.volumes, "a quantidade de volumes", true)
    e.valorFrete = positive(f.valorFrete, "o valor do frete")
  }
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors
}

function Stepper({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Etapas do lançamento">
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s.title}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onJump(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active && "border-cyan/60 bg-cyan/8",
                  done && "border-line-strong bg-surface-2 hover:border-primary/60",
                  !active && !done && "border-line bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    active && "border-cyan text-cyan shadow-[0_0_16px_-2px_rgb(34_211_238/0.6)]",
                    done && "border-success bg-success text-background",
                    !active && !done && "border-line-strong text-muted",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm font-medium", active || done ? "text-foreground" : "text-muted")}>{s.title}</span>
                  <span className="hidden truncate text-xs text-muted lg:block">{s.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-primary via-violet to-cyan transition-all" style={{ width: `${((current + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        Etapa {current + 1} de {STEPS.length}: {STEPS[current].title}
      </p>
    </nav>
  )
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan">{children}</h3>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2.5 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || <span className="font-normal text-muted">—</span>}</dd>
    </div>
  )
}

export function FreightForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [phase, setPhase] = useState<"editing" | "submitting" | "success">("editing")
  const [protocol, setProtocol] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [carriers, setCarriers] = useState<string[]>([])
  const [carrierError, setCarrierError] = useState("")
  useEffect(() => { let active = true; searchCarriers("").then((items) => { if (active) setCarriers(items) }).catch((e) => { if (active) setCarrierError(e instanceof Error ? e.message : "Falha ao carregar transportadoras.") }); return () => { active = false } }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function next() {
    const e = validate(step, form)
    setErrors(e)
    if (Object.keys(e).length === 0) setStep((s) => s + 1)
  }

  function reset() {
    setForm(EMPTY)
    setErrors({})
    setStep(0)
    setPhase("editing")
    setSubmitError("")
  }

  async function confirm() {
    setPhase("submitting"); setSubmitError("")
    try {
      const c = form.cliente
      const result = await freightApi<{ rowNumber?: number; message?: string }>("submitFreight", {
        codcli: c?.codcli || "", cliente: c?.nome || "", cnpj: (c as any)?.cnpj || "", filial: (c as any)?.filial || "",
        uf: c?.uf || "", cidade: c?.cidade || "", bairro: (c as any)?.bairro || "", regiao: (c as any)?.regiao || "", rota: (c as any)?.rota || "",
        transportadora: form.transportadora, tipo: form.tipo, motivoDedicada: form.motivoDedicada, origem: form.origem, destino: form.destino,
        modal: form.modal, dataColeta: form.coleta, dataEntrega: form.entrega || "", codigoNF: form.nf, valorNota: parseDecimal(form.valorNota),
        peso: parseDecimal(form.peso), volumes: parseDecimal(form.volumes), valorFrete: parseDecimal(form.valorFrete), observacao: form.observacoes
      })
      setProtocol(result.rowNumber ? `LINHA-${result.rowNumber}` : "GRAVADO")
      setPhase("success")
    } catch (e) { setPhase("editing"); setSubmitError(e instanceof Error ? e.message : "Não foi possível gravar o frete.") }
  }

  const errorCount = Object.values(errors).filter(Boolean).length

  if (phase === "success") {
    return (
      <Panel className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-[#6ee7a0] ring-1 ring-success/40">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Frete gravado com sucesso</h2>
            <p className="mt-2 text-[15px] text-muted text-pretty">
              Confirmação do Apps Script: <span className="font-mono text-foreground">{protocol}</span>.
            </p>
          </div>
          <dl className="w-full max-w-md rounded-xl border border-line bg-surface-2 px-4 text-left">
            <SummaryRow label="Cliente" value={form.cliente?.nome} />
            <SummaryRow label="Rota" value={`${form.origem} → ${form.destino}`} />
            <SummaryRow label="Valor do frete" value={formatBRL(parseDecimal(form.valorFrete) ?? 0)} />
          </dl>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <Plus className="size-4" aria-hidden /> Novo lançamento
            </Button>
            <Link href="/historico" className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface-2 px-4 text-sm font-medium text-foreground hover:bg-surface-3">
              Ir para o histórico
            </Link>
          </div>
        </div>
      </Panel>
    )
  }

  const submitting = phase === "submitting"

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
      <Panel bodyClassName="p-5 md:p-6">
        <Stepper current={step} onJump={(i) => { setErrors({}); setStep(i) }} />

        {submitError && <div role="alert" className="mt-6 rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">{submitError}</div>}

        {errorCount > 0 && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <p className="text-foreground">
              {errorCount === 1 ? "Há 1 campo" : `Há ${errorCount} campos`} que precisam de atenção antes de continuar.
            </p>
          </div>
        )}

        <form
          className="mt-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (step < 3) next()
            else confirm()
          }}
        >
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <section>
                <SectionTitle>Cliente</SectionTitle>
                <ClientPicker value={form.cliente} onChange={(c) => set("cliente", c)} error={errors.cliente} />
              </section>

              <section>
                <SectionTitle>Transportadora</SectionTitle>
                <Field label="Transportadora" htmlFor="transportadora" required error={errors.transportadora}>
                  <select
                    id="transportadora"
                    value={form.transportadora}
                    onChange={(e) => set("transportadora", e.target.value)}
                    aria-invalid={Boolean(errors.transportadora)}
                    className={inputClass(Boolean(errors.transportadora))}
                  >
                    <option value="">Selecione a transportadora</option>
                    {carriers.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {carrierError && <p role="alert" className="text-sm text-danger">{carrierError}</p>}
                </Field>
              </section>

              <section aria-labelledby="tipo-label">
                <SectionTitle hint="Define como a operação de transporte será executada.">Tipo operacional de frete</SectionTitle>
                <fieldset>
                  <legend id="tipo-label" className="sr-only">Tipo operacional de frete</legend>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(["Dedicado", "Transferência", "CIF", "FOB"] as const).map((t) => {
                      const checked = form.tipo === t
                      return (
                        <label
                          key={t}
                          className={cn(
                            "flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan",
                            checked ? "border-primary bg-primary/15 text-foreground" : "border-line-strong bg-surface-2 text-muted hover:text-foreground",
                            errors.tipo && !checked && "border-danger/60",
                          )}
                        >
                          <input type="radio" name="tipo" value={t} checked={checked} onChange={() => set("tipo", t)} className="sr-only" />
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: t === "Dedicado" ? "#3b82f6" : t === "Transferência" ? "#8b5cf6" : t === "CIF" ? "#22d3ee" : "#f59e0b" }} aria-hidden />
                          {t}
                        </label>
                      )
                    })}
                  </div>
                  {errors.tipo && <p role="alert" className="mt-2 text-sm text-danger">{errors.tipo}</p>}
                </fieldset>

                {form.tipo === "Dedicado" && (
                  <Field label="Motivo da dedicada" htmlFor="motivo" required error={errors.motivoDedicada} className="mt-4">
                    <select
                      id="motivo"
                      value={form.motivoDedicada}
                      onChange={(e) => set("motivoDedicada", e.target.value)}
                      aria-invalid={Boolean(errors.motivoDedicada)}
                      className={inputClass(Boolean(errors.motivoDedicada))}
                    >
                      <option value="">Selecione o motivo</option>
                      {DEDICATED_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </section>

            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-8">
              <section>
                <SectionTitle>Rota</SectionTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Origem" htmlFor="origem" required error={errors.origem}>
                    <input id="origem" value={form.origem} onChange={(e) => set("origem", e.target.value)} placeholder="Cidade - UF" aria-invalid={Boolean(errors.origem)} className={inputClass(Boolean(errors.origem))} />
                  </Field>
                  <Field label="Destino" htmlFor="destino" required error={errors.destino}>
                    <input id="destino" value={form.destino} onChange={(e) => set("destino", e.target.value)} placeholder="Cidade - UF" aria-invalid={Boolean(errors.destino)} className={inputClass(Boolean(errors.destino))} />
                  </Field>
                  <Field label="Modal" htmlFor="modal" required>
                    <select id="modal" value={form.modal} onChange={(e) => set("modal", e.target.value)} className={inputClass()}>
                      {MODALS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>
              <section>
                <SectionTitle>Datas</SectionTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Data de coleta" htmlFor="coleta" required error={errors.coleta}>
                    <input id="coleta" type="date" value={form.coleta} onChange={(e) => set("coleta", e.target.value)} aria-invalid={Boolean(errors.coleta)} className={inputClass(Boolean(errors.coleta))} />
                  </Field>
                  <Field label="Data de entrega" htmlFor="entrega" optional error={errors.entrega} hint="Pode ser preenchida depois, quando a entrega for confirmada.">
                    <input id="entrega" type="date" value={form.entrega} min={form.coleta || undefined} onChange={(e) => set("entrega", e.target.value)} aria-invalid={Boolean(errors.entrega)} className={inputClass(Boolean(errors.entrega))} />
                  </Field>
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-8">
              <section>
                <SectionTitle>Nota fiscal e carga</SectionTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Código NF" htmlFor="nf" required={form.tipo === "CIF" || form.tipo === "FOB"} optional={form.tipo === "Dedicado" || form.tipo === "Transferência"} error={errors.nf}>
                    <input id="nf" inputMode="numeric" value={form.nf} onChange={(e) => set("nf", e.target.value)} placeholder="Ex.: 45120" aria-invalid={Boolean(errors.nf)} className={cn(inputClass(Boolean(errors.nf)), "font-mono")} />
                  </Field>
                  <Field label="Valor da nota (R$)" htmlFor="valorNota" required error={errors.valorNota}>
                    <input id="valorNota" inputMode="decimal" value={form.valorNota} onChange={(e) => set("valorNota", e.target.value)} placeholder="0,00" aria-invalid={Boolean(errors.valorNota)} className={inputClass(Boolean(errors.valorNota))} />
                  </Field>
                  <Field label="Peso (kg)" htmlFor="peso" required error={errors.peso}>
                    <input id="peso" inputMode="decimal" value={form.peso} onChange={(e) => set("peso", e.target.value)} placeholder="0,00" aria-invalid={Boolean(errors.peso)} className={inputClass(Boolean(errors.peso))} />
                  </Field>
                  <Field label="Volumes" htmlFor="volumes" required error={errors.volumes}>
                    <input id="volumes" inputMode="numeric" value={form.volumes} onChange={(e) => set("volumes", e.target.value)} placeholder="0" aria-invalid={Boolean(errors.volumes)} className={inputClass(Boolean(errors.volumes))} />
                  </Field>
                </div>
              </section>
              <section>
                <SectionTitle>Frete</SectionTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Valor do frete (R$)" htmlFor="valorFrete" required error={errors.valorFrete}>
                    <input id="valorFrete" inputMode="decimal" value={form.valorFrete} onChange={(e) => set("valorFrete", e.target.value)} placeholder="0,00" aria-invalid={Boolean(errors.valorFrete)} className={inputClass(Boolean(errors.valorFrete))} />
                  </Field>
                  <Field label="Observações" htmlFor="obs" optional className="md:col-span-2">
                    <textarea id="obs" rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais para a operação" className={cn(inputClass(), "h-auto py-3")} />
                  </Field>
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ReviewBlock title="Cliente e operação" onEdit={() => setStep(0)}>
                <SummaryRow label="Cliente" value={form.cliente ? `${form.cliente.codcli} · ${form.cliente.nome}` : ""} />
                <SummaryRow label="Transportadora" value={form.transportadora} />
                <SummaryRow label="Tipo operacional" value={form.tipo} />
                {form.tipo === "Dedicado" && <SummaryRow label="Motivo da dedicada" value={form.motivoDedicada} />}

              </ReviewBlock>
              <ReviewBlock title="Rota e datas" onEdit={() => setStep(1)}>
                <SummaryRow label="Origem" value={form.origem} />
                <SummaryRow label="Destino" value={form.destino} />
                <SummaryRow label="Modal" value={form.modal} />
                <SummaryRow label="Coleta" value={formatDate(form.coleta)} />
                <SummaryRow label="Entrega" value={form.entrega ? formatDate(form.entrega) : "A definir"} />
              </ReviewBlock>
              <ReviewBlock title="Carga e valores" onEdit={() => setStep(2)} className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                  <SummaryRow label="NF" value={form.nf} />
                  <SummaryRow label="Valor da nota" value={formatBRL(parseDecimal(form.valorNota) ?? 0)} />
                  <SummaryRow label="Peso" value={`${formatNumber(parseDecimal(form.peso) ?? 0)} kg`} />
                  <SummaryRow label="Volumes" value={form.volumes} />
                  <SummaryRow label="Valor do frete" value={formatBRL(parseDecimal(form.valorFrete) ?? 0)} />
                  <SummaryRow label="Observações" value={form.observacoes} />
                </div>
              </ReviewBlock>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={reset} disabled={submitting}>
              <Eraser className="size-4" aria-hidden /> Limpar
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={() => { setErrors({}); setStep((s) => s - 1) }} disabled={submitting}>
                  <ArrowLeft className="size-4" aria-hidden /> Voltar
                </Button>
              )}
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner /> Gravando na planilha...
                  </>
                ) : step < 3 ? (
                  <>
                    Continuar <ArrowRight className="size-4" aria-hidden />
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden /> Confirmar lançamento
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Panel>

      <aside className="flex flex-col gap-5" aria-label="Resumo do lançamento">
        <Panel title="Resumo em tempo real">
          <dl>
            <SummaryRow label="Cliente" value={form.cliente?.nome} />
            <SummaryRow label="Tipo" value={form.tipo} />

            <SummaryRow label="Rota" value={form.origem && form.destino ? `${form.origem} → ${form.destino}` : ""} />
            <SummaryRow label="Coleta" value={form.coleta ? formatDate(form.coleta) : ""} />
            <SummaryRow label="Valor do frete" value={parseDecimal(form.valorFrete) ? formatBRL(parseDecimal(form.valorFrete)!) : ""} />
          </dl>
        </Panel>
        <div className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/8 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-[#93c5fd]" aria-hidden />
          <ul className="flex flex-col gap-2 text-muted">
            <li>O campo <strong className="font-medium text-foreground">Tipo</strong> usa uma única classificação: Dedicado, Transferência, CIF ou FOB.</li>
            <li>A <strong className="font-medium text-foreground">data de entrega</strong> é opcional.</li>
            <li>O CODCLI é consultado na base real; nenhum resultado aproximado é selecionado automaticamente.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

function ReviewBlock({ title, onEdit, children, className }: { title: string; onEdit: () => void; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface-2/60 p-4", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan">{title}</h3>
        <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-sm text-[#93c5fd] hover:bg-surface-3">
          Editar
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  )
}

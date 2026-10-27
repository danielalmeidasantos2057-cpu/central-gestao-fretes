"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { Building2, CheckCircle2, MapPin, Search, SearchX, X } from "lucide-react"
import { Button, EmptyState, Spinner, inputClass } from "@/components/ui-kit"
import type { Client } from "@/lib/mock-data"
import { getClientByCode, searchClients, type ApiClient } from "@/lib/api"
import { cn } from "@/lib/utils"

const isComposing = (e: KeyboardEvent) => e.nativeEvent.isComposing || e.keyCode === 229

export function ClientPicker({
  value,
  onChange,
  error,
}: {
  value: Client | null
  onChange: (client: Client | null) => void
  error?: string
}) {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "notfound">("idle")
  const dialogRef = useRef<HTMLDialogElement>(null)

  async function insertExact() {
    const target = code.trim()
    if (!target) { setStatus("notfound"); return }
    setStatus("loading")
    try {
      const found = await getClientByCode(target)
      if (found) { onChange(toClient(found)); setCode(""); setStatus("idle") }
      else setStatus("notfound")
    } catch (e) {
      setStatus("idle")
      window.alert(e instanceof Error ? e.message : "Falha ao consultar o cadastro de clientes.")
    }
  }

  function openSearch() {
    dialogRef.current?.showModal()
  }

  function selectFromSearch(client: Client) {
    onChange(client)
    dialogRef.current?.close()
  }

  const exactError =
    status === "notfound"
      ? code.trim()
        ? `Nenhum cliente com CODCLI exato "${code.trim()}". Use a pesquisa avançada para buscar por parte do código, nome ou cidade.`
        : "Digite um CODCLI para inserir."
      : undefined
  const shownError = exactError ?? error

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="codcli" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        Cliente / CODCLI <span className="text-danger" aria-hidden>*</span>
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/8 p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-[#6ee7a0]">
              <CheckCircle2 className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{value.nome}</p>
              <p className="text-sm text-muted">
                CODCLI <span className="font-mono text-foreground">{value.codcli}</span> · {value.cidade} - {value.uf}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={() => onChange(null)} aria-label="Remover cliente selecionado">
            <X className="size-4" aria-hidden /> Trocar
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 gap-2">
              <input
                id="codcli"
                inputMode="numeric"
                autoComplete="off"
                placeholder="CODCLI exato, ex.: 10021"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (status === "notfound") setStatus("idle")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isComposing(e)) {
                    e.preventDefault()
                    insertExact()
                  }
                }}
                aria-invalid={Boolean(shownError)}
                aria-describedby={shownError ? "codcli-error" : "codcli-hint"}
                className={cn(inputClass(Boolean(shownError)), "font-mono")}
              />
              <Button type="button" onClick={insertExact} disabled={status === "loading"} className="shrink-0">
                {status === "loading" ? <Spinner /> : null}
                {status === "loading" ? "Buscando" : "Inserir"}
              </Button>
            </div>
            <Button type="button" variant="secondary" onClick={openSearch} className="shrink-0">
              <Search className="size-4" aria-hidden />
              Pesquisa avançada
            </Button>
          </div>
          {shownError ? (
            <p id="codcli-error" role="alert" className="text-sm text-danger">
              {shownError}
            </p>
          ) : (
            <p id="codcli-hint" className="text-sm text-muted">
              <strong className="font-medium text-foreground">Inserir</strong> aceita somente o código exato. Para buscar por nome, cidade ou parte do código, use a pesquisa avançada.
            </p>
          )}
        </>
      )}

      <AdvancedSearchDialog dialogRef={dialogRef} onSelect={selectFromSearch} />
    </div>
  )
}

function toClient(c: ApiClient): Client { return { codcli: c.code, nome: c.name, cidade: c.city || (c as any).cidade || "", uf: c.uf || "", cnpj: c.cnpj, filial: c.filial, regiao: c.regiao, rota: c.rota, bairro: c.bairro } }

function AdvancedSearchDialog({
  dialogRef,
  onSelect,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>
  onSelect: (client: Client) => void
}) {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<Client[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  async function runSearch() {
    if (term.trim().length < 2) { setResults(null); return }
    setSearching(true); setSearchError("")
    try { setResults((await searchClients(term.trim())).map(toClient)) }
    catch (e) { setResults([]); setSearchError(e instanceof Error ? e.message : "Falha na pesquisa.") }
    finally { setSearching(false) }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="advanced-search-title"
      onClose={() => setTerm("")}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line-strong bg-surface p-0 text-foreground shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 id="advanced-search-title" className="text-lg font-semibold">
            Pesquisa avançada de cliente
          </h2>
          <p className="mt-0.5 text-sm text-muted">Busca aproximada por parte do CODCLI, nome ou cidade.</p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label="Fechar pesquisa"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="p-5">
        <label htmlFor="advanced-search-input" className="sr-only">
          Termo de pesquisa
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="advanced-search-input"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex.: 100, Alfa, Campinas"
            className={cn(inputClass(), "pl-11")}
            autoComplete="off"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-muted" aria-live="polite">
            {searching ? "Pesquisando na base real…" : results === null ? "Digite ao menos 2 caracteres e pesquise." : `${results.length} resultado(s) encontrado(s).`}
          </p>
          <Button type="button" size="sm" onClick={() => void runSearch()} disabled={searching || term.trim().length < 2}>{searching ? <Spinner /> : <Search className="size-4" aria-hidden />} Pesquisar</Button>
        </div>
        {searchError && <p role="alert" className="mt-2 text-sm text-danger">{searchError}</p>}

        <div className="mt-4 max-h-80 overflow-y-auto">
          {results === null ? (
            <EmptyState icon={Search} title="Comece a digitar" description="Os resultados aproximados aparecem aqui e podem ser selecionados." />
          ) : results.length === 0 ? (
            <EmptyState icon={SearchX} title="Nenhum cliente encontrado" description={`Nada corresponde a "${term}". Tente outro trecho do nome, código ou cidade.`} />
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((c) => (
                <li key={c.codcli}>
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface-2 p-3.5 text-left transition-colors hover:border-primary/60 hover:bg-surface-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[#93c5fd]">
                      <Building2 className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{c.nome}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                        <MapPin className="size-3.5" aria-hidden /> {c.cidade} - {c.uf}
                      </span>
                    </span>
                    <span className="rounded-md border border-line-strong bg-surface px-2 py-1 font-mono text-sm text-foreground">{c.codcli}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}

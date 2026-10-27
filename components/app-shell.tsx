"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type FormEvent, type ReactNode } from "react"
import {
  BarChart3,
  Bell,
  CalendarDays,
  FilePlus2,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamento", label: "Lançamento de Frete", icon: FilePlus2 },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/consultas", label: "Consultas", icon: Search },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/transportadoras", label: "Transportadoras", icon: Truck },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
        <Truck className="size-5 text-white" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-foreground">Gestão de Fretes</span>
        <span className="block text-xs text-muted">Central de operações</span>
      </span>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Navegação principal">
      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  active
                    ? "bg-primary/15 text-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5 shrink-0", active ? "text-info-fg" : "text-subtle group-hover:text-foreground")} aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SidebarFooter() {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5 text-sm">
      <p className="font-medium text-warning-fg">Protótipo visual</p>
      <p className="mt-1 leading-relaxed text-muted text-pretty">Todos os dados exibidos são fictícios. Nenhuma informação é gravada.</p>
    </div>
  )
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function submit(e: FormEvent) {
    e.preventDefault()
    router.push(`/historico${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/95 px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong text-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <form onSubmit={submit} role="search" className="relative min-w-0 flex-1 md:max-w-xl">
        <label htmlFor="global-search" className="sr-only">
          Pesquisar no histórico de lançamentos
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          id="global-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar no histórico: cliente, NF, cidade..."
          className="h-11 w-full rounded-xl border border-line-strong bg-surface-2 pl-11 pr-4 text-[15px] text-foreground placeholder:text-subtle hover:border-subtle focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-3 xl:flex">
          <CalendarDays className="size-5 text-subtle" aria-hidden />
          <span className="text-sm leading-tight">
            <span className="block text-muted">Segunda-feira</span>
            <span className="block font-medium text-foreground">26 de outubro de 2026</span>
          </span>
        </div>
        <button
          type="button"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-foreground hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          aria-label="Notificações: 3 novas (exemplo)"
        >
          <Bell className="size-5" aria-hidden />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white">
            3
          </span>
        </button>
        <div className="hidden items-center gap-3 md:flex">
          <span className="flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-sm font-semibold text-foreground">
            UD
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-medium text-foreground">Usuário Demo</span>
            <span className="block text-muted">Operações</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh overflow-x-clip lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col gap-8 border-r border-line bg-surface px-5 py-5 lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <SidebarFooter />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <button
            type="button"
            className="absolute inset-0 bg-background/85"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex h-full w-80 max-w-[85vw] flex-col gap-8 border-r border-line bg-surface px-5 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
                aria-label="Fechar menu"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>
            <SidebarFooter />
          </div>
        </div>
      )}

      <TopBar onOpenMenu={() => setMenuOpen(true)} />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  )
}

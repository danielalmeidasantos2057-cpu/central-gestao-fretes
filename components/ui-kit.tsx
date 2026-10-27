import type { ButtonHTMLAttributes, ReactNode } from "react"
import { AlertCircle, CheckCircle2, FlaskConical, Inbox, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeliveryStatus, FreightType } from "@/lib/mock-data"
import { TYPE_COLORS } from "@/lib/mock-data"

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border border-line bg-surface", className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-info-fg">
                <Icon className="size-[18px]" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground text-pretty">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    focusRing,
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-4 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" &&
      "bg-primary font-semibold text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-10px_rgb(59_130_246/0.9)] hover:bg-primary-hover",
    variant === "secondary" && "border border-line-strong bg-surface-2 text-foreground hover:border-subtle hover:bg-surface-3",
    variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-foreground",
    variant === "danger" && "border border-danger/50 bg-danger/10 text-danger-fg hover:bg-danger/20",
    className,
  )
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

export const inputClass = (invalid?: boolean) =>
  cn(
    "h-12 w-full rounded-xl border bg-surface-2 px-4 text-[15px] text-foreground placeholder:text-subtle transition-colors",
    "focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30",
    invalid ? "border-danger/80 bg-danger/5" : "border-line-strong hover:border-subtle",
  )

export function OptionalTag() {
  return (
    <span className="rounded-md border border-line-strong bg-surface-3 px-1.5 py-0.5 text-xs font-medium text-muted">
      Opcional
    </span>
  )
}

export function Field({
  label,
  htmlFor,
  required,
  optional,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  required?: boolean
  optional?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-danger-fg" aria-hidden>
            *
          </span>
        )}
        {optional && <OptionalTag />}
      </label>
      {children}
      {error ? <FieldError id={`${htmlFor}-error`}>{error}</FieldError> : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-danger-fg">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

type AlertTone = "info" | "success" | "warning" | "danger"

const alertTones: Record<AlertTone, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: { box: "border-primary/40 bg-primary/10", icon: Info, iconColor: "text-info-fg" },
  success: { box: "border-success/40 bg-success/10", icon: CheckCircle2, iconColor: "text-success-fg" },
  warning: { box: "border-warning/40 bg-warning/10", icon: TriangleAlert, iconColor: "text-warning-fg" },
  danger: { box: "border-danger/50 bg-danger/10", icon: AlertCircle, iconColor: "text-danger-fg" },
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
  role?: "alert" | "status"
}) {
  const t = alertTones[tone]
  const Icon = t.icon
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", t.box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", t.iconColor)} aria-hidden />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children && <div className={cn("text-muted", title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  )
}

const statusStyles: Record<DeliveryStatus, string> = {
  Entregue: "border-success/40 bg-success/10 text-success-fg",
  "Em trânsito": "border-primary/40 bg-primary/12 text-info-fg",
  Aguardando: "border-warning/40 bg-warning/10 text-warning-fg",
  Pendente: "border-danger/45 bg-danger/10 text-danger-fg",
}

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  )
}

export function TypeTag({ tipo }: { tipo: FreightType }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-foreground">
      <span className="size-2 rounded-full" style={{ background: TYPE_COLORS[tipo] }} aria-hidden />
      {tipo}
    </span>
  )
}

export function IncotermTag({ value }: { value: "CIF" | "FOB" }) {
  return (
    <span className="inline-flex rounded-md border border-line-strong bg-surface-3 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-foreground">
      {value}
    </span>
  )
}

export function MockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/35 bg-warning/8 px-2.5 py-1 text-xs font-medium text-warning-fg",
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden />
      Dados fictícios
    </span>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  tone = "neutral",
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  tone?: "neutral" | "danger"
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center",
        tone === "danger" ? "border-danger/50 bg-danger/5" : "border-line-strong",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          tone === "danger" ? "bg-danger/15 text-danger-fg" : "bg-surface-3 text-muted",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-md text-sm leading-relaxed text-muted text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-xl border border-line p-5">
      <p className="flex items-center gap-2.5 text-sm text-muted">
        <Spinner className="size-4 text-info-fg" /> {label}
      </p>
      <div className="flex flex-col gap-2.5" aria-hidden>
        <span className="h-4 w-3/4 animate-pulse rounded-md bg-surface-3" />
        <span className="h-4 w-1/2 animate-pulse rounded-md bg-surface-3" />
        <span className="h-4 w-2/3 animate-pulse rounded-md bg-surface-3" />
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted text-pretty">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <MockBadge />
        {actions}
      </div>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      aria-hidden
    />
  )
}

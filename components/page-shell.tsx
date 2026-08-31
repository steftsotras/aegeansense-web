import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Consistent page wrapper: shared max-width, horizontal padding, vertical
 * rhythm and the subtle dotted background. Use on every app page so they
 * align to the same grid and feel like one product.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 app-dots opacity-50" />
      <div
        className={cn(
          "relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Standard page header: icon chip + title + subtitle, with optional
 * right-aligned meta/actions. Identical treatment everywhere.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

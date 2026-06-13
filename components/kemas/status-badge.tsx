"use client"

import { cn } from "@/lib/utils"

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: "ok" | "low" | "out"
  label: string
  className?: string
}) {
  const styles: Record<string, string> = {
    ok: "bg-primary/10 text-primary",
    low: "bg-amber-500/15 text-amber-700",
    out: "bg-destructive/10 text-destructive",
  }
  const dot: Record<string, string> = {
    ok: "bg-primary",
    low: "bg-amber-500",
    out: "bg-destructive",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {label}
    </span>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Search as SearchIcon, MapPin, ChevronRight } from "lucide-react"
import { useInventory } from "@/contexts/inventory-context"
import { statusOf, type InventoryItem } from "@/lib/kemas/types"
import { StatusBadge } from "./status-badge"

export function SearchView({ onOpenItem }: { onOpenItem: (item: InventoryItem) => void }) {
  const { t, lang, items } = useInventory()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const hay = [
        it.name,
        it.nameId,
        it.category,
        it.categoryId,
        it.location,
        it.voiceNote || "",
        it.description || "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  return (
    <div className="px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <p className="mb-3 px-1 text-xs text-muted-foreground">
        {query.trim() ? t("resultsCount", { n: results.length }) : t("searchHint")}
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <SearchIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-pretty">{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((it) => {
            const s = statusOf(it)
            const label = t(s === "ok" ? "statusOk" : s === "low" ? "statusLow" : "statusOut")
            return (
              <button
                key={it.id}
                onClick={() => onOpenItem(it)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left active:bg-secondary/50"
              >
                <span className="text-2xl">{it.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {lang === "id" ? it.nameId : it.name}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {it.location} · {lang === "id" ? it.categoryId : it.category}
                  </p>
                  {it.voiceNote && (
                    <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                      &ldquo;{it.voiceNote}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">{it.count}</span>
                  <StatusBadge status={s} label={label} />
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

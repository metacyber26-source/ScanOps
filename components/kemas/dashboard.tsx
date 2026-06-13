"use client"

import { useMemo } from "react"
import { AlertTriangle, BellOff, X, Package, Boxes, TriangleAlert, ChevronRight } from "lucide-react"
import { useInventory } from "@/contexts/inventory-context"
import { statusOf, type InventoryItem } from "@/lib/kemas/types"
import { StatusBadge } from "./status-badge"
import { AgenticCategorization } from "./agentic-categorization"
import { CrossModalSearch } from "./cross-modal-search"
import { PremiumPaymentButton } from "./premium-payment-button"

interface CategoryGroup {
  category: string
  categoryId: string
  emoji: string
  items: InventoryItem[]
  total: number
  hasLow: boolean
}

export function Dashboard({ onOpenItem }: { onOpenItem: (item: InventoryItem) => void }) {
  const { t, lang, items, activeLowStock, dismissAlert, snoozeAlert } = useInventory()

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.count, 0), [items])

  const groups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup>()
    for (const it of items) {
      const key = it.category
      if (!map.has(key)) {
        map.set(key, {
          category: it.category,
          categoryId: it.categoryId,
          emoji: it.emoji,
          items: [],
          total: 0,
          hasLow: false,
        })
      }
      const g = map.get(key)!
      g.items.push(it)
      g.total += it.count
      if (statusOf(it) !== "ok") g.hasLow = true
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [items])

  const lowCount = useMemo(
    () => items.filter((i) => statusOf(i) !== "ok").length,
    [items],
  )

  return (
    <div className="px-4 pb-28 pt-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("greeting")}</p>
        <PremiumPaymentButton variant="outline" size="sm" showPrice={true} />
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={<Boxes className="h-4 w-4" />} value={totalItems} label={t("totalItems")} />
        <StatCard icon={<Package className="h-4 w-4" />} value={groups.length} label={t("categories")} />
        <StatCard
          icon={<TriangleAlert className="h-4 w-4" />}
          value={lowCount}
          label={t("lowStock")}
          alert={lowCount > 0}
        />
      </div>

      {/* AI Tools */}
      <div className="mb-5 space-y-2">
        <div className="flex flex-col gap-2">
          <AgenticCategorization />
        </div>
        <div>
          <CrossModalSearch />
        </div>
      </div>

      {/* Low-stock alerts */}
      {activeLowStock.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {t("lowStockAlerts")}
          </h2>
          <div className="space-y-2">
            {activeLowStock.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5"
              >
                <span className="text-2xl">{it.emoji}</span>
                <div className="min-w-0 flex-1" onClick={() => onOpenItem(it)} role="button">
                  <p className="truncate text-sm font-medium">
                    {lang === "id" ? it.nameId : it.name}
                  </p>
                  <p className="text-xs text-amber-700">
                    {t("runningLow")} · {t("unitsLeft", { n: it.count })}
                  </p>
                </div>
                <button
                  onClick={() => snoozeAlert(it.id)}
                  className="rounded-full p-1.5 text-muted-foreground active:bg-secondary"
                  aria-label={t("snooze")}
                >
                  <BellOff className="h-4 w-4" />
                </button>
                <button
                  onClick={() => dismissAlert(it.id)}
                  className="rounded-full p-1.5 text-muted-foreground active:bg-secondary"
                  aria-label={t("dismiss")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <h2 className="mb-2 text-sm font-semibold">{t("yourCategories")}</h2>
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-pretty">{t("noCategories")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <CategoryCard
              key={g.category}
              group={g}
              lang={lang}
              onOpenItem={onOpenItem}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  alert,
}: {
  icon: React.ReactNode
  value: number
  label: string
  alert?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div
        className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${
          alert ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  )
}

function CategoryCard({
  group,
  lang,
  onOpenItem,
  t,
}: {
  group: CategoryGroup
  lang: "id" | "en"
  onOpenItem: (item: InventoryItem) => void
  t: ReturnType<typeof useInventory>["t"]
}) {
  const catName = lang === "id" ? group.categoryId : group.category
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-2xl">{group.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{catName}</p>
          <p className="text-xs text-muted-foreground">
            {t("itemsCount", { n: group.items.length })} · {group.total}
          </p>
        </div>
        <StatusBadge
          status={group.hasLow ? "low" : "ok"}
          label={group.hasLow ? t("statusLow") : t("inStock")}
        />
      </div>
      <div className="border-t border-border">
        {group.items.map((it) => {
          const s = statusOf(it)
          return (
            <button
              key={it.id}
              onClick={() => onOpenItem(it)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-b-0 active:bg-secondary/50"
            >
              <span className="text-lg">{it.emoji}</span>
              <span className="flex-1 truncate text-sm">{lang === "id" ? it.nameId : it.name}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  s === "out"
                    ? "text-destructive"
                    : s === "low"
                      ? "text-amber-600"
                      : "text-foreground"
                }`}
              >
                {it.count}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

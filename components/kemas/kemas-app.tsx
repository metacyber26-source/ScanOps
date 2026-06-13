"use client"

import { useState } from "react"
import { LayoutGrid, Search as SearchIcon, ScanLine, Boxes } from "lucide-react"
import { InventoryProvider, useInventory } from "@/contexts/inventory-context"
import type { InventoryItem } from "@/lib/kemas/types"
import { Dashboard } from "./dashboard"
import { SearchView } from "./search-view"
import { Scanner } from "./scanner"
import { ItemDetail } from "./item-detail"

type Tab = "dashboard" | "search"

function Shell() {
  const { t, lang, setLang, ready } = useInventory()
  const [tab, setTab] = useState<Tab>("dashboard")
  const [scanning, setScanning] = useState(false)
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Boxes className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold">{t("appName")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("appSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center rounded-full border border-border p-0.5 text-xs font-medium">
          {(["id", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {tab === "dashboard" ? (
          <Dashboard onOpenItem={setActiveItem} />
        ) : (
          <SearchView onOpenItem={setActiveItem} />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 backdrop-blur">
        <div className="relative flex items-center justify-around px-6 py-2">
          <NavButton
            active={tab === "dashboard"}
            icon={<LayoutGrid className="h-5 w-5" />}
            label={t("navDashboard")}
            onClick={() => setTab("dashboard")}
          />

          {/* Center scan button */}
          <button
            onClick={() => setScanning(true)}
            className="absolute -top-6 left-1/2 flex h-16 w-16 -translate-x-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
            aria-label={t("navScan")}
          >
            <ScanLine className="h-6 w-6" />
            <span className="text-[10px] font-medium">{t("navScan")}</span>
          </button>
          <div className="w-16" aria-hidden />

          <NavButton
            active={tab === "search"}
            icon={<SearchIcon className="h-5 w-5" />}
            label={t("navSearch")}
            onClick={() => setTab("search")}
          />
        </div>
      </nav>

      {/* Overlays */}
      {scanning && <Scanner onClose={() => setScanning(false)} />}
      {activeItem && (
        <ItemDetail
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      )}
    </div>
  )
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

export function KemasApp() {
  return (
    <InventoryProvider>
      <Shell />
    </InventoryProvider>
  )
}

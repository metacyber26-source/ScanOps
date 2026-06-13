"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { InventoryItem, AlertState } from "@/lib/kemas/types"
import { statusOf } from "@/lib/kemas/types"
import { detectLang, makeT, type Lang } from "@/lib/kemas/i18n"

const ITEMS_KEY = "kemasai_items_v1"
const ALERTS_KEY = "kemasai_alerts_v1"
const LANG_KEY = "kemasai_lang_v1"

interface InventoryContextValue {
  items: InventoryItem[]
  lang: Lang
  t: ReturnType<typeof makeT>
  setLang: (l: Lang) => void
  addItems: (items: InventoryItem[]) => void
  updateItem: (id: string, patch: Partial<InventoryItem>) => void
  removeItem: (id: string) => void
  getItem: (id: string) => InventoryItem | undefined
  alerts: AlertState
  dismissAlert: (id: string) => void
  snoozeAlert: (id: string) => void
  activeLowStock: InventoryItem[]
  ready: boolean
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

const SNOOZE_MS = 1000 * 60 * 60 * 12 // 12 hours

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<AlertState>({ dismissed: [], snoozedUntil: {} })
  const [lang, setLangState] = useState<Lang>("en")
  const [ready, setReady] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const rawItems = localStorage.getItem(ITEMS_KEY)
      if (rawItems) setItems(JSON.parse(rawItems))
      const rawAlerts = localStorage.getItem(ALERTS_KEY)
      if (rawAlerts) setAlerts(JSON.parse(rawAlerts))
      const savedLang = localStorage.getItem(LANG_KEY) as Lang | null
      setLangState(savedLang || detectLang())
    } catch (e) {
      console.log("[v0] kemas load error", e)
    }
    setReady(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
    } catch {}
  }, [items, ready])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
    } catch {}
  }, [alerts, ready])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(LANG_KEY, lang)
      document.documentElement.lang = lang
    } catch {}
  }, [lang, ready])

  const t = useMemo(() => makeT(lang), [lang])

  const setLang = (l: Lang) => setLangState(l)

  const addItems = (newItems: InventoryItem[]) => {
    setItems((prev) => {
      const next = [...prev]
      for (const ni of newItems) {
        // Merge into existing item of same name (accumulate stock)
        const idx = next.findIndex((x) => x.name === ni.name)
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            count: next[idx].count + ni.count,
            updatedAt: Date.now(),
          }
        } else {
          next.push(ni)
        }
      }
      return next
    })
  }

  const updateItem = (id: string, patch: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const getItem = (id: string) => items.find((x) => x.id === id)

  const dismissAlert = (id: string) => {
    setAlerts((prev) => ({ ...prev, dismissed: [...prev.dismissed, id] }))
  }

  const snoozeAlert = (id: string) => {
    setAlerts((prev) => ({
      ...prev,
      snoozedUntil: { ...prev.snoozedUntil, [id]: Date.now() + SNOOZE_MS },
    }))
  }

  const activeLowStock = useMemo(() => {
    const now = Date.now()
    return items.filter((it) => {
      const s = statusOf(it)
      if (s === "ok") return false
      if (alerts.dismissed.includes(it.id)) return false
      const snoozed = alerts.snoozedUntil[it.id]
      if (snoozed && snoozed > now) return false
      return true
    })
  }, [items, alerts])

  const value: InventoryContextValue = {
    items,
    lang,
    t,
    setLang,
    addItems,
    updateItem,
    removeItem,
    getItem,
    alerts,
    dismissAlert,
    snoozeAlert,
    activeLowStock,
    ready,
  }

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider")
  return ctx
}

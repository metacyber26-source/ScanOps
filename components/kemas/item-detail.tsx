"use client"

import { useEffect, useRef, useState } from "react"
import {
  X,
  Mic,
  Square,
  Play,
  Trash2,
  Minus,
  Plus,
  Loader2,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInventory } from "@/contexts/inventory-context"
import { statusOf, type InventoryItem } from "@/lib/kemas/types"
import { fakeTranscribe } from "@/lib/kemas/vision"
import { StatusBadge } from "./status-badge"
import { PredictiveAnalytics } from "./predictive-analytics"
import { AutoLabeling } from "./auto-labeling"

export function ItemDetail({ item: initial, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { t, lang, items, updateItem, removeItem } = useInventory()
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Read the live item from context so count/voice updates reflect immediately.
  const item = items.find((x) => x.id === initial.id) ?? initial

  const name = lang === "id" ? item.nameId : item.name
  const category = lang === "id" ? item.categoryId : item.category
  const status = statusOf(item)
  const statusLabel = t(status === "ok" ? "statusOk" : status === "low" ? "statusLow" : "statusOut")

  useEffect(() => {
    return () => cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanup() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      // Mic unavailable: simulate a short recording window
      setRecording(true)
    }
  }

  function stopRecording() {
    setRecording(false)
    cleanup()
    setTranscribing(true)
    // Simulate AI transcription latency
    setTimeout(() => {
      const text = fakeTranscribe(lang)
      updateItem(item.id, { voiceNote: text, description: text })
      setTranscribing(false)
    }, 1600)
  }

  function playNote() {
    if (!item.voiceNote) return
    try {
      const u = new SpeechSynthesisUtterance(item.voiceNote)
      u.lang = lang === "id" ? "id-ID" : "en-US"
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } catch {}
  }

  function changeCount(delta: number) {
    updateItem(item.id, { count: Math.max(0, item.count + delta) })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 className="text-base font-semibold">{t("itemDetail")}</h2>
        <button onClick={onClose} className="rounded-full bg-secondary p-2" aria-label={t("close")}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 pb-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-5xl">
            {item.emoji}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-balance">{name}</h3>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
          <StatusBadge status={status} label={statusLabel} />
        </div>

        {/* Count adjuster */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("adjustCount")}
          </p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => changeCount(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border active:bg-secondary"
              aria-label="-1"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-16 text-center text-3xl font-bold tabular-nums">{item.count}</span>
            <button
              onClick={() => changeCount(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground active:opacity-90"
              aria-label="+1"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("location")}</p>
            <p className="text-sm font-medium">{item.location}</p>
          </div>
        </div>

        {/* AI Tools */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <PredictiveAnalytics item={item} />
            <AutoLabeling item={item} />
          </div>
        </div>

        {/* Voice note */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{t("voiceNote")}</p>
          </div>

          {item.voiceNote ? (
            <div className="mb-3 rounded-xl bg-secondary px-3 py-3">
              <p className="text-sm text-pretty">{item.voiceNote}</p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">{t("noVoiceNote")}</p>
          )}

          {transcribing ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("transcribing")}
            </div>
          ) : recording ? (
            <Button variant="destructive" className="w-full" onClick={stopRecording}>
              <Square className="mr-2 h-4 w-4" />
              {t("recording")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={startRecording}>
                <Mic className="mr-2 h-4 w-4" />
                {t("recordNote")}
              </Button>
              {item.voiceNote && (
                <Button variant="secondary" size="icon" onClick={playNote} aria-label={t("playNote")}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            removeItem(item.id)
            onClose()
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("delete")}
        </Button>
      </div>
    </div>
  )
}

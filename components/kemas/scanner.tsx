"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Layers, Loader2, Sparkles, Check, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInventory } from "@/contexts/inventory-context"
import {
  detectAngle,
  mergeAngles,
  groupToItem,
  type DetectedGroup,
} from "@/lib/kemas/vision"
import { useToast } from "@/hooks/use-toast"

type Phase = "idle" | "camera" | "scanning" | "results"

export function Scanner({ onClose }: { onClose: () => void }) {
  const { t, lang, addItems } = useInventory()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [angles, setAngles] = useState<DetectedGroup[][]>([])
  const [merged, setMerged] = useState<DetectedGroup[]>([])
  const [camError, setCamError] = useState(false)

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }

  async function startCamera() {
    setPhase("camera")
    setCamError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setCamError(true)
    }
  }

  function captureAngle() {
    setPhase("scanning")
    // Simulate AI inference latency
    setTimeout(() => {
      const result = detectAngle()
      const next = [...angles, result]
      setAngles(next)
      setMerged(mergeAngles(next))
      setPhase("results")
    }, 1400)
  }

  function save() {
    const items = merged.map(groupToItem)
    const total = items.reduce((s, i) => s + i.count, 0)
    
    // Add scan history for analytics
    const itemsWithHistory = items.map((item) => ({
      ...item,
      scanHistory: [
        ...(item.scanHistory || []),
        { timestamp: Date.now(), count: item.count },
      ].slice(-30), // Keep last 30 scans
    }))
    
    addItems(itemsWithHistory)
    stopCamera()
    toast({ description: t("savedToast", { n: total }) })
    onClose()
  }

  function reset() {
    setAngles([])
    setMerged([])
    setPhase("camera")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 text-background">
        <div>
          <h2 className="text-base font-semibold">{t("scanTitle")}</h2>
          <p className="text-xs text-background/60">{t("scanHint")}</p>
        </div>
        <button
          onClick={() => {
            stopCamera()
            onClose()
          }}
          className="rounded-full bg-background/10 p-2"
          aria-label={t("close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Viewport */}
      <div className="relative flex-1 overflow-hidden">
        {phase === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <p className="text-sm text-background/70 text-pretty">{t("scanHint")}</p>
            <Button size="lg" className="rounded-full px-8" onClick={startCamera}>
              {t("startCamera")}
            </Button>
          </div>
        )}

        {phase !== "idle" && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/40 px-8 text-center">
                <Camera className="h-8 w-8 text-background/60" />
                <p className="max-w-xs text-xs text-background/70 text-pretty">
                  {t("cameraError")}
                </p>
              </div>
            )}

            {/* Scan frame overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-64 w-64">
                {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map(
                  (pos, i) => (
                    <span
                      key={i}
                      className={`absolute h-8 w-8 border-primary ${pos} ${
                        pos.includes("top") ? "border-t-2" : "border-b-2"
                      } ${pos.includes("left") ? "border-l-2" : "border-r-2"} rounded-sm`}
                    />
                  ),
                )}
                {phase === "scanning" && (
                  <div className="absolute inset-x-0 top-0 h-0.5 animate-[scanline_1.4s_ease-in-out_infinite] bg-primary shadow-[0_0_12px_2px] shadow-primary" />
                )}
              </div>
            </div>

            {/* Scanning label */}
            {phase === "scanning" && (
              <div className="absolute inset-x-0 bottom-28 flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-foreground/70 px-4 py-2 text-sm text-background">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {angles.length > 0 ? t("merging") : t("scanning")}
                </div>
              </div>
            )}

            {angles.length > 0 && phase !== "scanning" && (
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-foreground/70 px-3 py-1.5 text-xs text-background">
                <Layers className="h-3.5 w-3.5 text-primary" />
                {t("anglesCaptured", { n: angles.length })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Results sheet */}
      {phase === "results" && (
        <div className="max-h-[45%] overflow-y-auto rounded-t-3xl bg-background px-4 pb-6 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("detected")}</h3>
          </div>
          <ul className="mb-4 space-y-2">
            {merged.map((g) => (
              <li
                key={g.def.name}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium">
                  <span className="text-xl">{g.def.emoji}</span>
                  {lang === "id" ? g.def.nameId : g.def.name}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-semibold tabular-nums">
                  {g.count}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={captureAngle}>
              <Layers className="mr-1.5 h-4 w-4" />
              {t("addAngle")}
            </Button>
            <Button className="flex-1" onClick={save}>
              <Check className="mr-1.5 h-4 w-4" />
              {t("saveToCatalog")}
            </Button>
          </div>
          <button
            onClick={reset}
            className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("rescan")}
          </button>
        </div>
      )}

      {/* Capture button */}
      {(phase === "camera" || phase === "scanning") && (
        <div className="flex items-center justify-center py-8">
          <button
            onClick={captureAngle}
            disabled={phase === "scanning"}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-background p-1.5 disabled:opacity-50"
            aria-label={t("capture")}
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-primary">
              <Camera className="h-7 w-7 text-primary-foreground" />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { useInventory } from '@/contexts/inventory-context'
import type { InventoryItem } from '@/lib/kemas/types'
import { analyzeItemTrend, forecastDepletion, detectSeasonality } from '@/lib/kemas/analytics'
import { predictStockDepletion } from '@/app/actions/ai-reasoning'
import { PremiumLockBadge, PremiumPaymentButton } from './premium-payment-button'

export function PredictiveAnalytics({ item }: { item: InventoryItem }) {
  const { lang } = useInventory()
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const t = {
    id: { title: 'Analitik Prediktif', analyze: 'Analisis', depletion: 'Penurunan Stok', days: 'hari', urgency: 'Urgensi', confidence: 'Kepercayaan' },
    en: { title: 'Predictive Analytics', analyze: 'Analyze', depletion: 'Stock Depletion', days: 'days', urgency: 'Urgency', confidence: 'Confidence' },
  }[lang]

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const trend = analyzeItemTrend(item)
      const localForecast = forecastDepletion(trend, item.count)
      
      // Call AI for additional reasoning if sufficient history
      if ((item.scanHistory?.length ?? 0) >= 2) {
        const aiForecast = await predictStockDepletion(
          lang === 'id' ? item.nameId : item.name,
          item.scanHistory?.map((h) => h.count) || [item.count],
          item.scanHistory?.map((h) => h.timestamp) || [Date.now()],
        )
        
        setForecast({
          local: localForecast,
          ai: aiForecast,
          seasonality: detectSeasonality(trend),
        })
      } else {
        setForecast({ local: localForecast, ai: null, seasonality: null })
      }
    } catch (err) {
      console.error('[v0] forecast error:', err)
    } finally {
      setLoading(false)
    }
  }

  const urgencyColor = {
    critical: 'bg-destructive text-destructive-foreground',
    warning: 'bg-yellow-500 text-white',
    normal: 'bg-green-500 text-white',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-border">
            {lang === 'id' ? '📊' : '📊'} {t.analyze}
          </Button>
          <PremiumLockBadge compact />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t.title}
            <PremiumLockBadge compact />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 flex-shrink-0">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {lang === 'id' ? 'Fitur Premium' : 'Premium Feature'}
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  {lang === 'id'
                    ? 'Akses analitik prediktif AI dan peringatan penurunan stok otomatis'
                    : 'Access AI-powered predictive analytics and automatic stock depletion alerts'}
                </p>
              </div>
            </div>
          </div>

          <PremiumPaymentButton variant="default" className="w-full" showPrice />

          <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            {t.analyze}
          </Button>

          {forecast && (
            <div className="space-y-3">
              {forecast.local && (
                <Card className="border-border bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{lang === 'id' ? 'Prediksi Lokal' : 'Local Forecast'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.urgency}</span>
                      <Badge className={urgencyColor[forecast.local.urgency]}>
                        {forecast.local.urgency}
                      </Badge>
                    </div>
                    {forecast.local.daysUntilEmpty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.depletion}</span>
                        <span className="font-semibold">{forecast.local.daysUntilEmpty} {t.days}</span>
                      </div>
                    )}
                    {forecast.local.recommendedReorderQty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{lang === 'id' ? 'Qty Pesan' : 'Reorder Qty'}</span>
                        <span className="font-semibold">{forecast.local.recommendedReorderQty}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {forecast.ai && (
                <Card className="border-border bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{lang === 'id' ? 'Prediksi AI' : 'AI Forecast'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.confidence}</span>
                      <Badge variant="outline">{forecast.ai.confidence}</Badge>
                    </div>
                    {forecast.ai.daysUntilEmpty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{lang === 'id' ? 'Penurunan dalam' : 'Depletes in'}</span>
                        <span className="font-semibold">{forecast.ai.daysUntilEmpty} {t.days}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{forecast.ai.reason}</p>
                  </CardContent>
                </Card>
              )}

              {forecast.seasonality && (
                <Card className="border-border bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm">
                      <strong>{lang === 'id' ? 'Pola:' : 'Pattern:'}</strong> {forecast.seasonality}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

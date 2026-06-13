import type { InventoryItem } from '@/lib/kemas/types'

export interface ItemTrend {
  itemId: string
  itemName: string
  timestamps: number[]
  counts: number[]
  velocityPerDay: number
  trend: 'rising' | 'stable' | 'declining'
  anomalies: { timestamp: number; count: number; severity: 'low' | 'high' }[]
}

export interface StockForecast {
  itemId: string
  itemName: string
  estimatedDepletionDate: string | null
  daysUntilEmpty: number | null
  recommendedReorderQty: number | null
  urgency: 'critical' | 'warning' | 'normal'
}

// Simulate time-series analysis (in production, integrate with ML backend)
export function analyzeItemTrend(
  item: InventoryItem & { scanHistory?: Array<{ timestamp: number; count: number }> },
): ItemTrend {
  const history = item.scanHistory || []
  if (history.length < 2) {
    return {
      itemId: item.id,
      itemName: item.name,
      timestamps: [],
      counts: [],
      velocityPerDay: 0,
      trend: 'stable',
      anomalies: [],
    }
  }

  const timestamps = history.map((h) => h.timestamp)
  const counts = history.map((h) => h.count)

  // Calculate velocity (change per day)
  const timeRange = (timestamps[timestamps.length - 1] - timestamps[0]) / 86400000
  const countChange = counts[counts.length - 1] - counts[0]
  const velocityPerDay = timeRange > 0 ? countChange / timeRange : 0

  // Detect trend
  const avgFirst = counts.slice(0, Math.floor(counts.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(counts.length / 2)
  const avgLast = counts.slice(Math.ceil(counts.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(counts.length / 2)
  const trend =
    avgLast > avgFirst * 1.1 ? 'rising' : avgLast < avgFirst * 0.9 ? 'declining' : 'stable'

  // Detect anomalies (sudden spikes/drops)
  const anomalies = []
  for (let i = 1; i < counts.length; i++) {
    const change = Math.abs(counts[i] - counts[i - 1])
    const avgChange = counts.reduce((a, b, idx) => {
      if (idx > 0) return a + Math.abs(counts[idx] - counts[idx - 1])
      return a
    }, 0) / (counts.length - 1)
    if (change > avgChange * 2) {
      anomalies.push({
        timestamp: timestamps[i],
        count: counts[i],
        severity: change > avgChange * 3 ? 'high' : 'low',
      })
    }
  }

  return {
    itemId: item.id,
    itemName: item.name,
    timestamps,
    counts,
    velocityPerDay,
    trend,
    anomalies,
  }
}

// Forecast stock depletion based on historical patterns
export function forecastDepletion(trend: ItemTrend, currentCount: number): StockForecast {
  const itemId = trend.itemId
  const itemName = trend.itemName

  if (trend.trend === 'rising' || trend.velocityPerDay > 0) {
    // Stock increasing
    return {
      itemId,
      itemName,
      estimatedDepletionDate: null,
      daysUntilEmpty: null,
      recommendedReorderQty: null,
      urgency: 'normal',
    }
  }

  if (trend.trend === 'declining' && trend.velocityPerDay < 0) {
    const daysUntilEmpty = currentCount / Math.abs(trend.velocityPerDay)
    const urgency =
      daysUntilEmpty < 7
        ? 'critical'
        : daysUntilEmpty < 21
          ? 'warning'
          : 'normal'
    const recommendedReorderQty = daysUntilEmpty < 14 ? Math.ceil(currentCount * 1.5) : null

    return {
      itemId,
      itemName,
      estimatedDepletionDate:
        daysUntilEmpty > 0
          ? new Date(Date.now() + daysUntilEmpty * 86400000).toISOString()
          : null,
      daysUntilEmpty: daysUntilEmpty > 0 ? Math.ceil(daysUntilEmpty) : 0,
      recommendedReorderQty,
      urgency,
    }
  }

  return {
    itemId,
    itemName,
    estimatedDepletionDate: null,
    daysUntilEmpty: null,
    recommendedReorderQty: null,
    urgency: 'normal',
  }
}

// Detect seasonal patterns
export function detectSeasonality(trend: ItemTrend): string | null {
  if (trend.timestamps.length < 7) return null

  const dayOfWeekCounts: Map<number, number[]> = new Map()
  trend.timestamps.forEach((ts, i) => {
    const date = new Date(ts)
    const dayOfWeek = date.getDay()
    if (!dayOfWeekCounts.has(dayOfWeek)) dayOfWeekCounts.set(dayOfWeek, [])
    dayOfWeekCounts.get(dayOfWeek)!.push(trend.counts[i])
  })

  let maxDayAvg = 0
  let peakDay = -1
  dayOfWeekCounts.forEach((counts, day) => {
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    if (avg > maxDayAvg) {
      maxDayAvg = avg
      peakDay = day
    }
  })

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return peakDay >= 0 ? `Peak on ${days[peakDay]}` : null
}

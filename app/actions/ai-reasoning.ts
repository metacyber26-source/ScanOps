'use server'

// Agentic categorization: reason like a store manager
export async function reasonItemCategories(items: Array<{ name: string; count: number }>) {
  if (items.length === 0) return []

  try {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/ai-reasoning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'categorize',
        payload: { items },
      }),
    })

    if (!res.ok) throw new Error('Categorization failed')
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('[v0] categorization error:', err)
    return []
  }
}

// Predictive stock depletion: time-series forecasting
export async function predictStockDepletion(
  itemName: string,
  historicalCounts: number[],
  timestamps: number[],
) {
  if (historicalCounts.length < 2) {
    return {
      depletionDate: null,
      daysUntilEmpty: null,
      confidence: 'low',
      reason: 'Insufficient data',
    }
  }

  try {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/ai-reasoning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'forecast',
        payload: { itemName, counts: historicalCounts, timestamps },
      }),
    })

    if (!res.ok) throw new Error('Forecast failed')
    const result = await res.json()
    const forecast = result.data

    return {
      depletionDate: forecast.daysUntilEmpty
        ? new Date(Date.now() + forecast.daysUntilEmpty * 86400000).toISOString()
        : null,
      daysUntilEmpty: forecast.daysUntilEmpty,
      confidence: forecast.confidence,
      reason: forecast.reason,
    }
  } catch (err) {
    console.error('[v0] forecast error:', err)
    return {
      depletionDate: null,
      daysUntilEmpty: null,
      confidence: 'low',
      reason: 'Error processing forecast',
    }
  }
}

// Auto-labeling: generate professional product metadata
export async function generateProductMetadata(
  itemName: string,
  category: string,
  voiceNote?: string,
) {
  try {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/ai-reasoning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'label',
        payload: { itemName, category, voiceNote },
      }),
    })

    if (!res.ok) throw new Error('Labeling failed')
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('[v0] labeling error:', err)
    return {
      title: itemName,
      description: category,
      tags: [],
      searchKeywords: itemName,
    }
  }
}

// Cross-modal search: understand vague, conceptual queries
export async function searchByDescription(
  query: string,
  availableItems: Array<{ name: string; category: string; voiceNotes?: string[] }>,
) {
  if (availableItems.length === 0) return []

  try {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/ai-reasoning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'search',
        payload: { query, items: availableItems },
      }),
    })

    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('[v0] search error:', err)
    return []
  }
}

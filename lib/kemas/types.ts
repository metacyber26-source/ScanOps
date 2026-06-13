export type StockStatus = "ok" | "low" | "out"

export interface InventoryItem {
  id: string
  name: string
  nameId: string // Indonesian name
  category: string
  categoryId: string // Indonesian category
  emoji: string
  count: number
  threshold: number // low-stock threshold
  location: string
  description: string
  voiceNote?: string // transcription text
  createdAt: number
  updatedAt: number
  // AI metadata
  aiTitle?: string // auto-generated professional product name
  aiDescription?: string // auto-generated e-commerce description
  aiTags?: string[] // auto-generated tags
  scanHistory?: Array<{ timestamp: number; count: number }> // for analytics
}

export interface AlertState {
  dismissed: string[] // item ids dismissed
  snoozedUntil: Record<string, number> // item id -> timestamp
}

export function statusOf(item: InventoryItem): StockStatus {
  if (item.count <= 0) return "out"
  if (item.count <= item.threshold) return "low"
  return "ok"
}

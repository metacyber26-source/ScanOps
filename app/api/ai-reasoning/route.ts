import { generateText, Output } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json()

    if (action === 'categorize') {
      const result = await generateText({
        model: 'openai/gpt-4o-mini',
        system: `You are an expert retail store manager and inventory analyst. 
You reason about items logically, considering real-world utility, market trends, MSME profitability, and customer behavior.
Create context-aware micro-categories that group items by utility and business logic.
Be specific and actionable for small businesses.`,
        prompt: `Analyze these scanned items and propose 3-5 strategic micro-categories:

${payload.items.map((i: any) => `- ${i.name} (qty: ${i.count})`).join('\n')}

Return only the category names as a JSON array.`,
        output: Output.object({
          schema: z.object({
            categories: z.array(z.string()),
          }),
        }),
      })
      return Response.json({ success: true, data: result.output.categories })
    }

    if (action === 'forecast') {
      const { itemName, counts, timestamps } = payload
      if (counts.length < 2) {
        return Response.json({
          success: true,
          data: {
            daysUntilEmpty: null,
            confidence: 'low',
            reason: 'Insufficient history',
          },
        })
      }

      const history = counts.map((c: number, i: number) => `Day ${i}: ${c} units`).join(', ')
      const result = await generateText({
        model: 'openai/gpt-4o-mini',
        system: `You are a demand forecasting specialist for micro-MSMEs.
Analyze item depletion patterns and predict stock depletion.
Be conservative but realistic.`,
        prompt: `Stock history for "${itemName}": ${history}

Predict: (1) days until depletion, (2) confidence, (3) reason.
Return JSON: { daysUntilEmpty: number | null, confidence: "low" | "medium" | "high", reason: string }`,
        output: Output.object({
          schema: z.object({
            daysUntilEmpty: z.number().nullable(),
            confidence: z.enum(['low', 'medium', 'high']),
            reason: z.string(),
          }),
        }),
      })
      return Response.json({ success: true, data: result.output })
    }

    if (action === 'label') {
      const { itemName, category, voiceNote } = payload
      const context = voiceNote ? `Voice note: "${voiceNote}"` : 'No additional notes'

      const result = await generateText({
        model: 'openai/gpt-4o-mini',
        system: `You are a professional product catalog specialist.
Generate e-commerce-ready product metadata.
Write for Indonesian and international markets.
Keep descriptions under 150 characters.`,
        prompt: `Generate metadata for:
Item: ${itemName}
Category: ${category}
${context}

Return JSON: { 
  title: "professional product name", 
  description: "compelling description",
  tags: ["tag1", "tag2", "tag3"],
  searchKeywords: "keyword1, keyword2, keyword3"
}`,
        output: Output.object({
          schema: z.object({
            title: z.string(),
            description: z.string(),
            tags: z.array(z.string()),
            searchKeywords: z.string(),
          }),
        }),
      })
      return Response.json({ success: true, data: result.output })
    }

    if (action === 'search') {
      const { query, items } = payload
      if (items.length === 0) {
        return Response.json({ success: true, data: [] })
      }

      const itemsList = items
        .map((i: any) => `- ${i.name} [${i.category}]${i.voiceNotes ? ` (notes: ${i.voiceNotes.join(', ')})` : ''}`)
        .join('\n')

      const result = await generateText({
        model: 'openai/gpt-4o-mini',
        system: `You are an inventory search assistant.
Understand vague conceptual queries and match to real items.
Consider functionality, appearance, and use-case.`,
        prompt: `User searches for: "${query}"

Available items:
${itemsList}

Return JSON array of matching item names (best matches first).
Example: ["Item A", "Item B"]
Return empty array [] if no good matches.`,
        output: Output.object({
          schema: z.object({
            matches: z.array(z.string()),
          }),
        }),
      })
      return Response.json({ success: true, data: result.output.matches })
    }

    return Response.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] AI reasoning error:', error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

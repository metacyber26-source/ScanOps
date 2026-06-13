'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lightbulb } from 'lucide-react'
import { useInventory } from '@/contexts/inventory-context'
import { reasonItemCategories } from '@/app/actions/ai-reasoning'
import { PremiumLockBadge, PremiumPaymentButton } from './premium-payment-button'

export function AgenticCategorization() {
  const { items, lang } = useInventory()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [reasoning, setReasoning] = useState('')
  const [open, setOpen] = useState(false)

  const t = {
    id: { title: 'Kategorisasi Agen', reason: 'Analisis Agen', desc: 'AI menalar item seperti manajer toko untuk membuat kategori kontekstual' },
    en: { title: 'Agentic Categorization', reason: 'Agent Reasoning', desc: 'AI reasons about items like a store manager to create context-aware categories' },
  }[lang]

  const handleReason = async () => {
    setLoading(true)
    try {
      const itemList = items.slice(0, 10).map((i) => ({
        name: lang === 'id' ? i.nameId : i.name,
        count: i.count,
      }))

      if (itemList.length === 0) {
        setReasoning(lang === 'id' ? 'Tidak ada item untuk dianalisis' : 'No items to analyze')
        return
      }

      const result = await reasonItemCategories(itemList)
      setCategories(result)
      setReasoning(
        lang === 'id'
          ? `Dianalisis ${itemList.length} item secara strategis`
          : `Analyzed ${itemList.length} items strategically`,
      )
    } catch (err) {
      console.error('[v0] categorization error:', err)
      setReasoning(lang === 'id' ? 'Gagal memproses' : 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border gap-2">
            <Lightbulb className="h-4 w-4" />
            {lang === 'id' ? 'Kategori Agen' : 'Agent'}
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
        <Card className="border-border bg-muted/30 mb-4">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 flex-shrink-0">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                {lang === 'id' ? 'Fitur Premium' : 'Premium Feature'}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {lang === 'id'
                  ? 'Analisis cerdas berbasis AGI dengan penalaran strategis untuk kategori produk'
                  : 'Smart AGI-powered analysis with strategic reasoning for product categories'}
              </p>
            </div>
          </div>
        </div>

        <PremiumPaymentButton variant="default" className="w-full mb-4" showPrice />

        <div className="space-y-4">
          <Button onClick={handleReason} disabled={loading} className="w-full bg-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
            {t.reason}
          </Button>

          {categories.length > 0 && (
            <div className="space-y-3">
              <Card className="border-border bg-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{lang === 'id' ? 'Kategori Diusulkan' : 'Suggested Categories'}</CardTitle>
                  <CardDescription className="text-xs">{reasoning}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((cat, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg bg-accent/20 border border-accent/50"
                      >
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-medium">{cat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                {lang === 'id' ? 'Terapkan secara manual di item details' : 'Apply manually in item details'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

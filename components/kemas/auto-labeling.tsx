'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wand2, Copy, Check } from 'lucide-react'
import { useInventory } from '@/contexts/inventory-context'
import type { InventoryItem } from '@/lib/kemas/types'
import { generateProductMetadata } from '@/app/actions/ai-reasoning'
import { PremiumLockBadge, PremiumPaymentButton } from './premium-payment-button'

export function AutoLabeling({ item }: { item: InventoryItem }) {
  const { lang, updateItem } = useInventory()
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const t = {
    id: { title: 'Auto-Label AI', generate: 'Generate', title: 'Judul Produk', desc: 'Deskripsi', tags: 'Tag', apply: 'Terapkan' },
    en: { title: 'AI Auto-Labeling', generate: 'Generate', title: 'Product Title', desc: 'Description', tags: 'Tags', apply: 'Apply' },
  }[lang]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const name = lang === 'id' ? item.nameId : item.name
      const category = lang === 'id' ? item.categoryId : item.category
      const meta = await generateProductMetadata(name, category, item.voiceNote)
      setMetadata(meta)
    } catch (err) {
      console.error('[v0] labeling error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    updateItem(item.id, {
      aiTitle: metadata.title,
      aiDescription: metadata.description,
      aiTags: metadata.tags,
    })
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1500)
  }

  const handleCopy = () => {
    const text = `
${metadata.title}
${metadata.description}

Tags: ${metadata.tags.join(', ')}
Keywords: ${metadata.searchKeywords}
    `.trim()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-border">
            <Wand2 className="h-4 w-4 mr-2" />
            {lang === 'id' ? 'Label' : 'Label'}
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

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 flex-shrink-0">
              <Wand2 className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                {lang === 'id' ? 'Fitur Premium' : 'Premium Feature'}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {lang === 'id'
                  ? 'Hasilkan metadata profesional untuk marketplace dengan AI'
                  : 'Generate professional marketplace metadata automatically with AI'}
              </p>
            </div>
          </div>
        </div>

        <PremiumPaymentButton variant="default" className="w-full mb-4" showPrice />

        <div className="space-y-4">
          <Button onClick={handleGenerate} disabled={loading} className="w-full bg-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
            {t.generate}
          </Button>

          {metadata && (
            <Card className="border-border bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.title}</p>
                  <p className="text-sm font-medium">{metadata.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.desc}</p>
                  <p className="text-sm">{metadata.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.tags}</p>
                  <div className="flex flex-wrap gap-1">
                    {metadata.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {lang === 'id' ? 'Keyword SEO' : 'SEO Keywords'}
                  </p>
                  <p className="text-xs text-muted-foreground">{metadata.searchKeywords}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleCopy} variant="outline" className="flex-1">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" onClick={handleApply} className="flex-1 bg-primary text-primary-foreground">
                    {t.apply}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useInventory } from '@/contexts/inventory-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Wand2 } from 'lucide-react'
import { searchByDescription } from '@/app/actions/ai-reasoning'

export function CrossModalSearch() {
  const { items, lang } = useInventory()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const t = {
    id: { title: 'Pencarian AI', placeholder: 'Cari dengan deskripsi vague...', button: 'Cari' },
    en: { title: 'AI Search', placeholder: 'Search with vague description...', button: 'Search' },
  }[lang]

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const matches = await searchByDescription(query, items.map((i) => ({
        name: lang === 'id' ? i.nameId : i.name,
        category: lang === 'id' ? i.categoryId : i.category,
        voiceNotes: i.voiceNote ? [i.voiceNote] : [],
      })))
      setResults(matches)
    } catch (err) {
      console.error('[v0] search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>
          {lang === 'id' ? 'Deskripsi konsep atau cari vague...' : 'Describe conceptually or search vaguely...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder={t.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
            className="border-input"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.button}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {lang === 'id' ? 'Hasil:' : 'Results:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {results.map((name) => (
                <span key={name} className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

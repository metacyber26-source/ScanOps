'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Crown } from 'lucide-react'
import { usePiAuth } from '@/contexts/pi-auth-context'
import { PRODUCT_CONFIG } from '@/lib/product-config'
import type { Product } from '@/lib/sdklite-types'

interface PremiumPaymentButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  showIcon?: boolean
  showPrice?: boolean
  className?: string
  onSuccess?: () => void
  compact?: boolean
}

export function PremiumPaymentButton({
  variant = 'default',
  size = 'default',
  showIcon = true,
  showPrice = true,
  className = '',
  onSuccess,
  compact = false,
}: PremiumPaymentButtonProps) {
  const { sdk, products } = usePiAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const product = products?.find(p => p.id === PRODUCT_CONFIG.PRODUCT_6a2caa86c8a7363408646bf9)

  if (!product) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <Lock className="h-4 w-4 mr-2" />}
        {compact ? 'Premium' : 'Loading...'}
      </Button>
    )
  }

  const handlePremiumPayment = async () => {
    if (!sdk) {
      setError('SDK not initialized')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await sdk.makePurchase(product.slug)

      if (result.ok) {
        console.log('[v0] Purchase successful:', result)
        onSuccess?.()
        setError(null)
      } else {
        throw new Error('Purchase failed')
      }
    } catch (err: any) {
      const errorCode = err?.code
      const errorMessage =
        errorCode === 'product_not_found'
          ? 'Product not found'
          : errorCode === 'purchase_cancelled'
            ? 'Purchase cancelled'
            : errorCode === 'purchase_error'
              ? 'Purchase error occurred'
              : err instanceof Error
                ? err.message
                : 'Unknown error'
      setError(errorMessage)
      console.error('[v0] Purchase error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handlePremiumPayment}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : showIcon ? (
          <Crown className="h-4 w-4 mr-2" />
        ) : null}
        {compact
          ? `Premium ${showPrice ? `(${product.price_in_pi}π)` : ''}`
          : `Go Premium ${showPrice ? `(${product.price_in_pi}π)` : ''}`}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export function PremiumLockBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-amber-600 bg-amber-500/10 px-2 py-1 rounded`}>
      <Lock className="h-3 w-3" />
      <span>{compact ? 'Premium' : 'Premium Feature'}</span>
    </div>
  )
}

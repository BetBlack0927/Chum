'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORY_META, VALID_CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All'     },
  { value: 'prompts', label: 'Prompts' },
  { value: 'packs',   label: 'Packs'   },
]

export function ShopFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, start]    = useTransition()

  const type     = searchParams.get('type')     ?? 'all'
  const category = searchParams.get('category') ?? 'all'
  const query    = searchParams.get('q')        ?? ''

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    start(() => router.replace(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  const categoryOptions = VALID_CATEGORIES.filter((c) => c !== 'random')

  return (
    <div className="flex flex-col gap-3">
      {/* Type toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam('type', opt.value)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
              type === opt.value
                ? 'bg-brand text-white shadow'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/6 border border-white/8">
        <Search size={15} className="text-white/30 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => updateParam('q', e.target.value)}
          placeholder="Search prompts and packs..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
        {query && (
          <button onClick={() => updateParam('q', '')} className="text-white/30 hover:text-white/60">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category chips — only show for prompts or all */}
      {type !== 'packs' && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => updateParam('category', 'all')}
            className={cn(
              'flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
              category === 'all'
                ? 'border-brand/50 bg-brand/15 text-brand-light'
                : 'border-white/10 text-white/40 hover:text-white/60'
            )}
          >
            All
          </button>
          {categoryOptions.map((cat) => {
            const meta = CATEGORY_META[cat]
            const isActive = category === cat
            return (
              <button
                key={cat}
                onClick={() => updateParam('category', cat)}
                className={cn(
                  'flex-none flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-brand/50 bg-brand/15 text-brand-light'
                    : 'border-white/10 text-white/40 hover:text-white/60'
                )}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

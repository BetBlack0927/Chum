'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback, useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORY_META, VALID_CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All'     },
  { value: 'prompts', label: 'Prompts' },
  { value: 'packs',   label: 'Packs'   },
]

const SEARCH_DEBOUNCE_MS = 350

export function ShopFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, start]    = useTransition()

  const urlQ = searchParams.get('q') ?? ''

  const type     = searchParams.get('type')     ?? 'all'
  const category = searchParams.get('category') ?? 'all'

  /** Local draft so typing never waits on navigation / RSC — URL updates are debounced */
  const [inputValue, setInputValue] = useState(urlQ)
  const inputRef = useRef<HTMLInputElement>(null)
  const spRef = useRef(searchParams)
  spRef.current = searchParams

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDebounce = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
  }, [])

  const replaceUrl = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString()
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
    },
    [pathname, router, start],
  )

  /** Push current draft query into the URL (used debounced + when changing other filters) */
  const commitSearchToUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(spRef.current.toString())
      params.delete('tab')
      const trimmed = q.trim()
      if (trimmed === '') params.delete('q')
      else params.set('q', q)
      replaceUrl(params)
    },
    [replaceUrl],
  )

  // Browser back/forward or external URL change: sync draft when the field isn't focused
  useEffect(() => {
    if (document.activeElement === inputRef.current) return
    setInputValue(urlQ)
  }, [urlQ])

  useEffect(() => () => clearDebounce(), [clearDebounce])

  const onSearchChange = (value: string) => {
    setInputValue(value)
    clearDebounce()
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null
      commitSearchToUrl(value)
    }, SEARCH_DEBOUNCE_MS)
  }

  const clearSearch = () => {
    clearDebounce()
    setInputValue('')
    const params = new URLSearchParams(spRef.current.toString())
    params.delete('tab')
    params.delete('q')
    replaceUrl(params)
  }

  const updateParam = useCallback(
    (key: string, value: string) => {
      clearDebounce()
      const params = new URLSearchParams(searchParams.toString())
      // Keep whatever the user typed, even if debounce hadn't run yet
      const qDraft = inputValue.trim()
      if (qDraft) params.set('q', inputValue)
      else params.delete('q')

      params.delete('tab')
      if (value === 'all' || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      replaceUrl(params)
    },
    [clearDebounce, inputValue, replaceUrl, searchParams],
  )

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
                : 'text-white/40 hover:text-white/70',
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
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompts and packs..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
        {inputValue ? (
          <button type="button" onClick={clearSearch} className="text-white/30 hover:text-white/60">
            <X size={14} />
          </button>
        ) : null}
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
                : 'border-white/10 text-white/40 hover:text-white/60',
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
                    : 'border-white/10 text-white/40 hover:text-white/60',
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

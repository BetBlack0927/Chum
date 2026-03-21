'use client'

import { useState, useTransition } from 'react'
import { chooseNextCategory } from '@/lib/actions/rounds'
import { CATEGORY_META } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CATEGORIES = Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta }))

interface CategoryPickerProps {
  roundId: string
  groupId: string
}

export function CategoryPicker({ roundId, groupId }: CategoryPickerProps) {
  const [selected, setSelected]   = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('round_id', roundId)
      fd.set('group_id', groupId)
      fd.set('category', selected)
      const result = await chooseNextCategory(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setConfirmed(true)
      }
    })
  }

  if (confirmed) {
    const picked = CATEGORIES.find((c) => c.id === selected)
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/10 p-5 text-center slide-up">
        <p className="text-2xl mb-2">{picked?.emoji}</p>
        <p className="font-bold text-white text-base">Done! Tomorrow is all {picked?.label} 🔥</p>
        <p className="text-xs text-white/40 mt-1">The group will get a {picked?.label.toLowerCase()} prompt tomorrow</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/6 p-5 slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-gold shrink-0" />
        <div>
          <p className="font-black text-white text-base">Winner's privilege 👑</p>
          <p className="text-xs text-white/50">You get to choose tomorrow's category</p>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelected(cat.id === selected ? null : cat.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-150 active:scale-95',
              selected === cat.id
                ? 'border-gold/60 bg-gold/15 ring-2 ring-gold/25'
                : 'border-white/8 bg-surface hover:border-white/20 hover:bg-surface-2',
              // "Surprise me" gets full width
              cat.id === 'random' && 'col-span-2',
            )}
          >
            <span className="text-xl shrink-0">{cat.emoji}</span>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-bold leading-none',
                selected === cat.id ? 'text-gold' : 'text-white'
              )}>
                {cat.label}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{cat.desc}</p>
            </div>
            {selected === cat.id && (
              <CheckCircle size={14} className="text-gold ml-auto shrink-0" />
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 text-center mb-3">{error}</p>}

      <Button
        fullWidth
        variant="gold"
        size="lg"
        disabled={!selected}
        loading={isPending}
        onClick={handleSubmit}
      >
        Set Tomorrow's Vibe
      </Button>

      <p className="text-xs text-white/30 text-center mt-2">
        If you don't choose, tomorrow will be random
      </p>
    </div>
  )
}

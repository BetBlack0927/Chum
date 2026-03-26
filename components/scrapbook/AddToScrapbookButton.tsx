'use client'

import { useState, useTransition } from 'react'
import { BookMarked, Check } from 'lucide-react'
import { addToScrapbook } from '@/lib/actions/scrapbook'

interface AddToScrapbookButtonProps {
  roundId:      string
  groupId:      string
  initialSaved: boolean
}

export function AddToScrapbookButton({ roundId, groupId, initialSaved }: AddToScrapbookButtonProps) {
  const [saved, setSaved]       = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (saved) return
    startTransition(async () => {
      const result = await addToScrapbook(roundId, groupId)
      if ('success' in result || 'alreadySaved' in result) {
        setSaved(true)
      }
    })
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-gold/30 bg-gold/10 text-gold text-sm font-semibold">
        <Check size={14} />
        Saved to Scrapbook
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-white/12 bg-white/5 hover:border-gold/30 hover:bg-gold/8 hover:text-gold text-white/60 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <BookMarked size={14} />
      )}
      Add to Scrapbook
    </button>
  )
}

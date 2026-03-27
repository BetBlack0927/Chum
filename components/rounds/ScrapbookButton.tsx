'use client'

import { useState, useTransition } from 'react'
import { BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { addToScrapbook } from '@/lib/actions/scrapbook'
import { cn } from '@/lib/utils'

interface Props {
  roundId:     string
  initialSaved: boolean
}

export function ScrapbookButton({ roundId, initialSaved }: Props) {
  const [saved, setSaved]   = useState(initialSaved)
  const [isPending, start]  = useTransition()
  const [error, setError]   = useState<string | null>(null)

  function handleSave() {
    if (saved) return
    setError(null)
    start(async () => {
      const result = await addToScrapbook(roundId)
      if (result.success || result.alreadySaved) {
        setSaved(true)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleSave}
        disabled={isPending || saved}
        className={cn(
          'flex items-center gap-2 px-4 h-10 rounded-2xl border text-sm font-semibold transition-all active:scale-95',
          saved
            ? 'border-gold/30 bg-gold/10 text-gold cursor-default'
            : 'border-white/15 bg-white/5 text-white/60 hover:border-gold/30 hover:bg-gold/8 hover:text-gold'
        )}
      >
        {saved
          ? <><BookmarkCheck size={15} /> Saved to Scrapbook</>
          : isPending
            ? <><span className="w-3.5 h-3.5 border-2 border-gold/40 border-t-gold rounded-full animate-spin inline-block" /> Saving…</>
            : <><BookmarkPlus size={15} /> Save to Scrapbook</>
        }
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

'use client'

import { useState, useTransition, useEffect } from 'react'
import { Trash2, Trophy, BookOpen } from 'lucide-react'
import { removeFromScrapbook } from '@/lib/actions/scrapbook'
import { cn } from '@/lib/utils'
import type { ScrapbookEntry } from '@/types/database'

interface Props {
  entries:         ScrapbookEntry[]
  readonly?:       boolean
  /** When true, omit outer section chrome — for use inside a tab row */
  embeddedInTab?:  boolean
  /** Called after a successful remove so parent can sync tab counts */
  onEntriesUpdate?: (next: ScrapbookEntry[]) => void
}

export function ScrapbookSection({
  entries: initial,
  readonly = false,
  embeddedInTab = false,
  onEntriesUpdate,
}: Props) {
  const [entries, setEntries] = useState(initial)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  const initialKey = initial.map((e) => e.id).join(',')
  useEffect(() => {
    setEntries(initial)
  }, [initialKey, initial])

  function handleRemove(id: string) {
    setRemovingId(id)
    start(async () => {
      const result = await removeFromScrapbook(id)
      if (result.success) {
        setEntries((prev) => {
          const next = prev.filter((e) => e.id !== id)
          onEntriesUpdate?.(next)
          return next
        })
      }
      setRemovingId(null)
    })
  }

  const entryList = (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const isBeingRemoved = removingId === entry.id
        const date = new Date(entry.round_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <div
            key={entry.id}
            className={cn(
              'rounded-xl border border-white/8 bg-white/3 p-3 flex items-start gap-3 transition-opacity',
              isBeingRemoved && 'opacity-40'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
              <Trophy size={14} className="text-gold/70" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                {entry.prompt_text}
              </p>
              <p className="text-[10px] text-white/30 mt-1">{date}</p>
            </div>

            {!readonly && (
              <button
                onClick={() => handleRemove(entry.id)}
                disabled={isPending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                title="Remove from scrapbook"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )

  if (entries.length === 0) {
    if (embeddedInTab) {
      return (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-sm text-white/40">
            {readonly
              ? 'No scrapbook highlights yet'
              : 'Win a round and save the moment — your highlights will show up here.'}
          </p>
        </div>
      )
    }

    if (readonly) return null

    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} className="text-gold/60" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wide">Scrapbook</p>
        </div>
        <div className="flex flex-col items-center text-center py-4 gap-2">
          <p className="text-3xl">🏆</p>
          <p className="text-sm text-white/40 leading-relaxed">
            Win a round and save the moment — your highlights will show up here.
          </p>
        </div>
      </div>
    )
  }

  if (embeddedInTab) {
    return entryList
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={15} className="text-gold/60" />
        <p className="text-xs font-bold text-white/40 uppercase tracking-wide">Scrapbook</p>
        <span className="text-xs text-white/25">({entries.length})</span>
      </div>
      {entryList}
    </div>
  )
}

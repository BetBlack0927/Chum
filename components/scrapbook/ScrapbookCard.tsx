'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { removeScrapbookEntry } from '@/lib/actions/scrapbook'
import { formatRoundDate } from '@/lib/utils'
import type { ScrapbookEntry } from '@/types/database'

interface ScrapbookCardProps {
  entry: ScrapbookEntry
  isOwn: boolean
}

export function ScrapbookCard({ entry, isOwn }: ScrapbookCardProps) {
  const [removed, setRemoved]        = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeScrapbookEntry(entry.id)
      if ('success' in result) setRemoved(true)
    })
  }

  if (removed) return null

  const voteCount = entry.vote_count ?? 0
  const totalVotes = entry.total_votes ?? 0
  const pct = totalVotes > 0
    ? Math.round((voteCount / totalVotes) * 100)
    : null

  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base shrink-0">👑</span>
          {entry.group_name && (
            <span className="text-xs text-white/40 font-medium truncate">{entry.group_name}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-white/30 tabular-nums">
            {formatRoundDate(entry.round_date)}
          </span>
          {isOwn && (
            <button
              onClick={handleRemove}
              disabled={isPending}
              title="Remove from scrapbook"
              className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {isPending ? (
                <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
              ) : (
                <X size={11} />
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm font-semibold text-white leading-snug">{entry.prompt_text}</p>

      {pct !== null && (
        <p className="text-xs text-gold/55">
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          <span className="text-white/25"> · {pct}% of group</span>
        </p>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { getCurrentPhase, getMsUntilPhaseEnd } from '@/lib/phases'
import { cn } from '@/lib/utils'

function formatEndsIn(ms: number): string {
  if (ms <= 0) return 'soon'
  const totalM = Math.max(1, Math.ceil(ms / 60_000))
  const h = Math.floor(totalM / 60)
  const m = totalM % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export interface GroupListCardGroup {
  id: string
  name: string
  avatar_url: string | null
  member_count: number
}

interface Props {
  group:     GroupListCardGroup
  streak:    number
  promptText: string | null
}

export function GroupListCard({ group, streak, promptText }: Props) {
  const [, bump] = useState(0)
  useEffect(() => {
    const id = setInterval(() => bump((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const phase   = getCurrentPhase()
  const msLeft  = getMsUntilPhaseEnd(phase)
  const endsIn  = formatEndsIn(msLeft)
  const isVoting  = phase === 'voting'
  const isResults = phase === 'results'

  const statusMain = isVoting ? 'Voting now 🗳️' : 'Results ready 👀'
  const statusSub  = `Ends in ${endsIn} ⏳`

  const promptDisplay = promptText?.trim()
    ? promptText
    : "Open the group to see today's prompt"

  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 transition-all active:scale-[0.99] hover:bg-surface-2',
        isVoting && [
          'border-yellow-400/40 bg-gradient-to-br from-yellow-400/[0.07] via-transparent to-transparent',
          'shadow-[0_0_28px_-10px_rgba(250,204,21,0.45)]',
        ],
        isResults && [
          'border-emerald-400/40 bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-transparent',
          'shadow-[0_0_28px_-10px_rgba(52,211,153,0.35)]',
        ],
        !isVoting && !isResults && 'border-white/8 bg-surface hover:border-white/14',
      )}
    >
      <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-white/10 mt-0.5">
        {group.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center text-xl font-black text-white">
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-base leading-tight truncate">{group.name}</p>
        <p
          className={cn(
            'mt-1.5 text-sm font-medium leading-snug line-clamp-2',
            promptText?.trim() ? 'text-white/85' : 'text-white/35 italic',
          )}
        >
          {promptDisplay}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/35">
          <span className="inline-flex items-center gap-1">
            <Users size={11} className="text-white/25" />
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </span>
          <span className="text-white/15">·</span>
          <span
            className={cn(
              'font-semibold',
              isVoting && 'text-yellow-400/90',
              isResults && 'text-emerald-400/90',
            )}
          >
            {statusMain}
          </span>
          <span className="text-white/15">·</span>
          <span className="text-white/30 tabular-nums">{statusSub}</span>
          {streak > 0 && (
            <>
              <span className="text-white/15">·</span>
              <span className="font-bold text-orange-400/90">🔥 {streak}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={18} className="text-white/25 shrink-0 mt-1" />
    </Link>
  )
}

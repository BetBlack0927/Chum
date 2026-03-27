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
  group:  GroupListCardGroup
  streak: number
}

export function GroupListCard({ group, streak }: Props) {
  const [, bump] = useState(0)
  useEffect(() => {
    const id = setInterval(() => bump((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const phase       = getCurrentPhase()
  const msLeft      = getMsUntilPhaseEnd(phase)
  const endsIn      = formatEndsIn(msLeft)
  const isVoting    = phase === 'voting'
  const statusMain  = isVoting ? 'Voting now 🗳️' : 'Results ready 👀'
  const statusColor = isVoting ? 'text-amber-400/95' : 'text-emerald-400/95'

  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-white/8 bg-surface px-3 py-2.5',
        'transition-all hover:border-white/12 hover:bg-surface-2 active:scale-[0.99]',
      )}
    >
      <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden border border-white/10">
        {group.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center text-sm font-black text-white">
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm leading-tight truncate">{group.name}</p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0">
          <span className={cn('text-[11px] font-semibold', statusColor)}>{statusMain}</span>
          <span className="text-[10px] tabular-nums text-white/28">
            Ends in {endsIn} ⏳
          </span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/28">
          <span className="inline-flex items-center gap-0.5">
            <Users size={10} className="text-white/20 shrink-0" />
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </span>
          {streak > 0 && (
            <>
              <span className="text-white/12">·</span>
              <span className="font-semibold text-orange-400/80">🔥 {streak}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-white/20 shrink-0" />
    </Link>
  )
}

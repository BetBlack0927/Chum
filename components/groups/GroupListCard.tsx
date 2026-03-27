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
  group:      GroupListCardGroup
  streak:     number
  promptText: string | null
  variant?:   'featured' | 'compact'
}

export function GroupListCard({ group, streak, promptText, variant = 'compact' }: Props) {
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

  const promptDisplay = promptText?.trim()
    ? promptText
    : "Open the group to see today's prompt"

  const isFeatured = variant === 'featured'

  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        'flex items-start gap-3 rounded-2xl border transition-all active:scale-[0.99]',
        isFeatured && [
          'rounded-3xl p-5 sm:p-6 gap-4',
          'border-white/12 bg-gradient-to-br from-brand/[0.14] via-surface to-surface',
          'shadow-[0_0_48px_-16px_rgba(139,92,246,0.45)]',
          'ring-1 ring-brand/20',
          'hover:border-white/18 hover:from-brand/[0.18]',
        ],
        !isFeatured && [
          'p-3.5 gap-3',
          'border-white/[0.07] bg-white/[0.02]',
          'hover:bg-white/[0.04] hover:border-white/10',
        ],
      )}
    >
      <div
        className={cn(
          'rounded-xl shrink-0 overflow-hidden border border-white/10',
          isFeatured ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl' : 'w-11 h-11',
        )}
      >
        {group.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className={cn(
              'w-full h-full bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center font-black text-white',
              isFeatured ? 'text-2xl' : 'text-lg',
            )}
          >
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p
          className={cn(
            'text-white truncate tracking-tight',
            isFeatured ? 'text-lg sm:text-xl font-black' : 'text-sm font-bold',
          )}
        >
          {group.name}
        </p>

        <p
          className={cn(
            'mt-1.5 font-medium leading-snug line-clamp-2',
            isFeatured ? 'text-[15px] text-white/80' : 'text-xs text-white/65',
            !promptText?.trim() && 'italic text-white/35',
          )}
        >
          {promptDisplay}
        </p>

        <div className={cn('mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5', isFeatured && 'mt-3')}>
          <span className={cn('font-semibold', statusColor, isFeatured ? 'text-sm' : 'text-xs')}>
            {statusMain}
          </span>
          <span
            className={cn(
              'tabular-nums text-white/30',
              isFeatured ? 'text-xs' : 'text-[10px]',
            )}
          >
            Ends in {endsIn} ⏳
          </span>
        </div>

        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-x-1.5 text-white/25',
            isFeatured ? 'text-xs' : 'text-[10px]',
          )}
        >
          <span className="inline-flex items-center gap-1">
            <Users size={isFeatured ? 12 : 10} className="text-white/20 shrink-0" />
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </span>
          {streak > 0 && (
            <>
              <span className="text-white/15">·</span>
              <span className="font-semibold text-orange-400/75">🔥 {streak} streak</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        size={isFeatured ? 22 : 16}
        className={cn('text-white/20 shrink-0', isFeatured ? 'mt-2' : 'mt-1')}
      />
    </Link>
  )
}

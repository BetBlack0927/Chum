'use client'

import { getPhaseClasses, getPhaseEmoji, getPhaseLabel, getMsUntilPhaseEnd, type Phase } from '@/lib/phases'
import { Countdown } from '@/components/ui/Countdown'
import { LocalEndTime } from '@/components/rounds/LocalEndTime'
import { cn } from '@/lib/utils'

interface PhaseIndicatorProps {
  phase:       Phase
  votedCount:  number
  memberCount: number
  className?:  string
}

export function PhaseIndicator({ phase, votedCount, memberCount, className }: PhaseIndicatorProps) {
  const classes  = getPhaseClasses(phase)
  const emoji    = getPhaseEmoji(phase)
  const label    = getPhaseLabel(phase)
  const endsAt   = getMsUntilPhaseEnd(phase) + Date.now()

  const descriptions: Record<Phase, string> = {
    voting:  'Vote for who fits the prompt best!',
    results: 'The winner has been revealed 🎉',
  }

  return (
    <div className={cn(
      'rounded-2xl border p-4 flex flex-col gap-3',
      classes.bg,
      classes.border,
      className,
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className={cn('text-sm font-bold', classes.text)}>{label} Phase</p>
            <p className="text-xs text-white/50">{descriptions[phase]}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <Countdown
            targetTime={endsAt}
            label="ends in"
            className={cn('text-xs', classes.text)}
          />
          <LocalEndTime phase={phase} className="text-[10px] text-white/25" />
        </div>
      </div>

      {/* Progress: how many members have voted */}
      {phase === 'voting' && memberCount > 1 && (
        <div>
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Voted so far</span>
            <span>{votedCount}/{memberCount}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.min(100, (votedCount / memberCount) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

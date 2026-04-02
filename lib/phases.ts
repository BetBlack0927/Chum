export type Phase = 'voting' | 'results'

/** Local hour when voting ends (0–23). Default 20 (8pm). Set `NEXT_PUBLIC_VOTING_END_HOUR`. */
export const VOTING_END_HOUR = (() => {
  const raw = process.env.NEXT_PUBLIC_VOTING_END_HOUR
  if (raw === undefined || raw === '') return 20
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0 || n > 23) return 20
  return n
})()

/**
 * Dev override: `NEXT_PUBLIC_FORCE_PHASE=voting` or `results` to ignore the clock.
 * Remove in production builds.
 */
function devForcedPhase(): Phase | null {
  const v = process.env.NEXT_PUBLIC_FORCE_PHASE
  if (v === 'results' || v === 'voting') return v
  return null
}

// Phase boundaries in LOCAL hours (detected in the browser)
// Voting:  midnight → VOTING_END_HOUR (default 8pm)
// Results: VOTING_END_HOUR → midnight
export const PHASE_CONFIG = {
  voting:  { startHour: 0,  endHour: VOTING_END_HOUR, label: 'Voting',  emoji: '🗳️', color: 'yellow' as const },
  results: { startHour: VOTING_END_HOUR, endHour: 24, label: 'Results', emoji: '🏆', color: 'green'  as const },
} as const

export function getCurrentPhase(now: Date = new Date()): Phase {
  const forced = devForcedPhase()
  if (forced) return forced
  const hour = now.getHours() // local time — call this only in the browser
  if (hour < VOTING_END_HOUR) return 'voting'
  return 'results'
}

export function getPhaseEndTime(phase: Phase, now: Date = new Date()): Date {
  const result = new Date(now)
  if (phase === 'voting') {
    result.setHours(VOTING_END_HOUR, 0, 0, 0)
  } else {
    result.setDate(result.getDate() + 1)
    result.setHours(0, 0, 0, 0)    // local midnight
  }
  return result
}

export function getMsUntilPhaseEnd(phase: Phase, now: Date = new Date()): number {
  return getPhaseEndTime(phase, now).getTime() - now.getTime()
}

export function getPhaseLabel(phase: Phase): string {
  return PHASE_CONFIG[phase].label
}

export function getPhaseEmoji(phase: Phase): string {
  return PHASE_CONFIG[phase].emoji
}

export function getPhaseClasses(phase: Phase) {
  const map: Record<Phase, { text: string; bg: string; border: string }> = {
    voting:  {
      text:   'text-yellow-400',
      bg:     'bg-yellow-400/10',
      border: 'border-yellow-400/30',
    },
    results: {
      text:   'text-emerald-400',
      bg:     'bg-emerald-400/10',
      border: 'border-emerald-400/30',
    },
  }
  return map[phase]
}

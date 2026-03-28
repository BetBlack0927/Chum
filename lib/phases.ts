export type Phase = 'voting' | 'results'

// Phase boundaries in LOCAL hours (detected in the browser)
// Voting:  midnight (0:00) → 8pm (20:00)  — vote for who fits the prompt
// Results: 8pm    (20:00) → midnight       — see who won
export const PHASE_CONFIG = {
  voting:  { startHour: 0,  endHour: 20, label: 'Voting',  emoji: '🗳️', color: 'yellow' as const },
  results: { startHour: 20, endHour: 24, label: 'Results', emoji: '🏆', color: 'green'  as const },
} as const

export function getCurrentPhase(now: Date = new Date()): Phase {
  const hour = now.getHours()  // local time — call this only in the browser
  if (hour < 20) return 'voting'
  return 'results'
}

export function getPhaseEndTime(phase: Phase, now: Date = new Date()): Date {
  const result = new Date(now)
  if (phase === 'voting') {
    result.setHours(20, 0, 0, 0)   // local 8pm
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

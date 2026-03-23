'use client'

import { useState, useEffect } from 'react'
import { getCurrentPhase, getPhaseClasses, getPhaseEmoji, getPhaseLabel, type Phase } from '@/lib/phases'

interface PhasePillProps {
  /** 'header' = full bordered pill; 'inline' = just colored text (for group cards) */
  variant?: 'header' | 'inline'
}

export function PhasePill({ variant = 'header' }: PhasePillProps) {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    setPhase(getCurrentPhase())
  }, [])

  if (!phase) {
    return variant === 'header'
      ? <div className="w-20 h-7 rounded-full bg-white/5 animate-pulse" />
      : null
  }

  const classes = getPhaseClasses(phase)
  const emoji   = getPhaseEmoji(phase)
  const label   = getPhaseLabel(phase)

  if (variant === 'inline') {
    return (
      <span className={`text-xs font-semibold ${classes.text}`}>
        {emoji} {label}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${classes.bg} ${classes.border} ${classes.text}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  )
}

'use client'

import { getPhaseEndTime, type Phase } from '@/lib/phases'
import { useEffect, useState } from 'react'

export function LocalEndTime({ phase, className }: { phase: Phase; className?: string }) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    // Runs only in the browser — reads the user's local timezone
    const endTime = getPhaseEndTime(phase)
    setLabel(endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  }, [phase])

  if (!label) return null

  return <span className={className}>at {label}</span>
}

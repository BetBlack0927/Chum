'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/utils'

interface CountdownProps {
  targetTime: number // Unix timestamp in ms
  label?: string
  onExpire?: () => void
  className?: string
}

export function Countdown({ targetTime, label = 'ends in', onExpire, className }: CountdownProps) {
  const [ms, setMs] = useState(() => Math.max(0, targetTime - Date.now()))

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, targetTime - Date.now())
      setMs(remaining)
      if (remaining === 0) {
        onExpire?.()
      }
    }

    let id: ReturnType<typeof setInterval> | undefined
    const start = () => {
      if (id != null) return
      id = setInterval(tick, 1000)
    }
    const stop = () => {
      if (id != null) {
        clearInterval(id)
        id = undefined
      }
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else {
        tick()
        start()
      }
    }

    tick()
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [targetTime, onExpire])

  if (ms <= 0) return null

  return (
    <span className={className}>
      {label && <span className="opacity-60">{label} </span>}
      <span className="font-mono font-semibold tabular-nums">{formatCountdown(ms)}</span>
    </span>
  )
}

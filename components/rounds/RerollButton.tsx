'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { rerollPrompt } from '@/lib/actions/rounds'
import { cn } from '@/lib/utils'

type RerollState =
  | { kind: 'idle' }
  | { kind: 'confirm' }
  | { kind: 'done'; error?: string }

interface RerollButtonProps {
  roundId:       string
  groupId:       string
  isAdmin:       boolean
  hasRerolled:   boolean
  hasVotes:      boolean
}

export function RerollButton({ roundId, groupId, isAdmin, hasRerolled, hasVotes }: RerollButtonProps) {
  const router                   = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState]        = useState<RerollState>({ kind: 'idle' })

  // Non-admins see nothing
  if (!isAdmin) return null

  if (hasRerolled) {
    return (
      <p className="text-xs text-white/25 text-center">
        🎲 Reroll used today
      </p>
    )
  }

  if (hasVotes) {
    return (
      <p className="text-xs text-white/25 text-center">
        🔒 Can't reroll after voting has started
      </p>
    )
  }

  if (state.kind === 'done') {
    if (state.error) {
      return (
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs text-red-400/80">{state.error}</p>
          <button
            onClick={() => setState({ kind: 'idle' })}
            className="text-xs text-white/40 hover:text-white/70 underline"
          >
            Dismiss
          </button>
        </div>
      )
    }
    return null // success: page already refreshed
  }

  if (state.kind === 'confirm') {
    return (
      <div className="flex items-center justify-center gap-3 animate-in fade-in duration-150">
        <p className="text-xs text-white/50">Replace today's prompt?</p>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await rerollPrompt(roundId, groupId)
              if (result?.error) {
                setState({ kind: 'done', error: result.error })
              } else {
                setState({ kind: 'done' })
                router.refresh()
              }
            })
          }
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/30 text-gold',
            'hover:bg-gold/25 active:scale-95 transition-all',
            isPending && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isPending ? 'Rerolling…' : 'Yes, reroll'}
        </button>
        <button
          disabled={isPending}
          onClick={() => setState({ kind: 'idle' })}
          className="text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  // idle
  return (
    <button
      onClick={() => setState({ kind: 'confirm' })}
      className="flex items-center justify-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mx-auto group"
    >
      <span className="group-hover:rotate-180 transition-transform duration-300 inline-block">🎲</span>
      Reroll Prompt
    </button>
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, ChevronDown, ChevronUp, Store } from 'lucide-react'
import { removePromptFromGroup } from '@/lib/actions/shop'
import { CATEGORY_META } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface PromptRow {
  id:              string
  text:            string
  category:        string | null
  creatorUsername: string | null
  addedAt:         string
}

interface Props {
  groupId:  string
  prompts:  PromptRow[]
  isAdmin:  boolean
}

export function GroupCustomPrompts({ groupId, prompts: initial, isAdmin }: Props) {
  const [prompts, setPrompts]     = useState(initial)
  const [expanded, setExpanded]   = useState(false)
  const [removing, startRemove]   = useTransition()
  const [removingId, setRemoving] = useState<string | null>(null)

  async function handleRemove(promptId: string) {
    setRemoving(promptId)
    startRemove(async () => {
      const result = await removePromptFromGroup(groupId, promptId)
      if (result.success) {
        setPrompts((prev) => prev.filter((p) => p.id !== promptId))
      }
      setRemoving(null)
    })
  }

  if (prompts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <Store size={15} className="text-brand-light" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wide">Custom Prompts</p>
        </div>
        <p className="text-sm text-white/30 italic">No custom prompts added yet.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-light hover:underline"
        >
          Browse the Prompt Shop →
        </Link>
      </div>
    )
  }

  const visible = expanded ? prompts : prompts.slice(0, 4)
  const hasMore = prompts.length > 4

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store size={15} className="text-brand-light" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wide">Custom Prompts</p>
          <span className="text-xs text-white/25 font-normal">({prompts.length})</span>
        </div>
        <Link
          href="/shop"
          className="text-xs text-brand-light/60 hover:text-brand-light transition-colors"
        >
          + Add more
        </Link>
      </div>

      {/* Prompt list */}
      <div className="flex flex-col gap-2">
        {visible.map((p) => {
          const meta = p.category ? CATEGORY_META[p.category] : null
          const isBeingRemoved = removingId === p.id

          return (
            <div
              key={p.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 transition-opacity',
                isBeingRemoved && 'opacity-40'
              )}
            >
              {/* Category dot */}
              {meta && (
                <span className="text-base shrink-0 mt-0.5">{meta.emoji}</span>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 leading-snug line-clamp-2">{p.text}</p>
                {p.creatorUsername && (
                  <Link
                    href={`/creators/${p.creatorUsername}`}
                    className="text-[10px] text-white/30 hover:text-white/50 mt-0.5 block transition-colors"
                  >
                    @{p.creatorUsername}
                  </Link>
                )}
              </div>

              {/* Remove button — all members can remove (server action enforces membership) */}
              <button
                onClick={() => handleRemove(p.id)}
                disabled={removing}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                title="Remove from group"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Show more / less toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? (
            <><ChevronUp size={13} /> Show less</>
          ) : (
            <><ChevronDown size={13} /> Show {prompts.length - 4} more</>
          )}
        </button>
      )}

      <p className="text-[10px] text-white/20 mt-3">
        These prompts are used in daily rounds instead of default ones.
      </p>
    </div>
  )
}

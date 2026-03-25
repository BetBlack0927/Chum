'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, Plus, Users } from 'lucide-react'
import { toggleSavePrompt } from '@/lib/actions/shop'
import { CATEGORY_META } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { ShopPrompt } from '@/types/database'

interface PromptCardProps {
  prompt: ShopPrompt
  onAddToGroup: (prompt: ShopPrompt) => void
}

export function PromptCard({ prompt, onAddToGroup }: PromptCardProps) {
  const [saved, setSaved]   = useState(prompt.is_saved ?? false)
  const [isPending, start]  = useTransition()
  const meta = prompt.category ? CATEGORY_META[prompt.category] : null

  function handleSave() {
    start(async () => {
      const result = await toggleSavePrompt(prompt.id)
      if (!result.error) setSaved(result.saved)
    })
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4 flex flex-col gap-3">
      {/* Category badge */}
      {meta && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 self-start">
          <span>{meta.emoji}</span>
          <span>{meta.label}</span>
        </span>
      )}

      {/* Prompt text */}
      <p className="text-sm font-semibold text-white leading-snug">{prompt.text}</p>

      {/* Description */}
      {prompt.description && (
        <p className="text-xs text-white/40 leading-relaxed">{prompt.description}</p>
      )}

      {/* Footer: creator + actions */}
      <div className="flex items-center justify-between pt-1 border-t border-white/6">
        <div className="flex flex-col gap-0.5 min-w-0">
          {prompt.creator ? (
            <Link
              href={`/creators/${prompt.creator.username}`}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              @{prompt.creator.username}
            </Link>
          ) : (
            <span className="text-xs text-white/20">Daily Winner</span>
          )}
          {(prompt.add_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/25">
              <Users size={9} />
              Added to {prompt.add_count} {prompt.add_count === 1 ? 'group' : 'groups'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-xl transition-colors',
              saved
                ? 'text-brand-light bg-brand/15'
                : 'text-white/30 hover:text-white/60 hover:bg-white/6'
            )}
          >
            {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>

          <button
            onClick={() => onAddToGroup(prompt)}
            className="flex items-center gap-1 px-3 h-8 rounded-xl bg-brand/15 text-brand-light text-xs font-semibold hover:bg-brand/25 transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

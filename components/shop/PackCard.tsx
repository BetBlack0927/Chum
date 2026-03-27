'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, Layers, Plus, Users } from 'lucide-react'
import { toggleSavePack } from '@/lib/actions/shop'
import { cn } from '@/lib/utils'
import type { PromptPack } from '@/types/database'

interface PackCardProps {
  pack: PromptPack
  onAddToGroup: (pack: PromptPack) => void
}

export function PackCard({ pack, onAddToGroup }: PackCardProps) {
  const [saved, setSaved]  = useState(pack.is_saved ?? false)
  const [isPending, start] = useTransition()

  function handleSave() {
    start(async () => {
      const result = await toggleSavePack(pack.id)
      if (!result.error) setSaved(result.saved)
    })
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center">
          {pack.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Layers size={18} className="text-brand-light" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/shop/packs/${pack.id}`}
            className="font-bold text-white text-sm hover:text-brand-light transition-colors line-clamp-1"
          >
            {pack.name}
          </Link>
          <p className="text-xs text-white/40 mt-0.5">
            {pack.prompt_count ?? 0} prompt{pack.prompt_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Description */}
      {pack.description && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{pack.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/6">
        <div className="flex flex-col gap-0.5 min-w-0">
          {pack.creator ? (
            <Link
              href={`/creators/${pack.creator.username}`}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              @{pack.creator.username}
            </Link>
          ) : (
            <span className="text-xs text-white/20">Chum</span>
          )}
          {(pack.add_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/25">
              <Users size={9} />
              Added to {pack.add_count} {pack.add_count === 1 ? 'group' : 'groups'}
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
            onClick={() => onAddToGroup(pack)}
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

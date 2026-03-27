'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import { CATEGORY_META } from '@/lib/categories'
import type { ShopPrompt, PromptPack } from '@/types/database'

type SheetTarget =
  | { type: 'prompt'; item: ShopPrompt }
  | { type: 'pack';   item: PromptPack }

interface Props {
  prompts: ShopPrompt[]
  packs:   PromptPack[]
}

export function FollowingFeedStrip({ prompts, packs }: Props) {
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="flex-none w-48 rounded-2xl border border-white/8 bg-surface p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center">
                {pack.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Layers size={14} className="text-brand-light" />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/shop/packs/${pack.id}`}
                  className="text-xs font-bold text-white hover:text-brand-light transition-colors line-clamp-1"
                >
                  {pack.name}
                </Link>
                <p className="text-[10px] text-white/30">{pack.prompt_count ?? 0} prompts</p>
              </div>
            </div>
            {pack.creator && (
              <Link
                href={`/creators/${pack.creator.username}`}
                className="text-[10px] text-white/30 hover:text-white/50 truncate"
              >
                @{pack.creator.username}
              </Link>
            )}
            <button
              onClick={() => setSheetTarget({ type: 'pack', item: pack })}
              className="w-full py-1.5 rounded-lg bg-brand/15 text-brand-light text-[10px] font-bold hover:bg-brand/25 transition-colors"
            >
              + Add to Group
            </button>
          </div>
        ))}

        {prompts.map((prompt) => {
          const meta = prompt.category ? CATEGORY_META[prompt.category] : null
          return (
            <div
              key={prompt.id}
              className="flex-none w-48 rounded-2xl border border-white/8 bg-surface p-3 flex flex-col gap-2"
            >
              {meta && (
                <span className="text-[10px] text-white/30 font-semibold">
                  {meta.emoji} {meta.label}
                </span>
              )}
              <p className="text-xs font-semibold text-white leading-snug line-clamp-3">
                {prompt.text}
              </p>
              {prompt.creator && (
                <Link
                  href={`/creators/${prompt.creator.username}`}
                  className="text-[10px] text-white/30 hover:text-white/50 truncate mt-auto"
                >
                  @{prompt.creator.username}
                </Link>
              )}
              <button
                onClick={() => setSheetTarget({ type: 'prompt', item: prompt })}
                className="w-full py-1.5 rounded-lg bg-brand/15 text-brand-light text-[10px] font-bold hover:bg-brand/25 transition-colors"
              >
                + Add to Group
              </button>
            </div>
          )
        })}
      </div>

      <AddToGroupSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </>
  )
}

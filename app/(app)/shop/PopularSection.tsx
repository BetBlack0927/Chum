'use client'

import { useState } from 'react'
import { Flame } from 'lucide-react'
import { PromptCard } from '@/components/shop/PromptCard'
import { PackCard } from '@/components/shop/PackCard'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import type { ShopPrompt, PromptPack } from '@/types/database'

interface Props {
  prompts: ShopPrompt[]
  packs:   PromptPack[]
}

export function PopularSection({ prompts, packs }: Props) {
  const [sheetTarget, setSheetTarget] = useState<
    | { type: 'prompt'; item: ShopPrompt }
    | { type: 'pack';   item: PromptPack }
    | null
  >(null)

  if (prompts.length === 0 && packs.length === 0) return null

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-gold" />
          <p className="text-xs font-bold text-white/30 uppercase tracking-wide">Popular</p>
        </div>

        <div className="flex flex-col gap-3">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              onAddToGroup={(p) => setSheetTarget({ type: 'pack', item: p })}
            />
          ))}
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onAddToGroup={(p) => setSheetTarget({ type: 'prompt', item: p })}
            />
          ))}
        </div>
      </section>

      <AddToGroupSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </>
  )
}

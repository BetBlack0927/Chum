'use client'

import { useState } from 'react'
import { PromptCard } from '@/components/shop/PromptCard'
import { PackCard } from '@/components/shop/PackCard'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import type { ShopPrompt, PromptPack } from '@/types/database'

type SheetTarget =
  | { type: 'prompt'; item: ShopPrompt }
  | { type: 'pack';   item: PromptPack }

interface ShopClientProps {
  prompts: ShopPrompt[]
  packs:   PromptPack[]
  type:    string
}

export function ShopClient({ prompts, packs, type }: ShopClientProps) {
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)

  const showPrompts = type !== 'packs'
  const showPacks   = type !== 'prompts'

  const isEmpty = (showPrompts && prompts.length === 0) && (showPacks && packs.length === 0)

  return (
    <>
      <div className="flex flex-col gap-3">
        {isEmpty ? (
          <div className="flex flex-col items-center text-center py-16 gap-4">
            <div className="text-5xl">🔍</div>
            <div>
              <p className="font-bold text-white text-lg">Nothing found</p>
              <p className="text-sm text-white/40 mt-1 max-w-xs leading-relaxed">
                Try a different search or category, or be the first to create one!
              </p>
            </div>
          </div>
        ) : (
          <>
            {showPacks && packs.length > 0 && (
              <section>
                {type === 'all' && (
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">Packs</p>
                )}
                <div className="flex flex-col gap-3">
                  {packs.map((pack) => (
                    <PackCard
                      key={pack.id}
                      pack={pack}
                      onAddToGroup={(p) => setSheetTarget({ type: 'pack', item: p })}
                    />
                  ))}
                </div>
              </section>
            )}

            {showPrompts && prompts.length > 0 && (
              <section className={showPacks && packs.length > 0 ? 'mt-2' : ''}>
                {type === 'all' && (
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
                    Individual Prompts
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onAddToGroup={(p) => setSheetTarget({ type: 'prompt', item: p })}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <AddToGroupSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </>
  )
}

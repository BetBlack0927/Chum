'use client'

import { useState } from 'react'
import { PromptCard } from '@/components/shop/PromptCard'
import { PackCard } from '@/components/shop/PackCard'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import type { ShopPrompt, PromptPack } from '@/types/database'

type Tab = 'prompts' | 'packs'

type SheetTarget =
  | { type: 'prompt'; item: ShopPrompt }
  | { type: 'pack';   item: PromptPack }

interface Props {
  prompts:   ShopPrompt[]
  packs:     PromptPack[]
  userId:    string
  creatorId: string
}

export function CreatorContentClient({ prompts, packs, userId, creatorId }: Props) {
  const [tab, setTab]             = useState<Tab>('prompts')
  const [sheetTarget, setSheet]   = useState<SheetTarget | null>(null)

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
        <button
          onClick={() => setTab('prompts')}
          className={[
            'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
            tab === 'prompts' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
          ].join(' ')}
        >
          Prompts ({prompts.length})
        </button>
        <button
          onClick={() => setTab('packs')}
          className={[
            'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
            tab === 'packs' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
          ].join(' ')}
        >
          Packs ({packs.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'prompts' && (
        prompts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm text-white/40">No public prompts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prompts.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onAddToGroup={(item) => setSheet({ type: 'prompt', item })}
              />
            ))}
          </div>
        )
      )}

      {tab === 'packs' && (
        packs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm text-white/40">No public packs yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packs.map((p) => (
              <PackCard
                key={p.id}
                pack={p}
                onAddToGroup={(item) => setSheet({ type: 'pack', item })}
              />
            ))}
          </div>
        )
      )}

      <AddToGroupSheet
        target={sheetTarget}
        onClose={() => setSheet(null)}
      />
    </>
  )
}

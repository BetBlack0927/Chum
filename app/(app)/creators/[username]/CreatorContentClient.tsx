'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { PromptCard } from '@/components/shop/PromptCard'
import { PackCard } from '@/components/shop/PackCard'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import { ScrapbookSection } from '@/app/(app)/profile/ScrapbookSection'
import type { ShopPrompt, PromptPack, ScrapbookEntry } from '@/types/database'

type Tab = 'scrapbook' | 'prompts' | 'packs' | 'private'

type SheetTarget =
  | { type: 'prompt'; item: ShopPrompt }
  | { type: 'pack';   item: PromptPack }

interface Props {
  prompts:           ShopPrompt[]
  packs:             PromptPack[]
  scrapbookEntries:  ScrapbookEntry[]
  scrapbookReadonly: boolean
  /** Only passed on the owner's own profile page */
  privatePrompts?:   ShopPrompt[]
}

export function CreatorContentClient({
  prompts,
  packs,
  scrapbookEntries,
  scrapbookReadonly,
  privatePrompts,
}: Props) {
  const [tab, setTab]             = useState<Tab>('scrapbook')
  const [sheetTarget, setSheet]   = useState<SheetTarget | null>(null)
  const [liveScrapbook, setLiveScrapbook] = useState(scrapbookEntries)

  const sbKey = scrapbookEntries.map((e) => e.id).join(',')
  useEffect(() => {
    setLiveScrapbook(scrapbookEntries)
  }, [sbKey, scrapbookEntries])

  const hasPrivate = privatePrompts !== undefined

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={[
        'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-w-0',
        tab === t ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
        {tabBtn('scrapbook', `Scrapbook (${liveScrapbook.length})`)}
        {tabBtn('prompts', `Prompts (${prompts.length})`)}
        {tabBtn('packs', `Packs (${packs.length})`)}
        {hasPrivate && tabBtn('private', `🔒 Private (${privatePrompts!.length})`)}
      </div>

      {tab === 'scrapbook' && (
        <ScrapbookSection
          entries={liveScrapbook}
          readonly={scrapbookReadonly}
          embeddedInTab
          onEntriesUpdate={setLiveScrapbook}
        />
      )}

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

      {tab === 'private' && hasPrivate && (
        privatePrompts!.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-sm text-white/40">No private prompts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <Lock size={12} className="text-white/30 shrink-0" />
              <p className="text-xs text-white/30">Only visible to you — tap Add to assign to a group</p>
            </div>
            {privatePrompts!.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onAddToGroup={(item) => setSheet({ type: 'prompt', item })}
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

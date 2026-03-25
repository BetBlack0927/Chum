'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react'
import { toggleSavePack } from '@/lib/actions/shop'
import { AddToGroupSheet } from '@/components/shop/AddToGroupSheet'
import type { PackWithPrompts } from '@/types/database'

interface Props {
  pack:   PackWithPrompts
  userId: string
}

export function PackDetailClient({ pack, userId }: Props) {
  const [saved, setSaved]     = useState(pack.is_saved ?? false)
  const [sheetOpen, setSheet] = useState(false)

  async function handleSave() {
    const result = await toggleSavePack(pack.id)
    if (!result.error) setSaved(result.saved)
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 h-11 rounded-xl border border-white/10 bg-surface text-sm font-semibold transition-colors hover:border-white/20"
        >
          {saved ? (
            <><BookmarkCheck size={16} className="text-brand-light" /><span className="text-brand-light">Saved</span></>
          ) : (
            <><Bookmark size={16} className="text-white/50" /><span className="text-white/50">Save</span></>
          )}
        </button>

        <button
          onClick={() => setSheet(true)}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors"
        >
          <Plus size={16} />
          Add to Group
        </button>
      </div>

      <AddToGroupSheet
        target={sheetOpen ? { type: 'pack', item: pack } : null}
        onClose={() => setSheet(false)}
      />
    </>
  )
}

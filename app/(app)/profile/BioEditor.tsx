'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateBio } from '@/lib/actions/shop'

interface Props {
  currentBio: string | null
}

export function BioEditor({ currentBio }: Props) {
  const [editing, setEditing] = useState(false)
  const [bio, setBio]         = useState(currentBio ?? '')
  const [saved, setSaved]     = useState(currentBio ?? '')
  const [isPending, start]    = useTransition()

  function handleSave() {
    start(async () => {
      const result = await updateBio(bio)
      if (!result.error) {
        setSaved(bio)
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setBio(saved)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-white/8 bg-surface text-left hover:border-white/16 transition-colors"
      >
        <Pencil size={14} className="text-white/30 shrink-0" />
        <span className={saved ? 'text-sm text-white/60' : 'text-sm text-white/25 italic'}>
          {saved || 'Add a bio…'}
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-surface p-3 flex flex-col gap-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 160))}
        placeholder="Tell people what kind of prompts you make…"
        rows={2}
        autoFocus
        className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/25">{bio.length}/160</span>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/6 text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/20 text-brand-light hover:bg-brand/30 transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

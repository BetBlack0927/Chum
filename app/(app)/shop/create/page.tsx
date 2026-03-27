'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MessageSquare, Layers, Camera, X } from 'lucide-react'
import { createShopPrompt, createPack } from '@/lib/actions/shop'
import { TopBar } from '@/components/navigation/TopBar'
import { Button } from '@/components/ui/Button'
import { VALID_CATEGORIES, CATEGORY_META } from '@/lib/categories'

type Tab = 'prompt' | 'pack'
type Visibility = 'public' | 'private'

const CATEGORIES = VALID_CATEGORIES.filter((c) => c !== 'random')

// ─── Single prompt form ───────────────────────────────────────────────────────

function CreatePromptForm() {
  const router = useRouter()
  const [text, setText]           = useState('')
  const [category, setCategory]   = useState<string>('')
  const [description, setDesc]    = useState('')
  const [visibility, setVis]      = useState<Visibility>('public')
  const [error, setError]         = useState<string | null>(null)
  const [isPending, start]        = useTransition()

  function handleSubmit() {
    setError(null)
    start(async () => {
      const fd = new FormData()
      fd.set('text', text)
      fd.set('category', category)
      fd.set('description', description)
      fd.set('visibility', visibility)
      const result = await createShopPrompt(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/shop')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt text */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Prompt text <span className="text-red-400">*</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Most likely to..."
          rows={3}
          maxLength={200}
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand/50 resize-none leading-relaxed"
        />
        <p className="text-xs text-white/25 text-right mt-1">{text.length}/200</p>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat]
            const isActive = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={[
                  'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-brand/50 bg-brand/15 text-brand-light'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60',
                ].join(' ')}
              >
                <span className="text-lg">{meta.emoji}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Short description <span className="text-white/25">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What makes this prompt fun?"
          maxLength={120}
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand/50"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Visibility
        </label>
        <div className="flex gap-2">
          {(['public', 'private'] as Visibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVis(v)}
              className={[
                'flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors capitalize',
                visibility === v
                  ? 'border-brand/50 bg-brand/15 text-brand-light'
                  : 'border-white/10 text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {v === 'public' ? '🌐 Public' : '🔒 Private'}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/25 mt-1.5">
          {visibility === 'private' ? 'Only you can see this prompt.' : 'Anyone in the app can browse and add this prompt.'}
        </p>
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <Button fullWidth size="lg" onClick={handleSubmit} loading={isPending} disabled={!text.trim() || !category}>
        <MessageSquare size={16} />
        Publish Prompt
      </Button>
    </div>
  )
}

// ─── Pack form ────────────────────────────────────────────────────────────────

interface PackPromptRow {
  id:       number
  text:     string
  category: string
}

const COVER_MAX_BYTES = 5 * 1024 * 1024

function CreatePackForm() {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [visibility, setVis]      = useState<Visibility>('public')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverErr, setCoverErr]   = useState<string | null>(null)
  const [prompts, setPrompts]     = useState<PackPromptRow[]>([
    { id: 1, text: '', category: '' },
    { id: 2, text: '', category: '' },
  ])
  const [error, setError]         = useState<string | null>(null)
  const [isPending, start]        = useTransition()
  const nextId = prompts.length > 0 ? Math.max(...prompts.map((p) => p.id)) + 1 : 1

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  function handleCoverPick(file: File | undefined) {
    if (!file) return
    setCoverErr(null)
    if (!file.type.startsWith('image/')) {
      setCoverErr('Use JPG, PNG, or WebP.')
      return
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverErr('Image must be under 5 MB.')
      return
    }
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function removeCover() {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
    setCoverErr(null)
  }

  function addRow() {
    setPrompts((prev) => [...prev, { id: nextId, text: '', category: '' }])
  }

  function removeRow(id: number) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
  }

  function updateRow(id: number, field: 'text' | 'category', value: string) {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  function handleSubmit() {
    setError(null)
    start(async () => {
      const fd = new FormData()
      fd.set('name', name)
      fd.set('description', description)
      fd.set('visibility', visibility)
      fd.set('prompts', JSON.stringify(
        prompts.map((p) => ({ text: p.text, category: p.category }))
      ))
      if (coverFile) fd.append('cover', coverFile)
      const result = await createPack(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/shop/packs/${result.packId}`)
      }
    })
  }

  const isValid = name.trim().length >= 2 &&
    prompts.length >= 2 &&
    prompts.every((p) => p.text.trim().length >= 5 && !!p.category)

  return (
    <div className="flex flex-col gap-4">
      {/* Pack name */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Pack name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chaos Edition Vol. 1"
          maxLength={60}
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Description <span className="text-white/25">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What's the vibe of this pack?"
          maxLength={140}
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand/50"
        />
      </div>

      {/* Pack cover (optional) */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Pack cover <span className="text-white/25 font-normal normal-case">(optional)</span>
        </label>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl border border-white/10 bg-white/5 overflow-hidden shrink-0 flex items-center justify-center hover:border-brand/40 transition-colors"
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} className="text-white/25" />
            )}
          </button>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs text-white/35 leading-relaxed">
              Square-ish photos look best. Shown on your pack in the shop.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="text-xs font-semibold text-brand-light hover:text-brand-light/80"
              >
                {coverPreview ? 'Change photo' : 'Choose photo'}
              </button>
              {coverPreview && (
                <button
                  type="button"
                  onClick={removeCover}
                  className="text-xs font-semibold text-white/40 hover:text-red-400 flex items-center gap-1"
                >
                  <X size={12} />
                  Remove
                </button>
              )}
            </div>
            {coverErr && <p className="text-xs text-red-400 mt-2">{coverErr}</p>}
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            handleCoverPick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wide block mb-2">
          Visibility
        </label>
        <div className="flex gap-2">
          {(['public', 'private'] as Visibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVis(v)}
              className={[
                'flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                visibility === v
                  ? 'border-brand/50 bg-brand/15 text-brand-light'
                  : 'border-white/10 text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {v === 'public' ? '🌐 Public' : '🔒 Private'}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-white/40 uppercase tracking-wide">
            Prompts <span className="text-red-400">*</span>
            <span className="text-white/25 font-normal normal-case ml-1">({prompts.length})</span>
          </label>
        </div>

        <div className="flex flex-col gap-3">
          {prompts.map((row, idx) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-surface p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-semibold">#{idx + 1}</span>
                {prompts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <textarea
                value={row.text}
                onChange={(e) => updateRow(row.id, 'text', e.target.value)}
                placeholder="Most likely to..."
                rows={2}
                maxLength={200}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none"
              />

              {/* Category mini-picker */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat]
                  const isActive = row.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateRow(row.id, 'category', cat)}
                      className={[
                        'flex-none flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap',
                        isActive
                          ? 'border-brand/50 bg-brand/15 text-brand-light'
                          : 'border-white/10 text-white/30 hover:text-white/50',
                      ].join(' ')}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {prompts.length < 30 && (
          <button
            type="button"
            onClick={addRow}
            className="mt-3 flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <Plus size={14} />
            Add another prompt
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <Button fullWidth size="lg" onClick={handleSubmit} loading={isPending} disabled={!isValid}>
        <Layers size={16} />
        Publish Pack
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [tab, setTab] = useState<Tab>('prompt')

  return (
    <div>
      <TopBar title="Create" backHref="/shop" />

      <div className="px-4 pt-4 pb-10 flex flex-col gap-5">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
          <button
            onClick={() => setTab('prompt')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              tab === 'prompt' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            <MessageSquare size={15} />
            Single Prompt
          </button>
          <button
            onClick={() => setTab('pack')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              tab === 'pack' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            <Layers size={15} />
            Prompt Pack
          </button>
        </div>

        {tab === 'prompt' ? <CreatePromptForm /> : <CreatePackForm />}
      </div>
    </div>
  )
}

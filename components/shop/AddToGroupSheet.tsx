'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Check, Layers, CheckCircle2 } from 'lucide-react'
import { addPromptToGroups, addPackToGroups, getMyGroupsForPrompt, getMyGroups } from '@/lib/actions/shop'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ShopPrompt, PromptPack } from '@/types/database'

type GroupRow = { id: string; name: string; alreadyAdded: boolean }

type Item =
  | { type: 'prompt'; item: ShopPrompt }
  | { type: 'pack';   item: PromptPack }

interface AddToGroupSheetProps {
  target: Item | null
  onClose: () => void
}

export function AddToGroupSheet({ target, onClose }: AddToGroupSheetProps) {
  const [groups, setGroups]         = useState<GroupRow[]>([])
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [loadingGroups, setLoading] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, start]          = useTransition()

  useEffect(() => {
    if (!target) return
    setSelected(new Set())
    setSuccess(false)
    setError(null)
    setLoading(true)

    if (target.type === 'prompt') {
      getMyGroupsForPrompt(target.item.id).then((g) => {
        setGroups(g)
        setLoading(false)
      })
    } else {
      // For packs, use plain group list (partial add detection is complex)
      getMyGroups().then((g) => {
        setGroups(g.map((gr) => ({ ...gr, alreadyAdded: false })))
        setLoading(false)
      })
    }
  }, [target])

  if (!target) return null

  const { type, item } = target
  const label = type === 'prompt'
    ? `"${item.text.slice(0, 60)}${item.text.length > 60 ? '…' : ''}"`
    : (item as PromptPack).name

  function toggle(groupId: string, alreadyAdded: boolean) {
    if (alreadyAdded) return // can't select already-added groups
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(groupId) ? next.delete(groupId) : next.add(groupId)
      return next
    })
  }

  function handleAdd() {
    if (!selected.size) return
    setError(null)
    start(async () => {
      const groupIds = Array.from(selected)
      const result = type === 'prompt'
        ? await addPromptToGroups(item.id, groupIds)
        : await addPackToGroups(item.id, groupIds)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Mark newly added groups as alreadyAdded
        setGroups((prev) =>
          prev.map((g) => selected.has(g.id) ? { ...g, alreadyAdded: true } : g)
        )
        setTimeout(onClose, 1300)
      }
    })
  }

  const availableCount = groups.filter((g) => !g.alreadyAdded).length

  return (
    <>
      {/* Backdrop — z-[200] sits above the bottom nav (z-50) */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — above the nav, max 80% of screen height */}
      <div className="fixed bottom-0 left-0 right-0 z-[201] max-w-[430px] mx-auto flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <div className="bg-surface border-t border-white/10 rounded-t-3xl flex flex-col overflow-hidden">
          {/* ── Fixed header ── */}
          <div className="shrink-0 px-5 pt-4 pb-3">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-1">
                  {type === 'prompt' ? 'Add Prompt to Group' : 'Add Pack to Group'}
                </p>
                <p className="text-sm text-white/70 leading-snug line-clamp-2">{label}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Scrollable group list ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-2">
            {loadingGroups ? (
              <div className="flex flex-col gap-2 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">
                You're not in any groups yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2 py-1">
                {groups.map((g) => {
                  const isSelected    = selected.has(g.id)
                  const isDisabled    = g.alreadyAdded

                  return (
                    <button
                      key={g.id}
                      onClick={() => toggle(g.id, g.alreadyAdded)}
                      disabled={isDisabled}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors w-full',
                        isDisabled
                          ? 'border-white/6 bg-white/2 cursor-default opacity-60'
                          : isSelected
                          ? 'border-brand/50 bg-brand/10'
                          : 'border-white/8 bg-white/4 hover:border-white/16 active:scale-[0.99]'
                      )}
                    >
                      {/* Checkbox / already-added indicator */}
                      {isDisabled ? (
                        <CheckCircle2 size={18} className="text-emerald-400/70 shrink-0" />
                      ) : (
                        <div className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          isSelected ? 'border-brand bg-brand' : 'border-white/20'
                        )}>
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      )}

                      <span className="text-sm font-medium text-white flex-1 truncate">
                        {g.name}
                      </span>

                      {isDisabled && (
                        <span className="text-[10px] font-semibold text-emerald-400/60 shrink-0">
                          Added
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Pack info notice */}
            {type === 'pack' && !loadingGroups && (
              <div className="flex items-center gap-2 mt-2 mb-1 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
                <Layers size={14} className="text-brand-light shrink-0" />
                <p className="text-xs text-white/50">
                  All prompts in this pack will be added to the selected groups.
                </p>
              </div>
            )}
          </div>

          {/* ── Fixed footer ── */}
          <div
            className="shrink-0 px-5 pt-3 border-t border-white/6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {error && <p className="text-sm text-red-400 text-center mb-3">{error}</p>}

            {success ? (
              <div className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 font-semibold text-sm">
                <Check size={16} />
                Added successfully!
              </div>
            ) : availableCount === 0 && !loadingGroups && groups.length > 0 ? (
              <div className="flex items-center justify-center h-12 rounded-2xl bg-white/5 text-white/30 text-sm">
                Already added to all your groups
              </div>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={handleAdd}
                loading={isPending}
                disabled={!selected.size || loadingGroups}
              >
                Add to {selected.size > 1 ? `${selected.size} Groups` : 'Group'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { leaveGroup } from '@/lib/actions/groups'
import { LogOut } from 'lucide-react'

interface LeaveGroupButtonProps {
  groupId: string
  userId:  string
}

export function LeaveGroupButton({ groupId, userId }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, start]          = useTransition()

  function handleLeave() {
    setError(null)
    start(async () => {
      const result = await leaveGroup(groupId, userId)
      if (result?.success === false) {
        setError(result.error ?? 'Something went wrong.')
        setConfirming(false)
      } else {
        router.push('/groups')
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-white/60 text-center">
          Are you sure you want to leave this group?
        </p>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="flex-1 h-11 rounded-2xl border border-white/15 text-white/60 font-semibold text-sm hover:bg-white/6 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleLeave}
            disabled={isPending}
            className="flex-1 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {isPending ? 'Leaving…' : 'Yes, leave'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      <button
        onClick={() => setConfirming(true)}
        className="w-full h-11 rounded-2xl border border-red-500/25 bg-red-500/8 text-red-400 font-bold text-sm hover:bg-red-500/15 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Leave Group
      </button>
    </div>
  )
}

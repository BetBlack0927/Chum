'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/navigation/TopBar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { leaveGroup } from '@/lib/actions/groups'
import { LogOut, AlertTriangle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function GroupSettingsPage({ params }: Props) {
  const router = useRouter()
  const [groupId, setGroupId] = useState<string>('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Unwrap params
  useState(() => {
    params.then((p) => setGroupId(p.id))
  })

  function handleLeaveClick() {
    setShowLeaveConfirm(true)
    setError(null)
  }

  async function confirmLeave() {
    setError(null)
    startTransition(async () => {
      // Get the current user ID from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        return
      }

      const result = await leaveGroup(groupId, user.id)
      
      if (!result.success) {
        setError(result.error || 'Failed to leave group')
        setShowLeaveConfirm(false)
      } else {
        // Successfully left - redirect to groups page
        router.push('/groups')
      }
    })
  }

  return (
    <div>
      <TopBar title="Group Settings" backHref={`/groups/${groupId}`} />

      <div className="px-4 pt-6 pb-20 flex flex-col gap-6">
        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
            Danger Zone
          </h2>
          
          <Card className="bg-red-400/5 border-red-400/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm mb-1">Leave Group</h3>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">
                  You'll no longer see this group or participate in daily rounds. You can rejoin with an invite code.
                </p>
                
                {!showLeaveConfirm ? (
                  <button
                    onClick={handleLeaveClick}
                    className="px-4 py-2 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400 text-sm font-semibold hover:bg-red-400/20 transition-colors active:scale-95"
                  >
                    Leave Group
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/30">
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 font-medium">
                        Are you sure? This cannot be undone.
                      </p>
                    </div>
                    
                    {error && (
                      <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/30 text-xs text-red-400">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowLeaveConfirm(false)
                          setError(null)
                        }}
                        disabled={isPending}
                        className="flex-1 px-4 py-2 rounded-xl bg-surface border border-white/10 text-white text-sm font-semibold hover:bg-surface-2 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmLeave}
                        disabled={isPending}
                        className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 active:scale-95"
                      >
                        {isPending ? 'Leaving...' : 'Yes, Leave'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

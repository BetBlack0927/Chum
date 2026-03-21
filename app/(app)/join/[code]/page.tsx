'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinGroupByCode } from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/navigation/TopBar'
import { Card } from '@/components/ui/Card'
import { Check } from 'lucide-react'

interface Props {
  params: Promise<{ code: string }>
}

export default function JoinByLinkPage({ params }: Props) {
  const router = useRouter()
  const [code, setCode] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [error, setError] = useState<string>('')
  const [groupName, setGroupName] = useState<string>('')
  const [groupId, setGroupId] = useState<string>('')

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      const inviteCode = resolvedParams.code.trim().toUpperCase()
      setCode(inviteCode)

      if (!inviteCode || inviteCode.length !== 6) {
        setStatus('error')
        setError('Invalid invite code format.')
        return
      }

      // Check auth
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirectTo=/join/${inviteCode}`)
        return
      }

      // Attempt to join
      const result = await joinGroupByCode(inviteCode, user.id)

      if (!result.success) {
        setStatus('error')
        setError(result.error || 'Unable to join group')
      } else {
        setStatus('success')
        setGroupName(result.groupName)
        setGroupId(result.groupId)
        // Redirect after showing success message
        setTimeout(() => {
          router.push(`/groups/${result.groupId}`)
        }, 1500)
      }
    }

    init()
  }, [params, router])

  if (status === 'loading') {
    return (
      <div>
        <TopBar title="Join Group" backHref="/groups" />
        <div className="px-4 pt-8">
          <Card>
            <div className="text-center py-8">
              <div className="text-5xl mb-4">⏳</div>
              <p className="text-sm text-white/60">Joining group...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <TopBar title="Join Group" backHref="/groups" />
        <div className="px-4 pt-8">
          <Card className="bg-red-400/10 border-red-400/30">
            <div className="text-center py-8">
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-white mb-2">Unable to Join</h1>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </Card>
          <a
            href="/groups"
            className="mt-4 flex items-center justify-center h-12 rounded-2xl bg-surface border border-white/10 text-white font-semibold text-sm hover:bg-surface-2 transition-colors"
          >
            Back to Groups
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Join Group" backHref="/groups" />
      <div className="px-4 pt-8">
        <Card className="bg-emerald-400/10 border-emerald-400/30">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">You're in!</h1>
            <p className="text-sm text-white/60 mb-1">
              Welcome to <span className="font-semibold text-white">{groupName}</span>
            </p>
            <p className="text-xs text-white/40 mt-4">Redirecting...</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

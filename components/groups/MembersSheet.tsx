'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { kickMember } from '@/lib/actions/groups'
import { Avatar } from '@/components/ui/Avatar'
import { getAvatarColor, cn } from '@/lib/utils'
import { X, ShieldCheck, UserMinus } from 'lucide-react'

interface Member {
  id: string
  username: string
  avatar_color: string
  avatar_url: string | null
  role: 'admin' | 'member'
}

interface MembersSheetProps {
  groupId:    string
  members:    Member[]
  currentUserId: string
  isAdmin:    boolean
}

export function MembersSheet({ groupId, members, currentUserId, isAdmin }: MembersSheetProps) {
  const [open, setOpen] = useState(false)

  const avatarUsers = members.map((m) => ({
    username:     m.username,
    avatar_color: m.avatar_color,
    avatar_url:   m.avatar_url,
  }))

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-white/10 bg-white/4 hover:bg-white/8 hover:border-white/20 active:scale-95 transition-all group"
        aria-label="View members"
      >
        {/* Mini avatar stack */}
        <div className="flex items-center">
          {members.slice(0, 5).map((m) => (
            <div key={m.id} className="-ml-1.5 first:ml-0 ring-2 ring-app-bg rounded-full">
              <Avatar
                username={m.username}
                color={m.avatar_color || getAvatarColor(m.id)}
                url={m.avatar_url}
                size="sm"
              />
            </div>
          ))}
          {members.length > 5 && (
            <div className="-ml-1.5 ring-2 ring-app-bg rounded-full w-7 h-7 bg-surface-3 flex items-center justify-center text-white/50 font-semibold text-[10px]">
              +{members.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs text-white/60 font-medium group-hover:text-white transition-colors">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Bottom sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full max-w-[430px] bg-surface rounded-t-3xl border-t border-white/10 flex flex-col animate-in slide-in-from-bottom duration-300"
            style={{ maxHeight: '80dvh', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <div>
                <p className="font-bold text-white text-lg">Members</p>
                <p className="text-xs text-white/35 mt-0.5">{members.length} people in this group</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable member list */}
            <div className="flex flex-col gap-2 overflow-y-auto px-5 pt-1">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onKicked={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MemberRow({
  member, groupId, currentUserId, isAdmin, onKicked,
}: {
  member: Member
  groupId: string
  currentUserId: string
  isAdmin: boolean
  onKicked: () => void
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, start]          = useTransition()

  const isYou          = member.id === currentUserId
  const canKick        = isAdmin && !isYou && member.role !== 'admin'

  function handleKick() {
    setError(null)
    start(async () => {
      const result = await kickMember(groupId, member.id)
      if (result?.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        router.refresh()
        onKicked()
      }
    })
  }

  return (
    <div className={cn(
      'rounded-2xl border p-3 flex items-center gap-3 transition-colors',
      confirming ? 'border-red-500/30 bg-red-500/8' : 'border-white/8 bg-surface-2',
    )}>
      <Avatar
        username={member.username}
        color={member.avatar_color || getAvatarColor(member.id)}
        url={member.avatar_url}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-white text-sm truncate">
            @{member.username}
            {isYou && <span className="text-white/30 font-normal"> (you)</span>}
          </p>
          {member.role === 'admin' && (
            <ShieldCheck size={13} className="text-gold shrink-0" />
          )}
        </div>
        <p className={cn(
          'text-xs mt-0.5',
          member.role === 'admin' ? 'text-gold/60 font-medium' : 'text-white/30',
        )}>
          {member.role === 'admin' ? '👑 Admin' : 'Member'}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Kick controls */}
      {canKick && (
        confirming ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="text-xs text-white/40 hover:text-white/70 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleKick}
              disabled={isPending}
              className="text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isPending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label={`Remove ${member.username}`}
          >
            <UserMinus size={15} />
          </button>
        )
      )}
    </div>
  )
}

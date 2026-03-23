'use client'

import { useState, useTransition } from 'react'
import { castVote } from '@/lib/actions/votes'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Crown, CheckCircle, MessageCircle } from 'lucide-react'
import { cn, getAvatarColor } from '@/lib/utils'
import type { Profile, Vote } from '@/types/database'

const MAX_COMMENT = 80

interface VotingInterfaceProps {
  roundId:  string
  groupId:  string
  members:  Profile[]
  userId:   string
  userVote: Vote | null
}

export function VotingInterface({ roundId, groupId, members, userId, userVote }: VotingInterfaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(userVote?.nominated_user_id ?? null)
  const [comment, setComment]       = useState('')
  const [hasVoted, setHasVoted]     = useState(!!userVote)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const candidates = members.filter((m) => m.id !== userId)

  // ── Already voted ──────────────────────────────────────────────────────────
  if (hasVoted || userVote) {
    const votedFor = members.find((m) => m.id === (userVote?.nominated_user_id ?? selectedId))

    return (
      <div className="flex flex-col gap-4 slide-up">
        <Card className="text-center py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-yellow-400/15 flex items-center justify-center">
              <CheckCircle size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Vote locked in! 🗳️</p>
              {votedFor && (
                <p className="text-sm text-white/50 mt-1">
                  You voted for <span className="text-white font-semibold">@{votedFor.username}</span>
                </p>
              )}
              {(userVote?.comment || comment) && (
                <p className="text-xs text-white/30 mt-1 italic">
                  Your comment is saved anonymously 💬
                </p>
              )}
              <p className="text-xs text-white/30 mt-1">Results at 8pm UTC</p>
            </div>
          </div>
        </Card>

        <p className="text-xs font-bold text-white/30 uppercase tracking-wide">All candidates</p>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isSelected={m.id === (userVote?.nominated_user_id ?? selectedId)}
              isYou={m.id === userId}
              disabled
            />
          ))}
        </div>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-4xl mb-3">🙋</p>
        <p className="font-bold text-white text-lg">You're the only one here</p>
        <p className="text-sm text-white/40 mt-1">Invite friends so you can vote!</p>
      </Card>
    )
  }

  function handleVote() {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('round_id', roundId)
      fd.set('group_id', groupId)
      fd.set('nominated_user_id', selectedId!)
      if (comment.trim()) fd.set('comment', comment.trim())
      const result = await castVote(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setHasVoted(true)
      }
    })
  }

  const selectedMember = candidates.find((m) => m.id === selectedId)

  return (
    <div className="flex flex-col gap-3 slide-up">
      <p className="text-sm text-white/50 text-center">Tap a person, then lock in your pick</p>

      {/* Candidate list */}
      <div className="flex flex-col gap-2">
        {candidates.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            isSelected={selectedId === m.id}
            isYou={false}
            disabled={false}
            onClick={() => {
              setSelectedId(m.id === selectedId ? null : m.id)
              setComment('')
            }}
          />
        ))}
      </div>

      {/* Your own card greyed out */}
      {members.find((m) => m.id === userId) && (
        <div className="opacity-40">
          <p className="text-xs text-white/30 text-center mb-1.5">You can't vote for yourself</p>
          <MemberCard
            member={members.find((m) => m.id === userId)!}
            isSelected={false}
            isYou
            disabled
          />
        </div>
      )}

      {/* Anonymous comment — appears only when someone is selected */}
      {selectedMember && (
        <div className="rounded-2xl border border-white/10 bg-surface-2 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-white/40">
            <MessageCircle size={13} />
            <span className="text-xs font-medium">Add an anonymous comment (optional)</span>
          </div>
          <input
            type="text"
            value={comment}
            onChange={(e) => {
              if (e.target.value.length <= MAX_COMMENT) setComment(e.target.value)
            }}
            placeholder={`Why ${selectedMember.username}? 👀`}
            maxLength={MAX_COMMENT}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          {comment.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-xs text-white/25 italic">Nobody will know it was you</p>
              <span className={cn(
                'text-xs tabular-nums',
                comment.length > MAX_COMMENT * 0.85 ? 'text-yellow-400' : 'text-white/25'
              )}>
                {comment.length}/{MAX_COMMENT}
              </span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <Button
        fullWidth
        size="lg"
        onClick={handleVote}
        loading={isPending}
        disabled={!selectedId}
      >
        <Crown size={18} />
        Lock In My Vote
      </Button>
    </div>
  )
}

function MemberCard({
  member, isSelected, isYou, disabled, onClick,
}: {
  member:     Profile
  isSelected: boolean
  isYou:      boolean
  disabled:   boolean
  onClick?:   () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-2xl border p-4 transition-all duration-150 flex items-center gap-3',
        'bg-surface border-white/8',
        isSelected  && 'border-brand/60 bg-brand/10 ring-2 ring-brand/20',
        !disabled && !isSelected && 'hover:border-white/20 hover:bg-surface-2 active:scale-[0.98]',
        disabled    && 'cursor-default',
      )}
    >
      <Avatar
        username={member.username}
        color={member.avatar_color || getAvatarColor(member.id)}
        url={member.avatar_url}
        size="md"
      />
      <div className="flex-1">
        <p className="font-bold text-white">@{member.username}</p>
        {isYou && <p className="text-xs text-white/30">that's you</p>}
      </div>
      {isSelected && <Crown size={18} className="text-brand-light shrink-0" />}
    </button>
  )
}

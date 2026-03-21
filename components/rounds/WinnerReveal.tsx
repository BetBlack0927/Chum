'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { CategoryPicker } from '@/components/rounds/CategoryPicker'
import { CATEGORY_META } from '@/lib/categories'
import { getAvatarColor, cn } from '@/lib/utils'
import type { NominationResult, Profile } from '@/types/database'

interface WinnerRevealProps {
  winner:                NominationResult | null
  nominations:           NominationResult[]
  totalVotes:            number
  allComments:           { comment: string; nomineeUsername: string }[]
  revealedVoter:         Profile | null
  revealedVoterNominee:  Profile | null
  userId:                string
  roundId:               string
  groupId:               string
  nextCategory:          string | null
}

export function WinnerReveal({
  winner, nominations, totalVotes, allComments, revealedVoter, revealedVoterNominee,
  userId, roundId, groupId, nextCategory,
}: WinnerRevealProps) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 300); return () => clearTimeout(t) }, [])

  const isCurrentUserWinner = winner?.profile.id === userId
  const categoryLabel = nextCategory
    ? nextCategory.charAt(0).toUpperCase() + nextCategory.slice(1)
    : null
  const isRevealedVoterYou = revealedVoter?.id === userId

  return (
    <div className="flex flex-col gap-5 slide-up">

      {/* ── Winner card ── */}
      {winner ? (
        <div className={cn(
          'rounded-3xl border border-gold/30 bg-gold/8 p-5 transition-all duration-700',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <div className="text-center mb-5">
            <p className="text-5xl float mb-2">🏆</p>
            <p className="text-xs font-bold text-gold/70 uppercase tracking-widest">Today's Winner</p>
            {isCurrentUserWinner && (
              <p className="text-sm text-gold font-bold mt-1">The group voted for you! 🎉</p>
            )}
          </div>

          <div className="flex items-center gap-4 bg-black/20 rounded-2xl border border-white/8 p-4">
            <Avatar
              username={winner.profile.username}
              color={winner.profile.avatar_color || getAvatarColor(winner.profile.id)}
              size="xl"
            />
            <div>
              <p className="font-black text-white text-xl">@{winner.profile.username}</p>
              <p className="text-gold/80 text-sm font-semibold mt-0.5">
                {winner.vote_count} {winner.vote_count === 1 ? 'vote' : 'votes'}
                {totalVotes > 0 && (
                  <span className="text-white/30 font-normal">
                    {' '}({Math.round((winner.vote_count / totalVotes) * 100)}% of group)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center py-10">
          <p className="text-4xl mb-3">🎭</p>
          <p className="font-bold text-white text-lg">No votes yet</p>
          <p className="text-sm text-white/40 mt-1">
            {totalVotes === 0 ? 'Nobody voted today — check back tomorrow!' : 'Not enough votes to crown a winner'}
          </p>
        </Card>
      )}

      {/* ── Exposed voter ── */}
      {revealedVoter && (
        <div className={cn(
          'rounded-3xl border border-red-500/40 bg-red-500/8 p-5 transition-all duration-700 delay-300',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">👀</span>
            <p className="text-xs font-bold text-red-400/80 uppercase tracking-widest">
              Someone got exposed
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/20 rounded-2xl border border-red-500/15 p-4">
            <div className="relative">
              <Avatar
                username={revealedVoter.username}
                color={revealedVoter.avatar_color || getAvatarColor(revealedVoter.id)}
                size="xl"
              />
              <span className="absolute -top-1 -right-1 text-sm">🔥</span>
            </div>
            <div>
              <p className="font-black text-white text-xl">
                @{revealedVoter.username}
                {isRevealedVoterYou && <span className="text-red-400 text-sm font-normal ml-1">(you)</span>}
              </p>
              <p className="text-red-400/70 text-sm font-medium mt-0.5">
                Voted for{' '}
                <span className="text-white font-bold">
                  @{revealedVoterNominee?.username ?? '???'}
                </span>
              </p>
            </div>
          </div>
          <p className="text-xs text-white/25 text-center mt-3 italic">
            Everyone else stays anonymous 🤫
          </p>
        </div>
      )}

      {/* ── Anonymous reactions ── */}
      {allComments.length > 0 && (
        <div className={cn(
          'rounded-3xl border border-brand/20 bg-brand/6 p-5 transition-all duration-700 delay-500',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💬</span>
            <p className="text-xs font-bold text-brand-light/70 uppercase tracking-widest">
              Anonymous reactions
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {allComments.map((c, i) => (
              <div key={i} className="bg-black/20 rounded-xl border border-white/6 px-4 py-2.5">
                <p className="text-xs font-semibold text-white/35 mb-1">
                  about <span className="text-brand-light/70">@{c.nomineeUsername}</span>
                </p>
                <p className="text-sm text-white/70 italic leading-snug">&ldquo;{c.comment}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category picker / status ── */}
      {winner && (
        isCurrentUserWinner ? (
          nextCategory ? (
            <div className="rounded-2xl border border-brand/30 bg-brand/10 p-4 text-center">
              <p className="text-2xl mb-1">{CATEGORY_META[nextCategory]?.emoji ?? '🎯'}</p>
              <p className="font-bold text-white text-sm">
                You set tomorrow's category: <span className="text-brand-light">{categoryLabel}</span>
              </p>
              <p className="text-xs text-white/30 mt-1">The group will get a {categoryLabel?.toLowerCase()} prompt tomorrow</p>
            </div>
          ) : (
            <CategoryPicker roundId={roundId} groupId={groupId} />
          )
        ) : (
          <div className="rounded-2xl border border-white/8 bg-surface p-4 flex items-center gap-3">
            {nextCategory ? (
              <>
                <span className="text-2xl shrink-0">{CATEGORY_META[nextCategory]?.emoji ?? '🎯'}</span>
                <div>
                  <p className="text-sm font-bold text-white">
                    Tomorrow's category: <span className="text-brand-light">{categoryLabel}</span>
                  </p>
                  <p className="text-xs text-white/40">
                    @{winner.profile.username} chose the next vibe
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl shrink-0">👑</span>
                <div>
                  <p className="text-sm font-bold text-white">
                    @{winner.profile.username} is choosing tomorrow's category
                  </p>
                  <p className="text-xs text-white/40">Check back soon to see what's next</p>
                </div>
              </>
            )}
          </div>
        )
      )}

      {/* ── Vote breakdown (counts only, no voter names) ── */}
      {nominations.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">Vote Breakdown</p>
          <div className="flex flex-col gap-2">
            {nominations.map((n, i) => {
              const isWinner = n.profile.id === winner?.profile.id
              const isYou    = n.profile.id === userId
              const pct      = totalVotes > 0 ? (n.vote_count / totalVotes) * 100 : 0

              return (
                <div
                  key={n.profile.id}
                  className={cn(
                    'rounded-2xl border p-3 flex items-center gap-3',
                    isWinner ? 'border-gold/30 bg-gold/8' : 'border-white/8 bg-surface',
                  )}
                >
                  <span className="text-xs font-bold text-white/30 w-4 shrink-0 text-center">{i + 1}</span>
                  <Avatar
                    username={n.profile.username}
                    color={n.profile.avatar_color || getAvatarColor(n.profile.id)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white truncate">
                        @{n.profile.username}
                        {isYou && <span className="text-white/30 font-normal"> (you)</span>}
                      </p>
                      <span className="text-xs text-white/40 tabular-nums shrink-0 ml-2">
                        {n.vote_count} vote{n.vote_count !== 1 ? 's' : ''}
                        {totalVotes > 0 && (
                          <span className="text-white/25">
                            {' '}· {Math.round(pct)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', isWinner ? 'bg-gold' : 'bg-white/20')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {isWinner && <span className="text-lg shrink-0">🏆</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

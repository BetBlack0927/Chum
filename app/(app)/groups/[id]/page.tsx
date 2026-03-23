import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/actions/groups'
import { getOrCreateTodayRound, getRoundData } from '@/lib/actions/rounds'
import { getPromptLikeInfo } from '@/lib/actions/prompts'
import { getCurrentPhase, getPhaseClasses } from '@/lib/phases'
import { TopBar } from '@/components/navigation/TopBar'
import { PhaseIndicator } from '@/components/rounds/PhaseIndicator'
import { VotingInterface } from '@/components/rounds/VotingInterface'
import { WinnerReveal } from '@/components/rounds/WinnerReveal'
import { PromptLikeButton } from '@/components/rounds/PromptLikeButton'
import { RerollButton } from '@/components/rounds/RerollButton'
import { Card } from '@/components/ui/Card'
import { AvatarGroup } from '@/components/ui/Avatar'
import { History, Settings } from 'lucide-react'
import { InviteCodeButton } from './InviteCodeButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallelize independent queries
  const [details, round] = await Promise.all([
    getGroupDetails(groupId),
    getOrCreateTodayRound(groupId)
  ])
  
  if (!details) notFound()

  const { group, members, userId, userRole } = details
  const isAdmin = userRole === 'admin'
  const phase = getCurrentPhase()

  // Parallelize round-dependent queries
  const [roundData, promptLikeInfo] = round 
    ? await Promise.all([
        getRoundData(round.id, userId),
        getPromptLikeInfo(round.prompt_id)
      ])
    : [null, null]

  // Flat list of member profiles for the voting UI
  const memberProfiles = members.map((m: any) => m.profiles).filter(Boolean)

  return (
    <div className="flex flex-col">
      <TopBar
        title={group.name}
        backHref="/groups"
        right={
          <div className="flex items-center gap-1">
            <Link
              href={`/groups/${groupId}/history`}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-2 transition-colors text-white/60 hover:text-white"
            >
              <History size={17} />
            </Link>
            <Link
              href={`/groups/${groupId}/settings`}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-2 transition-colors text-white/60 hover:text-white"
            >
              <Settings size={17} />
            </Link>
          </div>
        }
      />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Group meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarGroup
              users={memberProfiles.map((p: any) => ({ username: p.username, avatar_color: p.avatar_color }))}
              max={5}
              size="sm"
            />
            <span className="text-xs text-white/40">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>
          <InviteCodeButton code={group.invite_code} />
        </div>

        {/* Today's prompt */}
        {round ? (
          <div className="rounded-2xl bg-gradient-to-br from-brand/15 to-gold/5 border border-brand/20 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-xs font-bold text-brand-light/70 uppercase tracking-widest">
                Today's Prompt
              </p>
              {promptLikeInfo && (
                <PromptLikeButton
                  promptId={round.prompt_id}
                  groupId={groupId}
                  initialLikeCount={promptLikeInfo.likeCount}
                  initialUserHasLiked={promptLikeInfo.userHasLiked}
                />
              )}
            </div>
            <p className="text-xl font-black text-white leading-snug">
              {round.prompt.text}
            </p>
          </div>
        ) : (
          <Card>
            <p className="text-white/50 text-sm text-center py-4">
              No prompt available — make sure you've run the seed SQL.
            </p>
          </Card>
        )}

        {/* Reroll (admin only, voting phase, before any votes) */}
        {round && phase === 'voting' && (
          <RerollButton
            roundId={round.id}
            groupId={groupId}
            isAdmin={isAdmin}
            hasRerolled={round.prompt_rerolled ?? false}
            hasVotes={(roundData?.totalVotes ?? 0) > 0}
          />
        )}

        {/* Phase indicator */}
        {round && (
          <PhaseIndicator
            phase={phase}
            votedCount={roundData?.totalVotes ?? 0}
            memberCount={members.length}
          />
        )}

        {/* Phase content */}
        {round && roundData && (
          <>
            {phase === 'voting' && (
              <section>
                <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
                  Who fits this best?
                </p>
                <VotingInterface
                  roundId={round.id}
                  groupId={groupId}
                  members={memberProfiles}
                  userId={userId}
                  userVote={roundData.userVote}
                />
              </section>
            )}

            {phase === 'results' && (
              <section>
                <WinnerReveal
                  promptText={round.prompt.text}
                  winner={roundData.winner}
                  nominations={roundData.nominations}
                  totalVotes={roundData.totalVotes}
                  allComments={roundData.allComments}
                  revealedVoter={roundData.revealedVoter}
                  revealedVoterNominee={roundData.revealedVoterNominee}
                  userId={userId}
                  roundId={round.id}
                  groupId={groupId}
                  nextCategory={round.next_category ?? null}
                />
              </section>
            )}
          </>
        )}

        {/* View history link */}
        <Link
          href={`/groups/${groupId}/history`}
          className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-white/8 text-white/50 hover:text-white text-sm font-medium hover:border-white/20 transition-colors"
        >
          <History size={15} />
          View past winners
        </Link>
      </div>
    </div>
  )
}

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/actions/groups'
import { getOrCreateTodayRound, getRoundData } from '@/lib/actions/rounds'
import { getPromptLikeInfo } from '@/lib/actions/prompts'
import { TopBar } from '@/components/navigation/TopBar'
import { PhaseGate } from '@/components/rounds/PhaseGate'
import { PromptLikeButton } from '@/components/rounds/PromptLikeButton'
import { Card } from '@/components/ui/Card'
import { MembersSheet } from '@/components/groups/MembersSheet'
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

  // Parallelize round-dependent queries
  const [roundData, promptLikeInfo] = await Promise.all([
    round ? getRoundData(round.id, userId) : Promise.resolve(null),
    round ? getPromptLikeInfo(round.prompt_id) : Promise.resolve(null),
  ])

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
          <MembersSheet
            groupId={groupId}
            members={members.map((m: any) => ({
              id:           m.profiles?.id ?? m.user_id,
              username:     m.profiles?.username ?? '?',
              avatar_color: m.profiles?.avatar_color ?? '#8b5cf6',
              avatar_url:   m.profiles?.avatar_url ?? null,
              role:         m.role,
            }))}
            currentUserId={userId}
            isAdmin={isAdmin}
            votedUserIds={roundData ? roundData.voterIds : undefined}
          />
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

        {/* Phase-gated content: phase detection happens client-side using local time */}
        {round && roundData && (
          <PhaseGate
            roundId={round.id}
            groupId={groupId}
            promptText={round.prompt.text}
            hasRerolled={round.prompt_rerolled ?? false}
            nextCategory={round.next_category ?? null}
            roundData={roundData}
            memberProfiles={memberProfiles}
            userId={userId}
            isAdmin={isAdmin}
            memberCount={members.length}
          />
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

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/actions/groups'
import { getGroupHistory } from '@/lib/actions/rounds'
import { TopBar } from '@/components/navigation/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { getAvatarColor, formatRoundDate } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function HistoryPage({ params }: Props) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const details = await getGroupDetails(groupId)
  if (!details) notFound()

  const { group } = details
  const history = await getGroupHistory(groupId)

  return (
    <div>
      <TopBar title={`${group.name} — History`} backHref={`/groups/${groupId}`} />

      <div className="px-4 pt-4 pb-6">
        {history.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 gap-4">
            <div className="text-5xl">📜</div>
            <div>
              <p className="font-bold text-white text-lg">No history yet</p>
              <p className="text-sm text-white/40 mt-1 max-w-xs leading-relaxed">
                Past rounds will show up here after they complete. Come back tomorrow!
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-4">
              Past {history.length} Round{history.length !== 1 ? 's' : ''}
            </p>

            <div className="flex flex-col gap-4">
              {history.map(({ round, winner, totalVotes }) => (
                <HistoryCard
                  key={round.id}
                  round={round}
                  winner={winner}
                  totalVotes={totalVotes}
                  userId={user.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function HistoryCard({ round, winner, totalVotes, userId }: {
  round:       any
  winner:      any | null
  totalVotes:  number
  userId:      string
}) {
  const dateLabel      = formatRoundDate(round.date)
  const isWinnerMe     = winner?.profile.id === userId

  return (
    <div className="rounded-2xl border border-white/8 bg-surface overflow-hidden">
      {/* Date + prompt */}
      <div className="px-4 pt-4 pb-3 border-b border-white/6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white/30 uppercase tracking-wide">{dateLabel}</span>
          <span className="text-xs text-white/30">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-sm font-bold text-white/90 leading-snug">{round.prompt.text}</p>
      </div>

      {/* Winner */}
      {winner ? (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              username={winner.profile.username}
              color={winner.profile.avatar_color || getAvatarColor(winner.profile.id)}
              url={winner.profile.avatar_url}
              size="md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-gold">🏆 Winner</span>
                {isWinnerMe && (
                  <span className="text-xs text-emerald-400 font-semibold">That's you!</span>
                )}
              </div>
              <p className="font-bold text-white text-sm">@{winner.profile.username}</p>
              <p className="text-xs text-gold/60">
                {winner.vote_count} vote{winner.vote_count !== 1 ? 's' : ''}
                {totalVotes > 0 && ` · ${Math.round((winner.vote_count / totalVotes) * 100)}% of group`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3">
          <p className="text-sm text-white/40 italic">
            {totalVotes === 0 ? 'Nobody voted that day' : 'No votes were cast'}
          </p>
        </div>
      )}
    </div>
  )
}

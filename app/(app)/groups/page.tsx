import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/actions/groups'
import { getCurrentPhase, getPhaseClasses, getPhaseEmoji, getPhaseLabel } from '@/lib/phases'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Users, Plus, Trophy, ChevronRight } from 'lucide-react'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallelize independent queries
  const [profileResult, groups] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_color, avatar_url')
      .eq('id', user.id)
      .single(),
    getUserGroups()
  ])

  const profile = profileResult.data
  const currentPhase = getCurrentPhase()
  const phaseClasses = getPhaseClasses(currentPhase)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            {profile && (
              <Avatar
                username={profile.username}
                color={profile.avatar_color}
                url={profile.avatar_url}
                size="md"
              />
            )}
            <div>
              <p className="text-xs text-white/40 font-medium">Hey there 👋</p>
              <p className="font-bold text-white text-lg">@{profile?.username}</p>
            </div>
          </div>

          {/* Today's phase pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${phaseClasses.bg} ${phaseClasses.border} ${phaseClasses.text}`}>
            <span>{getPhaseEmoji(currentPhase)}</span>
            <span>{getPhaseLabel(currentPhase)}</span>
          </div>
        </div>
      </div>

      {/* Groups list */}
      <div className="px-4 pb-4">
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-white/30 uppercase tracking-wide px-1">
              Your Groups
            </p>
            {groups.map((group: any) => (
              <GroupCard key={group.id} group={group} currentPhase={currentPhase} />
            ))}
          </div>
        )}

        {/* Create/Join button */}
        <Link
          href="/groups/new"
          className="mt-4 flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand/15 border border-brand/30 text-brand-light font-semibold text-sm hover:bg-brand/25 transition-colors active:scale-95"
        >
          <Plus size={16} />
          Create or Join a Group
        </Link>
      </div>
    </div>
  )
}

function GroupCard({ group, currentPhase }: { group: any; currentPhase: ReturnType<typeof getCurrentPhase> }) {
  const phaseClasses = getPhaseClasses(currentPhase)

  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex items-center gap-4 bg-surface rounded-2xl border border-white/8 p-4 hover:border-white/14 hover:bg-surface-2 transition-all active:scale-[0.98]"
    >
      {/* Group avatar */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/30 to-gold/20 flex items-center justify-center text-xl shrink-0 border border-white/8">
        {group.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate">{group.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Users size={11} className="text-white/30" />
          <span className="text-xs text-white/40">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
          <span className="text-white/20">·</span>
          <span className={`text-xs font-semibold ${phaseClasses.text}`}>
            {getPhaseEmoji(currentPhase)} {getPhaseLabel(currentPhase)}
          </span>
        </div>
      </div>

      <ChevronRight size={16} className="text-white/20 shrink-0" />
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-4">
      <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-white/8 flex items-center justify-center text-4xl">
        🏆
      </div>
      <div>
        <p className="font-bold text-white text-lg">No groups yet</p>
        <p className="text-sm text-white/40 mt-1 leading-relaxed max-w-xs">
          Create a group and invite your friends, or join one with an invite code.
        </p>
      </div>
    </div>
  )
}

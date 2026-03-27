import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups, getGroupStreaks } from '@/lib/actions/groups'
import { getTodayPromptPreviewByGroup } from '@/lib/actions/rounds'
import { Avatar } from '@/components/ui/Avatar'
import { GroupListCard } from '@/components/groups/GroupListCard'
import { Plus } from 'lucide-react'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, groups] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_color, avatar_url')
      .eq('id', user.id)
      .single(),
    getUserGroups(),
  ])

  const profile = profileResult.data
  const list = groups as any[]

  const streaks = await getGroupStreaks(
    list.map((g: any) => ({ id: g.id, member_count: g.member_count })),
  )

  const groupIds = list.map((g: any) => g.id)
  const promptByGroup = await getTodayPromptPreviewByGroup(groupIds)

  const primary   = list[0]
  const secondary = list.slice(1)

  const cardProps = (group: any) => ({
    group: {
      id:           group.id,
      name:         group.name,
      avatar_url:   group.avatar_url ?? null,
      member_count: group.member_count,
    },
    streak:     streaks[group.id] ?? 0,
    promptText: promptByGroup[group.id] ?? null,
  })

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-2">
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
      </div>

      <div className="px-4 pb-6 pt-2">
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col">
            <section className="mb-8">
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest px-1 mb-3">
                🔥 Active now
              </p>
              <GroupListCard {...cardProps(primary)} variant="featured" />
            </section>

            {secondary.length > 0 && (
              <section>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-1 mb-3">
                  Your groups
                </p>
                <div className="flex flex-col gap-4">
                  {secondary.map((group: any) => (
                    <GroupListCard key={group.id} {...cardProps(group)} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <Link
          href="/groups/new"
          className="mt-6 flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand/15 border border-brand/30 text-brand-light font-semibold text-sm hover:bg-brand/25 transition-colors active:scale-95"
        >
          <Plus size={16} />
          Create or Join a Group
        </Link>
      </div>
    </div>
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

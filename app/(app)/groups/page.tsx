import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups, getGroupStreaks } from '@/lib/actions/groups'
import { TopBar } from '@/components/navigation/TopBar'
import { GroupListCard } from '@/components/groups/GroupListCard'
import { Plus } from 'lucide-react'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const groups = await getUserGroups()
  const list = groups as any[]

  const streaks = await getGroupStreaks(
    list.map((g: any) => ({ id: g.id, member_count: g.member_count })),
  )

  return (
    <div className="flex flex-col">
      <TopBar title="Your Groups" />

      <div className="px-4 pt-6 pb-6 flex flex-col gap-4">
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((group: any) => (
              <GroupListCard
                key={group.id}
                group={{
                  id:           group.id,
                  name:         group.name,
                  avatar_url:   group.avatar_url ?? null,
                  member_count: group.member_count,
                }}
                streak={streaks[group.id] ?? 0}
              />
            ))}
          </div>
        )}

        <Link
          href="/groups/new"
          className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand/15 border border-brand/30 text-brand-light font-semibold text-sm hover:bg-brand/25 transition-colors active:scale-95"
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

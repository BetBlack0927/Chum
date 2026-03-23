import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/actions/groups'
import { TopBar } from '@/components/navigation/TopBar'
import { GroupAvatarUpload } from '@/components/groups/GroupAvatarUpload'
import { Card } from '@/components/ui/Card'
import { ShieldAlert } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupSettingsPage({ params }: Props) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const details = await getGroupDetails(groupId)
  if (!details) notFound()

  const { group, userRole } = details
  const isAdmin = userRole === 'admin'

  return (
    <div>
      <TopBar title="Group Settings" backHref={`/groups/${groupId}`} />

      <div className="px-4 pt-6 flex flex-col gap-5">

        {/* Group photo — admin only */}
        {isAdmin ? (
          <Card>
            <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-4">Group Photo</p>
            <div className="flex flex-col items-center">
              <GroupAvatarUpload
                groupId={groupId}
                groupName={group.name}
                avatarUrl={group.avatar_url ?? null}
              />
            </div>
            <p className="text-xs text-white/25 text-center mt-4">
              All group members will see this photo.
            </p>
          </Card>
        ) : (
          <Card className="flex items-center gap-3 py-4">
            <ShieldAlert size={18} className="text-white/30 shrink-0" />
            <p className="text-sm text-white/40">Only group admins can edit these settings.</p>
          </Card>
        )}

        {/* Group info */}
        <Card>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">Group Info</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Name</span>
              <span className="text-white/80 font-medium truncate ml-4">{group.name}</span>
            </div>
            {group.description && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50 shrink-0">Description</span>
                <span className="text-white/80 ml-4 text-right">{group.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Invite code</span>
              <span className="font-mono text-brand-light font-bold tracking-widest">{group.invite_code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Your role</span>
              <span className={`font-semibold ${isAdmin ? 'text-gold' : 'text-white/60'}`}>
                {isAdmin ? '👑 Admin' : 'Member'}
              </span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/navigation/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <TopBar title="Profile" />

      <div className="px-4 pt-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <Avatar
            username={profile?.username ?? '??'}
            color={profile?.avatar_color}
            size="xl"
          />
          <div className="text-center">
            <p className="text-xl font-bold text-white">@{profile?.username}</p>
            <p className="text-sm text-white/40 mt-0.5">{user.email}</p>
          </div>
        </div>

        <Card>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">Account</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Member since</span>
              <span className="text-white/80 font-medium">
                {new Date(profile?.created_at ?? user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">User ID</span>
              <span className="text-white/30 text-xs font-mono">{user.id.slice(0, 8)}...</span>
            </div>
          </div>
        </Card>

        <form action={signOut}>
          <Button type="submit" variant="danger" fullWidth>
            <LogOut size={16} />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}

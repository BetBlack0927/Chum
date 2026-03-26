import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/navigation/TopBar'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Card } from '@/components/ui/Card'
import { ScrapbookCard } from '@/components/scrapbook/ScrapbookCard'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { BioEditor } from './BioEditor'
<<<<<<< HEAD
import { getScrapbook } from '@/lib/actions/scrapbook'
import { getCreatorPrompts, getCreatorPacks, getMyPrivatePrompts, getFollowCounts } from '@/lib/actions/shop'
import { CreatorContentClient } from '@/app/(app)/creators/[username]/CreatorContentClient'
import { FollowStats } from '@/app/(app)/creators/[username]/FollowStats'
import { LogOut, Store, MessageSquare, ExternalLink } from 'lucide-react'
=======
import { getUserScrapbook } from '@/lib/actions/scrapbook'
import { LogOut, Store, MessageSquare, ExternalLink, BookMarked } from 'lucide-react'
>>>>>>> b7f124a (scrapbook v1)

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

<<<<<<< HEAD
  const [followCounts, scrapbookEntries, myPrompts, myPacks, myPrivatePrompts] = await Promise.all([
    getFollowCounts(user.id),
    getScrapbook(user.id),
    getCreatorPrompts(user.id),
    getCreatorPacks(user.id),
    getMyPrivatePrompts(),
=======
  const admin = createAdminClient()
  const [promptCountResult, packCountResult, scrapbook] = await Promise.all([
    admin.from('prompts').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
    admin.from('prompt_packs').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
    getUserScrapbook(user.id),
>>>>>>> b7f124a (scrapbook v1)
  ])

  const followerCount  = followCounts.followerCount
  const followingCount = followCounts.followingCount

  return (
    <div>
      <TopBar title="Profile" />

      <div className="px-4 pt-6 flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 py-6">
          <AvatarUpload
            userId={user.id}
            username={profile?.username ?? '??'}
            avatarColor={profile?.avatar_color ?? '#8b5cf6'}
            avatarUrl={profile?.avatar_url ?? null}
          />
          <div className="text-center mt-2">
            <p className="text-xl font-bold text-white">@{profile?.username}</p>
            <p className="text-sm text-white/40 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Bio editor */}
        <BioEditor currentBio={profile?.bio ?? null} />

        {/* Creator section */}
        <div className="rounded-2xl border border-white/8 bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-brand-light" />
              <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Creator Profile</p>
            </div>
          </div>

          {/* Followers / following — prompts & packs counts are in tabs below */}
          <div className="mb-4">
            <FollowStats
              userId={user.id}
              currentUserId={user.id}
              followerCount={followerCount}
              followingCount={followingCount}
            />
          </div>

          <div className="flex gap-2">
            {profile?.username && (
              <Link
                href={`/creators/${profile.username}`}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
                View Profile
              </Link>
            )}
            <Link
              href="/shop/create"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-brand/15 text-brand-light text-sm font-semibold hover:bg-brand/25 transition-colors"
            >
              <MessageSquare size={14} />
              Create
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        <CreatorContentClient
          prompts={myPrompts}
          packs={myPacks}
          scrapbookEntries={scrapbookEntries}
          scrapbookReadonly={false}
          privatePrompts={myPrivatePrompts}
        />
=======
        {/* Scrapbook */}
        <div className="rounded-2xl border border-white/8 bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked size={16} className="text-gold/70" />
            <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Scrapbook</p>
            {scrapbook.length > 0 && (
              <span className="ml-auto text-xs text-white/25">{scrapbook.length}</span>
            )}
          </div>

          {scrapbook.length === 0 ? (
            <p className="text-sm text-white/25 italic text-center py-4">
              Win a round and save it here to remember it
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {scrapbook.map((entry) => (
                <ScrapbookCard key={entry.id} entry={entry} isOwn />
              ))}
            </div>
          )}
        </div>
>>>>>>> b7f124a (scrapbook v1)

        {/* Account info */}
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

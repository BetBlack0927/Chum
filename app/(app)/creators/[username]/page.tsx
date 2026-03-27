import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCreatorProfile, getCreatorPrompts, getCreatorPacks } from '@/lib/actions/shop'
import { getScrapbook } from '@/lib/actions/scrapbook'
import { TopBar } from '@/components/navigation/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { getAvatarColor } from '@/lib/utils'
import { FollowButton } from '@/components/shop/FollowButton'
import { CreatorContentClient } from './CreatorContentClient'

interface Props {
  params: Promise<{ username: string }>
}

export default async function CreatorPage({ params }: Props) {
  const { username } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCreatorProfile(username)
  if (!profile) notFound()

  const [creatorPrompts, creatorPacks, scrapbookEntries] = await Promise.all([
    getCreatorPrompts(profile.id),
    getCreatorPacks(profile.id),
    getScrapbook(profile.id),
  ])

  const isOwnProfile = profile.id === user.id

  return (
    <div>
      <TopBar
        title={`@${profile.username}`}
        backHref="/shop"
        right={
          isOwnProfile ? (
            <Link
              href="/shop/create"
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors"
            >
              + Create
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 pt-5 pb-10 flex flex-col gap-6">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar
            username={profile.username}
            color={profile.avatar_color || getAvatarColor(profile.id)}
            url={profile.avatar_url}
            size="xl"
          />
          <div>
            <p className="font-black text-white text-xl">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-white/50 mt-1 max-w-xs leading-relaxed">{profile.bio}</p>
            )}
            {!profile.bio && isOwnProfile && (
              <p className="text-xs text-white/25 mt-1 italic">Add a bio on your profile page</p>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-bold text-white text-lg">{profile.follower_count}</p>
              <p className="text-xs text-white/40">Followers</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-bold text-white text-lg">{profile.prompt_count}</p>
              <p className="text-xs text-white/40">Prompts</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-bold text-white text-lg">{profile.pack_count}</p>
              <p className="text-xs text-white/40">Packs</p>
            </div>
          </div>

          {/* Follow button (larger, centered) — only on non-own profiles */}
          {!isOwnProfile && (
            <FollowButton
              creatorId={profile.id}
              initialIsFollowing={profile.is_following ?? false}
            />
          )}
        </div>

        <CreatorContentClient
          prompts={creatorPrompts}
          packs={creatorPacks}
          scrapbookEntries={scrapbookEntries}
          scrapbookReadonly={!isOwnProfile}
        />
      </div>
    </div>
  )
}

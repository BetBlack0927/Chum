'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { getFollowers, getFollowing, type FollowEntry } from '@/lib/actions/shop'
import { Avatar } from '@/components/ui/Avatar'
import { getAvatarColor } from '@/lib/utils'

type TabType = 'followers' | 'following'

interface Props {
  userId:          string
  currentUserId:   string
  followerCount:   number
  followingCount:  number
  initialTab?:     TabType
  onClose:         () => void
}

export function FollowListSheet({
  userId,
  currentUserId,
  followerCount,
  followingCount,
  initialTab = 'followers',
  onClose,
}: Props) {
  const [tab, setTab]           = useState<TabType>(initialTab)
  const [followers, setFollowers] = useState<FollowEntry[] | null>(null)
  const [following, setFollowing] = useState<FollowEntry[] | null>(null)
  const [loading, setLoading]   = useState(false)

  // Load both lists once on open
  useEffect(() => {
    setLoading(true)
    Promise.all([getFollowers(userId), getFollowing(userId)]).then(([f1, f2]) => {
      setFollowers(f1)
      setFollowing(f2)
      setLoading(false)
    })
  }, [userId])

  const list = tab === 'followers' ? followers : following

  const tabBtn = (t: TabType, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={[
        'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
        tab === t ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70',
      ].join(' ')}
    >
      {label} ({count})
    </button>
  )

  return (
    <>
      <div
        className="fixed inset-0 z-[209] bg-black/65"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-[210] mx-auto flex w-full max-w-[430px] max-h-[85dvh] flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-surface">
          {/* Header */}
          <div className="shrink-0 px-5 pt-4 pb-3">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Community</p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
              {tabBtn('followers', 'Followers', followerCount)}
              {tabBtn('following', 'Following', followingCount)}
            </div>
          </div>

          {/* List — extra bottom padding so last rows clear the fixed bottom nav (z-50) on mobile */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-5 scroll-touch"
            style={{
              paddingBottom:
                'calc(5.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {loading || list === null ? (
              <div className="flex flex-col gap-2 py-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">{tab === 'followers' ? '👥' : '🔭'}</p>
                <p className="text-sm text-white/40">
                  {tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {list.map((person) => {
                  const isMe = person.id === currentUserId
                  const href = isMe ? '/profile' : `/creators/${person.username}`
                  return (
                    <Link
                      key={person.id}
                      href={href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <Avatar
                        username={person.username}
                        color={person.avatar_color || getAvatarColor(person.id)}
                        url={person.avatar_url}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">@{person.username}</p>
                        {isMe && (
                          <p className="text-xs text-white/30">You</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

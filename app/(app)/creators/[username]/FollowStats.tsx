'use client'

import { useState } from 'react'
import { FollowListSheet } from '@/components/shop/FollowListSheet'

interface Props {
  userId:         string
  currentUserId:  string
  followerCount:  number
  followingCount: number
}

export function FollowStats({
  userId,
  currentUserId,
  followerCount,
  followingCount,
}: Props) {
  const [sheetTab, setSheetTab] = useState<'followers' | 'following' | null>(null)

  return (
    <>
      <div className="flex items-center justify-center gap-10">
        <button
          type="button"
          onClick={() => setSheetTab('followers')}
          className="text-center hover:opacity-70 transition-opacity"
        >
          <p className="font-bold text-white text-lg">{followerCount}</p>
          <p className="text-xs text-white/40">Followers</p>
        </button>

        <div className="w-px h-8 bg-white/10" />

        <button
          type="button"
          onClick={() => setSheetTab('following')}
          className="text-center hover:opacity-70 transition-opacity"
        >
          <p className="font-bold text-white text-lg">{followingCount}</p>
          <p className="text-xs text-white/40">Following</p>
        </button>
      </div>

      {sheetTab !== null && (
        <FollowListSheet
          userId={userId}
          currentUserId={currentUserId}
          followerCount={followerCount}
          followingCount={followingCount}
          initialTab={sheetTab}
          onClose={() => setSheetTab(null)}
        />
      )}
    </>
  )
}

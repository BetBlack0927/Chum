'use client'

import { useState, useTransition } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { toggleFollowCreator } from '@/lib/actions/shop'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  creatorId: string
  initialIsFollowing: boolean
  onFollowChange?: (following: boolean) => void
  size?: 'sm' | 'md'
}

export function FollowButton({ creatorId, initialIsFollowing, onFollowChange, size = 'md' }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [isPending, start]        = useTransition()

  function handleClick() {
    start(async () => {
      const result = await toggleFollowCreator(creatorId)
      if (!result.error) {
        setFollowing(result.following)
        onFollowChange?.(result.following)
      }
    })
  }

  const isSmall = size === 'sm'

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'flex items-center gap-1.5 font-semibold rounded-xl transition-all',
        isSmall ? 'px-3 h-8 text-xs' : 'px-4 h-10 text-sm',
        following
          ? 'bg-white/8 text-white/60 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
          : 'bg-brand text-white hover:bg-brand/90',
        isPending && 'opacity-60'
      )}
    >
      {following ? (
        <>
          <UserCheck size={isSmall ? 13 : 15} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={isSmall ? 13 : 15} />
          Follow
        </>
      )}
    </button>
  )
}

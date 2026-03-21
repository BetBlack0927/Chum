'use client'

import { likePrompt, unlikePrompt } from '@/lib/actions/prompts'
import { Heart } from 'lucide-react'
import { useTransition, useState } from 'react'
import { cn } from '@/lib/utils'

interface PromptLikeButtonProps {
  promptId: string
  groupId: string
  initialLikeCount: number
  initialUserHasLiked: boolean
}

export function PromptLikeButton({ 
  promptId, 
  groupId, 
  initialLikeCount, 
  initialUserHasLiked 
}: PromptLikeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Optimistic UI state
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [userHasLiked, setUserHasLiked] = useState(initialUserHasLiked)

  async function handleToggleLike() {
    setError(null)
    
    // Optimistic update
    const wasLiked = userHasLiked
    setUserHasLiked(!wasLiked)
    setLikeCount(wasLiked ? likeCount - 1 : likeCount + 1)
    
    startTransition(async () => {
      const formData = new FormData()
      formData.append('prompt_id', promptId)
      formData.append('group_id', groupId)

      const result = wasLiked 
        ? await unlikePrompt(formData)
        : await likePrompt(formData)

      if (result?.error) {
        // Revert optimistic update on error
        setUserHasLiked(wasLiked)
        setLikeCount(wasLiked ? likeCount : likeCount - 1)
        setError(result.error)
        setTimeout(() => setError(null), 3000)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggleLike}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
          'border disabled:opacity-50',
          userHasLiked
            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 hover:bg-pink-500/30'
            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
        )}
      >
        <Heart
          className={cn(
            'w-3.5 h-3.5 transition-all',
            userHasLiked ? 'fill-pink-300' : 'fill-none'
          )}
        />
        <span>{likeCount}</span>
      </button>
      {error && (
        <p className="text-[10px] text-red-400 max-w-[120px] text-right">
          {error}
        </p>
      )}
    </div>
  )
}

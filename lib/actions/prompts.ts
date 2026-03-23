'use server'

import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Like a prompt ───────────────────────────────────────────────────────────

export async function likePrompt(formData: FormData) {
  const promptId = formData.get('prompt_id') as string
  const groupId  = formData.get('group_id') as string

  if (!promptId) {
    return { error: 'Invalid prompt ID.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Use upsert with onConflict to handle race conditions gracefully
  // This is faster than checking first, then inserting
  const { error: insertError } = await admin
    .from('prompt_likes')
    .upsert(
      { user_id: user.id, prompt_id: promptId },
      { onConflict: 'user_id,prompt_id', ignoreDuplicates: true }
    )

  if (insertError) {
    return { error: insertError.message }
  }

  // Increment the counter using admin client
  await admin.rpc('increment_prompt_likes', { prompt_id: promptId })

  // Invalidate caches
  if (groupId) {
    revalidatePath(`/groups/${groupId}`)
  }

  return { success: true }
}

// ─── Unlike a prompt ─────────────────────────────────────────────────────────

export async function unlikePrompt(formData: FormData) {
  const promptId = formData.get('prompt_id') as string
  const groupId  = formData.get('group_id') as string

  if (!promptId) {
    return { error: 'Invalid prompt ID.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Delete the like and decrement in parallel
  const [deleteResult] = await Promise.all([
    admin
      .from('prompt_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('prompt_id', promptId),
    admin.rpc('decrement_prompt_likes', { prompt_id: promptId })
  ])

  if (deleteResult.error) {
    return { error: deleteResult.error.message }
  }

  if (groupId) {
    revalidatePath(`/groups/${groupId}`)
  }

  return { success: true }
}

// ─── Get like info for a prompt ─────────────────────────────────────────────

export async function getPromptLikeInfo(promptId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Cache for 5 seconds - likes change but not constantly
  return unstable_cache(
    async (promptId: string, userId: string) => {
      const admin = createAdminClient()

      // Parallelize like count and user like check
      const [promptResult, userLikeResult] = await Promise.all([
        admin
          .from('prompts')
          .select('id, likes')
          .eq('id', promptId)
          .single(),
        admin
          .from('prompt_likes')
          .select('id')
          .eq('prompt_id', promptId)
          .eq('user_id', userId)
          .maybeSingle()
      ])

      if (!promptResult.data) return null

      return {
        likeCount: promptResult.data.likes ?? 0,
        userHasLiked: !!userLikeResult.data,
      }
    },
    [`prompt-like-${promptId}-${user.id}`],
    { revalidate: 5, tags: [`prompt-${promptId}`] }
  )(promptId, user.id)
}

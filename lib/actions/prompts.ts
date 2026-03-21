'use server'

import { revalidatePath } from 'next/cache'
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

  // Check if already liked
  const { data: existing } = await supabase
    .from('prompt_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('prompt_id', promptId)
    .maybeSingle()

  if (existing) {
    return { error: 'Already liked.' }
  }

  // Insert the like
  const { error: insertError } = await supabase
    .from('prompt_likes')
    .insert({ user_id: user.id, prompt_id: promptId })

  if (insertError) {
    return { error: insertError.message }
  }

  // Increment the counter using admin client
  const admin = createAdminClient()
  await admin.rpc('increment_prompt_likes', { prompt_id: promptId })

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

  // Delete the like
  const { error: deleteError } = await supabase
    .from('prompt_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('prompt_id', promptId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Decrement the counter using admin client
  const admin = createAdminClient()
  await admin.rpc('decrement_prompt_likes', { prompt_id: promptId })

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

  // Get the prompt with likes count
  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, likes')
    .eq('id', promptId)
    .single()

  if (!prompt) return null

  // Check if user has liked it
  const { data: userLike } = await supabase
    .from('prompt_likes')
    .select('id')
    .eq('prompt_id', promptId)
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    likeCount: prompt.likes ?? 0,
    userHasLiked: !!userLike,
  }
}

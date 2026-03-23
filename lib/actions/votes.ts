'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_COMMENT_LENGTH = 80

export async function castVote(formData: FormData) {
  const roundId         = formData.get('round_id')          as string
  const groupId         = formData.get('group_id')          as string
  const nominatedUserId = formData.get('nominated_user_id') as string
  const rawComment      = (formData.get('comment') as string | null)?.trim() || null

  if (!roundId || !nominatedUserId) {
    return { error: 'Invalid vote data.' }
  }

  const comment = rawComment && rawComment.length > 0 ? rawComment : null
  if (comment && comment.length > MAX_COMMENT_LENGTH) {
    return { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (nominatedUserId === user.id) {
    return { error: "You can't nominate yourself!" }
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('voter_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'You already voted in this round.' }
  }

  const { error } = await admin
    .from('votes')
    .insert({ round_id: roundId, voter_id: user.id, nominated_user_id: nominatedUserId, comment })

  if (error) return { error: error.message }

  // Invalidate caches
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

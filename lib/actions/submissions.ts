'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function submitAnswer(formData: FormData) {
  const roundId = formData.get('round_id') as string
  const groupId = formData.get('group_id') as string
  const content = (formData.get('content') as string).trim()

  if (!content || content.length < 1) {
    return { error: 'Your answer cannot be empty.' }
  }
  if (content.length > 280) {
    return { error: 'Your answer must be 280 characters or fewer.' }
  }

  // Verify authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Check for existing submission
  const { data: existing } = await admin
    .from('submissions')
    .select('id')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'You already submitted an answer for today.' }
  }

  const { error } = await admin
    .from('submissions')
    .insert({ round_id: roundId, user_id: user.id, content })

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

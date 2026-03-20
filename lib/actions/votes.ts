'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function castVote(formData: FormData) {
  const roundId         = formData.get('round_id')          as string
  const groupId         = formData.get('group_id')          as string
  const nominatedUserId = formData.get('nominated_user_id') as string

  if (!roundId || !nominatedUserId) {
    return { error: 'Invalid vote data.' }
  }

  // Verify authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Prevent voting for yourself
  if (nominatedUserId === user.id) {
    return { error: "You can't nominate yourself!" }
  }

  const admin = createAdminClient()

  // Check if already voted this round
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
    .insert({ round_id: roundId, voter_id: user.id, nominated_user_id: nominatedUserId })

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

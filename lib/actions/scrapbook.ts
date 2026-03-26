'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ScrapbookEntry } from '@/types/database'

<<<<<<< HEAD
export async function addToScrapbook(roundId: string): Promise<{
  success: boolean
  alreadySaved?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Fetch the round + prompt + group in one query
  const { data: round } = await admin
    .from('rounds')
    .select('id, date, group_id, prompt_id, prompts(text), groups(name)')
    .eq('id', roundId)
    .single()

  if (!round) return { success: false, error: 'Round not found.' }

  // Verify this user actually won the round
=======
export async function addToScrapbook(roundId: string, groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify the calling user actually won this round (most votes)
>>>>>>> b7f124a (scrapbook v1)
  const { data: votes } = await admin
    .from('votes')
    .select('nominated_user_id')
    .eq('round_id', roundId)

<<<<<<< HEAD
  if (!votes || votes.length === 0) return { success: false, error: 'No votes in this round.' }

  // Count votes per nominee
  const tally: Record<string, number> = {}
  for (const v of votes) {
    tally[v.nominated_user_id] = (tally[v.nominated_user_id] ?? 0) + 1
  }
  const winnerId = Object.entries(tally).sort(([, a], [, b]) => b - a)[0]?.[0]

  if (winnerId !== user.id) return { success: false, error: 'You did not win this round.' }

  const userVoteCount = tally[user.id] ?? 0
  const totalVotes    = votes.length
  const promptText    = (round.prompts as any)?.text ?? ''
  const groupName     = (round.groups as any)?.name ?? null

  // Insert — ignore duplicate (user already saved this round)
  const { error } = await admin
    .from('scrapbook_entries')
    .insert({
      user_id:     user.id,
      round_id:    roundId,
      prompt_text: promptText,
      group_name:  groupName,
      vote_count:  userVoteCount,
      total_votes: totalVotes,
      round_date:  round.date,
    })

  if (error) {
    if (error.code === '23505') return { success: true, alreadySaved: true }
    return { success: false, error: error.message }
=======
  if (!votes || votes.length === 0) return { error: 'No votes found for this round.' }

  const counts: Record<string, number> = {}
  for (const v of votes) {
    counts[v.nominated_user_id] = (counts[v.nominated_user_id] ?? 0) + 1
  }
  const topUserId = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0]

  if (topUserId !== user.id) return { error: 'Only the round winner can save to scrapbook.' }

  const voteCount = counts[user.id] ?? 0
  const totalVotes = votes.length

  // Fetch round date + prompt text + group name in parallel
  const [roundRow, groupRow] = await Promise.all([
    admin.from('rounds').select('date, prompt:prompts(text)').eq('id', roundId).single(),
    admin.from('groups').select('name').eq('id', groupId).single(),
  ])

  if (!roundRow.data) return { error: 'Round not found.' }

  const { error } = await admin.from('scrapbook_entries').insert({
    user_id:     user.id,
    round_id:    roundId,
    prompt_text: (roundRow.data.prompt as any).text as string,
    group_name:  groupRow.data?.name ?? null,
    vote_count:  voteCount,
    total_votes: totalVotes,
    round_date:  roundRow.data.date,
  })

  if (error) {
    if (error.code === '23505') return { alreadySaved: true }
    return { error: error.message }
>>>>>>> b7f124a (scrapbook v1)
  }

  revalidatePath('/profile')
  return { success: true }
}

<<<<<<< HEAD
export async function removeFromScrapbook(entryId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

=======
export async function removeScrapbookEntry(entryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
>>>>>>> b7f124a (scrapbook v1)
  const { error } = await admin
    .from('scrapbook_entries')
    .delete()
    .eq('id', entryId)
<<<<<<< HEAD
    .eq('user_id', user.id) // RLS-style check at the action level too

  if (error) return { success: false, error: error.message }
=======
    .eq('user_id', user.id)

  if (error) return { error: error.message }
>>>>>>> b7f124a (scrapbook v1)

  revalidatePath('/profile')
  return { success: true }
}

<<<<<<< HEAD
export async function getScrapbook(userId: string): Promise<ScrapbookEntry[]> {
  const admin = createAdminClient()

=======
export async function getUserScrapbook(userId: string): Promise<ScrapbookEntry[]> {
  const admin = createAdminClient()
>>>>>>> b7f124a (scrapbook v1)
  const { data } = await admin
    .from('scrapbook_entries')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
<<<<<<< HEAD

  return (data ?? []) as ScrapbookEntry[]
}

export async function isRoundInScrapbook(roundId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

=======
  return (data ?? []) as ScrapbookEntry[]
}

export async function checkScrapbookEntry(roundId: string, userId: string): Promise<boolean> {
>>>>>>> b7f124a (scrapbook v1)
  const admin = createAdminClient()
  const { data } = await admin
    .from('scrapbook_entries')
    .select('id')
    .eq('round_id', roundId)
<<<<<<< HEAD
    .eq('user_id', user.id)
    .maybeSingle()

=======
    .eq('user_id', userId)
    .maybeSingle()
>>>>>>> b7f124a (scrapbook v1)
  return !!data
}

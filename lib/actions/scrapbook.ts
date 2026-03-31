'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ScrapbookEntry } from '@/types/database'

type ScrapbookResult = {
  success: boolean
  alreadySaved?: boolean
  error?: string
}

export async function addToScrapbook(roundId: string, groupId?: string): Promise<ScrapbookResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  const { data: votes } = await admin
    .from('votes')
    .select('nominated_user_id')
    .eq('round_id', roundId)

  if (!votes || votes.length === 0) return { success: false, error: 'No votes in this round.' }

  const counts: Record<string, number> = {}
  for (const v of votes) {
    counts[v.nominated_user_id] = (counts[v.nominated_user_id] ?? 0) + 1
  }
  const winnerId = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0]

  if (winnerId !== user.id) return { success: false, error: 'Only the round winner can save to scrapbook.' }

  const voteCount = counts[user.id] ?? 0
  const totalVotes = votes.length

  // Fetch round fields and optional group name
  const { data: roundData } = await admin
    .from('rounds')
    .select('date, group_id, prompt:prompts(text)')
    .eq('id', roundId)
    .single()

  if (!roundData) return { success: false, error: 'Round not found.' }

  const resolvedGroupId = groupId ?? roundData.group_id
  let groupName: string | null = null
  if (resolvedGroupId) {
    const { data: groupRow } = await admin
      .from('groups')
      .select('name')
      .eq('id', resolvedGroupId)
      .maybeSingle()
    groupName = groupRow?.name ?? null
  }

  const { error } = await admin
    .from('scrapbook_entries')
    .insert({
      user_id: user.id,
      round_id: roundId,
      prompt_text: (roundData.prompt as any)?.text ?? '',
      group_name: groupName,
      vote_count: voteCount,
      total_votes: totalVotes,
      round_date: roundData.date,
    })

  if (error) {
    if (error.code === '23505') return { success: true, alreadySaved: true }
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function removeFromScrapbook(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('scrapbook_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function removeScrapbookEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  return removeFromScrapbook(entryId)
}

export async function getScrapbook(userId: string): Promise<ScrapbookEntry[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('scrapbook_entries')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  return (data ?? []) as ScrapbookEntry[]
}

export async function getUserScrapbook(userId: string): Promise<ScrapbookEntry[]> {
  return getScrapbook(userId)
}

export async function checkScrapbookEntry(roundId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('scrapbook_entries')
    .select('id')
    .eq('round_id', roundId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function isRoundInScrapbook(roundId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  return checkScrapbookEntry(roundId, user.id)
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { RoundWithPrompt, NominationResult, Profile } from '@/types/database'

export async function getOrCreateTodayRound(groupId: string): Promise<RoundWithPrompt | null> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await admin
    .from('rounds')
    .select('*, prompt:prompts(*)')
    .eq('group_id', groupId)
    .eq('date', today)
    .maybeSingle()

  if (existing) return existing as RoundWithPrompt

  const promptId = await pickPromptForGroup(admin, groupId)
  if (!promptId) return null

  const { data: newRound, error } = await admin
    .from('rounds')
    .insert({ group_id: groupId, prompt_id: promptId, date: today })
    .select('*, prompt:prompts(*)')
    .single()

  if (error) {
    // Race condition — another request created it first
    const { data: raceResult } = await admin
      .from('rounds')
      .select('*, prompt:prompts(*)')
      .eq('group_id', groupId)
      .eq('date', today)
      .maybeSingle()
    return raceResult as RoundWithPrompt | null
  }

  return newRound as RoundWithPrompt
}

async function pickPromptForGroup(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string
): Promise<string | null> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  const { data: recentRounds } = await admin
    .from('rounds')
    .select('prompt_id')
    .eq('group_id', groupId)
    .gte('date', cutoff.toISOString().split('T')[0])

  const recentIds = (recentRounds ?? []).map((r) => r.prompt_id)

  const { data: prompts } = await admin.from('prompts').select('id')
  if (!prompts || prompts.length === 0) return null

  const available = prompts.filter((p) => !recentIds.includes(p.id))
  const pool = available.length > 0 ? available : prompts
  return pool[Math.floor(Math.random() * pool.length)].id
}

// Get all nomination data for a round
export async function getRoundData(roundId: string, userId: string) {
  const admin = createAdminClient()

  const { data: votes } = await admin
    .from('votes')
    .select('*, voter:profiles!voter_id(*), nominee:profiles!nominated_user_id(*)')
    .eq('round_id', roundId)

  const userVote = (votes ?? []).find((v) => v.voter_id === userId) ?? null

  // Tally nominations per user
  const countMap: Record<string, { profile: Profile; count: number; voters: Profile[] }> = {}
  for (const v of votes ?? []) {
    const uid = v.nominated_user_id
    if (!countMap[uid]) {
      countMap[uid] = { profile: v.nominee as Profile, count: 0, voters: [] }
    }
    countMap[uid].count++
    countMap[uid].voters.push(v.voter as Profile)
  }

  // Sort by votes descending, then by earliest nomination (stable tie-break)
  const nominations: NominationResult[] = Object.values(countMap)
    .map((e) => ({ profile: e.profile, vote_count: e.count, voter_profiles: e.voters }))
    .sort((a, b) => b.vote_count - a.vote_count)

  const winner = nominations.length > 0 && nominations[0].vote_count > 0
    ? nominations[0]
    : null

  return {
    nominations,
    userVote,
    winner,
    totalVotes: (votes ?? []).length,
  }
}

// Historical rounds with nomination tallies
export async function getGroupHistory(groupId: string) {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: rounds } = await admin
    .from('rounds')
    .select('*, prompt:prompts(*)')
    .eq('group_id', groupId)
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(30)

  if (!rounds || rounds.length === 0) return []

  return Promise.all(
    rounds.map(async (round) => {
      const { data: votes } = await admin
        .from('votes')
        .select('*, voter:profiles!voter_id(*), nominee:profiles!nominated_user_id(*)')
        .eq('round_id', round.id)

      const countMap: Record<string, { profile: Profile; count: number }> = {}
      for (const v of votes ?? []) {
        const uid = v.nominated_user_id
        if (!countMap[uid]) countMap[uid] = { profile: v.nominee as Profile, count: 0 }
        countMap[uid].count++
      }

      const nominations: NominationResult[] = Object.values(countMap)
        .map((e) => ({ profile: e.profile, vote_count: e.count }))
        .sort((a, b) => b.vote_count - a.vote_count)

      const winner = nominations.length > 0 ? nominations[0] : null

      return {
        round: round as RoundWithPrompt,
        nominations,
        winner: winner?.vote_count && winner.vote_count > 0 ? winner : null,
        totalVotes: (votes ?? []).length,
      }
    })
  )
}

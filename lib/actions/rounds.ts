'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RoundWithPrompt, NominationResult, Profile } from '@/types/database'
import { VALID_CATEGORIES, type CategoryChoice } from '@/lib/categories'

// ─── Get or create today's round ─────────────────────────────────────────────

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

  // Check yesterday's round for a winner-chosen category
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: previousRound } = await admin
    .from('rounds')
    .select('next_category')
    .eq('group_id', groupId)
    .eq('date', yesterdayStr)
    .maybeSingle()

  const preferredCategory = previousRound?.next_category ?? null

  const promptId = await pickPromptForGroup(admin, groupId, preferredCategory)
  if (!promptId) return null

  const { data: newRound, error } = await admin
    .from('rounds')
    .insert({ group_id: groupId, prompt_id: promptId, date: today })
    .select('*, prompt:prompts(*)')
    .single()

  if (error) {
    // Race condition — another request already created it
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

// ─── Pick a prompt, respecting category preference ───────────────────────────

async function pickPromptForGroup(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  preferredCategory: string | null,
): Promise<string | null> {
  // Prompts used in the last 60 days in this group (don't repeat)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  const { data: recentRounds } = await admin
    .from('rounds')
    .select('prompt_id')
    .eq('group_id', groupId)
    .gte('date', cutoff.toISOString().split('T')[0])

  const recentIds = new Set((recentRounds ?? []).map((r) => r.prompt_id))

  // Resolve the effective category
  const useCategory =
    preferredCategory && preferredCategory !== 'random'
      ? preferredCategory
      : null

  // Anti-repeat: if random, avoid the category used in the last 2 rounds
  let blockedCategory: string | null = null
  if (!useCategory) {
    const { data: lastTwo } = await admin
      .from('rounds')
      .select('prompt:prompts(category)')
      .eq('group_id', groupId)
      .order('date', { ascending: false })
      .limit(2)

    const lastCategories = (lastTwo ?? [])
      .map((r) => (r.prompt as any)?.category)
      .filter(Boolean)

    // Block a category only if it appeared in both of the last 2 rounds
    if (lastCategories.length === 2 && lastCategories[0] === lastCategories[1]) {
      blockedCategory = lastCategories[0]
    }
  }

  // Fetch candidate prompts
  const { data: allPrompts } = await admin.from('prompts').select('id, category')
  if (!allPrompts || allPrompts.length === 0) return null

  // Priority 1: preferred category, not recently used
  if (useCategory) {
    const fresh = allPrompts.filter(
      (p) => p.category === useCategory && !recentIds.has(p.id)
    )
    if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)].id

    // Fall back to any prompt in that category (even if recently used)
    const any = allPrompts.filter((p) => p.category === useCategory)
    if (any.length > 0) return any[Math.floor(Math.random() * any.length)].id
  }

  // Priority 2: unused prompts, avoiding blocked category
  const freshAny = allPrompts.filter(
    (p) => !recentIds.has(p.id) && p.category !== blockedCategory
  )
  if (freshAny.length > 0) return freshAny[Math.floor(Math.random() * freshAny.length)].id

  // Priority 3: any unused prompt (ignore blocked category)
  const anyFresh = allPrompts.filter((p) => !recentIds.has(p.id))
  if (anyFresh.length > 0) return anyFresh[Math.floor(Math.random() * anyFresh.length)].id

  // Fallback: pick anything (all prompts have been used recently)
  return allPrompts[Math.floor(Math.random() * allPrompts.length)].id
}

// ─── Winner chooses next category ────────────────────────────────────────────

export async function chooseNextCategory(formData: FormData) {
  const roundId  = formData.get('round_id') as string
  const groupId  = formData.get('group_id') as string
  const category = formData.get('category') as string

  if (!VALID_CATEGORIES.includes(category as CategoryChoice)) {
    return { error: 'Invalid category.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify this user actually won the round (most votes)
  const { data: votes } = await admin
    .from('votes')
    .select('nominated_user_id')
    .eq('round_id', roundId)

  if (!votes || votes.length === 0) {
    return { error: 'No votes found for this round.' }
  }

  const counts: Record<string, number> = {}
  for (const v of votes) {
    counts[v.nominated_user_id] = (counts[v.nominated_user_id] ?? 0) + 1
  }
  const topUserId = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0]

  if (topUserId !== user.id) {
    return { error: 'Only the winner can choose the next category.' }
  }

  // Prevent overwriting an already-set choice
  const { data: round } = await admin
    .from('rounds')
    .select('next_category')
    .eq('id', roundId)
    .single()

  if (round?.next_category) {
    return { error: 'Category already chosen.' }
  }

  const { error } = await admin
    .from('rounds')
    .update({ next_category: category })
    .eq('id', roundId)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

// ─── Round data (nominations tally) ──────────────────────────────────────────

export async function getRoundData(roundId: string, userId: string) {
  const admin = createAdminClient()

  const { data: votes } = await admin
    .from('votes')
    .select('*, voter:profiles!voter_id(*), nominee:profiles!nominated_user_id(*)')
    .eq('round_id', roundId)

  const userVote = (votes ?? []).find((v) => v.voter_id === userId) ?? null

  const countMap: Record<string, { profile: Profile; count: number; voters: Profile[]; comments: string[] }> = {}
  for (const v of votes ?? []) {
    const uid = v.nominated_user_id
    if (!countMap[uid]) countMap[uid] = { profile: v.nominee as Profile, count: 0, voters: [], comments: [] }
    countMap[uid].count++
    countMap[uid].voters.push(v.voter as Profile)
    if (v.comment) countMap[uid].comments.push(v.comment)
  }

  const nominations: NominationResult[] = Object.values(countMap)
    .map((e) => ({ profile: e.profile, vote_count: e.count, voter_profiles: e.voters, comments: e.comments }))
    .sort((a, b) => b.vote_count - a.vote_count)

  const winner = nominations.length > 0 && nominations[0].vote_count > 0
    ? nominations[0]
    : null

  return { nominations, userVote, winner, totalVotes: (votes ?? []).length }
}

// ─── Group history ────────────────────────────────────────────────────────────

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

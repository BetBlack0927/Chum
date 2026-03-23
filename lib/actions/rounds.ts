'use server'

import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
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
  // Get enabled categories for this group
  const { data: enabledCategoriesData } = await admin
    .from('group_categories')
    .select('category')
    .eq('group_id', groupId)

  // If no rows exist, all categories are available (backward compatibility)
  const enabledCategories = enabledCategoriesData && enabledCategoriesData.length > 0
    ? new Set(enabledCategoriesData.map(row => row.category))
    : null

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
  const { data: allPrompts, error: promptsError } = await admin.from('prompts').select('id, category')
  
  if (promptsError) {
    console.error('Error fetching prompts:', promptsError)
    return null
  }
  
  if (!allPrompts || allPrompts.length === 0) {
    console.error('No prompts found in database. Have you run seed.sql?')
    return null
  }

  // Filter prompts by enabled categories (if specified)
  const availablePrompts = enabledCategories
    ? allPrompts.filter(p => p.category && enabledCategories.has(p.category))
    : allPrompts

  if (availablePrompts.length === 0) {
    console.error(`No prompts available after filtering. Enabled categories: ${enabledCategories ? Array.from(enabledCategories).join(', ') : 'all'}, Total prompts: ${allPrompts.length}`)
    return null
  }

  // Priority 1: preferred category, not recently used
  if (useCategory) {
    const fresh = availablePrompts.filter(
      (p) => p.category === useCategory && !recentIds.has(p.id)
    )
    if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)].id

    // Fall back to any prompt in that category (even if recently used)
    const any = availablePrompts.filter((p) => p.category === useCategory)
    if (any.length > 0) return any[Math.floor(Math.random() * any.length)].id
  }

  // Priority 2: unused prompts, avoiding blocked category
  const freshAny = availablePrompts.filter(
    (p) => !recentIds.has(p.id) && p.category !== blockedCategory
  )
  if (freshAny.length > 0) return freshAny[Math.floor(Math.random() * freshAny.length)].id

  // Priority 3: any unused prompt (ignore blocked category)
  const anyFresh = availablePrompts.filter((p) => !recentIds.has(p.id))
  if (anyFresh.length > 0) return anyFresh[Math.floor(Math.random() * anyFresh.length)].id

  // Fallback: pick anything (all prompts have been used recently)
  return availablePrompts[Math.floor(Math.random() * availablePrompts.length)].id
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

// ─── Admin: reroll today's prompt ────────────────────────────────────────────

export async function rerollPrompt(roundId: string, groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify caller is an admin of this group
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only the group admin can reroll the prompt.' }
  }

  // Fetch the current round
  const { data: round } = await admin
    .from('rounds')
    .select('*, prompt:prompts(*)')
    .eq('id', roundId)
    .single()

  if (!round) return { error: 'Round not found.' }

  if (round.prompt_rerolled) {
    return { error: 'You already used today\'s reroll.' }
  }

  // Block reroll once any votes exist
  const { count: voteCount } = await admin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('round_id', roundId)

  if ((voteCount ?? 0) > 0) {
    return { error: 'Can\'t reroll after voting has started.' }
  }

  // Pick a new prompt — reuse existing logic.
  // The current prompt is in recentIds (it's in today's round) so it will be skipped.
  const currentCategory = (round.prompt as any)?.category ?? null
  const newPromptId = await pickPromptForGroup(admin, groupId, currentCategory)

  if (!newPromptId) {
    return { error: 'No alternative prompts available right now.' }
  }

  const { error: updateError } = await admin
    .from('rounds')
    .update({ prompt_id: newPromptId, prompt_rerolled: true })
    .eq('id', roundId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

// ─── Round data (nominations tally) ──────────────────────────────────────────

export async function getRoundData(roundId: string, userId: string) {
  // Cache round data for 5 seconds - voting changes frequently but reduce redundant fetches
  return unstable_cache(
    async (roundId: string, userId: string) => {
      const admin = createAdminClient()

      // Parallelize independent queries for better performance
      const [votesBasic, userVoteData, revealedVoterId] = await Promise.all([
        // Get all votes with nominee profiles only (no need for voter profiles in most queries)
        admin
          .from('votes')
          .select('nominated_user_id, comment, profiles!nominated_user_id(id, username, avatar_color, created_at)')
          .eq('round_id', roundId),
        
        // Get user's specific vote separately
        admin
          .from('votes')
          .select('*')
          .eq('round_id', roundId)
          .eq('voter_id', userId)
          .maybeSingle(),
        
        // Get or set revealed voter
        ensureRevealedVoterId(admin, roundId)
      ])

      const votes = votesBasic.data ?? []
      const userVote = userVoteData.data ?? null

      // Tally nominations (more efficient with reduced data)
      const countMap: Record<string, { profile: Profile; count: number; comments: string[] }> = {}
      for (const v of votes) {
        const uid = v.nominated_user_id
        const profile = v.profiles as unknown as Profile
        if (!countMap[uid]) {
          countMap[uid] = { 
            profile, 
            count: 0, 
            comments: [] 
          }
        }
        countMap[uid].count++
        if (v.comment) countMap[uid].comments.push(v.comment)
      }

      const nominations: NominationResult[] = Object.values(countMap)
        .map((e) => ({ profile: e.profile, vote_count: e.count, comments: e.comments }))
        .sort((a, b) => b.vote_count - a.vote_count)

      const winner = nominations.length > 0 && nominations[0].vote_count > 0
        ? nominations[0]
        : null

      // Collect all comments with their nominee context
      const allComments = votes
        .filter((v) => !!v.comment)
        .map((v) => ({
          comment: v.comment as string,
          nomineeUsername: (v.profiles as unknown as Profile).username,
        }))

      // Get revealed voter details if set
      let revealedVoter: Profile | null = null
      let revealedVoterNominee: Profile | null = null
      
      if (revealedVoterId) {
        const { data: revealedVoteData } = await admin
          .from('votes')
          .select('voter_id, nominated_user_id')
          .eq('round_id', roundId)
          .eq('voter_id', revealedVoterId)
          .maybeSingle()
        
        if (revealedVoteData) {
          // Fetch profiles separately for cleaner typing
          const [voterProfile, nomineeProfile] = await Promise.all([
            admin.from('profiles').select('*').eq('id', revealedVoteData.voter_id).single(),
            admin.from('profiles').select('*').eq('id', revealedVoteData.nominated_user_id).single()
          ])
          revealedVoter = voterProfile.data
          revealedVoterNominee = nomineeProfile.data
        }
      }

      return {
        nominations,
        userVote,
        winner,
        totalVotes: votes.length,
        allComments,
        revealedVoter,
        revealedVoterNominee,
      }
    },
    [`round-data-${roundId}-${userId}`],
    { revalidate: 5, tags: [`round-${roundId}`] }
  )(roundId, userId)
}

// Get or set the revealed voter ID (optimized version)
async function ensureRevealedVoterId(
  admin: ReturnType<typeof createAdminClient>,
  roundId: string
): Promise<string | null> {
  // Check if already set
  const { data: round } = await admin
    .from('rounds')
    .select('revealed_voter_id')
    .eq('id', roundId)
    .single()

  if (round?.revealed_voter_id) {
    return round.revealed_voter_id as string
  }

  // Get all voter IDs to pick one
  const { data: votes } = await admin
    .from('votes')
    .select('voter_id')
    .eq('round_id', roundId)

  if (!votes || votes.length === 0) return null

  // Pick a random voter
  const picked = votes[Math.floor(Math.random() * votes.length)]
  const revealedId = picked.voter_id

  // Store it atomically (IS NULL guard prevents overwrites)
  await admin
    .from('rounds')
    .update({ revealed_voter_id: revealedId })
    .eq('id', roundId)
    .is('revealed_voter_id', null)

  // Re-fetch to handle race conditions
  const { data: updated } = await admin
    .from('rounds')
    .select('revealed_voter_id')
    .eq('id', roundId)
    .single()

  return (updated?.revealed_voter_id as string) ?? revealedId
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

  // Fetch all votes for all rounds in a single query (prevents N+1)
  const roundIds = rounds.map(r => r.id)
  const { data: allVotes } = await admin
    .from('votes')
    .select('round_id, nominated_user_id, profiles!nominated_user_id(id, username, avatar_color, created_at)')
    .in('round_id', roundIds)

  // Group votes by round_id
  const votesByRound: Record<string, NonNullable<typeof allVotes>> = {}
  for (const vote of allVotes ?? []) {
    if (!votesByRound[vote.round_id]) {
      votesByRound[vote.round_id] = []
    }
    votesByRound[vote.round_id]!.push(vote)
  }

  // Process each round with its votes
  return rounds.map((round) => {
    const votes = votesByRound[round.id] ?? []

    const countMap: Record<string, { profile: Profile; count: number }> = {}
    for (const v of votes) {
      const uid = v.nominated_user_id
      const profile = v.profiles as unknown as Profile
      if (!countMap[uid]) countMap[uid] = { profile, count: 0 }
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
      totalVotes: votes.length,
    }
  })
}

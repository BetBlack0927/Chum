'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VALID_CATEGORIES } from '@/lib/categories'
import type { ShopPrompt, PromptPack, PackWithPrompts, CreatorProfile } from '@/types/database'

const MAX_PROMPT_TEXT  = 200
const MAX_PACK_PROMPTS = 30

// ─── Browse / Search ─────────────────────────────────────────────────────────

export async function getShopFeed(options?: {
  type?: 'all' | 'prompts' | 'packs'
  category?: string
  query?: string
  limit?: number
  offset?: number
}): Promise<{ prompts: ShopPrompt[]; packs: PromptPack[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { prompts: [], packs: [] }

  const admin = createAdminClient()
  const { type = 'all', category, query, limit = 30, offset = 0 } = options ?? {}

  // Pre-fetch IDs of prompts that live inside a pack so we can exclude them at
  // the DB level. Done first (sequential) to guarantee the exclusion list is
  // ready before the main prompts query runs.
  let packPromptIdList: string[] = []
  if (type !== 'packs') {
    const { data: ppData } = await admin.from('pack_prompts').select('prompt_id')
    packPromptIdList = (ppData ?? []).map((r: any) => r.prompt_id as string)
  }

  const [promptsResult, packsResult, savedPromptsResult, savedPacksResult] = await Promise.all([
    // Individual prompts — DB-level exclusion of any prompt that belongs to a pack
    type !== 'packs' ? (async () => {
      let q = admin
        .from('prompts')
        .select('*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at)')
        .not('creator_id', 'is', null)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (packPromptIdList.length > 0) {
        // Exclude prompts that are part of any pack
        q = q.not('id', 'in', `(${packPromptIdList.join(',')})`)
      }
      if (category && category !== 'all') q = q.eq('category', category)
      if (query) q = q.ilike('text', `%${query}%`)
      return q
    })() : Promise.resolve({ data: [] }),

    // Packs
    type !== 'prompts' ? (async () => {
      let q = admin
        .from('prompt_packs')
        .select(`
          *,
          creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at),
          prompt_count:pack_prompts(count)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (query) q = q.ilike('name', `%${query}%`)
      return q
    })() : Promise.resolve({ data: [] }),

    // User's saved prompts and packs
    admin.from('saved_prompts').select('prompt_id').eq('user_id', user.id),
    admin.from('saved_packs').select('pack_id').eq('user_id', user.id),
  ])

  const savedPromptIds = new Set((savedPromptsResult.data ?? []).map((r: any) => r.prompt_id))
  const savedPackIds   = new Set((savedPacksResult.data  ?? []).map((r: any) => r.pack_id))

  const prompts: ShopPrompt[] = (promptsResult.data ?? []).map((p: any) => ({
    ...p,
    is_saved: savedPromptIds.has(p.id),
  }))

  const packs: PromptPack[] = (packsResult.data ?? []).map((p: any) => ({
    ...p,
    prompt_count: p.prompt_count?.[0]?.count ?? 0,
    is_saved: savedPackIds.has(p.id),
  }))

  return { prompts, packs }
}

export async function getFollowingFeed(userId: string): Promise<{
  prompts: ShopPrompt[]
  packs: PromptPack[]
}> {
  const admin = createAdminClient()

  const { data: follows } = await admin
    .from('creator_follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (!follows || follows.length === 0) return { prompts: [], packs: [] }

  const followingIds = follows.map((f: any) => f.following_id)

  // Pre-fetch pack prompt IDs to exclude from individual feed
  const { data: ppData } = await admin.from('pack_prompts').select('prompt_id')
  const packPromptIdList = (ppData ?? []).map((r: any) => r.prompt_id as string)

  const [promptsResult, packsResult] = await Promise.all([
    (async () => {
      let q = admin
        .from('prompts')
        .select('*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at)')
        .in('creator_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20)

      if (packPromptIdList.length > 0) {
        q = q.not('id', 'in', `(${packPromptIdList.join(',')})`)
      }
      return q
    })(),
    admin
      .from('prompt_packs')
      .select(`
        *,
        creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at),
        prompt_count:pack_prompts(count)
      `)
      .in('creator_id', followingIds)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return {
    prompts: promptsResult.data ?? [],
    packs: (packsResult.data ?? []).map((p: any) => ({
      ...p,
      prompt_count: p.prompt_count?.[0]?.count ?? 0,
    })),
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createShopPrompt(formData: FormData) {
  const text        = (formData.get('text') as string).trim()
  const category    = formData.get('category') as string
  const description = (formData.get('description') as string | null)?.trim() || null
  const visibility  = (formData.get('visibility') as string) === 'private' ? 'private' : 'public'

  if (!text || text.length < 5)       return { error: 'Prompt must be at least 5 characters.' }
  if (text.length > MAX_PROMPT_TEXT)  return { error: `Prompt must be ${MAX_PROMPT_TEXT} characters or fewer.` }
  if (!VALID_CATEGORIES.includes(category as any) || category === 'random') {
    return { error: 'Please select a valid category.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prompts')
    .insert({ text, category, description, visibility, creator_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/shop')
  revalidatePath(`/creators`)
  return { success: true, promptId: data.id }
}

export async function createPack(formData: FormData) {
  const name        = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const visibility  = (formData.get('visibility') as string) === 'private' ? 'private' : 'public'

  // Prompts are passed as JSON array: [{text, category, description}]
  const promptsRaw = formData.get('prompts') as string
  let promptItems: { text: string; category: string; description?: string }[] = []
  try {
    promptItems = JSON.parse(promptsRaw)
  } catch {
    return { error: 'Invalid prompt data.' }
  }

  if (!name || name.length < 2)         return { error: 'Pack name must be at least 2 characters.' }
  if (promptItems.length < 2)           return { error: 'A pack must have at least 2 prompts.' }
  if (promptItems.length > MAX_PACK_PROMPTS) return { error: `Packs can have at most ${MAX_PACK_PROMPTS} prompts.` }

  for (const p of promptItems) {
    if (!p.text?.trim() || p.text.trim().length < 5) return { error: 'Each prompt must be at least 5 characters.' }
    if (p.text.trim().length > MAX_PROMPT_TEXT)       return { error: `Each prompt must be ${MAX_PROMPT_TEXT} chars or fewer.` }
    if (!VALID_CATEGORIES.includes(p.category as any) || p.category === 'random') {
      return { error: 'Each prompt needs a valid category.' }
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Create pack
  const { data: pack, error: packError } = await admin
    .from('prompt_packs')
    .insert({ name, description, visibility, creator_id: user.id })
    .select('id')
    .single()

  if (packError) return { error: packError.message }

  // Create prompts and link them
  const promptInserts = promptItems.map((p) => ({
    text: p.text.trim(),
    category: p.category,
    description: p.description?.trim() || null,
    visibility,
    creator_id: user.id,
  }))

  const { data: createdPrompts, error: promptsError } = await admin
    .from('prompts')
    .insert(promptInserts)
    .select('id')

  if (promptsError) return { error: promptsError.message }

  const packPromptInserts = (createdPrompts ?? []).map((p: any, i: number) => ({
    pack_id: pack.id,
    prompt_id: p.id,
    position: i,
  }))

  await admin.from('pack_prompts').insert(packPromptInserts)

  revalidatePath('/shop')
  return { success: true, packId: pack.id }
}

// ─── Pack Detail ─────────────────────────────────────────────────────────────

export async function getPackDetail(packId: string): Promise<PackWithPrompts | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: pack } = await admin
    .from('prompt_packs')
    .select('*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at)')
    .eq('id', packId)
    .single()

  if (!pack) return null
  if (pack.visibility === 'private' && pack.creator_id !== user.id) return null

  const { data: packPromptsRows } = await admin
    .from('pack_prompts')
    .select('position, prompts(*)')
    .eq('pack_id', packId)
    .order('position', { ascending: true })

  const prompts: ShopPrompt[] = (packPromptsRows ?? []).map((row: any) => row.prompts)

  const { data: savedPack } = await admin
    .from('saved_packs')
    .select('pack_id')
    .eq('user_id', user.id)
    .eq('pack_id', packId)
    .maybeSingle()

  return {
    ...pack,
    prompts,
    prompt_count: prompts.length,
    is_saved: !!savedPack,
  }
}

// ─── Creator Profile ─────────────────────────────────────────────────────────

export async function getCreatorProfile(username: string): Promise<CreatorProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!profile) return null

  const [followersResult, followingResult, promptsResult, packsResult, isFollowingResult] = await Promise.all([
    admin.from('creator_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
    admin.from('creator_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    admin.from('prompts').select('id', { count: 'exact', head: true }).eq('creator_id', profile.id).eq('visibility', 'public'),
    admin.from('prompt_packs').select('id', { count: 'exact', head: true }).eq('creator_id', profile.id).eq('visibility', 'public'),
    user.id !== profile.id
      ? admin.from('creator_follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    ...profile,
    bio: profile.bio ?? null,
    follower_count:  followersResult.count  ?? 0,
    following_count: followingResult.count  ?? 0,
    prompt_count:    promptsResult.count    ?? 0,
    pack_count:      packsResult.count      ?? 0,
    is_following:    !!(isFollowingResult as any)?.data,
  }
}

export async function getCreatorPrompts(creatorId: string): Promise<ShopPrompt[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('prompts')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getCreatorPacks(creatorId: string): Promise<PromptPack[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('prompt_packs')
    .select('*, prompt_count:pack_prompts(count)')
    .eq('creator_id', creatorId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  return (data ?? []).map((p: any) => ({
    ...p,
    prompt_count: p.prompt_count?.[0]?.count ?? 0,
  }))
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export async function toggleFollowCreator(followingId: string): Promise<{ following: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { following: false, error: 'Not authenticated.' }

  if (user.id === followingId) return { following: false, error: "You can't follow yourself." }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('creator_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle()

  if (existing) {
    await admin.from('creator_follows').delete().eq('follower_id', user.id).eq('following_id', followingId)
    revalidatePath('/shop')
    return { following: false }
  } else {
    await admin.from('creator_follows').insert({ follower_id: user.id, following_id: followingId })
    revalidatePath('/shop')
    return { following: true }
  }
}

// ─── Save / Unsave ────────────────────────────────────────────────────────────

export async function toggleSavePrompt(promptId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { saved: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('saved_prompts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('prompt_id', promptId)
    .maybeSingle()

  if (existing) {
    await admin.from('saved_prompts').delete().eq('user_id', user.id).eq('prompt_id', promptId)
    return { saved: false }
  } else {
    await admin.from('saved_prompts').insert({ user_id: user.id, prompt_id: promptId })
    return { saved: true }
  }
}

export async function toggleSavePack(packId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { saved: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('saved_packs')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('pack_id', packId)
    .maybeSingle()

  if (existing) {
    await admin.from('saved_packs').delete().eq('user_id', user.id).eq('pack_id', packId)
    return { saved: false }
  } else {
    await admin.from('saved_packs').insert({ user_id: user.id, pack_id: packId })
    return { saved: true }
  }
}

// ─── Add to Group ─────────────────────────────────────────────────────────────

export async function addPromptToGroups(promptId: string, groupIds: string[]): Promise<{ success: boolean; error?: string }> {
  if (!groupIds.length) return { success: false, error: 'Select at least one group.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify user is a member of all selected groups
  const { data: memberships } = await admin
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .in('group_id', groupIds)

  const memberGroupIds = new Set((memberships ?? []).map((m: any) => m.group_id))
  const unauthorized = groupIds.filter((id) => !memberGroupIds.has(id))
  if (unauthorized.length > 0) return { success: false, error: 'You are not a member of all selected groups.' }

  const inserts = groupIds.map((group_id) => ({
    group_id,
    prompt_id: promptId,
    added_by: user.id,
  }))

  // Use upsert to ignore duplicates
  const { error } = await admin
    .from('group_prompts')
    .upsert(inserts, { onConflict: 'group_id,prompt_id', ignoreDuplicates: true })

  if (error) return { success: false, error: error.message }

  groupIds.forEach((id) => revalidatePath(`/groups/${id}`))
  return { success: true }
}

export async function addPackToGroups(packId: string, groupIds: string[]): Promise<{ success: boolean; error?: string; addedCount?: number }> {
  if (!groupIds.length) return { success: false, error: 'Select at least one group.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify membership
  const { data: memberships } = await admin
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .in('group_id', groupIds)

  const memberGroupIds = new Set((memberships ?? []).map((m: any) => m.group_id))
  const unauthorized = groupIds.filter((id) => !memberGroupIds.has(id))
  if (unauthorized.length > 0) return { success: false, error: 'You are not a member of all selected groups.' }

  // Get all prompts in the pack
  const { data: packPrompts } = await admin
    .from('pack_prompts')
    .select('prompt_id')
    .eq('pack_id', packId)

  if (!packPrompts || packPrompts.length === 0) return { success: false, error: 'Pack has no prompts.' }

  const inserts = groupIds.flatMap((group_id) =>
    packPrompts.map((pp: any) => ({
      group_id,
      prompt_id: pp.prompt_id,
      added_by: user.id,
    }))
  )

  const { error } = await admin
    .from('group_prompts')
    .upsert(inserts, { onConflict: 'group_id,prompt_id', ignoreDuplicates: true })

  if (error) return { success: false, error: error.message }

  // Increment pack-level add_count by the number of groups selected
  await admin.rpc('increment_pack_add_count', {
    p_pack_id: packId,
    p_delta:   groupIds.length,
  })

  groupIds.forEach((id) => revalidatePath(`/groups/${id}`))
  return { success: true, addedCount: packPrompts.length }
}

// ─── User's groups (for Add-to-Group picker) ──────────────────────────────────

export async function getMyGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('group_members')
    .select('groups(id, name)')
    .eq('user_id', user.id)

  return (data ?? []).map((row: any) => row.groups).filter(Boolean) as { id: string; name: string }[]
}

// Returns groups with a flag showing whether the given prompt is already in each group
export async function getMyGroupsForPrompt(promptId: string): Promise<{
  id: string
  name: string
  alreadyAdded: boolean
}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  const [membershipsResult, assignedResult] = await Promise.all([
    admin.from('group_members').select('groups(id, name)').eq('user_id', user.id),
    admin.from('group_prompts').select('group_id').eq('prompt_id', promptId),
  ])

  const assignedGroupIds = new Set((assignedResult.data ?? []).map((r: any) => r.group_id))

  return (membershipsResult.data ?? [])
    .map((row: any) => row.groups)
    .filter(Boolean)
    .map((g: any) => ({ id: g.id, name: g.name, alreadyAdded: assignedGroupIds.has(g.id) }))
}

export async function getMyGroupsForPack(packId: string): Promise<{
  id: string
  name: string
  alreadyAdded: boolean
}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // Get the user's groups and all prompt IDs that belong to this pack in parallel
  const [membershipsResult, packPromptsResult] = await Promise.all([
    admin.from('group_members').select('groups(id, name)').eq('user_id', user.id),
    admin.from('pack_prompts').select('prompt_id').eq('pack_id', packId),
  ])

  const packPromptIds = (packPromptsResult.data ?? []).map((r: any) => r.prompt_id as string)

  if (packPromptIds.length === 0) {
    return (membershipsResult.data ?? [])
      .map((row: any) => row.groups)
      .filter(Boolean)
      .map((g: any) => ({ id: g.id, name: g.name, alreadyAdded: false }))
  }

  // For each group, check how many of the pack's prompts are already added
  const groups = (membershipsResult.data ?? [])
    .map((row: any) => row.groups)
    .filter(Boolean) as { id: string; name: string }[]

  if (groups.length === 0) return []

  const groupIds = groups.map((g) => g.id)

  // Fetch all group_prompts rows for these groups that match pack prompt IDs
  const { data: assignedRows } = await admin
    .from('group_prompts')
    .select('group_id, prompt_id')
    .in('group_id', groupIds)
    .in('prompt_id', packPromptIds)

  // Build a map: groupId -> how many pack prompts are already there
  const countByGroup: Record<string, number> = {}
  for (const row of assignedRows ?? []) {
    countByGroup[row.group_id] = (countByGroup[row.group_id] ?? 0) + 1
  }

  return groups.map((g) => ({
    id:           g.id,
    name:         g.name,
    // Consider "already added" if at least one prompt from the pack is in the group
    alreadyAdded: (countByGroup[g.id] ?? 0) >= packPromptIds.length,
  }))
}

// ─── Popular items ────────────────────────────────────────────────────────────

export async function getPopularItems(limit = 5): Promise<{
  prompts: ShopPrompt[]
  packs: PromptPack[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { prompts: [], packs: [] }

  const admin = createAdminClient()

  // Window: last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // All group_prompts rows from the past week — this is the source of truth for
  // "what got added this week". We pull prompt_id + group_id so we can count
  // both individual-prompt popularity and pack popularity (via pack_prompts join).
  const { data: recentAdds } = await admin
    .from('group_prompts')
    .select('prompt_id, group_id')
    .gte('added_at', oneWeekAgo)

  if (!recentAdds || recentAdds.length === 0) return { prompts: [], packs: [] }

  // Count how many group additions each prompt received this week
  const promptWeekCount: Record<string, number> = {}
  for (const row of recentAdds) {
    promptWeekCount[row.prompt_id] = (promptWeekCount[row.prompt_id] ?? 0) + 1
  }

  const recentPromptIds = Object.keys(promptWeekCount)

  // Resolve which of the recent prompts belong to packs (run in parallel with
  // getting all pack-prompt IDs for the individual-prompt exclusion list)
  const [packPromptRows, allPackPromptsResult, savedPromptsResult, savedPacksResult] = await Promise.all([
    admin.from('pack_prompts').select('pack_id, prompt_id').in('prompt_id', recentPromptIds),
    admin.from('pack_prompts').select('prompt_id'),
    admin.from('saved_prompts').select('prompt_id').eq('user_id', user.id),
    admin.from('saved_packs').select('pack_id').eq('user_id', user.id),
  ])

  const allPackPromptIds = new Set(
    (allPackPromptsResult.data ?? []).map((r: any) => r.prompt_id as string)
  )

  // Count distinct groups per pack this week
  const packGroupSets: Record<string, Set<string>> = {}
  for (const pp of packPromptRows.data ?? []) {
    if (!packGroupSets[pp.pack_id]) packGroupSets[pp.pack_id] = new Set()
    // Every group that added this prompt contributes to the pack's weekly count
    for (const row of recentAdds) {
      if (row.prompt_id === pp.prompt_id) {
        packGroupSets[pp.pack_id].add(row.group_id)
      }
    }
  }

  // Top individual prompt IDs (not pack prompts), sorted descending by week count
  const topPromptIds = Object.entries(promptWeekCount)
    .filter(([id]) => !allPackPromptIds.has(id))
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => id)

  // Top pack IDs sorted descending by distinct-group week count
  const topPackIds = Object.entries(packGroupSets)
    .map(([pack_id, groups]) => ({ pack_id, count: groups.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ pack_id }) => pack_id)

  // Fetch actual rows (only if we have IDs to look up)
  const [promptsResult, packsResult] = await Promise.all([
    topPromptIds.length > 0
      ? admin
          .from('prompts')
          .select('*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at)')
          .in('id', topPromptIds)
          .eq('visibility', 'public')
      : Promise.resolve({ data: [] }),

    topPackIds.length > 0
      ? admin
          .from('prompt_packs')
          .select(`
            *,
            creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at),
            prompt_count:pack_prompts(count)
          `)
          .in('id', topPackIds)
          .eq('visibility', 'public')
      : Promise.resolve({ data: [] }),
  ])

  const savedPromptIds = new Set((savedPromptsResult.data ?? []).map((r: any) => r.prompt_id))
  const savedPackIds   = new Set((savedPacksResult.data ?? []).map((r: any) => r.pack_id))

  // Re-sort by weekly count (DB returns .in() results in undefined order)
  const promptsMap = Object.fromEntries((promptsResult.data ?? []).map((p: any) => [p.id, p]))
  const prompts: ShopPrompt[] = topPromptIds
    .map((id) => promptsMap[id])
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      add_count: promptWeekCount[p.id] ?? 0,
      creator:   p.creator ?? undefined,
      is_saved:  savedPromptIds.has(p.id),
    }))

  const packsMap = Object.fromEntries((packsResult.data ?? []).map((p: any) => [p.id, p]))
  const packs: PromptPack[] = topPackIds
    .map((id) => packsMap[id])
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      add_count:    packGroupSets[p.id]?.size ?? 0,
      prompt_count: Array.isArray(p.prompt_count) ? p.prompt_count[0]?.count ?? 0 : (p.prompt_count ?? 0),
      creator:      p.creator ?? undefined,
      is_saved:     savedPackIds.has(p.id),
    }))

  return { prompts, packs }
}

// ─── Saved items ──────────────────────────────────────────────────────────────

export async function getSavedItems(userId: string): Promise<{
  prompts: ShopPrompt[]
  packs: PromptPack[]
}> {
  const admin = createAdminClient()

  const [savedPromptsResult, savedPacksResult] = await Promise.all([
    admin
      .from('saved_prompts')
      .select('prompts(*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin
      .from('saved_packs')
      .select('prompt_packs(*, creator:profiles!creator_id(id, username, avatar_color, avatar_url, created_at), prompt_count:pack_prompts(count))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const prompts: ShopPrompt[] = (savedPromptsResult.data ?? [])
    .map((row: any) => row.prompts)
    .filter(Boolean)
    .map((p: any) => ({ ...p, is_saved: true }))

  const packs: PromptPack[] = (savedPacksResult.data ?? [])
    .map((row: any) => row.prompt_packs)
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      prompt_count: p.prompt_count?.[0]?.count ?? 0,
      is_saved: true,
    }))

  return { prompts, packs }
}

// ─── Group custom prompts management ─────────────────────────────────────────

export async function getGroupCustomPrompts(groupId: string): Promise<{
  id: string
  text: string
  category: string | null
  creatorUsername: string | null
  addedAt: string
}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // Two flat queries — avoids brittle nested-join PostgREST syntax
  const { data: gpRows } = await admin
    .from('group_prompts')
    .select('prompt_id, added_at')
    .eq('group_id', groupId)
    .order('added_at', { ascending: false })

  if (!gpRows || gpRows.length === 0) return []

  const promptIds = gpRows.map((r: any) => r.prompt_id as string)

  const { data: promptRows } = await admin
    .from('prompts')
    .select('id, text, category, creator_id')
    .in('id', promptIds)

  // Collect unique creator IDs so we can resolve usernames
  const creatorIds = [
    ...new Set(
      (promptRows ?? [])
        .map((p: any) => p.creator_id)
        .filter(Boolean) as string[]
    ),
  ]

  let usernameMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username')
      .in('id', creatorIds)
    usernameMap = Object.fromEntries(
      (profiles ?? []).map((p: any) => [p.id, p.username])
    )
  }

  // Re-order results to match the original added_at order from group_prompts
  const promptMap = Object.fromEntries(
    (promptRows ?? []).map((p: any) => [p.id, p])
  )

  return gpRows
    .map((row: any) => {
      const p = promptMap[row.prompt_id]
      if (!p) return null
      return {
        id:              p.id as string,
        text:            p.text as string,
        category:        p.category as string | null,
        creatorUsername: p.creator_id ? (usernameMap[p.creator_id] ?? null) : null,
        addedAt:         row.added_at as string,
      }
    })
    .filter(Boolean) as { id: string; text: string; category: string | null; creatorUsername: string | null; addedAt: string }[]
}

export async function removePromptFromGroup(
  groupId: string,
  promptId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Only group members can remove
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { success: false, error: 'You are not a member of this group.' }

  const { error } = await admin
    .from('group_prompts')
    .delete()
    .eq('group_id', groupId)
    .eq('prompt_id', promptId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/groups/${groupId}/settings`)
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

// ─── Update creator bio ───────────────────────────────────────────────────────

export async function updateBio(bio: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ bio: bio.trim() || null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

// ─── Delete own prompt ────────────────────────────────────────────────────────

export async function deleteShopPrompt(promptId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop')
  return { success: true }
}

export async function deletePack(packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('prompt_packs')
    .delete()
    .eq('id', packId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop')
  redirect('/shop')
}

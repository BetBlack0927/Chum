'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VALID_CATEGORIES } from '@/lib/categories'

export async function createGroup(formData: FormData) {
  const name        = (formData.get('name')        as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const categories  = formData.getAll('categories') as string[]

  if (!name || name.length < 2) {
    return { error: 'Group name must be at least 2 characters.' }
  }
  if (name.length > 40) {
    return { error: 'Group name must be 40 characters or fewer.' }
  }

  // Validate categories
  if (categories.length === 0) {
    return { error: 'Please select at least one prompt category.' }
  }
  const validCategories = categories.filter(c => 
    VALID_CATEGORIES.includes(c as any) && c !== 'random'
  )
  if (validCategories.length === 0) {
    return { error: 'Invalid categories selected.' }
  }

  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const inviteCode = generateInviteCode()

  // Use admin client for writes so RLS JWT issues don't block server actions
  const admin = createAdminClient()

  const { data: group, error: groupError } = await admin
    .from('groups')
    .insert({ name, description, invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (groupError) return { error: groupError.message }

  // Creator becomes admin member
  const { error: memberError } = await admin
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin', join_method: 'creator' })

  if (memberError) return { error: memberError.message }

  // Save enabled categories
  const categoryInserts = validCategories.map(cat => ({
    group_id: group.id,
    category: cat
  }))
  
  const { error: categoriesError } = await admin
    .from('group_categories')
    .insert(categoryInserts)

  if (categoriesError) {
    // Non-fatal - log but don't block group creation
    console.error('Failed to save group categories:', categoriesError)
  }

  revalidatePath('/groups')
  redirect(`/groups/${group.id}`)
}

export async function joinGroup(formData: FormData) {
  const code = (formData.get('code') as string).trim().toUpperCase()
  if (!code) return { error: 'Please enter an invite code.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Find group by invite code (read — anon client is fine with RLS)
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', code)
    .maybeSingle()

  // If RLS blocks the read (user not yet a member), try with admin client
  const resolvedGroup = group ?? await (async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('groups')
      .select('id, name')
      .eq('invite_code', code)
      .maybeSingle()
    return data
  })()

  if (!resolvedGroup) {
    return { error: 'Invalid invite code. Double-check and try again.' }
  }

  // Check if already a member
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('group_members')
    .select('id')
    .eq('group_id', resolvedGroup.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect(`/groups/${resolvedGroup.id}`)
  }

  const { error: joinError } = await admin
    .from('group_members')
    .insert({ group_id: resolvedGroup.id, user_id: user.id, role: 'member', join_method: 'code' })

  if (joinError) return { error: joinError.message }

  revalidatePath('/groups')
  redirect(`/groups/${resolvedGroup.id}`)
}

export async function joinGroupByCode(code: string, userId: string) {
  const inviteCode = code.trim().toUpperCase()
  
  if (!inviteCode) {
    return { success: false, error: 'Please provide an invite code.' }
  }

  const admin = createAdminClient()

  // Find group by invite code
  const { data: group, error: groupError } = await admin
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (!group) {
    return { success: false, error: 'Invalid invite code. Please check and try again.' }
  }

  // Check if already a member
  const { data: existing } = await admin
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Already a member - still considered success
    return { 
      success: true, 
      groupId: group.id, 
      groupName: group.name,
      alreadyMember: true 
    }
  }

  // Join the group
  const { error: joinError } = await admin
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member', join_method: 'link' })

  if (joinError) {
    return { success: false, error: joinError.message }
  }

  revalidatePath('/groups')
  
  return { 
    success: true, 
    groupId: group.id, 
    groupName: group.name,
    alreadyMember: false 
  }
}

export async function leaveGroup(groupId: string, userId: string) {
  const admin = createAdminClient()

  // Check if user is a member
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    return { success: false, error: 'You are not a member of this group.' }
  }

  // Check if user is the last admin
  const { data: admins } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'admin')

  if (admins && admins.length === 1 && admins[0].user_id === userId) {
    // Check if there are other members
    const { data: allMembers } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (allMembers && allMembers.length > 1) {
      return { 
        success: false, 
        error: 'You are the only admin. Please promote another member to admin before leaving.' 
      }
    }
  }

  // Remove the user from the group
  const { error: deleteError } = await admin
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath('/groups')
  revalidatePath(`/groups/${groupId}`)

  return { success: true }
}

// ─── Update group avatar (admin only) ────────────────────────────────────────

export async function updateGroupAvatarUrl(groupId: string, url: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify the caller is an admin of this group
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only group admins can change the group photo.' }
  }

  const { error } = await admin
    .from('groups')
    .update({ avatar_url: url })
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/groups')
  revalidatePath(`/groups/${groupId}`)
  revalidatePath(`/groups/${groupId}/settings`)
  return { success: true }
}

export async function getUserGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Cache user groups for 15 seconds to reduce DB load on navigation
  return unstable_cache(
    async (userId: string) => {
      const admin = createAdminClient()

      // Fetch user's groups with their role
      const { data, error } = await admin
        .from('group_members')
        .select(`
          role,
          joined_at,
          groups (
            id, name, description, invite_code, avatar_url, created_at
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })

      if (error || !data) return []

      const groupIds = data.map((row) => (row.groups as any).id).filter(Boolean)

      if (groupIds.length === 0) return []

      // Get member counts for all groups in a single query
      const { data: memberCounts } = await admin
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      // Count members per group
      const countMap: Record<string, number> = {}
      for (const member of memberCounts ?? []) {
        countMap[member.group_id] = (countMap[member.group_id] ?? 0) + 1
      }

      return data.map((row) => ({
        ...(row.groups as any),
        role: row.role,
        member_count: countMap[(row.groups as any).id] ?? 0,
      }))
    },
    [`user-groups-${user.id}`],
    { revalidate: 15, tags: [`user-groups-${user.id}`] }
  )(user.id)
}

export async function getGroupDetails(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Cache group details for 10 seconds
  return unstable_cache(
    async (groupId: string, userId: string) => {
      const admin = createAdminClient()

      // Parallelize all queries - no need to wait for membership check
      const [membershipResult, groupResult, membersResult] = await Promise.all([
        admin
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .maybeSingle(),
        admin
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single(),
        admin
          .from('group_members')
          .select('*, profiles(*)')
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true })
      ])

      // Check membership after fetching
      if (!membershipResult.data) return null

      const membership = membershipResult.data
      const group = groupResult.data
      const members = membersResult.data ?? []

      return {
        group,
        members: members ?? [],
        userRole: membership.role,
        userId,
      }
    },
    [`group-details-${groupId}-${user.id}`],
    { revalidate: 10, tags: [`group-${groupId}`] }
  )(groupId, user.id)
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

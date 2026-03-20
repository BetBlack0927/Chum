'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createGroup(formData: FormData) {
  const name        = (formData.get('name')        as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!name || name.length < 2) {
    return { error: 'Group name must be at least 2 characters.' }
  }
  if (name.length > 40) {
    return { error: 'Group name must be 40 characters or fewer.' }
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
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) return { error: memberError.message }

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
    .insert({ group_id: resolvedGroup.id, user_id: user.id, role: 'member' })

  if (joinError) return { error: joinError.message }

  revalidatePath('/groups')
  redirect(`/groups/${resolvedGroup.id}`)
}

export async function getUserGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('group_members')
    .select(`
      role,
      groups (
        id, name, description, invite_code, created_at,
        group_members (count)
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    ...(row.groups as any),
    role: row.role,
    member_count: (row.groups as any).group_members[0]?.count ?? 0,
  }))
}

export async function getGroupDetails(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // Verify membership
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return null

  const { data: group } = await admin
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  const { data: members } = await admin
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  return {
    group,
    members: members ?? [],
    userRole: membership.role,
    userId: user.id,
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

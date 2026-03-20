'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signUp(formData: FormData) {
  const email    = (formData.get('email')    as string).trim()
  const password = formData.get('password')  as string
  const username = (formData.get('username') as string).trim()

  if (!email || !password || !username) {
    return { error: 'All fields are required.' }
  }

  if (username.length < 2 || username.length > 20) {
    return { error: 'Username must be 2–20 characters.' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores.' }
  }

  const supabase = await createClient()

  // Check username availability
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'That username is already taken.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign up failed. Please try again.' }

  // Create profile — admin client used because the new user's session
  // isn't active yet at this point, so RLS would block the insert
  const admin = createAdminClient()
  await admin
    .from('profiles')
    .upsert({
      id: data.user.id,
      username,
      avatar_color: randomAvatarColor(),
    })
    .select()

  redirect('/groups')
}

export async function signIn(formData: FormData) {
  const email    = (formData.get('email')    as string).trim()
  const password = formData.get('password')  as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Invalid email or password.' }

  redirect('/groups')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function randomAvatarColor(): string {
  const colors = ['#8b5cf6', '#db2777', '#059669', '#d97706', '#2563eb', '#0891b2']
  return colors[Math.floor(Math.random() * colors.length)]
}

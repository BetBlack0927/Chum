'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function SignupForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/groups'
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.append('redirectTo', redirectTo)
    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
      <p className="text-sm text-white/40 mb-6">Join your friends in the daily game</p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Username"
          name="username"
          type="text"
          placeholder="yourname"
          autoComplete="username"
          helperText="Letters, numbers, underscores. 2–20 chars."
          maxLength={20}
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
          required
        />

        {error && (
          <div className="rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Create Account 🎮
        </Button>
      </form>

      <p className="text-xs text-white/30 text-center mt-4 leading-relaxed">
        By signing up, you agree to play fair and not take this too seriously 😄
      </p>

      <p className="text-center text-sm text-white/40 mt-4">
        Already have an account?{' '}
        <Link href={`/login${redirectTo !== '/groups' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-brand-light font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
        <p className="text-sm text-white/40 mb-6">Loading...</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}

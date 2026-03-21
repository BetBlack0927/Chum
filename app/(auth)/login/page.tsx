'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/groups'
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.append('redirectTo', redirectTo)
    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Welcome back 👋</h2>
      <p className="text-sm text-white/40 mb-6">Log in to see today's prompt</p>

      <form action={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-white/40 mt-5">
        Don't have an account?{' '}
        <Link href={`/signup${redirectTo !== '/groups' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-brand-light font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

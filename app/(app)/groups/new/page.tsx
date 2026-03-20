'use client'

import { useState, useTransition } from 'react'
import { TopBar } from '@/components/navigation/TopBar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createGroup, joinGroup } from '@/lib/actions/groups'
import { Users, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'create' | 'join'

export default function NewGroupPage() {
  const [activeTab, setActiveTab] = useState<Tab>('create')

  return (
    <div>
      <TopBar title="Groups" backHref="/groups" />

      <div className="px-4 pt-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 rounded-2xl p-1 mb-6">
          <TabButton
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            icon={<Users size={15} />}
          >
            Create Group
          </TabButton>
          <TabButton
            active={activeTab === 'join'}
            onClick={() => setActiveTab('join')}
            icon={<Link2 size={15} />}
          >
            Join Group
          </TabButton>
        </div>

        {activeTab === 'create' ? <CreateGroupForm /> : <JoinGroupForm />}
      </div>
    </div>
  )
}

function TabButton({
  children, active, onClick, icon,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-semibold transition-all',
        active
          ? 'bg-brand text-white shadow-sm shadow-brand/30'
          : 'text-white/50 hover:text-white/70'
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function CreateGroupForm() {
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createGroup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="slide-up">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">Create a group</h2>
        <p className="text-sm text-white/40 mt-1">You'll get a 6-character invite code to share with friends.</p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Group Name"
          name="name"
          placeholder="The Squad, Friday Crew, Unhinged Group..."
          maxLength={40}
          required
        />

        <Input
          label="Description (optional)"
          name="description"
          placeholder="What's this group about?"
          maxLength={100}
        />

        {error && (
          <div className="rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Create Group 🚀
        </Button>
      </form>

      <Card className="mt-5 bg-surface-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2">How it works</p>
        <ul className="flex flex-col gap-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="shrink-0">1.</span>
            Create the group — you become the admin
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0">2.</span>
            Share the invite code with your friends
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0">3.</span>
            Everyone gets a new prompt every day
          </li>
        </ul>
      </Card>
    </div>
  )
}

function JoinGroupForm() {
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinGroup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="slide-up">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">Join a group</h2>
        <p className="text-sm text-white/40 mt-1">Enter the 6-character invite code from your friend.</p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Invite Code"
          name="code"
          placeholder="ABC123"
          maxLength={6}
          className="uppercase text-center tracking-widest text-xl font-bold"
          style={{ letterSpacing: '0.25em' }}
          required
        />

        {error && (
          <div className="rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Join Group 🎮
        </Button>
      </form>

      <p className="text-center text-sm text-white/30 mt-5">
        Ask your friend to share the invite code from their group settings
      </p>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { submitAnswer } from '@/lib/actions/submissions'
import { CheckCircle } from 'lucide-react'

const MAX_CHARS = 280

interface SubmissionFormProps {
  roundId: string
  groupId: string
  userSubmission: { content: string } | null
}

export function SubmissionForm({ roundId, groupId, userSubmission }: SubmissionFormProps) {
  const [content, setContent]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Already submitted
  if (userSubmission || submitted) {
    return (
      <Card className="text-center py-8 slide-up">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-400/15 flex items-center justify-center">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">Answer submitted! 🎉</p>
            <p className="text-sm text-white/50 mt-1">Waiting for others to submit...</p>
          </div>
          <div className="mt-2 rounded-xl bg-surface-2 border border-white/8 px-4 py-3 w-full text-left">
            <p className="text-xs text-white/40 mb-1 font-medium">YOUR ANSWER</p>
            <p className="text-white/80 text-sm">{userSubmission?.content ?? content}</p>
          </div>
        </div>
      </Card>
    )
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await submitAnswer(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 slide-up">
      <input type="hidden" name="round_id" value={roundId} />
      <input type="hidden" name="group_id" value={groupId} />

      <Textarea
        name="content"
        placeholder="Write your answer here... be honest, be funny, be bold 🔥"
        rows={4}
        maxChars={MAX_CHARS}
        currentLength={content.length}
        value={content}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) {
            setContent(e.target.value)
          }
        }}
        error={error ?? undefined}
        required
        autoFocus
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isPending}
        disabled={content.trim().length === 0}
      >
        Submit Answer ✨
      </Button>
    </form>
  )
}

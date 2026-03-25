'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentPhase, type Phase } from '@/lib/phases'
import { PhaseIndicator } from '@/components/rounds/PhaseIndicator'
import { VotingInterface } from '@/components/rounds/VotingInterface'
import { WinnerReveal } from '@/components/rounds/WinnerReveal'
import { ShareResult } from '@/components/rounds/ShareResult'
import { RerollButton } from '@/components/rounds/RerollButton'
import type { Profile, Vote, NominationResult } from '@/types/database'

interface RoundData {
  winner:               NominationResult | null
  nominations:          NominationResult[]
  totalVotes:           number
  userVote:             Vote | null
  allComments:          { comment: string; nomineeUsername: string }[]
  revealedVoter:        Profile | null
  revealedVoterNominee: Profile | null
  voterIds:             string[]
}

interface PhaseGateProps {
  roundId:         string
  groupId:         string
  promptText:      string
  hasRerolled:     boolean
  nextCategory:    string | null
  roundData:       RoundData
  memberProfiles:  Profile[]
  userId:          string
  isAdmin:         boolean
  memberCount:     number
}

export function PhaseGate({
  roundId, groupId, promptText, hasRerolled, nextCategory,
  roundData, memberProfiles, userId, isAdmin, memberCount,
}: PhaseGateProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase | null>(null)
  const [hasRefreshedForResults, setHasRefreshedForResults] = useState(false)

  useEffect(() => {
    setPhase(getCurrentPhase())
    const timer = setInterval(() => {
      setPhase(getCurrentPhase())
    }, 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (phase === 'results' && !hasRefreshedForResults) {
      router.refresh()
      setHasRefreshedForResults(true)
    }
    if (phase !== 'results' && hasRefreshedForResults) {
      setHasRefreshedForResults(false)
    }
  }, [phase, hasRefreshedForResults, router])

  // Render nothing until we've detected the local phase — avoids hydration mismatches
  if (!phase) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {phase === 'voting' && (
        <RerollButton
          roundId={roundId}
          groupId={groupId}
          isAdmin={isAdmin}
          hasRerolled={hasRerolled}
          hasVotes={roundData.totalVotes > 0}
        />
      )}

      <PhaseIndicator
        phase={phase}
        votedCount={roundData.totalVotes}
        memberCount={memberCount}
      />

      {phase === 'results' && roundData.winner && (
        <ShareResult
          promptText={promptText}
          winner={roundData.winner}
          totalVotes={roundData.totalVotes}
          allComments={roundData.allComments}
          revealedVoterNominee={roundData.revealedVoterNominee}
        />
      )}

      {phase === 'voting' && (
        <section>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
            Who fits this best?
          </p>
          <VotingInterface
            roundId={roundId}
            groupId={groupId}
            members={memberProfiles}
            userId={userId}
            userVote={roundData.userVote}
          />
        </section>
      )}

      {phase === 'results' && (
        <section>
          <WinnerReveal
            promptText={promptText}
            winner={roundData.winner}
            nominations={roundData.nominations}
            totalVotes={roundData.totalVotes}
            allComments={roundData.allComments}
            revealedVoter={roundData.revealedVoter}
            revealedVoterNominee={roundData.revealedVoterNominee}
            userId={userId}
            roundId={roundId}
            groupId={groupId}
            nextCategory={nextCategory}
          />
        </section>
      )}
    </div>
  )
}

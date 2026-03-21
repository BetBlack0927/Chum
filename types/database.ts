export type Profile = {
  id: string
  username: string
  avatar_color: string
  created_at: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string | null
  created_at: string
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export type Prompt = {
  id: string
  text: string
  category: string | null
  created_at: string
}

export type Round = {
  id: string
  group_id: string
  prompt_id: string
  date: string
  next_category: string | null     // set by winner during results phase
  revealed_voter_id: string | null // one randomly-exposed voter per round
  created_at: string
}

// Vote: voter nominates a group member as the best fit for the prompt
export type Vote = {
  id: string
  round_id: string
  voter_id: string
  nominated_user_id: string
  comment: string | null   // optional anonymous comment submitted with the vote
  created_at: string
}

// Joined types used in the UI

export type GroupWithMemberCount = Group & {
  member_count: number
}

export type RoundWithPrompt = Round & {
  prompt: Prompt
}

export type GroupMemberWithProfile = GroupMember & {
  profile: Profile
}

// How many votes each person received in a round
export type NominationResult = {
  profile: Profile
  vote_count: number
  comments?: string[]  // anonymous comments submitted alongside votes
}

export type RoundResult = {
  round: RoundWithPrompt
  nominations: NominationResult[]
  winner: NominationResult | null
  total_votes: number
}

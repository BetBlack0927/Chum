/** Short lines shown on the results screen — pick is stable per round via `pickFlavorLabel`. */

export const WINNER_FLAVOR_LABELS = [
  'Main character today 🎬',
  'Chosen one 👑',
  'Certified menace 😈',
  'MVP of the day 🏆',
  'Everyone agreed on this one 😭',
  'LeChosenOne 👑',
  'Him. Just him.',
  'No debate needed',
] as const

export const EXPOSED_FLAVOR_LABELS = [
  'Caught in 4K 📸',
  'No hiding now 😭',
  'Folded instantly',
  'Exposed badly 💀',
  'The group saw right through you',
  "That's tough\u2026",
  "Should've stayed quiet 😭",
  'LeExposed 💀',
  'No defense for this',
  'Public humiliation arc',
] as const

/** Deterministic index from round id + salt so labels don't flicker on re-render. */
export function pickFlavorLabelIndex(roundId: string, salt: string, length: number): number {
  const s = `${roundId}:${salt}`
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % length
}

export function pickWinnerFlavorLabel(roundId: string): string {
  const i = pickFlavorLabelIndex(roundId, 'winner', WINNER_FLAVOR_LABELS.length)
  return WINNER_FLAVOR_LABELS[i]
}

export function pickExposedFlavorLabel(roundId: string): string {
  const i = pickFlavorLabelIndex(roundId, 'exposed', EXPOSED_FLAVOR_LABELS.length)
  return EXPOSED_FLAVOR_LABELS[i]
}

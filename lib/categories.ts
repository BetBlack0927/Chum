// Shared category definitions — imported by both server actions and client components

export const VALID_CATEGORIES = [
  'juicy', 'chaos', 'social', 'petty', 'wildcard', 'ambition', 'random',
] as const

export type CategoryChoice = typeof VALID_CATEGORIES[number]

export const CATEGORY_META: Record<string, { label: string; emoji: string; desc: string }> = {
  juicy:    { label: 'Juicy',    emoji: '🌶️', desc: 'Spicy & bold'    },
  chaos:    { label: 'Chaos',    emoji: '🔥', desc: 'Unhinged energy'  },
  social:   { label: 'Social',   emoji: '👀', desc: 'Group roasts'     },
  petty:    { label: 'Petty',    emoji: '🙄', desc: 'Everyday savage'  },
  wildcard: { label: 'Wildcard', emoji: '🎲', desc: 'Anything goes'    },
  ambition: { label: 'Ambition', emoji: '💅', desc: 'Future takes'     },
  random:   { label: 'Surprise', emoji: '🎯', desc: 'Let fate decide'  },
}

import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'gold' | 'success' | 'danger' | 'submission' | 'voting' | 'results'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default:    'bg-white/8  text-white/60  border-white/10',
  brand:      'bg-brand/15  text-brand-light border-brand/30',
  gold:       'bg-gold/15   text-amber-300  border-gold/30',
  success:    'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  danger:     'bg-red-400/15 text-red-300 border-red-400/30',
  submission: 'bg-blue-400/15   text-blue-300   border-blue-400/30',
  voting:     'bg-yellow-400/15 text-yellow-300  border-yellow-400/30',
  results:    'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  )
}

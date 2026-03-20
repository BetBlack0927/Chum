import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  goldGlow?: boolean
  onClick?: () => void
}

export function Card({ children, className, glow, goldGlow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-surface border border-white/8 p-4',
        glow     && 'card-glow',
        goldGlow && 'card-glow-gold',
        onClick  && 'cursor-pointer transition-transform active:scale-98',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 pb-4', className)}>
      {children}
    </div>
  )
}

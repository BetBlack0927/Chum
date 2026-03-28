import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-brand hover:bg-brand-dark active:scale-95 text-white shadow-lg shadow-brand/20',
  secondary: 'bg-surface-2 hover:bg-surface-3 active:scale-95 text-white border border-white/10',
  ghost:     'bg-transparent hover:bg-white/5 active:scale-95 text-white/80',
  danger:    'bg-danger/15 hover:bg-danger/25 active:scale-95 text-red-400 border border-red-400/30',
  gold:      'bg-gold hover:bg-amber-400 active:scale-95 text-black font-bold shadow-lg shadow-gold/30',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3   text-sm  rounded-xl',
  md: 'h-11 px-5   text-sm  rounded-2xl',
  lg: 'h-14 px-6   text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold touch-manipulation',
          'transition-[transform,opacity,background-color,border-color,color,box-shadow] duration-150 ease-out',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

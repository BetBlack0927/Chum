import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 w-full rounded-2xl bg-surface-2 border border-white/10 px-4 text-white placeholder:text-white/30',
            'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20',
            'transition-colors duration-150',
            error && 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-white/40">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  maxChars?: number
  currentLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxChars, currentLength, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const isNearLimit = maxChars && currentLength !== undefined && currentLength > maxChars * 0.85
    const isAtLimit   = maxChars && currentLength !== undefined && currentLength >= maxChars

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl bg-surface-2 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 resize-none',
            'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20',
            'transition-colors duration-150',
            error && 'border-red-400/50',
            className,
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <span />
          )}
          {maxChars !== undefined && currentLength !== undefined && (
            <span className={cn(
              'text-xs tabular-nums',
              isAtLimit   ? 'text-red-400' :
              isNearLimit ? 'text-yellow-400' :
              'text-white/30'
            )}>
              {currentLength}/{maxChars}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  username: string
  color?: string
  url?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ username, color = '#8b5cf6', url, size = 'md', className }: AvatarProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={username}
        className={cn('rounded-full object-cover shrink-0 select-none', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(username)}
    </div>
  )
}

interface AvatarGroupProps {
  users: Array<{ username: string; avatar_color?: string; avatar_url?: string | null }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible  = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div key={i} className="-ml-1.5 first:ml-0 ring-2 ring-app-bg rounded-full">
          <Avatar username={user.username} color={user.avatar_color} url={user.avatar_url} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={cn(
          '-ml-1.5 ring-2 ring-app-bg rounded-full flex items-center justify-center bg-surface-3 text-white/50 font-semibold',
          sizes[size],
        )}>
          +{overflow}
        </div>
      )}
    </div>
  )
}

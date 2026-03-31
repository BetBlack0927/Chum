'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Store, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/groups',  icon: Trophy, label: 'Groups'  },
  { href: '/shop',    icon: Store,  label: 'Shop'    },
  { href: '/profile', icon: User,   label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center bg-surface border-t border-white/8 supports-[backdrop-filter]:bg-surface/98"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-[430px] mx-auto flex justify-around items-center px-2 pt-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/groups' && pathname !== '/groups/new' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors touch-manipulation select-none active:opacity-80',
                isActive
                  ? 'text-brand-light'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium', isActive && 'text-brand-light')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

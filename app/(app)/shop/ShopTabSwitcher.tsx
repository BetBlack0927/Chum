'use client'

import { useRouter } from 'next/navigation'
import { Compass, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  activeTab: 'browse' | 'saved'
}

export function ShopTabSwitcher({ activeTab }: Props) {
  const router = useRouter()

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/6 border border-white/8">
      <button
        onClick={() => router.push('/shop')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          activeTab === 'browse' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70'
        )}
      >
        <Compass size={15} />
        Browse
      </button>
      <button
        onClick={() => router.push('/shop?tab=saved')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          activeTab === 'saved' ? 'bg-brand text-white' : 'text-white/40 hover:text-white/70'
        )}
      >
        <Bookmark size={15} />
        Saved
      </button>
    </div>
  )
}

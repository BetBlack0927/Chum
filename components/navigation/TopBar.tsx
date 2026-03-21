import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface TopBarProps {
  title?: string
  backHref?: string
  right?: React.ReactNode
}

export function TopBar({ title, backHref, right }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-40 bg-app-bg/90 backdrop-blur-xl border-b border-white/6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-4 gap-3 max-w-[430px] mx-auto">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-2 transition-colors text-white/70 hover:text-white shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
        ) : (
          <Image src="/logo.png" alt="Daily Winner" width={30} height={30} className="rounded-lg shrink-0" />
        )}

        {title && (
          <h1 className="font-bold text-lg text-white flex-1 truncate">{title}</h1>
        )}

        {right && <div className="ml-auto shrink-0">{right}</div>}
      </div>
    </header>
  )
}

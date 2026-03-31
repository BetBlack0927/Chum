import { BottomNav } from '@/components/navigation/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col safe-top">
      {/* Center content on larger screens, full width on mobile */}
      <div className="flex-1 min-h-0 w-full max-w-[430px] mx-auto flex flex-col">
        <main
          className="flex-1 min-h-0 scroll-touch"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav spans full width but content is centered */}
      <BottomNav />
    </div>
  )
}

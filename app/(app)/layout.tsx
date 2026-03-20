import { BottomNav } from '@/components/navigation/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col">
      {/* Center content on larger screens, full width on mobile */}
      <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
      </div>

      {/* Bottom nav spans full width but content is centered */}
      <BottomNav />
    </div>
  )
}

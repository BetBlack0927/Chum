export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-gold flex items-center justify-center text-3xl mb-4 mx-auto shadow-xl shadow-brand/25">
            🏆
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Daily</span>
            <span className="text-white"> Winner</span>
          </h1>
        </div>

        {children}
      </div>
    </div>
  )
}

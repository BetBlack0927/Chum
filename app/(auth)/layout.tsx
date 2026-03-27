import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Chum"
            width={72}
            height={72}
            className="rounded-2xl mx-auto mb-4 shadow-xl shadow-brand/20"
          />
          <h1 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Chum</span>
          </h1>
        </div>

        {children}
      </div>
    </div>
  )
}

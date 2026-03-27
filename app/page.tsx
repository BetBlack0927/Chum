import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-app-bg text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-[430px] mx-auto w-full">
        <Image src="/logo.png" alt="Chum" width={40} height={40} className="rounded-xl" />
        <Link
          href="/login"
          className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          Log in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-16 max-w-[430px] mx-auto w-full text-center">
        <div className="mb-6 drop-shadow-2xl">
          <Image src="/logo.png" alt="Chum" width={96} height={96} className="rounded-3xl shadow-2xl shadow-brand/30" />
        </div>

        <h1 className="text-4xl font-black leading-tight tracking-tight mb-4">
          The game your{' '}
          <span className="gradient-text">friend group</span>{' '}
          actually plays
        </h1>

        <p className="text-white/50 text-base leading-relaxed mb-8">
          One prompt. Everyone answers. Anonymous votes. One winner crowned every single day.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/signup"
            className="h-14 rounded-2xl bg-brand hover:bg-brand-dark text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand/30 active:scale-95"
          >
            Play with friends 🎮
          </Link>
          <Link
            href="/login"
            className="h-12 rounded-2xl bg-surface-2 border border-white/10 text-white/80 font-semibold text-sm flex items-center justify-center transition-all hover:bg-surface-3 active:scale-95"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-10 max-w-[430px] mx-auto w-full">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest text-center mb-5">How it works</p>
        <div className="flex flex-col gap-3">
          {[
            { step: '1', emoji: '👋', title: 'Create or join a group', desc: 'Invite your friends with a 6-character code.' },
            { step: '2', emoji: '✏️', title: "Answer today's prompt", desc: 'New prompt every day. Honest, funny, unhinged.' },
            { step: '3', emoji: '🗳️', title: 'Vote anonymously', desc: "You don't know who wrote what until results." },
            { step: '4', emoji: '🏆', title: 'One winner crowned', desc: 'Bragging rights. Pure dopamine.' },
          ].map(({ step, emoji, title, desc }) => (
            <div key={step} className="flex items-start gap-4 bg-surface rounded-2xl border border-white/8 p-4">
              <div className="w-8 h-8 rounded-xl bg-brand/20 text-brand-light font-black text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{emoji} {title}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 pb-12 max-w-[430px] mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🔒', title: 'Private groups', desc: 'Only people with the code can join' },
            { emoji: '😶', title: 'Anonymous voting', desc: 'No idea who wrote what' },
            { emoji: '📜', title: 'Full history', desc: 'See past winners and prompts' },
            { emoji: '⚡', title: 'Daily streak', desc: 'Keep showing up every day' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-surface rounded-2xl border border-white/8 p-4">
              <p className="text-2xl mb-2">{emoji}</p>
              <p className="font-bold text-white text-sm">{title}</p>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16 max-w-[430px] mx-auto w-full text-center">
        <div className="bg-gradient-to-br from-brand/20 to-gold/10 rounded-3xl border border-brand/20 p-8">
          <p className="text-2xl font-black mb-2">Ready to play?</p>
          <p className="text-white/50 text-sm mb-5">It only takes 30 seconds to get started.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-brand hover:bg-brand-dark text-white font-bold transition-all shadow-lg shadow-brand/30 active:scale-95"
          >
            Create your group →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 text-center max-w-[430px] mx-auto w-full">
        <p className="text-xs text-white/20">Chum — play every day ✨</p>
      </footer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function InviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-mono font-bold transition-all active:scale-95"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          {code}
        </>
      )}
    </button>
  )
}

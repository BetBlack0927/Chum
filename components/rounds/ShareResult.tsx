'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { NominationResult, Profile } from '@/types/database'

interface ShareResultProps {
  promptText:          string
  winner:              NominationResult
  totalVotes:          number
  allComments:         { comment: string; nomineeUsername: string }[]
  revealedVoterNominee: Profile | null
}

export function ShareResult({
  promptText, winner, totalVotes, allComments, revealedVoterNominee,
}: ShareResultProps) {
  const cardRef  = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const pct             = totalVotes > 0 ? Math.round((winner.vote_count / totalVotes) * 100) : 0
  // Prefer a reaction about the winner; fall back to any
  const reaction        = allComments.find((c) => c.nomineeUsername === winner.profile.username)
                       ?? allComments[0]
                       ?? null
  const shortReaction   = reaction
    ? reaction.comment.length > 52 ? reaction.comment.slice(0, 49) + '…' : reaction.comment
    : null
  const shortPrompt     = promptText.length > 65 ? promptText.slice(0, 62) + '…' : promptText

  async function handleGenerate() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const url = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      setImageUrl(url)
    } catch (e) {
      console.error('Share card error:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!imageUrl) return
    const a    = document.createElement('a')
    a.href     = imageUrl
    a.download = 'chum-result.png'
    a.click()
  }

  async function handleNativeShare() {
    if (!imageUrl) return
    try {
      const blob = await (await fetch(imageUrl)).blob()
      const file = new File([blob], 'chum-result.png', { type: 'image/png' })
      await navigator.share({ files: [file], title: 'Chum' })
    } catch { /* cancelled or unsupported */ }
  }

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <>
      {/* ── Share button ── */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full h-11 rounded-2xl border border-gold/30 bg-gold/8 text-gold font-bold text-sm hover:bg-gold/15 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          <>📤 Share Result</>
        )}
      </button>

      {/* ── Hidden capture card (off-screen) ── */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}
      >
        <div
          ref={cardRef}
          style={{
            width: 420,
            height: 420,
            background: 'linear-gradient(145deg, #0d0d1a 0%, #12101e 55%, #1a1028 100%)',
            borderRadius: 28,
            border: '1.5px solid rgba(245,158,11,0.35)',
            padding: '36px 32px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Subtle radial glow behind winner area */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 260, height: 260,
            background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Prompt */}
          <div style={{ textAlign: 'center', width: '100%', zIndex: 1 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.65)',
              textTransform: 'uppercase', letterSpacing: '0.13em', margin: '0 0 10px',
            }}>
              Most likely to…
            </p>
            <p style={{
              fontSize: 19, fontWeight: 800, color: '#ffffff',
              lineHeight: 1.3, margin: 0,
            }}>
              {shortPrompt}
            </p>
          </div>

          {/* Winner block */}
          <div style={{
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.28)',
            borderRadius: 18,
            padding: '18px 26px',
            width: '100%',
            textAlign: 'center',
            boxSizing: 'border-box',
            zIndex: 1,
          }}>
            <p style={{ fontSize: 30, margin: '0 0 8px', lineHeight: 1 }}>🏆</p>
            <p style={{
              fontSize: 24, fontWeight: 900, color: '#f59e0b',
              margin: '0 0 5px', letterSpacing: '-0.01em',
            }}>
              @{winner.profile.username}
            </p>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500,
            }}>
              {winner.vote_count} {winner.vote_count === 1 ? 'vote' : 'votes'}&nbsp;&nbsp;·&nbsp;&nbsp;{pct}% of group
            </p>
          </div>

          {/* Extras row */}
          <div style={{
            width: '100%', display: 'flex', flexDirection: 'column',
            gap: 7, alignItems: 'center', zIndex: 1,
          }}>
            {shortReaction && (
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.52)',
                fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.4,
              }}>
                💬 &quot;{shortReaction}&quot;
              </p>
            )}
            {revealedVoterNominee && (
              <p style={{
                fontSize: 12, color: 'rgba(248,113,113,0.65)',
                margin: 0, fontWeight: 600,
              }}>
                👀 Someone got exposed
              </p>
            )}
          </div>

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, zIndex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Chum"
              width={20}
              height={20}
              style={{ borderRadius: 5, opacity: 0.55 }}
            />
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
              margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              Chum
            </p>
          </div>
        </div>
      </div>

      {/* ── Preview modal ── */}
      {imageUrl && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-10"
          onClick={() => setImageUrl(null)}
        >
          <div
            className="flex flex-col items-center gap-4 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt="Share card preview"
              className="w-full rounded-3xl shadow-2xl ring-1 ring-white/10"
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
            />

            <div className="flex gap-3 w-full">
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 h-12 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark active:scale-95 transition-all"
                >
                  Share
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex-1 h-12 rounded-2xl border border-white/20 text-white font-bold text-sm hover:bg-white/8 active:scale-95 transition-all"
              >
                Download
              </button>
            </div>

            <button
              onClick={() => setImageUrl(null)}
              className="text-white/35 text-sm hover:text-white/60 transition-colors pb-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Layers, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPackDetail, deletePack } from '@/lib/actions/shop'
import { TopBar } from '@/components/navigation/TopBar'
import { CATEGORY_META } from '@/lib/categories'
import { PackDetailClient } from './PackDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PackDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pack = await getPackDetail(id)
  if (!pack) notFound()

  const isOwner = pack.creator_id === user.id

  async function handleDelete() {
    'use server'
    await deletePack(id)
  }

  return (
    <div>
      <TopBar
        title="Pack"
        backHref="/shop"
        right={
          isOwner ? (
            <form action={handleDelete}>
              <button
                type="submit"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-red-500/10 transition-colors text-white/40 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </form>
          ) : null
        }
      />

      <div className="px-4 pt-4 pb-10 flex flex-col gap-5">
        {/* Pack header */}
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/8 to-gold/5 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl border border-brand/20 overflow-hidden shrink-0 bg-gradient-to-br from-brand/40 to-gold/20 flex items-center justify-center">
              {pack.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Layers size={22} className="text-brand-light" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-black text-white text-xl leading-tight">{pack.name}</h1>
              {pack.description && (
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{pack.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/30">
                  {pack.prompts.length} prompt{pack.prompts.length !== 1 ? 's' : ''}
                </span>
                {pack.creator && (
                  <Link
                    href={`/creators/${pack.creator.username}`}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    by @{pack.creator.username}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client piece: save + add to group */}
        <PackDetailClient pack={pack} userId={user.id} />

        {/* Prompts list */}
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
            Prompts in this pack
          </p>
          <div className="flex flex-col gap-2">
            {pack.prompts.map((prompt, i) => {
              const meta = prompt.category ? CATEGORY_META[prompt.category] : null
              return (
                <div
                  key={prompt.id}
                  className="rounded-xl border border-white/8 bg-surface p-3 flex gap-3"
                >
                  <span className="text-xs font-bold text-white/20 w-5 shrink-0 pt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    {meta && (
                      <span className="text-[10px] text-white/30 font-semibold block mb-1">
                        {meta.emoji} {meta.label}
                      </span>
                    )}
                    <p className="text-sm text-white/80 leading-snug">{prompt.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

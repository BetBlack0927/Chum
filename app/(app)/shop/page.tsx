import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getShopFeed, getFollowingFeed, getSavedItems } from '@/lib/actions/shop'
import { TopBar } from '@/components/navigation/TopBar'
import { ShopFilters } from '@/components/shop/ShopFilters'
import { ShopClient } from './ShopClient'
import { FollowingFeedStrip } from './FollowingFeedStrip'
import { ShopTabSwitcher } from './ShopTabSwitcher'
import { Suspense } from 'react'

interface Props {
  searchParams: Promise<{ tab?: string; type?: string; category?: string; q?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab      = (params.tab ?? 'browse') as 'browse' | 'saved'
  const type     = (params.type ?? 'all') as 'all' | 'prompts' | 'packs'
  const category = params.category ?? undefined
  const query    = params.q ?? undefined

  const [browseData, followingFeed, savedData] = await Promise.all([
    tab === 'browse' ? getShopFeed({ type, category, query }) : Promise.resolve({ prompts: [], packs: [] }),
    tab === 'browse' ? getFollowingFeed(user.id) : Promise.resolve({ prompts: [], packs: [] }),
    tab === 'saved'  ? getSavedItems(user.id)    : Promise.resolve({ prompts: [], packs: [] }),
  ])

  const hasFollowingFeed = followingFeed.prompts.length > 0 || followingFeed.packs.length > 0

  return (
    <div>
      <TopBar
        title="Prompt Shop"
        right={
          <Link
            href="/shop/create"
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors"
          >
            <Plus size={14} />
            Create
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-5">
        {/* Browse / Saved tab switcher */}
        <ShopTabSwitcher activeTab={tab} />

        {tab === 'browse' && (
          <>
            {/* Filters */}
            <Suspense>
              <ShopFilters />
            </Suspense>

            {/* Following feed strip */}
            {hasFollowingFeed && !query && (
              <section>
                <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
                  From People You Follow
                </p>
                <FollowingFeedStrip
                  prompts={followingFeed.prompts}
                  packs={followingFeed.packs}
                />
              </section>
            )}

            {/* Main browse results */}
            <section>
              {!query && !category && type === 'all' && (
                <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-3">
                  Browse All
                </p>
              )}
              <ShopClient prompts={browseData.prompts} packs={browseData.packs} type={type} />
            </section>
          </>
        )}

        {tab === 'saved' && (
          <section>
            {savedData.prompts.length === 0 && savedData.packs.length === 0 ? (
              <div className="flex flex-col items-center text-center py-16 gap-4">
                <div className="text-5xl">🔖</div>
                <div>
                  <p className="font-bold text-white text-lg">Nothing saved yet</p>
                  <p className="text-sm text-white/40 mt-1 max-w-xs leading-relaxed">
                    Bookmark prompts and packs from the Browse tab to save them here.
                  </p>
                </div>
              </div>
            ) : (
              <ShopClient
                prompts={savedData.prompts}
                packs={savedData.packs}
                type="all"
              />
            )}
          </section>
        )}
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getShopFeed, getFollowingFeed, getSavedItems, getPopularItems } from '@/lib/actions/shop'
import { TopBar } from '@/components/navigation/TopBar'
import { ShopFilters } from '@/components/shop/ShopFilters'
import { ShopClient } from './ShopClient'
import { FollowingFeedStrip } from './FollowingFeedStrip'
import { ShopTabSwitcher } from './ShopTabSwitcher'
import { PopularSection } from './PopularSection'
import { Suspense } from 'react'

interface Props {
  searchParams: Promise<{ tab?: string; type?: string; category?: string; q?: string }>
}

function normalizeShopType(raw: string | undefined): 'popular' | 'prompts' | 'packs' {
  if (raw === 'prompts' || raw === 'packs') return raw
  if (raw === 'all' || raw === 'popular' || !raw) return 'popular'
  return 'popular'
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab = (params.tab ?? 'browse') as 'browse' | 'saved'
  const typeNorm = normalizeShopType(params.type)
  const category = params.category && params.category !== 'all' ? params.category : undefined
  const query = params.q?.trim() ? params.q.trim() : undefined

  const isPopularBrowse = tab === 'browse' && typeNorm === 'popular' && !query
  const showFollowingStrip = tab === 'browse' && typeNorm === 'popular' && !query

  async function fetchBrowseFeed() {
    if (tab !== 'browse') return { prompts: [], packs: [] }
    if (isPopularBrowse) return { prompts: [], packs: [] }
    if (typeNorm === 'popular' && query) return getShopFeed({ type: 'all', query })
    if (typeNorm === 'prompts') return getShopFeed({ type: 'prompts', category, query })
    if (typeNorm === 'packs') return getShopFeed({ type: 'packs', query })
    return { prompts: [], packs: [] }
  }

  const [browseData, followingFeed, savedData, popularData] = await Promise.all([
    fetchBrowseFeed(),
    tab === 'browse' ? getFollowingFeed(user.id) : Promise.resolve({ prompts: [], packs: [] }),
    tab === 'saved' ? getSavedItems(user.id) : Promise.resolve({ prompts: [], packs: [] }),
    isPopularBrowse ? getPopularItems(15) : Promise.resolve({ prompts: [], packs: [] }),
  ])

  const hasFollowingFeed = followingFeed.prompts.length > 0 || followingFeed.packs.length > 0

  const shopClientType = typeNorm === 'popular' && query ? 'all' : typeNorm

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
        <ShopTabSwitcher activeTab={tab} />

        {tab === 'browse' && (
          <>
            <Suspense>
              <ShopFilters />
            </Suspense>

            {hasFollowingFeed && showFollowingStrip && (
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

            {isPopularBrowse && (
              <>
                {popularData.prompts.length === 0 && popularData.packs.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-16 gap-3">
                    <p className="text-4xl">🔥</p>
                    <p className="font-bold text-white text-lg">Nothing trending this week yet</p>
                    <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                      When prompts and packs get added to groups, the hottest ones will show up here.
                    </p>
                  </div>
                ) : (
                  <PopularSection prompts={popularData.prompts} packs={popularData.packs} />
                )}
              </>
            )}

            {!isPopularBrowse && (
              <section>
                <ShopClient prompts={browseData.prompts} packs={browseData.packs} type={shopClientType} />
              </section>
            )}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, TrendingDown, TrendingUp, Minus, ArrowRight, Star, MapPin, CheckCircle, Clock, Plus, UserRound, ThumbsUp, SlidersHorizontal } from 'lucide-react';
import { categories, getStoreEmoji, getStoreTypeLabel } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';

export default function SearchPage() {
  const { openPriceHistory, openStoreProfile, openUserProfile, openCreateStore, isLoggedIn, openAuthModal } = useApp();
  const { posts } = usePosts();
  const { stores } = useStores();
  const { isWithinRadius, radiusKm, setRadiusKm } = useLocation();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [customRadius, setCustomRadius] = useState('');
  const radiusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!radiusMenuRef.current) return;
      if (!radiusMenuRef.current.contains(event.target as Node)) {
        setShowRadiusMenu(false);
      }
    };
    if (showRadiusMenu) {
      setCustomRadius(radiusKm.toString());
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => { document.removeEventListener('mousedown', onClickOutside); };
  }, [showRadiusMenu, radiusKm]);

  const applyCustomRadius = () => {
    const parsed = Number.parseFloat(customRadius);
    if (!Number.isFinite(parsed)) return;
    if (parsed > 100) {
      alert('Maximum search radius cannot exceed 100 km.');
      return;
    }
    setRadiusKm(Number(Math.max(0.5, parsed).toFixed(1)));
    setShowRadiusMenu(false);
  };

  const nearbyPosts = posts.filter(post => isWithinRadius(post.locationCoords));
  const nearbyStores = stores.filter(store => isWithinRadius(store.locationCoords));

  const normalizedQuery = query.trim().toLowerCase();

  const productInsights = Object.values(
    nearbyPosts.reduce((acc, post) => {
      const groupKey = post.productName.trim().toLowerCase();
      const existing = acc[groupKey];
      if (!existing) {
        acc[groupKey] = {
          productName: post.productName,
          unit: post.unit,
          category: post.category,
          prices: [post.price],
          totalReports: 1,
          latestPostId: post.id,
        };
        return acc;
      }
      existing.prices.push(post.price);
      existing.totalReports += 1;
      return acc;
    }, {} as Record<string, { productName: string; unit: string; category: string; prices: number[]; totalReports: number; latestPostId: string }>),
  ).map(item => {
    const avgPrice = item.prices.reduce((sum, value) => sum + value, 0) / item.prices.length;
    const lowestPrice = Math.min(...item.prices);
    const highestPrice = Math.max(...item.prices);
    return {
      ...item,
      avgPrice: Number(avgPrice.toFixed(2)),
      lowestPrice,
      highestPrice,
      trendDirection: (avgPrice > lowestPrice * 1.08 ? 'up' : avgPrice < highestPrice * 0.92 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      trendPercent: Number((((highestPrice - lowestPrice) / Math.max(lowestPrice, 1)) * 100).toFixed(1)),
    };
  });

  const users = useMemo(() => {
    const userMap = nearbyPosts.reduce((acc, post) => {
      const existing = acc[post.userId];
      if (!existing) {
        acc[post.userId] = {
          userId: post.userId,
          userName: post.userName,
          userAvatar: post.userAvatar,
          postCount: 1,
          totalVouches: post.vouchCount,
          totalComments: post.commentCount,
          lastPostAt: post.timestamp,
          topStore: post.storeName,
          categories: new Set<string>([post.category]),
        };
        return acc;
      }

      existing.postCount += 1;
      existing.totalVouches += post.vouchCount;
      existing.totalComments += post.commentCount;
      existing.lastPostAt = Math.max(existing.lastPostAt, post.timestamp);
      existing.categories.add(post.category);
      return acc;
    }, {} as Record<string, {
      userId: string;
      userName: string;
      userAvatar: string;
      postCount: number;
      totalVouches: number;
      totalComments: number;
      lastPostAt: number;
      topStore: string;
      categories: Set<string>;
    }>);

    return Object.values(userMap).map(user => ({
      ...user,
      categories: [...user.categories],
    }));
  }, [nearbyPosts]);

  function getMatchScore(target: string, q: string): number {
    if (!q) return 0;
    const value = target.toLowerCase();
    if (value === q) return 150;
    if (value.startsWith(q)) return 120;
    if (value.includes(q)) return 80;
    const words = q.split(/\s+/).filter(Boolean);
    const wordMatches = words.filter(word => value.includes(word)).length;
    return wordMatches > 0 ? wordMatches * 20 : 0;
  }

  function getOverallScore(basePopularity: number, fields: string[], q: string): number {
    if (!q) return basePopularity;
    const bestFieldScore = Math.max(...fields.map(field => getMatchScore(field, q)), 0);
    return bestFieldScore + basePopularity;
  }

  const filteredInsights = productInsights.filter(insight => {
    const matchesQuery =
      !normalizedQuery ||
      insight.productName.toLowerCase().includes(normalizedQuery) ||
      insight.category.toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      activeCategory === 'All' ||
      insight.category === activeCategory;
    return matchesQuery && matchesCategory;
  }).sort((a, b) => {
    const scoreA = getOverallScore(
      a.totalReports * 3,
      [a.productName, a.category],
      normalizedQuery
    );
    const scoreB = getOverallScore(
      b.totalReports * 3,
      [b.productName, b.category],
      normalizedQuery
    );
    return scoreB - scoreA;
  });

  const filteredStores = nearbyStores.filter(store => {
    const matchesQuery =
      !normalizedQuery ||
      store.name.toLowerCase().includes(normalizedQuery) ||
      store.address.toLowerCase().includes(normalizedQuery) ||
      getStoreTypeLabel(store.type).toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      activeCategory === 'All' ||
      store.categories.includes(activeCategory);
    return matchesQuery && matchesCategory;
  }).sort((a, b) => {
    const scoreA = getOverallScore(
      a.vouchCount + a.totalPosts * 2,
      [a.name, a.address, getStoreTypeLabel(a.type), ...a.categories],
      normalizedQuery
    );
    const scoreB = getOverallScore(
      b.vouchCount + b.totalPosts * 2,
      [b.name, b.address, getStoreTypeLabel(b.type), ...b.categories],
      normalizedQuery
    );
    return scoreB - scoreA;
  });

  const filteredUsers = users.filter(user => {
    const matchesQuery =
      !normalizedQuery ||
      user.userName.toLowerCase().includes(normalizedQuery) ||
      user.topStore.toLowerCase().includes(normalizedQuery) ||
      user.categories.some(cat => cat.toLowerCase().includes(normalizedQuery));

    const matchesCategory =
      activeCategory === 'All' ||
      user.categories.includes(activeCategory);

    return matchesQuery && matchesCategory;
  }).sort((a, b) => {
    const scoreA = getOverallScore(
      a.postCount * 3 + a.totalVouches,
      [a.userName, a.topStore, ...a.categories],
      normalizedQuery
    );
    const scoreB = getOverallScore(
      b.postCount * 3 + b.totalVouches,
      [b.userName, b.topStore, ...b.categories],
      normalizedQuery
    );
    return scoreB - scoreA;
  });

  function getStorePostCount(storeId: string): number {
    return nearbyPosts.filter(p => p.storeId === storeId).length;
  }

  function getStoreLowestPrice(storeId: string): string {
    const storePosts = nearbyPosts.filter(p => p.storeId === storeId);
    if (storePosts.length === 0) return '—';
    const lowest = storePosts.reduce((min, p) => p.price < min.price ? p : min);
    return `₱${lowest.price}/${lowest.unit}`;
  }

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50', label: 'Up' },
    down: { icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Down' },
    stable: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Stable' },
  };

  const popularSearches = ['Rice', 'Pork Belly', 'WalterMart', 'Public Market', 'Maria Santos', 'Tilapia'];

  const showEmptyState = filteredInsights.length === 0 && filteredStores.length === 0 && filteredUsers.length === 0;

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white pt-12 pb-4 px-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div ref={radiusMenuRef} className="relative flex items-start justify-between mb-0.5">
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Search</h2>
              <div className="flex items-center gap-1 mt-0.5 mb-3">
                <MapPin className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-semibold text-gray-500">Within {radiusKm} km</span>
              </div>
            </div>
            <button
              onClick={() => setShowRadiusMenu(prev => !prev)}
              className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-orange-50 flex-shrink-0"
              aria-label="Set search radius"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            </button>

            {showRadiusMenu && (
              <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-xl border border-orange-100 p-2 z-40 animate-fade-in-up">
                <p className="text-[11px] font-bold text-gray-500 px-2 pb-1">Search Radius</p>
                {[1, 5, 10].map(option => (
                  <button
                    key={option}
                    onClick={() => { setRadiusKm(option); setShowRadiusMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${radiusKm === option
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                      }`}
                  >
                    {option} km
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 px-2 pb-1">Custom (km)</p>
                  <div className="flex items-center gap-2 px-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.5}
                      max={100}
                      step={0.1}
                      value={customRadius}
                      onChange={e => setCustomRadius(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') applyCustomRadius(); }}
                      className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="e.g. 3.5"
                    />
                    <button
                      onClick={applyCustomRadius}
                      className="h-9 px-3 rounded-lg bg-orange-500 text-white text-xs font-bold active:scale-95"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search input */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products, stores, or users..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {categories.filter(c => c !== 'Local Services').map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Popular searches - shown when no query */}
        {!query && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Popular Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:border-orange-300 hover:text-orange-600 transition-colors active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Smart Results</h3>
          <button
            onClick={() => {
              if (!isLoggedIn) {
                openAuthModal();
                return;
              }
              openCreateStore();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Store
          </button>
        </div>

        {filteredUsers.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Users</h4>
            <div className="space-y-2">
              {filteredUsers.slice(0, 6).map(user => (
                <button
                  key={user.userId}
                  onClick={() => openUserProfile(user.userId)}
                  className="w-full bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.98] text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                    {user.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 truncate">{user.userName}</p>
                      <UserRound className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">Most recent: {user.topStore}</div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                      <span>{user.postCount} posts</span>
                      <span>•</span>
                      <span>{user.totalVouches} vouches</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredInsights.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Products</h4>
            <div className="space-y-2">
              {filteredInsights.slice(0, 8).map((insight, i) => {
                const trend = trendConfig[insight.trendDirection];
                const TrendIcon = trend.icon;

                return (
                  <button
                    key={i}
                    onClick={() => openPriceHistory(insight.latestPostId)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98] text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900">{insight.productName}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div>
                          <span className="text-xl font-black text-orange-600">₱{insight.avgPrice}</span>
                          <span className="text-xs text-gray-400">/{insight.unit} avg</span>
                        </div>
                        {/* <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend.bg} ${trend.color}`}>
                          <TrendIcon className="w-3 h-3" />
                          {trend.label} {insight.trendPercent}%
                        </div> */}
                      </div>
                      {/* <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span>Low: <span className="font-bold text-emerald-600">₱{insight.lowestPrice}</span></span>
                        <span>High: <span className="font-bold text-red-500">₱{insight.highestPrice}</span></span>
                        <span>{insight.totalReports} reports</span>
                      </div> */}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredStores.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stores</h4>
            {filteredStores.slice(0, 8).map(store => {
              const postCount = getStorePostCount(store.id);
              const lowestPrice = getStoreLowestPrice(store.id);

              return (
                <button
                  key={store.id}
                  onClick={() => openStoreProfile(store.id)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {getStoreEmoji(store.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 truncate">{store.name}</h4>
                        {store.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {!store.verified && store.totalPosts === 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">NEW</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                          {getStoreTypeLabel(store.type)}
                        </span>
                        {store.rating > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-bold text-gray-600">{store.rating}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{store.address}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-400">{postCount} posts</span>
                        </div>
                        <span className="text-gray-200">|</span>
                        <div className="flex items-center gap-1 text-xs">
                          <ThumbsUp className="w-3 h-3 text-orange-500" />
                          <span className="font-bold text-orange-600">{store.vouchCount}</span>
                        </div>
                        {postCount > 0 && (
                          <>
                            <span className="text-gray-200">|</span>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-400">Lowest:</span>
                              <span className="font-bold text-emerald-600">{lowestPrice}</span>
                            </div>
                          </>
                        )}
                        <span className="text-gray-200">|</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{store.openHours.split('–')[0].trim()}</span>
                        </div> */}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showEmptyState && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No results found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different keyword or category</p>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  openAuthModal();
                  return;
                }
                openCreateStore();
              }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Create Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

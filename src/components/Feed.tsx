import { useEffect, useRef, useState } from 'react';
import { MapPin, SlidersHorizontal, TrendingDown, Flame } from 'lucide-react';
import { usePosts } from '../context/PostsContext';
import { useLocation } from '../context/LocationContext';
import PostCard from './PostCard';

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded-full w-1/3" />
          <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
        </div>
      </div>
      <div className="h-32 bg-gray-100 rounded-xl mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export default function Feed() {
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [customRadius, setCustomRadius] = useState('');
  const { posts, postsLoading } = usePosts();
  const { isWithinRadius, radiusKm, setRadiusKm } = useLocation();
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

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [showRadiusMenu]);

  const nearbyPosts = posts.filter(post => isWithinRadius(post.locationCoords));

  const applyCustomRadius = () => {
    const parsed = Number.parseFloat(customRadius);
    if (!Number.isFinite(parsed)) return;

    // Keep a practical range so an accidental large input does not overload the UI.
    const normalized = Math.min(100, Math.max(0.5, parsed));
    setRadiusKm(Number(normalized.toFixed(1)));
    setShowRadiusMenu(false);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 pt-12 pb-5 px-4 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1 relative">
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight">HanapLokal</h1>
              <div className="flex items-center gap-1 text-orange-100 text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Within {radiusKm}km of you</span>
              </div>
            </div>
            <div ref={radiusMenuRef} className="relative">
              <button
                onClick={() => setShowRadiusMenu(prev => !prev)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Set search radius"
              >
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </button>

              {showRadiusMenu && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-orange-100 p-2 z-40 animate-fade-in-up">
                  <p className="text-[11px] font-bold text-gray-500 px-2 pb-1">Search Radius</p>
                  {[1, 5, 10].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setRadiusKm(option);
                        setShowRadiusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        radiusKm === option
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
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyCustomRadius();
                        }}
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
          </div>

          {/* Quick insights */}
          {/* <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-300" />
                <span className="text-white text-xs font-bold">Pork ↓3%</span>
              </div>
              <p className="text-orange-100 text-[10px] mt-0.5">Lowest ₱175/kg</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-xs font-bold">Rice ₱52/kg</span>
              </div>
              <p className="text-orange-100 text-[10px] mt-0.5">14 reports today</p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-lg mx-auto px-3 pt-3">
        {postsLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : nearbyPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No nearby posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Try increasing your radius or post the first update.</p>
          </div>
        ) : (
          nearbyPosts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

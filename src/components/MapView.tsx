import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { divIcon, type DivIcon } from 'leaflet';
import { ChevronDown, Clock, Filter, MapPin, Navigation, Plus, SlidersHorizontal, Tag, ThumbsUp, X } from 'lucide-react';
import { categories, getCategoryEmoji, getMediaEmoji, getStoreEmoji, getStoreTypeLabel, getTimeAgo } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';
import type { Post } from '../data/mockData';
import type { Store } from '../data/mockData';

type MapMode = 'prices' | 'stores';
const DEFAULT_CENTER: [number, number] = [14.0863, 121.1486];

function iconForMarker(emoji: string, variant: 'default' | 'cheapest' | 'selected' = 'default'): DivIcon {
  const classMap = {
    default: 'bg-orange-500 text-white ring-2 ring-white/90',
    cheapest: 'bg-emerald-500 text-white ring-4 ring-emerald-300/70',
    selected: 'bg-orange-700 text-white ring-4 ring-orange-300/70',
  };

  return divIcon({
    html: `<div class="${classMap[variant]} w-10 h-10 rounded-full text-xl flex items-center justify-center shadow-lg">${emoji}</div>`,
    className: 'hanap-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -16],
  });
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function FlyToFocus({
  posts,
  stores,
  focusId,
  onFocused,
}: {
  posts: Post[];
  stores: Store[];
  focusId: string | null;
  onFocused: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusId) return;
    const post = posts.find(p => p.id === focusId);
    if (post) {
      map.flyTo([post.locationCoords.lat, post.locationCoords.lng], 17, { animate: true, duration: 1 });
      onFocused();
      return;
    }
    const store = stores.find(s => s.id === focusId);
    if (store) {
      map.flyTo([store.locationCoords.lat, store.locationCoords.lng], 17, { animate: true, duration: 1 });
      onFocused();
    }
  }, [focusId, map, posts, stores, onFocused]);
  return null;
}

export default function MapView() {
  const { openPriceHistory, openStoreProfile, openCreateStore, isLoggedIn, openAuthModal, mapFocusId, mapFocusMode, clearMapFocus } = useApp();
  const { posts } = usePosts();
  const { stores, toggleStoreVouch, vouchedStores } = useStores();
  const { userLocation, radiusKm, setRadiusKm, isWithinRadius, refreshUserLocation } = useLocation();

  const [mapMode, setMapMode] = useState<MapMode>('prices');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [customRadius, setCustomRadius] = useState(String(radiusKm));
  const radiusMenuRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const mapCenter: [number, number] = [userLocation.lat || DEFAULT_CENTER[0], userLocation.lng || DEFAULT_CENTER[1]];

  const applyCustomRadius = () => {
    const parsed = Number.parseFloat(customRadius);
    if (!Number.isFinite(parsed)) return;
    if (parsed > 100) {
      alert('Maximum search radius cannot exceed 100 km.');
      return;
    }
    setRadiusKm(Number(Math.max(0.5, parsed).toFixed(1)));
  };

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (radiusMenuRef.current && !radiusMenuRef.current.contains(e.target as Node)) setShowRadiusMenu(false);
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) setShowCategoryMenu(false);
    };
    if (showRadiusMenu || showCategoryMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRadiusMenu, showCategoryMenu]);

  // When focusOnMap() is called from another sheet, switch mode + select the pin
  useEffect(() => {
    if (!mapFocusId) return;
    setMapMode(mapFocusMode);
    setSelectedPin(mapFocusId);
  }, [mapFocusId, mapFocusMode]);

  const storeById = useMemo(() => {
    return new Map(stores.map(store => [store.id, store]));
  }, [stores]);

  const getPostCoords = useCallback((post: (typeof posts)[number]) => {
    // Keep seeded and user posts aligned to their selected store whenever available.
    return storeById.get(post.storeId)?.locationCoords ?? post.locationCoords;
  }, [storeById]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const categoryAllowed = filterCategory === 'All' || post.category === filterCategory;
      return categoryAllowed && isWithinRadius(getPostCoords(post));
    });
  }, [filterCategory, isWithinRadius, posts, storeById]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const categoryAllowed = filterCategory === 'All' || store.categories.includes(filterCategory);
      return categoryAllowed && isWithinRadius(store.locationCoords);
    });
  }, [filterCategory, isWithinRadius, stores]);

  const selectedPost = filteredPosts.find(p => p.id === selectedPin);
  const selectedStore = filteredStores.find(s => s.id === selectedPin);
  const isSelectedStoreVouched = selectedStore ? vouchedStores.has(selectedStore.id) : false;
  const cheapestPost = filteredPosts.reduce((min, post) => ((post.price < min.price) ? post : min), filteredPosts[0]);

  // Compute posts with slight offset for overlapping items so they are all visible
  const mapPosts = useMemo(() => {
    const groups = new Map<string, typeof filteredPosts>();
    filteredPosts.forEach(post => {
      const c = getPostCoords(post);
      const key = `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(post);
    });

    const result: Array<{ post: (typeof filteredPosts)[0]; coords: { lat: number; lng: number } }> = [];
    groups.forEach((groupPosts) => {
      groupPosts.forEach((post, index) => {
        const base = getPostCoords(post);
        if (groupPosts.length === 1) {
          result.push({ post, coords: base });
        } else {
          // Spread overlapped items 15-20 meters apart in a circle
          const radius = 0.00015;
          const angle = (index / groupPosts.length) * Math.PI * 2;
          result.push({
            post,
            coords: {
              lat: base.lat + radius * Math.cos(angle),
              lng: base.lng + radius * Math.sin(angle),
            },
          });
        }
      });
    });
    return result;
  }, [filteredPosts, getPostCoords]);

  return (
    <div className="h-screen flex flex-col pb-20">
      <div className="bg-white pt-12 pb-3 px-4 shadow-sm z-20 relative">
        <div className="max-w-lg mx-auto">
          {/* Header row: title + icon buttons */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">{mapMode === 'prices' ? 'Products Near Me' : 'Nearby Stores'}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                Within {radiusKm}km
                {filterCategory !== 'All' && <span className="ml-1 text-orange-500 font-semibold">· {filterCategory}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Category popover */}
              <div ref={categoryMenuRef} className="relative">
                <button
                  onClick={() => { setShowCategoryMenu(p => !p); setShowRadiusMenu(false); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    filterCategory !== 'All' ? 'bg-orange-500 text-white' : showCategoryMenu ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label="Filter by category"
                >
                  <Tag className="w-4.5 h-4.5" />
                </button>
                {showCategoryMenu && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-orange-100 p-2 z-50 animate-fade-in-up">
                    <p className="text-[11px] font-bold text-gray-500 px-2 pb-1">Category</p>
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {['All', ...categories.filter(c => c !== 'All')].map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setFilterCategory(cat); setShowCategoryMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            filterCategory === cat ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-orange-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Radius popover */}
              <div ref={radiusMenuRef} className="relative">
                <button
                  onClick={() => { setShowRadiusMenu(p => !p); setShowCategoryMenu(false); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    showRadiusMenu ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label="Set search radius"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                {showRadiusMenu && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-orange-100 p-2 z-50 animate-fade-in-up">
                    <p className="text-[11px] font-bold text-gray-500 px-2 pb-1">Search Radius</p>
                    {[1, 5, 10, 25].map(option => (
                      <button
                        key={option}
                        onClick={() => { setRadiusKm(option); setCustomRadius(String(option)); setShowRadiusMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          radiusKm === option ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-orange-50'
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
            </div>
          </div>

          {/* Prices / Stores mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => { setMapMode('prices'); setSelectedPin(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mapMode === 'prices' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
            >
              Prices
            </button>
            <button
              onClick={() => { setMapMode('stores'); setSelectedPin(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mapMode === 'stores' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
            >
              Stores
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={14} className="h-full w-full z-0">
          <RecenterMap center={mapCenter} />
          <FlyToFocus
            posts={filteredPosts}
            stores={filteredStores}
            focusId={mapFocusId}
            onFocused={clearMapFocus}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <CircleMarker
            center={mapCenter}
            radius={8}
            pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          >
            <Popup>Your location</Popup>
          </CircleMarker>

          {mapMode === 'prices' &&
            mapPosts.map(({ post, coords }) => {
              const isCheapest = cheapestPost?.id === post.id;
              const variant = selectedPin === post.id ? 'selected' : isCheapest ? 'cheapest' : 'default';

              return (
                <Marker
                  key={post.id}
                  icon={iconForMarker(getCategoryEmoji(post.category) || getMediaEmoji(post.mediaUrl), variant)}
                  position={[coords.lat, coords.lng]}
                  eventHandlers={{
                    click: () => setSelectedPin(post.id),
                  }}
                >
                  <Popup>
                    <strong>{post.productName}</strong>
                    <div>₱{post.price}/{post.unit}</div>
                  </Popup>
                </Marker>
              );
            })}

          {mapMode === 'stores' &&
            filteredStores.map(store => (
              <Marker
                key={store.id}
                icon={iconForMarker(getStoreEmoji(store.type), selectedPin === store.id ? 'selected' : 'default')}
                position={[store.locationCoords.lat, store.locationCoords.lng]}
                eventHandlers={{
                  click: () => setSelectedPin(store.id),
                }}
              >
                <Popup>
                  <strong>{store.name}</strong>
                  <div>{getStoreTypeLabel(store.type)}</div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        <button
          onClick={() => {
            refreshUserLocation();
          }}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center z-20"
        >
          <Navigation className="w-5 h-5 text-orange-500" />
        </button>

        {mapMode === 'stores' && (
          <button
            onClick={() => {
              if (!isLoggedIn) {
                openAuthModal();
                return;
              }
              openCreateStore();
            }}
            className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl shadow-lg z-20"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-bold">Add Store</span>
          </button>
        )}
      </div>

      {mapMode === 'prices' && selectedPost && (
        <div className="absolute bottom-24 left-3 right-3 max-w-lg mx-auto z-30 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
            <button onClick={() => setSelectedPin(null)} className="absolute top-3 right-3 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <h4 className="font-bold text-gray-900">{selectedPost.productName}</h4>
            <button
              onClick={() => openStoreProfile(selectedPost.storeId)}
              className="flex items-center gap-1 text-sm text-orange-600 font-medium mt-0.5"
            >
              <MapPin className="w-3 h-3" />
              {selectedPost.storeName}
            </button>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-black text-orange-600">₱{selectedPost.price}/{selectedPost.unit}</span>
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {getTimeAgo(selectedPost.timestamp)}
              </span>
            </div>
            <button
              onClick={() => openPriceHistory(selectedPost.id)}
              className="w-full mt-3 py-2.5 bg-orange-50 text-orange-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-1"
            >
              View Product Profile
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
        </div>
      )}

      {mapMode === 'stores' && selectedStore && (
        <div className="absolute bottom-24 left-3 right-3 max-w-lg mx-auto z-30 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
            <button onClick={() => setSelectedPin(null)} className="absolute top-3 right-3 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <h4 className="font-bold text-gray-900">{selectedStore.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{getStoreTypeLabel(selectedStore.type)}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedStore.verified ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {selectedStore.verified ? 'Verified' : 'Unverified'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                {selectedStore.vouchCount} vouches
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{selectedStore.openHours}</p>
            <button
              onClick={() => toggleStoreVouch(selectedStore.id)}
              className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${
                isSelectedStoreVouched ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isSelectedStoreVouched ? 'fill-current' : ''}`} />
              {isSelectedStoreVouched ? 'Vouched Store' : 'Vouch Store'}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${isSelectedStoreVouched ? 'bg-orange-400/60' : 'bg-orange-100'}`}>
                {selectedStore.vouchCount}
              </span>
            </button>
            <button
              onClick={() => openStoreProfile(selectedStore.id)}
              className="w-full mt-2 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-1"
            >
              View Store Profile
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
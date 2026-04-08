import { useEffect, useMemo, useState } from 'react';
import { X, Camera, Video, ChevronRight, ChevronLeft, MapPin, FileText, Check, Search, Star, CheckCircle, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';
import { categories, getStoreEmoji, getStoreTypeLabel } from '../data/mockData';
import { searchPhilippineLocations, type PhilippineLocationResult } from '../services/locationSearch';

const uploadCategories = categories.filter(c => c !== 'All');

const categoryMediaMap: Record<string, string> = {
  Rice: 'rice',
  Meat: 'pork',
  Vegetables: 'tomato',
  Fish: 'fish',
  Eggs: 'eggs',
  'Local Services': 'services',
};

export default function UploadModal() {
  const { showUploadModal, closeUploadModal, openCreateStore } = useApp();
  const { addPost } = usePosts();
  const { stores } = useStores();
  const { userLocation } = useLocation();
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<PhilippineLocationResult[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PhilippineLocationResult | null>(null);
  const [locationError, setLocationError] = useState('');

  const totalSteps = 6;

  useEffect(() => {
    if (!showUploadModal || !navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setCurrentCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setCurrentCoords(null);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [showUploadModal]);

  useEffect(() => {
    if (!showUploadModal || selectedStoreId) {
      setLocationResults([]);
      setLocationError('');
      return;
    }

    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationResults([]);
      setLocationError('');
      return;
    }

    const timer = window.setTimeout(() => {
      setLocationSearchLoading(true);
      setLocationError('');
      void searchPhilippineLocations(query)
        .then(results => {
          setLocationResults(results);
        })
        .catch(() => {
          setLocationError('Unable to load location suggestions right now.');
          setLocationResults([]);
        })
        .finally(() => setLocationSearchLoading(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [locationQuery, selectedStoreId, showUploadModal]);

  const filteredStores = useMemo(
    () => stores.filter(s =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(storeSearch.toLowerCase())
    ),
    [storeSearch, stores]
  );

  if (!showUploadModal) return null;

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleSubmit = () => {
    const store = stores.find(s => s.id === selectedStoreId);
    const fallbackCoords = currentCoords ?? userLocation;
    const resolvedCoords = store?.locationCoords ?? selectedLocation ?? fallbackCoords;
    const resolvedLocation = store?.address ?? selectedLocation?.address ?? (currentCoords ? 'Current location' : 'Tanauan, Batangas');
    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    addPost({
      productName,
      category: finalCategory,
      price: parseFloat(price),
      unit,
      mediaUrl: mediaType ? (categoryMediaMap[category] || productName.toLowerCase().split(' ')[0]) : 'no_media',
      location: resolvedLocation,
      storeName: store?.name || selectedLocation?.name || 'Current Location',
      storeId: selectedStoreId || undefined,
      locationCoords: {
        lat: resolvedCoords.lat,
        lng: resolvedCoords.lng,
      },
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      resetForm();
      closeUploadModal();
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setMediaType(null);
    setPrice('');
    setUnit('kg');
    setCategory('');
    setCustomCategory('');
    setProductName('');
    setSelectedStoreId('');
    setStoreSearch('');
    setLocationQuery('');
    setLocationResults([]);
    setSelectedLocation(null);
    setLocationError('');
    setNote('');
  };

  const handleClose = () => {
    resetForm();
    closeUploadModal();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return price !== '' && parseFloat(price) > 0;
      case 3: return category !== '' && (category !== 'Other' || customCategory.trim().length >= 2);
      case 4: return productName.trim() !== '';
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 m-6 text-center animate-scale-in shadow-2xl max-w-sm w-full">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Price Posted!</h3>
          <p className="text-gray-500 text-sm mt-2">
            Your post for <span className="font-semibold text-gray-700">{productName}</span> at{' '}
            <span className="font-semibold text-orange-600">₱{price}/{unit}</span> is now live.
          </p>
            <p className="text-gray-400 text-xs mt-1">
              📍 {selectedStore?.name || selectedLocation?.name || (currentCoords ? 'Current location' : 'Tanauan, Batangas')}
            </p>
          <p className="text-gray-400 text-xs mt-3">
            Thank you for helping the community find fair prices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <h3 className="font-bold text-gray-900">Post a Price</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Step {step}/{totalSteps}</span>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {/* Step 1: Upload media */}
          {step === 1 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Upload a Photo or Video (Optional)</h4>
              <p className="text-sm text-gray-500 mb-5">Show the product or service for verification, or skip for now.</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMediaType('photo')}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                    mediaType === 'photo'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Camera className={`w-10 h-10 ${mediaType === 'photo' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${mediaType === 'photo' ? 'text-orange-600' : 'text-gray-500'}`}>Photo</span>
                  {mediaType === 'photo' && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setMediaType('video')}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                    mediaType === 'video'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Video className={`w-10 h-10 ${mediaType === 'video' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${mediaType === 'video' ? 'text-orange-600' : 'text-gray-500'}`}>Video</span>
                  {mediaType === 'video' && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              </div>
              <button
                onClick={() => {
                  setMediaType(null);
                  setStep(2);
                }}
                className="w-full mt-4 py-4 rounded-2xl text-sm font-bold bg-gray-900 text-white active:scale-[0.98] transition-all"
              >
                Skip — Continue Without Media
              </button>
            </div>
          )}

          {/* Step 2: Price */}
          {step === 2 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Enter the Price</h4>
              <p className="text-sm text-gray-500 mb-5">What's the price you found?</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-orange-500">₱</span>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="py-4 px-3 bg-gray-100 rounded-2xl text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="kg">per kg</option>
                  <option value="each">each</option>
                  <option value="bundle">bundle</option>
                  <option value="liter">liter</option>
                  <option value="hour">per hour</option>
                  <option value="day">per day</option>
                  <option value="trip">per trip</option>
                  <option value="service">per service</option>
                  <option value="session">per session</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Tip: Use units like per hour, per service, or per trip for local services.
              </p>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Select Category</h4>
              <p className="text-sm text-gray-500 mb-5">What type of product or service is this?</p>
               <div className="grid grid-cols-2 gap-3">
                {uploadCategories.map(cat => {
                  const emojis: Record<string, string> = {
                     Rice: '🍚',
                     Meat: '🥩',
                     Vegetables: '🥬',
                     Fish: '🐟',
                     Eggs: '🥚',
                     Fruits: '🍎',
                     Poultry: '🍗',
                     Seafood: '🦐',
                     Dairy: '🥛',
                     Beverages: '🥤',
                     Spices: '🌶️',
                     Snacks: '🍪',
                     Bakery: '🥖',
                     Household: '🧼',
                     Fuel: '⛽',
                     Pharmacy: '💊',
                     'Local Services': '🔧',
                  };
                  return (
                    <button
                      key={cat}
                       onClick={() => {
                         setCategory(cat);
                         if (cat !== 'Other') setCustomCategory('');
                       }}
                      className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        category === cat
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white hover:border-orange-200'
                      }`}
                    >
                      <span className="text-2xl">{emojis[cat] || '📦'}</span>
                      <p className={`font-semibold mt-1 ${category === cat ? 'text-orange-600' : 'text-gray-700'}`}>{cat}</p>
                    </button>
                  );
                })}
                <button
                  onClick={() => setCategory('Other')}
                  className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                    category === 'Other'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  <span className="text-2xl">🧩</span>
                  <p className={`font-semibold mt-1 ${category === 'Other' ? 'text-orange-600' : 'text-gray-700'}`}>Other</p>
                </button>
              </div>

               {category === 'Other' && (
                 <div className="mt-4">
                   <label className="block text-xs font-semibold text-gray-500 mb-2">Custom Category</label>
                   <input
                     type="text"
                     value={customCategory}
                     onChange={e => setCustomCategory(e.target.value)}
                     placeholder="e.g., Pet Supplies, Construction"
                     className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                   />
                 </div>
               )}
            </div>
          )}

          {/* Step 4: Product Name */}
          {step === 4 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Name</h4>
              <p className="text-sm text-gray-500 mb-5">What is the product or service called?</p>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g., Pork Belly, Motorcycle Ride"
                className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {['Pork Belly', 'Well-milled Rice', 'Tilapia', 'Bangus', 'Chicken', 'Tomatoes', 'Onion', 'Haircut', 'Massage', 'Motorcycle Ride'].map(s => (
                    <button
                      key={s}
                      onClick={() => setProductName(s)}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Store Selection */}
          {step === 5 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Mention a Store (Optional)</h4>
              <p className="text-sm text-gray-500 mb-4">If selected, your post uses that store location. If not, we'll use your current location.</p>

              <button
                  onClick={() => {
                    setSelectedStoreId('');
                    setSelectedLocation(
                      currentCoords
                        ? {
                            id: 'current-location',
                            name: 'Current location',
                            address: 'Current location',
                            lat: currentCoords.lat,
                            lng: currentCoords.lng,
                          }
                        : null
                    );
                  }}
                className={`w-full flex items-center gap-3 p-3 mb-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  selectedStoreId === ''
                    ? 'bg-blue-50 ring-2 ring-blue-400'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedStoreId === '' ? 'bg-blue-100' : 'bg-white'}`}>
                  <MapPin className={`w-5 h-5 ${selectedStoreId === '' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold text-sm ${selectedStoreId === '' ? 'text-blue-700' : 'text-gray-900'}`}>Use Current Location</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {locationLoading ? 'Detecting your location...' : currentCoords ? 'Post will be pinned to your live location' : 'Fallback location will be Tanauan, Batangas'}
                  </p>
                </div>
                {selectedStoreId === '' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>

              {/* Create New Store Button */}
              <button
                onClick={() => openCreateStore()}
                className="w-full flex items-center gap-3 p-3 mb-3 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 text-left transition-all active:scale-[0.98] hover:bg-orange-50"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-orange-700">Create New Store</span>
                  <p className="text-[11px] text-orange-500 mt-0.5">Can't find the store? Add it to the community.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
              </button>

              {/* Search bar */}
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="Search stores..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {selectedStoreId === '' && (
                <div className="mb-3 rounded-2xl border border-gray-100 p-3 bg-white">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pin exact location in the Philippines</p>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={e => {
                        setLocationQuery(e.target.value);
                        setSelectedLocation(null);
                      }}
                      placeholder="Search barangay, city, or landmark"
                      className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  {locationSearchLoading && <p className="text-xs text-gray-400 mt-2">Searching Philippines locations...</p>}
                  {locationError && <p className="text-xs text-red-500 mt-2">{locationError}</p>}

                  {!locationSearchLoading && locationResults.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto">
                      {locationResults.map(result => {
                        const isSelected = selectedLocation?.id === result.id;
                        return (
                          <button
                            key={result.id}
                            onClick={() => {
                              setSelectedLocation(result);
                              setLocationQuery(result.address);
                            }}
                            className={`w-full rounded-xl text-left px-3 py-2 transition-colors ${isSelected ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                          >
                            <p className="text-xs font-semibold truncate">{result.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{result.address}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Store list */}
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {filteredStores.map(store => {
                  const isSelected = selectedStoreId === store.id;
                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'bg-orange-50 ring-2 ring-orange-400'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        isSelected ? 'bg-orange-100' : 'bg-white'
                      }`}>
                        {getStoreEmoji(store.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-sm truncate ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>
                            {store.name}
                          </span>
                          {store.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          )}
                          {!store.verified && store.totalPosts === 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{getStoreTypeLabel(store.type)}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className={`text-[10px] font-semibold ${store.verified ? 'text-blue-600' : 'text-gray-500'}`}>
                            {store.verified ? 'Verified' : 'Unverified'}
                          </span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-orange-600 font-semibold">{store.vouchCount} vouches</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          {store.rating > 0 ? (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              <span className="text-[10px] text-gray-500">{store.rating}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">No ratings yet</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gray-300" />
                          <span className="text-[10px] text-gray-400 truncate">{store.address}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {filteredStores.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">No stores found</p>
                    <p className="text-gray-300 text-xs mt-1">Try a different search term or create a new store</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Note + Summary */}
          {step === 6 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Add a Note (Optional)</h4>
              <p className="text-sm text-gray-500 mb-5">Any additional details about this price?</p>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g., Price is per kilo, only available in the morning..."
                  rows={3}
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              {/* Summary preview */}
              <div className="mt-4 bg-orange-50 rounded-2xl p-4">
                <h5 className="text-sm font-bold text-orange-800 mb-3">Post Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product</span>
                    <span className="font-semibold text-gray-900">{productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-black text-orange-600">₱{price}/{unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-semibold text-gray-900">{category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Source</span>
                    <span className="font-semibold text-gray-900">{selectedStore?.name || selectedLocation?.name || 'Current Location'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Media</span>
                    <span className="font-semibold text-gray-900 capitalize">{mediaType ?? 'none'}</span>
                  </div>
                  {note && (
                    <div className="pt-2 border-t border-orange-200">
                      <span className="text-gray-500">Note:</span>
                      <p className="font-medium text-gray-700 mt-0.5">{note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (step < totalSteps) {
                setStep(s => s + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={!canProceed()}
            className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              canProceed()
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === totalSteps ? (
              <>Post Price</>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

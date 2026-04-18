import { useEffect, useMemo, useState, useRef } from 'react';
import { X, Camera, Video, ChevronRight, ChevronLeft, MapPin, FileText, Check, Search, Star, CheckCircle, Plus, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';
import { categories, getStoreEmoji, getStoreTypeLabel } from '../data/mockData';
import { searchPhilippineLocations, type PhilippineLocationResult } from '../services/locationSearch';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinary';

const uploadCategories = categories.filter(c => c !== 'All');

const categoryMediaMap: Record<string, string> = {
  Rice: 'rice', Meat: 'pork', Vegetables: 'tomato', Fish: 'fish', Eggs: 'eggs',
  'Local Services': 'services', 'Local Food': 'food', 'Ready to Eat': 'food',
};

const SUPER_GROUPS = [
  { id: 'grocery', label: 'Grocery & Food', emoji: '🛒', desc: 'Rice, Meat, Vegetables, Fish, Eggs & more' },
  { id: 'household', label: 'Household & Retail', emoji: '🏬', desc: 'Household, Fuel, Pharmacy, Clothing & more' },
  { id: 'services', label: 'Services', emoji: '🔧', desc: 'Personal, Transport, Home, Health & more' },
];

const SUB_CATS: Record<string, string[]> = {
  grocery: ['Rice','Meat','Vegetables','Fish','Eggs','Fruits','Poultry','Seafood','Dairy','Beverages','Spices','Snacks','Bakery'],
  household: ['Household','Fuel','Pharmacy','Clothing','Electronics','Hardware'],
  services: ['Haircut','Barber','Salon','Massage','Spa','Beauty','Motorcycle Ride','Tricycle Ride','Delivery Service','Courier','Plumbing','Electrical','Carpentry','Welding','Painting','Cleaning Service','Car Wash','Car Repair','Motorcycle Repair','Restaurant','Catering','Food Delivery','Baking Service','Tutoring','Doctor Consultation','Dental Service','Physical Therapy','Fitness Coaching','Photography','Event Catering','DJ Service','Pet Grooming','Pet Veterinary','Pet Training'],
};

const CAT_EMOJI: Record<string, string> = {
  Rice:'🍚', Meat:'🥩', Vegetables:'🥬', Fish:'🐟', Eggs:'🥚', Fruits:'🍎', Poultry:'🍗', Seafood:'🦐', Dairy:'🥛', Beverages:'🥤', Spices:'🌶️', Snacks:'🍪', Bakery:'🥖',
  Household:'🧼', Fuel:'⛽', Pharmacy:'💊', Clothing:'👗', Electronics:'📱', Hardware:'🔧',
  Haircut:'✂️', Barber:'💈', Salon:'💅', Massage:'💆', Spa:'🧖', Beauty:'💄', 'Motorcycle Ride':'🏍️', 'Tricycle Ride':'🛺', 'Delivery Service':'🚚', Courier:'📦', Plumbing:'🚰', Electrical:'⚡', Carpentry:'🪛', Welding:'🔥', Painting:'🎨', 'Cleaning Service':'🧹', 'Car Wash':'🚗', 'Car Repair':'🔩', 'Motorcycle Repair':'🏍️', Restaurant:'🍽️', Catering:'🍴', 'Food Delivery':'🍜', 'Baking Service':'🎂', Tutoring:'📚', 'Doctor Consultation':'⚕️', 'Dental Service':'🦷', 'Physical Therapy':'🏃', 'Fitness Coaching':'💪', Photography:'📸', 'Event Catering':'🎉', 'DJ Service':'🎧', 'Pet Grooming':'🛁', 'Pet Veterinary':'🐾', 'Pet Training':'🐕',
};

const UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  grocery: [{value:'kg',label:'per kg'},{value:'each',label:'each'},{value:'bundle',label:'bundle'},{value:'liter',label:'liter'},{value:'pack',label:'pack'}],
  household: [{value:'each',label:'each'},{value:'bottle',label:'bottle'},{value:'pack',label:'pack'},{value:'set',label:'set'},{value:'liter',label:'liter'}],
  services: [{value:'service',label:'per service'},{value:'hour',label:'per hour'},{value:'session',label:'per session'},{value:'trip',label:'per trip'},{value:'day',label:'per day'}],
};

const CAT_SUGGESTIONS: Record<string, string[]> = {
  Rice: ['Well-milled Rice','Sinandomeng','NFA Rice','Brown Rice'],
  Meat: ['Pork Belly','Pork Kasim','Chicken Breast','Beef Brisket','Liempo'],
  Vegetables: ['Tomatoes','Onion','Garlic','Ampalaya','Kangkong'],
  Fish: ['Tilapia','Bangus','Galunggong','Tuna','Maya-maya'],
  Eggs: ['Eggs (Large)','Eggs (Medium)','Duck Eggs','Quail Eggs'],
  Fruits: ['Banana','Mango','Papaya','Watermelon','Pineapple'],
  Poultry: ['Chicken (Whole)','Chicken Thigh','Chicken Wings','Duck'],
  Seafood: ['Shrimp','Squid','Crab','Tahong','Halaan'],
  Dairy: ['Fresh Milk','Cheese','Butter','Yogurt'],
  Beverages: ['Bottled Water','Softdrinks','Juice','Coffee'],
  Snacks: ['Chips','Crackers','Nuts','Candy'],
  Bakery: ['Pandesal','Tasty Bread','Cake','Ensaymada'],
  Household: ['Detergent','Dishwashing Soap','Fabric Conditioner','Bleach','Toilet Paper'],
  Fuel: ['Gasoline (Ron95)','Diesel','LPG Tank','Kerosene'],
  Pharmacy: ['Paracetamol','Vitamins','Amoxicillin','Ibuprofen'],
  Clothing: ['T-Shirt','Jeans','Dress','Sandals','School Uniform'],
  Electronics: ['Phone Charger','Earphones','Extension Cord','LED Bulb'],
  Hardware: ['Nails','Paint','Cement','PVC Pipe'],
  Haircut: ['Basic Haircut','Kids Haircut','Fade Cut'],
  Barber: ['Basic Cut','Shave','Hair & Beard Trim'],
  Salon: ['Hair Rebond','Hair Color','Keratin Treatment','Manicure'],
  Massage: ['Full Body Massage','Swedish Massage','Foot Massage'],
  'Motorcycle Ride': ['Ride to Poblacion','Ride to Terminal','Barrio Route'],
  'Tricycle Ride': ['Tricycle to Market','Terminal to Barrio'],
  Restaurant: ['Silog Meal','Merienda Set','Barkada Meal'],
  Plumbing: ['Pipe Repair','Drain Unclogging','Faucet Replacement'],
  Electrical: ['Wiring Installation','Outlet Repair','Lighting Setup'],
  Tutoring: ['Math Tutoring','Science Review','English Lesson'],
  Photography: ['Event Coverage','Portrait Session','Product Photos'],
};

const superGroupOf = (cat: string) => Object.entries(SUB_CATS).find(([, v]) => v.includes(cat))?.[0] ?? 'grocery';

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
  const [categorySearch, setCategorySearch] = useState('');
  const [superCategory, setSuperCategory] = useState('');
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

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Auto-reset unit when category changes
  useEffect(() => {
    if (!category) return;
    const group = superGroupOf(category);
    const defaults: Record<string, string> = { grocery: 'kg', household: 'each', services: 'service' };
    setUnit(defaults[group] ?? 'kg');
  }, [category]);

  const filteredStores = useMemo(
    () => stores.filter(s =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(storeSearch.toLowerCase())
    ),
    [storeSearch, stores]
  );

  if (!showUploadModal) return null;

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.type.startsWith('video/')) {
      setUploadError('Video upload is currently disabled. Please upload a photo.');
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File too large. Max 10MB for photos.');
      return;
    }
    setMediaFile(file);
    setMediaType('photo');
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerFileSelect = (_type?: string) => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    let finalMediaUrl = mediaType ? (categoryMediaMap[category] || productName.toLowerCase().split(' ')[0]) : 'no_media';

    if (mediaFile && isCloudinaryConfigured) {
      setIsUploading(true);
      try {
        finalMediaUrl = await uploadToCloudinary(mediaFile);
      } catch (err) {
        console.error('[HanapLokal] Cloudinary upload failed:', err);
        setUploadError('Upload failed — posting with a placeholder image instead.');
        // Continue with fallback
      } finally {
        setIsUploading(false);
      }
    }

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
      mediaUrl: finalMediaUrl,
      mediaType: mediaType ?? null,
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
    setCategorySearch('');
    setSuperCategory('');
    setProductName('');
    setSelectedStoreId('');
    setStoreSearch('');
    setLocationQuery('');
    setLocationResults([]);
    setSelectedLocation(null);
    setLocationError('');
    setNote('');
    setMediaFile(null);
    setMediaPreview(null);
    setUploadError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    closeUploadModal();
  };

  const activeGroup = category ? superGroupOf(category) : (superCategory || 'grocery');
  const unitOpts = UNIT_OPTIONS[activeGroup] ?? UNIT_OPTIONS.grocery;
  const suggestions = CAT_SUGGESTIONS[category] ?? [];

  const canProceed = () => {
    switch (step) {
      case 1: return category !== '' && (category !== 'Other' || customCategory.trim().length >= 2);
      case 2: return price !== '' && parseFloat(price) > 0;
      case 3: return productName.trim() !== '';
      case 4: return true;
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
          {/* Hidden file input – always rendered so refs work */}
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />

          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Select Category</h4>
              <p className="text-sm text-gray-500 mb-4">What type of product or service is this?</p>
              {!superCategory ? (
                <div className="flex flex-col gap-3">
                  {SUPER_GROUPS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setSuperCategory(g.id); setCategory(''); }}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-[0.98] text-left"
                    >
                      <span className="text-4xl">{g.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{g.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{g.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => { setSuperCategory(''); setCategory(''); }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 mb-4 active:opacity-70"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {SUPER_GROUPS.find(g => g.id === superCategory)?.label}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    {SUB_CATS[superCategory].map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setCategory(cat); setCustomCategory(''); }}
                        className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                          category === cat ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'
                        }`}
                      >
                        <span className="text-2xl">{CAT_EMOJI[cat] || '📦'}</span>
                        <p className={`font-semibold mt-1 text-sm ${category === cat ? 'text-orange-600' : 'text-gray-700'}`}>{cat}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => setCategory('Other')}
                      className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        category === 'Other' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'
                      }`}
                    >
                      <span className="text-2xl">🧩</span>
                      <p className={`font-semibold mt-1 text-sm ${category === 'Other' ? 'text-orange-600' : 'text-gray-700'}`}>Other</p>
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

              {/* Create Store shortcut */}
              <button
                onClick={() => { handleClose(); setTimeout(() => openCreateStore(), 200); }}
                className="mt-4 w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700/60 bg-orange-50/50 dark:bg-orange-900/20 text-left transition-all active:scale-[0.98] hover:bg-orange-50 dark:hover:bg-orange-900/30"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-orange-700 dark:text-orange-400">Create a Store</span>
                  <p className="text-[11px] text-orange-500 dark:text-orange-500/80 mt-0.5">Add a new store to the community</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Step 2: Price */}
          {step === 2 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Enter the Price</h4>
              <p className="text-sm text-gray-500 mb-2">What's the price you found?</p>
              {category && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{CAT_EMOJI[category] || '📦'}</span>
                  <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">{category}</span>
                </div>
              )}
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
                  {unitOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Product Name */}
          {step === 3 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Product / Service Name</h4>
              <p className="text-sm text-gray-500 mb-2">What is it called?</p>
              {category && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{CAT_EMOJI[category] || '📦'}</span>
                  <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">{category}</span>
                </div>
              )}
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder={suggestions[0] ? `e.g., ${suggestions[0]}` : 'e.g., Pork Belly, Haircut'}
                className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Suggestions for {category}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(s => (
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
              )}
            </div>
          )}
          {/* Step 4: Photo upload */}
          {step === 4 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Add a Photo (Optional)</h4>
              <p className="text-sm text-gray-500 mb-4">Show the product or price tag for community trust. You can skip this.</p>
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium">{uploadError}</p>
                </div>
              )}
              {mediaPreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 border-2 border-orange-200 mb-4 group" style={{ aspectRatio: '4/3' }}>
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => triggerFileSelect('photo')} className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Upload className="w-4 h-4" />Change
                    </button>
                    <button onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Remove</button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-white text-[10px] font-bold">
                    {(mediaFile!.size / (1024 * 1024)).toFixed(1)}MB
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => triggerFileSelect('photo')}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Tap to upload a photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · Max 10MB</p>
                  </div>
                </button>
              )}
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
                className={`w-full flex items-center gap-3 p-3 mb-3 rounded-2xl text-left transition-all active:scale-[0.98] ${selectedStoreId === ''
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
                className="w-full flex items-center gap-3 p-3 mb-3 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700/60 bg-orange-50/50 dark:bg-orange-900/20 text-left transition-all active:scale-[0.98] hover:bg-orange-50 dark:hover:bg-orange-900/30"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-orange-700 dark:text-orange-400">Create New Store</span>
                  <p className="text-[11px] text-orange-500 dark:text-orange-500/80 mt-0.5">Can't find the store? Add it to the community.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
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
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${isSelected
                          ? 'bg-orange-50 ring-2 ring-orange-400'
                          : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isSelected ? 'bg-orange-100' : 'bg-white'
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
            disabled={!canProceed() || isUploading}
            className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${canProceed() && !isUploading
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : step === totalSteps ? (
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

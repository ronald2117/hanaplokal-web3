import { useEffect, useState, useRef, useMemo } from 'react';
import { X, Check, Camera, MapPin, Search, Star, CheckCircle, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';
import { categories, getStoreEmoji, getStoreTypeLabel, getMediaGradient, getMediaEmoji } from '../data/mockData';
import { searchPhilippineLocations, type PhilippineLocationResult } from '../services/locationSearch';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinary';

const SUPER_GROUPS = [
  { id: 'grocery', label: 'Grocery & Food', emoji: '🛒' },
  { id: 'household', label: 'Household & Retail', emoji: '🏬' },
  { id: 'services', label: 'Services', emoji: '🔧' },
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

const categoryMediaMap: Record<string, string> = {
  Rice: 'rice', Meat: 'pork', Vegetables: 'tomato', Fish: 'fish', Eggs: 'eggs',
  'Local Services': 'services', 'Local Food': 'food', 'Ready to Eat': 'food',
};

const superGroupOf = (cat: string) => Object.entries(SUB_CATS).find(([, v]) => v.includes(cat))?.[0] ?? 'grocery';

export default function EditPostModal() {
  const { showEditPost, closeEditPost } = useApp();
  const { posts, updatePost } = usePosts();
  const { stores } = useStores();
  const { userLocation } = useLocation();
  const post = posts.find(p => p.id === showEditPost);

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<PhilippineLocationResult[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PhilippineLocationResult | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [hasChangedMedia, setHasChangedMedia] = useState(false);

  useEffect(() => {
    if (post) {
      setProductName(post.productName);
      setPrice(post.price.toString());
      setUnit(post.unit);
      
      const isStandardCat = Object.values(SUB_CATS).flat().includes(post.category);
      if (isStandardCat) {
        setCategory(post.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(post.category);
      }
      
      setSelectedStoreId(post.storeId || '');
      
      if (!post.storeId) {
        setSelectedLocation({
          id: `tmp_${post.locationCoords.lat}`,
          name: post.location,
          address: post.location,
          lat: post.locationCoords.lat,
          lng: post.locationCoords.lng,
        });
        setLocationQuery(post.location);
      }
      
      // Setup initial media preview
      if (post.mediaUrl.startsWith('http')) {
        setMediaPreview(post.mediaUrl);
        setMediaType(post.mediaType);
      } else {
        setMediaPreview(null);
        setMediaType(null);
      }
      setMediaFile(null);
      setHasChangedMedia(false);
    }
  }, [post]);

  useEffect(() => {
    if (!showEditPost || selectedStoreId) {
      setLocationResults([]);
      return;
    }
    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setLocationSearchLoading(true);
      void searchPhilippineLocations(query)
        .then(setLocationResults)
        .catch(() => setLocationResults([]))
        .finally(() => setLocationSearchLoading(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [locationQuery, selectedStoreId, showEditPost]);

  const filteredStores = useMemo(
    () => stores.filter(s =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(storeSearch.toLowerCase())
    ),
    [storeSearch, stores]
  );

  if (!showEditPost || !post) return null;
  
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
    setHasChangedMedia(true);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    let finalMediaUrl = post.mediaUrl;
    
    if (hasChangedMedia) {
      if (!mediaFile) {
        // User removed the image
        finalMediaUrl = categoryMediaMap[category] || productName.toLowerCase().split(' ')[0] || 'no_media';
      } else if (isCloudinaryConfigured) {
        setIsUploading(true);
        try {
          finalMediaUrl = await uploadToCloudinary(mediaFile);
        } catch (err) {
          console.error('Cloudinary upload failed:', err);
          setUploadError('Upload failed — using fallback image.');
          finalMediaUrl = categoryMediaMap[category] || 'no_media';
        } finally {
          setIsUploading(false);
        }
      }
    }

    const store = stores.find(s => s.id === selectedStoreId);
    let resolvedCoords = post.locationCoords;
    let resolvedLocation = post.location;
    
    if (store) {
      resolvedCoords = store.locationCoords;
      resolvedLocation = store.address;
    } else if (selectedLocation) {
      resolvedCoords = { lat: selectedLocation.lat, lng: selectedLocation.lng };
      resolvedLocation = selectedLocation.address;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    updatePost(post.id, {
      productName,
      category: finalCategory,
      price: parseFloat(price) || post.price,
      unit,
      mediaUrl: finalMediaUrl,
      mediaType: hasChangedMedia ? mediaType : post.mediaType,
      location: resolvedLocation,
      storeName: store?.name || selectedLocation?.name || 'Current Location',
      storeId: selectedStoreId || '',
      locationCoords: resolvedCoords,
    });

    setIsSaving(false);
    closeEditPost();
  };

  const isFormValid = productName.trim().length > 0 && 
    parseFloat(price) > 0 && 
    category !== '' &&
    (category !== 'Other' || customCategory.trim().length > 0);

  const activeGroup = category ? superGroupOf(category) : 'grocery';
  const unitOpts = UNIT_OPTIONS[activeGroup] ?? UNIT_OPTIONS.grocery;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEditPost} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">Edit Post</h3>
          <button onClick={closeEditPost} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
          
          {/* Section: Image */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Product Photo</h4>
            {uploadError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>{uploadError}</p>
              </div>
            )}
            
            {mediaPreview ? (
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 border-2 border-orange-200 aspect-[4/3] group">
                {mediaType === 'video' ? (
                  <video src={mediaPreview} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95">
                    <Upload className="w-4 h-4" /> Change
                  </button>
                  <button onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); setHasChangedMedia(true); }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold active:scale-95">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Add a photo</p>
              </button>
            )}
          </div>

          {/* Section: Category */}
          <div>
             <h4 className="text-sm font-bold text-gray-900 mb-2">Category</h4>
             <select
               value={category}
               onChange={e => {
                 setCategory(e.target.value);
                 if (e.target.value !== 'Other') setCustomCategory('');
               }}
               className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
             >
               <option value="" disabled>Select a category</option>
               {Object.entries(SUB_CATS).map(([group, cats]) => (
                 <optgroup key={group} label={SUPER_GROUPS.find(g => g.id === group)?.label}>
                   {cats.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                 </optgroup>
               ))}
               <option value="Other">🧩 Other / Custom</option>
             </select>
             
             {category === 'Other' && (
               <input
                 type="text"
                 value={customCategory}
                 onChange={e => setCustomCategory(e.target.value)}
                 placeholder="Enter custom category"
                 className="w-full mt-2 px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
               />
             )}
          </div>

          {/* Section: Product Name */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Product Name & Price</h4>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Product or service name"
              className="w-full mb-2 px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-orange-500">₱</span>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Price"
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl text-lg font-black border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-28 px-3 py-3 bg-gray-50 rounded-xl font-medium border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {unitOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Section: Location / Store */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Location</h4>
            
            <button
                onClick={() => setSelectedStoreId('')}
                className={`w-full flex items-center gap-3 p-3 mb-3 rounded-xl text-left border ${selectedStoreId === ''
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedStoreId === '' ? 'bg-blue-100' : 'bg-white'}`}>
                  <MapPin className={`w-4 h-4 ${selectedStoreId === '' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold text-sm block ${selectedStoreId === '' ? 'text-blue-700' : 'text-gray-900'}`}>Map Location</span>
                  {selectedStoreId === '' && selectedLocation && (
                    <span className="text-[10px] text-gray-500 truncate block">{selectedLocation.address}</span>
                  )}
                </div>
              </button>

              {selectedStoreId === '' && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={e => {
                        setLocationQuery(e.target.value);
                        setSelectedLocation(null);
                      }}
                      placeholder="Search barangay, city, or landmark"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  {locationResults.length > 0 && (
                    <div className="mt-2 border border-gray-100 rounded-lg max-h-32 overflow-y-auto bg-white">
                      {locationResults.map(res => (
                        <button
                          key={res.id}
                          onClick={() => {
                            setSelectedLocation(res);
                            setLocationQuery(res.address);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs truncate hover:bg-orange-50 ${selectedLocation?.id === res.id ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600'}`}
                        >
                          {res.address}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="relative mb-3 pt-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">Or select a store:</p>
                <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="Search stores..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-1 bg-white">
                {filteredStores.map(store => {
                  const isSelected = selectedStoreId === store.id;
                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left ${isSelected ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                        {getStoreEmoji(store.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>{store.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{store.address}</p>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mx-1" />}
                    </button>
                  );
                })}
              </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving || isUploading}
            className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isFormValid && !isSaving && !isUploading ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving || isUploading ? 'Saving...' : (
              <>
                <Check className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

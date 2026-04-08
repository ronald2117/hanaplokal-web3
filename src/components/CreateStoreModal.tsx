import { useEffect, useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  FileText,
  Check,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStores } from '../context/StoresContext';
import type { Store as StoreType } from '../data/mockData';
import { getStoreEmoji, getStoreTypeLabel } from '../data/mockData';
import { searchPhilippineLocations, type PhilippineLocationResult } from '../services/locationSearch';

const storeTypes: StoreType['type'][] = [
  'supermarket',
  'wet_market',
  'fish_port',
  'neighborhood',
  'mall',
  'stall',
  'salon',
  'barbershop',
  'pharmacy',
  'bakery',
  'restaurant',
  'hardware',
  'clothing',
  'other',
];

const storeTypeDescriptions: Record<StoreType['type'], string> = {
  supermarket: 'Large retail grocery store',
  wet_market: 'Traditional fresh food market',
  fish_port: 'Fish & seafood market/port',
  neighborhood: 'Sari-sari or corner store',
  mall: 'Mall or department store',
  stall: 'Individual market stall',
  salon: 'Beauty salon or nail spa',
  barbershop: 'Barbershop or men\'s grooming',
  pharmacy: 'Drugstore or pharmacy',
  bakery: 'Bakery or panaderya',
  restaurant: 'Restaurant, carinderia, or eatery',
  hardware: 'Hardware or construction supply',
  clothing: 'Clothing, RTW, or ukay-ukay',
  other: 'Other type of store',
};

const allCategories = ['Rice', 'Meat', 'Vegetables', 'Fish', 'Eggs', 'Local Services'];

export default function CreateStoreModal() {
  const { showCreateStore, closeCreateStore, isLoggedIn, openAuthModal } = useApp();
  const { addStore } = useStores();

  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState<StoreType['type'] | ''>('');
  const [address, setAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PhilippineLocationResult | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<PhilippineLocationResult[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openHours, setOpenHours] = useState('');
  const [openTime, setOpenTime] = useState('6:00 AM');
  const [closeTime, setCloseTime] = useState('6:00 PM');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 5;

  useEffect(() => {
    if (!showCreateStore || isLoggedIn) return;
    openAuthModal();
    closeCreateStore();
  }, [closeCreateStore, isLoggedIn, openAuthModal, showCreateStore]);

  useEffect(() => {
    if (!showCreateStore) return;
    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationResults([]);
      setLocationError('');
      return;
    }

    const timer = window.setTimeout(() => {
      setLocationLoading(true);
      setLocationError('');
      void searchPhilippineLocations(query)
        .then(results => setLocationResults(results))
        .catch(() => {
          setLocationError('Unable to load locations. Try a more specific place name.');
          setLocationResults([]);
        })
        .finally(() => setLocationLoading(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [locationQuery, showCreateStore]);

  if (!showCreateStore || !isLoggedIn) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const finalAddress = selectedLocation?.address || address;
  const finalOpenHours = openHours || `${openTime} – ${closeTime}`;

  const canProceed = () => {
    switch (step) {
      case 1:
        return storeName.trim().length >= 2;
      case 2:
        return storeType !== '';
      case 3:
        return finalAddress.trim().length > 0;
      case 4:
        return selectedCategories.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    addStore({
      name: storeName.trim(),
      type: storeType as StoreType['type'],
      address: finalAddress,
      location: selectedLocation?.name || 'Philippines',
      locationCoords: selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : {
            lat: 14.0863,
            lng: 121.1486,
          },
      categories: selectedCategories,
      openHours: finalOpenHours,
      description: description.trim() || `Community-added store in Tanauan.`,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      resetForm();
      closeCreateStore();
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setStoreName('');
    setStoreType('');
    setAddress('');
    setSelectedLocation(null);
    setLocationQuery('');
    setLocationResults([]);
    setLocationError('');
    setSelectedCategories([]);
    setOpenHours('');
    setOpenTime('6:00 AM');
    setCloseTime('6:00 PM');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    closeCreateStore();
  };

  // Success screen
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 m-6 text-center animate-scale-in shadow-2xl max-w-sm w-full">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Store Created!</h3>
          <p className="text-gray-500 text-sm mt-2">
            <span className="font-semibold text-gray-700">{storeName}</span> has been added to HanapLokal.
          </p>
          <p className="text-gray-400 text-xs mt-3">
            You and others can now tag this store when posting prices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Create Store</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">
              Step {step}/{totalSteps}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
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
        <div className="p-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {/* Step 1: Store Name */}
          {step === 1 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Store Name</h4>
              <p className="text-sm text-gray-500 mb-5">
                What's the name of this store or market stall?
              </p>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="e.g., Aling Rosa's Vegetable Stall"
                className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                autoFocus
              />
              {storeName.trim().length > 0 && storeName.trim().length < 2 && (
                <p className="text-xs text-red-400 mt-2">Name must be at least 2 characters</p>
              )}
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Aling Nena\'s Stall',
                    'Kuya Boy\'s Fish',
                    'Mang Tomas Meat Shop',
                    'Nanay\'s Sari-sari',
                    'Fresh Veggie Corner',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => setStoreName(s)}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Store Type */}
          {step === 2 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Store Type</h4>
              <p className="text-sm text-gray-500 mb-5">What kind of store is this?</p>
              <div className="grid grid-cols-2 gap-3">
                {storeTypes.map(type => {
                  const isSelected = storeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setStoreType(type)}
                      className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white hover:border-orange-200'
                      }`}
                    >
                      <span className="text-2xl">{getStoreEmoji(type)}</span>
                      <p
                        className={`font-semibold mt-1 text-sm ${
                          isSelected ? 'text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        {getStoreTypeLabel(type)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {storeTypeDescriptions[type]}
                      </p>
                      {isSelected && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-2">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Location / Address */}
          {step === 3 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Store Location</h4>
              <p className="text-sm text-gray-500 mb-5">
                Where is this store located?
              </p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Search Philippines Locations
              </p>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={e => {
                    setLocationQuery(e.target.value);
                    setSelectedLocation(null);
                    setAddress(e.target.value);
                  }}
                  placeholder="Barangay, city, or landmark"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-100 rounded-2xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {locationLoading && <p className="text-xs text-gray-400 mt-2">Searching...</p>}
              {locationError && <p className="text-xs text-red-500 mt-2">{locationError}</p>}

              <div className="space-y-2 mt-3 max-h-[30vh] overflow-y-auto">
                {locationResults.map(result => {
                  const isSelected = selectedLocation?.id === result.id;
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        setSelectedLocation(result);
                        setAddress(result.address);
                        setLocationQuery(result.address);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                        isSelected ? 'bg-orange-50 ring-2 ring-orange-400' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-orange-100' : 'bg-white'}`}>
                        <MapPin className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold text-sm ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>
                          {result.name}
                        </span>
                        <p className="text-[11px] text-gray-400 truncate">{result.address}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {!locationLoading && locationResults.length === 0 && locationQuery.trim().length >= 3 && (
                <p className="text-xs text-gray-400 mt-3">No matches found. Try a different landmark or barangay.</p>
              )}
            </div>
          )}

          {/* Step 4: Categories */}
          {step === 4 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Product Categories</h4>
              <p className="text-sm text-gray-500 mb-5">
                What does this store sell? Select all that apply.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {allCategories.map(cat => {
                  const isSelected = selectedCategories.includes(cat);
                  const emojis: Record<string, string> = {
                    Rice: '🍚',
                    Meat: '🥩',
                    Vegetables: '🥬',
                    Fish: '🐟',
                    Eggs: '🥚',
                    'Local Services': '🔧',
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`py-4 px-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{emojis[cat] || '📦'}</span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`font-semibold mt-1 ${
                          isSelected ? 'text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        {cat}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {selectedCategories.length} selected
                </span>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map(cat => (
                      <span
                        key={cat}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Hours, Description & Summary */}
          {step === 5 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Details & Review</h4>
              <p className="text-sm text-gray-500 mb-5">
                Add operating hours and a description (optional).
              </p>

              {/* Operating hours */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Operating Hours
                </label>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 mb-3 mt-2">
                  {[
                    { label: 'Early Morning', value: '4:00 AM – 12:00 PM' },
                    { label: 'Morning–Evening', value: '6:00 AM – 6:00 PM' },
                    { label: 'Standard', value: '8:00 AM – 9:00 PM' },
                    { label: 'Mall Hours', value: '10:00 AM – 9:00 PM' },
                    { label: '24 Hours', value: 'Open 24 Hours' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setOpenHours(preset.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        openHours === preset.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom time inputs */}
                {!openHours && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">Opens</label>
                      <select
                        value={openTime}
                        onChange={e => setOpenTime(e.target.value)}
                        className="w-full py-2.5 px-3 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        {[
                          '4:00 AM', '5:00 AM', '5:30 AM', '6:00 AM', '7:00 AM',
                          '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                        ].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-gray-300 font-bold mt-4">–</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 mb-1 block">Closes</label>
                      <select
                        value={closeTime}
                        onChange={e => setCloseTime(e.target.value)}
                        className="w-full py-2.5 px-3 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        {[
                          '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
                          '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
                        ].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., Best fresh vegetables from local farms. Known for affordable leafy greens."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none mt-2"
                />
              </div>

              {/* Summary preview */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
                <h5 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Store Preview
                </h5>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {storeType ? getStoreEmoji(storeType as StoreType['type']) : '🏪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{storeName || '—'}</p>
                    <p className="text-xs text-orange-600 font-semibold">
                      {storeType ? getStoreTypeLabel(storeType as StoreType['type']) : '—'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      📍 {finalAddress || '—'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hours</span>
                    <span className="font-medium text-gray-700 text-xs">{finalOpenHours}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">Categories</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                      {selectedCategories.length > 0
                        ? selectedCategories.map(cat => (
                            <span
                              key={cat}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-orange-600"
                            >
                              {cat}
                            </span>
                          ))
                        : <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </div>
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
              <>
                <Store className="w-5 h-5" />
                Create Store
              </>
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

import { useState } from 'react';
import { X, Bell, Check, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { requestNotificationPermission } from '../services/notifications';

export default function PriceAlertModal() {
  const { showPriceAlert, closePriceAlert } = useApp();
  const { addAlert } = usePosts();
  const [product, setProduct] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [radius, setRadius] = useState('5');
  const [submitted, setSubmitted] = useState(false);

  if (!showPriceAlert) return null;

  const handleSubmit = () => {
    const parsedTarget = Number(targetPrice);
    const parsedRadius = Number(radius);
    const ok = addAlert({
      productName: product.trim(),
      targetPrice: parsedTarget,
      unit: 'kg',
      radius: Number.isFinite(parsedRadius) ? parsedRadius : 5,
      location: 'Current location',
    });
    if (!ok) return;

    void requestNotificationPermission();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setProduct('');
      setTargetPrice('');
      setRadius('5');
      closePriceAlert();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 m-6 text-center shadow-2xl max-w-sm w-full animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Alert Created!</h3>
          <p className="text-gray-500 text-sm mt-2">
            We'll notify you when the price drops.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePriceAlert} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 animate-slide-up shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <button
          onClick={closePriceAlert}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <Bell className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Set Price Alert</h3>
            <p className="text-sm text-gray-500">Get notified when prices drop</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Product */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Product</label>
            <input
              type="text"
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="e.g., Pork Belly"
              className="w-full px-4 py-3.5 bg-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {['Pork Belly', 'Rice', 'Tilapia', 'Eggs', 'Chicken'].map(s => (
                <button
                  key={s}
                  onClick={() => setProduct(s)}
                  className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Alert when price drops below</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-orange-500">₱</span>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-100 rounded-2xl text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Search Radius</label>
            <div className="flex gap-2">
              {['1', '5', '10'].map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    radius === r
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <MapPin className="w-4 h-4 mx-auto mb-0.5" />
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {product && targetPrice && (
            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-sm text-orange-800">
                <span className="font-bold">Alert:</span> Notify me when{' '}
                <span className="font-bold">{product}</span> drops below{' '}
                <span className="font-bold">₱{targetPrice}</span> within{' '}
                <span className="font-bold">{radius}km</span>.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!product || !targetPrice}
          className={`w-full py-4 font-bold rounded-2xl mt-5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            product && targetPrice
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Bell className="w-5 h-5" />
          Create Alert
        </button>
      </div>
    </div>
  );
}

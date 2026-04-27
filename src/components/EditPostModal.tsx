import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';

export default function EditPostModal() {
  const { showEditPost, closeEditPost } = useApp();
  const { posts, updatePost } = usePosts();
  
  const post = posts.find(p => p.id === showEditPost);

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setProductName(post.productName);
      setPrice(post.price.toString());
      setUnit(post.unit);
    }
  }, [post]);

  if (!showEditPost || !post) return null;

  const handleSave = () => {
    setIsSaving(true);
    updatePost(post.id, {
      productName,
      price: parseFloat(price) || post.price,
      unit,
    });
    setTimeout(() => {
      setIsSaving(false);
      closeEditPost();
    }, 500); // small delay to show feedback if wanted
  };

  const handleClose = () => {
    closeEditPost();
  };

  const isFormValid = productName.trim().length > 0 && parseFloat(price) > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl m-6 animate-scale-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Edit Post</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Price</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-orange-500">₱</span>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-24 px-3 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 text-center"
                />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 mt-2">
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isFormValid && !isSaving ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : (
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

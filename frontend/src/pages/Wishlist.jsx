// Wishlist Page Component
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import WishlistButton from '../components/WishlistButton';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { user } = useAuth();
  const { add: addToCart } = useCart();
  const [removingItems, setRemovingItems] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('recent');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
            <svg
              className="w-7 h-7 mx-auto text-pink-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-4">Please login to view your wishlist</p>
            <Link
              to="/login"
              className="inline-block bg-pink-600 text-white px-5 py-2.5 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
            <svg
              className="w-7 h-7 mx-auto text-pink-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-4">
              Start adding products you love to your wishlist!
            </p>
            <Link
              to="/"
              className="inline-block bg-pink-600 text-white px-5 py-2.5 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleRemoveFromWishlist = async (productId) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await clearWishlist();
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    }
  };

  const handleMoveToBag = async (product) => {
    try {
      // Optimistically add to cart
      addToCart(product, 1);
      // Remove from wishlist to mimic Myntra's "Move to Bag"
      await removeFromWishlist(product.id);
    } catch (error) {
      console.error('Error moving to bag:', error);
      alert('Could not move item to bag. Please try again.');
    }
  };

  // Derived items with sorting for a more organized view
  const sortedWishlist = (() => {
    const items = [...wishlist];
    switch (sortOrder) {
      case 'price-low':
        return items.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return items.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name':
        return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return items; // recent/original order
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-1">
              <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21C12 21 4 13.5 4 8.5C4 6.5 5.5 5 7.5 5C9 5 10.5 6 12 7.5C13.5 6 15 5 16.5 5C18.5 5 20 6.5 20 8.5C20 13.5 12 21 12 21Z" />
              </svg>
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-0.5">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Sort wishlist"
            >
              <option value="recent">Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={handleClearWishlist}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Wishlist Grid (Myntra-style) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedWishlist.map((product) => (
            <div
              key={product.id}
              className={`group relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 ${
                removingItems.has(product.id) ? 'opacity-50' : ''
              }`}
            >
              {/* Product Image */}
              <div className="relative bg-gray-100 aspect-[3/4]">
                <img
                  src={product.image || `https://via.placeholder.com/600x800?text=${encodeURIComponent(product.name || 'Product')}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800?text=${encodeURIComponent(product.name || 'Product')}` }}
                />
                <div className="absolute top-2 right-2">
                  <WishlistButton product={product} size="sm" />
                </div>
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-sm font-semibold">
                    Out of Stock
                  </div>
                )}
                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors"></div>
                <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 bg-white/90 text-gray-900 text-sm font-medium py-1.5 rounded-md text-center hover:bg-white"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    disabled={removingItems.has(product.id)}
                    className="flex-1 bg-pink-600/90 text-white text-sm font-medium py-1.5 rounded-md hover:bg-pink-700 disabled:opacity-60"
                  >
                    {removingItems.has(product.id) ? 'Removing…' : 'Remove'}
                  </button>
                  <button
                    onClick={() => handleMoveToBag(product)}
                    className="flex-1 bg-black/70 text-white text-sm font-medium py-1.5 rounded-md hover:bg-black"
                  >
                    Move to Bag
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1 capitalize">
                  {product.category}
                </p>
                {/* Price & meta */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">${product.price}</span>
                  {product.stock > 0 && (
                    <span className="text-xs text-green-600 font-medium">In Stock ({product.stock})</span>
                  )}
                </div>
                {/* Rating */}
                {product.rating > 0 && (
                  <div className="mt-1 flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({product.reviews || 0})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
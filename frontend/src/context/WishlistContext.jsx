// Wishlist Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Load wishlist from Firestore when user is authenticated
  useEffect(() => {
    const loadWishlist = async () => {
      if (auth.currentUser) {
        try {
          const wishlistRef = doc(db, 'wishlists', auth.currentUser.uid);
          const wishlistDoc = await getDoc(wishlistRef);
          
          if (wishlistDoc.exists()) {
            const wishlistData = wishlistDoc.data();
            const productIds = wishlistData.productIds || [];

            // Concurrently load product details to avoid slow sequential fetches
            const productDocs = await Promise.all(
              productIds.map((pid) => getDoc(doc(db, 'products', pid)))
            )

            const products = productDocs
              .filter((pdoc) => pdoc.exists())
              .map((pdoc) => ({
                id: pdoc.id,
                ...pdoc.data(),
                addedToWishlist: wishlistData.addedAt?.[pdoc.id] || new Date().toISOString(),
              }))

            setWishlist(products)
            setWishlistCount(products.length)
          } else {
            setWishlist([]);
            setWishlistCount(0);
          }
        } catch (error) {
          console.error('Error loading wishlist:', error);
        }
      }
      setLoading(false);
    };

    loadWishlist();
  }, [auth.currentUser]);

  // Add product to wishlist
  const addToWishlist = async (product) => {
    if (!auth.currentUser) {
      throw new Error('User must be logged in to add to wishlist');
    }

    try {
      const userId = auth.currentUser.uid;
      const wishlistRef = doc(db, 'wishlists', userId);
      const wishlistDoc = await getDoc(wishlistRef);
      
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
      };

      if (wishlistDoc.exists()) {
        const wishlistData = wishlistDoc.data();
        const productIds = wishlistData.productIds || [];
        
        if (!productIds.includes(product.id)) {
          await updateDoc(wishlistRef, {
            productIds: arrayUnion(product.id),
            [`addedAt.${product.id}`]: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setWishlist(prev => [...prev, { ...productData, addedToWishlist: new Date().toISOString() }]);
          setWishlistCount(prev => prev + 1);
        }
      } else {
        await setDoc(wishlistRef, {
          userId,
          productIds: [product.id],
          addedAt: {
            [product.id]: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setWishlist([{ ...productData, addedToWishlist: new Date().toISOString() }]);
        setWishlistCount(1);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId) => {
    if (!auth.currentUser) {
      throw new Error('User must be logged in to remove from wishlist');
    }

    try {
      const userId = auth.currentUser.uid;
      const wishlistRef = doc(db, 'wishlists', userId);
      
      await updateDoc(wishlistRef, {
        productIds: arrayRemove(productId),
        updatedAt: new Date().toISOString()
      });
      
      // Remove the product from the wishlist state
      setWishlist(prev => prev.filter(item => item.id !== productId));
      setWishlistCount(prev => prev - 1);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Toggle product in wishlist
  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!auth.currentUser) {
      throw new Error('User must be logged in to clear wishlist');
    }

    try {
      const userId = auth.currentUser.uid;
      const wishlistRef = doc(db, 'wishlists', userId);
      
      await updateDoc(wishlistRef, {
        productIds: [],
        updatedAt: new Date().toISOString()
      });
      
      setWishlist([]);
      setWishlistCount(0);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  };

  const value = {
    wishlist,
    wishlistCount,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
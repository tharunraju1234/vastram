import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const WishlistProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      fetchWishlist();
    } else {
      // Load from localStorage for guests
      const savedWishlist = localStorage.getItem('vastram_wishlist');
      if (savedWishlist) {
        setWishlistIds(JSON.parse(savedWishlist));
      }
    }
  }, [token, user]);

  const fetchWishlist = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data);
      setWishlistIds(response.data.map(p => p.id));
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!token) {
      // Guest wishlist
      const updated = [...wishlistIds, productId];
      localStorage.setItem('vastram_wishlist', JSON.stringify(updated));
      setWishlistIds(updated);
      return;
    }

    try {
      await axios.post(
        `${API}/wishlist/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlistIds(prev => [...prev, productId]);
      await fetchWishlist();
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!token) {
      // Guest wishlist
      const updated = wishlistIds.filter(id => id !== productId);
      localStorage.setItem('vastram_wishlist', JSON.stringify(updated));
      setWishlistIds(updated);
      return;
    }

    try {
      await axios.delete(`${API}/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistIds(prev => prev.filter(id => id !== productId));
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  };

  const isInWishlist = (productId) => wishlistIds.includes(productId);

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistIds, loading, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

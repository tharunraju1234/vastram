import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      fetchCart();
    } else {
      // Load from localStorage for guests
      const savedCart = localStorage.getItem('vastram_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [token, user]);

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, size, color) => {
    if (!token) {
      // Guest cart - store in localStorage
      const savedCart = JSON.parse(localStorage.getItem('vastram_cart') || '{"items":[],"total":0}');
      const existingIdx = savedCart.items.findIndex(
        item => item.product_id === productId && item.size === size && item.color === color
      );
      if (existingIdx >= 0) {
        savedCart.items[existingIdx].quantity += quantity;
      } else {
        savedCart.items.push({ product_id: productId, quantity, size, color });
      }
      localStorage.setItem('vastram_cart', JSON.stringify(savedCart));
      setCart(savedCart);
      return savedCart;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/cart`,
        { product_id: productId, quantity, size, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity, size, color) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.put(
        `${API}/cart`,
        { product_id: productId, quantity, size, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId, size, color) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.delete(
        `${API}/cart/${productId}?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!token) {
      localStorage.removeItem('vastram_cart');
      setCart({ items: [], total: 0 });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.delete(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

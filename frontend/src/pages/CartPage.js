import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

export const CartPage = () => {
  const { cart, loading, updateCartItem, removeFromCart, fetchCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      fetchCart();
    }
  }, [token, user]);

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(item.product_id, newQuantity, item.size, item.color);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeFromCart(item.product_id, item.size, item.color);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (!token) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.discount_price || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (!token) {
    return (
      <div className="container-custom py-16 text-center" data-testid="cart-login-prompt">
        <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-neutral-300" />
        <h1 className="text-2xl font-serif mb-4">Your Cart</h1>
        <p className="text-neutral-500 mb-8">Please login to view your cart</p>
        <Link to="/login" className="btn-primary inline-block">
          Login to Continue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-custom py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border">
                <Skeleton className="w-24 h-32" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-custom py-16 text-center" data-testid="empty-cart">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-neutral-300" />
          <h1 className="text-2xl font-serif mb-4">Your Cart is Empty</h1>
          <p className="text-neutral-500 mb-8">Looks like you haven't added anything to your cart yet</p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950" data-testid="cart-page">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span>Cart</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-serif mb-8"
        >
          Shopping Cart ({cart.items.length})
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <motion.div
                key={`${item.product_id}-${item.size}-${item.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 border border-neutral-200 dark:border-neutral-800"
                data-testid={`cart-item-${item.product_id}`}
              >
                {/* Image */}
                <Link to={`/product/${item.product_id}`} className="w-24 md:w-32 flex-shrink-0">
                  <img
                    src={item.image || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link 
                        to={`/product/${item.product_id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-neutral-500 mt-1">
                        Size: {item.size} | Color: {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item)}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                      data-testid={`remove-item-${item.product_id}`}
                      aria-label="Remove item"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        data-testid={`decrease-${item.product_id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        data-testid={`increase-${item.product_id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{((item.discount_price || item.price) * item.quantity).toLocaleString()}
                      </p>
                      {item.discount_price && (
                        <p className="text-sm text-neutral-400 line-through">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-50 dark:bg-neutral-900 p-6 sticky top-32"
            >
              <h2 className="text-xl font-serif mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-sm text-neutral-500">
                    Add ₹{(999 - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
                <div className="border-t pt-4 flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/shop"
                className="block text-center mt-4 text-sm text-neutral-500 hover:text-black dark:hover:text-white"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

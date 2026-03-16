import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast.success('Order ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-8" />
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950" data-testid="order-success-page">
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-serif mb-4">Thank You for Your Order!</h1>
          <p className="text-neutral-500 mb-8">
            Your order has been placed successfully. We'll send you an email confirmation shortly.
          </p>

          {/* Order ID */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-neutral-500">Order ID:</span>
            <span className="font-mono font-medium">{orderId.slice(0, 8)}...</span>
            <button
              onClick={copyOrderId}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              data-testid="copy-order-id"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-50 dark:bg-neutral-900 p-6 md:p-8 text-left mb-8"
            >
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {order.shipping_address.name}<br />
                    {order.shipping_address.street}<br />
                    {order.shipping_address.city}, {order.shipping_address.state}<br />
                    {order.shipping_address.pincode}<br />
                    Phone: {order.shipping_address.phone}
                  </p>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Subtotal</span>
                      <span>₹{order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipping</span>
                      <span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Order Items ({order.items.length})</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <img
                        src={item.image || 'https://via.placeholder.com/80'}
                        alt={item.name}
                        className="w-16 h-20 object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-neutral-500">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Status */}
              <div className="border-t pt-6 mt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-neutral-500">Payment Method:</span>
                  <p className="font-medium capitalize">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : 
                     order.payment_method === 'card' ? 'Credit/Debit Card' : 'UPI'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Order Status:</span>
                  <p className="font-medium capitalize text-yellow-600">{order.status}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/account/orders" className="btn-primary flex items-center justify-center gap-2">
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/shop" className="btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

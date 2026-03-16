import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, Wallet, Banknote, Check, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CheckoutPage = () => {
  const { cart, fetchCart, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [token, cart, navigate]);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    const required = ['name', 'email', 'phone', 'street', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!formData[field]) {
        toast.error(`Please enter your ${field}`);
        return false;
      }
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      setCouponLoading(true);
      const response = await axios.post(
        `${API}/coupons/validate`,
        { code: couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppliedCoupon(response.data);
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const orderData = {
        items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        shipping_address: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          is_default: false
        },
        payment_method: paymentMethod
      };

      const response = await axios.post(
        `${API}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Order placed successfully!');
      navigate(`/order-success/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.discount_price || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const shipping = subtotal >= 999 ? 0 : 99;
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }
  
  const total = subtotal + shipping - discount;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950" data-testid="checkout-page">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500 flex items-center gap-2">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/cart" className="hover:text-black dark:hover:text-white">Cart</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-serif mb-8"
        >
          Checkout
        </motion.h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className={cn(
            "flex items-center gap-2",
            step >= 1 ? "text-black dark:text-white" : "text-neutral-400"
          )}>
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm",
              step >= 1 ? "bg-black text-white dark:bg-white dark:text-black" : "border"
            )}>
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
            </span>
            <span className="hidden sm:inline">Shipping</span>
          </div>
          <div className="flex-1 h-px bg-neutral-300" />
          <div className={cn(
            "flex items-center gap-2",
            step >= 2 ? "text-black dark:text-white" : "text-neutral-400"
          )}>
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm",
              step >= 2 ? "bg-black text-white dark:bg-white dark:text-black" : "border"
            )}>
              {step > 2 ? <Check className="w-4 h-4" /> : "2"}
            </span>
            <span className="hidden sm:inline">Payment</span>
          </div>
          <div className="flex-1 h-px bg-neutral-300" />
          <div className={cn(
            "flex items-center gap-2",
            step >= 3 ? "text-black dark:text-white" : "text-neutral-400"
          )}>
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm",
              step >= 3 ? "bg-black text-white dark:bg-white dark:text-black" : "border"
            )}>
              3
            </span>
            <span className="hidden sm:inline">Review</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-medium mb-6">Shipping Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    maxLength={10}
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Apartment 4B"
                    data-testid="input-street"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Maharashtra"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="400001"
                      maxLength={6}
                      data-testid="input-pincode"
                    />
                  </div>
                </div>

                <button
                  onClick={() => validateForm() && setStep(2)}
                  className="btn-primary"
                  data-testid="continue-to-payment"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-medium mb-6">Payment Method</h2>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={cn(
                    "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                    paymentMethod === 'cod' ? "border-black dark:border-white" : "border-neutral-200"
                  )} onClick={() => setPaymentMethod('cod')}>
                    <RadioGroupItem value="cod" id="cod" data-testid="payment-cod" />
                    <Banknote className="w-6 h-6" />
                    <div>
                      <Label htmlFor="cod" className="cursor-pointer font-medium">Cash on Delivery</Label>
                      <p className="text-sm text-neutral-500">Pay when your order arrives</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                    paymentMethod === 'card' ? "border-black dark:border-white" : "border-neutral-200"
                  )} onClick={() => setPaymentMethod('card')}>
                    <RadioGroupItem value="card" id="card" data-testid="payment-card" />
                    <CreditCard className="w-6 h-6" />
                    <div>
                      <Label htmlFor="card" className="cursor-pointer font-medium">Credit/Debit Card</Label>
                      <p className="text-sm text-neutral-500">Pay securely with your card (Demo)</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                    paymentMethod === 'upi' ? "border-black dark:border-white" : "border-neutral-200"
                  )} onClick={() => setPaymentMethod('upi')}>
                    <RadioGroupItem value="upi" id="upi" data-testid="payment-upi" />
                    <Wallet className="w-6 h-6" />
                    <div>
                      <Label htmlFor="upi" className="cursor-pointer font-medium">UPI</Label>
                      <p className="text-sm text-neutral-500">Pay using any UPI app (Demo)</p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary"
                    data-testid="continue-to-review"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-medium mb-6">Review Your Order</h2>

                {/* Shipping Address */}
                <div className="border p-4">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {formData.name}<br />
                    {formData.street}<br />
                    {formData.city}, {formData.state} - {formData.pincode}<br />
                    Phone: {formData.phone}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="border p-4">
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 capitalize">
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                     paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI'}
                  </p>
                </div>

                {/* Order Items */}
                <div className="border p-4">
                  <h3 className="font-medium mb-4">Order Items ({cart.items.length})</h3>
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                        <img
                          src={item.image || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          className="w-16 h-20 object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-neutral-500">
                            Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ₹{((item.discount_price || item.price) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                    data-testid="place-order-btn"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Place Order
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 dark:bg-neutral-900 p-6 sticky top-32">
              <h2 className="text-xl font-serif mb-6">Order Summary</h2>

              {/* Cart Items Preview */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                    <img
                      src={item.image || 'https://via.placeholder.com/60'}
                      alt={item.name}
                      className="w-12 h-16 object-cover"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    data-testid="coupon-input"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="btn-secondary px-4 text-sm"
                    data-testid="apply-coupon-btn"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-green-600 text-sm mt-2">
                    Coupon "{appliedCoupon.code}" applied! You save ₹{discount.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, LogOut, ChevronRight, Edit2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sidebarItems = [
  { icon: User, label: 'Profile', path: '/account' },
  { icon: Package, label: 'Orders', path: '/account/orders' },
  { icon: Heart, label: 'Wishlist', path: '/account/wishlist' },
  { icon: MapPin, label: 'Addresses', path: '/account/addresses' },
];

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              location.pathname === item.path
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-red-500"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          Logout
        </button>
      </nav>
    </aside>
  );
};

const ProfileSection = () => {
  const { user, updateProfile, fetchUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif">My Profile</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm hover:underline"
            data-testid="edit-profile-btn"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 max-w-md">
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              data-testid="profile-name-input"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email} disabled className="bg-neutral-100" />
            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="9876543210"
              data-testid="profile-phone-input"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
              data-testid="save-profile-btn"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-neutral-500">Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Phone</p>
            <p className="font-medium">{user?.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Member Since</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersSection = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif mb-6">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">No orders yet</p>
          <Link to="/shop" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 md:p-6" data-testid={`order-${order.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-neutral-500">Order ID</p>
                  <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Date</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total</p>
                  <p className="font-medium">₹{order.total.toLocaleString()}</p>
                </div>
                <span className={cn("px-3 py-1 text-xs uppercase tracking-wider rounded-full", getStatusColor(order.status))}>
                  {order.status}
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {order.items.slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image || 'https://via.placeholder.com/80'}
                    alt={item.name}
                    className="w-16 h-20 object-cover flex-shrink-0"
                  />
                ))}
                {order.items.length > 4 && (
                  <div className="w-16 h-20 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-neutral-500">+{order.items.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WishlistSection = () => {
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] mb-2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif mb-6">My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">Your wishlist is empty</p>
          <Link to="/shop" className="btn-primary inline-block">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishlist.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

const AddressesSection = () => {
  const { user, fetchUser, token } = useAuth();
  const addresses = user?.addresses || [];

  return (
    <div>
      <h2 className="text-2xl font-serif mb-6">Saved Addresses</h2>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">No saved addresses</p>
          <p className="text-sm text-neutral-400">Addresses will be saved during checkout</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="border p-4">
              {address.is_default && (
                <span className="text-xs bg-black text-white px-2 py-1 mb-2 inline-block">DEFAULT</span>
              )}
              <p className="font-medium">{address.name}</p>
              <p className="text-sm text-neutral-500 mt-1">
                {address.street}<br />
                {address.city}, {address.state} - {address.pincode}<br />
                Phone: {address.phone}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const UserDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" data-testid="user-dashboard">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500 flex items-center gap-2">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span>My Account</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {/* Mobile nav */}
        <div className="lg:hidden mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 whitespace-nowrap text-sm border transition-colors",
                  location.pathname === item.path
                    ? "bg-black text-white border-black dark:bg-white dark:text-black"
                    : "border-neutral-300 hover:border-black"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 whitespace-nowrap text-sm border border-red-300 text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-12">
          <Sidebar onLogout={handleLogout} />

          <main className="flex-1 min-w-0">
            <Routes>
              <Route index element={<ProfileSection />} />
              <Route path="orders" element={<OrdersSection />} />
              <Route path="wishlist" element={<WishlistSection />} />
              <Route path="addresses" element={<AddressesSection />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

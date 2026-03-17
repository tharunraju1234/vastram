import { useState, useEffect } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Tag, BarChart3, Settings,
  LogOut, Plus, Edit, Trash2, Eye, Search, ChevronDown, Loader2, X,
  TrendingUp, DollarSign, ShoppingBag, UserCheck
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API = process.env.REACT_APP_API_URL;

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
];

// Admin Sidebar Component
const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-neutral-900 text-white min-h-screen fixed left-0 top-0 hidden lg:block">
      <div className="p-6 border-b border-neutral-800">
        <Link to="/admin" className="text-2xl font-serif">VASTRAM</Link>
        <p className="text-xs text-neutral-400 mt-1">Admin Panel</p>
      </div>

      <nav className="p-4 space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded transition-colors",
              location.pathname === item.path
                ? "bg-white text-black"
                : "hover:bg-neutral-800"
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
        <Link to="/" className="flex items-center gap-3 px-4 py-2 text-neutral-400 hover:text-white transition-colors">
          <Eye className="w-5 h-5" />
          View Store
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

// Dashboard Overview
const DashboardOverview = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats?.total_revenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Customers', value: stats?.total_customers || 0, icon: UserCheck, color: 'bg-purple-100 text-purple-600' },
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl font-serif mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-neutral-800 p-6 border"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200">
          <p className="text-yellow-600 text-sm">Pending Orders</p>
          <p className="text-2xl font-semibold">{stats?.order_stats?.pending || 0}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">Shipped Orders</p>
          <p className="text-2xl font-semibold">{stats?.order_stats?.shipped || 0}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 border border-green-200">
          <p className="text-green-600 text-sm">Delivered Orders</p>
          <p className="text-2xl font-semibold">{stats?.order_stats?.delivered || 0}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-neutral-800 border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-medium">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-neutral-500 hover:text-black">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Order ID</th>
                <th className="text-left p-4 text-sm font-medium">Customer</th>
                <th className="text-left p-4 text-sm font-medium">Total</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_orders?.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="p-4">{order.shipping_address?.name}</td>
                  <td className="p-4">₹{order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full capitalize",
                      order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-neutral-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Products Management
const ProductsManagement = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category: 'men',
    subcategory: '',
    sizes: [],
    colors: [],
    images: [''],
    stock: 100,
    featured: false,
    is_new: false,
    is_bestseller: false,
    fabric: '',
    care_instructions: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = searchQuery ? `?search=${searchQuery}` : '';
      const response = await axios.get(`${API}/products${params}`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = (product = null) => {
    if (product) {
      setEditProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        discount_price: product.discount_price?.toString() || '',
        category: product.category,
        subcategory: product.subcategory,
        sizes: product.sizes || [],
        colors: product.colors || [],
        images: product.images?.length ? product.images : [''],
        stock: product.stock,
        featured: product.featured,
        is_new: product.is_new,
        is_bestseller: product.is_bestseller,
        fabric: product.fabric || '',
        care_instructions: product.care_instructions || ''
      });
    } else {
      setEditProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        discount_price: '',
        category: 'men',
        subcategory: '',
        sizes: [],
        colors: [],
        images: [''],
        stock: 100,
        featured: false,
        is_new: false,
        is_bestseller: false,
        fabric: '',
        care_instructions: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        images: formData.images.filter(img => img.trim())
      };

      if (editProduct) {
        await axios.put(`${API}/products/${editProduct.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif">Products</h1>
        <button onClick={() => handleAddEdit()} className="btn-primary flex items-center gap-2" data-testid="add-product-btn">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="product-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Product</th>
                <th className="text-left p-4 text-sm font-medium">Category</th>
                <th className="text-left p-4 text-sm font-medium">Price</th>
                <th className="text-left p-4 text-sm font-medium">Stock</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t" data-testid={`product-row-${product.id}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={product.name}
                        className="w-12 h-16 object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{product.category} / {product.subcategory}</td>
                  <td className="p-4">
                    {product.discount_price ? (
                      <div>
                        <span className="font-medium">₹{product.discount_price.toLocaleString()}</span>
                        <span className="text-sm text-neutral-400 line-through ml-2">₹{product.price.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="font-medium">₹{product.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded",
                      product.stock > 10 ? 'bg-green-100 text-green-600' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddEdit(product)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                        data-testid={`edit-${product.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-100 text-red-500 rounded"
                        data-testid={`delete-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  data-testid="product-name-input"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div>
                <Label>Discount Price (Optional)</Label>
                <Input
                  type="number"
                  value={formData.discount_price}
                  onChange={(e) => setFormData(p => ({ ...p, discount_price: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input
                  value={formData.subcategory}
                  onChange={(e) => setFormData(p => ({ ...p, subcategory: e.target.value }))}
                  placeholder="e.g., shirts, dresses"
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(p => ({ ...p, stock: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.images[0]}
                  onChange={(e) => setFormData(p => ({ ...p, images: [e.target.value] }))}
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <Label>Sizes (comma separated)</Label>
                <Input
                  value={formData.sizes.join(', ')}
                  onChange={(e) => setFormData(p => ({ ...p, sizes: e.target.value.split(',').map(s => s.trim()) }))}
                  placeholder="S, M, L, XL"
                />
              </div>
              <div className="col-span-2">
                <Label>Colors (comma separated)</Label>
                <Input
                  value={formData.colors.join(', ')}
                  onChange={(e) => setFormData(p => ({ ...p, colors: e.target.value.split(',').map(c => c.trim()) }))}
                  placeholder="White, Black, Blue"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2" data-testid="save-product-btn">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Orders Management
const OrdersManagement = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div data-testid="admin-orders">
      <h1 className="text-2xl font-serif mb-6">Orders</h1>

      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-4 py-2 text-sm capitalize border transition-colors",
              statusFilter === status ? "bg-black text-white border-black" : "hover:border-black"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-neutral-800 border p-4" data-testid={`order-${order.id}`}>
              <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
                <div>
                  <p className="font-mono text-sm text-neutral-500">#{order.id.slice(0, 8)}</p>
                  <p className="font-medium">{order.shipping_address?.name}</p>
                  <p className="text-sm text-neutral-500">{order.shipping_address?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.total.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <img key={idx} src={item.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-12 object-cover" />
                  ))}
                  {order.items.length > 3 && (
                    <span className="w-10 h-12 bg-neutral-100 flex items-center justify-center text-xs">+{order.items.length - 3}</span>
                  )}
                </div>
                <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                  <SelectTrigger className="w-36" data-testid={`status-select-${order.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Customers Management
const CustomersManagement = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-customers">
      <h1 className="text-2xl font-serif mb-6">Customers</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Customer</th>
                <th className="text-left p-4 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-sm font-medium">Phone</th>
                <th className="text-left p-4 text-sm font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="p-4 font-medium">{customer.name}</td>
                  <td className="p-4">{customer.email}</td>
                  <td className="p-4">{customer.phone || '-'}</td>
                  <td className="p-4 text-sm text-neutral-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Coupons Management
const CouponsManagement = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order: '0'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/admin/coupons`, {
        ...formData,
        value: parseFloat(formData.value),
        min_order: parseFloat(formData.min_order)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon created');
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to create coupon');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API}/admin/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div data-testid="admin-coupons">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif">Coupons</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Code</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Value</th>
                <th className="text-left p-4 text-sm font-medium">Min Order</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t">
                  <td className="p-4 font-mono font-medium">{coupon.code}</td>
                  <td className="p-4 capitalize">{coupon.type}</td>
                  <td className="p-4">{coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}</td>
                  <td className="p-4">₹{coupon.min_order}</td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Coupon Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))}
                placeholder={formData.type === 'percentage' ? '10' : '200'}
              />
            </div>
            <div>
              <Label>Minimum Order Amount</Label>
              <Input
                type="number"
                value={formData.min_order}
                onChange={(e) => setFormData(p => ({ ...p, min_order: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Create</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main Admin Dashboard Component
export const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/login');
    }
  }, [token, user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AdminSidebar onLogout={handleLogout} />

      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-neutral-900 border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-serif">VASTRAM Admin</h1>
        <button onClick={handleLogout} className="text-red-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden overflow-x-auto border-b bg-white dark:bg-neutral-900">
        <div className="flex p-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 whitespace-nowrap text-sm",
                location.pathname === item.path ? "bg-black text-white" : ""
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="lg:ml-64 p-4 lg:p-8">
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
          <Route path="coupons" element={<CouponsManagement />} />
        </Routes>
      </main>
    </div>
  );
};

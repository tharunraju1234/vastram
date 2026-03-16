import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Heart, User, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Input } from '../ui/input';

const categories = [
  { name: 'Men', slug: 'men', subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Ethnic Wear'] },
  { name: 'Women', slug: 'women', subcategories: ['Dresses', 'Tops', 'Sarees', 'Jeans', 'Jackets'] },
  { name: 'Kids', slug: 'kids', subcategories: ['Boys Wear', 'Girls Wear', 'Winter Wear'] },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistIds } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveCategory(null);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-sm' : 'bg-white dark:bg-neutral-900'
        }`}
      >
        {/* Top bar */}
        <div className="bg-black dark:bg-white text-white dark:text-black text-xs py-2 text-center tracking-widest">
          FREE SHIPPING ON ORDERS ABOVE ₹999
        </div>

        {/* Main navbar */}
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2"
              data-testid="mobile-menu-btn"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0" data-testid="logo-link">
              <h1 className="text-2xl md:text-3xl font-serif tracking-wider">VASTRAM</h1>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="relative group"
                  onMouseEnter={() => setActiveCategory(category.slug)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="flex items-center gap-1 text-sm uppercase tracking-wider font-medium py-2 hover:text-neutral-500 transition-colors"
                    data-testid={`nav-${category.slug}`}
                  >
                    {category.name}
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                  </Link>
                  
                  <AnimatePresence>
                    {activeCategory === category.slug && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-48 bg-white dark:bg-neutral-900 shadow-lg border border-neutral-100 dark:border-neutral-800 py-3"
                      >
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub}
                            to={`/shop?category=${category.slug}&subcategory=${sub.toLowerCase().replace(' ', '-')}`}
                            className="block px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            data-testid={`nav-${category.slug}-${sub.toLowerCase().replace(' ', '-')}`}
                          >
                            {sub}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <Link
                to="/shop"
                className="text-sm uppercase tracking-wider font-medium py-2 hover:text-neutral-500 transition-colors"
                data-testid="nav-shop-all"
              >
                Shop All
              </Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2"
                data-testid="search-btn"
                aria-label="Search"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hidden md:block"
                data-testid="theme-toggle-btn"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" strokeWidth={1.5} />
                ) : (
                  <Sun className="w-5 h-5" strokeWidth={1.5} />
                )}
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="p-2 relative" data-testid="wishlist-link" aria-label="Wishlist">
                <Heart className="w-5 h-5" strokeWidth={1.5} />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black dark:bg-white text-white dark:text-black text-xs rounded-full flex items-center justify-center">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* User */}
              {user ? (
                <Link 
                  to={user.role === 'admin' ? '/admin' : '/account'} 
                  className="p-2" 
                  data-testid="account-link"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </Link>
              ) : (
                <Link to="/login" className="p-2" data-testid="login-link" aria-label="Login">
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="p-2 relative" data-testid="cart-link" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black dark:bg-white text-white dark:text-black text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
            >
              <form onSubmit={handleSearch} className="container-custom py-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 border-b border-neutral-300 rounded-none focus:border-black dark:focus:border-white px-0"
                    data-testid="search-input"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" data-testid="search-submit-btn">
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-2"
                    data-testid="search-close-btn"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-serif">VASTRAM</h2>
            </div>
            
            <div className="flex-1 overflow-auto py-4">
              {categories.map((category) => (
                <div key={category.slug} className="border-b border-neutral-100 dark:border-neutral-800">
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="block px-6 py-4 text-lg font-medium"
                    data-testid={`mobile-nav-${category.slug}`}
                  >
                    {category.name}
                  </Link>
                  <div className="px-6 pb-4 space-y-2">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/shop?category=${category.slug}&subcategory=${sub.toLowerCase().replace(' ', '-')}`}
                        className="block text-sm text-neutral-500 hover:text-black dark:hover:text-white py-1"
                        data-testid={`mobile-nav-${category.slug}-${sub.toLowerCase().replace(' ', '-')}`}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <Link
                to="/shop"
                className="block px-6 py-4 text-lg font-medium"
                data-testid="mobile-nav-shop-all"
              >
                Shop All
              </Link>
            </div>

            <div className="p-6 border-t space-y-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full text-left"
                data-testid="mobile-theme-toggle"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" strokeWidth={1.5} />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" strokeWidth={1.5} />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
              
              {user ? (
                <div className="space-y-2">
                  <Link to="/account" className="block text-sm" data-testid="mobile-account-link">
                    My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-neutral-500"
                    data-testid="mobile-logout-btn"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-primary block text-center" data-testid="mobile-login-link">
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer for fixed navbar */}
      <div className="h-[88px] md:h-[112px]" />
    </>
  );
};

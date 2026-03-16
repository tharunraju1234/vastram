import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Grid3X3, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Skeleton } from '../components/ui/skeleton';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { name: 'Men', slug: 'men', subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Ethnic Wear'] },
  { name: 'Women', slug: 'women', subcategories: ['Dresses', 'Tops', 'Sarees', 'Jeans', 'Jackets'] },
  { name: 'Kids', slug: 'kids', subcategories: ['Boys Wear', 'Girls Wear', 'Winter Wear'] },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];
const colors = ['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Grey', 'Navy', 'Beige'];

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  
  // Filters state
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  // Get params from URL
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const featured = searchParams.get('featured');
  const isNew = searchParams.get('is_new');
  const isBestseller = searchParams.get('is_bestseller');

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory.replace('-', ' '));
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      if (page) params.set('page', page.toString());
      if (priceRange[0] > 0) params.set('min_price', priceRange[0].toString());
      if (priceRange[1] < 10000) params.set('max_price', priceRange[1].toString());
      if (selectedSizes.length) params.set('sizes', selectedSizes.join(','));
      if (selectedColors.length) params.set('colors', selectedColors.join(','));
      if (featured === 'true') params.set('featured', 'true');
      if (isNew === 'true') params.set('is_new', 'true');
      if (isBestseller === 'true') params.set('is_bestseller', 'true');
      params.set('limit', '12');

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data.products || []);
      setTotalProducts(response.data.total || 0);
      setTotalPages(response.data.pages || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat, subcat = '') => {
    const newParams = new URLSearchParams();
    if (cat) newParams.set('category', cat);
    if (subcat) newParams.set('subcategory', subcat.toLowerCase().replace(' ', '-'));
    if (search) newParams.set('search', search);
    newParams.set('sort', sort);
    newParams.set('page', '1');
    setSearchParams(newParams);
    setFiltersOpen(false);
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    setSearchParams(newParams);
    fetchProducts();
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    setSearchParams(newParams);
  };

  const hasActiveFilters = category || subcategory || selectedSizes.length || selectedColors.length || priceRange[0] > 0 || priceRange[1] < 10000;

  const getPageTitle = () => {
    if (search) return `Search: "${search}"`;
    if (featured === 'true') return 'Featured Collection';
    if (isNew === 'true') return 'New Arrivals';
    if (isBestseller === 'true') return 'Best Sellers';
    if (subcategory) return subcategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (category) return category.charAt(0).toUpperCase() + category.slice(1);
    return 'All Products';
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-medium mb-4 uppercase text-sm tracking-wider">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={cn(
              "block w-full text-left py-1 text-sm transition-colors",
              !category ? "font-medium" : "text-neutral-500 hover:text-black dark:hover:text-white"
            )}
            data-testid="filter-all"
          >
            All Products
          </button>
          {categories.map((cat) => (
            <div key={cat.slug}>
              <button
                onClick={() => handleCategoryChange(cat.slug)}
                className={cn(
                  "block w-full text-left py-1 text-sm transition-colors",
                  category === cat.slug && !subcategory ? "font-medium" : "text-neutral-500 hover:text-black dark:hover:text-white"
                )}
                data-testid={`filter-${cat.slug}`}
              >
                {cat.name}
              </button>
              {category === cat.slug && (
                <div className="ml-4 mt-2 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleCategoryChange(cat.slug, sub)}
                      className={cn(
                        "block w-full text-left py-1 text-sm transition-colors",
                        subcategory === sub.toLowerCase().replace(' ', '-') 
                          ? "font-medium" 
                          : "text-neutral-400 hover:text-black dark:hover:text-white"
                      )}
                      data-testid={`filter-${cat.slug}-${sub.toLowerCase().replace(' ', '-')}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-4 uppercase text-sm tracking-wider">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            step={100}
            className="mb-4"
            data-testid="price-slider"
          />
          <div className="flex justify-between text-sm text-neutral-500">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-medium mb-4 uppercase text-sm tracking-wider">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeToggle(size)}
              className={cn(
                "px-3 py-1.5 text-sm border transition-colors",
                selectedSizes.includes(size)
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-neutral-300 hover:border-black dark:hover:border-white"
              )}
              data-testid={`size-filter-${size}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="font-medium mb-4 uppercase text-sm tracking-wider">Color</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorToggle(color)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                selectedColors.includes(color)
                  ? "border-black dark:border-white scale-110 ring-2 ring-offset-2 ring-black dark:ring-white"
                  : "border-neutral-200 hover:scale-105"
              )}
              style={{ backgroundColor: color.toLowerCase() }}
              title={color}
              data-testid={`color-filter-${color.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      {/* Apply/Clear Buttons */}
      <div className="space-y-2 pt-4 border-t">
        <button onClick={applyFilters} className="btn-primary w-full" data-testid="apply-filters-btn">
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-secondary w-full" data-testid="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" data-testid="shop-page">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span>Shop</span>
            {category && (
              <>
                <span className="mx-2">/</span>
                <Link 
                  to={`/shop?category=${category}`}
                  className="hover:text-black dark:hover:text-white capitalize"
                >
                  {category}
                </Link>
              </>
            )}
            {subcategory && (
              <>
                <span className="mx-2">/</span>
                <span className="capitalize">{subcategory.replace('-', ' ')}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <div className="container-custom py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="heading-lg text-center"
        >
          {getPageTitle()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-500 text-center mt-2"
        >
          {totalProducts} product{totalProducts !== 1 ? 's' : ''}
        </motion.p>
      </div>

      <div className="container-custom pb-16">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          {/* Mobile filter button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden flex items-center gap-2 text-sm" data-testid="mobile-filter-btn">
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <h2 className="text-lg font-medium mb-6">Filters</h2>
              <FilterSidebar />
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <div className="flex items-center gap-4 ml-auto">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>

            {/* Grid toggle */}
            <div className="hidden md:flex items-center gap-1 border rounded-sm">
              <button
                onClick={() => setGridCols(3)}
                className={cn(
                  "p-2 transition-colors",
                  gridCols === 3 ? "bg-neutral-100 dark:bg-neutral-800" : ""
                )}
                data-testid="grid-3-btn"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={cn(
                  "p-2 transition-colors",
                  gridCols === 4 ? "bg-neutral-100 dark:bg-neutral-800" : ""
                )}
                data-testid="grid-4-btn"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={cn(
                "grid gap-4 md:gap-6",
                gridCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              )}>
                {[...Array(12)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] mb-4" />
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-neutral-500 mb-4">No products found</p>
                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={cn(
                  "grid gap-4 md:gap-6",
                  gridCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                )}>
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('page', (i + 1).toString());
                          setSearchParams(newParams);
                        }}
                        className={cn(
                          "w-10 h-10 text-sm transition-colors",
                          page === i + 1
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "border border-neutral-300 hover:border-black dark:hover:border-white"
                        )}
                        data-testid={`page-btn-${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

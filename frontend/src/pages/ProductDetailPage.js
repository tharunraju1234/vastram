import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Heart, ShoppingBag, Star, ChevronRight, Truck, RotateCcw, Shield, Ruler } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { token } = useAuth();

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data.product);
      setReviews(response.data.reviews || []);
      setRelatedProducts(response.data.related || []);
      
      // Set default selections
      if (response.data.product?.sizes?.length) {
        setSelectedSize(response.data.product.sizes[0]);
      }
      if (response.data.product?.colors?.length) {
        setSelectedColor(response.data.product.colors[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    await handleAddToCart();
    navigate('/cart');
  };

  const handleWishlist = async () => {
    try {
      await toggleWishlist(product.id);
      toast.success(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error('Please login to add to wishlist');
    }
  };

  const handleImageZoom = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-20 h-20" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="min-h-screen" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500 flex items-center gap-2">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/shop" className="hover:text-black dark:hover:text-white">Shop</Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              to={`/shop?category=${product.category}`}
              className="hover:text-black dark:hover:text-white capitalize"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black dark:text-white truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-zoom-in"
              onMouseEnter={() => setImageZoom(true)}
              onMouseLeave={() => setImageZoom(false)}
              onMouseMove={handleImageZoom}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images?.[selectedImage] || 'https://via.placeholder.com/800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: imageZoom ? 'scale(1.5)' : 'scale(1)',
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="bg-black text-white text-xs px-3 py-1 tracking-wider">
                    -{Math.round((1 - product.discount_price / product.price) * 100)}%
                  </span>
                )}
                {product.is_new && (
                  <span className="bg-[#C4A484] text-white text-xs px-3 py-1 tracking-wider">
                    NEW
                  </span>
                )}
              </div>
            </motion.div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 border-2 transition-colors",
                      selectedImage === index ? "border-black dark:border-white" : "border-transparent"
                    )}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-neutral-500 uppercase tracking-wider mb-2">
                  {product.category} / {product.subcategory}
                </p>
                <h1 className="text-3xl md:text-4xl font-serif mb-4">{product.name}</h1>

                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-5 h-5",
                            star <= product.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-neutral-500">
                      {product.rating} ({product.reviews_count} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-medium">
                    ₹{(product.discount_price || product.price).toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-neutral-400 line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                      <span className="text-green-600 font-medium">
                        {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400">
                {product.description}
              </p>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Size</h4>
                    <button className="text-sm text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "px-5 py-2.5 text-sm border transition-colors",
                          selectedSize === size
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-neutral-300 hover:border-black dark:hover:border-white"
                        )}
                        data-testid={`size-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Color: <span className="font-normal">{selectedColor}</span></h4>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all",
                          selectedColor === color
                            ? "border-black dark:border-white scale-110 ring-2 ring-offset-2 ring-black dark:ring-white"
                            : "border-neutral-200 hover:scale-105"
                        )}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                        data-testid={`color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h4 className="font-medium mb-3">Quantity</h4>
                <div className="flex items-center border border-neutral-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    data-testid="decrease-qty"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-8 py-3 font-medium text-lg" data-testid="quantity">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    data-testid="increase-qty"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <p className={cn(
                "text-sm",
                product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-yellow-600" : "text-red-600"
              )}>
                {product.stock > 10 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlist}
                  className={cn(
                    "p-4 border transition-colors",
                    inWishlist
                      ? "bg-black text-white border-black dark:bg-white dark:text-black"
                      : "border-neutral-300 hover:border-black dark:hover:border-white"
                  )}
                  data-testid="wishlist-btn"
                >
                  <Heart className="w-5 h-5" fill={inWishlist ? "currentColor" : "none"} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="buy-now-btn"
              >
                Buy Now
              </button>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-neutral-500" />
                  <p className="text-xs text-neutral-500">Free Shipping</p>
                  <p className="text-xs">Above ₹999</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-neutral-500" />
                  <p className="text-xs text-neutral-500">Easy Returns</p>
                  <p className="text-xs">30 Days</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-neutral-500" />
                  <p className="text-xs text-neutral-500">Secure</p>
                  <p className="text-xs">Payment</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger 
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none px-6 py-3"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none px-6 py-3"
              >
                Details & Care
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none px-6 py-3"
              >
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="py-8">
              <div className="max-w-3xl">
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="details" className="py-8">
              <div className="max-w-3xl space-y-6">
                {product.fabric && (
                  <div>
                    <h4 className="font-medium mb-2">Fabric</h4>
                    <p className="text-neutral-600 dark:text-neutral-400">{product.fabric}</p>
                  </div>
                )}
                {product.care_instructions && (
                  <div>
                    <h4 className="font-medium mb-2">Care Instructions</h4>
                    <p className="text-neutral-600 dark:text-neutral-400">{product.care_instructions}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Shipping</h4>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Free shipping on orders above ₹999. Standard delivery within 5-7 business days.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-8">
              {reviews.length === 0 ? (
                <p className="text-neutral-500">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="space-y-6 max-w-3xl">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.user_name}</span>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400">{review.comment}</p>
                      <p className="text-sm text-neutral-400 mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-16 border-t">
            <h2 className="heading-md mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

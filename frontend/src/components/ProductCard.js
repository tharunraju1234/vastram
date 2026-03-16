import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const ProductCard = ({ product, onQuickView, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const inWishlist = isInWishlist(product.id);
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product.id);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error('Please login to add to wishlist');
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.error('Please login to add to cart');
      return;
    }
    try {
      await addToCart(
        product.id,
        1,
        product.sizes?.[0] || 'M',
        product.colors?.[0] || 'Black'
      );
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block" data-testid={`product-card-${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-4">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          
          {/* Product Image */}
          <motion.img
            src={product.images?.[0] || 'https://via.placeholder.com/400x533'}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Second image on hover */}
          {product.images?.[1] && (
            <motion.img
              src={product.images[1]}
              alt={`${product.name} alternate`}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-black text-white text-xs px-2 py-1 tracking-wider">
                -{discountPercent}%
              </span>
            )}
            {product.is_new && (
              <span className="bg-[#C4A484] text-white text-xs px-2 py-1 tracking-wider">
                NEW
              </span>
            )}
            {product.is_bestseller && (
              <span className="bg-white text-black text-xs px-2 py-1 tracking-wider border">
                BESTSELLER
              </span>
            )}
          </div>

          {/* Action buttons */}
          <motion.div
            className="absolute top-3 right-3 flex flex-col gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleWishlistClick}
              className={cn(
                "p-2 bg-white dark:bg-neutral-900 rounded-full shadow-md transition-colors",
                inWishlist && "bg-black text-white dark:bg-white dark:text-black"
              )}
              data-testid={`wishlist-btn-${product.id}`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className="w-4 h-4" fill={inWishlist ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleQuickView}
              className="p-2 bg-white dark:bg-neutral-900 rounded-full shadow-md hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              data-testid={`quickview-btn-${product.id}`}
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </motion.div>

          {/* Quick add button */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleQuickAdd}
              className="w-full bg-white dark:bg-neutral-900 text-black dark:text-white py-3 text-sm uppercase tracking-wider font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center gap-2"
              data-testid={`quick-add-btn-${product.id}`}
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
              Quick Add
            </button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            {product.category}
          </p>
          <h3 className="font-medium text-sm md:text-base line-clamp-1">{product.name}</h3>
          
          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-neutral-500">
                {product.rating} ({product.reviews_count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-medium">
              ₹{(product.discount_price || product.price).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-neutral-400 line-through text-sm">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Colors preview */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {product.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="w-3 h-3 rounded-full border border-neutral-300"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-neutral-500">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

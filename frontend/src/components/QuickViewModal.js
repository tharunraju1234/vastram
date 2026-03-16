import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Heart, ShoppingBag, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const QuickViewModal = ({ product, isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { token } = useAuth();

  if (!product) return null;

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!token) {
      toast.error('Please login to add to cart');
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
      onClose();
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    try {
      await toggleWishlist(product.id);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error('Please login to add to wishlist');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < (product.images?.length || 1) - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : (product.images?.length || 1) - 1
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden" data-testid="quick-view-modal">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="relative aspect-square md:aspect-auto bg-neutral-100 dark:bg-neutral-800">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={product.images?.[currentImageIndex] || 'https://via.placeholder.com/600'}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
            
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  data-testid="prev-image-btn"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  data-testid="next-image-btn"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image dots */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      idx === currentImageIndex ? "bg-black" : "bg-black/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              data-testid="close-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                {product.category} / {product.subcategory}
              </p>
              <h2 className="text-2xl font-serif mb-2">{product.name}</h2>
              
              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= product.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-500">
                    ({product.reviews_count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-medium">
                  ₹{(product.discount_price || product.price).toLocaleString()}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600">
                      {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 line-clamp-3">
                {product.description}
              </p>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Size</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "px-4 py-2 text-sm border transition-colors",
                          selectedSize === size
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-neutral-300 hover:border-black dark:hover:border-white"
                        )}
                        data-testid={`size-btn-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Color: {selectedColor}</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          selectedColor === color
                            ? "border-black dark:border-white scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                        data-testid={`color-btn-${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Quantity</h4>
                <div className="flex items-center border border-neutral-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    data-testid="decrease-qty-btn"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 font-medium" data-testid="quantity-display">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    data-testid="increase-qty-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="w-4 h-4" />
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
                data-testid="modal-wishlist-btn"
              >
                <Heart className="w-5 h-5" fill={inWishlist ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

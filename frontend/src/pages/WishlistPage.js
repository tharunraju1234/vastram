import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { motion } from 'framer-motion';

export const WishlistPage = () => {
  const { wishlist, loading } = useWishlist();
  const { token } = useAuth();

  if (!token) {
    return (
      <div className="container-custom py-16 text-center" data-testid="wishlist-login-prompt">
        <Heart className="w-16 h-16 mx-auto mb-6 text-neutral-300" />
        <h1 className="text-2xl font-serif mb-4">Your Wishlist</h1>
        <p className="text-neutral-500 mb-8">Please login to view your wishlist</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] mb-2" />
              <Skeleton className="h-4 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="wishlist-page">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-4">
        <div className="container-custom">
          <nav className="text-sm text-neutral-500">
            <Link to="/" className="hover:text-black dark:hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span>Wishlist</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-serif mb-8"
        >
          My Wishlist ({wishlist.length})
        </motion.h1>

        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 mx-auto mb-6 text-neutral-300" />
            <p className="text-xl text-neutral-500 mb-4">Your wishlist is empty</p>
            <p className="text-neutral-400 mb-8">Save items you love by clicking the heart icon</p>
            <Link to="/shop" className="btn-primary inline-block">
              Explore Products
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

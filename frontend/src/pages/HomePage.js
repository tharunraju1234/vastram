import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Skeleton } from '../components/ui/skeleton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hero images from design guidelines
const heroImage = "https://images.unsplash.com/photo-1652281846260-14c1bdd5e9a0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920";
const menImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800";
const womenImage = "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800";
const kidsImage = "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800";

const categories = [
  { name: 'Men', slug: 'men', image: menImage },
  { name: 'Women', slug: 'women', image: womenImage },
  { name: 'Kids', slug: 'kids', image: kidsImage },
];

const reviews = [
  { id: 1, name: 'Priya S.', rating: 5, text: 'Absolutely love the quality! The fabric is so soft and the fit is perfect. VASTRAM has become my go-to brand for all occasions.', location: 'Mumbai' },
  { id: 2, name: 'Rahul M.', rating: 5, text: 'Great attention to detail and excellent customer service. My order arrived faster than expected and the packaging was premium.', location: 'Delhi' },
  { id: 3, name: 'Ananya K.', rating: 4, text: 'Beautiful designs and true to size. The cotton saree I bought is gorgeous and comfortable for all-day wear.', location: 'Bangalore' },
];

const instagramImages = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
];

export const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Seed data first
      await axios.post(`${API}/seed`);
      
      const [featuredRes, newRes, bestRes] = await Promise.all([
        axios.get(`${API}/products?featured=true&limit=4`),
        axios.get(`${API}/products?is_new=true&limit=4`),
        axios.get(`${API}/products?is_bestseller=true&limit=4`),
      ]);
      
      setProducts(featuredRes.data.products || []);
      setNewArrivals(newRes.data.products || []);
      setBestsellers(bestRes.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => setCurrentReview((prev) => (prev + 1) % reviews.length);
  const prevReview = () => setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt="VASTRAM Fashion"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
        
        <div className="relative text-center text-white z-10 px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm uppercase tracking-[0.3em] mb-4"
          >
            New Collection 2024
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6"
          >
            Timeless Elegance
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl mb-8 max-w-xl mx-auto"
          >
            Discover premium fashion that defines your style
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-sm uppercase tracking-widest font-medium hover:bg-black hover:text-white transition-colors duration-300"
              data-testid="hero-shop-btn"
            >
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="section-padding container-custom" data-testid="categories-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="heading-lg mb-4">Shop by Category</h2>
          <p className="text-neutral-500">Find your perfect style</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/shop?category=${category.slug}`}
                className="group block relative aspect-[3/4] overflow-hidden"
                data-testid={`category-${category.slug}`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-serif mb-2">{category.name}</h3>
                  <span className="text-sm uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-neutral-50 dark:bg-neutral-900" data-testid="featured-section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="heading-lg mb-2">Featured Collection</h2>
              <p className="text-neutral-500">Handpicked styles for you</p>
            </div>
            <Link to="/shop?featured=true" className="btn-ghost hidden md:flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] mb-4" />
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}

          <Link to="/shop?featured=true" className="btn-primary mt-8 mx-auto block w-fit md:hidden">
            View All
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding container-custom" data-testid="new-arrivals-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <h2 className="heading-lg mb-2">New Arrivals</h2>
            <p className="text-neutral-500">Fresh styles just in</p>
          </div>
          <Link to="/shop?is_new=true" className="btn-ghost hidden md:flex items-center gap-2">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] mb-4" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Brand Story */}
      <section className="section-padding bg-black text-white" data-testid="brand-story-section">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#C4A484] text-sm uppercase tracking-widest mb-4">Our Story</p>
              <h2 className="text-4xl md:text-5xl font-serif mb-6">Crafting Elegance Since 2010</h2>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                VASTRAM was born from a passion for timeless fashion. We believe that clothing is more than fabric – 
                it's an expression of who you are. Our collections blend traditional craftsmanship with contemporary 
                design, creating pieces that stand the test of time.
              </p>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Every garment we create tells a story of dedication, quality, and style. From the finest fabrics 
                to meticulous stitching, we ensure that each piece meets our exacting standards.
              </p>
              <Link to="/shop" className="btn-secondary border-white text-white hover:bg-white hover:text-black">
                Explore Collection
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800"
                alt="VASTRAM Craftsmanship"
                className="w-full aspect-[4/5] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section-padding container-custom" data-testid="bestsellers-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <h2 className="heading-lg mb-2">Best Sellers</h2>
            <p className="text-neutral-500">Most loved by our customers</p>
          </div>
          <Link to="/shop?is_bestseller=true" className="btn-ghost hidden md:flex items-center gap-2">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] mb-4" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bestsellers.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Customer Reviews */}
      <section className="section-padding bg-neutral-50 dark:bg-neutral-900" data-testid="reviews-section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-lg mb-4">What Our Customers Say</h2>
            <p className="text-neutral-500">Real reviews from real people</p>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            <motion.div
              key={currentReview}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <Quote className="w-12 h-12 mx-auto mb-6 text-[#C4A484]" />
              <p className="text-xl md:text-2xl mb-6 leading-relaxed">
                "{reviews[currentReview].text}"
              </p>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(reviews[currentReview].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="font-medium">{reviews[currentReview].name}</p>
              <p className="text-sm text-neutral-500">{reviews[currentReview].location}</p>
            </motion.div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevReview}
                className="p-3 border border-neutral-300 hover:border-black dark:hover:border-white transition-colors"
                data-testid="prev-review-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextReview}
                className="p-3 border border-neutral-300 hover:border-black dark:hover:border-white transition-colors"
                data-testid="next-review-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <section className="section-padding container-custom" data-testid="instagram-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="heading-lg mb-4">@VASTRAM on Instagram</h2>
          <p className="text-neutral-500">Follow us for daily inspiration</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {instagramImages.map((image, index) => (
            <motion.a
              key={index}
              href="#"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-square overflow-hidden"
            >
              <img
                src={image}
                alt={`Instagram ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm uppercase tracking-wider">
                  View
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

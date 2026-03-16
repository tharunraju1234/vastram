import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Thank you for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      {/* Newsletter Section */}
      <div className="container-custom py-16 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-serif mb-4">Join Our Newsletter</h3>
          <p className="text-neutral-500 mb-6">
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              data-testid="newsletter-input"
            />
            <Button type="submit" className="btn-primary" data-testid="newsletter-submit">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-serif mb-4">VASTRAM</h2>
            <p className="text-neutral-500 text-sm mb-4">
              Premium fashion for the modern individual. Timeless style meets contemporary design.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop?category=men" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link to="/shop?category=women" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link to="/shop?category=kids" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Kids
                </Link>
              </li>
              <li>
                <Link to="/shop?is_new=true" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?is_bestseller=true" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">Help</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Track Order
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">About</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 hover:text-black dark:hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © 2024 VASTRAM. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>India (INR ₹)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProductCard from '../Components/ProductCard';
import Button from '../ui/Button';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
        <p className="text-7xl mb-4">💛</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white mb-2">Your wishlist is empty</h1>
        <p className="text-ink-800/60 dark:text-white/60 max-w-md mb-8">
          Save items you love so you can find them easily later.
        </p>
        <Link to="/menu"><Button>Browse Menu</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 pt-28 md:pt-32 pb-16 dark:bg-ink-900 dark:text-white min-h-screen">
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mb-8">
        Your Wishlist <span className="text-brand-500">({wishlistItems.length})</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {wishlistItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;

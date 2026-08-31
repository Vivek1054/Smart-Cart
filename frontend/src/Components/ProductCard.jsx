import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingBag, FaCheck, FaEye } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import RatingStars from '../ui/RatingStars';
import Badge from '../ui/Badge';
import QuickView from './QuickView';

const ProductCard = ({ item }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { notify } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const wished = isWishlisted(item.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item.id, 1);
    setJustAdded(true);
    notify(`${item.name} added to cart`, 'success', 2000);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item.id);
    notify(wished ? `Removed from wishlist` : `Added to wishlist`, 'info', 1800);
  };

  return (
    <>
    <Link to={`/product/${item.id}`} className="block h-full">
      <div className="group h-full flex flex-col rounded-2xl bg-white dark:bg-ink-800 shadow-soft hover:shadow-lift overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-ink-800/5 dark:border-white/10">
        <div className="relative overflow-hidden aspect-[4/3] bg-cream-100 dark:bg-white/5">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Badge tone="neutral" className="capitalize shadow-soft">{item.category}</Badge>
            {item.discount > 0 && <Badge tone="danger" className="shadow-soft">-{item.discount}%</Badge>}
          </div>
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.85 }}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-ink-900/90 shadow-soft backdrop-blur"
          >
            <motion.span
              animate={wished ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={wished ? 'text-brand-500' : 'text-ink-800/40 dark:text-white/40'}
            >
              <FaHeart size={13} />
            </motion.span>
          </motion.button>
          {!item.inStock && (
            <div className="absolute inset-0 bg-ink-900/50 flex items-center justify-center">
              <Badge tone="dark">Out of Stock</Badge>
            </div>
          )}
          <motion.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
            whileTap={{ scale: 0.92 }}
            aria-label={`Quick view ${item.name}`}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-ink-900/95 text-ink-900 dark:text-white text-xs font-semibold px-3 py-1.5 shadow-soft opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
          >
            <FaEye size={11} /> Quick View
          </motion.button>
        </div>
        <div className="p-4 flex flex-col flex-1 space-y-2">
          <RatingStars rating={item.rating} reviewCount={item.reviewCount} size={11} />
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white truncate">
            {item.name}
          </h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60 line-clamp-2 flex-1">
            {item.title}
          </p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-semibold text-ink-900 dark:text-white">
                ₹{item.price}
              </span>
              {item.discount > 0 && (
                <span className="text-xs text-ink-800/40 dark:text-white/40 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
            <motion.button
              onClick={handleAddToCart}
              disabled={!item.inStock}
              whileTap={{ scale: 0.94 }}
              aria-label={`Add ${item.name} to cart`}
              className="relative flex items-center justify-center rounded-full bg-ink-900 dark:bg-brand-500 text-white h-9 w-9 hover:bg-brand-600 dark:hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors overflow-hidden"
            >
              {justAdded ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <FaCheck size={13} />
                </motion.span>
              ) : (
                <FaShoppingBag size={13} />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </Link>
    <QuickView product={item} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
};

export default ProductCard;

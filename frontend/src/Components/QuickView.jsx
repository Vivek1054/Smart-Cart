import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Modal from '../ui/Modal';
import RatingStars from '../ui/RatingStars';
import QuantityStepper from '../ui/QuantityStepper';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const QuickView = ({ product, open, onClose }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { notify } = useToast();
  const [qty, setQty] = useState(1);

  if (!product) return null;
  const wished = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart(product.id, qty);
    notify(`${qty} × ${product.name} added to cart`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-cream-100 dark:bg-white/5">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          {product.discount > 0 && <Badge tone="danger" className="absolute top-3 left-3 shadow-soft">-{product.discount}%</Badge>}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-500 capitalize">{product.category}</span>
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white mt-1 mb-2">{product.name}</h2>
          <RatingStars rating={product.rating} size={12} showValue reviewCount={product.reviewCount} className="mb-3" />

          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-2xl font-semibold text-ink-900 dark:text-white">₹{product.price}</span>
            {product.discount > 0 && <span className="text-sm text-ink-800/40 dark:text-white/40 line-through">₹{product.originalPrice}</span>}
          </div>

          <p className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {product.inStock ? <FaCheckCircle size={11} /> : <FaTimesCircle size={11} />}
            {product.inStock ? `In Stock (${product.stockCount} left)` : 'Out of Stock'}
          </p>

          <p className="text-sm text-ink-800/60 dark:text-white/60 mb-5 flex-1">{product.title}</p>

          <div className="flex items-center gap-3 mb-4">
            <QuantityStepper size="sm" value={qty} onChange={setQty} max={product.stockCount || 10} />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleAddToCart} disabled={!product.inStock} className="flex-1">Add to Cart</Button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink-800/10 dark:border-white/15"
            >
              <FaHeart size={15} className={wished ? 'text-brand-500' : 'text-ink-800/40 dark:text-white/40'} />
            </button>
          </div>
          <Link to={`/product/${product.id}`} onClick={onClose} className="text-center text-sm font-semibold text-brand-600 dark:text-brand-300 hover:underline mt-4">
            View Full Details
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default QuickView;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaChevronRight, FaCheckCircle, FaTimesCircle, FaStar } from 'react-icons/fa';
import { getProductById, getRelatedProducts, getApprovedReviews, getMyReviewState, submitReview } from '../data/products';
import { friendlyError } from '../lib/errors';
import { useAuth } from '../context/AuthContext';
import { useCatalogVersion } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import RatingStars from '../ui/RatingStars';
import QuantityStepper from '../ui/QuantityStepper';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ProductCarousel from '../Components/ProductCarousel';
import NotFound from './NotFound';

const TABS = ['Description', 'Specifications', 'Reviews'];

const ReviewForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Please write a few words about the product.');
    setSaving(true);
    setError('');
    try {
      await onSubmit({ rating, text });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 p-5 space-y-3">
      <p className="font-semibold text-ink-900 dark:text-white text-sm">Write a review</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <FaStar size={20} className={n <= rating ? 'text-amber-400' : 'text-ink-800/15 dark:text-white/20'} />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What did you think?"
        className="w-full rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
      />
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      <Button type="submit" size="sm" loading={saving}>Submit review</Button>
      <p className="text-xs text-ink-800/50 dark:text-white/50">Reviews appear after a quick moderation check.</p>
    </form>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const product = React.useMemo(() => getProductById(id), [id, catalogVersion]);
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [myReview, setMyReview] = useState({ canReview: false, mine: null });

  const loadReviews = React.useCallback(async () => {
    if (!product) return;
    try {
      setReviews(await getApprovedReviews(product.id));
    } catch (e) {
      console.error('[reviews]', e);
    } finally {
      setReviewsLoading(false);
    }
    if (user) {
      try { setMyReview(await getMyReviewState(product.id)); } catch { setMyReview({ canReview: false, mine: null }); }
    } else {
      setMyReview({ canReview: false, mine: null });
    }
  }, [product, user]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { notify } = useToast();

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('Description');

  if (!product) return <NotFound />;

  const wished = isWishlisted(product.id);
  const related = getRelatedProducts(product);

  const handleAddToCart = () => {
    addToCart(product.id, qty);
    notify(`${qty} × ${product.name} added to cart`, 'success');
  };

  const handleBuyNow = () => {
    addToCart(product.id, qty);
    navigate('/checkout');
  };

  return (
    <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 pt-28 md:pt-32 pb-16 dark:bg-ink-900 dark:text-white min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-800/50 dark:text-white/50 mb-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <FaChevronRight size={9} />
        <Link to="/menu" className="hover:text-brand-500">Shop</Link>
        <FaChevronRight size={9} />
        <Link to={`/menu?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-500 capitalize">{product.category}</Link>
        <FaChevronRight size={9} />
        <span className="text-ink-800/80 dark:text-white/80 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden bg-cream-100 dark:bg-white/5 aspect-square group"
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge tone="neutral" className="capitalize shadow-soft">{product.category}</Badge>
            {product.discount > 0 && <Badge tone="danger" className="shadow-soft">-{product.discount}% OFF</Badge>}
          </div>
        </motion.div>

        {/* Info (sticky on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mb-3">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mb-5">
            <RatingStars rating={product.rating} size={14} showValue />
            <span className="text-sm text-ink-800/50 dark:text-white/50">{product.reviewCount} reviews</span>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-display text-3xl font-semibold text-ink-900 dark:text-white">₹{product.price}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-ink-800/40 dark:text-white/40 line-through">₹{product.originalPrice}</span>
                <Badge tone="success">You save ₹{product.originalPrice - product.price}</Badge>
              </>
            )}
          </div>

          <p className={`flex items-center gap-1.5 text-sm font-medium mb-6 ${product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {product.inStock ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
            {product.inStock ? `In Stock (${product.stockCount} left)` : 'Out of Stock'}
          </p>

          <p className="text-ink-800/70 dark:text-white/70 leading-relaxed mb-8">
            {product.description}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-semibold text-ink-800/80 dark:text-white/80">Quantity</span>
            <QuantityStepper value={qty} onChange={setQty} max={product.stockCount || 10} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleAddToCart} disabled={!product.inStock} size="lg" className="flex-1 min-w-[10rem]">
              Add to Cart
            </Button>
            <Button onClick={handleBuyNow} disabled={!product.inStock} variant="outline" size="lg" className="flex-1 min-w-[10rem]">
              Buy Now
            </Button>
            <motion.button
              onClick={() => { toggleWishlist(product.id); notify(wished ? 'Removed from wishlist' : 'Added to wishlist', 'info', 1800); }}
              whileTap={{ scale: 0.9 }}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-800/10 dark:border-white/15 shrink-0"
            >
              <motion.span animate={wished ? { scale: [1, 1.3, 1] } : {}} className={wished ? 'text-brand-500' : 'text-ink-800/40 dark:text-white/40'}>
                <FaHeart size={16} />
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-2 border-b border-ink-800/10 dark:border-white/10 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t ? 'text-brand-600 dark:text-brand-300' : 'text-ink-800/50 dark:text-white/50 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              {t}
              {tab === t && (
                <motion.span layoutId="pd-tab-indicator" className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {tab === 'Description' && (
          <p className="text-ink-800/70 dark:text-white/70 leading-relaxed max-w-3xl">{product.description}</p>
        )}

        {tab === 'Specifications' && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">
            {Object.entries(product.specifications).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-ink-800/5 dark:border-white/10 py-3">
                <dt className="text-sm text-ink-800/50 dark:text-white/50">{k}</dt>
                <dd className="text-sm font-semibold text-ink-900 dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === 'Reviews' && (
          <div className="space-y-4 max-w-2xl">
            {reviewsLoading && <p className="text-sm text-ink-800/50 dark:text-white/50">Loading reviews…</p>}
            {!reviewsLoading && reviews.length === 0 && (
              <p className="text-sm text-ink-800/50 dark:text-white/50">No reviews yet. Be the first to share your thoughts once you've tried it.</p>
            )}
            {myReview.mine && (
              <p className="text-sm rounded-xl bg-cream-100 dark:bg-white/5 px-4 py-3 text-ink-800/70 dark:text-white/70">
                {myReview.mine.status === 'Approved'
                  ? 'Thanks — your review is live.'
                  : myReview.mine.status === 'Pending'
                    ? 'Thanks — your review is awaiting moderation.'
                    : 'Your review is not currently visible.'}
              </p>
            )}
            {myReview.canReview && !myReview.mine && (
              <ReviewForm
                onSubmit={async ({ rating, text }) => {
                  await submitReview(product.id, { rating, text });
                  notify('Thanks! Your review will appear after moderation.', 'success');
                  await loadReviews();
                }}
              />
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-ink-900 dark:text-white text-sm">{r.author}</span>
                  <RatingStars rating={r.rating} size={11} />
                </div>
                <p className="text-sm text-ink-800/70 dark:text-white/70">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="-mx-4 md:-mx-20 mt-8">
          <ProductCarousel eyebrow="You Might Also Like" title="Related Products" products={related} />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

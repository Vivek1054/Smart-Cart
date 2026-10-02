import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaEyeSlash, FaTrash } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import RatingStars from '../../ui/RatingStars';
import { getReviewsForModeration, setReviewStatus, deleteReview } from '../../data/adminData';
import { refreshCatalog } from '../../data/catalogStore';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const Reviews = () => {
  const state = useAsync(getReviewsForModeration, []);
  return <AsyncBoundary state={state}>{(reviews) => <ReviewsView reviews={reviews} reload={state.reload} />}</AsyncBoundary>;
};

const ReviewsView = ({ reviews, reload }) => {
  const { notify } = useToast();

  // Approved reviews feed the product rating shown in the store, so refresh the catalog too.
  const handleStatus = async (reviewId, status) => {
    try {
      await setReviewStatus(reviewId, status);
      await refreshCatalog();
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      await refreshCatalog();
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const columns = [
    { key: 'productName', label: 'Product', render: (r) => <span className="font-medium text-ink-900 dark:text-white">{r.productName}</span> },
    {
      key: 'review', label: 'Review',
      render: (r) => (
        <div className="max-w-xs">
          <RatingStars rating={r.rating} size={11} className="mb-1" />
          <p className="line-clamp-2 max-w-xs text-ink-800/70 dark:text-white/70 whitespace-normal">{r.text}</p>
        </div>
      ),
    },
    { key: 'author', label: 'Author' },
    {
      key: 'date', label: 'Date',
      render: (r) => new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatus(r.id, 'Approved')}
            title="Approve review"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            aria-label="Approve"
          >
            <FaCheck size={13} />
          </button>
          <button
            onClick={() => handleStatus(r.id, 'Hidden')}
            title="Hide review"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
            aria-label="Hide"
          >
            <FaEyeSlash size={13} />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            title="Delete review"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            aria-label="Delete"
          >
            <FaTrash size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-800/40 dark:text-white/40 mb-1.5">Average Rating</p>
          <RatingStars rating={avgRating} size={14} showValue />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-800/40 dark:text-white/40 mb-1.5">Total Reviews</p>
          <p className="font-display text-lg font-semibold text-ink-900 dark:text-white">{reviews.length}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        searchKeys={['productName', 'author']}
        pageSize={8}
        emptyMessage="No reviews found"
      />
    </motion.div>
  );
};

export default Reviews;

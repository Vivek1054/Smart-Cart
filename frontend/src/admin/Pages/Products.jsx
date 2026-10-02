import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../../ui/Button';
import { getAllProductsForAdmin, adminDeleteProduct } from '../../data/products';
import { useCatalogVersion } from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';

const Products = () => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = useMemo(() => getAllProductsForAdmin(), [catalogVersion]);
  const [toDelete, setToDelete] = useState(null);

  const handleDelete = async () => {
    try {
      await adminDeleteProduct(toDelete.id);
      notify('Product deleted', 'success', 1800);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const columns = [
    {
      key: 'product', label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-ink-900 dark:text-white truncate max-w-[180px]">{p.name}</p>
            <p className="text-xs text-ink-800/40 dark:text-white/40">#{p.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (p) => <span className="capitalize">{p.category}</span> },
    { key: 'price', label: 'Price', render: (p) => `₹${p.price}` },
    { key: 'stockCount', label: 'Stock', render: (p) => p.stockCount },
    { key: 'rating', label: 'Rating', render: (p) => `${p.rating} ★` },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={!p.isActive ? 'Inactive' : p.inStock ? 'In Stock' : 'Out of Stock'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Link to={`/product/${p.id}`} target="_blank" className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 transition" aria-label="View">
            <FaEye size={13} />
          </Link>
          <button onClick={() => navigate(`/admin/products/${p.id}/edit`)} className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 transition" aria-label="Edit">
            <FaEdit size={13} />
          </button>
          <button onClick={() => setToDelete(p)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition" aria-label="Delete">
            <FaTrash size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-800/60 dark:text-white/60">{products.length} products in your catalog</p>
        <Button onClick={() => navigate('/admin/products/new')}>
          <FaPlus size={12} /> Add Product
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchKeys={['name', 'category']}
        pageSize={8}
        emptyMessage="No products found"
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this product?"
        description={toDelete ? `"${toDelete.name}" will be permanently removed from your catalog.` : ''}
      />
    </div>
  );
};

export default Products;

import React, { useMemo, useState } from 'react';
import { FaBoxOpen, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../../ui/Button';
import { getAllProductsForAdmin, adminUpdateProduct } from '../../data/products';
import { LOW_STOCK_THRESHOLD } from '../../data/adminData';
import { useCatalogVersion } from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';

const statusFor = (p) => {
  if (!p.inStock) return 'Out of Stock';
  if (p.stockCount <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
};

const Inventory = () => {
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = useMemo(() => getAllProductsForAdmin(), [catalogVersion]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const saveStock = async (p) => {
    const value = Math.floor(Number(drafts[p.id]));
    if (!Number.isFinite(value) || value < 0) return notify('Enter a valid stock quantity.', 'error');
    setSavingId(p.id);
    try {
      await adminUpdateProduct(p.id, { stockCount: value });
      setDrafts((d) => { const n = { ...d }; delete n[p.id]; return n; });
      notify('Stock updated', 'success', 1800);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const totalInventory = products.length;
  const lowStock = products.filter((p) => p.inStock && p.stockCount <= LOW_STOCK_THRESHOLD).length;
  const outOfStock = products.filter((p) => !p.inStock).length;

  const columns = [
    {
      key: 'product', label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-ink-900 dark:text-white truncate max-w-[180px]">{p.name}</p>
            <p className="text-xs text-ink-800/40 dark:text-white/40 capitalize">{p.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sku', label: 'SKU',
      render: (p) => <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">SKU-{String(p.id).padStart(4, '0')}</span>,
    },
    {
      key: 'stockCount', label: 'Stock',
      render: (p) => (
        <span className={`block text-right tabular-nums ${p.stockCount <= LOW_STOCK_THRESHOLD ? 'font-bold text-ink-900 dark:text-white' : 'text-ink-800/80 dark:text-white/80'}`}>
          {p.stockCount}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={statusFor(p)} /> },
    {
      key: 'adjust', label: 'Adjust Stock',
      render: (p) => (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={drafts[p.id] ?? ''}
            placeholder={String(p.stockCount)}
            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
            className="w-20 rounded-lg border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
            aria-label={`New stock for ${p.name}`}
          />
          <Button size="sm" variant="outline" disabled={drafts[p.id] === undefined || drafts[p.id] === ''} loading={savingId === p.id} onClick={() => saveStock(p)}>
            Save
          </Button>
        </div>
      ),
    },
    {
      key: 'lastUpdated', label: 'Last Updated',
      render: (p) => (
        <span className="text-ink-800/50 dark:text-white/50">
          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={FaBoxOpen} label="Total Inventory" value={totalInventory} tone="brand" />
        <KpiCard icon={FaExclamationTriangle} label="Low Stock" value={lowStock} tone="amber" />
        <KpiCard icon={FaTimesCircle} label="Out of Stock" value={outOfStock} tone="blue" />
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchKeys={['name', 'category']}
        pageSize={8}
        emptyMessage="No products found"
      />
    </div>
  );
};

export default Inventory;

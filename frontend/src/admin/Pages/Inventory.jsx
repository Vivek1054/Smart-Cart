import React, { useState } from 'react';
import { FaBoxOpen, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getAllProducts } from '../../data/products';

const LOW_STOCK_THRESHOLD = 8;

const statusFor = (p) => {
  if (!p.inStock) return 'Out of Stock';
  if (p.stockCount <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
};

const Inventory = () => {
  const [products] = useState(getAllProducts);

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
      key: 'lastUpdated', label: 'Last Updated',
      render: () => <span className="text-ink-800/40 dark:text-white/40">—</span>,
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

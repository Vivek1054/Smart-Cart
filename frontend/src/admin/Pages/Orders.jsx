import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Badge from '../../ui/Badge';
import { getAllOrdersForAdmin } from '../../data/adminData';
import { ORDER_STATUSES } from '../../data/orders';

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get('status') || '';

  const orders = useMemo(() => getAllOrdersForAdmin(), []);

  const filtered = useMemo(() => {
    const list = activeStatus ? orders.filter((o) => o.status === activeStatus) : orders;
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, activeStatus]);

  const setStatus = (status) => {
    if (!status) {
      const next = new URLSearchParams(searchParams);
      next.delete('status');
      setSearchParams(next);
    } else {
      setSearchParams({ status });
    }
  };

  const columns = [
    {
      key: 'id', label: 'Order ID',
      render: (o) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">{o.id}</span>
          {!o.synthetic && <Badge tone="brand">Live</Badge>}
        </div>
      ),
    },
    {
      key: 'customerName', label: 'Customer',
      render: (o) => <span className="font-medium text-ink-900 dark:text-white">{o.customerName}</span>,
    },
    {
      key: 'items', label: 'Items',
      render: (o) => `${o.items.length} item${o.items.length > 1 ? 's' : ''}`,
    },
    {
      key: 'total', label: 'Amount',
      render: (o) => <span className="font-semibold text-ink-900 dark:text-white">₹{o.total}</span>,
    },
    {
      key: 'createdAt', label: 'Date',
      render: (o) => new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: (o) => (
        <Link
          to={`/admin/orders/${o.id}`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
        >
          <FaEye size={12} /> View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-800/60 dark:text-white/60">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}{activeStatus ? ` · ${activeStatus}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatus('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
            !activeStatus
              ? 'bg-ink-900 dark:bg-brand-500 text-white border-transparent'
              : 'border-ink-800/10 dark:border-white/15 text-ink-800/70 dark:text-white/70 hover:border-brand-300'
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              activeStatus === s
                ? 'bg-ink-900 dark:bg-brand-500 text-white border-transparent'
                : 'border-ink-800/10 dark:border-white/15 text-ink-800/70 dark:text-white/70 hover:border-brand-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['id', 'customerName']}
        pageSize={8}
        emptyMessage="No orders found"
      />
    </div>
  );
};

export default Orders;

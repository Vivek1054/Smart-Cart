import React, { useMemo } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getReturns } from '../../data/adminData';

const Returns = () => {
  const returns = useMemo(() => getReturns(), []);

  const columns = [
    {
      key: 'id', label: 'Return ID',
      render: (r) => <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">{r.id}</span>,
    },
    {
      key: 'orderId', label: 'Order ID',
      render: (r) => <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">{r.orderId}</span>,
    },
    {
      key: 'customer', label: 'Customer',
      render: (r) => <span className="font-medium text-ink-900 dark:text-white">{r.customer}</span>,
    },
    { key: 'product', label: 'Product' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'amount', label: 'Amount',
      render: (r) => <span className="font-semibold text-ink-900 dark:text-white">₹{r.amount}</span>,
    },
    {
      key: 'date', label: 'Date',
      render: (r) => new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-cream-100 dark:bg-white/5 px-4 py-3 text-sm text-ink-800/60 dark:text-white/60 flex items-start gap-2.5">
        <FaInfoCircle className="mt-0.5 shrink-0 text-ink-800/40 dark:text-white/40" size={14} />
        <span>These are demo return requests for illustration — there's no backend here to actually process refunds.</span>
      </div>

      <DataTable
        columns={columns}
        data={returns}
        searchKeys={['id', 'orderId', 'customer', 'product']}
        pageSize={8}
        emptyMessage="No returns found"
      />
    </div>
  );
};

export default Returns;

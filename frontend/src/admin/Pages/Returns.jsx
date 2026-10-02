import React from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getReturns, updateReturnStatus } from '../../data/adminData';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const RETURN_STATUSES = ['Requested', 'Approved', 'Rejected', 'Completed'];

const Returns = () => {
  const state = useAsync(getReturns, []);
  return <AsyncBoundary state={state}>{(returns) => <ReturnsView returns={returns} reload={state.reload} />}</AsyncBoundary>;
};

const ReturnsView = ({ returns, reload }) => {
  const { notify } = useToast();

  const handleStatus = async (r, status) => {
    try {
      await updateReturnStatus(r.dbId, status);
      notify(`Return marked ${status}`, 'success', 1800);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

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
    {
      key: 'actions', label: 'Update',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatus(r, e.target.value)}
          aria-label={`Update status of ${r.id}`}
          className="rounded-lg border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
        >
          {RETURN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-4">
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

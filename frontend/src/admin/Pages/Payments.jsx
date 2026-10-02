import React, { useMemo } from 'react';
import { FaCreditCard, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getPayments } from '../../data/adminData';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const Payments = () => {
  const state = useAsync(getPayments, []);
  return <AsyncBoundary state={state}>{(payments) => <PaymentsView payments={payments} />}</AsyncBoundary>;
};

const PaymentsView = ({ payments }) => {

  const counts = useMemo(() => ({
    total: payments.length,
    success: payments.filter((p) => p.status === 'Paid').length,
    pending: payments.filter((p) => p.status === 'Pending').length,
    failed: payments.filter((p) => p.status === 'Failed').length,
  }), [payments]);

  const columns = [
    {
      key: 'id', label: 'Payment Ref',
      render: (p) => <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">{p.id}</span>,
    },
    {
      key: 'orderId', label: 'Order ID',
      render: (p) => <span className="font-mono text-xs text-ink-800/70 dark:text-white/70">{p.orderId}</span>,
    },
    {
      key: 'customer', label: 'Customer',
      render: (p) => <span className="font-medium text-ink-900 dark:text-white">{p.customer}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: (p) => <span className="font-semibold text-ink-900 dark:text-white">₹{p.amount}</span>,
    },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'date', label: 'Date',
      render: (p) => new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={FaCreditCard} label="Total Payments" value={counts.total} tone="brand" />
        <KpiCard icon={FaCheckCircle} label="Paid" value={counts.success} tone="green" />
        <KpiCard icon={FaClock} label="Pending" value={counts.pending} tone="amber" />
        <KpiCard icon={FaTimesCircle} label="Failed" value={counts.failed} tone="blue" />
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchKeys={['id', 'orderId', 'customer']}
        pageSize={8}
        emptyMessage="No payments found"
      />
    </div>
  );
};

export default Payments;

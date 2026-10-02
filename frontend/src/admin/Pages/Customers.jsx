import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserCheck, FaRupeeSign, FaEye } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { getCustomers } from '../../data/adminData';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const Customers = () => {
  const state = useAsync(getCustomers, []);
  return <AsyncBoundary state={state}>{(customers) => <CustomersView customers={customers} />}</AsyncBoundary>;
};

const CustomersView = ({ customers }) => {
  const navigate = useNavigate();

  const activeCount = customers.filter((c) => c.status === 'Active').length;
  const avgSpend = customers.length
    ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length)
    : 0;

  const columns = [
    {
      key: 'customer', label: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink-900 dark:text-white truncate max-w-[180px]">{c.name}</p>
            <p className="text-xs text-ink-800/40 dark:text-white/40 truncate max-w-[180px]">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City' },
    { key: 'orders', label: 'Orders' },
    { key: 'totalSpent', label: 'Total Spent', render: (c) => `₹${c.totalSpent.toLocaleString()}` },
    {
      key: 'joined', label: 'Joined',
      render: (c) => new Date(c.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/customers/${c.id}`)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
            aria-label="View"
          >
            <FaEye size={13} />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard icon={FaUsers} label="Total Customers" value={customers.length} tone="brand" />
        <KpiCard icon={FaUserCheck} label="Active Customers" value={activeCount} tone="green" />
        <KpiCard icon={FaRupeeSign} label="Avg. Spend / Customer" value={`₹${avgSpend.toLocaleString()}`} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchKeys={['name', 'email', 'city']}
        pageSize={8}
        emptyMessage="No customers found"
      />
    </motion.div>
  );
};

export default Customers;

import React from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaShoppingBag, FaRupeeSign, FaChartLine, FaInbox } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import Button from '../../ui/Button';
import { getCustomerById, getOrdersForCustomer, setCustomerStatus } from '../../data/adminData';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const CustomerDetail = () => {
  const { id } = useParams();
  const state = useAsync(async () => {
    const customer = await getCustomerById(id);
    const orders = customer ? await getOrdersForCustomer(id) : [];
    return { customer, orders };
  }, [id]);
  return (
    <AsyncBoundary state={state}>
      {({ customer, orders }) => <CustomerView initial={customer} orders={orders} />}
    </AsyncBoundary>
  );
};

const CustomerView = ({ initial, orders }) => {
  const { notify } = useToast();
  const [customer, setCustomer] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  if (!customer) {
    return (
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-8 text-center">
        <p className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-2">Customer not found</p>
        <p className="text-sm text-ink-800/60 dark:text-white/60 mb-5">
          We couldn't find a customer with that ID.
        </p>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all"
        >
          <FaArrowLeft size={11} /> Back to Customers
        </Link>
      </div>
    );
  }

  const toggleStatus = async () => {
    const next = customer.status === 'Active' ? 'Blocked' : 'Active';
    setBusy(true);
    try {
      await setCustomerStatus(customer.id, next);
      setCustomer({ ...customer, status: next });
      notify(next === 'Blocked' ? 'Customer blocked' : 'Customer unblocked', 'success', 1800);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const avgOrderValue = customer.orders ? Math.round(customer.totalSpent / customer.orders) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800/60 dark:text-white/60 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
      >
        <FaArrowLeft size={11} /> Back to Customers
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-2xl">
            {customer.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">{customer.name}</h2>
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-sm text-ink-800/60 dark:text-white/60">{customer.email}</p>
            <p className="text-sm text-ink-800/60 dark:text-white/60">
              {customer.city !== '—' ? `${customer.city} · ` : ''}Joined{' '}
              {new Date(customer.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <Button variant={customer.status === 'Active' ? 'danger' : 'outline'} size="sm" loading={busy} onClick={toggleStatus}>
            {customer.status === 'Active' ? 'Block customer' : 'Unblock customer'}
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={FaShoppingBag} label="Orders" value={customer.orders} tone="blue" />
        <KpiCard icon={FaRupeeSign} label="Total Spent" value={`₹${customer.totalSpent.toLocaleString()}`} tone="brand" />
        <KpiCard icon={FaChartLine} label="Avg. Order Value" value={`₹${avgOrderValue.toLocaleString()}`} tone="amber" />
      </div>

      {/* Order history */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6">
        <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Order History</h3>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-ink-800/40 dark:text-white/40">
            <FaInbox size={26} className="mb-3" />
            <p className="text-sm font-medium">This customer hasn't placed any orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-800/5 dark:divide-white/10">
            {orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-cream-50 dark:hover:bg-white/[0.03] transition-colors">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-800/70 dark:text-white/70">{o.id}</p>
                  <p className="text-xs text-ink-800/50 dark:text-white/50">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-ink-900 dark:text-white">₹{o.total}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerDetail;

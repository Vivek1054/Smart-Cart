import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaRupeeSign, FaShoppingBag, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import LineChart from '../../ui/charts/LineChart';
import BarChart from '../../ui/charts/BarChart';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';
import { api } from '../../services/api';

const Analytics = () => {
  const state = useAsync(() => api.get('/admin/dashboard'), []);
  return <AsyncBoundary state={state}>{(data) => <AnalyticsView data={data} />}</AsyncBoundary>;
};

const AnalyticsView = ({ data }) => {
  const monthly = data.revenueByMonth.map((m) => ({ month: m.label, revenue: m.revenue }));
  const trend = data.revenueByDay;

  const totalRevenue = data.totals.revenue;
  const totalOrders = data.totals.orders;
  const avgOrderValue = data.totals.avgOrderValue;
  const thisMonthRevenue = monthly[monthly.length - 1]?.revenue || 0;

  const topProducts = useMemo(() => {
    const max = Math.max(data.topProducts[0]?.units || 0, 1);
    return data.topProducts.map((p) => ({ id: p.name, name: p.name, units: p.units, pct: Math.max((p.units / max) * 100, p.units > 0 ? 4 : 0) }));
  }, [data.topProducts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1">
          A deeper look at revenue, orders and top-performing products.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={FaRupeeSign} label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} tone="brand" />
        <KpiCard icon={FaShoppingBag} label="Total Orders" value={totalOrders} tone="blue" />
        <KpiCard icon={FaChartLine} label="Avg. Order Value" value={`₹${avgOrderValue.toLocaleString()}`} tone="amber" />
        <KpiCard icon={FaCalendarAlt} label="This Month" value={`₹${thisMonthRevenue.toLocaleString()}`} tone="green" />
      </div>

      {/* Revenue Trend */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Revenue Trend (30 days)</h3>
        <LineChart data={trend.map((t) => ({ label: t.date.slice(5), value: t.revenue }))} formatValue={(v) => `₹${v.toLocaleString()}`} />
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Monthly Revenue (12 months)</h3>
        <BarChart data={monthly.map((m) => ({ label: m.month, value: m.revenue }))} formatValue={(v) => `₹${v.toLocaleString()}`} />
      </div>

      {/* Top Products */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-5">Top Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-ink-800/50 dark:text-white/50">No product sales data yet.</p>
        ) : (
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs font-semibold text-ink-800/60 dark:text-white/60 shrink-0">{p.units} sold</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-800/5 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-brand-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Analytics;

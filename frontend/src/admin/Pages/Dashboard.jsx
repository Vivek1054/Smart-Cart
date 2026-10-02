import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaRupeeSign, FaShoppingBag, FaUsers, FaBoxOpen, FaClock, FaExclamationTriangle, FaChartLine, FaArrowRight,
} from 'react-icons/fa';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import LineChart from '../../ui/charts/LineChart';
import DonutChart from '../../ui/charts/DonutChart';
import { getAllProductsForAdmin } from '../../data/products';
import { useCatalogVersion } from '../../context/CatalogContext';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';
import { api } from '../../services/api';

// All numbers come from GET /api/v1/admin/dashboard (real aggregates computed in Postgres).
const Dashboard = () => {
  useCatalogVersion();
  const state = useAsync(() => api.get('/admin/dashboard'), []);
  return <AsyncBoundary state={state}>{(data) => <DashboardView data={data} />}</AsyncBoundary>;
};

const DashboardView = ({ data }) => {
  const products = getAllProductsForAdmin();
  const t = data.totals;
  const kpis = {
    totalRevenue: t.revenue,
    totalOrders: t.orders,
    totalCustomers: t.customers,
    totalProducts: t.products,
    todaysSales: t.todaysSales,
    pendingOrders: t.pendingOrders,
    lowStock: t.lowStock,
    avgOrderValue: t.avgOrderValue,
  };
  const trend = data.revenueByDay.slice(-14);
  const orders = data.recentOrders;

  const categoryBreakdown = Object.entries(
    products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value], i) => ({
    label,
    value,
    color: ['#c1571f', '#e17a44', '#eda072', '#2f6f4f', '#7a5c9e'][i % 5],
  }));

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={FaRupeeSign} label="Total Revenue" value={`₹${kpis.totalRevenue.toLocaleString()}`} tone="brand" />
        <KpiCard icon={FaShoppingBag} label="Total Orders" value={kpis.totalOrders} tone="blue" />
        <KpiCard icon={FaUsers} label="Total Customers" value={kpis.totalCustomers} tone="green" />
        <KpiCard icon={FaBoxOpen} label="Total Products" value={kpis.totalProducts} tone="amber" />
        <KpiCard icon={FaChartLine} label="Today's Sales" value={`₹${kpis.todaysSales.toLocaleString()}`} tone="brand" />
        <KpiCard icon={FaClock} label="Pending Orders" value={kpis.pendingOrders} tone="amber" />
        <KpiCard icon={FaExclamationTriangle} label="Low Stock Items" value={kpis.lowStock} tone="green" />
        <KpiCard icon={FaRupeeSign} label="Avg. Order Value" value={`₹${kpis.avgOrderValue}`} tone="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Revenue Trend (14 days)</h3>
          </div>
          <LineChart data={trend.map((t) => ({ label: t.date.slice(5), value: t.revenue }))} formatValue={(v) => `₹${v}`} />
        </div>

        <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-6">Catalog by Category</h3>
          <DonutChart data={categoryBreakdown} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5 dark:border-white/10">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Recent Orders</h3>
          <Link to="/admin/orders" className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all">
            View All <FaArrowRight size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-800/40 dark:text-white/40">
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-800/50 dark:text-white/50">No orders yet.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.orderNumber} className="border-t border-ink-800/5 dark:border-white/5 hover:bg-cream-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-800/70 dark:text-white/70">{o.orderNumber}</td>
                  <td className="px-5 py-3.5 text-ink-900 dark:text-white">{o.customer}</td>
                  <td className="px-5 py-3.5 text-ink-800/60 dark:text-white/60">{o.itemCount} item{o.itemCount > 1 ? 's' : ''}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink-900 dark:text-white">₹{o.total}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

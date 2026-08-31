import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { useAdminAuth } from '../../context/AdminAuthContext';

const TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/inventory': 'Inventory',
  '/admin/customers': 'Customers',
  '/admin/analytics': 'Analytics',
  '/admin/orders': 'Orders',
  '/admin/returns': 'Returns & Refunds',
  '/admin/coupons': 'Coupons',
  '/admin/promotions': 'Promotions & Banners',
  '/admin/reviews': 'Reviews',
  '/admin/payments': 'Payments',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
};

const AdminLayout = () => {
  const { isAdminAuthenticated } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const baseTitle = TITLES[location.pathname] || Object.entries(TITLES).find(([p]) => location.pathname.startsWith(p))?.[1] || 'Admin';

  return (
    <div className="flex min-h-screen bg-cream-100 dark:bg-ink-900">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar onOpenMobileSidebar={() => setMobileOpen(true)} title={baseTitle} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

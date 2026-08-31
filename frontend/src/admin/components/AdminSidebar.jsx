import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTachometerAlt, FaBoxOpen, FaTags, FaWarehouse, FaUsers, FaChartLine, FaShoppingBag,
  FaTicketAlt, FaBullhorn, FaStar, FaCreditCard, FaUndo, FaBell, FaCog, FaChevronDown,
  FaChevronLeft, FaShoppingBasket,
} from 'react-icons/fa';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  {
    label: 'Catalog', icon: FaBoxOpen,
    children: [
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/inventory', label: 'Inventory' },
    ],
  },
  {
    label: 'Orders', icon: FaShoppingBag,
    children: [
      { to: '/admin/orders', label: 'All Orders' },
      { to: '/admin/orders?status=Pending', label: 'Pending' },
      { to: '/admin/orders?status=Delivered', label: 'Delivered' },
      { to: '/admin/returns', label: 'Returns' },
    ],
  },
  { to: '/admin/customers', label: 'Customers', icon: FaUsers },
  { to: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
  {
    label: 'Marketing', icon: FaBullhorn,
    children: [
      { to: '/admin/coupons', label: 'Coupons' },
      { to: '/admin/promotions', label: 'Promotions' },
    ],
  },
  { to: '/admin/reviews', label: 'Reviews', icon: FaStar },
  { to: '/admin/payments', label: 'Payments', icon: FaCreditCard },
  { to: '/admin/notifications', label: 'Notifications', icon: FaBell },
  { to: '/admin/settings', label: 'Settings', icon: FaCog },
];

const GroupItem = ({ item, collapsed }) => {
  const [open, setOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="relative group/tip">
        <div className="flex items-center justify-center py-2.5 rounded-xl text-ink-300 hover:bg-white/5 hover:text-white transition cursor-default">
          <item.icon size={15} />
        </div>
        <div className="absolute left-full top-0 ml-2 w-44 rounded-xl bg-ink-800 border border-white/10 shadow-lift p-2 opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-50">
          <p className="px-2 py-1 text-xs font-semibold text-white/50">{item.label}</p>
          {item.children.map((c) => (
            <NavLink key={c.label} to={c.to} className={({ isActive }) => `block px-2 py-1.5 rounded-lg text-sm ${isActive ? 'text-brand-400 bg-white/5' : 'text-white/80 hover:bg-white/5'}`}>
              {c.label}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white transition"
      >
        <item.icon size={15} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <FaChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-9"
          >
            {item.children.map((c) => (
              <NavLink
                key={c.label}
                to={c.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition ${isActive ? 'text-brand-400 font-semibold' : 'text-ink-400 hover:text-white'}`
                }
              >
                {c.label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminSidebar = ({ collapsed, setCollapsed, mobileOpen, onCloseMobile }) => {
  const content = (
    <div className="flex flex-col h-full bg-ink-900 text-white">
      <div className={`flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 shrink-0">
          <FaShoppingBasket size={13} />
        </span>
        {!collapsed && <span className="font-display text-lg font-semibold">SmartCart</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) =>
          item.children ? (
            <GroupItem key={item.label} item={item} collapsed={collapsed} />
          ) : collapsed ? (
            <div key={item.label} className="relative group/tip">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-center py-2.5 rounded-xl transition ${isActive ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`
                }
              >
                <item.icon size={15} />
              </NavLink>
              <div className="absolute left-full top-1 ml-2 whitespace-nowrap rounded-lg bg-ink-800 border border-white/10 px-2.5 py-1.5 text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-50">
                {item.label}
              </div>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              <item.icon size={15} className="shrink-0" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="hidden lg:flex items-center gap-2 m-3 px-3 py-2.5 rounded-xl text-sm text-ink-300 hover:bg-white/5 hover:text-white transition"
      >
        <FaChevronLeft size={13} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        {!collapsed && 'Collapse'}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:block shrink-0 sticky top-0 h-screen z-30"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.div
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;

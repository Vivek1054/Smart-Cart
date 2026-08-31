import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaSearch, FaHeart, FaShoppingBag, FaUser, FaBars, FaChevronDown,
  FaSignOutAlt, FaBoxOpen, FaTags,
} from 'react-icons/fa';
import { getCategories } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import MobileMenu from './MobileMenu';
import MiniCart from './MiniCart';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Shop' },
  { to: '/menu?deal=1', label: 'Deals' },
  { to: '/about', label: 'About' },
  { to: '/contactus', label: 'Contact' },
];

const CartBadge = ({ count }) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.span
        key={count}
        initial={{ scale: 0 }}
        animate={{ scale: [1.3, 1] }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white leading-none"
        style={{ height: 18 }}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    )}
  </AnimatePresence>
);

const Navbar = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [scrolled, setScrolled] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const shopRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setShopOpen(false);
    setAccountOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
    setMiniCartOpen(false);
  }, [location.pathname, location.search]);

  const categories = getCategories().filter((c) => c !== 'All');

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/menu?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
    }
  };

  const isActivePath = (to) => {
    const [path] = to.split('?');
    if (path === '/') return location.pathname === '/';
    return location.pathname === path && (to.includes('deal=1') ? location.search.includes('deal=1') : !location.search.includes('deal=1') || path !== '/menu');
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-[padding,background-color,box-shadow,backdrop-filter] duration-300 ease-out ${
          scrolled
            ? 'py-2 bg-cream-50/90 dark:bg-ink-900/90 backdrop-blur-md shadow-soft border-b border-ink-800/5 dark:border-white/10'
            : 'py-4 bg-cream-50/60 dark:bg-ink-900/60 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-screen-2xl container mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Link to="/" className="flex items-center gap-2 group shrink-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-cream-50 shadow-soft transition-transform group-hover:scale-105 group-hover:rotate-6">
                  <FaShoppingBag className="h-4 w-4" />
                </span>
                <span className="font-display text-xl md:text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
                  SmartCart
                </span>
              </Link>
            </motion.div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 relative">
              {NAV_LINKS.map((item) => {
                if (item.label === 'Shop') {
                  return (
                    <div key={item.label} ref={shopRef} className="relative">
                      <button
                        onClick={() => setShopOpen((v) => !v)}
                        aria-expanded={shopOpen}
                        className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                          location.pathname === '/menu' && !location.search.includes('deal=1')
                            ? 'text-brand-600 dark:text-brand-300'
                            : 'text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300'
                        }`}
                      >
                        {item.label}
                        <FaChevronDown className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`} size={9} />
                      </button>
                      <AnimatePresence>
                        {shopOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.16 }}
                            className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-ink-800 shadow-lift border border-ink-800/5 dark:border-white/10 p-2 z-50"
                          >
                            <Link
                              to="/menu"
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-900 dark:text-white hover:bg-brand-50 dark:hover:bg-white/5 transition"
                            >
                              <FaBoxOpen className="text-brand-500" size={13} /> All Products
                            </Link>
                            <div className="my-1.5 border-t border-ink-800/5 dark:border-white/10" />
                            {categories.map((cat) => (
                              <Link
                                key={cat}
                                to={`/menu?category=${encodeURIComponent(cat)}`}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-ink-800/70 dark:text-white/70 hover:bg-brand-50 dark:hover:bg-white/5 hover:text-brand-600 dark:hover:text-brand-300 transition capitalize"
                              >
                                <FaTags className="opacity-40" size={11} /> {cat}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`relative px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                      isActivePath(item.to)
                        ? 'text-brand-600 dark:text-brand-300'
                        : 'text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300'
                    }`}
                  >
                    {item.label}
                    {isActivePath(item.to) && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search (desktop inline, mobile icon) */}
              <div className="hidden md:block relative">
                <AnimatePresence initial={false} mode="wait">
                  {searchOpen ? (
                    <motion.form
                      key="open"
                      onSubmit={submitSearch}
                      initial={{ width: 40, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 40, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex items-center gap-2 rounded-full border border-ink-800/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3.5 py-2 overflow-hidden"
                    >
                      <FaSearch className="text-ink-800/40 dark:text-white/40 shrink-0" size={13} />
                      <input
                        autoFocus
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onBlur={() => !searchValue && setSearchOpen(false)}
                        placeholder="Search sandwiches..."
                        className="bg-transparent outline-none text-sm w-full placeholder:text-ink-800/40 dark:placeholder:text-white/40"
                      />
                    </motion.form>
                  ) : (
                    <motion.button
                      key="closed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSearchOpen(true)}
                      aria-label="Open search"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
                    >
                      <FaSearch size={15} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                aria-label="Toggle dark mode"
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                  </svg>
                )}
              </button>

              <NotificationBell />

              {/* Wishlist */}
              <Link
                to="/wishlist"
                aria-label={`Wishlist, ${wishCount} items`}
                className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
              >
                <FaHeart size={16} />
                <CartBadge count={wishCount} />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setMiniCartOpen(true)}
                aria-label={`Cart, ${itemCount} items`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
              >
                <FaShoppingBag size={16} />
                <CartBadge count={itemCount} />
              </button>

              {/* Account */}
              <div ref={accountRef} className="relative hidden md:block">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
                >
                  {isAuthenticated ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <FaUser size={15} />
                  )}
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-ink-800 shadow-lift border border-ink-800/5 dark:border-white/10 p-2 z-50"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-3 py-2 mb-1">
                            <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-ink-800/50 dark:text-white/50 truncate">{user.email}</p>
                          </div>
                          <Link to="/account" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-ink-800 dark:text-white hover:bg-brand-50 dark:hover:bg-white/5 transition">
                            My Account
                          </Link>
                          <Link to="/wishlist" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-ink-800 dark:text-white hover:bg-brand-50 dark:hover:bg-white/5 transition">
                            Wishlist
                          </Link>
                          <button
                            onClick={logout}
                            className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <FaSignOutAlt size={12} /> Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-900 dark:text-white hover:bg-brand-50 dark:hover:bg-white/5 transition">
                            Login
                          </Link>
                          <Link to="/signup" className="block px-3 py-2.5 rounded-xl text-sm text-ink-800/70 dark:text-white/70 hover:bg-brand-50 dark:hover:bg-white/5 transition">
                            Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
              >
                <FaBars size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
        theme={theme}
        setTheme={setTheme}
      />
      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </>
  );
};

export default Navbar;

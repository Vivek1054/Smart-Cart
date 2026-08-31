import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaHeart, FaShoppingBag, FaUser, FaSignOutAlt, FaChevronRight } from 'react-icons/fa';
import Drawer from '../ui/Drawer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Shop' },
  { to: '/menu?deal=1', label: 'Deals' },
  { to: '/about', label: 'About' },
  { to: '/contactus', label: 'Contact' },
];

const MobileMenu = ({ open, onClose, categories, theme, setTheme }) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/menu?q=${encodeURIComponent(q.trim())}`);
      onClose();
    }
  };

  return (
    <Drawer open={open} onClose={onClose} side="right" title="Menu">
      <div className="p-5 space-y-6">
        <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-4 py-2.5">
          <FaSearch className="text-ink-800/40 dark:text-white/40 shrink-0" size={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sandwiches..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-ink-800/40 dark:placeholder:text-white/40"
          />
        </form>

        {isAuthenticated ? (
          <div className="flex items-center gap-3 rounded-2xl bg-cream-50 dark:bg-white/5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
              <Link to="/account" onClick={onClose} className="text-xs text-brand-600 dark:text-brand-300 font-medium">
                View account
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              to="/login"
              onClick={onClose}
              className="flex-1 text-center bg-ink-900 dark:bg-brand-500 text-white font-semibold py-2.5 rounded-full text-sm"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="flex-1 text-center border-2 border-ink-800/15 dark:border-white/20 text-ink-900 dark:text-white font-semibold py-2.5 rounded-full text-sm"
            >
              Sign Up
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link to="/wishlist" onClick={onClose} className="flex items-center justify-between rounded-2xl bg-cream-50 dark:bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white"><FaHeart className="text-brand-500" /> Wishlist</span>
            <span className="text-xs font-bold text-ink-800/50 dark:text-white/50">{wishCount}</span>
          </Link>
          <Link to="/cart" onClick={onClose} className="flex items-center justify-between rounded-2xl bg-cream-50 dark:bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white"><FaShoppingBag className="text-brand-500" /> Cart</span>
            <span className="text-xs font-bold text-ink-800/50 dark:text-white/50">{itemCount}</span>
          </Link>
        </div>

        <nav className="space-y-1">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-3 rounded-xl font-medium text-ink-900 dark:text-white hover:bg-cream-50 dark:hover:bg-white/5 transition"
            >
              {l.label} <FaChevronRight size={11} className="opacity-30" />
            </Link>
          ))}
        </nav>

        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-ink-800/40 dark:text-white/40 mb-1">Categories</p>
          <nav className="space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/menu?category=${encodeURIComponent(cat)}`}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-ink-800/70 dark:text-white/70 hover:bg-cream-50 dark:hover:bg-white/5 transition capitalize"
              >
                {cat} <FaChevronRight size={10} className="opacity-30" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-cream-50 dark:bg-white/5 px-4 py-3">
          <span className="text-sm font-semibold text-ink-900 dark:text-white">Dark Mode</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-brand-500' : 'bg-ink-800/15'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <FaSignOutAlt size={13} /> Logout
          </button>
        )}
      </div>
    </Drawer>
  );
};

export default MobileMenu;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon, FaDesktop, FaStore, FaUserCircle, FaPalette } from 'react-icons/fa';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ChangePasswordForm from '../../Components/ChangePasswordForm';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getStoreSettings, saveStoreSettings } from '../../data/promotions';

const CARD = 'rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6';

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 shrink-0">
      <Icon size={15} />
    </span>
    <div>
      <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-xs text-ink-800/50 dark:text-white/50 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Settings = () => {
  const { notify } = useToast();
  const { admin } = useAdminAuth();

  // Store settings are saved to Supabase (site_settings, admin-only writes).
  const [store] = useState(getStoreSettings);
  const [storeName, setStoreName] = useState(store.name);
  const [currency, setCurrency] = useState(store.currency);
  const [supportEmail, setSupportEmail] = useState(store.support_email);
  const [savingStore, setSavingStore] = useState(false);

  // Appearance — mirrors the dark-mode toggle logic used in MobileMenu.jsx /
  // AdminTopbar.jsx: toggle the `dark` class on <html> and <body>, persist
  // the choice to localStorage. This demo doesn't implement a system-preference
  // watcher, so "System" is a simplification that just behaves like "Light".
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'light');

  const applyTheme = (next) => {
    const root = document.documentElement;
    if (next === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', next);
    setThemeState(next);
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeName.trim()) return notify('Store name is required.', 'error');
    setSavingStore(true);
    try {
      await saveStoreSettings({ name: storeName.trim(), currency, support_email: supportEmail.trim() });
      notify('Store settings saved.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Settings</h1>
        <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1">
          Configure store preferences and admin account details.
        </p>
      </div>

      {/* Store */}
      <form onSubmit={handleSaveStore} className={CARD}>
        <SectionHeading icon={FaStore} title="Store" subtitle="Basic details shown across the storefront." />
        <div className="space-y-4">
          <Input label="Store Name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />

          <div>
            <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white transition focus:outline-none focus:ring-2 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
            </select>
          </div>

          <Input
            label="Support Email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" size="sm" loading={savingStore}>Save Store Settings</Button>
        </div>
      </form>

      {/* Admin Profile */}
      <div className={CARD}>
        <SectionHeading icon={FaUserCircle} title="Admin Profile" subtitle="Your signed-in admin account (managed in Supabase Auth)." />
        <div className="space-y-4">
          <Input label="Name" value={admin?.name || ''} readOnly disabled />
          <Input label="Email" value={admin?.email || ''} readOnly disabled />
          <Input label="Role" value={admin?.role || ''} readOnly disabled />
        </div>
        <div className="mt-6 pt-6 border-t border-ink-800/10 dark:border-white/10">
          <ChangePasswordForm />
        </div>
      </div>

      {/* Appearance */}
      <div className={CARD}>
        <SectionHeading icon={FaPalette} title="Appearance" subtitle="Choose how the admin dashboard looks." />
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => applyTheme('light')}
            className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition ${
              theme === 'light'
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                : 'border-ink-800/10 dark:border-white/15 text-ink-800/60 dark:text-white/60 hover:border-brand-300'
            }`}
          >
            <FaSun size={16} />
            <span className="text-xs font-semibold">Light</span>
          </button>
          <button
            type="button"
            onClick={() => applyTheme('dark')}
            className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition ${
              theme === 'dark'
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                : 'border-ink-800/10 dark:border-white/15 text-ink-800/60 dark:text-white/60 hover:border-brand-300'
            }`}
          >
            <FaMoon size={16} />
            <span className="text-xs font-semibold">Dark</span>
          </button>
          {/* "System" is a demo-scope simplification — this app has no
              matchMedia preference watcher, so System just behaves like Light. */}
          <button
            type="button"
            onClick={() => applyTheme('light')}
            className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition ${
              theme !== 'dark'
                ? 'border-ink-800/10 dark:border-white/15 text-ink-800/60 dark:text-white/60'
                : 'border-ink-800/10 dark:border-white/15 text-ink-800/60 dark:text-white/60 hover:border-brand-300'
            }`}
          >
            <FaDesktop size={16} />
            <span className="text-xs font-semibold">System</span>
          </button>
        </div>
      </div>

    </motion.div>
  );
};

export default Settings;

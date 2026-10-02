import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShoppingBasket } from 'react-icons/fa';
import { useAdminAuth } from '../../context/AdminAuthContext';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const AdminLogin = () => {
  const { isAdminAuthenticated, loading: authLoading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900">
        <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return <Navigate to={location.state?.from || '/admin/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (result.ok) navigate('/admin/dashboard');
    else setErrors({ form: result.error });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-900">
      {/* Visual side */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-900 to-brand-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500">
            <FaShoppingBasket className="text-white" size={15} />
          </span>
          <span className="font-display text-2xl font-semibold text-white">SmartCart</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-300 mb-4">Admin Console</span>
          <h1 className="font-display text-4xl font-semibold text-white leading-tight mb-4">
            Run your store with confidence.
          </h1>
          <p className="text-white/60">
            Track revenue, manage inventory, and keep every order moving — all from one powerful dashboard.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-8 text-white/50 text-sm">
          <span>Products</span>
          <span>Orders</span>
          <span>Customers</span>
          <span>Analytics</span>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-cream-50 dark:bg-ink-900">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm"
          noValidate
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500">
              <FaShoppingBasket className="text-white" size={15} />
            </span>
            <span className="font-display text-xl font-semibold text-ink-900 dark:text-white">SmartCart</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white mb-1">Admin Login</h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60 mb-8">Sign in to manage your store.</p>

          {errors.form && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5"
            >
              {errors.form}
            </motion.p>
          )}

          <Input
            label="Email"
            type="email"
            icon={<FaEnvelope size={13} />}
            placeholder="admin email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            containerClassName="mb-4"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<FaLock size={13} />}
              placeholder="••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-[42px] text-ink-800/40 dark:text-white/40 hover:text-brand-500 transition"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-6" size="lg">
            Login to Dashboard
          </Button>

          <Link to="/" className="block mt-4 text-center text-sm text-ink-800/50 dark:text-white/50 hover:text-ink-800/80 dark:hover:text-white/80 transition">
            ← Back to Store
          </Link>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminLogin;

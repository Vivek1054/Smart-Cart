import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaShoppingBasket } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Landing page for the emailed password-reset link. Supabase signs the user in
// with a short-lived recovery session (event PASSWORD_RECOVERY); here they pick a new password.
const ResetPassword = () => {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, updatePassword, logout } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    const result = await updatePassword(form.password);
    setLoading(false);
    if (!result.ok) return setError(result.error);
    notify('Password updated. Please log in with your new password.', 'success', 4000);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-cream-100 dark:bg-ink-900">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-ink-800 p-8 rounded-2xl shadow-lift w-full max-w-md border border-ink-800/5 dark:border-white/10"
      >
        <div className="text-center mb-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white mb-3">
            <FaShoppingBasket size={18} />
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white text-center">Set a new password</h2>

        {authLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center mt-4">
            <p className="text-sm text-ink-800/60 dark:text-white/60 mb-5">
              This reset link is invalid or has expired. Request a new one from the login page.
            </p>
            <Link to="/login" className="text-sm font-semibold text-brand-600 dark:text-brand-300 hover:underline">Back to login</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1 text-center mb-6">Choose a password you haven't used before.</p>
            {error && (
              <p role="alert" className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5">
                {error}
              </p>
            )}
            <Input
              label="New password"
              type="password"
              icon={<FaLock size={13} />}
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
              containerClassName="mb-4"
            />
            <Input
              label="Confirm password"
              type="password"
              icon={<FaLock size={13} />}
              value={form.confirm}
              onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
            />
            <Button type="submit" loading={loading} className="w-full mt-6" size="lg">Update password</Button>
          </>
        )}
      </motion.form>
    </div>
  );
};

export default ResetPassword;

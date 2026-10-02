import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaShoppingBasket } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AnimatedSandwich from '../Components/AnimatedSandwich';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focusField, setFocusField] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (result.ok) {
      setSuccess(true);
      notify('Welcome back!', 'success');
      setTimeout(() => navigate(location.state?.from || '/account', { replace: true }), 600);
    } else {
      setErrors({ form: result.error });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!/^S+@S+.S+$/.test(form.email)) {
      setErrors({ email: 'Enter your email above, then click "Forgot password?"' });
      return;
    }
    const result = await resetPassword(form.email);
    if (result.ok) notify('If that email has an account, a reset link is on its way.', 'success', 5000);
    else setErrors({ form: result.error });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream-100 dark:bg-ink-900">
      {/* Illustration side */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-8 p-12 bg-gradient-to-br from-brand-50 via-cream-100 to-brand-100 dark:from-ink-800 dark:via-ink-900 dark:to-ink-800 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-200/40 dark:bg-brand-900/20 blur-3xl" />
        <div className="relative z-10 w-full">
          <AnimatedSandwich focus={focusField} success={success} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 text-center max-w-sm"
        >
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white mb-2">Welcome back to SmartCart</h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60">Every layer, freshly stacked and ready for you.</p>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-16">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-ink-800 p-8 rounded-2xl shadow-lift w-full max-w-md border border-ink-800/5 dark:border-white/10"
          noValidate
        >
          <div className="text-center mb-8 lg:hidden">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white text-2xl mb-3">
              <FaShoppingBasket size={18} />
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white text-center">Login to SmartCart</h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1 text-center mb-8">Welcome back! Please enter your details.</p>

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
            placeholder="you@example.com"
            value={form.email}
            error={errors.email}
            onFocus={() => setFocusField('email')}
            onBlur={() => setFocusField(null)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            containerClassName="mb-4"
          />

          <div className="mb-2 relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<FaLock size={13} />}
              placeholder="••••••"
              value={form.password}
              error={errors.password}
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField(null)}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-[42px] text-ink-800/40 dark:text-white/40 hover:text-brand-500 transition"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <label className="flex items-center gap-2 text-sm text-ink-800/70 dark:text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-500"
              />
              Remember me
            </label>
            <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-brand-600 dark:text-brand-300 hover:underline">
              Forgot password?
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-4" size="lg">
            Login
          </Button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="mt-5 w-full text-sm text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 font-medium transition"
          >
            Create new Account
          </button>

          <Link
            to="/"
            className="block mt-2 w-full text-center text-sm text-ink-800/50 dark:text-white/50 hover:text-ink-800/80 dark:hover:text-white/80 transition"
          >
            ← Back to Home
          </Link>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;

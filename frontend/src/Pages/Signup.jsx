import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaShoppingBasket } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AnimatedBasket from '../Components/AnimatedBasket';

const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
};
const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'];

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(form.password);
  const filledCount = [form.name.trim(), form.email.trim(), form.password].filter(Boolean).length;

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await signup(form);
    setLoading(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setSuccess(true);
    if (result.needsConfirmation) {
      notify('Account created! Check your email to confirm it, then log in.', 'success', 6000);
      setTimeout(() => navigate('/login'), 900);
    } else {
      notify('Account created! Welcome to SmartCart.', 'success');
      setTimeout(() => navigate('/account'), 600);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream-100 dark:bg-ink-900">
      {/* Illustration side */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-8 p-12 bg-gradient-to-br from-brand-50 via-cream-100 to-brand-100 dark:from-ink-800 dark:via-ink-900 dark:to-ink-800 relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-200/40 dark:bg-brand-900/20 blur-3xl" />
        <div className="relative z-10 w-full">
          <AnimatedBasket filledCount={filledCount} success={success} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-center max-w-sm"
        >
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white mb-2">Fill your basket</h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60">Complete your details and watch it come together.</p>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-16">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-ink-800 p-8 rounded-2xl shadow-lift w-full max-w-sm border border-ink-800/5 dark:border-white/10"
          noValidate
        >
          <div className="text-center mb-8 lg:hidden">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white text-2xl mb-3">
              <FaShoppingBasket size={18} />
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-white text-center">Join the Sandwich Club</h2>
          <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1 text-center mb-8">Create an account to get started.</p>

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
            label="Full Name"
            icon={<FaUser size={13} />}
            placeholder="John Doe"
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            containerClassName="mb-4"
          />

          <Input
            label="Email"
            type="email"
            icon={<FaEnvelope size={13} />}
            placeholder="you@example.com"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            containerClassName="mb-4"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<FaLock size={13} />}
              placeholder="••••••••"
              value={form.password}
              error={errors.password}
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

          {form.password && (
            <div className="mt-2.5">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength] : 'bg-ink-800/10 dark:bg-white/10'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-800/50 dark:text-white/50 mt-1">{STRENGTH_LABELS[strength]}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-6" size="lg">
            Sign Up
          </Button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 w-full text-sm text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 font-medium transition"
          >
            Already have an account?
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

export default Signup;

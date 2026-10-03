import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changePassword, sendPasswordOtp, verifyCurrentPassword } from '../services/password';
import Button from '../ui/Button';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%)', test: (p) => /[!@#$%]/.test(p) },
];

const isStrong = (p) => REQUIREMENTS.every((r) => r.test(p));

const strengthOf = (p) => {
  const met = REQUIREMENTS.filter((r) => r.test(p)).length;
  if (!p) return null;
  if (met <= 2) return { label: 'Weak', segments: 1, color: 'bg-red-500', text: 'text-red-500' };
  if (met <= 4) return { label: 'Medium', segments: 2, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Strong', segments: 3, color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' };
};

const maskEmail = (email = '') => {
  const [name = '', domain = ''] = email.split('@');
  if (!domain) return '';
  return `${name.slice(0, 2)}***@${domain}`;
};

const FIELD =
  'w-full pl-11 pr-11 py-2.5 rounded-xl border bg-cream-50 dark:bg-white/5 dark:text-white placeholder:text-ink-800/35 dark:placeholder:text-white/35 transition focus:outline-none focus:ring-2';

const PasswordField = ({ id, label, value, onChange, error, autoComplete = 'new-password' }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <FaLock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-800/40 dark:text-white/40 pointer-events-none" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${FIELD} ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/40'
              : 'border-ink-800/10 dark:border-white/15 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-800/50 dark:text-white/50 hover:text-brand-600 dark:hover:text-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          {visible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

const NewPasswordFields = ({ password, confirm, onPassword, onConfirm, errors }) => {
  const strength = strengthOf(password);
  return (
    <div className="space-y-4">
      <div>
        <PasswordField id="new-password" label="New password" value={password} onChange={onPassword} error={errors.password} />
        {strength && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= strength.segments ? strength.color : 'bg-ink-800/10 dark:bg-white/10'}`} />
              ))}
            </div>
            <span className={`text-xs font-semibold ${strength.text}`}>{strength.label}</span>
          </div>
        )}
        <ul className="mt-3 rounded-xl bg-cream-50 dark:bg-white/5 border border-ink-800/5 dark:border-white/10 p-4 space-y-2">
          <li className="text-xs font-semibold text-ink-800/70 dark:text-white/70 mb-1">Password must contain:</li>
          {REQUIREMENTS.map((r) => {
            const ok = password && r.test(password);
            return (
              <li key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-green-600 dark:text-green-400' : 'text-ink-800/50 dark:text-white/50'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? 'bg-green-500 text-white' : 'bg-ink-800/10 dark:bg-white/10'}`}>
                  {ok && <FaCheck size={8} />}
                </span>
                {r.label}
              </li>
            );
          })}
        </ul>
      </div>
      <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={onConfirm} error={errors.confirm} />
    </div>
  );
};

const OtpInputs = ({ values, onChange, disabled }) => {
  const refs = useRef([]);

  const setDigit = (index, digit) => {
    const next = [...values];
    next[index] = digit;
    onChange(next);
  };

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || '');
    onChange(next);
    refs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3" role="group" aria-label="6-digit verification code">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={v}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white transition focus:outline-none focus:ring-2 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900 disabled:opacity-50"
        />
      ))}
    </div>
  );
};

const MethodCard = ({ selected, icon: Icon, title, description, onSelect }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`group w-full text-left flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
      selected
        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-900/20 shadow-soft'
        : 'border-ink-800/10 dark:border-white/10 bg-white dark:bg-ink-800 hover:border-brand-300'
    }`}
  >
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${selected ? 'bg-brand-500 text-white' : 'bg-ink-800/5 dark:bg-white/10 text-ink-800/60 dark:text-white/60'}`}>
      <Icon size={15} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-sm text-ink-900 dark:text-white">{title}</span>
      <span className="block text-xs text-ink-800/60 dark:text-white/60 mt-0.5">{description}</span>
    </span>
    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-brand-500' : 'border-ink-800/20 dark:border-white/25'}`}>
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
    </span>
  </button>
);

const CurrentPasswordPanel = ({ email, onUseOtp, onDone }) => {
  const { notify } = useToast();
  const [form, setForm] = useState({ current: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.current) next.current = 'Enter your current password.';
    if (!form.password) next.password = 'Enter a new password.';
    else if (!isStrong(form.password)) next.password = 'Your new password does not meet all the requirements below.';
    else if (form.password === form.current) next.password = 'New password must be different from your current password.';
    if (!form.confirm) next.confirm = 'Confirm your new password.';
    else if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const check = await verifyCurrentPassword(email, form.current);
    if (!check.ok) {
      setLoading(false);
      return setErrors({ current: 'Your current password is incorrect.' });
    }
    const result = await changePassword({ password: form.password });
    setLoading(false);
    if (!result.ok) return setErrors({ form: result.error });
    setForm({ current: '', password: '', confirm: '' });
    notify('Password updated successfully.', 'success');
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errors.form && <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5">{errors.form}</p>}
      <div>
        <PasswordField id="current-password" label="Current password" value={form.current} onChange={update('current')} error={errors.current} autoComplete="current-password" />
        <p className="mt-2 text-xs text-ink-800/60 dark:text-white/60">
          Forgot current password?{' '}
          <button type="button" onClick={onUseOtp} className="font-semibold text-brand-600 dark:text-brand-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded">
            Use OTP instead
          </button>
        </p>
      </div>
      <NewPasswordFields password={form.password} confirm={form.confirm} onPassword={update('password')} onConfirm={update('confirm')} errors={errors} />
      <Button type="submit" loading={loading} className="w-full" size="md">Update password</Button>
    </form>
  );
};

const OtpPanel = ({ email, onDone }) => {
  const { notify } = useToast();
  const [stage, setStage] = useState('idle');
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(0);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const otpCode = otp.join('');
  const otpComplete = otpCode.length === OTP_LENGTH;

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const sendCode = async (isResend) => {
    setSending(true);
    const result = await sendPasswordOtp();
    setSending(false);
    if (!result.ok) return setErrors({ form: 'We could not send the OTP. Please try again.' });
    setStage('sent');
    setOtp(Array(OTP_LENGTH).fill(''));
    setCountdown(RESEND_SECONDS);
    setErrors({});
    notify(isResend ? 'OTP resent successfully.' : 'OTP sent successfully.', 'success');
  };

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!otpComplete) next.form = 'Enter the 6-digit code.';
    if (!form.password) next.password = 'Enter a new password.';
    else if (!isStrong(form.password)) next.password = 'Your new password does not meet all the requirements below.';
    if (!form.confirm) next.confirm = 'Confirm your new password.';
    else if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await changePassword({ password: form.password, otp: otpCode });
    setLoading(false);
    if (!result.ok) {
      return setErrors(result.otpRejected
        ? { form: 'Invalid OTP. Please check the code and try again.' }
        : { form: result.error });
    }
    setForm({ password: '', confirm: '' });
    setOtp(Array(OTP_LENGTH).fill(''));
    setStage('idle');
    notify('Password updated successfully.', 'success');
    onDone();
  };

  if (stage === 'idle') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-ink-800/10 dark:border-white/10 bg-cream-50 dark:bg-white/5 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-500">
            <FaEnvelope size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-800/60 dark:text-white/60">Send OTP to</p>
            <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{maskEmail(email)}</p>
          </div>
        </div>
        {errors.form && <p role="alert" className="text-sm font-medium text-red-500">{errors.form}</p>}
        <Button onClick={() => sendCode(false)} loading={sending} className="w-full" size="md">
          {sending ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink-800/80 dark:text-white/80">Enter OTP</p>
        <p className="text-xs text-ink-800/60 dark:text-white/60 mt-0.5 mb-3">Enter the 6-digit code sent to your email.</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OtpInputs values={otp} onChange={(next) => { setOtp(next); setErrors((p) => ({ ...p, form: undefined })); }} disabled={loading} />
          <p className="text-xs text-ink-800/60 dark:text-white/60">
            {countdown > 0 ? (
              <>Resend OTP in <span className="font-semibold text-brand-600 dark:text-brand-300 tabular-nums">00:{String(countdown).padStart(2, '0')}</span></>
            ) : (
              <button type="button" onClick={() => sendCode(true)} disabled={sending} className="font-semibold text-brand-600 dark:text-brand-300 hover:underline disabled:opacity-50">
                {sending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </p>
        </div>
      </div>

      {errors.form && <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5">{errors.form}</p>}

      {otpComplete ? (
        <div className="space-y-5 animate-fade-up">
          <NewPasswordFields password={form.password} confirm={form.confirm} onPassword={update('password')} onConfirm={update('confirm')} errors={errors} />
          <Button type="submit" loading={loading} className="w-full" size="md">Update password</Button>
        </div>
      ) : (
        <p className="text-xs text-ink-800/50 dark:text-white/50">Enter all 6 digits to set a new password.</p>
      )}
    </form>
  );
};

const ChangePasswordForm = () => {
  const { user } = useAuth();
  const [method, setMethod] = useState('password');
  const [panelKey, setPanelKey] = useState(0);
  const email = user?.email || '';

  const select = (next) => {
    setMethod(next);
    setPanelKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500">
          <FaShieldAlt size={15} />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Change password</h3>
          <p className="text-sm text-ink-800/60 dark:text-white/60 mt-0.5">Choose a secure method to update your account password.</p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Password change method" className="grid gap-3 md:grid-cols-2">
        <MethodCard
          selected={method === 'otp'}
          icon={FaEnvelope}
          title="Reset with OTP"
          description="Get a verification code on your registered email."
          onSelect={() => select('otp')}
        />
        <MethodCard
          selected={method === 'password'}
          icon={FaLock}
          title="Change using current password"
          description="Update your password using your existing password."
          onSelect={() => select('password')}
        />
      </div>

      <div key={panelKey} className="animate-fade-up rounded-2xl border border-ink-800/10 dark:border-white/10 bg-white dark:bg-ink-800 p-5 md:p-6">
        {!email ? (
          <p className="text-sm text-red-500">We could not find an email for this account, so passwords can't be changed here.</p>
        ) : method === 'otp' ? (
          <OtpPanel email={email} onDone={() => setPanelKey((k) => k + 1)} />
        ) : (
          <CurrentPasswordPanel email={email} onUseOtp={() => select('otp')} onDone={() => setPanelKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
};

export default ChangePasswordForm;

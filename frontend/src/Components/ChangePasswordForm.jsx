import React, { useState } from 'react';
import { FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

const EMPTY = { password: '', confirm: '' };

const ChangePasswordForm = () => {
  const { updatePassword } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
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
    setForm(EMPTY);
    notify('Password updated.', 'success');
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-md">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5">
          {error}
        </p>
      )}
      <Input
        label="New password"
        type="password"
        icon={<FaLock size={13} />}
        value={form.password}
        onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
      />
      <Input
        label="Confirm new password"
        type="password"
        icon={<FaLock size={13} />}
        value={form.confirm}
        onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
      />
      <Button type="submit" loading={loading} size="sm">Update password</Button>
    </form>
  );
};

export default ChangePasswordForm;

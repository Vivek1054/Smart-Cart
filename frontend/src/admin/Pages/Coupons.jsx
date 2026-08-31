import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTicketAlt } from 'react-icons/fa';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from '../../data/coupons';

const EMPTY_FORM = {
  code: '',
  type: 'percentage',
  value: '',
  minOrder: '',
  maxDiscount: '',
  expiry: '',
  usageLimit: '',
  status: 'Active',
};

const Coupons = () => {
  const [coupons, setCoupons] = useState(getCoupons);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toDelete, setToDelete] = useState(null);

  const refresh = () => setCoupons(getCoupons());

  const openAddModal = () => {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxDiscount: coupon.maxDiscount,
      expiry: coupon.expiry,
      usageLimit: coupon.usageLimit,
      status: coupon.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      maxDiscount: Number(form.maxDiscount),
      expiry: form.expiry,
      usageLimit: Number(form.usageLimit),
      status: form.status,
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }
    refresh();
    closeModal();
  };

  const handleDelete = () => {
    deleteCoupon(toDelete.id);
    refresh();
  };

  const columns = [
    {
      key: 'code', label: 'Code',
      render: (c) => <span className="font-mono font-semibold text-ink-900 dark:text-white">{c.code}</span>,
    },
    {
      key: 'discount', label: 'Discount',
      render: (c) => (c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`),
    },
    { key: 'minOrder', label: 'Min Order', render: (c) => `₹${c.minOrder}` },
    { key: 'maxDiscount', label: 'Max Discount', render: (c) => `₹${c.maxDiscount}` },
    {
      key: 'usage', label: 'Usage',
      render: (c) => (
        <div>
          <p className="text-xs font-medium text-ink-800/70 dark:text-white/70 mb-1">{c.usedCount} / {c.usageLimit}</p>
          <div className="h-1.5 w-16 rounded-full bg-ink-800/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'expiry', label: 'Expiry',
      render: (c) => new Date(c.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'status', label: 'Status',
      render: (c) => {
        const isExpired = new Date(c.expiry) < new Date();
        return <StatusBadge status={isExpired ? 'Expired' : c.status} />;
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(c)} className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 transition" aria-label="Edit">
            <FaEdit size={13} />
          </button>
          <button onClick={() => setToDelete(c)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition" aria-label="Delete">
            <FaTrash size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-800/60 dark:text-white/60">{coupons.length} coupons configured</p>
        <Button onClick={openAddModal}>
          <FaPlus size={12} /> Add Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        searchKeys={['code']}
        pageSize={8}
        emptyMessage="No coupons found"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Coupon Code"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="e.g. WELCOME10"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white transition focus:outline-none focus:ring-2 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <Input
              label={form.type === 'percentage' ? 'Value (%)' : 'Value (₹)'}
              type="number"
              min="0"
              value={form.value}
              onChange={(e) => updateField('value', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Order (₹)"
              type="number"
              min="0"
              value={form.minOrder}
              onChange={(e) => updateField('minOrder', e.target.value)}
              required
            />
            <Input
              label="Max Discount (₹)"
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={(e) => updateField('maxDiscount', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="date"
              value={form.expiry}
              onChange={(e) => updateField('expiry', e.target.value)}
              required
            />
            <Input
              label="Usage Limit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => updateField('usageLimit', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white transition focus:outline-none focus:ring-2 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900"
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
            <Button type="submit" className="flex-1">
              <FaTicketAlt size={12} /> {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this coupon?"
        description={toDelete ? `"${toDelete.code}" will be permanently removed.` : ''}
      />
    </div>
  );
};

export default Coupons;

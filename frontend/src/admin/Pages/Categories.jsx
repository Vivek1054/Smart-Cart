import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaInfoCircle } from 'react-icons/fa';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { getCategoriesWithMeta, updateCategoryMeta } from '../../data/categories';

const Categories = () => {
  const { notify } = useToast();
  const [categories, setCategories] = useState(getCategoriesWithMeta);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ icon: '', description: '', status: 'Active' });
  const [saving, setSaving] = useState(false);

  const refresh = () => setCategories(getCategoriesWithMeta());

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ icon: cat.icon, description: cat.description, status: cat.status });
  };

  const closeEdit = () => setEditing(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    updateCategoryMeta(editing.name, {
      icon: form.icon.trim() || editing.icon,
      description: form.description.trim() || editing.description,
      status: form.status,
    });
    refresh();
    setSaving(false);
    notify('Category updated successfully', 'success');
    closeEdit();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-800/60 dark:text-white/60">{categories.length} categories from your product catalog</p>

      <div className="rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 px-4 py-3.5 flex items-start gap-2.5">
        <FaInfoCircle className="text-brand-500 mt-0.5 shrink-0" size={14} />
        <p className="text-sm text-brand-700 dark:text-brand-300">
          Categories are derived from your product catalog — add products in a new category to create one. Editing here only updates the display icon, description, and status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift transition-shadow p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl leading-none">{cat.icon}</span>
              <StatusBadge status={cat.status} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white capitalize mb-1">{cat.name}</h3>
            <p className="text-sm text-ink-800/60 dark:text-white/60 flex-1 mb-4">{cat.description}</p>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-ink-800/5 dark:bg-white/10 text-ink-800/70 dark:text-white/70 whitespace-nowrap">
                {cat.productCount} product{cat.productCount === 1 ? '' : 's'}
              </span>
              <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                <FaEdit size={12} /> Edit
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={!!editing} onClose={closeEdit} title={editing ? `Edit "${editing.name}"` : ''} className="max-w-md">
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Icon (emoji)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              maxLength={4}
              placeholder="🥪"
            />

            <div>
              <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white placeholder:text-ink-800/35 dark:placeholder:text-white/35 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" loading={saving} className="flex-1">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Categories;

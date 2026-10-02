import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaPlus, FaArrowUp, FaArrowDown, FaTrash } from 'react-icons/fa';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useCatalogVersion } from '../../context/CatalogContext';
import { friendlyError } from '../../lib/errors';
import { getCategoriesWithMeta, addCategory, updateCategory, deleteCategory, moveCategory } from '../../data/categories';

const EMPTY_FORM = { name: '', icon: '', description: '', status: 'Active' };

const Categories = () => {
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => getCategoriesWithMeta(), [catalogVersion]);
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isNew = editing === 'new';

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY_FORM);
    setError('');
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, description: cat.description, status: cat.status });
    setError('');
  };

  const closeEdit = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    if (!form.name.trim()) return setError('Category name is required.');
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await addCategory(form);
      } else {
        await updateCategory(editing.id, {
          name: form.name,
          icon: form.icon.trim() || editing.icon,
          description: form.description.trim(),
          status: form.status,
        });
      }
      notify(isNew ? 'Category created' : 'Category updated successfully', 'success');
      closeEdit();
    } catch (err) {
      setError(err.message || friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (cat, direction) => {
    try {
      await moveCategory(cat.id, direction);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(toDelete.id);
      notify('Category deleted', 'success');
    } catch (err) {
      notify(err.message.includes('in use') ? 'This category still has products. Move or delete them first.' : err.message, 'error', 4500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-800/60 dark:text-white/60">{categories.length} categories</p>
        <Button onClick={openNew}><FaPlus size={12} /> Add Category</Button>
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleMove(cat, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 disabled:opacity-30 transition"
                >
                  <FaArrowUp size={11} />
                </button>
                <button
                  onClick={() => handleMove(cat, 1)}
                  disabled={i === categories.length - 1}
                  aria-label="Move down"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-800/50 dark:text-white/50 hover:bg-ink-800/5 dark:hover:bg-white/10 disabled:opacity-30 transition"
                >
                  <FaArrowDown size={11} />
                </button>
                <button
                  onClick={() => setToDelete(cat)}
                  aria-label="Delete category"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <FaTrash size={12} />
                </button>
                <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                  <FaEdit size={12} /> Edit
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={!!editing} onClose={closeEdit} title={isNew ? 'Add Category' : editing ? `Edit "${editing.name}"` : ''} className="max-w-md">
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. weekend specials"
            />
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
              <p className="text-xs text-ink-800/50 dark:text-white/50 mt-1.5">Inactive categories (and their products) are hidden from the storefront.</p>
            </div>

            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" loading={saving} className="flex-1">{isNew ? 'Create' : 'Save Changes'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this category?"
        description={toDelete ? `"${toDelete.name}" will be removed. Categories that still have products can't be deleted.` : ''}
      />
    </div>
  );
};

export default Categories;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImage } from 'react-icons/fa';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { getCategoriesWithMeta } from '../../data/categories';
import { useCatalogVersion } from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';

const ProductForm = ({ initial, onSubmit, submitLabel = 'Save Product' }) => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = React.useMemo(() => getCategoriesWithMeta().map((c) => c.name), [catalogVersion]);

  const [form, setForm] = useState({
    name: initial?.name || '',
    title: initial?.title || '',
    category: initial?.category || categories[0] || '',
    price: initial?.price ?? '',
    stockCount: initial?.stockCount ?? '',
    image: initial?.image || '',
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.title.trim()) e.title = 'Short description is required';
    if (!form.category) e.category = 'Select a category';
    if (!form.price || form.price <= 0) e.price = 'Enter a valid price';
    if (form.stockCount === '' || form.stockCount < 0) e.stockCount = 'Enter a valid stock quantity';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        title: form.title.trim(),
        category: form.category,
        price: Number(form.price),
        stockCount: Math.floor(Number(form.stockCount)),
        image: form.image.trim() || undefined,
        isActive: form.isActive,
      });
      notify('Product saved successfully', 'success');
      navigate('/admin/products');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6">
        <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-2">Product Details</h3>
        <Input label="Product Name" value={form.name} error={errors.name} onChange={set('name')} placeholder="e.g. Spicy Paneer Melt" />
        <Input label="Short Description" value={form.title} error={errors.title} onChange={set('title')} placeholder="One line describing the product" />

        <div>
          <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition capitalize"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (₹)" type="number" min="0" value={form.price} error={errors.price} onChange={set('price')} />
          <Input label="Stock Quantity" type="number" min="0" value={form.stockCount} error={errors.stockCount} onChange={set('stockCount')} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-500"
          />
          <span className="text-sm font-medium text-ink-800/80 dark:text-white/80">Active (visible in the store)</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Image</h3>
          <div className="aspect-square rounded-xl bg-cream-50 dark:bg-white/5 border border-dashed border-ink-800/15 dark:border-white/20 flex items-center justify-center overflow-hidden mb-3">
            {form.image ? (
              <img src={form.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <FaImage className="text-ink-800/20 dark:text-white/20" size={32} />
            )}
          </div>
          <Input label="Image URL" value={form.image} onChange={set('image')} placeholder="https://..." />
          <p className="text-xs text-ink-800/40 dark:text-white/40 mt-2">
            Paste a link to the product image.
          </p>
        </div>

        {errors.form && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{errors.form}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button type="submit" loading={saving} className="flex-1">{submitLabel}</Button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;

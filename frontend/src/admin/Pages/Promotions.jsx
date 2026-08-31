import React, { useState } from 'react';
import { FaInfoCircle, FaSave } from 'react-icons/fa';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { getPromoBanner, savePromoBanner } from '../../data/promotions';
import { useToast } from '../../context/ToastContext';

const Promotions = () => {
  const { notify } = useToast();
  const [form, setForm] = useState(getPromoBanner);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    savePromoBanner(form);
    notify('Banner updated', 'success');
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-2 text-sm text-ink-800/60 dark:text-white/60">
          <FaInfoCircle className="text-brand-500 shrink-0" size={13} />
          This content appears live on the customer homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Homepage Banner</h3>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Craving something new? Explore the full menu."
            required
          />

          <div>
            <label className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              placeholder="From budget bites to premium picks, there's a sandwich for every mood."
              className="w-full px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 dark:text-white placeholder:text-ink-800/35 dark:placeholder:text-white/35 transition focus:outline-none focus:ring-2 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CTA Button Text"
              value={form.ctaText}
              onChange={(e) => updateField('ctaText', e.target.value)}
              placeholder="Explore Menu"
              required
            />
            <Input
              label="CTA Link"
              value={form.ctaLink}
              onChange={(e) => updateField('ctaLink', e.target.value)}
              placeholder="/menu"
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-cream-50 dark:bg-white/5 px-4 py-3">
            <span className="text-sm font-semibold text-ink-900 dark:text-white">
              {form.active ? 'Active' : 'Inactive'}
            </span>
            <button
              type="button"
              onClick={() => updateField('active', !form.active)}
              aria-label="Toggle banner active"
              className={`relative h-6 w-11 rounded-full transition-colors ${form.active ? 'bg-brand-500' : 'bg-ink-800/15 dark:bg-white/15'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <Button type="submit" className="w-full">
            <FaSave size={12} /> Save Changes
          </Button>
        </form>

        <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Live Preview</h3>
          {form.active ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-700 px-6 py-10 text-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" aria-hidden="true" />
              <div className="relative z-10 max-w-md mx-auto">
                <h2 className="font-display text-xl md:text-2xl font-semibold text-white mb-3">
                  {form.title || 'Banner title'}
                </h2>
                <p className="text-white/70 text-sm mb-6">
                  {form.description || 'Banner description goes here.'}
                </p>
                <span className="inline-flex items-center justify-center rounded-full bg-white text-ink-900 font-semibold px-6 py-2.5 text-sm">
                  {form.ctaText || 'Button'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-800/15 dark:border-white/15 px-6 py-10 text-center">
              <p className="text-sm text-ink-800/50 dark:text-white/50">Banner is inactive and won't be shown on the homepage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promotions;

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaTimes, FaStar } from 'react-icons/fa';
import ProductCard from '../Components/ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import { getAllProducts, getCategories } from '../data/products';
import { useCatalogVersion } from '../context/CatalogContext';

const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹40', min: 0, max: 40 },
  { label: '₹40 - ₹60', min: 40, max: 60 },
  { label: 'Above ₹60', min: 60, max: Infinity },
];

const RATING_PRESETS = [4.5, 4, 3.5];

const FilterPanel = ({ categories, selectedCategory, setSelectedCategory, priceIdx, setPriceIdx, minRating, setMinRating, onlyDeals, setOnlyDeals, onClear }) => (
  <div className="space-y-8">
    <div>
      <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-3">Category</h3>
      <div className="flex flex-col gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-left px-3 py-2 rounded-xl text-sm font-medium capitalize transition ${
              selectedCategory === cat
                ? 'bg-brand-500 text-white'
                : 'text-ink-800/70 dark:text-white/70 hover:bg-cream-100 dark:hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-3">Price</h3>
      <div className="flex flex-col gap-1.5">
        {PRICE_PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPriceIdx(i)}
            className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
              priceIdx === i
                ? 'bg-brand-500 text-white'
                : 'text-ink-800/70 dark:text-white/70 hover:bg-cream-100 dark:hover:bg-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-3">Rating</h3>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => setMinRating(0)}
          className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition ${minRating === 0 ? 'bg-brand-500 text-white' : 'text-ink-800/70 dark:text-white/70 hover:bg-cream-100 dark:hover:bg-white/5'}`}
        >
          Any Rating
        </button>
        {RATING_PRESETS.map((r) => (
          <button
            key={r}
            onClick={() => setMinRating(r)}
            className={`flex items-center gap-1.5 text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
              minRating === r ? 'bg-brand-500 text-white' : 'text-ink-800/70 dark:text-white/70 hover:bg-cream-100 dark:hover:bg-white/5'
            }`}
          >
            <FaStar className={minRating === r ? 'text-white' : 'text-amber-400'} size={11} /> {r}+ &amp; up
          </button>
        ))}
      </div>
    </div>

    <label className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={onlyDeals}
        onChange={(e) => setOnlyDeals(e.target.checked)}
        className="h-4 w-4 rounded accent-brand-500"
      />
      <span className="text-sm font-medium text-ink-800/80 dark:text-white/80">Deals only</span>
    </label>

    <button onClick={onClear} className="text-sm font-semibold text-brand-600 dark:text-brand-300 hover:underline">
      Clear all filters
    </button>
  </div>
);

const Menu = () => {
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allProducts = useMemo(() => getAllProducts(), [catalogVersion]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState('default');
  const [priceIdx, setPriceIdx] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [onlyDeals, setOnlyDeals] = useState(searchParams.get('deal') === '1');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = ['All', ...getCategories().filter((c) => c !== 'All')];

  // Re-sync local filter state whenever navbar links change the URL (category/deal/search)
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setOnlyDeals(searchParams.get('deal') === '1');
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Simulate a brief loading state so filter changes show skeletons instead of an instant jump
  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(id);
  }, [selectedCategory, sortBy, priceIdx, minRating, onlyDeals, query]);

  const filtered = useMemo(() => {
    const range = PRICE_PRESETS[priceIdx];
    let list = allProducts.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (p.price < range.min || p.price > range.max) return false;
      if (p.rating < minRating) return false;
      if (onlyDeals && !p.isFlashDeal) return false;
      if (query && !`${p.name} ${p.title}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });

    switch (sortBy) {
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'rating-desc': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'name-asc': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [allProducts, selectedCategory, sortBy, priceIdx, minRating, onlyDeals, query]);

  const activeFilterCount = [
    selectedCategory !== 'All',
    priceIdx !== 0,
    minRating !== 0,
    onlyDeals,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('All');
    setPriceIdx(0);
    setMinRating(0);
    setOnlyDeals(false);
    setSearchParams({});
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(searchParams);
    if (query) params.q = query; else delete params.q;
    setSearchParams(params);
  };

  return (
    <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 dark:bg-ink-900 dark:text-white min-h-screen'>
      <div className='pt-28 md:pt-32 pb-8 text-center'>
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">Our Menu</span>
        <h1 className='font-display text-3xl md:text-4xl font-semibold mt-2 text-ink-900 dark:text-white'>
          Find your next{' '}
          <span className='text-brand-500'>favorite bite</span>
        </h1>
        <form onSubmit={submitSearch} className="mt-6 max-w-lg mx-auto flex items-center gap-2 rounded-full border border-ink-800/10 dark:border-white/15 bg-white dark:bg-ink-800 px-5 py-3 shadow-soft">
          <FaSearch className="text-ink-800/40 dark:text-white/40 shrink-0" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for sandwiches, categories..."
            className="w-full bg-transparent outline-none text-sm"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); const p = Object.fromEntries(searchParams); delete p.q; setSearchParams(p); }} aria-label="Clear search">
              <FaTimes className="text-ink-800/40 dark:text-white/40" size={13} />
            </button>
          )}
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 pb-16">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6">
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceIdx={priceIdx}
              setPriceIdx={setPriceIdx}
              minRating={minRating}
              setMinRating={setMinRating}
              onlyDeals={onlyDeals}
              setOnlyDeals={setOnlyDeals}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <p className="text-sm text-ink-800/60 dark:text-white/60">
              {loading ? 'Searching…' : <><span className="font-semibold text-ink-900 dark:text-white">{filtered.length}</span> products found</>}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden relative flex items-center gap-2 px-4 py-2 rounded-full border border-ink-800/10 dark:border-white/15 text-sm font-semibold text-ink-900 dark:text-white"
              >
                <FaFilter size={12} /> Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">{activeFilterCount}</span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-ink-800/10 dark:border-white/15 bg-white dark:bg-ink-800 px-4 py-2 text-sm font-semibold text-ink-900 dark:text-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategory !== 'All' && (
                <FilterChip label={selectedCategory} onRemove={() => setSelectedCategory('All')} />
              )}
              {priceIdx !== 0 && (
                <FilterChip label={PRICE_PRESETS[priceIdx].label} onRemove={() => setPriceIdx(0)} />
              )}
              {minRating !== 0 && (
                <FilterChip label={`${minRating}+ stars`} onRemove={() => setMinRating(0)} />
              )}
              {onlyDeals && <FilterChip label="Deals only" onRemove={() => setOnlyDeals(false)} />}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
              {filtered.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl bg-cream-100 dark:bg-ink-800">
              <p className="text-4xl mb-3">🥪</p>
              <p className="font-display text-xl font-semibold text-ink-900 dark:text-white">No items found</p>
              <p className="text-ink-800/60 dark:text-white/60 mt-1 mb-5">Try adjusting your filters or search term.</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="bottom" title="Filters">
        <div className="p-6">
          <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            priceIdx={priceIdx}
            setPriceIdx={setPriceIdx}
            minRating={minRating}
            setMinRating={setMinRating}
            onlyDeals={onlyDeals}
            setOnlyDeals={setOnlyDeals}
            onClear={clearFilters}
          />
          <Button className="w-full mt-6" onClick={() => setDrawerOpen(false)}>
            Show {filtered.length} Results
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 text-xs font-semibold px-3 py-1.5 capitalize">
    {label}
    <button onClick={onRemove} aria-label={`Remove ${label} filter`}>
      <FaTimes size={10} />
    </button>
  </span>
);

export default Menu;

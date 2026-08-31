import React from 'react'
import { Link } from 'react-router-dom'
import { FaBolt, FaLeaf, FaShieldAlt, FaTruck } from 'react-icons/fa'
import Banner from '../Components/Banner'
import ProductCarousel from '../Components/ProductCarousel'
import CategoryCard from '../Components/CategoryCard'
import CountdownTimer from '../Components/CountdownTimer'
import ScrollReveal from '../ui/ScrollReveal'
import Button from '../ui/Button'
import { getBestSellers, getTrending, getFlashDeals, getCategories, getAllProducts } from '../data/products'
import { getPromoBanner } from '../data/promotions'

const WHY_SMARTCART = [
  { icon: FaLeaf, title: 'Fresh Ingredients', desc: 'Sourced locally and prepped same-day, never frozen.' },
  { icon: FaTruck, title: 'Fast Delivery', desc: 'Hot and fresh, typically ready within 15 minutes.' },
  { icon: FaShieldAlt, title: 'Quality Assured', desc: 'Every order checked before it leaves the kitchen.' },
  { icon: FaBolt, title: 'Easy Ordering', desc: 'Browse, customize and checkout in just a few taps.' },
];

const Home = () => {
  const products = getAllProducts();
  const categories = getCategories().filter((c) => c !== 'All');
  const bestSellers = getBestSellers();
  const trending = getTrending();
  const flashDeals = getFlashDeals();
  const promoBanner = getPromoBanner();

  return (
    <div className='dark:bg-ink-900 dark:text-white min-h-screen'>
      <Banner />

      {/* Featured Categories */}
      <section className="max-w-screen-2xl container mx-auto md:px-20 px-4 py-12">
        <ScrollReveal>
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">Browse</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mt-1 mb-8">
            Shop by Category
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat}
                category={cat}
                count={products.filter((p) => p.category === cat).length}
              />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="bg-cream-100 dark:bg-white/[0.03] py-4">
          <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 pt-8">
            <ScrollReveal>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">Limited Time</span>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mt-1">
                    ⚡ Flash Deals
                  </h2>
                </div>
                <CountdownTimer />
              </div>
            </ScrollReveal>
          </div>
          <ProductCarousel products={flashDeals} viewAllLink="/menu?deal=1" title="" />
        </section>
      )}

      <ProductCarousel eyebrow="Crowd Favorites" title="Best Sellers" products={bestSellers} viewAllLink="/menu" />
      <ProductCarousel eyebrow="Right Now" title="Trending This Week" products={trending} viewAllLink="/menu" />

      {/* Promo banner (content managed via Admin > Promotions) */}
      {promoBanner.active && (
        <section className="max-w-screen-2xl container mx-auto md:px-20 px-4 py-12">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-700 px-8 py-14 md:px-16 md:py-20 text-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" aria-hidden="true" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
                  {promoBanner.title}
                </h2>
                <p className="text-white/70 mb-8">
                  {promoBanner.description}
                </p>
                <Link to={promoBanner.ctaLink}>
                  <Button size="lg" className="bg-white text-ink-900 hover:bg-cream-100">
                    {promoBanner.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* Why SmartCart */}
      <section className="max-w-screen-2xl container mx-auto md:px-20 px-4 py-12">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">Why SmartCart</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mt-1">
              Built for a Better Order
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_SMARTCART.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1 p-6 text-center h-full">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-500 mb-4">
                  <f.icon size={18} />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-800/60 dark:text-white/60">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

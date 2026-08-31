import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'

import Sandwich from "../assets/sandwich.png"

const STATS = [
  { value: '10+', label: 'Signature recipes' },
  { value: '4.6', label: 'Average rating' },
  { value: '15 min', label: 'Avg. prep time' },
];

const Banner = () => {
    const navigate = useNavigate();
    return (
        <div className="relative overflow-hidden">
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/50 dark:bg-brand-900/20 blur-3xl" aria-hidden="true" />
            <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 flex flex-col md:flex-row items-center my-10 pt-28 md:pt-36 gap-10 relative">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className='order-2 w-full md:order-1 md:w-1/2'
                >
                    <div className='space-y-6'>
                        <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 dark:bg-brand-900/40 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                            🥪 Freshly made, every single day
                        </span>

                        <h1 className='font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] text-ink-900 dark:text-white'>
                            Sandwiches worth{' '}
                            <span className='text-brand-500'>craving</span>, delivered fast
                        </h1>

                        <p className='text-lg text-ink-800/70 dark:text-white/70 leading-relaxed max-w-xl'>
                            Handcrafted with locally-sourced ingredients, toasted to perfection, and
                            on your table faster than you'd expect. Explore the menu and find your new favorite.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/menu')}
                                className="bg-ink-900 dark:bg-brand-500 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-brand-600 dark:hover:bg-brand-400 transition duration-200 shadow-soft"
                            >
                                Order Now
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/menu?deal=1')}
                                className="border-2 border-ink-900/15 dark:border-white/20 text-ink-900 dark:text-white font-semibold px-7 py-3.5 rounded-full hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition duration-200"
                            >
                                View Deals
                            </motion.button>
                        </div>

                        <div className="flex items-center gap-8 pt-4">
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <p className="font-display text-2xl font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                                        {s.label === 'Average rating' && <FaStar className="text-amber-400" size={16} />}
                                        {s.value}
                                    </p>
                                    <p className="text-xs text-ink-800/50 dark:text-white/50 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className='w-full order-1 md:w-1/2 flex justify-center'
                >
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-brand-200/60 dark:bg-brand-900/30 blur-3xl scale-90"></div>
                        <img
                            src={Sandwich}
                            className="relative w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl"
                            alt="Featured sandwich"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Banner

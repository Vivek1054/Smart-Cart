import React from 'react';
import teamImg from '../assets/sandwich.png';
import signature from '../assets/sandwich.png';

const About = () => {
  return (
    <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 pt-32 dark:bg-ink-900 dark:text-white'>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-ink-900 min-h-[42vh] flex items-center justify-center text-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]"></div>
        <div className="relative z-10 px-6 py-16">
          <h1 className="font-display mb-4 text-4xl md:text-5xl font-semibold text-white tracking-tight">Our Story</h1>
          <p className="text-lg font-medium text-white/80">
            Est. 2015 • Serving authentic flavors with a modern twist
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-16 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-14">
          <div className="md:w-1/2 space-y-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">Our Mission</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-ink-900 dark:text-white">
              Crafting Sandwich Excellence
            </h2>
            <p className="text-lg leading-relaxed text-ink-800/70 dark:text-white/70">
              What began as a small family recipe has grown into Mumbai's favorite sandwich destination,
              known for its fresh ingredients, flavorful recipes, and community-centered mission.
            </p>
            <img src={signature} alt="Founder's signature" className="w-28 opacity-70" />
          </div>
          <div className="md:w-1/2">
            <img
              src={teamImg}
              alt="Our dedicated team preparing sandwiches"
              className="rounded-2xl shadow-lift transition-transform duration-300 hover:scale-[1.02] w-full"
            />
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 md:py-20 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">What Drives Us</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 mt-2 text-ink-900 dark:text-white">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🌱",
              title: "Sustainability",
              desc: "Locally sourced ingredients and zero-plastic packaging for a greener future."
            },
            {
              icon: "🧑‍🍳",
              title: "Expert Craft",
              desc: "Our certified chefs craft each sandwich with skill, love, and passion."
            },
            {
              icon: "❤️",
              title: "Community",
              desc: "We proudly support local farmers and food education initiatives."
            }
          ].map((item, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1 p-8 text-center"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-ink-800/70 dark:text-white/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 mb-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-10 text-ink-900 dark:text-white">What Our Customers Say</h2>
          <div className="rounded-2xl bg-cream-100 dark:bg-ink-800 shadow-soft p-8 md:p-10">
            <blockquote className="text-2xl font-display italic text-ink-900 dark:text-white mb-6">
              "The best <span className='font-semibold not-italic'>grilled sandwich</span> I've had in <span className='text-brand-500 not-italic'>Mumbai!</span>"
            </blockquote>
            <cite className="font-semibold not-italic text-brand-600 dark:text-brand-300">— Priya Sharma</cite>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

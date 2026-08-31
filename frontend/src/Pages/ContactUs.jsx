import React, { useState } from 'react'

import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import locationImg from '../assets/sandwich.png';

const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic
    setSubmitted(true);
    e.target.reset();
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <>
      <div className='dark:bg-ink-900 dark:text-white min-h-screen'>

        <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 pt-32'>
          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-ink-900 min-h-[36vh] flex items-center justify-center text-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_45%)]"></div>
            <div className="relative z-10 px-6 py-14">
              <h1 className="font-display mb-3 text-4xl md:text-5xl font-semibold text-white tracking-tight">Let's Connect</h1>
              <p className="text-lg text-white/80">We'd love to hear from you</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="py-16">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                {
                  icon: <FaMapMarkerAlt className="text-2xl" />,
                  title: "Visit Us",
                  content: "123 Gourmet Lane, Mumbai 400050",
                },
                {
                  icon: <FaPhone className="text-2xl" />,
                  title: "Call Us",
                  content: "+91 98765 43210\nFor catering: +91 87654 32109"
                },
                {
                  icon: <FaEnvelope className="text-2xl" />,
                  title: "Email Us",
                  content: "hello@sandwichartisans.com\ncatering@sandwichartisans.com"
                },
                {
                  icon: <FaClock className="text-2xl" />,
                  title: "Hours",
                  content: "Mon-Fri: 8AM - 10PM\nWeekends: 9AM - 11PM"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1 p-6 text-center"
                >
                  <div className="flex justify-center mb-3 text-brand-500">{item.icon}</div>
                  <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="whitespace-pre-line text-sm text-ink-800/70 dark:text-white/70">{item.content}</p>
                </div>
              ))}
            </div>

            {/* Form + Map */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Contact Form */}
              <div className="lg:w-1/2">
                <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8">
                  <h2 className="font-display text-2xl font-semibold mb-6 text-center text-ink-900 dark:text-white">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-4 py-3 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full px-4 py-3 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition"
                    />
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select Subject</option>
                      <option>General Inquiry</option>
                      <option>Catering Request</option>
                      <option>Feedback</option>
                    </select>
                    <textarea
                      placeholder="Your Message..."
                      rows="5"
                      className="w-full px-4 py-3 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition resize-none"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-ink-900 dark:bg-brand-500 text-white font-semibold py-3.5 rounded-full hover:bg-brand-600 dark:hover:bg-brand-400 active:scale-[0.99] transition duration-200 shadow-soft"
                    >
                      Send Message
                    </button>
                    {submitted && (
                      <p className="text-center text-sm font-medium text-green-600 dark:text-green-400 animate-fade-up">
                        Message sent successfully! We'll get back to you soon. ✅
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Map / Location image */}
              <div className="lg:w-1/2">
                <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft h-full overflow-hidden flex flex-col">
                  <div className="relative h-64 md:h-80">
                    <img
                      src={locationImg}
                      alt="Store Location"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-1">Our Location</h3>
                    <p className="text-ink-800/70 dark:text-white/70">Visit our cozy sandwich shop in Bandra West</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;

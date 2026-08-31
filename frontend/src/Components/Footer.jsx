import { useState } from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (

    <footer className="pt-16 pb-8 bg-cream-100 dark:bg-ink-900 dark:text-white border-t border-ink-800/10 dark:border-white/10">
      <div className="max-w-screen-2xl container mx-auto md:px-20 px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* About Section */}
          <div>
            <h3 className="font-display text-2xl font-semibold mb-4 text-ink-900 dark:text-white">SmartCart</h3>
            <p className="mb-5 text-ink-800/70 dark:text-white/70 leading-relaxed">
              Serving delicious, fresh sandwiches since 2010. Made with love and the finest ingredients.
            </p>
            <div className="flex space-x-3">
              {[FaFacebook, FaInstagram, FaTwitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10 text-ink-800/70 dark:text-white/70 hover:bg-brand-500 hover:text-white transition-colors duration-200 shadow-soft"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-xl font-semibold mb-4 text-ink-900 dark:text-white">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link className="text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300 transition" to='/'>Home</Link></li>
              <li><Link className="text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300 transition" to='/about'>About</Link></li>
              <li><Link className="text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300 transition" to='/contactus'>Contact</Link></li>
              <li><Link className="text-ink-800/70 dark:text-white/70 hover:text-brand-600 dark:hover:text-brand-300 transition" to='/menu'>Menu</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-xl font-semibold mb-4 text-ink-900 dark:text-white">Contact Us</h3>
            <ul className="space-y-3 text-ink-800/70 dark:text-white/70">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-brand-500" />
                <span>123 Sandwich Street, Foodville, 560001</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="shrink-0 text-brand-500" />
                <span>+91 9876543210</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="shrink-0 text-brand-500" />
                <span>info@sandwichshop.com</span>
              </li>
              <li className="flex items-center gap-3">
                <FaClock className="shrink-0 text-brand-500" />
                <span>Mon-Sun: 8AM - 10PM</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-xl font-semibold mb-4 text-ink-900 dark:text-white">Newsletter</h3>
            <p className="mb-4 text-ink-800/70 dark:text-white/70">
              Subscribe to get updates on special offers and new menu items.
            </p>
            <form className="flex flex-col space-y-3" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-ink-800/10 dark:border-white/15 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 text-sm placeholder:text-ink-800/40 dark:placeholder:text-white/40 transition"
                required
              />
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-full transition-colors duration-200 active:scale-95 shadow-soft"
              >
                Subscribe
              </button>
              {subscribed && (
                <p className="text-sm text-green-600 dark:text-green-400 animate-fade-up">Thanks for subscribing! 🎉</p>
              )}
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-ink-800/10 dark:border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-ink-800/50 dark:text-white/50 text-sm">
            &copy; {new Date().getFullYear()} SmartCart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
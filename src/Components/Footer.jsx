import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400">Sandwich Shop</h3>
            <p className="mb-4 text-gray-300">
              Serving delicious, fresh sandwiches since 2010. Made with love and the finest ingredients.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-amber-400 transition">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-400 transition">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-400 transition">
                <FaTwitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-amber-400 transition">Home</a></li>
              <li><a href="/menu" className="text-gray-300 hover:text-amber-400 transition">Our Menu</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-amber-400 transition">About Us</a></li>
              <li><a href="/gallery" className="text-gray-300 hover:text-amber-400 transition">Gallery</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-amber-400 transition">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-3 text-amber-400" />
                <span className="text-gray-300">123 Sandwich Street, Foodville, 560001</span>
              </li>
              <li className="flex items-center">
                <FaPhone className="mr-3 text-amber-400" />
                <span className="text-gray-300">+91 9876543210</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="mr-3 text-amber-400" />
                <span className="text-gray-300">info@sandwichshop.com</span>
              </li>
              <li className="flex items-center">
                <FaClock className="mr-3 text-amber-400" />
                <span className="text-gray-300">Mon-Sun: 8AM - 10PM</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to get updates on special offers and new menu items.
            </p>
            <form className="flex flex-col space-y-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-amber-400"
                required
              />
              <button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright and Payment Methods */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="place-items-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Sandwich Shop. All rights reserved.
            </p>
          </div>
          {/* <div className="flex space-x-4">
            <img src="https://via.placeholder.com/40x25?text=Visa" alt="Visa" className="h-6" />
            <img src="https://via.placeholder.com/40x25?text=MC" alt="Mastercard" className="h-6" />
            <img src="https://via.placeholder.com/40x25?text=RPay" alt="Razorpay" className="h-6" />
            <img src="https://via.placeholder.com/40x25?text=UPI" alt="UPI" className="h-6" />
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
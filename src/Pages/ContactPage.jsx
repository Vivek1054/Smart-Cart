import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import locationImg from '../assets/sandwich.png';

const ContactPage = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully!');
  };

  return (
    <div className="font-sans text-gray-800">
      {/* Hero */}
      <section className="relative h-80 flex items-center justify-center bg-[url('../assets/contact-hero.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4">Let's Connect</h1>
          <p className="text-xl">We'd love to hear from you</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Location */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <FaMapMarkerAlt className="text-3xl text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
            <p className="mb-2">123 Gourmet Lane, Bandra West</p>
            <p className="mb-4">Mumbai 400050</p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 font-medium hover:underline"
            >
              View on Map
            </a>
          </div>

          {/* Phone */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <FaPhone className="text-3xl text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Call Us</h3>
            <p className="mb-2">+91 98765 43210</p>
            <p>For catering: +91 87654 32109</p>
          </div>

          {/* Email */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <FaEnvelope className="text-3xl text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="mb-2">hello@sandwichartisans.com</p>
            <p>catering@sandwichartisans.com</p>
          </div>

          {/* Hours */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <FaClock className="text-3xl text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hours</h3>
            <p className="mb-2">Mon-Fri: 8AM - 10PM</p>
            <p>Weekends: 9AM - 11PM</p>
          </div>
        </div>

        {/* Form + Map */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Form */}
          <div className="lg:w-1/2 bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-center">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required 
                />
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required 
                />
              </div>
              <div>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Subject</option>
                  <option>General Inquiry</option>
                  <option>Catering Request</option>
                  <option>Feedback</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <textarea 
                  placeholder="Your Message..." 
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Map */}
          <div className="lg:w-1/2">
            <img 
              src={locationImg} 
              alt="Store Location" 
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
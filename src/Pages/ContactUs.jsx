import React from 'react'


import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import locationImg from '../assets/sandwich.png';

const ContactUs = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic
    alert('Message sent successfully!');
  };

  return (
      <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 mt-24'>
      {/* Hero with DaisyUI */}
      <div className="hero min-h-[50vh]" style={{backgroundImage: 'url(../assets/contact-hero.jpg)'}}>
        <div className="hero-overlay bg-opacity-20"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Let's Connect</h1>
            <p className="mb-5 text-xl">We'd love to hear from you</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: <FaMapMarkerAlt className="text-3xl" />,
              title: "Visit Us",
              content: "123 Gourmet Lane, Mumbai 400050",
              link: "View on Map"
            },
            {
              icon: <FaPhone className="text-3xl" />,
              title: "Call Us",
              content: "+91 98765 43210\nFor catering: +91 87654 32109"
            },
            {
              icon: <FaEnvelope className="text-3xl" />,
              title: "Email Us",
              content: "hello@sandwichartisans.com\ncatering@sandwichartisans.com"
            },
            {
              icon: <FaClock className="text-3xl" />,
              title: "Hours",
              content: "Mon-Fri: 8AM - 10PM\nWeekends: 9AM - 11PM"
            }
          ].map((item, index) => (
            <div key={index} className="card bg-base-100 shadow-md hover:shadow-xl">
              <div className="card-body items-center text-center">
                <div className="text-primary">{item.icon}</div>
                <h3 className="card-title">{item.title}</h3>
                <p className="whitespace-pre-line">{item.content}</p>
                {item.link && (
                  <a href="#" className="link link-primary">{item.link}</a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form + Map */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Form */}
          <div className="lg:w-1/2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-3xl mb-8 justify-center">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="form-control">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="input input-bordered" 
                      required 
                    />
                  </div>
                  <div className="form-control">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="input input-bordered" 
                      required 
                    />
                  </div>
                  <div className="form-control">
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <select className="select select-bordered" required>
                      <option value="">Select Subject</option>
                      <option>General Inquiry</option>
                      <option>Catering Request</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <textarea 
                      placeholder="Your Message..." 
                      rows="5"
                      className="textarea textarea-bordered" 
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:w-1/2">
            <div className="card bg-base-100 shadow-xl h-full">
              <figure>
                <img 
                  src={locationImg} 
                  alt="Store Location" 
                  className="w-full h-full object-cover"
                />
              </figure>
              <div className="card-body">
                <h3 className="card-title">Our Location</h3>
                <p>Visit our cozy sandwich shop in Bandra West</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
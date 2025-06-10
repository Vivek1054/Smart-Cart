import React from 'react'


import teamImg from '../assets/sandwich.png';
import signature from '../assets/sandwich.png';

const About = () => {
  return (
    <>
      <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 mt-24'>

        <div className="font-sans">
          {/* Hero Section with DaisyUI classes */}
          <div className="hero min-h-[60vh]" style={{ backgroundImage: 'url(../assets/about-hero-bg.jpg)' }}>
            <div className="hero-overlay bg-opacity-20"></div>
            <div className="hero-content text-center text-neutral-content">
              <div className="max-w-md">
                <h1 className="mb-5 text-5xl font-bold">Our Story</h1>
                <p className="mb-5 text-xl">Est. 2015 • Serving authentic flavors with a modern twist</p>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="py-20 bg-base-200 mt-3">
            <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <h2 className="text-4xl font-bold mb-6">Crafting Sandwich Excellence</h2>
                <p className="text-lg mb-8">
                  What began as a small family recipe has grown into Mumbai's favorite
                  sandwich destination.
                </p>
                <img src={signature} alt="Founder's Signature" className="w-40" />
              </div>
              <div className="md:w-1/2">
                <img
                  src={teamImg}
                  alt="Our Team"
                  className="rounded-box shadow-2xl w-full"
                />
              </div>
            </div>
          </div>

          {/* Values Section with DaisyUI cards */}
          <div className="py-20 text-center">
            <div className="container mx-auto px-6 max-w-6xl">
              <h2 className="text-4xl font-bold mb-16">Our Core Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "🌱",
                    title: "Sustainability",
                    desc: "Locally sourced ingredients with zero plastic packaging"
                  },
                  {
                    icon: "🧑‍🍳",
                    title: "Expert Craft",
                    desc: "Each sandwich prepared by certified master chefs"
                  },
                  {
                    icon: "❤️",
                    title: "Community",
                    desc: "Supporting local farmers and food education"
                  }
                ].map((item, index) => (
                  <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <div className="card-body items-center text-center">
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="card-title">{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="py-20 bg-base-300">
            <div className="container mx-auto px-6 max-w-4xl text-center">
              <h2 className="text-4xl font-bold mb-12">What Our Customers Say</h2>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <blockquote className="text-2xl italic mb-6">
                    "The best grilled sandwich I've had in Mumbai!"
                  </blockquote>
                  <cite className="font-bold text-xl not-italic">- Priya Sharma</cite>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
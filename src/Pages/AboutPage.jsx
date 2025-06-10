import teamImg from '../assets/sandwich.png';
import signature from '../assets/sandwich.png';

const AboutPage = () => {
  return (
    <div className="font-sans text-gray-800">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center bg-[url('../assets/about-hero-bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4">Our Story</h1>
          <p className="text-xl">Est. 2015 • Serving authentic flavors with a modern twist</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Crafting Sandwich Excellence</h2>
            <p className="text-lg leading-relaxed mb-8">
              What began as a small family recipe has grown into Mumbai's favorite 
              sandwich destination. We combine traditional techniques with 
              innovative flavors to create unforgettable experiences.
            </p>
            <img src={signature} alt="Founder's Signature" className="w-40" />
          </div>
          <div className="md:w-1/2">
            <img 
              src={teamImg} 
              alt="Our Team" 
              className="rounded-xl shadow-xl w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 hover:-translate-y-2">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-2xl font-semibold mb-3">Sustainability</h3>
              <p className="text-gray-600">Locally sourced ingredients with zero plastic packaging</p>
            </div>
            
            {/* Value 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 hover:-translate-y-2">
              <div className="text-4xl mb-4">🧑‍🍳</div>
              <h3 className="text-2xl font-semibold mb-3">Expert Craft</h3>
              <p className="text-gray-600">Each sandwich prepared by our certified master chefs</p>
            </div>
            
            {/* Value 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 hover:-translate-y-2">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-2xl font-semibold mb-3">Community</h3>
              <p className="text-gray-600">Supporting local farmers and food education programs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">What Our Customers Say</h2>
          <blockquote className="text-2xl italic mb-6">
            "The best grilled sandwich I've had in Mumbai! Their attention to 
            detail is unmatched."
          </blockquote>
          <cite className="font-bold text-xl not-italic">- Priya Sharma, Food Critic</cite>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
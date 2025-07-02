// import React from 'react'


// import teamImg from '../assets/sandwich.png';
// import signature from '../assets/sandwich.png';

// const About = () => {
//   return (
//     <>
//       <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 mt-24 dark:bg-slate-900 dark:text-white'>

//         <div className="font-sans">
//           {/* Hero Section with DaisyUI classes */}
//           <div className="hero min-h-[60vh]" style={{ backgroundImage: 'url(../assets/about-hero-bg.jpg)' }}>
//             <div className="hero-overlay bg-opacity-20"></div>
//             <div className="hero-content text-center text-neutral-content">
//               <div className="max-w-md">
//                 <h1 className="mb-5 text-5xl font-bold">Our Story</h1>
//                 <p className="mb-5 text-xl">Est. 2015 • Serving authentic flavors with a modern twist</p>
//               </div>
//             </div>
//           </div>

//           {/* Mission Section */}
//           <div className="py-20 bg-base-200 mt-3">
//             <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center gap-12">
//               <div className="md:w-1/2">
//                 <h2 className="text-4xl font-bold mb-6">Crafting Sandwich Excellence</h2>
//                 <p className="text-lg mb-8">
//                   What began as a small family recipe has grown into Mumbai's favorite
//                   sandwich destination.
//                 </p>
//                 <img src={signature} alt="Founder's Signature" className="w-40" />
//               </div>
//               <div className="md:w-1/2">
//                 <img
//                   src={teamImg}
//                   alt="Our Team"
//                   className="rounded-box shadow-2xl w-full"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Values Section with DaisyUI cards */}
//           <div className="py-20 text-center">
//             <div className="container mx-auto px-6 max-w-6xl">
//               <h2 className="text-4xl font-bold mb-16">Our Core Values</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                 {[
//                   {
//                     icon: "🌱",
//                     title: "Sustainability",
//                     desc: "Locally sourced ingredients with zero plastic packaging"
//                   },
//                   {
//                     icon: "🧑‍🍳",
//                     title: "Expert Craft",
//                     desc: "Each sandwich prepared by certified master chefs"
//                   },
//                   {
//                     icon: "❤️",
//                     title: "Community",
//                     desc: "Supporting local farmers and food education"
//                   }
//                 ].map((item, index) => (
//                   <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
//                     <div className="card-body items-center text-center">
//                       <div className="text-4xl mb-4">{item.icon}</div>
//                       <h3 className="card-title">{item.title}</h3>
//                       <p>{item.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Testimonials */}
//           <div className="py-20 mb-10 bg-base-300">
//             <div className="container mx-auto px-6 max-w-4xl text-center">
//               <h2 className="text-4xl font-bold mb-12">What Our Customers Say</h2>
//               <div className="card bg-base-100 shadow-xl">
//                 <div className="card-body">
//                   <blockquote className="text-2xl italic mb-6">
//                     "The best grilled sandwich I've had in Mumbai!"
//                   </blockquote>
//                   <cite className="font-bold text-xl not-italic">- Priya Sharma</cite>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default About;



import React from 'react';
import teamImg from '../assets/sandwich.png';
import signature from '../assets/sandwich.png';

const About = () => {
  return (
    <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 pt-32 dark:bg-slate-900 dark:text-white font-sans'>
      {/* <div className='pt-24'></div> */}

      {/* Hero Section */}
      <div
        className="hero min-h-[60vh] rounded-xl overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/about-hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-overlay bg-black bg-opacity-40 backdrop-blur-sm "></div>
        <div className="hero-content text-center text-neutral-content ">
          <div className="max-w-xl ">
            <h1 className="mb-5 text-5xl font-extrabold tracking-tight">Our Story</h1>
            <p className="mb-5 text-xl font-medium">
              Est. 2015 • Serving authentic flavors with a modern twist
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-20 bg-base-200 mt-8 rounded-lg shadow-md dark: hero-overlay bg-black bg-opacity-40 backdrop-blur-sm dark:text-white">
        <div className="flex flex-col md:flex-row items-center gap-12 px-6 max-w-6xl mx-auto">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Crafting Sandwich Excellence</h2>
            <p className="text-lg leading-relaxed">
              What began as a small family recipe has grown into Mumbai's favorite sandwich destination,
              known for its fresh ingredients, flavorful recipes, and community-centered mission.
            </p>
            <img src={signature} alt="Founder's signature" className="w-32 opacity-80" />
          </div>
          <div className="md:w-1/2">
            <img
              src={teamImg}
              alt="Our dedicated team preparing sandwiches"
              className="rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-14">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className="card bg-base-300 dark:bg-slate-700 dark:shadow-black dark:hover:shadow-xl dark:transition-all dark:duration-300 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="card-body items-center text-center  dark:text-white">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="card-title text-xl font-semibold">{item.title}</h3>
                  <p className=" ">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-base-300 rounded-xl mb-10 dark: hero-overlay bg-black bg-opacity-40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12">What Our Customers Say</h2>
          <div className="card bg-base-100 dark:bg-slate-700 shadow-xl p-6">
            <div className="card-body">
              <blockquote className="text-2xl italic text-gray-800 dark:text-white mb-6">
                "The best <span className='font-semibold underline'>grilled sandwich</span> I've had in <span className='text-pink-600'>Mumbai!"</span> 
              </blockquote>
              <cite className="font-bold text-xl not-italic text-primary">- Priya Sharma</cite>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

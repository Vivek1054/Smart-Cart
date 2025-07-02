// 

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cards from '../Components/Cards';
import list from '../assets/list.json';

const Menu = () => {
  const navigate = useNavigate();

  // Get unique categories + 'All'
  const categories = ['All', ...new Set(list.map(item => item.category))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredList = selectedCategory === 'All'
    ? list
    : list.filter(item => item.category === selectedCategory);

  return (
    <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
      {/* Header Section */}
      <div className='pt-28 items-center text-center'>
        <h1 className='text-2xl font-semibold'>
          We are Delighted to have you{" "}
          <span className='text-pink-500'>Here! :)</span>
        </h1>
        <p className='m-6 text-gray-600 dark:text-gray-300'>
          Explore our diverse menu — from sandwiches to drinks and desserts — crafted with love and flavor.
        </p>
        <button
          className='mt-4 bg-pink-500 text-white rounded-md px-4 py-2 hover:bg-pink-700 duration-300'
          onClick={() => navigate('/')}
        >
          Back
        </button>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-12">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full border font-medium transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-pink-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className='mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
        {filteredList.map(item => (
          <Cards key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Menu;

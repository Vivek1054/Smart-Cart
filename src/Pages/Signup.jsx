import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate=useNavigate();
  return (
    <div className="flex justify-center items-center min-h-screen bg-yellow-50">
      <form className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-800">Join the Sandwich Club 🥪</h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Full Name</label>
          <input type="text" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="John Doe" required />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700">Email</label>
          <input type="email" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="you@example.com" required />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700">Password</label>
          <input type="password" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="••••••••" required />
        </div>

        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-md transition">
          Sign Up
        </button>



        <button
          type="button"
          onClick={() => navigate('/login')} className="mt-4 w-full text-sm text-yellow-700 underline"
        >Already have an account?</button>


        <button
          type="button"
          onClick={() => navigate('/')} className="mt-4 w-full text-sm text-yellow-700 underline"
        >
          ← Back to Home
        </button>
      </form>
    </div>
  );
};

export default Signup;

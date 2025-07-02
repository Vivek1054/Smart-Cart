import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 pt-20">
      <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-yellow-800">Login to SmartCart</h2>

        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full mt-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            placeholder="••••••"
            className="w-full mt-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-md hover:bg-yellow-600"
        >
          Login
        </button>


        <button
          type="button"
          onClick={() => navigate('/signup')} className="mt-4 w-full text-sm text-yellow-700 underline"
        >Create new Account</button>

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

export default Login;

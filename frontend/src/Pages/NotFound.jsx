import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
    <p className="text-7xl mb-4">🥪</p>
    <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mb-2">
      Page Not Found
    </h1>
    <p className="text-ink-800/60 dark:text-white/60 max-w-md mb-8">
      The page you're looking for has been eaten. Let's get you back to something delicious.
    </p>
    <Link to="/">
      <Button>Back to Home</Button>
    </Link>
  </div>
);

export default NotFound;

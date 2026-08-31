import React, { useEffect, useState } from 'react';

const getRemaining = () => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end - now);
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
  };
};

const Unit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 dark:bg-white/10 text-white font-display text-lg font-semibold tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[10px] uppercase tracking-wide text-ink-800/50 dark:text-white/50 mt-1">{label}</span>
  </div>
);

const CountdownTimer = () => {
  const [t, setT] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2.5" role="timer" aria-label="Deal ends in">
      <Unit value={t.h} label="hrs" />
      <span className="text-ink-800/30 dark:text-white/30 font-semibold">:</span>
      <Unit value={t.m} label="min" />
      <span className="text-ink-800/30 dark:text-white/30 font-semibold">:</span>
      <Unit value={t.s} label="sec" />
    </div>
  );
};

export default CountdownTimer;

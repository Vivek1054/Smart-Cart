import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const USERS_KEY = 'smartcart_users';
const SESSION_KEY = 'smartcart_session';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Demo-only auth: there is no backend, so accounts and sessions live entirely
// in localStorage. This is intentionally NOT production-grade security.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const signup = ({ name, email, password }) => {
    const users = readJSON(USERS_KEY, []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const newUser = { name, email, password };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    setUser({ name, email });
    return { ok: true };
  };

  const login = ({ email, password }) => {
    const users = readJSON(USERS_KEY, []);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    setUser({ name: found.name, email: found.email });
    return { ok: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

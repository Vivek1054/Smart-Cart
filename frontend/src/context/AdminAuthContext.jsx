import React, { createContext, useContext, useEffect, useState } from 'react';

const AdminAuthContext = createContext(null);
const SESSION_KEY = 'smartcart_admin_session';

// Demo-only admin auth: single hardcoded super-admin account, no backend.
// Credentials: admin@smartcart.com / admin123
const DEMO_ADMIN = { name: 'Alex Morgan', email: 'admin@smartcart.com', password: 'admin123', role: 'Super Admin' };

const readSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(readSession);

  useEffect(() => {
    if (admin) localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
    else localStorage.removeItem(SESSION_KEY);
  }, [admin]);

  const login = ({ email, password }) => {
    if (email.toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      setAdmin({ name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, role: DEMO_ADMIN.role });
      return { ok: true };
    }
    return { ok: false, error: 'Invalid admin credentials.' };
  };

  const logout = () => setAdmin(null);

  return (
    <AdminAuthContext.Provider value={{ admin, isAdminAuthenticated: !!admin, login, logout, demoCredentials: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password } }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

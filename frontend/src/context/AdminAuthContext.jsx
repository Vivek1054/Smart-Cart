import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const AdminAuthContext = createContext(null);

// Admin access = a Supabase Auth user whose profiles.role is 'admin'.
// This context only reflects that state for the UI; the real enforcement is in
// the database (RLS policies use is_admin()), so hiding a page is never the only guard.
export const AdminAuthProvider = ({ children }) => {
  const { user, isAdmin, authLoading, login: authLogin, logout: authLogout } = useAuth();

  const admin = useMemo(
    () => (isAdmin ? { name: user.name, email: user.email, role: 'Admin' } : null),
    [isAdmin, user]
  );

  const login = useCallback(async (credentials) => {
    const result = await authLogin(credentials);
    if (!result.ok) return result;
    if (result.profile?.role !== 'admin') {
      await authLogout();
      return { ok: false, error: 'This account does not have admin access.' };
    }
    return { ok: true };
  }, [authLogin, authLogout]);

  const value = useMemo(
    () => ({ admin, isAdminAuthenticated: !!admin, loading: authLoading, login, logout: authLogout }),
    [admin, authLoading, login, authLogout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

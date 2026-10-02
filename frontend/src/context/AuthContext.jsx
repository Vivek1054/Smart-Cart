import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';

const AuthContext = createContext(null);

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role, status, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Real authentication via Supabase Auth. The session is persisted and refreshed
// by supabase-js; the application profile (name, phone, role, status) lives in
// public.profiles. Roles are enforced by the database (RLS), not by this UI state.
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Never await supabase calls inside this callback (it can deadlock the client);
      // just record the session and let the effect below load the profile.
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setProfile(null); setRecovery(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id || null;

  useEffect(() => {
    if (!sessionReady) return undefined;
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return undefined;
    }
    let alive = true;
    setProfileReady(false);
    fetchProfile(userId)
      .then((p) => { if (alive) setProfile(p); })
      .catch((e) => { console.error('[auth] profile load failed', e); if (alive) setProfile(null); })
      .finally(() => { if (alive) setProfileReady(true); });
    return () => { alive = false; };
  }, [userId, sessionReady]);

  const user = useMemo(() => {
    if (!session?.user) return null;
    const meta = session.user.user_metadata || {};
    return {
      id: session.user.id,
      email: profile?.email || session.user.email,
      name: profile?.name || meta.name || (session.user.email || '').split('@')[0],
      phone: profile?.phone || '',
      role: profile?.role || 'customer',
      status: profile?.status || 'Active',
      createdAt: profile?.created_at || session.user.created_at,
    };
  }, [session, profile]);

  const authLoading = !sessionReady || (!!userId && !profileReady);

  const signup = useCallback(async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { ok: false, error: friendlyError(error) };
    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    // With "Confirm email" enabled there is no session until the link is clicked.
    return { ok: true, needsConfirmation: !data.session };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: friendlyError(error) };
    let p = null;
    try { p = await fetchProfile(data.user.id); } catch { /* handled below */ }
    if (p?.status === 'Blocked') {
      await supabase.auth.signOut();
      return { ok: false, error: 'Your account has been blocked. Please contact support.' };
    }
    return { ok: true, profile: p };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: friendlyError(error) };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: friendlyError(error) };
    setRecovery(false);
    return { ok: true };
  }, []);

  const updateProfile = useCallback(async ({ name, phone }) => {
    if (!userId) return { ok: false, error: 'Please log in to continue.' };
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), phone: phone?.trim() || null })
      .eq('id', userId)
      .select('id, name, email, phone, role, status, created_at')
      .single();
    if (error) return { ok: false, error: friendlyError(error) };
    setProfile(data);
    return { ok: true };
  }, [userId]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' && user?.status === 'Active',
    authLoading,
    recovery,
    signup, login, logout, resetPassword, updatePassword, updateProfile,
  }), [user, authLoading, recovery, signup, login, logout, resetPassword, updatePassword, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

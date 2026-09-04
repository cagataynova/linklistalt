'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(isFirebaseConfigured);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const fallback = window.setTimeout(() => setLoading(false), 8000);
    const unsubscribe = onAuthStateChanged(auth, (current) => { window.clearTimeout(fallback); setUser(current); setLoading(false); });
    return () => { window.clearTimeout(fallback); unsubscribe(); };
  }, []);
  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }

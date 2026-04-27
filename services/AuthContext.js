import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);
const USER_KEY = 'auth_user_v2';
const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

export function AuthProvider({ children }) {
  const [user, _setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // setUser updates state AND persists to SecureStore
  const setUser = async (newUser) => {
    _setUser(newUser);
    try {
      if (newUser) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch {}
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);

    (async () => {
      try {
        // 1. Restore saved user instantly (no network needed)
        const saved = await SecureStore.getItemAsync(USER_KEY);
        if (saved) _setUser(JSON.parse(saved));

        // 2. Validate session with server in background
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${BASE_URL}/api/auth/session`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            _setUser(session.user);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)).catch(() => {});
          }
        }
      } catch {}

      clearTimeout(timer);
      setLoading(false);
    })();

    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    try { await SecureStore.deleteItemAsync(USER_KEY); } catch {}
    _setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

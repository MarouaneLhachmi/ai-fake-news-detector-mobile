import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Short timeout to prevent white screen on slow network
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    checkSession().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  const checkSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('session_token');
      if (!token) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://ai-fake-news-detector01.vercel.app/api/auth/session', {
        credentials: 'include',
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': token,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const session = await res.json();
        if (session?.user) {
          setUser(session.user);
        }
      }
    } catch (e) {
      // Network error or timeout - proceed as logged out
      console.log('Session check failed:', e.message);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('session_token');
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

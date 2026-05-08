import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      api.getProfile()
        .then((profile) => {
          const updated = { ...parsed, name: profile.name || parsed.name, isAdmin: profile.isAdmin || false, profilePicture: profile.profilePicture || parsed.profilePicture || null };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    const existing = JSON.parse(localStorage.getItem('user') || '{}');
    const userData = { uid: data.uid, email, name: data.name || existing.name || '', isAdmin: data.isAdmin || false, profilePicture: data.profilePicture || null };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  };

  const updateUser = async (fields) => {
    const updated = { ...user, ...fields };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    try {
      await api.updateProfile(fields);
    } catch {
      // localStorage is already updated as fallback
    }
  };

  const handleSignup = async (name, email, password) => {
    const data = await api.signup(name, email, password);
    localStorage.setItem('token', data.token);
    const userData = { uid: data.uid, email, name, isAdmin: false };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, signup: handleSignup, logout: handleLogout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

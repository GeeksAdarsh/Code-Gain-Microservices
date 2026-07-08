import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token && !isTokenExpired(token)) {
      setUser(JSON.parse(savedUser));
    } else if (savedUser || token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const userData = response.data;
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const userData = response.data;
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Merge updates into the current user (and optionally swap the JWT, e.g. after a username change)
  const updateUser = (updates, newToken) => {
    setUser((prev) => {
      const merged = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
    if (newToken) localStorage.setItem('token', newToken);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isTeacher = () => user?.role === 'TEACHER';
  const isStudent = () => user?.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading, isAdmin, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

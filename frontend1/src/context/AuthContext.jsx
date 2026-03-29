import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiServices';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const { data } = await authService.me();
        setUser(data.data);
      } catch (error) {
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  };

  useEffect(() => { initAuth(); }, []);

  const login = async (email, password) => {
    try {
      const { data } = await authService.login({ email, password });
      setUser(data.data.user);
      localStorage.setItem('accessToken', data.data.accessToken);
      toast.success(`Welcome, ${data.data.user.fullName}`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try { await authService.logout(); } 
    finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      toast.success('Logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
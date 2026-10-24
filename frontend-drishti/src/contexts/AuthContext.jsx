import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('drishti_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
          }
        } catch (err) {
          console.warn('Stored token invalid or server unavailable:', err.message);
          localStorage.removeItem('drishti_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const loginAsGuest = async () => {
    try {
      const res = await authService.guestLogin();
      if (res?.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      // Fallback local guest
      const localGuest = {
        id: 'guest_local',
        email: 'guest@drishti.local',
        full_name: 'Guest User',
        role: 'guest'
      };
      setUser(localGuest);
      return { user: localGuest };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isGuest: user?.role === 'guest',
        loading,
        login,
        register,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  companyId: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.get<{ user: User }>('/auth/me');
          setUser(res.user);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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

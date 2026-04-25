import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserBase } from '../types/api';
import { UserGroup } from '../types/api';
import * as api from '../api/client';

interface AuthState {
  token: string | null;
  user: UserBase | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token'),
  );
  const [user, setUser] = useState<UserBase | null>(null);
  const [loading, setLoading] = useState(!!token);

  const isAdmin = user?.usergroup === UserGroup.Admin;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount
    setLoading(true);
    api
      .getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('access_token');
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem('access_token', res.access_token);
    setToken(res.access_token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const value: AuthState = {
    token,
    user: token ? user : null,
    loading: token ? loading : false,
    isAdmin: token ? isAdmin : false,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

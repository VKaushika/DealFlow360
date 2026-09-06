import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/apiClient';

export type RoleType =
  | 'ADMIN'
  | 'SALES_REP'
  | 'SALES_MANAGER'
  | 'FINANCE_OPS'
  | 'CUSTOMER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department?: string;
  customerId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: RoleType;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  switchPersona: (
    role: RoleType,
    customerEmail?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<RoleType>('SALES_REP');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (
    email: string,
    password: string = 'password123'
  ): Promise<UserProfile> => {
    setIsLoading(true);

    try {
      const res = await api.login({
        email,
        password,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Login failed');
      }

      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('dealflow_token', newToken);
      localStorage.setItem('dealflow_role', newUser.role);

      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role);

      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // DEMO PERSONA SWITCH
  // ============================================================

  const switchPersona = async (
    newRole: RoleType,
    customerEmail?: string
  ) => {
    setIsLoading(true);

    try {
      const email =
        customerEmail ||
        (newRole === 'CUSTOMER'
          ? 'david@abccorp.com'
          : undefined);

      const res = await api.getDemoToken(newRole, email);

      if (!res.data.success) {
        throw new Error(
          res.data.message || 'Failed to switch persona'
        );
      }

      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('dealflow_token', newToken);
      localStorage.setItem('dealflow_role', newUser.role);

      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role);
    } catch (error) {
      console.error('Failed to switch persona:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem('dealflow_token');
    localStorage.removeItem('dealflow_role');

    setToken(null);
    setUser(null);
    setRole('SALES_REP');

    // Always return to public landing page
    window.location.hash = '';
  };

  // ============================================================
  // INITIAL AUTH
  // ============================================================

  useEffect(() => {
    const initAuth = async () => {
      /*
       * IMPORTANT:
       *
       * Do NOT automatically restore the old token when the
       * application starts.
       *
       * This makes the first screen the public Landing Page.
       * User must manually sign in.
       */

      setToken(null);
      setUser(null);
      setRole('SALES_REP');

      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        login,
        switchPersona,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
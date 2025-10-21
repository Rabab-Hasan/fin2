import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import clientEncryption from '../utils/encryption';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';
console.log('🔗 AuthContext API Base URL:', API_BASE);

interface User {
  _id: string;
  email: string;
  name: string;
  user_type?: 'admin' | 'employee' | 'client';
  association?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AccessInfo {
  hasAccess: boolean;
  type: 'admin' | 'employee' | 'client' | 'unknown';
  message?: string;
  client?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  accessInfo: AccessInfo | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAccess: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load using secure storage
    const storedToken = clientEncryption.getSecureToken();
    const storedUser = clientEncryption.getSecureItem('user_data');
    
    console.log('🔍 AuthContext: Loading stored data...', {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      tokenLength: storedToken?.length,
      userEmail: storedUser?.email
    });
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(storedUser);
        
        // Verify token with backend
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error loading stored user data:', error);
        logout();
      }
    } else {
      // Clear any inconsistent state
      console.log('🔍 AuthContext: No valid stored data, clearing state');
      setToken(null);
      setUser(null);
      setAccessInfo(null);
      
      // Also clear any legacy localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    
    setIsLoading(false);
  }, []);  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Token verification error:', error);
      logout();
    }
  };

  const checkAccess = async () => {
    if (!token) {
      console.log('🔍 AuthContext: No token found');
      setAccessInfo(null);
      return;
    }

    console.log('🔍 AuthContext: Checking access with token...');
    try {
      const response = await fetch(`${API_BASE}/api/auth/check-access`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthContext: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 AuthContext: Access check response:', data);
        setAccessInfo(data);
      } else {
        console.log('🔍 AuthContext: Access check failed:', response.status);
        setAccessInfo(null);
      }
    } catch (error) {
      console.error('🔍 AuthContext: Access check error:', error);
      setAccessInfo(null);
    }
  };

  const login = (authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    
    // Store data securely using encryption
    clientEncryption.setSecureToken(authToken);
    clientEncryption.setSecureItem('user_data', userData);
    
    // Check access after login
    checkAccess();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAccessInfo(null);
    
    // Clear encrypted storage
    clientEncryption.clearUserData();
    
    // Also clear legacy localStorage for migration
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Check access when token changes
  useEffect(() => {
    if (token && user) {
      checkAccess();
    }
  }, [token, user]);

  const value: AuthContextType = {
    user,
    token,
    accessInfo,
    login,
    logout,
    checkAccess,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  // Debug logging for authentication state
  console.log('🔍 AuthContext: Current state:', {
    hasUser: !!user,
    hasToken: !!token,
    isAuthenticated: !!user && !!token,
    userEmail: user?.email,
    isLoading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
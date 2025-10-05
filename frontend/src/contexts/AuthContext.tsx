import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? `${window.location.protocol}//${window.location.hostname}:2345`
  : `${window.location.protocol}//${window.location.hostname}:2345`;

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
    // Check for stored auth data on app load
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Optionally verify token with backend
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
    
    setIsLoading(false);
  }, []);

  const verifyToken = async (authToken: string) => {
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
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Check access after login
    checkAccess();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAccessInfo(null);
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
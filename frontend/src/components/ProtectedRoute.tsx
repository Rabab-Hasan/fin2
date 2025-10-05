import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import NoAccess from './NoAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login, accessInfo, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Debug logging
  console.log('🔍 ProtectedRoute - accessInfo:', accessInfo);
  console.log('🔍 ProtectedRoute - user:', user);

  // Wait for access check to complete for client users
  if (user?.user_type === 'client' && !accessInfo) {
    console.log('🔍 ProtectedRoute - Waiting for access check...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check access for client users
  if (accessInfo && !accessInfo.hasAccess) {
    console.log('🔍 ProtectedRoute - Access denied, showing NoAccess component');
    return <NoAccess message={accessInfo.message} userType={accessInfo.type} />;
  }

  console.log('🔍 ProtectedRoute - Access granted, showing children');
  return <>{children}</>;
};

export default ProtectedRoute;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NoAccess from './NoAccess';

interface RouteProtectorProps {
  children: React.ReactNode;
  allowedRoutes?: string[]; // Routes allowed for client users
}

const RouteProtector: React.FC<RouteProtectorProps> = ({ 
  children, 
  allowedRoutes = ['/business', '/project-overview'] 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  useEffect(() => {
    // If user is a client with association and on home page, redirect to business
    if (user?.user_type === 'client' && user?.association && currentPath === '/') {
      navigate('/business');
    }
  }, [user, currentPath, navigate]);

  // If user is a client with association, restrict to only allowed routes
  if (user?.user_type === 'client' && user?.association) {
    if (!allowedRoutes.includes(currentPath) && currentPath !== '/') {
      return (
        <NoAccess 
          message="This page is not accessible to client users. You can only access Business Data and Project Overview."
          userType="client"
        />
      );
    }
  }

  return <>{children}</>;
};

export default RouteProtector;
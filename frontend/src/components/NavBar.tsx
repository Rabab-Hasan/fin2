import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Database, FlaskConical, ClipboardList, Building, LogOut, User, Target, BarChart3 } from 'lucide-react';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const NavBar: React.FC = () => {
  const location = useLocation();
  const { selectedClient } = useClient();
  const { user, logout } = useAuth();

  const baseNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/business', label: 'Business Data', icon: Database },
    { path: '/campaign-setup', label: 'Campaign Setup', icon: Target },
    { path: '/marketing-analysis', label: 'Marketing Analysis', icon: BarChart3 },
    { path: '/project-overview', label: 'Project Overview', icon: ClipboardList },
  ];

  const adminNavItems = [
    { path: '/access', label: 'Access', icon: User },
  ];

  const labsNavItem = { path: '/labs', label: 'Action Labs', icon: FlaskConical };

  // Build navigation items based on user type
  let navItems = [];

  // If user is a client with association, show only Business Data and Project Overview
  if (user?.user_type === 'client' && user?.association) {
    navItems = [
      { path: '/business', label: 'Business Data', icon: Database },
      { path: '/project-overview', label: 'Project Overview', icon: ClipboardList },
    ];
  } else {
    // For all other users (admin, employee, client without association)
    navItems = [
      ...baseNavItems,
      ...(user?.email === 'admin@example.com' || 
          user?.user_type === 'admin' || 
          user?.user_type === 'employee' || 
          !user?.user_type ? adminNavItems : []),
      labsNavItem,
    ];
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-soft border-b border-gray-200">
  <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Finance Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            ))}
            
            {/* Client Indicator */}
            {selectedClient && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <Building className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedClient.name}
                </span>
              </div>
            )}

            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <User className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

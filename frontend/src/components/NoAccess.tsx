import React from 'react';
import { ShieldX, Mail, AlertTriangle } from 'lucide-react';

interface NoAccessProps {
  message?: string;
  userType?: string;
}

const NoAccess: React.FC<NoAccessProps> = ({ 
  message = "You don't have access yet, contact y.alsarraj@action-labs.co",
  userType = "client"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>

        {/* Message */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            <span className="text-sm font-medium text-amber-700">
              {userType === 'client' ? 'Client Account' : 'Account'}
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Contact Support</span>
          </div>
          <a 
            href="mailto:y.alsarraj@action-labs.co" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            y.alsarraj@action-labs.co
          </a>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-gray-500">
          <p>Please include your email address and account details when contacting support.</p>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              window.location.reload();
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Sign out and try different account
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { metaApi } from '../api/meta';

const MetaAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          setError(`Meta authentication error: ${errorParam}`);
          setStatus('error');
          return;
        }
        
        if (!code) {
          setError('No authorization code received from Meta');
          setStatus('error');
          return;
        }

        // Exchange code for tokens
        const result = await metaApi.handleCallback(code, state || '');
        
        // Store tokens in localStorage (in production, consider more secure storage)
        localStorage.setItem('meta_access_token', result.access_token);
        localStorage.setItem('meta_user', JSON.stringify(result.user));
        localStorage.setItem('meta_pages', JSON.stringify(result.pages));
        localStorage.setItem('meta_connected', 'true');
        
        setStatus('success');
        
        // Redirect to labs page after 2 seconds
        setTimeout(() => {
          navigate('/labs');
        }, 2000);
        
      } catch (error) {
        console.error('Meta callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connecting to Meta
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your Meta authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate('/labs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Meta Connected Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your Meta (Facebook/Instagram) account has been connected. You'll be redirected shortly.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to Labs...
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAuthCallback;
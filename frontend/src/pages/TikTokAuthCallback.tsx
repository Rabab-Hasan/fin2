import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { tiktokApi } from '../api/tiktok';

const TikTokAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing TikTok authorization...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('auth_code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          return;
        }

        if (!authCode) {
          setStatus('error');
          setMessage('No authorization code received from TikTok');
          return;
        }

        // Here you would typically send the auth_code to your backend
        // to exchange it for an access token
        console.log('TikTok Auth Code:', authCode);
        console.log('State (Client ID):', state);

        // Exchange the auth code for access token via our API
        try {
          const response = await tiktokApi.exchangeToken(authCode, state || 'default');
          console.log('TikTok token exchange successful:', response);
          
          setStatus('success');
          setMessage('Successfully connected to TikTok! You can now close this window.');
        } catch (apiError) {
          console.error('TikTok API error:', apiError);
          setStatus('error');
          setMessage(`Failed to connect: ${apiError.message}`);
          return;
        }

        // Auto-close the popup after 3 seconds
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS', authCode, state }, window.location.origin);
            window.close();
          } else {
            // If not a popup, redirect back to social media page
            navigate('/labs');
          }
        }, 3000);

      } catch (error) {
        console.error('TikTok auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authorization');
      }
    };

    processCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      case 'success':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center py-8">
          {getStatusIcon()}
          
          <h2 className={`text-xl font-semibold mb-4 ${getStatusColor()}`}>
            TikTok Authorization
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {status === 'error' && (
            <button
              onClick={() => window.close()}
              className="btn-secondary"
            >
              Close Window
            </button>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                This window will close automatically in a few seconds.
              </p>
              <button
                onClick={() => window.close()}
                className="btn-primary"
              >
                Close Now
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TikTokAuthCallback;
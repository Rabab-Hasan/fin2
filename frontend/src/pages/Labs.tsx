import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, User, Database, BarChart3, Image, Share2, X, Download, Trash2 } from 'lucide-react';
import { reportsApi } from '../api/reports';
import { exportApi } from '../api/export';
import SimpleDataManager from '../components/SimpleDataManager';
import Card from '../components/Card';
import StrategyViewInterface from '../components/StrategyViewInterface';
import ContentManagement from '../components/ContentManagement';
import SocialMediaDashboard from '../components/SocialMediaDashboard';
import MediaPlan from '../components/MediaPlan';
import { useClient } from '../contexts/ClientContext';
import { tiktokApi } from '../api/tiktok';
import { metaApi } from '../api/meta';

const Labs: React.FC = () => {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'data' | 'strategy' | 'content' | 'social' | 'media'>('data');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);

  // Check Meta connection status on mount
  React.useEffect(() => {
    const isMetaConnected = localStorage.getItem('meta_connected') === 'true';
    setMetaConnected(isMetaConnected);
  }, []);

  // Listen for TikTok auth success messages from popup
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        setTiktokConnected(true);
        console.log('TikTok connected successfully!');
        // You could also trigger a refetch of connection status here
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check TikTok connection status when client changes
  React.useEffect(() => {
    if (selectedClient) {
      tiktokApi.getAccounts(selectedClient.id)
        .then(response => {
          setTiktokConnected(response.connected);
        })
        .catch(error => {
          console.error('Error checking TikTok connection:', error);
          setTiktokConnected(false);
        });
    }
  }, [selectedClient]);

  const handleTikTokConnect = () => {
    if (tiktokConnected) {
      // Handle disconnect
      setTiktokConnected(false);
      return;
    }

    const redirectUri = process.env.NODE_ENV === 'production' 
      ? `${window.location.protocol}//${window.location.host}/tiktok-auth-callback`
      : 'http://localhost:3000/tiktok-auth-callback';
    
    const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=7522384605962469377&state=${selectedClient?.id || 'default'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const popup = window.open(authUrl, 'tiktok-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    // Check if popup was blocked
    if (!popup) {
      alert('Popup was blocked. Please allow popups for this site and try again.');
    }
  };

  const handleMetaConnect = async () => {
    if (metaConnected) {
      // Handle disconnect
      localStorage.removeItem('meta_access_token');
      localStorage.removeItem('meta_user');
      localStorage.removeItem('meta_pages');
      localStorage.removeItem('meta_connected');
      setMetaConnected(false);
      return;
    }

    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }

    try {
      const { authUrl } = await metaApi.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Meta:', error);
      alert('Failed to connect to Meta. Please try again.');
    }
  };

  // Data is now handled by SimpleDataManager component

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Action Labs</h1>

      {!selectedClient ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Client Selection Required
            </h3>
            <p className="text-gray-600">
              Please select a client from the home page to access Action Labs features.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Data Entry
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'strategy'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Strategy View
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'social'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Social Media
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'media'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Media Plan
              </button>
            </nav>
          </div>

          {/* Data Entry Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Managing data for {selectedClient.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={`${exportApi.exportCsv()}?clientId=${selectedClient.id}`}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </a>
                    

                  </div>
                </div>
              </Card>

              {/* All functionality is now included in SimpleDataManager */}

              {/* Simple Data Manager */}
              <SimpleDataManager />
            </div>
          )}

          {/* Strategy View Tab */}
          {activeTab === 'strategy' && (
            <StrategyViewInterface />
          )}

          {/* Content Management Tab */}
          {activeTab === 'content' && (
            <ContentManagement />
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div>
              {(metaConnected || tiktokConnected) ? (
                <SocialMediaDashboard clientId={selectedClient?.id || ''} />
              ) : (
                <div className="space-y-6">
                  <Card>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Social Media Management
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Manage social media content, campaigns, and analytics for {selectedClient?.name}.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {/* Meta (Facebook/Instagram) Connection */}
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                          <div className="text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${metaConnected ? 'bg-green-100' : 'bg-gradient-to-br from-blue-600 to-pink-500'}`}>
                              {metaConnected ? (
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Meta (Facebook/Instagram)</h4>
                            <p className="text-sm text-gray-500">Connect your Meta Business account for Facebook & Instagram management</p>
                            <button 
                              onClick={handleMetaConnect}
                              className={`mt-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                metaConnected 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {metaConnected ? 'Disconnect Meta' : 'Connect Meta'}
                            </button>
                          </div>
                        </div>
                        {/* TikTok Connection */}
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                          <div className="text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${tiktokConnected ? 'bg-green-100' : 'bg-black'}`}> 
                              {tiktokConnected ? (
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">TikTok</h4>
                            <p className="text-sm text-gray-500">
                              {tiktokConnected ? 'Connected to TikTok Business' : 'Short-form video content and ads'}
                            </p>
                            <button 
                              onClick={handleTikTokConnect}
                              className={`mt-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                tiktokConnected 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-black text-white hover:bg-gray-800'
                              }`}
                            >
                              {tiktokConnected ? 'Disconnect' : 'Connect TikTok'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Media Plan Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <MediaPlan />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Labs;

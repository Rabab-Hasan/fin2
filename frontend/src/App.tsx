import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import BusinessDataNew from './pages/BusinessDataNew';
import Labs from './pages/Labs';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import AccessPage from './pages/AccessPage';
import CampaignSetup from './pages/CampaignSetup';
import MarketingAnalysisPage from './pages/MarketingAnalysisPage';
import TikTokAuthCallback from './pages/TikTokAuthCallback';
import MetaAuthCallback from './pages/MetaAuthCallback';
import GFHTestValidation from './components/GFHTestValidation';
import VectorDatabaseTest from './components/VectorDatabaseTest';

import ProtectedRoute from './components/ProtectedRoute';
import RouteProtector from './components/RouteProtector';
import Chatbot from './components/Chatbot';
import { ClientProvider } from './contexts/ClientContext';
import { AuthProvider } from './contexts/AuthContext';
import { MediaPlanProvider } from './contexts/MediaPlanContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ClientProvider>
            <MediaPlanProvider>
              <Router>
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <NavBar />
                <main>
                  <Routes>
                    <Route path="/tiktok-auth-callback" element={<TikTokAuthCallback />} />
                    <Route path="/meta-auth-callback" element={<MetaAuthCallback />} />
                    <Route path="/" element={
                      <RouteProtector allowedRoutes={['/business']}>
                        <Home />
                      </RouteProtector>
                    } />
                    <Route path="/business" element={<BusinessDataNew />} />
                    <Route path="/campaign-setup" element={
                      <RouteProtector allowedRoutes={['/business', '/project-overview']}>
                        <CampaignSetup />
                      </RouteProtector>
                    } />
                    <Route path="/marketing-analysis" element={
                      <RouteProtector allowedRoutes={['/business']}>
                        <MarketingAnalysisPage />
                      </RouteProtector>
                    } />

                    <Route path="/project-overview" element={<ProjectOverviewPage />} />
                    <Route path="/access" element={
                      <RouteProtector allowedRoutes={[]}>
                        <AccessPage />
                      </RouteProtector>
                    } />
                    <Route path="/labs" element={
                      <RouteProtector allowedRoutes={[]}>
                        <Labs />
                      </RouteProtector>
                    } />
                    <Route path="/gfh-test" element={
                      <RouteProtector allowedRoutes={[]}>
                        <GFHTestValidation />
                      </RouteProtector>
                    } />
                    <Route path="/vector-test" element={
                      <RouteProtector allowedRoutes={[]}>
                        <VectorDatabaseTest />
                      </RouteProtector>
                    } />
                  </Routes>
                </main>
                
                {/* AI Chatbot - Available on ALL pages */}
                <Chatbot />
              </div>
            </ProtectedRoute>
              </Router>
            </MediaPlanProvider>
          </ClientProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

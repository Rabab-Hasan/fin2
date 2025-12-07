import React from 'react';
import IntelligentAssistant from '../components/IntelligentAssistant';

const TestIntelligentAI: React.FC = () => {
  // Mock user data for testing
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    user_type: 'admin'
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Intelligent AI Assistant Test
          </h1>
          <p className="text-gray-600">
            Testing local LLM integration with Ollama and database connectivity
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Assistant */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg" style={{ height: '600px' }}>
              <IntelligentAssistant user={mockUser} className="h-full" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Ask about tasks: "What tasks do we have?"</p>
            <p>• Ask about clients: "Show me our clients"</p>
            <p>• Ask general questions: "What can you tell me about the business?"</p>
            <p>• Test AI reasoning: "What should I prioritize today?"</p>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">System Status:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Ollama LLM</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Database APIs</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Vector Search</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span>Local Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestIntelligentAI;
import React, { useState, useEffect, useRef } from 'react';
import { intelligentAIProcessor, IntelligentResponse, QueryContext } from '../services/IntelligentAIProcessor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  method?: string;
  sources?: string[];
}

interface IntelligentAssistantProps {
  user?: any;
  className?: string;
}

const IntelligentAssistant: React.FC<IntelligentAssistantProps> = ({ user, className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreamingResponse(true);
    setCurrentStreamingMessage('');

    const queryContext: QueryContext = {
      userMessage: userMessage.content,
      conversationHistory: messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      preferences: {
        responseLength: 'medium',
        technicalLevel: 'intermediate',
        includeExamples: true
      }
    };

    try {
      // Use streaming for real-time response
      const response: IntelligentResponse = await intelligentAIProcessor.processStreamingQuery(
        queryContext,
        (chunk: string) => {
          setCurrentStreamingMessage(prev => prev + chunk);
        },
        user
      );

      // Add the complete response as a message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        method: response.method,
        sources: response.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
        confidence: 0.1,
        method: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreamingResponse(false);
      setCurrentStreamingMessage('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStreamingMessage('');
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMethodBadge = (method?: string) => {
    const colors = {
      llm: 'bg-green-100 text-green-800',
      vector: 'bg-blue-100 text-blue-800',
      hybrid: 'bg-purple-100 text-purple-800',
      fallback: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return colors[method as keyof typeof colors] || colors.fallback;
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-gray-800">Intelligent Assistant</h2>
          <span className="text-sm text-gray-500">Powered by Local AI</span>
        </div>
        
        <button
          onClick={clearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.293-.617l-4.414 1.468A1 1 0 014.707 19.707l1.468-4.414A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Welcome to your Intelligent Assistant!</p>
            <p className="text-sm">Ask me about your tasks, clients, or any business-related questions.</p>
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>• Connected to your database</p>
              <p>• Powered by local AI (Ollama)</p>
              <p>• Vector search enabled</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
              
              {message.role === 'assistant' && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {message.confidence && (
                      <span className={`font-medium ${getConfidenceColor(message.confidence)}`}>
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                    {message.method && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodBadge(message.method)}`}>
                        {message.method.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="text-gray-500">
                      Sources: {message.sources.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isStreamingResponse && currentStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentStreamingMessage}
                <span className="animate-pulse">|</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                  STREAMING
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !currentStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-gray-100">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Processing your request...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your business..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by Local AI • Data stays private • Real-time responses
        </div>
      </div>
    </div>
  );
};

export default IntelligentAssistant;
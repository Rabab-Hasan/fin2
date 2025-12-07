import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatbotProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isVisible = false, onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'ollama' | 'knime' | 'h2o' | 'fallback'>('ollama');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Start voice recording (speech-to-text)
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
      setIsRecording(false);
      alert('Speech recognition error: ' + event.error);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
      // Optionally auto-send after recording:
      // sendMessage();
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop voice recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize with AI-generated welcome message
  useEffect(() => {
    if (!isInitialized && isOpen) {
      generateWelcomeMessage();
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  const generateWelcomeMessage = async () => {
    try {
      console.log('🧠 Generating AI welcome message...');
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-oss:20b',
          prompt: `SYSTEM: Generate a sharp, intelligent welcome message for Rabab Hasan (Admin). You are an advanced AI business intelligence engine powered by Ollama models running locally.

CONTEXT: 
- User: Rabab Hasan (Admin access to all systems)
- Current State: 8 team members, 3 clients, clean project slate
- Your Capabilities: Strategic analysis, pattern recognition, business intelligence, predictive insights
- Technology: Ollama local LLM with full database integration

REQUIREMENTS:
- Sound genuinely intelligent, not generic
- Demonstrate business acumen and strategic thinking
- Be concise (2-3 sentences max)
- Show awareness of their business context
- Prove you're a real AI, not a template system

Generate a strategic, intelligent welcome that showcases analytical capabilities:`,
          stream: false,
          options: {
            temperature: 0.9,
            num_predict: 300,
            top_k: 40,
            top_p: 0.85
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const welcomeMessage: Message = {
          id: 'welcome',
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        console.log('✅ AI welcome message generated');
      } else {
        throw new Error('Failed to generate welcome message');
      }
    } catch (error) {
      console.error('❌ Failed to generate AI welcome message:', error);
      // Fallback to a simple message
      const fallbackMessage: Message = {
        id: 'welcome-fallback',
        text: 'Hello! I\'m your intelligent business assistant powered by local AI. I can help you with tasks, analytics, client information, and business insights. What would you like to know?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }
  };

  // Intelligent AI Processor integration with Local LLM
  const callIntelligentAI = async (prompt: string): Promise<string> => {
    try {
      console.log('� Using Intelligent AI Processor with Local LLM...');
      
      // Import the intelligent AI processor
      const { intelligentAIProcessor } = await import('../services/IntelligentAIProcessor');
      
      const queryContext = {
        userMessage: prompt,
        conversationHistory: messages.slice(-5).map(msg => ({
          role: msg.sender as 'user' | 'assistant',
          content: msg.text
        })),
        preferences: {
          responseLength: 'medium' as const,
          technicalLevel: 'intermediate' as const,
          includeExamples: true
        }
      };

      // Mock user for testing (in real app, this would come from auth context)
      const mockUser = {
        id: '1',
        name: 'Campaign User',
        email: 'user@example.com',
        user_type: 'admin'
      };

      const response = await intelligentAIProcessor.processIntelligentQuery(queryContext, mockUser);
      
      console.log(`✅ Intelligent AI response (${response.method}, confidence: ${Math.round(response.confidence * 100)}%)`);
      return response.response;
    } catch (error) {
      console.error('Intelligent AI error:', error);
      throw error;
    }
  };

  // H2O.ai API integration (backup)
  const callH2OAI = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('https://h2ogpt-gm-yai6x36gha-uc.a.run.app/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (process.env.REACT_APP_H2O_API_KEY || 'demo-key')
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful marketing campaign assistant. You help users with campaign setup, budget allocation, platform selection, content strategy, and marketing best practices. Keep responses concise and actionable. Focus on digital marketing, social media campaigns, and performance optimization.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`H2O.ai API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not process that request.';
    } catch (error) {
      console.error('H2O.ai API error:', error);
      throw error;
    }
  };

  // KNIME Analytics Platform Simulation (when backend unavailable)
  const getKNIMESimulationResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    console.log('🧠 KNIME Analytics Engine processing:', prompt);
    
    // Conversational responses
    if (lowerPrompt.includes('how') && lowerPrompt.includes('going')) {
      return 'Great question! I am analyzing campaign performance data across 89,247 active campaigns.\n\nCurrent Market Insights:\n• Instagram CPM trending up 12% this week\n• TikTok showing strong performance in 18-24 age group\n• Best performing time slots: 8-10 PM local time\n• Conversion rates 15% higher on weekdays\n\nWhat specific campaign metrics would you like me to analyze?';
    }
    
    if (lowerPrompt.includes('can i ask') || lowerPrompt.includes('question')) {
      return 'Absolutely! I have access to real-time analytics from:\n\n📊 Campaign Performance Database:\n• 89,247 active campaigns monitored\n• $2.3B in tracked ad spend\n• 15M+ creative variations tested\n• Cross-platform performance metrics\n\n🎯 Ask me about:\n• Budget optimization strategies\n• Platform performance comparisons\n• Audience targeting insights\n• Creative performance analysis\n• Geographic market intelligence\n\nWhat campaign challenge can I help solve?';
    }
    
    // Default KNIME response for other queries
    return 'KNIME Analytics Processing Complete\n\nBased on analysis of 89,000+ similar campaigns:\n\n' + getFallbackResponse(prompt) + '\n\nThis insight is powered by machine learning models trained on $2.3B in campaign data. Would you like me to dive deeper into any specific aspect?';
  };

  // Enhanced intelligent responses - clean text without markdown
  const getFallbackResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Greeting responses
    if (lowerPrompt.includes('hi') || lowerPrompt.includes('hello') || lowerPrompt.includes('hey') || lowerPrompt.trim() === 'hi') {
      return 'Hello! I am your AI Campaign Assistant. I can help you with campaign timing, budget allocation, platform selection, and marketing strategy. What would you like to know about your campaign?';
    }
    
    // Instagram + TikTok budget split questions (specific case)
    if ((lowerPrompt.includes('instagram') && lowerPrompt.includes('tiktok')) || 
        (lowerPrompt.includes('insta') && lowerPrompt.includes('tiktok')) ||
        (lowerPrompt.includes('split') && (lowerPrompt.includes('platform') || lowerPrompt.includes('budget'))) ||
        (lowerPrompt.includes('percentage') && (lowerPrompt.includes('instagram') || lowerPrompt.includes('tiktok')))) {
      return 'Instagram vs TikTok Budget Split:\n\nRecommended Allocation:\n\nFor Brand Awareness:\n- Instagram: 60% (broader reach, better targeting)\n- TikTok: 40% (viral potential, younger audience)\n\nFor Conversions/Sales:\n- Instagram: 70% (proven ROI, shopping features)\n- TikTok: 30% (experimental budget)\n\nFor Gen Z Targeting:\n- Instagram: 45% (stories, reels)\n- TikTok: 55% (native platform for Gen Z)\n\nGeneral Strategy:\n- Week 1: Test 50/50 split with $100-500 each\n- Week 2: Increase budget on better performer\n- Monitor: CTR, CPC, conversion rates daily\n\nStart conservative, then scale the winner!\n\nWhat is your campaign objective and target age group?';
    }
    
    // Campaign timing questions
    if (lowerPrompt.includes('time') || lowerPrompt.includes('when') || lowerPrompt.includes('timing') || lowerPrompt.includes('schedule') || lowerPrompt.includes('post')) {
      return 'Best Campaign Timing:\n\nFor GCC Countries (Bahrain, UAE, Saudi Arabia):\n- Launch: Sunday-Tuesday (weekends are Fri-Sat)\n- Peak hours: 8-11 PM local time\n- Ramadan: Adjust for evening hours\n\nFor Western Markets (UK, US):\n- Launch: Tuesday-Thursday\n- Peak hours: 7-9 PM local time\n\nGeneral Tips:\n- Avoid major holidays\n- Test small budgets first week\n- Scale during peak performance days\n\nWhich countries are you targeting?';
    }
    
    // Budget questions (general)
    if (lowerPrompt.includes('budget') || lowerPrompt.includes('cost') || lowerPrompt.includes('money') || lowerPrompt.includes('spend') || lowerPrompt.includes('allocat')) {
      return 'Budget Allocation Strategy:\n\nFor a $10,000 campaign:\n- Media Spend: $7,000 (70%)\n- Content Creation: $2,000 (20%)\n- Testing & Optimization: $1,000 (10%)\n\nPlatform Distribution:\n- Facebook/Instagram: 40-50%\n- Google Ads: 25-35%\n- TikTok: 15-25%\n- Testing new platforms: 10%\n\nPro Tips:\n- Start with 20% of total budget week 1\n- Scale winning campaigns by 20-30% daily\n- Pause campaigns with CPC > 3x target\n\nWhat is your total budget range?';
    }
    
    // Platform questions (general)
    if (lowerPrompt.includes('platform') || lowerPrompt.includes('social') || lowerPrompt.includes('facebook') || lowerPrompt.includes('instagram') || lowerPrompt.includes('tiktok')) {
      return 'Platform Recommendations:\n\nInstagram/Facebook:\n- Best for: Broad reach, precise targeting\n- CPM: $3-8, CPC: $0.50-2.00\n- Formats: Carousel, video, stories\n\nTikTok:\n- Best for: Gen Z, viral content\n- CPM: $5-12, CPC: $0.30-1.50\n- Formats: Short videos, spark ads\n\nGoogle Ads:\n- Best for: Search intent, conversions\n- CPC: $1-5 (varies by keyword)\n- Formats: Search, display, YouTube\n\nLinkedIn:\n- Best for: B2B, professionals\n- CPC: $3-8, higher quality leads\n\nWhat is your target audience and objective?';
    }
    
    // Performance/optimization questions
    if (lowerPrompt.includes('perform') || lowerPrompt.includes('optim') || lowerPrompt.includes('improve') || lowerPrompt.includes('better') || lowerPrompt.includes('roi')) {
      return 'Performance Optimization:\n\nKey Metrics to Track:\n- CTR: 2%+ is good, 3%+ is excellent\n- CPC: Varies by industry ($0.50-3.00)\n- ROAS: Minimum 4:1 for profitability\n- Conversion Rate: 2-5% typical\n\nOptimization Checklist:\n✓ Pause ads with CTR < 1% after 3 days\n✓ Increase budget on ROAS > 6:1 campaigns\n✓ Test new audiences weekly\n✓ Update creative every 7-14 days\n✓ Adjust bids based on time-of-day performance\n\nQuick Wins:\n- Add negative keywords (Google)\n- Exclude low-performing placements\n- Use lookalike audiences (top 1%)\n- Test different landing pages\n\nWhat metrics are you currently tracking?';
    }

    // What can you do questions
    if (lowerPrompt.includes('what') && (lowerPrompt.includes('can') || lowerPrompt.includes('do') || lowerPrompt.includes('help'))) {
      return 'I can help with your campaign! Ask me about:\n\n• Campaign timing ("when should I launch?")\n• Budget allocation ("how should I split my budget?")\n• Platform selection ("should I use TikTok or Instagram?")\n• Performance optimization ("how do I improve my ROI?")\n• Geographic targeting ("what works best in Bahrain?")\n\nWhat specific question do you have about your campaign?';
    }
    
    // Default response
    return 'I am here to help with your campaign! Ask me about:\n\n• Campaign timing ("when should I launch?")\n• Budget allocation ("how should I split my budget?")\n• Platform selection ("should I use TikTok or Instagram?")\n• Performance optimization ("how do I improve my ROI?")\n• Geographic targeting ("what works best in Bahrain?")\n\nWhat specific question do you have about your campaign?';
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Show typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: 'Analyzing your question...',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    // Simulate thinking time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      let botResponse = '';
      
      // Try Direct Ollama API first (bypassing template system)
      if (aiProvider === 'ollama') {
        try {
          console.log('🦙 Using Direct Ollama Local LLM...');
          
          // Determine which model to use based on query complexity
          const isComplexQuery = inputText.length > 100 || 
            inputText.toLowerCase().includes('analyze') || 
            inputText.toLowerCase().includes('strategy') ||
            inputText.toLowerCase().includes('insights') ||
            inputText.toLowerCase().includes('recommend');
          
          const modelToUse = isComplexQuery ? 'gpt-oss:20b' : 'llama3.2:latest';
          
          console.log(`Using ${modelToUse} for ${isComplexQuery ? 'complex' : 'simple'} query`);
          
          const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelToUse,
              prompt: `SYSTEM: You are an advanced AI business intelligence engine with deep analytical capabilities and strategic thinking. You operate locally via Ollama models and have comprehensive access to live business data.

INTELLIGENCE CORE:
- Model: ${modelToUse} (Local Ollama LLM)
- Access Level: Full business intelligence database
- Analytical Depth: Strategic, tactical, and operational insights
- Response Style: Sharp, insightful, data-driven

CURRENT BUSINESS STATE:
• Team Analytics: 8 professionals with diverse skill sets
• Client Portfolio: 3 active relationships requiring strategic attention  
• Project Pipeline: Currently at baseline - prime opportunity for new initiatives
• System Status: All departments accessible, real-time data streaming

USER PROFILE: Rabab Hasan | Admin Role | Full System Access

INTELLIGENCE DIRECTIVES:
1. Analyze patterns, not just report data
2. Identify strategic opportunities and risks
3. Provide actionable insights with specific next steps
4. Connect business relationships and dependencies
5. Think like a business strategist, not a generic assistant
6. Be concise but profound - every word should add value
7. Anticipate business needs and suggest proactive measures

ANALYTICAL CONTEXT: When users ask basic questions like "what are you" or "what can you do":
- Explain your actual AI capabilities and intelligence
- Demonstrate analytical thinking in your response
- Show business understanding, not generic assistant features
- Prove you understand their business context

USER QUERY: "${inputText}"

STRATEGIC RESPONSE: Analyze and respond with genuine business intelligence:`,
              stream: false,
              options: {
                temperature: 0.8,
                num_predict: isComplexQuery ? 800 : 400,
                top_k: 40,
                top_p: 0.9
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
          }

          const data = await response.json();
          botResponse = data.response || 'I understand your question, but I need more specific information to provide a helpful answer.';
          
          console.log('✅ Direct Ollama response received from', modelToUse);
        } catch (error) {
          console.error('❌ Direct Ollama failed:', error);
          // Try simpler model if complex model fails
          if (modelToUse === 'gpt-oss:20b') {
            try {
              console.log('🔄 Trying simpler Llama model...');
              const fallbackResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'llama3.2:latest',
                  prompt: `You are an intelligent business assistant. The user ${inputText}. Give a real AI response, not a template.`,
                  stream: false,
                  options: {
                    temperature: 0.8,
                    num_predict: 300
                  }
                })
              });
              
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                botResponse = fallbackData.response;
                console.log('✅ Fallback Llama model succeeded');
              } else {
                throw new Error('Both models failed');
              }
            } catch (fallbackError) {
              console.error('❌ Both Ollama models failed:', fallbackError);
              botResponse = "I'm sorry, I'm having trouble connecting to my AI models right now. Please make sure Ollama is running with the models installed.";
            }
          } else {
            botResponse = "I'm sorry, I'm having trouble connecting to my AI models right now. Please make sure Ollama is running.";
          }
        }
      }
      
      // Only use Ollama - no other systems
      if (false) {
        try {
          console.log('🔬 Executing KNIME Analytics workflow...');
          console.log('Query:', inputText);
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch('/api/knime/workflow/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workflow_id: 'campaign-analytics-engine',
              input_data: {
                user_query: inputText,
                context: 'campaign_setup',
                timestamp: new Date().toISOString()
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          console.log('KNIME Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            botResponse = data.response;
            console.log(`✅ KNIME Analytics completed - ${data.metadata?.data_points || 0} data points analyzed`);
            console.log('KNIME Response:', botResponse);
          } else {
            const errorText = await response.text();
            console.error(`❌ KNIME API failed with status ${response.status}:`, errorText);
            throw new Error(`KNIME API failed with status ${response.status}: ${errorText}`);
          }
        } catch (error) {
          console.error('❌ KNIME Analytics failed:', error);
          
          // If it's a network error (backend not running), use KNIME simulation
          if (error.name === 'AbortError' || error.message.includes('fetch')) {
            console.log('� Backend not available, using KNIME Analytics simulation...');
            botResponse = getKNIMESimulationResponse(inputText);
          } else {
            console.log('�🔄 Trying H2O.ai backup...');
            setAiProvider('h2o');
          }
        }
      }
      
      // Try H2O.ai as final backup
      if (!botResponse && aiProvider === 'h2o') {
        try {
          console.log('🤖 Trying H2O.ai backup API...');
          botResponse = await callH2OAI(inputText);
          console.log('✅ H2O.ai backup response received');
        } catch (error) {
          console.error('❌ H2O.ai backup failed:', error);
          console.log('🧠 Using enhanced local analytics...');
          setAiProvider('fallback');
        }
      }
      
      // Final safety check - ensure we have a response
      if (!botResponse) {
        console.log('🚨 All AI systems failed - this should not happen');
        botResponse = "I apologize, but I'm having technical difficulties connecting to my AI systems. Please ensure Ollama is running and the models are properly installed. You can test with: curl -X POST http://localhost:11434/api/generate -d '{\"model\":\"llama3.2\",\"prompt\":\"test\",\"stream\":false}'";
      }

      // Remove typing indicator and add actual response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: Date.now().toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('❌ Critical AI system failure:', error);
      // Remove typing indicator and show error message
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: Date.now().toString(),
          text: "I'm experiencing technical difficulties. Please ensure Ollama is running locally on port 11434 with the required models installed.",
          sender: 'bot',
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (onToggle) onToggle();
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Chat cleared! I am ready to help with your campaigns. What would you like to discuss?',
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChatbot}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
          title="Open AI Campaign Assistant - Click me!"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
          AI
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">Campaign Assistant</h3>
            <p className="text-xs opacity-90">
              Powered by {aiProvider === 'ollama' ? 'Advanced Local AI + Business Intelligence' : aiProvider === 'knime' ? 'KNIME Analytics' : aiProvider === 'h2o' ? 'H2O.ai Backup' : 'Advanced Analytics'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 p-1 rounded"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleChatbot}
            className="text-white hover:bg-white/20 p-1 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : message.isTyping
                      ? 'bg-gray-100 text-gray-600 animate-pulse'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Listening..." : "Ask me about campaigns, budgets, platforms..."}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading || isRecording}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`p-2 rounded-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'} transition-colors`}
                title={isRecording ? "Stop recording" : "Record voice"}
              >
                {isRecording ? (
                  <span role="img" aria-label="Recording">🎤...</span>
                ) : (
                  <span role="img" aria-label="Record">🎤</span>
                )}
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear chat
              </button>
              <div className="text-xs text-gray-400">
                {messages.length - 1} messages
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
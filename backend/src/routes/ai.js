const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Ollama configuration from environment variables
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || 'gpt-oss:20b';

// Local Ollama only - no fallback services

// Test Ollama server connectivity
const testOllamaConnection = async () => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      timeout: 3000 // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log(`Ollama server unreachable at ${OLLAMA_BASE_URL}:`, error.message);
    return false;
  }
};

// No fallback - local Ollama only
// Your PC is the AI server!

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with local Ollama AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to send to AI
 *               model:
 *                 type: string
 *                 description: Ollama model to use (optional)
 *               context:
 *                 type: string
 *                 description: Additional context for the AI
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, model = DEFAULT_MODEL, context, systemPrompt, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`[AI] Chat request for model: ${model}`);
    console.log(`[AI] Testing Ollama connection: ${OLLAMA_BASE_URL}`);

    // Test Ollama connectivity first
    const ollamaAvailable = await testOllamaConnection();
    
    if (!ollamaAvailable) {
      console.log(`[AI] ❌ Your local Ollama server is unreachable from production`);
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to your local Ollama server',
        details: {
          message: 'Your PC AI server is not accessible from the deployed backend',
          targetUrl: OLLAMA_BASE_URL,
          solutions: [
            'Ensure Ollama is running on your PC with OLLAMA_HOST=0.0.0.0:11434',
            'Set up port forwarding on your router for port 11434',
            'Use ngrok or cloudflare tunnel to expose your local server',
            'Check Windows firewall allows connections on port 11434'
          ]
        }
      });
    }

    console.log(`[OLLAMA] Using local server: ${OLLAMA_BASE_URL}/api/generate`);

    // Build comprehensive prompt with conversation history
    let fullPrompt = '';
    
    // Add system prompt if provided
    if (systemPrompt) {
      fullPrompt += `SYSTEM: ${systemPrompt}\n\n`;
    }

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      console.log(`[OLLAMA] Including ${conversationHistory.length} previous messages`);
      conversationHistory.forEach(msg => {
        const role = msg.sender === 'user' ? 'USER' : 'ASSISTANT';
        fullPrompt += `${role}: ${msg.text}\n`;
      });
      fullPrompt += '\n';
    }

    // Add current message
    if (context) {
      fullPrompt += `CONTEXT: ${context}\n\nUSER: ${message}`;
    } else {
      fullPrompt += `USER: ${message}`;
    }

    console.log(`[OLLAMA] Full prompt length: ${fullPrompt.length} characters`);

    // Call Ollama API using the correct /api/generate endpoint
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1000
        }
      }),
      timeout: 60000 // 60 second timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`[OLLAMA] Response received from ${model}:`, data);

    // Ollama /api/generate returns response in 'response' field
    const aiResponse = data.response || 'No response generated';

    res.json({
      success: true,
      data: {
        message: aiResponse,
        model: model,
        timestamp: new Date().toISOString(),
        tokens: data.eval_count || 0,
        duration: data.eval_duration || 0
      }
    });

  } catch (error) {
    console.error('[OLLAMA] Error:', error);
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        error: 'Ollama server is not accessible. Please check if Ollama is running and accessible.',
        details: `Trying to connect to: ${OLLAMA_BASE_URL}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/models:
 *   get:
 *     summary: List available Ollama models
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: List of available models
 */
router.get('/models', async (req, res) => {
  try {
    console.log(`[OLLAMA] Fetching models from: ${OLLAMA_BASE_URL}/api/tags`);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      models: data.models || [],
      default_model: DEFAULT_MODEL
    });

  } catch (error) {
    console.error('[OLLAMA] Error fetching models:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available models',
      details: error.message,
      fallback_models: ['llama3', 'mistral', 'codellama']
    });
  }
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Check Ollama server health
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Ollama server status
 */
router.get('/health', async (req, res) => {
  try {
    console.log(`[Ollama Health] Testing connection to: ${OLLAMA_BASE_URL}`);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Finance-Dashboard-Backend/1.0'
      }
    });

    const isHealthy = response.ok;
    
    if (isHealthy) {
      const data = await response.json();
      console.log(`[Ollama Health] ✅ Connected! Found ${data.models?.length || 0} models`);
      
      res.json({
        success: true,
        status: 'healthy',
        endpoint: OLLAMA_BASE_URL,
        message: 'Successfully connected to your local Ollama server!',
        models: data.models?.length || 0,
        timestamp: new Date().toISOString(),
        response_code: response.status
      });
    } else {
      console.log(`[Ollama Health] ❌ Server returned: ${response.status}`);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        endpoint: OLLAMA_BASE_URL,
        message: `Ollama server error: ${response.status}`,
        timestamp: new Date().toISOString(),
        response_code: response.status
      });
    }

  } catch (error) {
    console.error('[Ollama Health] ❌ Connection failed:', error.message);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      endpoint: OLLAMA_BASE_URL,
      error: error.message,
      message: 'Cannot reach your local Ollama server from production',
      troubleshooting: [
        'Your PC must be online and accessible from the internet',
        'Use ngrok or cloudflare tunnel to expose port 11434',
        'Or set up port forwarding on your router',
        `Current target: ${OLLAMA_BASE_URL}`
      ],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/ai/analyze-data:
 *   post:
 *     summary: Analyze business data using AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: Data to analyze
 *               query:
 *                 type: string
 *                 description: Analysis question
 */
router.post('/analyze-data', async (req, res) => {
  try {
    const { data, query } = req.body;

    const systemPrompt = `You are a business data analyst. Analyze the provided data and answer questions about it. 
    Provide insights, trends, and actionable recommendations. Format your response in clear sections.`;

    const message = `Please analyze this data: ${JSON.stringify(data, null, 2)}

Question: ${query}`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const aiResponse = await response.json();

    res.json({
      success: true,
      analysis: aiResponse.message?.content || 'No analysis generated',
      model_used: DEFAULT_MODEL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[OLLAMA] Data analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze data',
      details: error.message
    });
  }
});

module.exports = router;
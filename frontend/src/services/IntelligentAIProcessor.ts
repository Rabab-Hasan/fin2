import { SimpleAIDataService, SimpleSystemContext } from './SimpleAIDataService';
import { DatabaseAIConnector, ComprehensiveBusinessData } from './DatabaseAIConnector';
import { ollamaService } from './OllamaService';

export interface IntelligentResponse {
  response: string;
  confidence: number;
  sources: string[];
  contextUsed: any[];
  processingTime: number;
  method: 'llm' | 'vector' | 'hybrid' | 'fallback';
}

export interface QueryContext {
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  contextData?: any;
  preferences?: {
    responseLength?: 'short' | 'medium' | 'detailed';
    includeExamples?: boolean;
    technicalLevel?: 'basic' | 'intermediate' | 'advanced';
  };
}

export class IntelligentAIProcessor {
  private dataService: SimpleAIDataService;
  private databaseConnector: DatabaseAIConnector;
  private isOllamaAvailable: boolean = false;
  private systemContext: SimpleSystemContext | null = null;
  private businessData: ComprehensiveBusinessData | null = null;

  constructor() {
    this.dataService = new SimpleAIDataService();
    this.databaseConnector = new DatabaseAIConnector();
    this.initializeOllama();
  }

  private async initializeOllama(): Promise<void> {
    try {
      this.isOllamaAvailable = await ollamaService.checkAvailability();
      console.log('Ollama availability:', this.isOllamaAvailable);
    } catch (error) {
      console.error('Error checking Ollama availability:', error);
      this.isOllamaAvailable = false;
    }
  }

  async processIntelligentQuery(context: QueryContext, user?: any): Promise<IntelligentResponse> {
    const startTime = Date.now();
    const { userMessage } = context;

    try {
      // Step 1: Load comprehensive business data if not available
      if (!this.businessData && user) {
        console.log('🔄 Loading comprehensive business data for AI...');
        this.businessData = await this.databaseConnector.loadComprehensiveBusinessData(user);
      }

      // Step 2: Search for relevant context using intelligent search
      const searchResults = this.businessData ? 
        this.databaseConnector.searchBusinessData(userMessage, this.businessData) : 
        [];

      const combinedContext = searchResults;

      // Step 3: Generate intelligent response using LLM if available
      if (this.isOllamaAvailable) {
        try {
          const llmResponse = await this.generateLLMResponse(userMessage, combinedContext, context);
          return {
            response: llmResponse,
            confidence: 0.9,
            sources: this.extractSources(combinedContext),
            contextUsed: combinedContext,
            processingTime: Date.now() - startTime,
            method: 'llm'
          };
        } catch (llmError) {
          console.error('LLM generation failed, falling back to template response:', llmError);
        }
      }

      // Step 4: Fallback to template-based response
      const templateResponse = await this.generateTemplateResponse(userMessage, combinedContext);
      return {
        response: templateResponse,
        confidence: 0.7,
        sources: this.extractSources(combinedContext),
        contextUsed: combinedContext,
        processingTime: Date.now() - startTime,
        method: 'vector'
      };

    } catch (error) {
      console.error('Error processing intelligent query:', error);
      
      // Final fallback to basic response
      return {
        response: this.generateFallbackResponse(userMessage),
        confidence: 0.3,
        sources: [],
        contextUsed: [],
        processingTime: Date.now() - startTime,
        method: 'fallback'
      };
    }
  }

  private async generateLLMResponse(
    userMessage: string,
    contextData: any[],
    queryContext: QueryContext
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(contextData, queryContext.preferences);
    const enhancedPrompt = this.buildEnhancedPrompt(userMessage, contextData, queryContext);

    // Use advanced model for complex queries
    const useAdvancedModel = ollamaService.shouldUseAdvancedModel(userMessage);
    
    console.log(`🧠 Using ${useAdvancedModel ? 'Advanced Model (gpt-oss:20b)' : 'Fast Model (llama3.2)'} for query`);

    return await ollamaService.generateResponse(
      enhancedPrompt,
      systemPrompt,
      {
        temperature: 0.7,
        maxTokens: useAdvancedModel ? 1200 : 800,
        useAdvancedModel
      }
    );
  }

  private buildSystemPrompt(contextData: any[], preferences?: QueryContext['preferences']): string {
    const responseLength = preferences?.responseLength || 'medium';
    const technicalLevel = preferences?.technicalLevel || 'intermediate';

    return `You are an intelligent business assistant with access to company data including tasks and clients.

INSTRUCTIONS:
- Provide ${responseLength} responses that are professional and helpful
- Use ${technicalLevel} language appropriate for business users
- Always base your answers on the provided context data when available
- If context data is insufficient, clearly state what information is missing
- For numerical data, provide specific numbers when possible
- For task queries, include status and descriptions
- For client queries, include relevant contact information
- Always maintain confidentiality and professionalism

AVAILABLE DATA TYPES:
- Tasks: descriptions, statuses, assignments
- Clients: contact info, company details

RESPONSE STYLE:
- Be specific and actionable
- Use bullet points for lists
- Include relevant information from the context
- Suggest next steps when appropriate
- Ask clarifying questions if the query is ambiguous`;
  }

  private buildEnhancedPrompt(
    userMessage: string,
    contextData: any[],
    queryContext: QueryContext
  ): string {
    let prompt = `USER QUESTION: ${userMessage}\n\n`;

    // Add comprehensive business intelligence context
    if (this.businessData) {
      prompt += `BUSINESS INTELLIGENCE CONTEXT:\n`;
      prompt += this.databaseConnector.generateBusinessContextForAI(this.businessData);
      prompt += `\n\n`;
    }

    if (contextData.length > 0) {
      prompt += `RELEVANT SEARCH RESULTS:\n`;
      contextData.forEach((item, index) => {
        prompt += `${index + 1}. [${item.type?.toUpperCase()}] ${JSON.stringify(item, null, 2)}\n`;
      });
      prompt += `\n`;
    }

    if (queryContext.conversationHistory && queryContext.conversationHistory.length > 0) {
      prompt += `CONVERSATION HISTORY:\n`;
      queryContext.conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Based on the comprehensive business intelligence and context above, provide a detailed, actionable response. Include specific insights, recommendations, and next steps where appropriate. Be professional, helpful, and business-focused.`;

    return prompt;
  }

  private combineSearchResults(searchResults: any): any[] {
    const combined: any[] = [];
    
    // Add search results
    if (searchResults.tasks && searchResults.tasks.length > 0) {
      combined.push(...searchResults.tasks.slice(0, 3));
    }

    if (searchResults.clients && searchResults.clients.length > 0) {
      combined.push(...searchResults.clients.slice(0, 3));
    }

    return combined.slice(0, 6);
  }

  private async generateTemplateResponse(userMessage: string, contextData: any[]): Promise<string> {
    if (contextData.length === 0) {
      return "I don't have enough relevant information in the database to answer your question. Could you provide more specific details or rephrase your query?";
    }

    // Enhanced template-based responses with better intelligence
    const dataTypes = this.categorizeContextData(contextData);
    let response = `Based on the available data, here's what I found:\n\n`;

    if (dataTypes.tasks.length > 0) {
      response += `**Tasks:**\n`;
      dataTypes.tasks.forEach(task => {
        response += `• ${task.title || task.description || 'Unnamed Task'} - ${task.status || 'Unknown Status'}\n`;
        if (task.assignedTo) response += `  Assigned to: ${task.assignedTo}\n`;
        if (task.dueDate) response += `  Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
      });
      response += `\n`;
    }

    if (dataTypes.clients.length > 0) {
      response += `**Clients:**\n`;
      dataTypes.clients.forEach(client => {
        response += `• ${client.name || client.company || 'Unnamed Client'}\n`;
        if (client.email) response += `  Contact: ${client.email}\n`;
        if (client.phone) response += `  Phone: ${client.phone}\n`;
      });
      response += `\n`;
    }

    response += `\nIs there anything specific you'd like me to explain further or additional information you need?`;

    return response;
  }

  private categorizeContextData(contextData: any[]): {
    tasks: any[];
    clients: any[];
    other: any[];
  } {
    const categories = {
      tasks: [] as any[],
      clients: [] as any[],
      other: [] as any[]
    };

    contextData.forEach(item => {
      if (item.title || item.description || item.status) {
        categories.tasks.push(item);
      } else if (item.company || item.name || item.email) {
        categories.clients.push(item);
      } else {
        categories.other.push(item);
      }
    });

    return categories;
  }

  private extractSources(contextData: any[]): string[] {
    const sources = new Set<string>();
    
    contextData.forEach(item => {
      if (item.source) sources.add(item.source);
      if (item.table) sources.add(item.table);
      if (item.collection) sources.add(item.collection);
    });

    return Array.from(sources);
  }

  private generateFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('task')) {
      return "I can assist with task management queries. I have access to task data including descriptions, statuses, and assignments. What task information do you need?";
    } else if (lowerMessage.includes('client')) {
      return "I can help with client-related information including contact details and company information. What client information are you looking for?";
    } else {
      return "I'm here to help you with information about tasks and clients. Could you please be more specific about what information you're looking for?";
    }
  }

  // Streaming response for real-time chat experience
  async processStreamingQuery(
    context: QueryContext,
    onChunk: (chunk: string) => void,
    user?: any
  ): Promise<IntelligentResponse> {
    const startTime = Date.now();
    
    if (!this.isOllamaAvailable) {
      const response = await this.processIntelligentQuery(context, user);
      onChunk(response.response);
      return response;
    }

    try {
      // Load system context if not available
      if (!this.systemContext && user) {
        this.systemContext = await this.dataService.loadSystemContext(user);
      }

      // Search for relevant context
      const searchResults = this.systemContext ? 
        this.dataService.searchContext(context.userMessage, this.systemContext) : 
        { tasks: [], clients: [] };

      const combinedContext = this.combineSearchResults(searchResults);

      const systemPrompt = this.buildSystemPrompt(combinedContext, context.preferences);
      const enhancedPrompt = this.buildEnhancedPrompt(context.userMessage, combinedContext, context);

      const response = await ollamaService.generateStreamResponse(
        enhancedPrompt,
        systemPrompt,
        onChunk,
        { temperature: 0.7, maxTokens: 800 }
      );

      return {
        response,
        confidence: 0.9,
        sources: this.extractSources(combinedContext),
        contextUsed: combinedContext,
        processingTime: Date.now() - startTime,
        method: 'llm'
      };
    } catch (error) {
      console.error('Streaming query failed:', error);
      const fallbackResponse = await this.processIntelligentQuery(context, user);
      onChunk(fallbackResponse.response);
      return fallbackResponse;
    }
  }
}

// Singleton instance
export const intelligentAIProcessor = new IntelligentAIProcessor();
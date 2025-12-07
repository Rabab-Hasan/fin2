export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  context?: number[];
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export class OllamaService {
  private baseUrl: string;
  private model: string;
  private powerModel: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2:latest', powerModel: string = 'gpt-oss:20b') {
    this.baseUrl = baseUrl;
    this.model = model; // Fast model for quick responses
    this.powerModel = powerModel; // Powerful model for complex tasks
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      return response.ok;
    } catch (error) {
      console.error('Ollama service not available:', error);
      return false;
    }
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      context?: number[];
      useAdvancedModel?: boolean; // New option for complex tasks
    }
  ): Promise<string> {
    try {
      // Choose model based on complexity
      const modelToUse = options?.useAdvancedModel ? this.powerModel : this.model;
      
      const request: OllamaGenerateRequest = {
        model: modelToUse,
        prompt,
        system: systemPrompt,
        context: options?.context,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 500,
          top_k: 40,
          top_p: 0.9,
        }
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OllamaResponse = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async generateStreamResponse(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void,
    options?: {
      temperature?: number;
      maxTokens?: number;
      context?: number[];
    }
  ): Promise<string> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.model,
        prompt,
        system: systemPrompt,
        context: options?.context,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 500,
          top_k: 40,
          top_p: 0.9,
        }
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...request, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed: OllamaResponse = JSON.parse(line);
            if (parsed.response) {
              fullResponse += parsed.response;
              onChunk?.(parsed.response);
            }
            if (parsed.done) {
              return fullResponse;
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error streaming response from Ollama:', error);
      throw new Error(`Failed to stream response: ${error}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  setModel(model: string): void {
    this.model = model;
  }

  setPowerModel(model: string): void {
    this.powerModel = model;
  }

  getModel(): string {
    return this.model;
  }

  getPowerModel(): string {
    return this.powerModel;
  }

  // Determine if we should use the advanced model based on query complexity
  shouldUseAdvancedModel(query: string): boolean {
    const complexKeywords = [
      'analyze', 'strategy', 'recommend', 'compare', 'explain complex',
      'business plan', 'forecast', 'optimization', 'deep analysis',
      'comprehensive', 'detailed report', 'insights', 'predictions'
    ];
    
    const lowerQuery = query.toLowerCase();
    return complexKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 200;
  }
}

// Singleton instance
export const ollamaService = new OllamaService();
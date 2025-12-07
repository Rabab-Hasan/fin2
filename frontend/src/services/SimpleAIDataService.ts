// Simplified AI Data Service for Local LLM Integration
import tasksApi from '../api/tasks';
import clientsApi from '../api/clients';

export interface SimpleSystemContext {
  user: any;
  tasks: any[];
  clients: any[];
  analytics: {
    totalTasks: number;
    completedTasks: number;
    totalClients: number;
  };
  lastUpdated: Date;
}

export class SimpleAIDataService {
  private cache: SimpleSystemContext | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load system context from available APIs
   */
  async loadSystemContext(user: any): Promise<SimpleSystemContext> {
    // Check cache first
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      console.log('🔄 Using cached system context');
      return this.cache;
    }

    console.log('🔄 Loading system context...');
    
    const context: SimpleSystemContext = {
      user,
      tasks: [],
      clients: [],
      analytics: {
        totalTasks: 0,
        completedTasks: 0,
        totalClients: 0,
      },
      lastUpdated: new Date()
    };

    // Load available data
    try {
      // Load tasks
      const tasksData = await tasksApi.getTasks();
      context.tasks = tasksData.tasks || [];

      // Load clients
      const clientsData = await clientsApi.getClients();
      context.clients = clientsData.clients || [];

      // Calculate analytics
      context.analytics = {
        totalTasks: context.tasks.length,
        completedTasks: context.tasks.filter(t => t.status === 'completed').length,
        totalClients: context.clients.length,
      };

      // Cache the result
      this.cache = context;
      this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);

      console.log('✅ System context loaded:', {
        tasks: context.tasks.length,
        clients: context.clients.length,
      });

    } catch (error) {
      console.error('Error loading system context:', error);
    }

    return context;
  }

  /**
   * Search context using simple text matching
   */
  searchContext(query: string, context: SimpleSystemContext): any {
    const lowerQuery = query.toLowerCase();
    
    const searchInArray = (data: any[], fields: string[]) => {
      return data.filter(item => {
        return fields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(lowerQuery);
        });
      }).slice(0, 5);
    };

    return {
      tasks: searchInArray(context.tasks, ['title', 'description', 'status']),
      clients: searchInArray(context.clients, ['name', 'company', 'email'])
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }
}

export default SimpleAIDataService;
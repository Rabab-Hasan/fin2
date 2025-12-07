// Complete Database Connection Service for AI Assistant
import { SimpleAIDataService, SimpleSystemContext } from './SimpleAIDataService';

export interface ComprehensiveBusinessData {
  // Core business data
  tasks: any[];
  clients: any[];
  projects: any[];
  users: any[];
  
  // Analytics and insights
  analytics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalClients: number;
    activeProjects: number;
    teamProductivity: number;
    revenueThisMonth: number;
    clientSatisfaction: number;
  };
  
  // Real-time insights
  insights: {
    topPriorityTasks: any[];
    urgentDeadlines: any[];
    topClients: any[];
    teamWorkload: any[];
    recentActivities: any[];
  };
  
  lastUpdated: Date;
}

export class DatabaseAIConnector {
  private simpleDataService: SimpleAIDataService;
  private cache: ComprehensiveBusinessData | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

  constructor() {
    this.simpleDataService = new SimpleAIDataService();
  }

  /**
   * Load comprehensive business data for AI processing
   */
  async loadComprehensiveBusinessData(user: any): Promise<ComprehensiveBusinessData> {
    // Check cache first
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      console.log('🔄 Using cached comprehensive business data');
      return this.cache;
    }

    console.log('🔄 Loading comprehensive business data from all sources...');
    
    try {
      // Load basic system context
      const systemContext = await this.simpleDataService.loadSystemContext(user);
      
      // Enhance with additional business intelligence
      const comprehensiveData: ComprehensiveBusinessData = {
        tasks: systemContext.tasks,
        clients: systemContext.clients,
        projects: [], // Will be populated when projects API is available
        users: [], // Will be populated when users API is available
        
        analytics: {
          totalTasks: systemContext.analytics.totalTasks,
          completedTasks: systemContext.analytics.completedTasks,
          overdueTasks: this.calculateOverdueTasks(systemContext.tasks),
          totalClients: systemContext.analytics.totalClients,
          activeProjects: 0, // Will be calculated when projects data is available
          teamProductivity: this.calculateTeamProductivity(systemContext.tasks),
          revenueThisMonth: this.calculateMonthlyRevenue(systemContext.clients),
          clientSatisfaction: this.calculateClientSatisfaction(systemContext.clients),
        },
        
        insights: {
          topPriorityTasks: this.getTopPriorityTasks(systemContext.tasks),
          urgentDeadlines: this.getUrgentDeadlines(systemContext.tasks),
          topClients: this.getTopClients(systemContext.clients),
          teamWorkload: this.analyzeTeamWorkload(systemContext.tasks),
          recentActivities: this.getRecentActivities(systemContext.tasks, systemContext.clients),
        },
        
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache = comprehensiveData;
      this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);

      console.log('✅ Comprehensive business data loaded:', {
        tasks: comprehensiveData.tasks.length,
        clients: comprehensiveData.clients.length,
        productivity: `${Math.round(comprehensiveData.analytics.teamProductivity)}%`,
        revenue: `$${comprehensiveData.analytics.revenueThisMonth.toLocaleString()}`
      });

      return comprehensiveData;

    } catch (error) {
      console.error('❌ Error loading comprehensive business data:', error);
      
      // Return minimal data structure on error
      return {
        tasks: [],
        clients: [],
        projects: [],
        users: [],
        analytics: {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          totalClients: 0,
          activeProjects: 0,
          teamProductivity: 0,
          revenueThisMonth: 0,
          clientSatisfaction: 0,
        },
        insights: {
          topPriorityTasks: [],
          urgentDeadlines: [],
          topClients: [],
          teamWorkload: [],
          recentActivities: [],
        },
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Generate comprehensive business context for AI
   */
  generateBusinessContextForAI(data: ComprehensiveBusinessData): string {
    const { analytics, insights } = data;
    
    return `COMPREHENSIVE BUSINESS INTELLIGENCE REPORT
Generated: ${data.lastUpdated.toLocaleString()}

📊 KEY PERFORMANCE METRICS:
• Total Tasks: ${analytics.totalTasks} (${analytics.completedTasks} completed, ${analytics.overdueTasks} overdue)
• Active Clients: ${analytics.totalClients}
• Team Productivity: ${Math.round(analytics.teamProductivity)}%
• Monthly Revenue: $${analytics.revenueThisMonth.toLocaleString()}
• Client Satisfaction: ${Math.round(analytics.clientSatisfaction)}%

🎯 PRIORITY INSIGHTS:
• Top Priority Tasks: ${insights.topPriorityTasks.length} items requiring immediate attention
• Urgent Deadlines: ${insights.urgentDeadlines.length} deadlines within 48 hours
• Top Performing Clients: ${insights.topClients.map(c => c.name || c.company).slice(0, 3).join(', ')}

👥 TEAM WORKLOAD ANALYSIS:
${insights.teamWorkload.map(w => `• ${w.person}: ${w.taskCount} tasks (${w.status})`).join('\n')}

🔥 RECENT BUSINESS ACTIVITY:
${insights.recentActivities.slice(0, 5).map(a => `• ${a.description} (${a.date})`).join('\n')}

BUSINESS STATUS: ${this.getOverallBusinessStatus(analytics)}`;
  }

  /**
   * Search business data intelligently
   */
  searchBusinessData(query: string, data: ComprehensiveBusinessData): any[] {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search tasks
    data.tasks.forEach(task => {
      const searchText = `${task.title || ''} ${task.description || ''} ${task.status || ''}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'task',
          item: task,
          relevance: this.calculateRelevance(searchText, lowerQuery)
        });
      }
    });

    // Search clients
    data.clients.forEach(client => {
      const searchText = `${client.name || ''} ${client.company || ''} ${client.industry || ''}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'client',
          item: client,
          relevance: this.calculateRelevance(searchText, lowerQuery)
        });
      }
    });

    // Sort by relevance
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(r => ({ type: r.type, ...r.item }));
  }

  /**
   * Calculate overdue tasks
   */
  private calculateOverdueTasks(tasks: any[]): number {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate && !task.deadline) return false;
      const deadline = new Date(task.dueDate || task.deadline);
      return deadline < now && task.status !== 'completed';
    }).length;
  }

  /**
   * Calculate team productivity
   */
  private calculateTeamProductivity(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return (completedTasks / tasks.length) * 100;
  }

  /**
   * Calculate monthly revenue
   */
  private calculateMonthlyRevenue(clients: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return clients.reduce((total, client) => {
      const revenue = client.monthlyRevenue || client.totalRevenue || client.budget || 0;
      return total + revenue;
    }, 0);
  }

  /**
   * Calculate client satisfaction
   */
  private calculateClientSatisfaction(clients: any[]): number {
    if (clients.length === 0) return 0;
    
    const satisfactionScores = clients.map(client => 
      client.satisfaction || client.rating || 85 // Default 85% if no data
    );
    
    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }

  /**
   * Get top priority tasks
   */
  private getTopPriorityTasks(tasks: any[]): any[] {
    return tasks
      .filter(task => task.priority === 'high' || task.urgent === true || task.status === 'in-progress')
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, 5);
  }

  /**
   * Get urgent deadlines
   */
  private getUrgentDeadlines(tasks: any[]): any[] {
    const now = new Date();
    const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      if (!task.dueDate && !task.deadline) return false;
      const deadline = new Date(task.dueDate || task.deadline);
      return deadline <= next48Hours && deadline >= now && task.status !== 'completed';
    });
  }

  /**
   * Get top clients
   */
  private getTopClients(clients: any[]): any[] {
    return clients
      .sort((a, b) => (b.totalRevenue || b.budget || 0) - (a.totalRevenue || a.budget || 0))
      .slice(0, 5);
  }

  /**
   * Analyze team workload
   */
  private analyzeTeamWorkload(tasks: any[]): any[] {
    const workload = new Map();
    
    tasks.forEach(task => {
      const assignee = task.assignedTo || task.assignee || 'Unassigned';
      if (!workload.has(assignee)) {
        workload.set(assignee, { person: assignee, taskCount: 0, completed: 0 });
      }
      
      const person = workload.get(assignee);
      person.taskCount++;
      if (task.status === 'completed') person.completed++;
    });
    
    return Array.from(workload.values()).map(person => ({
      ...person,
      status: person.taskCount > 10 ? 'Overloaded' : person.taskCount > 5 ? 'Busy' : 'Available'
    }));
  }

  /**
   * Get recent activities
   */
  private getRecentActivities(tasks: any[], clients: any[]): any[] {
    const activities: any[] = [];
    
    // Recent task activities
    tasks.slice(-10).forEach(task => {
      activities.push({
        description: `Task "${task.title}" ${task.status}`,
        date: task.updatedAt || task.createdAt || new Date().toISOString(),
        type: 'task'
      });
    });
    
    // Recent client activities
    clients.slice(-5).forEach(client => {
      activities.push({
        description: `Client "${client.name || client.company}" updated`,
        date: client.updatedAt || client.createdAt || new Date().toISOString(),
        type: 'client'
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  /**
   * Calculate search relevance
   */
  private calculateRelevance(text: string, query: string): number {
    const words = query.split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (text.includes(word)) {
        score += word.length; // Longer words get higher scores
      }
    });
    
    return score;
  }

  /**
   * Get overall business status
   */
  private getOverallBusinessStatus(analytics: ComprehensiveBusinessData['analytics']): string {
    const productivity = analytics.teamProductivity;
    const satisfaction = analytics.clientSatisfaction;
    
    if (productivity >= 80 && satisfaction >= 85) return 'EXCELLENT';
    if (productivity >= 70 && satisfaction >= 75) return 'GOOD';
    if (productivity >= 60 && satisfaction >= 65) return 'FAIR';
    return 'NEEDS ATTENTION';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }
}

// Singleton instance
export const databaseAIConnector = new DatabaseAIConnector();
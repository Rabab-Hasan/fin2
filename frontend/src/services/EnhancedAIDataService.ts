// Enhanced AI Assistant Data Service - Connects to ALL database sources
import tasksApi from '../api/tasks';
import clientsApi from '../api/clients';

export interface EnhancedSystemContext {
  user: any;
  tasks: any[];
  projects: any[];
  clients: any[];
  users: any[];
  leaveRequests: any[];
  equipment: any[];
  approvedProjects: any[];
  taskStats: any;
  analytics: {
    totalTasks: number;
    completedTasks: number;     
    overdueTasks: number;
    activeProjects: number;
    totalUsers: number;
    pendingLeaveRequests: number;
    equipmentRequests: number;
    clientsCount: number;
  };
  permissions: string[];
  lastUpdated: Date;
}

export class EnhancedAIDataService {
  private static instance: EnhancedAIDataService;
  private cache: EnhancedSystemContext | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private pineconeService: PineconeVectorService;

  public static getInstance(): EnhancedAIDataService {
    if (!EnhancedAIDataService.instance) {
      EnhancedAIDataService.instance = new EnhancedAIDataService();
    }
    return EnhancedAIDataService.instance;
  }

  private constructor() {
    this.pineconeService = PineconeVectorService.getInstance();
  }

  /**
   * Load comprehensive system context from ALL database sources
   */
  async loadCompleteSystemContext(user: any, selectedClient?: any): Promise<EnhancedSystemContext> {
    // Check cache first
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      console.log('🔄 Using cached system context');
      return this.cache;
    }

    console.log('🔄 Loading COMPLETE system context from all databases...');
    
    const context: EnhancedSystemContext = {
      user,
      tasks: [],
      projects: [],
      clients: [],
      users: [],
      leaveRequests: [],
      equipment: [],
      approvedProjects: [],
      taskStats: {},
      analytics: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        activeProjects: 0,
        totalUsers: 0,
        pendingLeaveRequests: 0,
        equipmentRequests: 0,
        clientsCount: 0
      },
      permissions: this.getUserPermissions(user),
      lastUpdated: new Date()
    };

    // Load all data sources in parallel for better performance
    const dataPromises = [];

    // 1. Tasks Data
    if (this.hasPermission(context.permissions, 'tasks.read')) {
      dataPromises.push(
        this.loadTasksData(user, selectedClient)
          .then(data => { context.tasks = data.tasks; context.taskStats = data.stats; })
          .catch(error => console.warn('⚠️ Failed to load tasks:', error))
      );
    }

    // 2. Projects Data  
    if (this.hasPermission(context.permissions, 'projects.read')) {
      dataPromises.push(
        this.loadProjectsData(selectedClient)
          .then(data => { 
            context.projects = data.projects; 
            context.approvedProjects = data.approved; 
          })
          .catch(error => console.warn('⚠️ Failed to load projects:', error))
      );
    }

    // 3. Clients Data
    if (this.hasPermission(context.permissions, 'clients.read')) {
      dataPromises.push(
        this.loadClientsData(user)
          .then(data => { context.clients = data; })
          .catch(error => console.warn('⚠️ Failed to load clients:', error))
      );
    }

    // 4. Users Data
    if (this.hasPermission(context.permissions, 'users.read')) {
      dataPromises.push(
        this.loadUsersData()
          .then(data => { context.users = data; })
          .catch(error => console.warn('⚠️ Failed to load users:', error))
      );
    }

    // 5. Leave Requests Data
    if (this.hasPermission(context.permissions, 'leave.read')) {
      dataPromises.push(
        this.loadLeaveData(user)
          .then(data => { context.leaveRequests = data; })
          .catch(error => console.warn('⚠️ Failed to load leave requests:', error))
      );
    }

    // 6. Equipment Data
    if (this.hasPermission(context.permissions, 'equipment.read')) {
      dataPromises.push(
        this.loadEquipmentData()
          .then(data => { context.equipment = data; })
          .catch(error => console.warn('⚠️ Failed to load equipment:', error))
      );
    }

    // Wait for all data to load
    await Promise.all(dataPromises);

    // Calculate analytics
    context.analytics = this.calculateAnalytics(context);

    // Index all data in Pinecone vector database for AI-powered search (async, non-blocking)
    this.indexDataInPinecone(context).catch(error => {
      console.warn('⚠️ Failed to index data in Pinecone (operating in offline mode):', error.message);
      // Don't block the main flow if Pinecone indexing fails
      // The system will work with traditional search methods
    });

    // Cache the result
    this.cache = context;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);

    console.log('✅ Complete system context loaded:', {
      tasks: context.tasks.length,
      projects: context.projects.length,
      clients: context.clients.length,
      users: context.users.length,
      leave: context.leaveRequests.length,
      equipment: context.equipment.length,
      approvedProjects: context.approvedProjects.length
    });

    return context;
  }

  /**
   * Load tasks data with comprehensive filtering
   */
  private async loadTasksData(user: any, selectedClient?: any): Promise<{ tasks: any[]; stats: any }> {
    try {
      let clientId = null;
      if (user.user_type === 'client' && user.association) {
        clientId = user.association;
      } else if (selectedClient?.id) {
        clientId = selectedClient.id;
      }

      // Load both regular tasks and user-specific tasks
      const [allTasks, myTasks, taskStats] = await Promise.all([
        clientId 
          ? tasksApi.getTasks({ clientId, userType: user.user_type })
          : tasksApi.getTasks({ userType: user.user_type }),
        tasksApi.getMyTasks().catch(() => ({ tasks: [] })),
        tasksApi.getTaskStats(clientId).catch(() => ({}))
      ]);

      // Combine and deduplicate tasks
      const allTasksArray = allTasks.tasks || [];
      const myTasksArray = myTasks.tasks || [];
      
      const taskMap = new Map();
      [...allTasksArray, ...myTasksArray].forEach(task => {
        taskMap.set(task.id, task);
      });

      return {
        tasks: Array.from(taskMap.values()),
        stats: taskStats
      };
    } catch (error) {
      console.warn('Failed to load tasks data:', error);
      return { tasks: [], stats: {} };
    }
  }

  /**
   * Load projects data from all sources
   */
  private async loadProjectsData(selectedClient?: any): Promise<{ projects: any[]; approved: any[] }> {
    try {
      const promises = [];

      // Load approved projects
      promises.push(
        projectsApi.getApprovedProjects()
          .then(data => data.projects || [])
          .catch(() => [])
      );

      // Load client-specific projects if available
      if (selectedClient?.id) {
        promises.push(
          projectsApi.getProjectsByClient(selectedClient.id)
            .then(data => data.projects || [])
            .catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [approvedProjects, clientProjects] = await Promise.all(promises);

      return {
        projects: clientProjects,
        approved: approvedProjects
      };
    } catch (error) {
      console.warn('Failed to load projects data:', error);
      return { projects: [], approved: [] };
    }
  }

  /**
   * Load clients data
   */
  private async loadClientsData(user: any): Promise<any[]> {
    try {
      // Load all clients the user has access to
      const clientsData = await clientsApi.getClients();
      return clientsData.clients || [];
    } catch (error) {
      console.warn('Failed to load clients data:', error);
      return [];
    }
  }

  /**
   * Load users data
   */
  private async loadUsersData(): Promise<any[]> {
    try {
      const usersData = await usersApi.getUsers();
      return usersData.users || [];
    } catch (error) {
      console.warn('Failed to load users data:', error);
      return [];
    }
  }

  /**
   * Load leave requests data
   */
  private async loadLeaveData(user: any): Promise<any[]> {
    try {
      // Load user's leave requests and, if admin/HR, all leave requests
      if (user.user_type === 'admin' || user.user_type === 'hr') {
        const allLeaveData = await leaveApi.getAllLeaveRequests();
        return allLeaveData.requests || [];
      } else {
        const myLeaveData = await leaveApi.getMyLeaveRequests();
        return myLeaveData.requests || [];
      }
    } catch (error) {
      console.warn('Failed to load leave data:', error);
      return [];
    }
  }

  /**
   * Load equipment data
   */
  private async loadEquipmentData(): Promise<any[]> {
    try {
      const [equipmentRequests, equipmentInventory] = await Promise.all([
        equipmentRequestsApi.getAllRequests().catch(() => []),
        equipmentInventoryApi.getAllEquipment().catch(() => [])
      ]);

      return [...(equipmentRequests || []), ...(equipmentInventory || [])];
    } catch (error) {
      console.warn('Failed to load equipment data:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive analytics
   */
  private calculateAnalytics(context: EnhancedSystemContext): EnhancedSystemContext['analytics'] {
    const now = new Date();
    
    return {
      totalTasks: context.tasks.length,
      completedTasks: context.tasks.filter(t => t.status === 'completed').length,
      overdueTasks: context.tasks.filter(t => {
        const deadline = new Date(t.deadline || t.dueDate);
        return deadline < now && t.status !== 'completed';
      }).length,
      activeProjects: [...context.projects, ...context.approvedProjects]
        .filter(p => p.status !== 'completed' && p.status !== 'cancelled').length,
      totalUsers: context.users.length,
      pendingLeaveRequests: context.leaveRequests.filter(req => req.status === 'pending').length,
      equipmentRequests: context.equipment.filter(eq => eq.status === 'requested' || eq.status === 'pending').length,
      clientsCount: context.clients.length
    };
  }

  /**
   * Get user permissions based on role and team membership
   */
  private getUserPermissions(user: any): string[] {
    const permissions: string[] = ['general.read'];
    
    switch (user?.user_type) {
      case 'admin':
        return ['*']; // All permissions
      case 'hr':
        return ['tasks.read', 'users.read', 'leave.read', 'leave.write', 'equipment.read', 'clients.read'];
      case 'employee':
        return ['tasks.read', 'tasks.write', 'leave.read', 'leave.write', 'equipment.read', 'projects.read'];
      case 'client':
        return ['tasks.read', 'projects.read', 'clients.read'];
      default:
        return ['general.read'];
    }
  }

  /**
   * Check if user has specific permission
   */
  private hasPermission(permissions: string[], permission: string): boolean {
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * Clear cache to force fresh data load
   */
  public clearCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Generate intelligent response using LookitAI with complete context
   */
  async generateIntelligentResponse(
    query: string, 
    context: EnhancedSystemContext
  ): Promise<{ response: string; confidence: number }> {
    try {
      // Prepare comprehensive system data for AI
      const comprehensiveData = this.prepareSystemDataForAI(context);
      
      // Use LookitAI to generate intelligent response
      const aiResponse = await lookitAIService.processQuery(
        query,
        {
          user: context.user,
          systemData: comprehensiveData,  
          permissions: context.permissions,
          conversationHistory: [] // Could be passed from component if needed
        },
        `session_${context.user?._id || context.user?.email || 'anonymous'}_${Date.now()}`
      );

      return {
        response: aiResponse.response || 'I understand your question, but I need more specific information to provide a helpful answer.',
        confidence: aiResponse.confidence || 0.5
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        response: `I understand you're asking: "${query}"\n\nI have access to your system data but encountered an issue processing your request. Please try rephrasing your question or being more specific.`,
        confidence: 0.3
      };
    }
  }

  /**
   * Prepare system data summary for AI processing
   */
  private prepareSystemDataForAI(context: EnhancedSystemContext): string {
    const { analytics } = context;
    
    return `SYSTEM DATA SUMMARY:
TASKS: ${analytics.totalTasks} total (${analytics.completedTasks} completed, ${analytics.overdueTasks} overdue)
PROJECTS: ${analytics.activeProjects} active projects
CLIENTS: ${analytics.clientsCount} clients in system
USERS: ${analytics.totalUsers} team members
LEAVE: ${analytics.pendingLeaveRequests} pending leave requests
EQUIPMENT: ${analytics.equipmentRequests} equipment requests
LAST UPDATED: ${context.lastUpdated.toISOString()}

DETAILED CONTEXT:
- Tasks: ${context.tasks.map(t => `"${t.title}" (${t.status})`).slice(0, 10).join(', ')}
- Active Projects: ${context.projects.map(p => `"${p.projectName || p.name}"`).slice(0, 5).join(', ')}
- Team Members: ${context.users.map(u => u.name).slice(0, 10).join(', ')}
- Recent Leave: ${context.leaveRequests.slice(0, 5).map(req => `${req.user?.name} (${req.status})`).join(', ')}`;
  }

  /**
   * Index all system data in Pinecone vector database for AI-powered search
   */
  private async indexDataInPinecone(context: EnhancedSystemContext): Promise<void> {
    try {
      console.log('🔍 Starting Pinecone vector indexing...');

      // Initialize Pinecone service (with graceful failure)
      await this.pineconeService.initialize();

      // Only proceed if initialization was successful
      if (!this.pineconeService.isInitialized()) {
        console.log('⚠️ Pinecone not initialized, skipping vector indexing');
        return;
      }

      // Index all system data in Pinecone
      await this.pineconeService.indexAllSystemData({
        users: context.users,
        tasks: context.tasks,
        clients: context.clients,
        projects: context.projects,
        approvedProjects: context.approvedProjects,
        leaveRequests: context.leaveRequests,
        equipment: context.equipment
      });

      console.log('✅ All system data successfully indexed in Pinecone vector database!');

      // Get and log index statistics (non-blocking)
      this.pineconeService.getIndexStats().then(stats => {
        if (stats) {
          console.log('📊 Pinecone Index Stats:', {
            totalVectors: stats.totalRecordCount,
            dimensions: stats.dimension,
            indexFullness: stats.indexFullness
          });
        }
      }).catch(error => {
        console.warn('⚠️ Could not retrieve Pinecone stats:', error.message);
      });

    } catch (error) {
      console.error('❌ Failed to index data in Pinecone (system will continue with traditional search):', error.message);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Search for relevant context using Pinecone vector search with fallback
   */
  async searchContextWithPinecone(query: string, limit: number = 10, type?: string): Promise<any[]> {
    try {
      console.log(`🔍 Searching Pinecone for: "${query}" (type: ${type || 'all'})`);
      
      const results = await this.pineconeService.searchVectors(query, type, limit);
      
      if (results.length === 0) {
        console.log('📋 Pinecone returned no results, using traditional search fallback');
        return this.traditionalSearch(query, type);
      }
      
      const formattedResults = results.map(result => ({
        id: result.id,
        score: result.score,
        type: result.metadata?.type,
        title: result.metadata?.title,
        description: result.metadata?.description,
        content: result.metadata?.searchableText,
        metadata: result.metadata
      }));

      console.log(`✅ Found ${formattedResults.length} relevant results from Pinecone`);
      
      return formattedResults;
    } catch (error) {
      console.error('❌ Error searching Pinecone, falling back to traditional search:', error);
      return this.traditionalSearch(query, type);
    }
  }

  /**
   * Search context using traditional methods
   */
  async searchContext(query: string): Promise<any> {
    if (!this.cache) {
      console.warn('⚠️ No cached data available for context search');
      return { tasks: [], projects: [], clients: [], users: [] };
    }

    const results = {
      tasks: this.searchInData(this.cache.tasks, query, ['title', 'description', 'assignee']),
      projects: this.searchInData([...this.cache.projects, ...this.cache.approvedProjects], query, ['projectName', 'name', 'description']),
      clients: this.searchInData(this.cache.clients, query, ['name', 'company', 'email']),
      users: this.searchInData(this.cache.users, query, ['name', 'email', 'department'])
    };

    return results;
  }

  private searchInData(data: any[], query: string, fields: string[]): any[] {
    const lowerQuery = query.toLowerCase();
    return data.filter(item => {
      return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(lowerQuery);
      });
    }).slice(0, 5); // Limit results
  }

  /**
   * Traditional search fallback when Pinecone is not available
   */
  private traditionalSearch(query: string, type?: string): any[] {
    if (!this.cache) {
      console.warn('⚠️ No cached data available for traditional search');
      return [];
    }

    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search through different data types
    if (!type || type === 'task') {
      this.cache.tasks.forEach(task => {
        const searchText = `${task.title} ${task.description} ${task.assignee}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
          results.push({
            id: `task_${task.id}`,
            score: 0.8,
            type: 'task',
            title: task.title,
            description: task.description,
            content: searchText,
            metadata: task
          });
        }
      });
    }

    if (!type || type === 'project') {
      [...this.cache.projects, ...this.cache.approvedProjects].forEach(project => {
        const searchText = `${project.projectName || project.name} ${project.description}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
          results.push({
            id: `project_${project.id}`,
            score: 0.8,
            type: 'project',
            title: project.projectName || project.name,
            description: project.description,
            content: searchText,
            metadata: project
          });
        }
      });
    }

    if (!type || type === 'user') {
      this.cache.users.forEach(user => {
        const searchText = `${user.name} ${user.email} ${user.department}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
          results.push({
            id: `user_${user.id}`,
            score: 0.8,
            type: 'user',
            title: user.name,
            description: `${user.user_type} in ${user.department}`,
            content: searchText,
            metadata: user
          });
        }
      });
    }

    console.log(`📋 Traditional search found ${results.length} results`);
    return results.slice(0, 10); // Limit to top 10 results
  }

  /**
   * Get Pinecone service instance for direct access
   */
  getPineconeService(): PineconeVectorService {
    return this.pineconeService;
  }

  /**
   * Check if Pinecone is available for enhanced AI features
   */
  isPineconeAvailable(): boolean {
    return this.pineconeService.isInitialized();
  }
}

export default EnhancedAIDataService;
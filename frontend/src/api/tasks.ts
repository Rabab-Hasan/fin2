const BASE_URL = '/api/tasks';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'pending' | 'completed';
  assignee?: string;
  deadline?: string;
  clientComments?: string;
  actionLabsComments?: string;
  link?: string;
  parentId?: string;
  clientId?: string;
  visibleToClient?: boolean;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  assignee?: string;
  search?: string;
  clientId?: string;
  userType?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: Task['status'];
  assignee?: string;
  deadline?: string;
  clientComments?: string;
  actionLabsComments?: string;
  link?: string;
  parentId?: string;
  clientId?: string;
  visibleToClient?: boolean;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: Task['status'];
  assignee?: string;
  deadline?: string;
  clientComments?: string;
  actionLabsComments?: string;
  link?: string;
  clientId?: string;
  visibleToClient?: boolean;
}

const tasksApi = {
  // Get all tasks with optional filtering
  async getTasks(filters: TaskFilters = {}): Promise<{ tasks: Task[] }> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.assignee) params.append('assignee', filters.assignee);
    if (filters.search) params.append('search', filters.search);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.userType) params.append('userType', filters.userType);
    
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get a specific task by ID
  async getTask(id: string, clientId: string): Promise<{ task: Task }> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    
    const url = params.toString() ? `${BASE_URL}/${id}?${params}` : `${BASE_URL}/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create a new task
  async createTask(taskData: CreateTaskData): Promise<{ task: Task }> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create task: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update a task
  async updateTask(id: string, taskData: UpdateTaskData): Promise<{ task: Task }> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update task: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete a task
  async deleteTask(id: string, clientId: string): Promise<{ message: string }> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    
    const url = params.toString() ? `${BASE_URL}/${id}?${params}` : `${BASE_URL}/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete task: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get task statistics
  async getTaskStats(clientId: string): Promise<{
    statusCounts: Record<Task['status'], number>;
    totalTasks: number;
    overdueTasks: number;
  }> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    
    const url = params.toString() ? `${BASE_URL}/stats?${params}` : `${BASE_URL}/stats`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch task stats: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default tasksApi;
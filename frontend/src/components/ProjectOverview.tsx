import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Link as LinkIcon,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';
import Card from './Card';
import tasksApi, { Task as TaskType, CreateTaskData, UpdateTaskData } from '../api/tasks';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';

// Task interfaces (using TaskType to avoid conflicts)
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'pending' | 'completed';
  assignee?: string;
  deadline?: string;
  clientComments?: string;
  actionLabsComments?: string;
  link?: string;
  parentId?: string; // null for main tasks, task ID for subtasks
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

// Status configuration
const STATUS_CONFIG = {
  'todo': { 
    label: 'To Do', 
    color: 'bg-gray-500', 
    lightColor: 'bg-gray-50', 
    textColor: 'text-gray-700',
    icon: Clock
  },
  'in-progress': { 
    label: 'In Progress', 
    color: 'bg-blue-500', 
    lightColor: 'bg-blue-50', 
    textColor: 'text-blue-700',
    icon: Loader2
  },
  'pending': { 
    label: 'Pending', 
    color: 'bg-yellow-500', 
    lightColor: 'bg-yellow-50', 
    textColor: 'text-yellow-700',
    icon: AlertCircle
  },
  'completed': { 
    label: 'Completed', 
    color: 'bg-green-500', 
    lightColor: 'bg-green-50', 
    textColor: 'text-green-700',
    icon: CheckCircle
  }
};


const STATUS_FILTERS: Array<{ key: Task['status'] | 'all'; label: string; color: string; textColor: string }> = [
  { key: 'all', label: 'All', color: 'bg-gray-200', textColor: 'text-gray-700' },
  { key: 'todo', label: 'To Do', color: STATUS_CONFIG['todo'].color, textColor: STATUS_CONFIG['todo'].textColor },
  { key: 'in-progress', label: 'In Progress', color: STATUS_CONFIG['in-progress'].color, textColor: STATUS_CONFIG['in-progress'].textColor },
  { key: 'pending', label: 'Pending', color: STATUS_CONFIG['pending'].color, textColor: STATUS_CONFIG['pending'].textColor },
  { key: 'completed', label: 'Completed', color: STATUS_CONFIG['completed'].color, textColor: STATUS_CONFIG['completed'].textColor },
];

const ProjectOverview: React.FC = () => {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    assignee: '',
    deadline: '',
    clientComments: '',
    actionLabsComments: '',
    link: ''
  });

  const queryClient = useQueryClient();

  // Check if user is a client with association (restricted user)
  const isClientUser = user?.user_type === 'client' && user?.association;

  // Fetch tasks with filters
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', selectedClient?.id],
    queryFn: () => selectedClient ? tasksApi.getTasks({ clientId: selectedClient.id }) : Promise.resolve({ tasks: [] }),
    enabled: !!selectedClient,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskData) => tasksApi.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedClient?.id] });
      resetNewTaskForm();
    },
    onError: (error) => {
      console.error('Add task error:', error);
      alert('Failed to add task. Please try again.');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }: { id: string; taskData: UpdateTaskData }) => 
      tasksApi.updateTask(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedClient?.id] });
      setEditingTask(null);
    },
    onError: (error) => {
      console.error('Update task error:', error);
      alert('Failed to update task. Please try again.');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => selectedClient ? tasksApi.deleteTask(taskId, selectedClient.id) : Promise.reject('No client selected'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedClient?.id] });
    },
    onError: (error) => {
      console.error('Delete task error:', error);
      alert('Failed to delete task. Please try again.');
    },
  });

  // Update tasks when data changes
  useEffect(() => {
    if (tasksData?.tasks) {
      setTasks(tasksData.tasks);
    }
  }, [tasksData]);

  // Helper functions
  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const resetNewTaskForm = () => {
    setNewTaskData({
      title: '',
      description: '',
      status: 'todo',
      assignee: '',
      deadline: '',
      clientComments: '',
      actionLabsComments: '',
      link: ''
    });
    setIsAddingTask(false);
    setAddingSubtaskTo(null);
  };

  const handleAddTask = () => {
    if (!newTaskData.title.trim() || !selectedClient) return;
    
    const taskData: CreateTaskData = {
      title: newTaskData.title,
      description: newTaskData.description || undefined,
      status: newTaskData.status,
      assignee: newTaskData.assignee || undefined,
      deadline: newTaskData.deadline || undefined,
      clientComments: newTaskData.clientComments || undefined,
      actionLabsComments: newTaskData.actionLabsComments || undefined,
      link: newTaskData.link || undefined,
      parentId: addingSubtaskTo || undefined,
      clientId: selectedClient.id
    };
    
    addTaskMutation.mutate(taskData);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({ ...task });
  };

  const handleUpdateTask = () => {
    if (!editingTask || !selectedClient) return;
    
    const taskData: UpdateTaskData = {
      title: editingTask.title,
      description: editingTask.description,
      status: editingTask.status,
      assignee: editingTask.assignee,
      deadline: editingTask.deadline,
      clientComments: editingTask.clientComments,
      actionLabsComments: editingTask.actionLabsComments,
      link: editingTask.link,
      clientId: selectedClient.id
    };
    
    updateTaskMutation.mutate({ id: editingTask.id, taskData });
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${taskTitle}"? This will also delete all subtasks.`)) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    const IconComponent = STATUS_CONFIG[status].icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };


  // Filter tasks by status
  const filteredTasks = statusFilter === 'all'
    ? tasks
    : tasks.filter(task => task.status === statusFilter);

  // Task Row Component
  const TaskRow: React.FC<{ task: Task; isSubtask?: boolean }> = ({ task, isSubtask = false }) => {
    const statusConfig = STATUS_CONFIG[task.status];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    // Main task with subtasks: highlight row
    const mainTaskWithSubtasks = !isSubtask && hasSubtasks;
    return (
      <>
        <tr
          className={`border-b border-gray-200 hover:bg-gray-50 ${
            isSubtask
              ? 'bg-gray-25'
              : mainTaskWithSubtasks
                ? 'bg-blue-50 font-bold'
                : ''
          }`}
        >
          <td className={`py-3 px-4 ${isSubtask ? 'pl-12' : 'pl-4'}`}>
            <div className="flex items-center gap-2">
              {!isSubtask && hasSubtasks && (
                <button
                  onClick={() => toggleTaskExpansion(task.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              <div className="flex-1">
                <div className={`${mainTaskWithSubtasks ? 'font-bold text-blue-900' : 'font-medium text-gray-900'}`}>{task.title}</div>
                {task.description && (
                  <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                )}
              </div>
            </div>
          </td>
          
          <td className="py-3 px-4">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.textColor}`}> {/* Use color for badge */}
              {getStatusIcon(task.status)}
              {statusConfig.label}
            </span>
          </td>
          
          <td className="py-3 px-4 text-sm text-gray-600">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {task.assignee}
              </div>
            )}
          </td>
          
          <td className="py-3 px-4 text-sm text-gray-600">
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(task.deadline)}
              </div>
            )}
          </td>
          
          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
            {task.clientComments && (
              <div className="truncate" title={task.clientComments}>
                {task.clientComments}
              </div>
            )}
          </td>
          
          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
            {task.actionLabsComments && (
              <div className="truncate" title={task.actionLabsComments}>
                {task.actionLabsComments}
              </div>
            )}
          </td>
          
          <td className="py-3 px-4 text-sm text-gray-600">
            {task.link && (
              <a 
                href={task.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4" />
                Link
              </a>
            )}
          </td>
          
          <td className="py-3 px-4">
            <div className="flex items-center gap-2">
              {!isClientUser && !isSubtask && (
                <button
                  onClick={() => setAddingSubtaskTo(task.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Add Subtask"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleEditTask(task)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title={isClientUser ? "Add Client Comment" : "Edit Task"}
              >
                {isClientUser ? <MessageSquare className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </button>
              {!isClientUser && (
                <button
                  onClick={() => handleDeleteTask(task.id, task.title)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
        
        {/* Subtasks */}
        {!isSubtask && hasSubtasks && isExpanded && (
          <>
            {task.subtasks?.map((subtask) => (
              <TaskRow key={subtask.id} task={subtask} isSubtask={true} />
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {!selectedClient ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Client Selection Required
            </h3>
            <p className="text-gray-600">
              Please select a client from the home page to access project management features.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Project Overview - {selectedClient.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isClientUser 
                    ? `View project progress and add comments for ${selectedClient.name}`
                    : `Manage tasks, subtasks, and track project progress for ${selectedClient.name}`
                  }
                </p>
              </div>
              {!isClientUser && (
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              )}
            </div>

        {/* Status Filter Bar */}
        <div className="flex gap-2 mb-4">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key as any)}
              className={`px-3 py-1 rounded-full font-medium text-xs focus:outline-none border transition-all ${statusFilter === filter.key ? `${filter.color} ${filter.textColor} border-black` : `${filter.color} ${filter.textColor} border-transparent`}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Task</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Assignee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Deadline</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Client Comments</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action Labs Comments</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Link</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No tasks yet. Click "Add Task" to get started.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))
              )}
              
              {/* Add Task Row */}
              {!isClientUser && (isAddingTask || addingSubtaskTo) && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className={`py-3 px-4 ${addingSubtaskTo ? 'pl-12' : 'pl-4'}`}>
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)..."
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                      rows={2}
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <select
                      value={newTaskData.status}
                      onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value as Task['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Assignee..."
                      value={newTaskData.assignee}
                      onChange={(e) => setNewTaskData({ ...newTaskData, assignee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <input
                      type="date"
                      value={newTaskData.deadline}
                      onChange={(e) => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Client comments..."
                      value={newTaskData.clientComments}
                      onChange={(e) => setNewTaskData({ ...newTaskData, clientComments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Action Labs comments..."
                      value={newTaskData.actionLabsComments}
                      onChange={(e) => setNewTaskData({ ...newTaskData, actionLabsComments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newTaskData.link}
                      onChange={(e) => setNewTaskData({ ...newTaskData, link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddTask}
                        disabled={!newTaskData.title.trim() || addTaskMutation.isPending}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Save Task"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={resetNewTaskForm}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isClientUser ? 'Add Client Comment' : 'Edit Task'}
              </h2>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Task Info (Read-only for client users) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                {isClientUser ? (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
                    {editingTask.title}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              
              {editingTask.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  {isClientUser ? (
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
                      {editingTask.description}
                    </div>
                  ) : (
                    <textarea
                      value={editingTask.description || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  )}
                </div>
              )}
              
              {!isClientUser && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editingTask.status}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={editingTask.assignee || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={editingTask.deadline || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Comments
                </label>
                <textarea
                  value={editingTask.clientComments || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, clientComments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={isClientUser ? "Add your comments here..." : "Client comments..."}
                />
              </div>
              
              {!isClientUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Labs Comments
                    </label>
                    <textarea
                      value={editingTask.actionLabsComments || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, actionLabsComments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link
                    </label>
                    <input
                      type="url"
                      value={editingTask.link || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingTask(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={updateTaskMutation.isPending}
                className="btn-primary"
              >
                {updateTaskMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isClientUser ? 'Saving Comment...' : 'Updating...'}
                  </>
                ) : (
                  isClientUser ? 'Save Comment' : 'Update Task'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ProjectOverview;
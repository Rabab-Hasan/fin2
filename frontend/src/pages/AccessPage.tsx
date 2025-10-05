import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Building, Mail, Edit3, Save, X, Plus } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? `${window.location.protocol}//${window.location.hostname}:2345`
  : `${window.location.protocol}//${window.location.hostname}:2345`;

interface User {
  _id: string;
  email: string;
  name: string;
  user_type?: 'admin' | 'employee' | 'client';
  association?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email?: string;
}

const AccessPage: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    user_type: 'admin' | 'employee' | 'client';
    association: string;
  }>({ user_type: 'client', association: '' });
  
  // New user creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    user_type: 'employee' as 'admin' | 'employee' | 'client',
    association: ''
  });
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);

  // Fetch users from MongoDB
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch clients from SQLite
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: !!token,
  });

  // Update user association mutation
  const updateAssociationMutation = useMutation({
    mutationFn: async ({ userId, association, user_type }: { 
      userId: string; 
      association: string; 
      user_type: 'admin' | 'employee' | 'client';
    }) => {
      const response = await fetch(`${API_BASE}/api/auth/users/${userId}/association`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ association, user_type }),
      });
      if (!response.ok) throw new Error('Failed to update association');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setEditForm({ user_type: 'client', association: '' });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      name: string;
      user_type: 'admin' | 'employee' | 'client';
      association?: string;
    }) => {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateForm(false);
      setCreateForm({
        email: '',
        password: '',
        name: '',
        user_type: 'employee',
        association: ''
      });
      setCreatedCredentials(data.credentials);
      // Show credentials for 10 seconds
      setTimeout(() => setCreatedCredentials(null), 10000);
    },
  });

  const handleEditStart = (user: User) => {
    setEditingUser(user._id);
    setEditForm({
      user_type: user.user_type || 'client',
      association: user.association || '',
    });
  };

  const handleEditSave = (userId: string) => {
    updateAssociationMutation.mutate({
      userId,
      association: editForm.association,
      user_type: editForm.user_type,
    });
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditForm({ user_type: 'client', association: '' });
  };

  const handleCreateUser = () => {
    if (!createForm.email || !createForm.password || !createForm.name) {
      alert('Please fill in all required fields');
      return;
    }
    
    createUserMutation.mutate({
      email: createForm.email,
      password: createForm.password,
      name: createForm.name,
      user_type: createForm.user_type,
      association: createForm.association || undefined,
    });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm(prev => ({ ...prev, password }));
  };

  const users = usersData?.users || [];
  const clients = clientsData?.clients || [];

  // Check if current user is admin or employee
  if (currentUser?.email !== 'admin@example.com' && 
      currentUser?.user_type !== 'admin' && 
      currentUser?.user_type !== 'employee' && 
      currentUser?.user_type !== undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600">You don't have permission to access user management.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (usersLoading || clientsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Management</h1>
          <p className="text-gray-600">Manage user access and client associations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Associated Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.association).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Created Credentials Alert */}
        {createdCredentials && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <h3 className="text-green-800 font-medium">User Created Successfully!</h3>
            </div>
            <p className="text-green-700 text-sm mb-2">Share these credentials with the user:</p>
            <div className="bg-white p-3 rounded border">
              <p className="font-mono text-sm"><strong>Email:</strong> {createdCredentials.email}</p>
              <p className="font-mono text-sm"><strong>Password:</strong> {createdCredentials.password}</p>
            </div>
            <p className="text-green-600 text-xs mt-2">This message will disappear in 10 seconds.</p>
          </div>
        )}

        {/* Create User Form */}
        {currentUser?.user_type === 'admin' && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showCreateForm ? 'Cancel' : 'Add User'}
              </button>
            </div>

            {showCreateForm && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                    <select
                      value={createForm.user_type}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, user_type: e.target.value as 'admin' | 'employee' | 'client' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option key="employee" value="employee">Employee</option>
                      <option key="admin" value="admin">Admin</option>
                      <option key="client" value="client">Client</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Association (Optional)</label>
                    <select
                      value={createForm.association}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, association: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option key="no-association" value="">No association</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.company})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending || !createForm.email || !createForm.password || !createForm.name}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </button>
                </div>

                {createUserMutation.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">
                      {createUserMutation.error instanceof Error 
                        ? createUserMutation.error.message 
                        : 'Failed to create user'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Users & Associations</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Association
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user._id ? (
                        <select
                          value={editForm.user_type}
                          onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value as 'admin' | 'employee' | 'client' })}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option key="admin-edit" value="admin">Admin</option>
                          <option key="employee-edit" value="employee">Employee</option>
                          <option key="client-edit" value="client">Client</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.user_type === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.user_type === 'employee'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.user_type || 'employee'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user._id ? (
                        <select
                          value={editForm.association}
                          onChange={(e) => setEditForm({ ...editForm, association: e.target.value })}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                        >
                          <option key="no-association-edit" value="">No Association</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name} ({client.company})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          {user.association ? (
                            <div>
                              {(() => {
                                const client = clients.find(c => c.id === user.association);
                                return client ? (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.company}</div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-red-600">Invalid Association</span>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No Association</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUser === user._id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSave(user._id)}
                            disabled={updateAssociationMutation.isPending}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStart(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AccessPage;
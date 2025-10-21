const BASE_URL = `${process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com'}/api/clients`;

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

const clientsApi = {
  // Get all clients
  async getClients(): Promise<{ clients: Client[] }> {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }
    return response.json();
  },

  // Get a specific client by ID
  async getClient(id: string): Promise<{ client: Client }> {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }
    return response.json();
  },

  // Create a new client
  async createClient(clientData: CreateClientData): Promise<{ client: Client }> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create client: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update a client
  async updateClient(id: string, clientData: UpdateClientData): Promise<{ client: Client }> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update client: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete a client
  async deleteClient(id: string): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete client: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get client statistics
  async getClientStats(id: string): Promise<{
    client: Client;
    stats: {
      statusCounts: Record<string, number>;
      totalTasks: number;
      overdueTasks: number;
    };
  }> {
    const response = await fetch(`${BASE_URL}/${id}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch client stats: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default clientsApi;
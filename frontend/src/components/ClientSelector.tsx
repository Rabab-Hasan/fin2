import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Users, 
  ChevronDown, 
  X, 
  Building, 
  Mail, 
  Phone,
  Loader2,
  Check
} from 'lucide-react';
import { useClient, Client } from '../contexts/ClientContext';
import clientsApi, { CreateClientData } from '../api/clients';

interface ClientSelectorProps {
  className?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ className = '' }) => {
  const { 
    selectedClient, 
    setSelectedClient, 
    clients, 
    setClients, 
    isLoadingClients, 
    setIsLoadingClients 
  } = useClient();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients(),
    onSuccess: (data) => {
      setClients(data.clients);
      setIsLoadingClients(false);
    },
    onError: () => {
      setIsLoadingClients(false);
    }
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: (clientData: CreateClientData) => 
      clientsApi.createClient(clientData),
    onSuccess: (data) => {
      const updatedClients = [...clients, data.client];
      setClients(updatedClients);
      setSelectedClient(data.client);
      setIsAddingClient(false);
      setNewClientData({ name: '', email: '', phone: '', company: '' });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    }
  });

  useEffect(() => {
    if (clientsData?.clients) {
      setClients(clientsData.clients);
    }
  }, [clientsData, setClients]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsDropdownOpen(false);
  };

  const handleAddClient = () => {
    if (!newClientData.name.trim()) return;
    
    addClientMutation.mutate({
      name: newClientData.name.trim(),
      email: newClientData.email.trim() || undefined,
      phone: newClientData.phone.trim() || undefined,
      company: newClientData.company.trim() || undefined
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Client Selector Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <Users className="w-5 h-5 text-gray-400" />
        <div className="flex-1 text-left">
          {selectedClient ? (
            <div>
              <div className="font-medium text-gray-900">{selectedClient.name}</div>
              <div className="text-sm text-gray-500">{selectedClient.company || 'No company'}</div>
            </div>
          ) : (
            <div className="text-gray-500">Select a client...</div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Client List */}
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <Building className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{client.name}</div>
                <div className="text-sm text-gray-500">{client.company || 'No company'}</div>
              </div>
              {selectedClient?.id === client.id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}

          {/* Add New Client Button */}
          <button
            onClick={() => setIsAddingClient(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 border-t border-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add New Client</span>
          </button>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
              <button
                onClick={() => setIsAddingClient(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newClientData.company}
                  onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddingClient(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClientData.name.trim() || addClientMutation.isPending}
                className="btn-primary"
              >
                {addClientMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
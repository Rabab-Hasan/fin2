import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Client interface
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

// Context interface
interface ClientContextType {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clients: Client[];
  setClients: (clients: Client[]) => void;
  isLoadingClients: boolean;
  setIsLoadingClients: (loading: boolean) => void;
}

// Create context
const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Provider component
export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Load selected client from localStorage on mount
  useEffect(() => {
    const savedClientId = localStorage.getItem('selectedClientId');
    const savedClients = localStorage.getItem('clients');
    
    if (savedClients) {
      const parsedClients = JSON.parse(savedClients);
      setClients(parsedClients);
      
      if (savedClientId) {
        const client = parsedClients.find((c: Client) => c.id === savedClientId);
        if (client) {
          setSelectedClient(client);
        }
      }
    }
  }, []);

  // Save selected client to localStorage when it changes
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('selectedClientId', selectedClient.id);
    } else {
      localStorage.removeItem('selectedClientId');
    }
  }, [selectedClient]);

  // Save clients to localStorage when they change
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }, [clients]);

  const value = {
    selectedClient,
    setSelectedClient,
    clients,
    setClients,
    isLoadingClients,
    setIsLoadingClients,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

// Custom hook to use client context
export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default ClientContext;
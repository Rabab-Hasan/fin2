import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import clientEncryption from '../utils/encryption';

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

  // Load selected client from encrypted storage on mount
  useEffect(() => {
    const savedClientData = clientEncryption.getSecureClientSelection();
    const savedClients = clientEncryption.getSecureItem('clients_list');
    
    if (savedClients) {
      setClients(savedClients);
      
      if (savedClientData) {
        // Validate that the saved client still exists in the list
        const client = savedClients.find((c: Client) => c.id === savedClientData.id);
        if (client) {
          setSelectedClient(client);
        }
      }
    }
  }, []);

  // Save selected client to encrypted storage when it changes
  useEffect(() => {
    if (selectedClient) {
      clientEncryption.setSecureClientSelection(selectedClient);
    } else {
      clientEncryption.removeSecureItem('selected_client');
    }
  }, [selectedClient]);

  // Save clients to encrypted storage when they change
  useEffect(() => {
    if (clients.length > 0) {
      clientEncryption.setSecureItem('clients_list', clients);
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
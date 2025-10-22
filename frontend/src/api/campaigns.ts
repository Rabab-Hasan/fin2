import secureApiClient from '../utils/secure-api-client.js';

export interface Campaign {
  id: string;
  name: string;
  type: 'brand-awareness' | 'lead-generation' | 'sales' | 'engagement' | 'traffic';
  budget: number;
  product: string;
  objective: string;
  narrative: string;
  concept: string;
  tagline: string;
  hero_artwork_path?: string;
  manager_id: string;
  manager_name: string;
  activities: string[];
  requires_internal_approval: boolean;
  requires_client_approval: boolean;
  ai_validated: boolean;
  ai_score?: number;
  ai_suggestions?: string[];
  client_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  name: string;
  type: 'brand-awareness' | 'lead-generation' | 'sales' | 'engagement' | 'traffic';
  budget: number;
  product: string;
  objective: string;
  narrative: string;
  concept: string;
  tagline: string;
  managerId: string;
  managerName: string;
  activities: string[];
  requiresInternalApproval?: boolean;
  requiresClientApproval?: boolean;
  aiValidated?: boolean;
  aiScore?: number;
  aiSuggestions?: string[];
  clientId: string;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export const campaignsApi = {
  async getCampaigns(params: { clientId: string }) {
    const searchParams = new URLSearchParams({ client_id: params.clientId });
    return secureApiClient.get(`/campaigns?${searchParams}`);
  },

  async getCampaign(id: string, clientId: string) {
    return secureApiClient.get(`/campaigns/${id}?clientId=${clientId}`);
  },

  async createCampaign(data: CreateCampaignData) {
    return secureApiClient.post('/campaigns', data);
  },

  async updateCampaign(id: string, data: UpdateCampaignData) {
    return secureApiClient.put(`/campaigns/${id}`, data);
  },

  async deleteCampaign(id: string, clientId: string) {
    return secureApiClient.delete(`/campaigns/${id}?clientId=${clientId}`);
  },

  async validateCampaign(id: string, clientId: string) {
    return secureApiClient.post(`/campaigns/${id}/validate`, { clientId });
  },

  async getCampaignTasks(campaignId: string, clientId: string) {
    return secureApiClient.get(`/campaigns/${campaignId}/tasks?client_id=${clientId}`);
  }
};

export default campaignsApi;
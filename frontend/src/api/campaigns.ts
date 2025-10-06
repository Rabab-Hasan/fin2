// Campaign API client
const API_BASE = '/api';

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

class CampaignsApi {
  private async request(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getCampaigns(params: { clientId: string }) {
    const searchParams = new URLSearchParams({ client_id: params.clientId });
    return this.request(`/campaigns?${searchParams}`);
  }

  async getCampaign(id: string, clientId: string) {
    return this.request(`/campaigns/${id}?clientId=${clientId}`);
  }

  async createCampaign(data: CreateCampaignData) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: string, data: UpdateCampaignData) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string, clientId: string) {
    return this.request(`/campaigns/${id}?clientId=${clientId}`, {
      method: 'DELETE',
    });
  }

  async validateCampaign(id: string, clientId: string) {
    return this.request(`/campaigns/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
  }

  async getCampaignTasks(campaignId: string, clientId: string) {
    return this.request(`/campaigns/${campaignId}/tasks?client_id=${clientId}`);
  }
}

const campaignsApi = new CampaignsApi();
export default campaignsApi;
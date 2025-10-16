import { z } from 'zod';
import {
  User,
  Agent,
  LoginRequest,
  LoginResponse,
  LiveCall,
  Call,
  CallStats,
  PaginatedCalls,
  PaginatedUsers,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardStats,
  Lead,
  LoginRequestSchema,
} from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private baseUrl: string;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: (value: unknown) => void; reject: (error: unknown) => void }> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const config: RequestInit = {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('access_token') && {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        }),
        ...options.headers,
      },
      ...options,
    };

    console.log('Requesting URL:', url, 'Config:', config);

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401 && localStorage.getItem('refresh_token')) {
          // If there's already a refresh in progress, add this request to the queue
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
              };
              return fetch(url, config).then(res => {
                if (!res.ok) {
                  return res.json().then(errorData => {
                    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
                  });
                }
                return res.json();
              });
            }) as Promise<T>;
          }

          // Start the refresh process
          this.isRefreshing = true;
          
          try {
            const refreshResponse = await this.refreshToken(localStorage.getItem('refresh_token')!);
            const newAccessToken = refreshResponse.access_token;
            localStorage.setItem('access_token', newAccessToken);
            
            // Process the queue
            this.failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
            this.failedQueue = [];
            
            // Retry the original request with the new token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };
            const retryResponse = await fetch(url, config);
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw new Error(errorData.detail || `HTTP error! status: ${retryResponse.status}`);
            }
            return await retryResponse.json();
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Process the queue with the error
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            throw new Error('Session expired. Please log in again.');
          } finally {
            this.isRefreshing = false;
          }
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`⏰ API Timeout: ${url}`);
        throw new Error('Request timeout - server took too long to respond');
      }
      console.error(`Error fetching from ${url}:`, error.message, error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const validatedData = LoginRequestSchema.parse(data);
    console.log('Sending login payload:', JSON.stringify(validatedData));
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: localStorage.getItem('access_token')
          ? `Bearer ${localStorage.getItem('access_token')}`
          : undefined,
      },
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; token_type: string }> {
    return this.request<{ access_token: string; token_type: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getLiveCalls(): Promise<LiveCall[]> {
    return this.request<LiveCall[]>('/calls/live');
  }

  async getCalls(page: number = 1, size: number = 50, filters: Record<string, any> = {}): Promise<PaginatedCalls> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      ),
    });
    return this.request<PaginatedCalls>(`/calls?${queryParams.toString()}`);
  }

  async getCallById(callId: string): Promise<Call> {
    return this.request<Call>(`/calls/${callId}`);
  }

  async createCall(callData: Partial<Call>): Promise<Call> {
    return this.request<Call>('/calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async updateCall(callId: string, callData: Partial<Call>): Promise<Call> {
    return this.request<Call>(`/calls/${callId}`, {
      method: 'PUT',
      body: JSON.stringify(callData),
    });
  }

  async deleteCall(callId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/calls/${callId}`, {
      method: 'DELETE',
    });
  }

  async hangupCall(callId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/calls/${callId}/hangup`, {
      method: 'POST',
    });
  }

  async holdCall(callId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/calls/${callId}/hold`, {
      method: 'POST',
    });
  }

  async unholdCall(callId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/calls/${callId}/unhold`, {
      method: 'POST',
    });
  }

  async makeCall(fromExtension: string, toNumber: string): Promise<{ message: string; call_id: string }> {
    return this.request<{ message: string; call_id: string }>('/calls/make-call', {
      method: 'POST',
      body: JSON.stringify({ from_extension: fromExtension, to_number: toNumber }),
    });
  }

  async getCallStats(
    startDate?: string,
    endDate?: string,
    agentId?: string,
    queueName?: string,
    agentType?: string
  ): Promise<CallStats> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (agentId) queryParams.append('agent_id', agentId);
    if (queueName) queryParams.append('queue_name', queueName);
    if (agentType) queryParams.append('agent_type', agentType);
    return this.request<CallStats>(`/calls/stats?${queryParams.toString()}`);
  }

  async getAgents(status?: string, department?: string): Promise<Agent[]> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (department) queryParams.append('department', department);
    return this.request<Agent[]>(`/agents?${queryParams.toString()}`);
  }

  async getAgentsByDesignation(page: number = 1, size: number = 15, status?: string, department?: string): Promise<[Agent[], number]> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (status) queryParams.append('status', status);
    // Only pass department if it's an actual department filter, not a designation
    if (department && !['call-center-admin', 'marketing-admin', 'compliance-admin', 'super-admin'].includes(department)) {
      queryParams.append('department', department);
    }
    const response = await this.request<{ agents: Agent[]; total: number }>(`/agents/by-designation?${queryParams.toString()}`);
    return [response.agents, response.total];
  }

  async getAgentById(agentId: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${agentId}`);
  }

  async getAgentByUserId(userId: string): Promise<Agent> {
    return this.request<Agent>(`/agents/by-user/${userId}`);
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  async updateAgentStatus(agentId: string, status: Agent['status']): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/agents/${agentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getUsers(page: number = 1, size: number = 50, filters: Record<string, any> = {}): Promise<PaginatedUsers> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      ),
    });
    return this.request<PaginatedUsers>(`/users?${queryParams.toString()}`);
  }

  async getUserById(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const payload = {
      user_data: {
        ...data.user_data,
        username: data.user_data.username || data.user_data.first_name,
      },
      agent_data: data.agent_data || null,
    };
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getDashboardStats(designation?: string): Promise<DashboardStats> {
    const queryParams = new URLSearchParams();
    if (designation) queryParams.append('designation', designation);
    const queryString = queryParams.toString();
    return this.request<DashboardStats>(`/dashboard/stats${queryString ? '?' + queryString : ''}`);
  }

  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/leads');
  }

  async getLeadById(leadId: string): Promise<Lead> {
    return this.request<Lead>(`/leads/${leadId}`);
  }

  async getAgentStats(agentId: string): Promise<import('@/types').AgentStats> {
    return this.request<import('@/types').AgentStats>(`/agents/${agentId}`);
  }

  async getAgentCalls(agentId: string, params?: { limit?: number; offset?: number }): Promise<import('@/types').AgentCall[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    return this.request<import('@/types').AgentCall[]>(`/agents/${agentId}/calls?${queryString}`);
  }

  async getQueueStatus(agentId: string): Promise<import('@/types').QueueStatus> {
    return this.request<import('@/types').QueueStatus>(`/agents/${agentId}/queue-status`);
  }

  async getAgentStatsByDate(agentId: string, startDate: string, endDate: string): Promise<any> {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request<any>(`/agents/${agentId}/stats?${queryParams.toString()}`);
  }

  async getAgentPerformance(agentId: string): Promise<any> {
    return this.request<any>(`/agents/${agentId}/performance`);
  }

  // Africa's Talking methods
  async makeCall(to: string, from?: string): Promise<{ call_id: string; at_response: any }> {
    return this.request<{ call_id: string; at_response: any }>('/africastalking/make-call', {
      method: 'POST',
      body: JSON.stringify({ to, from_: from }),
    });
  }

  async getCallStatus(sessionId: string): Promise<any> {
    return this.request<any>('/africastalking/call-status', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
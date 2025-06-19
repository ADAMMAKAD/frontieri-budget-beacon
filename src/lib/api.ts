// src/lib/api.ts

// Use environment variable for API URL, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    console.log('🔑 API Auth Headers:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      apiBaseUrl: API_BASE_URL,
    });

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      mode: 'cors',
      headers: this.getAuthHeaders(),
      ...options,
    };

    console.log('🌐 API Request:', {
      method: options.method || 'GET',
      url,
      hasAuth: !!config.headers?.Authorization,
      body: options.body ? 'Present' : 'None',
    });

    try {
      const response = await fetch(url, config);

      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text || 'Network error' };
        }
        console.error('💥 API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: data,
          url,
        });
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      console.log('✅ API Success:', {
        endpoint,
        dataKeys: Object.keys(json),
        dataSize: JSON.stringify(json).length,
      });
      return json;
    } catch (err: any) {
      console.error('💥 API Request Failed:', {
        endpoint,
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  // Auth
  async signUp(email: string, password: string, fullName: string, department: string, role?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, department, role }),
    });
  }

  async signIn(email: string, password: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!result) {
      throw new Error('No response received from server');
    }
    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }
    return result.user;
  }

  async signOut() {
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Projects
  async getProjects(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/projects${qs ? `?${qs}` : ''}`);
  }
  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }
  async createProject(project: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }
  async updateProject(id: string, updates: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }
  async getDashboardMetrics() {
    return this.request('/projects/dashboard/metrics');
  }

  // Business Units
  async getBusinessUnits() {
    return this.request('/business-units');
  }
  async createBusinessUnit(bu: any) {
    return this.request('/business-units', {
      method: 'POST',
      body: JSON.stringify(bu),
    });
  }
  async updateBusinessUnit(id: string, updates: any) {
    return this.request(`/business-units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteBusinessUnit(id: string) {
    return this.request(`/business-units/${id}`, { method: 'DELETE' });
  }

  // Project Teams
  async getProjectTeams() {
    return this.request('/project-teams');
  }
  async addTeamMember(member: any) {
    return this.request('/project-teams', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }
  async removeTeamMember(id: string) {
    return this.request(`/project-teams/${id}`, { method: 'DELETE' });
  }

  // Users & Audit
  async getUsers() {
    return this.request('/auth/users');
  }
  async getAuditLogs(limit?: number) {
    return this.request(limit
      ? `/admin/activity-log?limit=${limit}`
      : '/admin/activity-log');
  }

  // Expenses
  async getExpenses(params: Record<string, any> = {}) {
    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/expenses${qs}`);
  }
  async getProjectExpenses(projectId: string, params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/expenses/project/${projectId}${qs ? `?${qs}` : ''}`);
  }
  async createExpense(expense: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  // Budget Categories
  async getBudgetCategories(projectId?: string) {
    return this.request(projectId
      ? `/budget-categories?project_id=${projectId}`
      : '/budget-categories');
  }
  async createBudgetCategory(category: any) {
    return this.request('/budget-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }
  async updateBudgetCategory(id: string, updates: any) {
    return this.request(`/budget-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteBudgetCategory(id: string) {
    return this.request(`/budget-categories/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request(`/notifications?user_id=${userId}`);
  }
  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true }),
    });
  }
  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }
  async markAllNotificationsAsRead(ids: string[]) {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
      body: JSON.stringify({ notification_ids: ids }),
    });
  }

  // 2FA
  async setup2FA() {
    return this.request('/auth/2fa/setup', { method: 'POST' });
  }
  async verify2FA(secret: string, code: string) {
    return this.request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ secret, code }),
    });
  }

  // Profile
  async getProfile(userId: string) {
    return this.request(`/auth/profile/${userId}`);
  }
  async createProfile(profile: any) {
    return this.request('/auth/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }
  async updateProfile(userId: string, updates: any) {
    return this.request(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Admin
  async getAdminExpenses() {
    return this.request('/admin/expenses');
  }

  // Generic helpers
  async get(endpoint: string, params?: Record<string, any>) {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`${endpoint}${qs}`);
  }
  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

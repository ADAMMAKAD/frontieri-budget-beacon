// src/lib/api.ts

// Use environment variable for API URL, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
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
    return this.request(`/api/projects${qs ? `?${qs}` : ''}`);
  }
  async getProject(id: string) {
    return this.request(`/api/projects/${id}`);
  }
  async createProject(project: any) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }
  async updateProject(id: string, updates: any) {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteProject(id: string) {
    return this.request(`/api/projects/${id}`, { method: 'DELETE' });
  }
  async getDashboardMetrics() {
    return this.request('/api/projects/dashboard/metrics');
  }

  // Business Units
  async getBusinessUnits() {
    const response = await this.request('/api/business-units');
    return response;
  }
  async createBusinessUnit(unit: any) {
    return this.request('/api/business-units', {
      method: 'POST',
      body: JSON.stringify(unit),
    });
  }
  async updateBusinessUnit(id: string, updates: any) {
    return this.request(`/api/business-units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteBusinessUnit(id: string) {
    return this.request(`/api/business-units/${id}`, { method: 'DELETE' });
  }

  // Project Teams
  async getProjectTeams(projectId: string) {
    return this.request(`/api/project-teams?project_id=${projectId}`);
  }
  async createProjectTeam(team: any) {
    return this.request('/api/project-teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }
  async deleteProjectTeam(id: string) {
    return this.request(`/api/project-teams/${id}`, { method: 'DELETE' });
  }
  async getUserProjects(userId: string) {
    return this.request(`/api/project-teams/user-projects/${userId}`);
  }
  async getAvailableUsers() {
    return this.request('/api/project-teams/available-users');
  }

  // Users & Audit
  async getUsers() {
    return this.request('/auth/users');
  }
  async getAuditLogs(limit?: number) {
    return this.request(limit
      ? `/api/admin/activity-log?limit=${limit}`
      : '/api/admin/activity-log');
  }

  // Expenses
  async getExpenses(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/expenses${qs ? `?${qs}` : ''}`);
  }

  async getExpensesByProject(projectId: string) {
    return this.request(`/api/expenses?project_id=${projectId}`);
  }
  async getExpense(id: string) {
    return this.request(`/api/expenses/${id}`);
  }
  async createExpense(expense: any) {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }
  async updateExpense(id: string, updates: any) {
    return this.request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteExpense(id: string) {
    return this.request(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  // Budget Categories
  async getBudgetCategories(projectId?: string) {
    const url = projectId ? `/api/budget-categories?project_id=${projectId}` : '/api/budget-categories';
    return this.request(url);
  }
  async createBudgetCategory(category: any) {
    return this.request('/api/budget-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }
  async updateBudgetCategory(id: string, updates: any) {
    return this.request(`/api/budget-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteBudgetCategory(id: string) {
    return this.request(`/api/budget-categories/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request(`/api/notifications?user_id=${userId}`);
  }
  async markNotificationAsRead(id: string) {
    return this.request(`/api/notifications/${id}/read`, { method: 'PUT' });
  }
  async deleteNotification(id: string) {
    return this.request(`/api/notifications/${id}`, { method: 'DELETE' });
  }
  async markAllNotificationsAsRead(ids: string[]) {
    return this.request('/api/notifications/mark-all-read', {
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
    return this.request('/api/admin/expenses');
  }

  // Analytics
  async getAnalyticsDashboard() {
    return this.request('/api/analytics/dashboard');
  }
  async getAnalyticsRisks() {
    return this.request('/api/analytics/risks');
  }
  async getAnalyticsInsights() {
    return this.request('/api/analytics/insights');
  }
  async getAnalyticsPerformance() {
    return this.request('/api/analytics/performance');
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

  // Project admin expense approval
  async approveExpenseAsProjectAdmin(expenseId: string, status: 'approved' | 'rejected', comments?: string) {
    return this.request(`/api/project-teams/expenses/${expenseId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments })
    });
  }

  // Project Admin Management
  async getProjectAdmins(projectId: string) {
    return this.request(`/api/project-admin/${projectId}/admins`);
  }
  async assignProjectAdmin(projectId: string, userId: string) {
    return this.request(`/api/project-admin/${projectId}/admins`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
  async removeProjectAdmin(projectId: string, userId: string) {
    return this.request(`/api/project-admin/${projectId}/admins/${userId}`, {
      method: 'DELETE'
    });
  }
  async getUserProjectPermissions(projectId: string) {
    return this.request(`/api/project-admin/permissions/${projectId}`);
  }
  async getUserAdminProjects() {
    return this.request('/api/project-admin/my-admin-projects');
  }
  async getProjectPermissionsList() {
    return this.request('/api/project-admin/permissions-list');
  }
}

export const apiClient = new ApiClient();

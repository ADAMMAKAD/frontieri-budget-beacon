const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    department: string;
    role?: string;
  }) {
    return this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUserById(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  async assignRole(userId: string, role: string) {
    return this.request(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async removeRole(userId: string, roleId: string) {
    return this.request(`/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects() {
    return this.request<any[]>('/projects');
  }

  async getProjectById(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(projectData: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async getProjectTeams(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/teams`);
  }

  async addTeamMember(projectId: string, memberData: any) {
    return this.request(`/projects/${projectId}/teams`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async removeTeamMember(projectId: string, userId: string) {
    return this.request(`/projects/${projectId}/teams/${userId}`, {
      method: 'DELETE',
    });
  }

  // Expenses
  async getExpenses() {
    return this.request<any[]>('/expenses');
  }

  async getProjectExpenses(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/expenses`);
  }

  async createExpense(expenseData: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id: string, expenseData: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  async approveExpense(id: string) {
    return this.request(`/expenses/${id}/approve`, { method: 'POST' });
  }

  // Budget Management
  async getProjectBudgets(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/budgets`);
  }

  async createBudgetVersion(projectId: string, budgetData: any) {
    return this.request<any>(`/projects/${projectId}/budgets`, {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudgetVersion(id: string, budgetData: any) {
    return this.request<any>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  }

  async getBudgetCategories(budgetId: string) {
    return this.request<any[]>(`/budgets/${budgetId}/categories`);
  }

  async createBudgetCategory(budgetId: string, categoryData: any) {
    return this.request<any>(`/budgets/${budgetId}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateBudgetCategory(id: string, categoryData: any) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  // Business Units
  async getBusinessUnits() {
    return this.request<any[]>('/business-units');
  }

  async createBusinessUnit(unitData: any) {
    return this.request<any>('/business-units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateBusinessUnit(id: string, unitData: any) {
    return this.request<any>(`/business-units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async deleteBusinessUnit(id: string) {
    return this.request(`/business-units/${id}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();

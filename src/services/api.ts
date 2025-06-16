
const API_BASE_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  register: (userData: { email: string; password: string; fullName: string; department: string; role?: string }) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  login: (credentials: { email: string; password: string }) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  me: () =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    }).then(handleResponse)
};

// Projects API
export const projectsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    
    return fetch(`${API_BASE_URL}/projects?${searchParams}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  create: (projectData: any) =>
    fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    }).then(handleResponse),

  update: (id: string, projectData: any) =>
    fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    }).then(handleResponse),

  delete: (id: string) =>
    fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse)
};

export default {
  auth: authAPI,
  projects: projectsAPI
};

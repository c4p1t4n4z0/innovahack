import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  
  getAllMentors: async () => {
    const response = await api.get('/admin/mentors');
    return response.data;
  },
  
  getMentorUsers: async (mentorId) => {
    const response = await api.get(`/admin/mentors/${mentorId}/users`);
    return response.data;
  },
  
  assignUserToMentor: async (userId, mentorId) => {
    const response = await api.post(`/admin/users/${userId}/assign-mentor`, { mentor_id: mentorId });
    return response.data;
  },
};

export const biService = {
  getStatistics: async () => {
    const response = await api.get('/admin/bi/statistics');
    return response.data;
  },
  
  getMentorPerformance: async () => {
    const response = await api.get('/admin/bi/mentor-performance');
    return response.data;
  },
};

export const mentorService = {
  getMyUsers: async (mentorId) => {
    const response = await api.get(`/mentor/my-users?mentor_id=${mentorId}`);
    return response.data;
  },
  
  getMyUser: async (mentorId, userId) => {
    const response = await api.get(`/mentor/my-users/${userId}?mentor_id=${mentorId}`);
    return response.data;
  },
};

export default api;


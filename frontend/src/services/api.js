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
  
  // Invitaciones (solo mentor)
  getInvitations: async (mentorId, status = 'pending') => {
    const response = await api.get(`/mentor/invitations?mentor_id=${mentorId}&status=${status}`);
    return response.data;
  },
  respondInvitation: async (mentorId, invitationId, action) => {
    const response = await api.post(`/mentor/invitations/${invitationId}/respond`, { mentor_id: mentorId, action });
    return response.data;
  },
  // Conversaciones y lectura
  getConversations: async (mentorId) => {
    const response = await api.get(`/mentor/conversations?mentor_id=${mentorId}`);
    return response.data;
  },
  markMessagesRead: async (mentorId, userId) => {
    const response = await api.post(`/mentor/messages/read`, { mentor_id: mentorId, user_id: userId });
    return response.data;
  },
  listMessages: async (mentorId, userId) => {
    const response = await api.get(`/mentor/messages?mentor_id=${mentorId}&user_id=${userId}`);
    return response.data;
  },
  sendMessage: async (mentorId, userId, content, file = null) => {
    const formData = new FormData();
    formData.append('mentor_id', mentorId);
    formData.append('user_id', userId);
    if (content) {
      formData.append('content', content);
    }
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.post(`/mentor/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  downloadFile: async (messageId, mentorId) => {
    const response = await api.get(`/mentor/messages/files/${messageId}?mentor_id=${mentorId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const userService = {
  // Perfil propio
  getProfile: async (userId) => {
    const response = await api.get(`/user/profile/${userId}`);
    return response.data;
  },
  updateProfile: async (userId, data) => {
    const response = await api.put(`/user/profile/${userId}`, data);
    return response.data;
  },
  // Emprendimiento
  updateBusiness: async (userId, { name, category, description }) => {
    const response = await api.put(`/user/business/${userId}`, { name, category, description });
    return response.data;
  },
  // Invitaciones a mentor
  listMyInvitations: async (userId) => {
    const response = await api.get(`/user/mentor-invitations/${userId}`);
    return response.data;
  },
  requestMentor: async (userId, mentorId, message) => {
    const response = await api.post(`/user/request-mentor`, { user_id: userId, mentor_id: mentorId, message });
    return response.data;
  },
  // Mensajes con mi mentora
  listMessages: async (userId) => {
    const response = await api.get(`/user/messages/${userId}`);
    return response.data;
  },
  sendMessage: async (userId, content, file = null) => {
    const formData = new FormData();
    formData.append('user_id', userId);
    if (content) {
      formData.append('content', content);
    }
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.post(`/user/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  downloadFile: async (messageId, userId) => {
    const response = await api.get(`/user/messages/files/${messageId}?user_id=${userId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  markMessagesRead: async (userId) => {
    const response = await api.post(`/user/messages/read`, { user_id: userId });
    return response.data;
  },
  getUnreadCount: async (userId) => {
    const response = await api.get(`/user/messages/unread-count/${userId}`);
    return response.data;
  },
};

export const salesService = {
  // Parámetros mensuales
  getParameters: async (userId, monthYear = null) => {
    const url = monthYear 
      ? `/sales/parameters/${userId}?month_year=${monthYear}`
      : `/sales/parameters/${userId}`;
    const response = await api.get(url);
    return response.data;
  },
  
  updateParameters: async (userId, parameters) => {
    const response = await api.put(`/sales/parameters/${userId}`, parameters);
    return response.data;
  },
  
  // Ventas diarias
  getSales: async (userId, monthYear = null) => {
    const url = monthYear 
      ? `/sales/sales/${userId}?month_year=${monthYear}`
      : `/sales/sales/${userId}`;
    const response = await api.get(url);
    return response.data;
  },
  
  createSale: async (userId, sale) => {
    const response = await api.post(`/sales/sales/${userId}`, sale);
    return response.data;
  },
  
  deleteSale: async (userId, saleId) => {
    const response = await api.delete(`/sales/sales/${userId}/${saleId}`);
    return response.data;
  },
  
  // Reportes
  getReport: async (userId, monthYear = null) => {
    const url = monthYear 
      ? `/sales/report/${userId}?month_year=${monthYear}`
      : `/sales/report/${userId}`;
    const response = await api.get(url);
    return response.data;
  },
};

export const aiService = {
  generateAIMentorProgram: async (params) => {
    const response = await api.post('/ai/generate-mentor-program', params);
    return response.data;
  }
};

export default api;


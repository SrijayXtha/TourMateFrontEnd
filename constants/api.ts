import axios from 'axios';

// Backend API Configuration
// For Android emulator use: http://10.0.2.2:4000
// For iOS simulator use: http://localhost:4000
// For physical device use your computer's IP address
export const API_BASE_URL = 'http://localhost:4000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API endpoints
export const authAPI = {
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  googleLogin: async (payload: { idToken: string; role?: string }) => {
    const response = await api.post('/auth/google', payload);
    return response.data;
  },
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      return Promise.reject({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'Cannot connect to server. Please check if backend is running.',
        status: 0,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: -1,
      });
    }
  }
);

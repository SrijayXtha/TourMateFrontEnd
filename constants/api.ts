import axios from 'axios';
let AsyncStorage: any = null;

// Lazy load AsyncStorage to avoid import errors if not installed
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('AsyncStorage not available - install @react-native-async-storage/async-storage');
}

// Backend API Configuration
// Automatically detects the correct URL based on environment
const getApiUrl = (): string => {
  // Priority 1: Environment variable (highest priority)
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const normalizedEnvUrl = envUrl.replace(/\/+$/, '');
    console.log('📡 Using API URL from EXPO_PUBLIC_API_URL:', normalizedEnvUrl);
    return normalizedEnvUrl;
  }
  
  // Priority 2: Device detection
  // For Android emulator
  if (process.env.EXPO_KERNEL_ENVIRONMENT === 'embedded' || process.env.REACT_NATIVE_ANDROID) {
    console.log('📱 Detected Android Emulator - using 10.0.2.2:4000');
    return 'http://10.0.2.2:4000';
  }
  
  // Priority 3: Development mode defaults
  // For web/Expo Go on same machine
  const isDev = process.env.NODE_ENV !== 'production';

  // Fallback to localhost for local development.
  // In production, EXPO_PUBLIC_API_URL should always be configured.
  const defaultUrl = 'http://localhost:4000';
  if (!isDev) {
    console.warn(
      'EXPO_PUBLIC_API_URL is not set in production. Falling back to localhost, which will likely fail outside local environments.'
    );
  }

  console.log('📡 Using API URL:', defaultUrl);
  console.log('   ℹ️  For Android emulator, use: 10.0.2.2:4000');
  console.log('   ℹ️  For physical device, use: <your-machine-ip>:4000 (e.g., 192.168.1.74:4000)');
  console.log('   ℹ️  Set EXPO_PUBLIC_API_URL env var to override');
  
  return defaultUrl;
};

export const API_BASE_URL = getApiUrl();

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token Management Utils
export const TokenManager = {
  async setToken(token: string) {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    if (!AsyncStorage) return null;
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  },

  async clearToken() {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  },

  async setUser(user: any) {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  },

  async getUser(): Promise<any | null> {
    if (!AsyncStorage) return null;
    try {
      const user = await AsyncStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  async clearUser() {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  },

  async logout() {
    if (!AsyncStorage) return;
    await this.clearToken();
    await this.clearUser();
  },
};

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API endpoints
export const authAPI = {
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    experienceYears?: string;
    businessName?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    // Store token and user data on successful registration
    if (response.data.status === 'success' && response.data.data?.token) {
      await TokenManager.setToken(response.data.data.token);
      await TokenManager.setUser(response.data.data.user);
    }
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    // Store token and user data on successful login
    if (response.data.status === 'success' && response.data.data?.token) {
      await TokenManager.setToken(response.data.data.token);
      await TokenManager.setUser(response.data.data.user);
    }
    return response.data;
  },

  googleLogin: async (payload: { idToken: string; role?: string }) => {
    const response = await api.post('/auth/google', payload);
    // Store token and user data on successful Google login
    if (response.data.status === 'success' && response.data.data?.token) {
      await TokenManager.setToken(response.data.data.token);
      await TokenManager.setUser(response.data.data.user);
    }
    return response.data;
  },

  logout: async () => {
    await TokenManager.logout();
  },

  getCurrentUser: async () => {
    return await TokenManager.getUser();
  },

  isAuthenticated: async () => {
    const token = await TokenManager.getToken();
    return !!token;
  },
};

const parsePrice = (value?: number | string): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = value.replace(/[^0-9.]/g, '');
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const touristAPI = {
  getProfile: async () => {
    const response = await api.get('/tourist/profile');
    return response.data;
  },

  updateProfile: async (payload: {
    fullName?: string;
    phone?: string;
    emergencyContact?: string;
    preferences?: string[];
  }) => {
    const response = await api.patch('/tourist/profile', payload);
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/tourist/bookings');
    return response.data;
  },

  createBooking: async (payload: {
    guideId?: number | string;
    hotelId?: number | string;
    startDate: string;
    endDate: string;
    totalPrice?: number | string;
  }) => {
    const response = await api.post('/tourist/bookings', {
      guideId: payload.guideId,
      hotelId: payload.hotelId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalPrice: parsePrice(payload.totalPrice),
    });
    return response.data;
  },

  reportIncident: async (payload: {
    bookingId?: number;
    incidentType: string;
    details: string;
    location?: string;
  }) => {
    const response = await api.post('/tourist/incidents', payload);
    return response.data;
  },

  reportSOS: async (payload: { location: string; description?: string }) => {
    const response = await api.post('/tourist/sos', payload);
    return response.data;
  },

  getSavedPlaces: async () => {
    const response = await api.get('/tourist/saved-places');
    return response.data;
  },

  addSavedPlace: async (payload: {
    name: string;
    location?: string;
    image?: string;
    notes?: string;
  }) => {
    const response = await api.post('/tourist/saved-places', payload);
    return response.data;
  },

  removeSavedPlace: async (placeId: string) => {
    const response = await api.delete(`/tourist/saved-places/${placeId}`);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/tourist/payment-methods');
    return response.data;
  },

  addPaymentMethod: async (payload: {
    label: string;
    brand?: string;
    last4: string;
    expiryMonth?: string;
    expiryYear?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post('/tourist/payment-methods', payload);
    return response.data;
  },

  removePaymentMethod: async (methodId: string) => {
    const response = await api.delete(`/tourist/payment-methods/${methodId}`);
    return response.data;
  },

  updatePrivacySettings: async (payload: {
    profileVisibility?: 'public' | 'private';
    shareLocation?: boolean;
    twoFactorEnabled?: boolean;
  }) => {
    const response = await api.patch('/tourist/privacy-settings', payload);
    return response.data;
  },

  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get('/tourist/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  markNotificationRead: async (notificationId: number) => {
    const response = await api.patch(`/tourist/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.patch('/tourist/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: number) => {
    const response = await api.delete(`/tourist/notifications/${notificationId}`);
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get('/tourist/reviews');
    return response.data;
  },
};

export const guideAPI = {
  getProfile: async () => {
    const response = await api.get('/guide/profile');
    return response.data;
  },

  updateProfile: async (payload: {
    bio?: string;
    experienceYears?: number;
    isAvailable?: boolean;
  }) => {
    const response = await api.patch('/guide/profile', payload);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/guide/dashboard');
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/guide/bookings');
    return response.data;
  },

  acceptBooking: async (bookingId: number) => {
    const response = await api.patch(`/guide/bookings/${bookingId}/accept`);
    return response.data;
  },

  rejectBooking: async (bookingId: number, reason?: string) => {
    const response = await api.patch(`/guide/bookings/${bookingId}/reject`, { reason });
    return response.data;
  },

  updateAvailability: async (isAvailable: boolean) => {
    const response = await api.patch('/guide/availability', { isAvailable });
    return response.data;
  },

  getUpcomingTours: async () => {
    const response = await api.get('/guide/upcoming-tours');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/guide/analytics');
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get('/guide/reviews');
    return response.data;
  },

  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get('/guide/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  markNotificationRead: async (notificationId: number) => {
    const response = await api.patch(`/guide/notifications/${notificationId}/read`);
    return response.data;
  },

  deleteNotification: async (notificationId: number) => {
    const response = await api.delete(`/guide/notifications/${notificationId}`);
    return response.data;
  },

  getMessages: async () => {
    const response = await api.get('/guide/messages');
    return response.data;
  },

  sendMessage: async (payload: { receiverId: number; content: string }) => {
    const response = await api.post('/guide/messages', payload);
    return response.data;
  },
};

export const hotelAPI = {
  getProfile: async () => {
    const response = await api.get('/hotel/profile');
    return response.data;
  },

  updateProfile: async (payload: {
    hotelName?: string;
    location?: string;
    description?: string;
    basePrice?: number;
    images?: string[];
    roomDetails?: Record<string, unknown>;
    facilities?: string[];
  }) => {
    const response = await api.patch('/hotel/profile', payload);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/hotel/dashboard');
    return response.data;
  },

  getBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await api.get('/hotel/bookings', { params });
    return response.data;
  },

  updateBookingStatus: async (bookingId: number, status: string) => {
    const response = await api.patch(`/hotel/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  acceptBooking: async (bookingId: number) => {
    const response = await api.patch(`/hotel/bookings/${bookingId}/accept`);
    return response.data;
  },

  rejectBooking: async (bookingId: number) => {
    const response = await api.patch(`/hotel/bookings/${bookingId}/reject`);
    return response.data;
  },

  handleCancelRequest: async (bookingId: number, approve: boolean) => {
    const response = await api.patch(`/hotel/bookings/${bookingId}/cancel-request`, { approve });
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get('/hotel/reviews');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/hotel/analytics');
    return response.data;
  },

  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get('/hotel/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  markNotificationRead: async (notificationId: number) => {
    const response = await api.patch(`/hotel/notifications/${notificationId}/read`);
    return response.data;
  },

  deleteNotification: async (notificationId: number) => {
    const response = await api.delete(`/hotel/notifications/${notificationId}`);
    return response.data;
  },
};

export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params?: { role?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getGuides: async (params?: { verified?: boolean; page?: number; limit?: number }) => {
    const response = await api.get('/admin/guides', { params });
    return response.data;
  },

  getHotels: async (params?: { verified?: boolean; page?: number; limit?: number }) => {
    const response = await api.get('/admin/hotels', { params });
    return response.data;
  },

  getBookings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },

  getPendingGuides: async () => {
    const response = await api.get('/admin/guides/pending-verification');
    return response.data;
  },

  verifyGuide: async (guideId: number) => {
    const response = await api.patch(`/admin/guides/${guideId}/verify`);
    return response.data;
  },

  rejectGuide: async (guideId: number, reason?: string) => {
    const response = await api.patch(`/admin/guides/${guideId}/reject`, { reason });
    return response.data;
  },

  getPendingHotels: async () => {
    const response = await api.get('/admin/hotels/pending-verification');
    return response.data;
  },

  verifyHotel: async (hotelId: number) => {
    const response = await api.patch(`/admin/hotels/${hotelId}/verify`);
    return response.data;
  },

  rejectHotel: async (hotelId: number, reason?: string) => {
    const response = await api.patch(`/admin/hotels/${hotelId}/reject`, { reason });
    return response.data;
  },

  getIncidents: async () => {
    const response = await api.get('/admin/incidents');
    return response.data;
  },

  resolveIncident: async (incidentId: number, resolution?: string) => {
    const response = await api.patch(`/admin/incidents/${incidentId}/resolve`, { resolution });
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await api.get('/admin/activities');
    return response.data;
  },

  deleteUser: async (userId: number, reason?: string) => {
    const response = await api.delete(`/admin/users/${userId}`, { data: { reason } });
    return response.data;
  },
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
    console.warn('API Warning:', {
      message: error?.message,
      code: error?.code,
      url: error?.config?.url,
      status: error?.response?.status,
    });
    
    if (error.response) {
      // Dev tunnel auth guard: private tunnels can return 401 for API calls.
      if (
        error.response.status === 401 &&
        API_BASE_URL.includes('devtunnels.ms')
      ) {
        return Promise.reject({
          message:
            'Dev tunnel authentication blocked the request. Make port 4000 Public with anonymous access in VS Code Ports, then retry.',
          status: 401,
        });
      }

      // Server responded with error status
      return Promise.reject({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
      });
    } else if (error.request) {
      // Request made but no response
      console.warn('No response from server. URL:', API_BASE_URL);
      return Promise.reject({
        message: `Cannot connect to server at ${API_BASE_URL}. Please check if backend is running.`,
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

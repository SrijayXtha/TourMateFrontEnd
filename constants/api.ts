import axios from 'axios';
import {
    clearFirebaseSession,
    ensureFirebaseSession,
    registerChatPresence,
    syncFirebaseAuthWithCredentials,
} from './firebase';
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
export const IS_DEMO_MODE =
  String(process.env.EXPO_PUBLIC_DEMO_MODE || '').toLowerCase() === 'true';

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

const getGuideLocationStorageKey = async () => {
  const currentUser = await TokenManager.getUser();
  const guideId = Number(currentUser?.id);
  return Number.isInteger(guideId)
    ? `guide_speciality_location_${guideId}`
    : 'guide_speciality_location';
};

const getStoredGuideLocation = async (): Promise<string | null> => {
  if (!AsyncStorage) return null;
  try {
    const key = await getGuideLocationStorageKey();
    const value = await AsyncStorage.getItem(key);
    const normalized = String(value || '').trim();
    return normalized || null;
  } catch (error) {
    console.warn('Failed to read guide location from storage:', error);
    return null;
  }
};

const setStoredGuideLocation = async (location?: string | null) => {
  if (!AsyncStorage) return;
  try {
    const key = await getGuideLocationStorageKey();
    const normalized = String(location || '').trim();

    if (!normalized) {
      await AsyncStorage.removeItem(key);
      return;
    }

    await AsyncStorage.setItem(key, normalized);
  } catch (error) {
    console.warn('Failed to persist guide location in storage:', error);
  }
};

const resolveUserProfile = (user: any) => {
  const profile = user && typeof user === 'object' ? user : {};
  const appUserId = Number(profile?.id ?? profile?.user_id);
  const fullName = String(profile?.fullName ?? profile?.full_name ?? '').trim();
  const role = String(profile?.role ?? '').trim();
  const email = String(profile?.email ?? '').trim().toLowerCase();

  return {
    appUserId: Number.isInteger(appUserId) && appUserId > 0 ? appUserId : null,
    fullName,
    role,
    email,
  };
};

const registerRealtimePresenceForUser = async (user: any) => {
  const profile = resolveUserProfile(user);
  if (!profile.appUserId) {
    return;
  }

  try {
    await registerChatPresence({
      appUserId: profile.appUserId,
      fullName: profile.fullName,
      role: profile.role,
      email: profile.email,
    });
  } catch (error) {
    console.warn('Unable to register realtime presence:', error);
  }
};

const syncRealtimeIdentity = async (params?: {
  email?: string;
  password?: string;
  fullName?: string;
  user?: any;
}) => {
  try {
    if (params?.email && params?.password) {
      await syncFirebaseAuthWithCredentials({
        email: params.email,
        password: params.password,
        fullName: params.fullName,
      });
    } else {
      await ensureFirebaseSession();
    }
  } catch (error) {
    console.warn('Unable to sync Firebase realtime identity:', error);
  }

  const userProfile = params?.user || (await TokenManager.getUser());
  await registerRealtimePresenceForUser(userProfile);
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
      await syncRealtimeIdentity({
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        user: response.data.data.user,
      });
    }
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    // Store token and user data on successful login
    if (response.data.status === 'success' && response.data.data?.token) {
      await TokenManager.setToken(response.data.data.token);
      await TokenManager.setUser(response.data.data.user);
      await syncRealtimeIdentity({
        email: credentials.email,
        password: credentials.password,
        fullName: response.data.data.user?.fullName,
        user: response.data.data.user,
      });
    }
    return response.data;
  },

  googleLogin: async (payload: { idToken: string; role?: string }) => {
    const response = await api.post('/auth/google', payload);
    // Store token and user data on successful Google login
    if (response.data.status === 'success' && response.data.data?.token) {
      await TokenManager.setToken(response.data.data.token);
      await TokenManager.setUser(response.data.data.user);
      await syncRealtimeIdentity({
        fullName: response.data.data.user?.fullName,
        user: response.data.data.user,
      });
    }
    return response.data;
  },

  logout: async () => {
    await clearFirebaseSession();
    await TokenManager.logout();
  },

  getCurrentUser: async () => {
    const user = await TokenManager.getUser();
    await syncRealtimeIdentity({ user });
    return user;
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

  getMessages: async (bookingId?: number) => {
    const response = await api.get('/tourist/messages', {
      params: bookingId ? { bookingId } : undefined,
    });
    return response.data;
  },

  sendMessage: async (payload: { receiverId?: number; bookingId?: number; content: string }) => {
    const response = await api.post('/tourist/messages', payload);
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
    const profile = response?.data?.data?.guide;
    if (profile && !profile.specialityLocation) {
      profile.specialityLocation = await getStoredGuideLocation();
    }
    return response.data;
  },

  updateProfile: async (payload: {
    bio?: string;
    experienceYears?: number;
    isAvailable?: boolean;
    specialityLocation?: string;
  }) => {
    const response = await api.patch('/guide/profile', payload);

    if (payload.specialityLocation !== undefined) {
      const normalizedLocation = String(payload.specialityLocation || '').trim() || null;
      await setStoredGuideLocation(normalizedLocation);

      const responseData = response?.data?.data;
      if (responseData?.guide && typeof responseData.guide === 'object') {
        responseData.guide.specialityLocation = normalizedLocation;
      } else if (responseData && typeof responseData === 'object') {
        responseData.specialityLocation = normalizedLocation;
      }
    }

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

  sendMessage: async (payload: { receiverId?: number; bookingId?: number; content: string }) => {
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

type DemoRole = 'tourist' | 'guide' | 'hotel' | 'admin';

interface DemoUserRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: DemoRole;
  createdAt: string;
}

interface DemoBooking {
  id: number;
  touristId: number;
  guideId: number | null;
  hotelId: number | null;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
}

const demoIso = (dayOffset = 0, hour = 10): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const demoSuccess = (message: string, data?: any) => ({
  status: 'success',
  message,
  ...(data !== undefined ? { data } : {}),
});

const asPositiveInt = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRole = (value?: string): DemoRole => {
  const role = String(value || '').toLowerCase();
  if (role === 'guide' || role === 'hotel' || role === 'admin') {
    return role;
  }
  return 'tourist';
};

const inferRoleFromEmail = (email: string): DemoRole => {
  const normalized = email.toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('guide')) return 'guide';
  if (normalized.includes('hotel')) return 'hotel';
  return 'tourist';
};

let demoUsers: DemoUserRecord[] = [
  {
    id: 1,
    fullName: 'System Admin',
    email: 'admin@tourmate.demo',
    phone: '9800000001',
    role: 'admin',
    createdAt: demoIso(-60, 9),
  },
  {
    id: 101,
    fullName: 'Demo Tourist',
    email: 'tourist@tourmate.demo',
    phone: '9800000101',
    role: 'tourist',
    createdAt: demoIso(-30, 10),
  },
  {
    id: 102,
    fullName: 'Alex Traveler',
    email: 'alex@tourmate.demo',
    phone: '9800000102',
    role: 'tourist',
    createdAt: demoIso(-18, 9),
  },
  {
    id: 201,
    fullName: 'Pema Sherpa',
    email: 'guide@tourmate.demo',
    phone: '9800000201',
    role: 'guide',
    createdAt: demoIso(-45, 11),
  },
  {
    id: 202,
    fullName: 'Nima Gurung',
    email: 'guide.pending@tourmate.demo',
    phone: '9800000202',
    role: 'guide',
    createdAt: demoIso(-8, 11),
  },
  {
    id: 301,
    fullName: 'Hotel Himalaya Owner',
    email: 'hotel@tourmate.demo',
    phone: '9800000301',
    role: 'hotel',
    createdAt: demoIso(-40, 10),
  },
  {
    id: 302,
    fullName: 'Sunrise Stay Owner',
    email: 'hotel.pending@tourmate.demo',
    phone: '9800000302',
    role: 'hotel',
    createdAt: demoIso(-6, 10),
  },
];

let demoGuideProfiles: Record<number, any> = {
  201: {
    bio: 'Experienced trekking guide focused on Himalayan routes.',
    specialityLocation: 'Sagarmatha',
    experienceYears: 6,
    licenseNumber: 'GUIDE-201',
    verifiedStatus: true,
    isAvailable: true,
  },
  202: {
    bio: 'Cultural guide available for city and heritage walks.',
    specialityLocation: 'Kathmandu Valley',
    experienceYears: 2,
    licenseNumber: 'GUIDE-202',
    verifiedStatus: false,
    isAvailable: true,
  },
};

let demoHotelProfiles: Record<number, any> = {
  301: {
    hotelName: 'Hotel Himalaya',
    location: 'Kathmandu',
    description: 'Comfortable hotel with city access and mountain views.',
    rating: 4.7,
    verifiedStatus: true,
    basePrice: 5600,
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'],
    roomDetails: { totalRooms: 30, roomsAvailable: 12 },
    facilities: ['WiFi', 'Restaurant', 'Airport Pickup'],
  },
  302: {
    hotelName: 'Sunrise Stay',
    location: 'Pokhara',
    description: 'Boutique hotel near lakeside attractions.',
    rating: 4.3,
    verifiedStatus: false,
    basePrice: 4200,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200'],
    roomDetails: { totalRooms: 20, roomsAvailable: 8 },
    facilities: ['WiFi', 'Breakfast'],
  },
};

const defaultPrivacySettings = {
  profileVisibility: 'public' as const,
  shareLocation: true,
  twoFactorEnabled: false,
};

let demoTouristSettings: Record<number, any> = {
  101: {
    emergencyContact: '9801000000',
    preferences: ['Adventure', 'Nature'],
    savedPlaces: [
      {
        id: 'sp_101_1',
        name: 'Phewa Lake',
        location: 'Pokhara',
        createdAt: demoIso(-4, 8),
      },
    ],
    paymentMethods: [
      {
        id: 'pm_101_1',
        label: 'Primary Visa',
        brand: 'Visa',
        last4: '4242',
        expiryMonth: '12',
        expiryYear: '2028',
        isDefault: true,
        createdAt: demoIso(-20, 8),
      },
    ],
    privacySettings: { ...defaultPrivacySettings },
  },
  102: {
    emergencyContact: '9802000000',
    preferences: ['Cultural'],
    savedPlaces: [],
    paymentMethods: [],
    privacySettings: { ...defaultPrivacySettings },
  },
};

let demoBookingSeq = 9104;
let demoBookings: DemoBooking[] = [
  {
    id: 9101,
    touristId: 101,
    guideId: 201,
    hotelId: null,
    startDate: demoIso(2, 9),
    endDate: demoIso(4, 9),
    status: 'pending',
    totalPrice: 7800,
  },
  {
    id: 9102,
    touristId: 101,
    guideId: null,
    hotelId: 301,
    startDate: demoIso(5, 12),
    endDate: demoIso(7, 12),
    status: 'confirmed',
    totalPrice: 11200,
  },
  {
    id: 9103,
    touristId: 102,
    guideId: null,
    hotelId: 301,
    startDate: demoIso(1, 12),
    endDate: demoIso(3, 12),
    status: 'pending_cancellation',
    totalPrice: 9200,
  },
  {
    id: 9104,
    touristId: 102,
    guideId: 201,
    hotelId: null,
    startDate: demoIso(-7, 9),
    endDate: demoIso(-5, 9),
    status: 'completed',
    totalPrice: 6300,
  },
];

let demoNotificationSeq = 12010;
let demoNotificationsByUser: Record<number, any[]> = {
  101: [
    {
      notification_id: 12001,
      title: 'Booking update',
      message: 'Your hotel booking has been confirmed.',
      type: 'booking',
      is_read: false,
      created_at: demoIso(-1, 9),
    },
  ],
  201: [
    {
      notification_id: 12002,
      title: 'New booking request',
      message: 'You have a pending guide booking request.',
      type: 'booking',
      is_read: false,
      created_at: demoIso(-1, 8),
    },
  ],
  301: [
    {
      notification_id: 12003,
      title: 'Cancellation requested',
      message: 'A tourist requested cancellation for booking #9103.',
      type: 'booking',
      is_read: false,
      created_at: demoIso(-1, 7),
    },
  ],
};

let demoMessageSeq = 13001;
let demoMessages: any[] = [
  {
    id: 13001,
    senderId: 201,
    receiverId: 101,
    content: 'Hello! Please confirm your tour start time.',
    isRead: false,
    sentAt: demoIso(-1, 14),
  },
];

let demoIncidentSeq = 14001;
let demoIncidents: any[] = [
  {
    id: 14001,
    touristId: 101,
    incidentType: 'Safety Concern',
    details: 'Trail section had poor lighting after sunset.',
    location: 'Nagarkot',
    createdAt: demoIso(-2, 19),
    resolved: false,
  },
];

let demoSosSeq = 15001;
let demoSosReports: any[] = [
  {
    id: 15001,
    touristId: 102,
    location: 'Pokhara Lakeside',
    description: 'Minor injury, requested assistance.',
    status: 'active',
    timestamp: demoIso(-1, 18),
  },
];

let demoActivitySeq = 16003;
let demoActivityLogs: any[] = [
  {
    id: 16001,
    type: 'guide_verified',
    description: 'Guide profile verified in demo mode.',
    adminName: 'System Admin',
    targetName: 'Pema Sherpa',
    timestamp: demoIso(-2, 13),
  },
  {
    id: 16002,
    type: 'booking_reviewed',
    description: 'Booking queue reviewed by admin.',
    adminName: 'System Admin',
    targetName: 'N/A',
    timestamp: demoIso(-1, 10),
  },
  {
    id: 16003,
    type: 'incident_flagged',
    description: 'Incident report escalated for supervisor review.',
    adminName: 'System Admin',
    targetName: 'Demo Tourist',
    timestamp: demoIso(-1, 16),
  },
];

let demoGuideReviewsByGuide: Record<number, any[]> = {
  201: [
    {
      id: 17001,
      rating: 5,
      comment: 'Excellent trekking experience and safety support.',
      touristName: 'Demo Tourist',
      createdAt: demoIso(-15, 12),
    },
    {
      id: 17002,
      rating: 4,
      comment: 'Very knowledgeable and friendly.',
      touristName: 'Alex Traveler',
      createdAt: demoIso(-8, 14),
    },
  ],
};

let demoHotelReviewsByHotel: Record<number, any[]> = {
  301: [
    {
      id: 18001,
      rating: 5,
      comment: 'Clean rooms and great staff support.',
      touristName: 'Demo Tourist',
      createdAt: demoIso(-12, 10),
    },
    {
      id: 18002,
      rating: 4,
      comment: 'Good location and smooth check-in process.',
      touristName: 'Alex Traveler',
      createdAt: demoIso(-3, 11),
    },
  ],
};

const getDemoUserById = (id: number): DemoUserRecord | undefined =>
  demoUsers.find((user) => user.id === id);

const getDemoUserByEmail = (email: string): DemoUserRecord | undefined =>
  demoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

const toAuthUser = (user: DemoUserRecord) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

const toSnakeUser = (user: DemoUserRecord) => ({
  user_id: user.id,
  full_name: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  created_at: user.createdAt,
});

const ensureTouristSettings = (touristId: number) => {
  if (!demoTouristSettings[touristId]) {
    demoTouristSettings[touristId] = {
      emergencyContact: '',
      preferences: [],
      savedPlaces: [],
      paymentMethods: [],
      privacySettings: { ...defaultPrivacySettings },
    };
  }
  return demoTouristSettings[touristId];
};

const addDemoActivity = (type: string, description: string, targetName = 'N/A') => {
  const adminName = getDemoUserById(1)?.fullName || 'System';
  demoActivitySeq += 1;
  demoActivityLogs.unshift({
    id: demoActivitySeq,
    type,
    description,
    adminName,
    targetName,
    timestamp: new Date().toISOString(),
  });
};

const addDemoNotification = (
  userId: number,
  title: string,
  message: string,
  type = 'general',
  isRead = false
) => {
  demoNotificationSeq += 1;
  if (!demoNotificationsByUser[userId]) {
    demoNotificationsByUser[userId] = [];
  }
  demoNotificationsByUser[userId].unshift({
    notification_id: demoNotificationSeq,
    title,
    message,
    type,
    is_read: isRead,
    created_at: new Date().toISOString(),
  });
};

const getCurrentDemoUserRecord = async (): Promise<DemoUserRecord> => {
  const currentUser = await TokenManager.getUser();
  const currentId = Number(currentUser?.id);

  if (Number.isInteger(currentId)) {
    const byId = getDemoUserById(currentId);
    if (byId) {
      return byId;
    }
  }

  const byRole = demoUsers.find((user) => user.role === currentUser?.role);
  if (byRole) {
    return byRole;
  }

  return demoUsers.find((user) => user.role === 'tourist') as DemoUserRecord;
};

const mapTouristBooking = (booking: DemoBooking) => {
  const guideUser = booking.guideId ? getDemoUserById(booking.guideId) : undefined;
  const hotelUser = booking.hotelId ? getDemoUserById(booking.hotelId) : undefined;
  const hotelProfile = booking.hotelId ? demoHotelProfiles[booking.hotelId] : null;

  return {
    id: booking.id,
    type: booking.guideId ? 'guide' : 'hotel',
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    totalPrice: booking.totalPrice,
    guide: guideUser
      ? {
          id: guideUser.id,
          name: guideUser.fullName,
        }
      : null,
    hotel: hotelUser
      ? {
          id: hotelUser.id,
          name: hotelProfile?.hotelName || hotelUser.fullName,
          location: hotelProfile?.location || 'N/A',
          rating: toNumber(hotelProfile?.rating, 0),
        }
      : null,
  };
};

const mapGuideBooking = (booking: DemoBooking) => {
  const tourist = getDemoUserById(booking.touristId);
  return {
    id: booking.id,
    touristId: tourist?.id,
    touristName: tourist?.fullName || 'Tourist',
    touristPhone: tourist?.phone,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    totalPrice: booking.totalPrice,
  };
};

const mapHotelBooking = (booking: DemoBooking) => {
  const tourist = getDemoUserById(booking.touristId);
  return {
    id: booking.id,
    touristName: tourist?.fullName || 'Tourist',
    touristEmail: tourist?.email,
    touristPhone: tourist?.phone,
    checkIn: booking.startDate,
    checkOut: booking.endDate,
    status: booking.status,
    totalPrice: booking.totalPrice,
  };
};

const averageRating = (reviews: Array<{ rating?: number }>): number => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + toNumber(review.rating, 0), 0);
  return Number((total / reviews.length).toFixed(2));
};

if (IS_DEMO_MODE) {
  console.log('[TourMate] Demo mode is enabled. Using in-memory dummy API responses.');

  const createDemoUser = (payload: {
    fullName?: string;
    email: string;
    phone?: string;
    role: DemoRole;
    businessName?: string;
    experienceYears?: string;
  }) => {
    const nextId = Math.max(...demoUsers.map((user) => user.id)) + 1;
    const createdAt = new Date().toISOString();

    const user: DemoUserRecord = {
      id: nextId,
      fullName: payload.fullName?.trim() || 'Demo User',
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || '9800009999',
      role: payload.role,
      createdAt,
    };

    demoUsers.push(user);

    if (payload.role === 'tourist') {
      ensureTouristSettings(user.id);
    }

    if (payload.role === 'guide') {
      demoGuideProfiles[user.id] = {
        bio: 'New demo guide profile.',
        specialityLocation: 'Kathmandu Valley',
        experienceYears: Number.parseInt(payload.experienceYears || '0', 10) || 0,
        licenseNumber: `GUIDE-${user.id}`,
        verifiedStatus: false,
        isAvailable: true,
      };
    }

    if (payload.role === 'hotel') {
      demoHotelProfiles[user.id] = {
        hotelName: payload.businessName || `${user.fullName} Hotel`,
        location: 'Kathmandu',
        description: 'New demo hotel profile awaiting verification.',
        rating: 4.2,
        verifiedStatus: false,
        basePrice: 5000,
        images: [],
        roomDetails: { totalRooms: 20, roomsAvailable: 20 },
        facilities: ['WiFi'],
      };
    }

    return user;
  };

  const demoAuthSuccess = async (message: string, user: DemoUserRecord) => {
    const authUser = toAuthUser(user);
    const token = `demo-token-${user.role}-${user.id}`;
    await TokenManager.setToken(token);
    await TokenManager.setUser(authUser);
    return {
      status: 'success',
      message,
      data: {
        token,
        user: authUser,
      },
      user: authUser,
    };
  };

  authAPI.register = async (userData) => {
    const role = normalizeRole(userData.role);
    if (role === 'admin') {
      throw { message: 'Admin registration is not allowed via API', status: 403 };
    }

    const existing = getDemoUserByEmail(userData.email);
    if (existing) {
      throw { message: 'Account with this email already exists', status: 409 };
    }

    const user = createDemoUser({
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      role,
      businessName: userData.businessName,
      experienceYears: userData.experienceYears,
    });

    addDemoActivity('user_registered', `${user.fullName} registered as ${role}.`, user.fullName);
    const authResponse = await demoAuthSuccess('User registered successfully (demo)', user);
    await syncRealtimeIdentity({
      email: userData.email,
      password: userData.password,
      fullName: user.fullName,
      user: authResponse?.data?.user,
    });
    return authResponse;
  };

  authAPI.login = async (credentials) => {
    const email = credentials.email.trim().toLowerCase();
    let user = getDemoUserByEmail(email);

    if (!user) {
      user = createDemoUser({
        fullName: email.split('@')[0].replace(/[._-]/g, ' ').trim() || 'Demo User',
        email,
        role: inferRoleFromEmail(email),
      });
    }

    const authResponse = await demoAuthSuccess('Login successful (demo)', user);
    await syncRealtimeIdentity({
      email: credentials.email,
      password: credentials.password,
      fullName: user.fullName,
      user: authResponse?.data?.user,
    });
    return authResponse;
  };

  authAPI.googleLogin = async (payload) => {
    const role = normalizeRole(payload.role || 'tourist');
    const email = `google.${role}@tourmate.demo`;
    let user = getDemoUserByEmail(email);

    if (!user) {
      user = createDemoUser({
        fullName: `Google ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        email,
        role,
      });
    }

    const authResponse = await demoAuthSuccess('Google login successful (demo)', user);
    await syncRealtimeIdentity({
      fullName: user.fullName,
      user: authResponse?.data?.user,
    });
    return authResponse;
  };

  touristAPI.getProfile = async () => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);

    return demoSuccess('Profile retrieved (demo)', {
      ...toSnakeUser(user),
      emergencyContact: settings.emergencyContact,
      preferences: settings.preferences,
      savedPlaces: settings.savedPlaces,
      paymentMethods: settings.paymentMethods,
      privacySettings: settings.privacySettings,
    });
  };

  touristAPI.updateProfile = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);

    if (payload.fullName) {
      user.fullName = payload.fullName.trim();
    }
    if (payload.phone) {
      user.phone = payload.phone.trim();
    }

    settings.emergencyContact = payload.emergencyContact || settings.emergencyContact;
    settings.preferences = Array.isArray(payload.preferences)
      ? payload.preferences
      : settings.preferences;

    addDemoActivity('tourist_profile_updated', `Tourist profile updated by ${user.fullName}.`, user.fullName);

    return demoSuccess('Tourist profile updated (demo)', {
      emergencyContact: settings.emergencyContact,
      preferences: settings.preferences,
    });
  };

  touristAPI.getBookings = async () => {
    const user = await getCurrentDemoUserRecord();
    const bookings = demoBookings
      .filter((booking) => booking.touristId === user.id)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map(mapTouristBooking);

    return demoSuccess('Bookings retrieved (demo)', {
      count: bookings.length,
      bookings,
    });
  };

  touristAPI.createBooking = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const guideId = asPositiveInt(payload.guideId);
    const hotelId = asPositiveInt(payload.hotelId);

    if (!guideId && !hotelId) {
      throw { message: 'Either guide or hotel is required', status: 400 };
    }

    if (guideId && hotelId) {
      throw { message: 'Booking must target either a guide or a hotel, not both', status: 400 };
    }

    demoBookingSeq += 1;
    const booking: DemoBooking = {
      id: demoBookingSeq,
      touristId: user.id,
      guideId: guideId || null,
      hotelId: hotelId || null,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'pending',
      totalPrice: toNumber(payload.totalPrice, 0),
    };

    demoBookings.unshift(booking);

    const recipientId = booking.guideId || booking.hotelId;
    if (recipientId) {
      addDemoNotification(
        recipientId,
        'New booking request',
        `New booking request from ${user.fullName}.`,
        'booking',
        false
      );
    }

    addDemoNotification(
      user.id,
      'Booking submitted',
      'Your booking request has been submitted and is awaiting confirmation.',
      'booking',
      false
    );

    return demoSuccess('Booking created successfully (demo)', {
      bookingId: booking.id,
      type: booking.guideId ? 'guide' : 'hotel',
      status: booking.status,
    });
  };

  touristAPI.reportIncident = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    demoIncidentSeq += 1;

    const incident = {
      id: demoIncidentSeq,
      touristId: user.id,
      incidentType: payload.incidentType,
      details: payload.details,
      location: payload.location || 'Unknown',
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    demoIncidents.unshift(incident);
    addDemoNotification(1, 'New incident report', `Incident reported by ${user.fullName}.`, 'incident', false);

    return demoSuccess('Incident reported (demo)', {
      incidentId: incident.id,
    });
  };

  touristAPI.reportSOS = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    demoSosSeq += 1;

    const sos = {
      id: demoSosSeq,
      touristId: user.id,
      location: payload.location,
      description: payload.description || null,
      status: 'active',
      timestamp: new Date().toISOString(),
    };

    demoSosReports.unshift(sos);
    addDemoNotification(1, 'SOS alert received', `SOS reported by ${user.fullName}.`, 'sos', false);

    return demoSuccess('SOS report created (demo)', {
      reportId: sos.id,
      status: sos.status,
    });
  };

  touristAPI.getSavedPlaces = async () => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);
    return demoSuccess('Saved places retrieved (demo)', {
      count: settings.savedPlaces.length,
      places: settings.savedPlaces,
    });
  };

  touristAPI.addSavedPlace = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);
    const place = {
      id: `sp_${user.id}_${Date.now()}`,
      name: payload.name,
      location: payload.location,
      image: payload.image,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    settings.savedPlaces = [place, ...settings.savedPlaces];
    return demoSuccess('Place saved (demo)', {
      place,
      count: settings.savedPlaces.length,
    });
  };

  touristAPI.removeSavedPlace = async (placeId) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);
    settings.savedPlaces = settings.savedPlaces.filter((place: any) => place.id !== placeId);

    return demoSuccess('Saved place removed (demo)', {
      count: settings.savedPlaces.length,
    });
  };

  touristAPI.getPaymentMethods = async () => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);
    return demoSuccess('Payment methods retrieved (demo)', {
      count: settings.paymentMethods.length,
      methods: settings.paymentMethods,
    });
  };

  touristAPI.addPaymentMethod = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);

    const method = {
      id: `pm_${user.id}_${Date.now()}`,
      label: payload.label,
      brand: payload.brand,
      last4: String(payload.last4).slice(-4),
      expiryMonth: payload.expiryMonth,
      expiryYear: payload.expiryYear,
      isDefault: Boolean(payload.isDefault),
      createdAt: new Date().toISOString(),
    };

    settings.paymentMethods = settings.paymentMethods.map((item: any) => ({
      ...item,
      isDefault: method.isDefault ? false : item.isDefault,
    }));

    settings.paymentMethods.unshift(method);

    return demoSuccess('Payment method added (demo)', {
      method,
      count: settings.paymentMethods.length,
    });
  };

  touristAPI.removePaymentMethod = async (methodId) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);

    settings.paymentMethods = settings.paymentMethods.filter((method: any) => method.id !== methodId);
    if (
      settings.paymentMethods.length > 0 &&
      !settings.paymentMethods.some((method: any) => method.isDefault)
    ) {
      settings.paymentMethods[0].isDefault = true;
    }

    return demoSuccess('Payment method removed (demo)', {
      count: settings.paymentMethods.length,
    });
  };

  touristAPI.updatePrivacySettings = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const settings = ensureTouristSettings(user.id);
    settings.privacySettings = {
      ...settings.privacySettings,
      ...payload,
    };

    return demoSuccess('Privacy settings updated (demo)', {
      privacySettings: settings.privacySettings,
    });
  };

  touristAPI.getNotifications = async (page = 1, limit = 20) => {
    const user = await getCurrentDemoUserRecord();
    const notifications = [...(demoNotificationsByUser[user.id] || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const skip = (page - 1) * limit;
    const paged = notifications.slice(skip, skip + limit);
    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    return demoSuccess('Notifications retrieved (demo)', {
      notifications: paged,
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length,
        pages: Math.max(1, Math.ceil(notifications.length / limit)),
      },
    });
  };

  touristAPI.markNotificationRead = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    const notifications = demoNotificationsByUser[user.id] || [];
    const notification = notifications.find((item) => item.notification_id === notificationId);
    if (!notification) {
      throw { message: 'Notification not found', status: 404 };
    }
    notification.is_read = true;
    return demoSuccess('Notification marked as read (demo)');
  };

  touristAPI.markAllNotificationsRead = async () => {
    const user = await getCurrentDemoUserRecord();
    const notifications = demoNotificationsByUser[user.id] || [];
    notifications.forEach((notification) => {
      notification.is_read = true;
    });

    return demoSuccess('All notifications marked as read (demo)', {
      updated: notifications.length,
    });
  };

  touristAPI.deleteNotification = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    const notifications = demoNotificationsByUser[user.id] || [];
    demoNotificationsByUser[user.id] = notifications.filter(
      (notification) => notification.notification_id !== notificationId
    );

    return demoSuccess('Notification deleted (demo)');
  };

  touristAPI.getMessages = async (bookingId) => {
    const user = await getCurrentDemoUserRecord();
    const parsedBookingId = Number.parseInt(String(bookingId ?? ''), 10);

    let allowedGuideIds: number[] = [];

    if (Number.isInteger(parsedBookingId) && parsedBookingId > 0) {
      const booking = demoBookings.find(
        (item) =>
          item.id === parsedBookingId &&
          item.touristId === user.id &&
          item.status === 'confirmed' &&
          Boolean(item.guideId)
      );

      if (!booking?.guideId) {
        return demoSuccess('Messages retrieved (demo)', {
          count: 0,
          messages: [],
        });
      }

      allowedGuideIds = [booking.guideId];
    } else {
      allowedGuideIds = Array.from(
        new Set(
          demoBookings
            .filter(
              (item) =>
                item.touristId === user.id &&
                item.status === 'confirmed' &&
                Number.isInteger(item.guideId)
            )
            .map((item) => item.guideId as number)
        )
      );
    }

    const messages = demoMessages
      .filter((message) => {
        const senderId = Number(message.senderId || 0);
        const receiverId = Number(message.receiverId || 0);
        return (
          (senderId === user.id && allowedGuideIds.includes(receiverId)) ||
          (receiverId === user.id && allowedGuideIds.includes(senderId))
        );
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .map((message) => ({
        id: message.id,
        sender: (() => {
          const sender = getDemoUserById(message.senderId);
          return sender
            ? {
                user_id: sender.id,
                full_name: sender.fullName,
                role: sender.role,
              }
            : undefined;
        })(),
        receiver: (() => {
          const receiver = getDemoUserById(message.receiverId);
          return receiver
            ? {
                user_id: receiver.id,
                full_name: receiver.fullName,
                role: receiver.role,
              }
            : undefined;
        })(),
        content: message.content,
        isRead: message.isRead,
        sentAt: message.sentAt,
      }));

    return demoSuccess('Messages retrieved (demo)', {
      count: messages.length,
      messages,
    });
  };

  touristAPI.sendMessage = async (payload) => {
    const user = await getCurrentDemoUserRecord();

    if (!payload.content || !payload.content.trim()) {
      throw { message: 'Message content is required', status: 400 };
    }

    const bookingId = Number.parseInt(String(payload.bookingId ?? ''), 10);
    let resolvedReceiverId = Number.parseInt(String(payload.receiverId ?? ''), 10);

    if (Number.isInteger(bookingId) && bookingId > 0) {
      const confirmedBooking = demoBookings.find(
        (item) =>
          item.id === bookingId &&
          item.touristId === user.id &&
          item.status === 'confirmed' &&
          Boolean(item.guideId)
      );

      if (!confirmedBooking?.guideId) {
        throw { message: 'Chat is enabled only after booking is accepted', status: 403 };
      }

      resolvedReceiverId = confirmedBooking.guideId;
    }

    if (!Number.isInteger(resolvedReceiverId) || resolvedReceiverId <= 0) {
      throw { message: 'bookingId or receiverId is required', status: 400 };
    }

    const hasConfirmedBooking = demoBookings.some(
      (item) =>
        item.touristId === user.id &&
        item.guideId === resolvedReceiverId &&
        item.status === 'confirmed'
    );

    if (!hasConfirmedBooking) {
      throw { message: 'Chat is enabled only after booking is accepted', status: 403 };
    }

    const receiver = getDemoUserById(resolvedReceiverId);
    if (!receiver) {
      throw { message: 'Receiver not found', status: 404 };
    }

    demoMessageSeq += 1;
    const message = {
      id: demoMessageSeq,
      senderId: user.id,
      receiverId: resolvedReceiverId,
      content: payload.content.trim(),
      isRead: false,
      sentAt: new Date().toISOString(),
    };
    demoMessages.unshift(message);

    addDemoNotification(
      receiver.id,
      'New message',
      `You received a new message from ${user.fullName}.`,
      'message',
      false
    );

    return demoSuccess('Message sent (demo)', {
      messageId: message.id,
      sentAt: message.sentAt,
      receiverId: resolvedReceiverId,
    });
  };

  touristAPI.getReviews = async () => {
    const user = await getCurrentDemoUserRecord();
    const reviews = demoBookings
      .filter((booking) => booking.touristId === user.id && booking.status === 'completed')
      .map((booking) => ({
        id: booking.id,
        rating: 5,
        comment: booking.guideId
          ? 'Great guide support and itinerary.'
          : 'Comfortable stay and responsive team.',
        createdAt: booking.endDate,
      }));

    return demoSuccess('Reviews retrieved (demo)', {
      count: reviews.length,
      reviews,
    });
  };

  guideAPI.getProfile = async () => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoGuideProfiles[user.id] || {
      bio: '',
      specialityLocation: '',
      experienceYears: 0,
      licenseNumber: `GUIDE-${user.id}`,
      verifiedStatus: false,
      isAvailable: true,
    };
    const reviews = demoGuideReviewsByGuide[user.id] || [];

    return demoSuccess('Profile retrieved (demo)', {
      ...toSnakeUser(user),
      guide: {
        bio: profile.bio,
        specialityLocation: profile.specialityLocation || '',
        experienceYears: profile.experienceYears,
        licenseNumber: profile.licenseNumber,
        verifiedStatus: profile.verifiedStatus,
        isAvailable: profile.isAvailable,
        averageRating: averageRating(reviews),
        totalReviews: reviews.length,
      },
    });
  };

  guideAPI.updateProfile = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoGuideProfiles[user.id] || {};

    demoGuideProfiles[user.id] = {
      ...profile,
      bio: payload.bio ?? profile.bio,
      specialityLocation:
        payload.specialityLocation ?? profile.specialityLocation ?? '',
      experienceYears: payload.experienceYears ?? profile.experienceYears ?? 0,
      isAvailable:
        typeof payload.isAvailable === 'boolean'
          ? payload.isAvailable
          : profile.isAvailable ?? true,
      licenseNumber: profile.licenseNumber || `GUIDE-${user.id}`,
      verifiedStatus: profile.verifiedStatus ?? false,
    };

    return demoSuccess('Profile updated (demo)', {
      ...demoGuideProfiles[user.id],
    });
  };

  guideAPI.getDashboard = async () => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoGuideProfiles[user.id] || {
      verifiedStatus: false,
      experienceYears: 0,
      isAvailable: true,
    };
    const bookings = demoBookings.filter((booking) => booking.guideId === user.id);
    const pending = bookings.filter((booking) => booking.status === 'pending');
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
    const reviews = demoGuideReviewsByGuide[user.id] || [];

    const confirmedRevenue = bookings
      .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const pendingRevenue = bookings
      .filter((booking) => booking.status === 'pending')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const unread = (demoNotificationsByUser[user.id] || []).filter((item) => !item.is_read).length;

    return demoSuccess('Dashboard data retrieved (demo)', {
      user: {
        full_name: user.fullName,
      },
      guide: {
        verified_status: profile.verifiedStatus,
        experience_years: profile.experienceYears,
        is_available: profile.isAvailable,
      },
      stats: {
        totalBookings: bookings.length,
        pendingRequests: pending.length,
        confirmedBookings: confirmed.length,
        totalReviews: reviews.length,
        averageRating: averageRating(reviews),
        confirmedRevenue,
        pendingRevenue,
        notificationsUnread: unread,
      },
      pendingBookings: pending.map((booking) => {
        const tourist = getDemoUserById(booking.touristId);
        return {
          id: booking.id,
          touristName: tourist?.fullName || 'Tourist',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
        };
      }),
    });
  };

  guideAPI.getBookings = async () => {
    const user = await getCurrentDemoUserRecord();
    const bookings = demoBookings
      .filter((booking) => booking.guideId === user.id)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map(mapGuideBooking);

    return demoSuccess('Bookings retrieved (demo)', {
      count: bookings.length,
      bookings,
    });
  };

  guideAPI.acceptBooking = async (bookingId) => {
    const user = await getCurrentDemoUserRecord();
    const booking = demoBookings.find((item) => item.id === bookingId && item.guideId === user.id);
    if (!booking) {
      throw { message: 'Booking not found', status: 404 };
    }

    booking.status = 'confirmed';
    addDemoNotification(
      booking.touristId,
      'Booking confirmed',
      `${user.fullName} accepted your guide booking request.`,
      'booking',
      false
    );

    return demoSuccess('Booking accepted (demo)', {
      bookingId: booking.id,
      status: booking.status,
    });
  };

  guideAPI.rejectBooking = async (bookingId) => {
    const user = await getCurrentDemoUserRecord();
    const booking = demoBookings.find((item) => item.id === bookingId && item.guideId === user.id);
    if (!booking) {
      throw { message: 'Booking not found', status: 404 };
    }

    booking.status = 'rejected';
    addDemoNotification(
      booking.touristId,
      'Booking update',
      `${user.fullName} rejected your guide booking request.`,
      'booking',
      false
    );

    return demoSuccess('Booking rejected (demo)', {
      bookingId: booking.id,
      status: booking.status,
    });
  };

  guideAPI.updateAvailability = async (isAvailable) => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoGuideProfiles[user.id] || {
      bio: '',
      experienceYears: 0,
      licenseNumber: `GUIDE-${user.id}`,
      verifiedStatus: false,
    };
    profile.isAvailable = isAvailable;
    demoGuideProfiles[user.id] = profile;

    return demoSuccess('Availability updated (demo)', {
      isAvailable,
    });
  };

  guideAPI.getUpcomingTours = async () => {
    const user = await getCurrentDemoUserRecord();
    const now = Date.now();
    const tours = demoBookings
      .filter(
        (booking) =>
          booking.guideId === user.id &&
          booking.status === 'confirmed' &&
          new Date(booking.startDate).getTime() >= now
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map((booking) => {
        const tourist = getDemoUserById(booking.touristId);
        return {
          bookingId: booking.id,
          touristName: tourist?.fullName || 'Tourist',
          touristPhone: tourist?.phone,
          touristEmail: tourist?.email,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
        };
      });

    return demoSuccess('Upcoming tours retrieved (demo)', {
      count: tours.length,
      tours,
    });
  };

  guideAPI.getAnalytics = async () => {
    const user = await getCurrentDemoUserRecord();
    const bookings = demoBookings.filter((booking) => booking.guideId === user.id);
    const confirmedRevenue = bookings
      .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const pendingRevenue = bookings
      .filter((booking) => booking.status === 'pending')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const trendMap: Record<string, { month: string; bookings: number; revenue: number }> = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.startDate);
      if (Number.isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!trendMap[month]) {
        trendMap[month] = { month, bookings: 0, revenue: 0 };
      }
      trendMap[month].bookings += 1;
      trendMap[month].revenue += booking.totalPrice;
    });

    return demoSuccess('Guide analytics retrieved (demo)', {
      earnings: {
        confirmedRevenue,
        pendingRevenue,
      },
      totalBookings: bookings.length,
      trends: Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month)),
    });
  };

  guideAPI.getReviews = async () => {
    const user = await getCurrentDemoUserRecord();
    const reviews = demoGuideReviewsByGuide[user.id] || [];
    return demoSuccess('Reviews retrieved (demo)', {
      count: reviews.length,
      averageRating: averageRating(reviews),
      reviews,
    });
  };

  guideAPI.getNotifications = async (page = 1, limit = 20) => {
    const user = await getCurrentDemoUserRecord();
    const notifications = [...(demoNotificationsByUser[user.id] || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const skip = (page - 1) * limit;
    const paged = notifications.slice(skip, skip + limit);

    return demoSuccess('Guide notifications retrieved (demo)', {
      notifications: paged,
      unreadCount: notifications.filter((item) => !item.is_read).length,
      pagination: {
        page,
        limit,
        total: notifications.length,
        pages: Math.max(1, Math.ceil(notifications.length / limit)),
      },
    });
  };

  guideAPI.markNotificationRead = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    const notification = (demoNotificationsByUser[user.id] || []).find(
      (item) => item.notification_id === notificationId
    );
    if (!notification) {
      throw { message: 'Notification not found', status: 404 };
    }
    notification.is_read = true;
    return demoSuccess('Notification marked as read (demo)');
  };

  guideAPI.deleteNotification = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    demoNotificationsByUser[user.id] = (demoNotificationsByUser[user.id] || []).filter(
      (item) => item.notification_id !== notificationId
    );
    return demoSuccess('Notification deleted (demo)');
  };

  guideAPI.getMessages = async () => {
    const user = await getCurrentDemoUserRecord();
    const messages = demoMessages
      .filter((message) => message.senderId === user.id || message.receiverId === user.id)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .map((message) => ({
        id: message.id,
        sender: (() => {
          const sender = getDemoUserById(message.senderId);
          return sender
            ? {
                user_id: sender.id,
                full_name: sender.fullName,
                role: sender.role,
              }
            : undefined;
        })(),
        receiver: (() => {
          const receiver = getDemoUserById(message.receiverId);
          return receiver
            ? {
                user_id: receiver.id,
                full_name: receiver.fullName,
                role: receiver.role,
              }
            : undefined;
        })(),
        content: message.content,
        isRead: message.isRead,
        sentAt: message.sentAt,
      }));

    return demoSuccess('Messages retrieved (demo)', {
      count: messages.length,
      messages,
    });
  };

  guideAPI.sendMessage = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const bookingId = Number.parseInt(String(payload.bookingId ?? ''), 10);
    let resolvedReceiverId = Number.parseInt(String(payload.receiverId ?? ''), 10);

    if (Number.isInteger(bookingId) && bookingId > 0) {
      const confirmedBooking = demoBookings.find(
        (item) => item.id === bookingId && item.guideId === user.id && item.status === 'confirmed'
      );

      if (!confirmedBooking?.touristId) {
        throw { message: 'Chat is enabled only after booking is accepted', status: 403 };
      }

      resolvedReceiverId = confirmedBooking.touristId;
    }

    if (!Number.isInteger(resolvedReceiverId) || resolvedReceiverId <= 0) {
      throw { message: 'bookingId or receiverId is required', status: 400 };
    }

    const hasConfirmedBooking = demoBookings.some(
      (item) =>
        item.guideId === user.id &&
        item.touristId === resolvedReceiverId &&
        item.status === 'confirmed'
    );

    if (!hasConfirmedBooking) {
      throw { message: 'Chat is enabled only after booking is accepted', status: 403 };
    }

    const receiver = getDemoUserById(resolvedReceiverId);
    if (!receiver) {
      throw { message: 'Receiver not found', status: 404 };
    }

    demoMessageSeq += 1;
    const message = {
      id: demoMessageSeq,
      senderId: user.id,
      receiverId: resolvedReceiverId,
      content: payload.content.trim(),
      isRead: false,
      sentAt: new Date().toISOString(),
    };
    demoMessages.unshift(message);

    addDemoNotification(
      receiver.id,
      'New message',
      `You received a new message from ${user.fullName}.`,
      'message',
      false
    );

    return demoSuccess('Message sent (demo)', {
      messageId: message.id,
      sentAt: message.sentAt,
      receiverId: resolvedReceiverId,
    });
  };

  hotelAPI.getProfile = async () => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoHotelProfiles[user.id] || {
      hotelName: `${user.fullName} Hotel`,
      location: 'Kathmandu',
      description: '',
      rating: 0,
      verifiedStatus: false,
      basePrice: 0,
      images: [],
      roomDetails: { totalRooms: 0, roomsAvailable: 0 },
      facilities: [],
    };

    return demoSuccess('Profile retrieved (demo)', {
      ...toSnakeUser(user),
      hotel: {
        hotelName: profile.hotelName,
        location: profile.location,
        description: profile.description,
        rating: profile.rating,
        verifiedStatus: profile.verifiedStatus,
        basePrice: profile.basePrice,
        images: profile.images,
        roomDetails: profile.roomDetails,
        facilities: profile.facilities,
        totalReviews: (demoHotelReviewsByHotel[user.id] || []).length,
      },
    });
  };

  hotelAPI.updateProfile = async (payload) => {
    const user = await getCurrentDemoUserRecord();
    const current = demoHotelProfiles[user.id] || {
      hotelName: `${user.fullName} Hotel`,
      location: 'Kathmandu',
      description: '',
      rating: 0,
      verifiedStatus: false,
      basePrice: 0,
      images: [],
      roomDetails: { totalRooms: 0, roomsAvailable: 0 },
      facilities: [],
    };

    demoHotelProfiles[user.id] = {
      ...current,
      hotelName: payload.hotelName ?? current.hotelName,
      location: payload.location ?? current.location,
      description: payload.description ?? current.description,
      basePrice:
        payload.basePrice !== undefined ? toNumber(payload.basePrice, current.basePrice) : current.basePrice,
      images: Array.isArray(payload.images) ? payload.images : current.images,
      roomDetails: payload.roomDetails
        ? {
            ...current.roomDetails,
            ...payload.roomDetails,
          }
        : current.roomDetails,
      facilities: Array.isArray(payload.facilities) ? payload.facilities : current.facilities,
    };

    return demoSuccess('Profile updated (demo)', {
      ...demoHotelProfiles[user.id],
    });
  };

  hotelAPI.getDashboard = async () => {
    const user = await getCurrentDemoUserRecord();
    const profile = demoHotelProfiles[user.id] || {
      hotelName: `${user.fullName} Hotel`,
      location: 'Kathmandu',
      description: '',
      rating: 0,
      verifiedStatus: false,
      roomDetails: { totalRooms: 0, roomsAvailable: 0 },
      basePrice: 0,
    };
    const bookings = demoBookings.filter((booking) => booking.hotelId === user.id);
    const pending = bookings.filter((booking) => booking.status === 'pending');
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
    const cancelRequests = bookings.filter((booking) => booking.status === 'pending_cancellation');
    const reviews = demoHotelReviewsByHotel[user.id] || [];
    const confirmedRevenue = bookings
      .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const pendingRevenue = bookings
      .filter((booking) => booking.status === 'pending')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    return demoSuccess('Dashboard data retrieved (demo)', {
      user: { full_name: user.fullName },
      hotel: {
        hotel_name: profile.hotelName,
        location: profile.location,
        description: profile.description,
        rating: profile.rating,
        room_details: profile.roomDetails,
      },
      stats: {
        totalBookings: bookings.length,
        pendingRequests: pending.length,
        confirmedBookings: confirmed.length,
        cancelRequests: cancelRequests.length,
        roomsAvailable: toNumber(profile.roomDetails?.roomsAvailable, 0),
        totalRooms: toNumber(profile.roomDetails?.totalRooms, 0),
        totalReviews: reviews.length,
        averageRating: averageRating(reviews),
        confirmedRevenue,
        pendingRevenue,
      },
      pendingBookings: pending.map((booking) => {
        const tourist = getDemoUserById(booking.touristId);
        return {
          id: booking.id,
          touristName: tourist?.fullName || 'Tourist',
          checkIn: booking.startDate,
          checkOut: booking.endDate,
          totalPrice: booking.totalPrice,
        };
      }),
    });
  };

  hotelAPI.getBookings = async (params) => {
    const user = await getCurrentDemoUserRecord();
    const statusFilter = params?.status ? String(params.status).toLowerCase() : '';

    const bookings = demoBookings
      .filter((booking) => booking.hotelId === user.id)
      .filter((booking) => (statusFilter ? booking.status === statusFilter : true))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map(mapHotelBooking);

    const page = Math.max(1, Number.parseInt(String(params?.page || 1), 10) || 1);
    const limit = Math.max(1, Number.parseInt(String(params?.limit || 20), 10) || 20);
    const skip = (page - 1) * limit;
    const paged = bookings.slice(skip, skip + limit);

    return demoSuccess('Bookings retrieved (demo)', {
      count: paged.length,
      total: bookings.length,
      pagination: {
        page,
        limit,
        total: bookings.length,
        pages: Math.max(1, Math.ceil(bookings.length / limit)),
      },
      bookings: paged,
    });
  };

  hotelAPI.updateBookingStatus = async (bookingId, status) => {
    const user = await getCurrentDemoUserRecord();
    const allowedStatuses = [
      'pending',
      'confirmed',
      'rejected',
      'cancelled',
      'completed',
      'ongoing',
      'pending_cancellation',
    ];
    const normalizedStatus = String(status || '').toLowerCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw { message: `Status must be one of: ${allowedStatuses.join(', ')}`, status: 400 };
    }

    const booking = demoBookings.find((item) => item.id === bookingId && item.hotelId === user.id);
    if (!booking) {
      throw { message: 'Booking not found', status: 404 };
    }

    booking.status = normalizedStatus;
    addDemoNotification(
      booking.touristId,
      'Hotel booking status updated',
      `Your booking status is now: ${normalizedStatus}.`,
      'booking',
      false
    );

    return demoSuccess('Booking status updated (demo)', {
      bookingId: booking.id,
      status: booking.status,
    });
  };

  hotelAPI.acceptBooking = async (bookingId) => {
    return hotelAPI.updateBookingStatus(bookingId, 'confirmed');
  };

  hotelAPI.rejectBooking = async (bookingId) => {
    return hotelAPI.updateBookingStatus(bookingId, 'rejected');
  };

  hotelAPI.handleCancelRequest = async (bookingId, approve) => {
    return hotelAPI.updateBookingStatus(bookingId, approve ? 'cancelled' : 'confirmed');
  };

  hotelAPI.getReviews = async () => {
    const user = await getCurrentDemoUserRecord();
    const reviews = demoHotelReviewsByHotel[user.id] || [];
    return demoSuccess('Reviews retrieved (demo)', {
      count: reviews.length,
      averageRating: averageRating(reviews),
      reviews,
    });
  };

  hotelAPI.getAnalytics = async () => {
    const user = await getCurrentDemoUserRecord();
    const bookings = demoBookings.filter((booking) => booking.hotelId === user.id);
    const totalRevenue = bookings
      .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const trendMap: Record<string, { month: string; bookings: number; revenue: number }> = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.startDate);
      if (Number.isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!trendMap[month]) {
        trendMap[month] = { month, bookings: 0, revenue: 0 };
      }
      trendMap[month].bookings += 1;
      trendMap[month].revenue += booking.totalPrice;
    });

    return demoSuccess('Hotel analytics retrieved (demo)', {
      totalBookings: bookings.length,
      totalRevenue,
      trends: Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month)),
    });
  };

  hotelAPI.getNotifications = async (page = 1, limit = 20) => {
    const user = await getCurrentDemoUserRecord();
    const notifications = [...(demoNotificationsByUser[user.id] || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const skip = (page - 1) * limit;
    const paged = notifications.slice(skip, skip + limit);

    return demoSuccess('Hotel notifications retrieved (demo)', {
      notifications: paged,
      unreadCount: notifications.filter((item) => !item.is_read).length,
      pagination: {
        page,
        limit,
        total: notifications.length,
        pages: Math.max(1, Math.ceil(notifications.length / limit)),
      },
    });
  };

  hotelAPI.markNotificationRead = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    const notification = (demoNotificationsByUser[user.id] || []).find(
      (item) => item.notification_id === notificationId
    );
    if (!notification) {
      throw { message: 'Notification not found', status: 404 };
    }
    notification.is_read = true;
    return demoSuccess('Notification marked as read (demo)');
  };

  hotelAPI.deleteNotification = async (notificationId) => {
    const user = await getCurrentDemoUserRecord();
    demoNotificationsByUser[user.id] = (demoNotificationsByUser[user.id] || []).filter(
      (item) => item.notification_id !== notificationId
    );
    return demoSuccess('Notification deleted (demo)');
  };

  adminAPI.getDashboard = async () => {
    const usersByRole = {
      tourists: demoUsers.filter((user) => user.role === 'tourist').length,
      guides: demoUsers.filter((user) => user.role === 'guide').length,
      hotels: demoUsers.filter((user) => user.role === 'hotel').length,
    };

    const bookingsByStatus = {
      pending: demoBookings.filter((booking) => booking.status === 'pending').length,
      confirmed: demoBookings.filter((booking) => booking.status === 'confirmed').length,
      cancelled: demoBookings.filter((booking) => booking.status === 'cancelled').length,
    };

    const pendingGuideVerifications = Object.values(demoGuideProfiles).filter(
      (profile) => profile.verifiedStatus === false
    ).length;
    const pendingHotelVerifications = Object.values(demoHotelProfiles).filter(
      (profile) => profile.verifiedStatus === false
    ).length;

    const totalReviews =
      Object.values(demoGuideReviewsByGuide).reduce((sum, reviews) => sum + reviews.length, 0) +
      Object.values(demoHotelReviewsByHotel).reduce((sum, reviews) => sum + reviews.length, 0);

    return demoSuccess('Admin dashboard retrieved (demo)', {
      overview: {
        totalUsers: demoUsers.length,
        usersByRole,
      },
      bookings: {
        total: demoBookings.length,
        ...bookingsByStatus,
      },
      verifications: {
        pendingGuideVerifications,
        pendingHotelVerifications,
        verifiedGuides: Object.values(demoGuideProfiles).filter((profile) => profile.verifiedStatus)
          .length,
        verifiedHotels: Object.values(demoHotelProfiles).filter((profile) => profile.verifiedStatus)
          .length,
      },
      incidents: {
        activeIncidents: demoIncidents.filter((incident) => !incident.resolved).length,
        activeSOSReports: demoSosReports.filter((report) => report.status === 'active').length,
      },
      reviews: {
        total: totalReviews,
      },
      growth: {
        userGrowthWeek: '+12%',
        bookingGrowthWeek: '+8%',
      },
    });
  };

  adminAPI.getUsers = async (params) => {
    const role = params?.role ? String(params.role).toLowerCase() : '';
    const users = demoUsers
      .filter((user) => (role ? user.role === role : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(toSnakeUser);

    return demoSuccess('Users retrieved (demo)', {
      users,
      pagination: {
        page: 1,
        limit: users.length,
        total: users.length,
        pages: 1,
      },
    });
  };

  adminAPI.getGuides = async (params) => {
    const verifiedParam = params?.verified;
    const filterByVerified = typeof verifiedParam === 'boolean';
    const guides = demoUsers
      .filter((user) => user.role === 'guide')
      .map((user) => ({
        guideId: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        verifiedStatus: demoGuideProfiles[user.id]?.verifiedStatus ?? null,
        experienceYears: toNumber(demoGuideProfiles[user.id]?.experienceYears, 0),
        isAvailable: Boolean(demoGuideProfiles[user.id]?.isAvailable),
        bio: demoGuideProfiles[user.id]?.bio,
        licenseNumber: demoGuideProfiles[user.id]?.licenseNumber,
        createdAt: user.createdAt,
      }))
      .filter((guide) =>
        filterByVerified ? guide.verifiedStatus === (verifiedParam ? true : false) : true
      );

    return demoSuccess('Guides retrieved (demo)', {
      guides,
      pagination: {
        page: 1,
        limit: guides.length,
        total: guides.length,
        pages: 1,
      },
    });
  };

  adminAPI.getHotels = async (params) => {
    const verifiedParam = params?.verified;
    const filterByVerified = typeof verifiedParam === 'boolean';
    const hotels = demoUsers
      .filter((user) => user.role === 'hotel')
      .map((user) => ({
        hotelId: user.id,
        name: demoHotelProfiles[user.id]?.hotelName || user.fullName,
        ownerName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: demoHotelProfiles[user.id]?.location,
        description: demoHotelProfiles[user.id]?.description,
        verifiedStatus: demoHotelProfiles[user.id]?.verifiedStatus ?? null,
        basePrice: toNumber(demoHotelProfiles[user.id]?.basePrice, 0),
        createdAt: user.createdAt,
      }))
      .filter((hotel) =>
        filterByVerified ? hotel.verifiedStatus === (verifiedParam ? true : false) : true
      );

    return demoSuccess('Hotels retrieved (demo)', {
      hotels,
      pagination: {
        page: 1,
        limit: hotels.length,
        total: hotels.length,
        pages: 1,
      },
    });
  };

  adminAPI.getBookings = async (params) => {
    const statusFilter = params?.status ? String(params.status).toLowerCase() : '';
    const bookings = demoBookings
      .filter((booking) => (statusFilter ? booking.status === statusFilter : true))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map((booking) => {
        const tourist = getDemoUserById(booking.touristId);
        const guide = booking.guideId ? getDemoUserById(booking.guideId) : null;
        const hotel = booking.hotelId ? getDemoUserById(booking.hotelId) : null;

        return {
          bookingId: booking.id,
          status: booking.status,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          tourist: tourist
            ? {
                id: tourist.id,
                name: tourist.fullName,
                email: tourist.email,
              }
            : null,
          guide: guide
            ? {
                id: guide.id,
                name: guide.fullName,
                email: guide.email,
              }
            : null,
          hotel: hotel
            ? {
                id: hotel.id,
                name: demoHotelProfiles[hotel.id]?.hotelName || hotel.fullName,
                email: hotel.email,
              }
            : null,
        };
      });

    return demoSuccess('Bookings retrieved (demo)', {
      bookings,
      pagination: {
        page: 1,
        limit: bookings.length,
        total: bookings.length,
        pages: 1,
      },
    });
  };

  adminAPI.getPendingGuides = async () => {
    const guides = demoUsers
      .filter((user) => user.role === 'guide' && demoGuideProfiles[user.id]?.verifiedStatus === false)
      .map((user) => ({
        guideId: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        bio: demoGuideProfiles[user.id]?.bio,
        experienceYears: demoGuideProfiles[user.id]?.experienceYears,
        licenseNumber: demoGuideProfiles[user.id]?.licenseNumber,
        createdAt: user.createdAt,
      }));

    return demoSuccess('Pending guides retrieved (demo)', {
      count: guides.length,
      guides,
    });
  };

  adminAPI.verifyGuide = async (guideId) => {
    if (!demoGuideProfiles[guideId]) {
      throw { message: 'Guide not found', status: 404 };
    }
    demoGuideProfiles[guideId].verifiedStatus = true;
    const targetName = getDemoUserById(guideId)?.fullName || 'Guide';
    addDemoActivity('guide_verified', `Guide ${targetName} verified.`, targetName);
    addDemoNotification(guideId, 'Guide verified', 'Your guide profile has been verified by admin.', 'verification', false);

    return demoSuccess('Guide verified successfully (demo)', {
      guideId,
      verifiedStatus: true,
    });
  };

  adminAPI.rejectGuide = async (guideId, reason) => {
    if (!demoGuideProfiles[guideId]) {
      throw { message: 'Guide not found', status: 404 };
    }
    demoGuideProfiles[guideId].verifiedStatus = null;
    const targetName = getDemoUserById(guideId)?.fullName || 'Guide';
    addDemoActivity('guide_rejected', `Guide ${targetName} rejected.`, targetName);
    addDemoNotification(
      guideId,
      'Guide verification update',
      reason ? `Verification rejected: ${reason}` : 'Verification rejected by admin.',
      'verification',
      false
    );

    return demoSuccess('Guide rejected (demo)', {
      guideId,
      verifiedStatus: null,
      reason: reason || 'No reason provided',
    });
  };

  adminAPI.getPendingHotels = async () => {
    const hotels = demoUsers
      .filter((user) => user.role === 'hotel' && demoHotelProfiles[user.id]?.verifiedStatus === false)
      .map((user) => ({
        hotelId: user.id,
        name: demoHotelProfiles[user.id]?.hotelName || user.fullName,
        ownerName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: demoHotelProfiles[user.id]?.location,
        description: demoHotelProfiles[user.id]?.description,
        createdAt: user.createdAt,
      }));

    return demoSuccess('Pending hotels retrieved (demo)', {
      count: hotels.length,
      hotels,
    });
  };

  adminAPI.verifyHotel = async (hotelId) => {
    if (!demoHotelProfiles[hotelId]) {
      throw { message: 'Hotel not found', status: 404 };
    }
    demoHotelProfiles[hotelId].verifiedStatus = true;
    const targetName = demoHotelProfiles[hotelId]?.hotelName || getDemoUserById(hotelId)?.fullName || 'Hotel';
    addDemoActivity('hotel_verified', `Hotel ${targetName} verified.`, targetName);
    addDemoNotification(hotelId, 'Hotel verified', 'Your hotel profile has been verified by admin.', 'verification', false);

    return demoSuccess('Hotel verified successfully (demo)', {
      hotelId,
      verifiedStatus: true,
    });
  };

  adminAPI.rejectHotel = async (hotelId, reason) => {
    if (!demoHotelProfiles[hotelId]) {
      throw { message: 'Hotel not found', status: 404 };
    }
    demoHotelProfiles[hotelId].verifiedStatus = null;
    const targetName = demoHotelProfiles[hotelId]?.hotelName || getDemoUserById(hotelId)?.fullName || 'Hotel';
    addDemoActivity('hotel_rejected', `Hotel ${targetName} rejected.`, targetName);
    addDemoNotification(
      hotelId,
      'Hotel verification update',
      reason ? `Verification rejected: ${reason}` : 'Verification rejected by admin.',
      'verification',
      false
    );

    return demoSuccess('Hotel rejected (demo)', {
      hotelId,
      verifiedStatus: null,
      reason: reason || 'No reason provided',
    });
  };

  adminAPI.getIncidents = async () => {
    const incidents = demoIncidents
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((incident) => ({
        id: incident.id,
        type: incident.incidentType,
        touristName: getDemoUserById(incident.touristId)?.fullName || 'Tourist',
        details: incident.details,
        location: incident.location,
        createdAt: incident.createdAt,
      }));

    const sosReports = demoSosReports
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((report) => ({
        id: report.id,
        touristName: getDemoUserById(report.touristId)?.fullName || 'Tourist',
        location: report.location,
        status: report.status,
        description: report.description,
        timestamp: report.timestamp,
      }));

    return demoSuccess('Incidents retrieved (demo)', {
      incidents: {
        count: incidents.length,
        data: incidents,
      },
      sosReports: {
        count: sosReports.length,
        data: sosReports,
      },
    });
  };

  adminAPI.resolveIncident = async (incidentId, resolution) => {
    const incident = demoIncidents.find((item) => item.id === incidentId);
    if (!incident) {
      throw { message: 'Incident not found', status: 404 };
    }

    incident.resolved = true;
    incident.resolution = resolution || 'Resolved';

    const targetName = getDemoUserById(incident.touristId)?.fullName || 'Tourist';
    addDemoActivity(
      'incident_resolved',
      `Incident ${incidentId} resolved. ${resolution || 'Resolved by admin.'}`,
      targetName
    );

    return demoSuccess('Incident marked as resolved (demo)', {
      incidentId,
      resolution: incident.resolution,
    });
  };

  adminAPI.getActivityLogs = async () => {
    return demoSuccess('Activity logs retrieved (demo)', {
      count: demoActivityLogs.length,
      logs: demoActivityLogs.slice(0, 50),
    });
  };

  adminAPI.deleteUser = async (userId, reason) => {
    const target = getDemoUserById(userId);
    if (!target) {
      throw { message: 'User not found', status: 404 };
    }

    demoUsers = demoUsers.filter((user) => user.id !== userId);
    delete demoGuideProfiles[userId];
    delete demoHotelProfiles[userId];
    delete demoTouristSettings[userId];
    delete demoNotificationsByUser[userId];

    demoBookings = demoBookings.filter(
      (booking) => booking.touristId !== userId && booking.guideId !== userId && booking.hotelId !== userId
    );
    demoMessages = demoMessages.filter(
      (message) => message.senderId !== userId && message.receiverId !== userId
    );
    demoIncidents = demoIncidents.filter((incident) => incident.touristId !== userId);
    demoSosReports = demoSosReports.filter((report) => report.touristId !== userId);

    addDemoActivity(
      'user_deleted',
      `${target.fullName} removed by admin. ${reason || 'No reason provided.'}`,
      target.fullName
    );

    return demoSuccess('User deleted successfully (demo)', {
      userId,
    });
  };
}

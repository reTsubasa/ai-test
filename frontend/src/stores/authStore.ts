import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  checkAuthStatus: () => boolean;
}

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Set both user and tokens
      setAuth: (user, tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: true,
        });
      },

      // Update user only
      setUser: (user) => {
        set({ user });
      },

      // Update tokens only
      setTokens: (tokens) => {
        set({ tokens });
      },

      // Logout and clear all auth data
      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      },

      // Initialize auth store on app load
      initialize: async () => {
        set({ isLoading: true });

        try {
          const { tokens } = get();

          if (tokens) {
            const isExpired = tokens.expiresAt < Date.now();
            const needsRefresh = tokens.expiresAt - Date.now() < TOKEN_REFRESH_THRESHOLD;

            if (isExpired) {
              // Token expired, try to refresh
              const success = await get().refreshAccessToken();
              if (!success) {
                get().logout();
              }
            } else if (needsRefresh) {
              // Token will expire soon, refresh proactively
              await get().refreshAccessToken();
            }
          }

          set({ isInitialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh access token using refresh token
      refreshAccessToken: async (): Promise<boolean> => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          return false;
        }

        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });

          const { accessToken, refreshToken, expiresIn } = response.data;

          const newTokens: AuthTokens = {
            accessToken,
            refreshToken: refreshToken || tokens.refreshToken,
            expiresAt: Date.now() + expiresIn * 1000,
          };

          set({ tokens: newTokens, isAuthenticated: true });

          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          get().logout();
          return false;
        }
      },

      // Check if current user is authenticated
      checkAuthStatus: (): boolean => {
        const { tokens } = get();

        if (!tokens) {
          return false;
        }

        const isExpired = tokens.expiresAt < Date.now();
        return !isExpired;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Set up axios interceptor for automatic token refresh
axios.interceptors.request.use(
  (config) => {
    const tokens = useAuthStore.getState().tokens;

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/auth/login' &&
      originalRequest.url !== '/api/auth/refresh'
    ) {
      originalRequest._retry = true;

      const success = await useAuthStore.getState().refreshAccessToken();

      if (success) {
        const tokens = useAuthStore.getState().tokens;
        if (tokens?.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return axios(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  },
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>('/auth/login', credentials);

          // Handle both response structures: { token, user } or { success, data: { tokens, user } }
          const responseData = response.data as any;
          const token = responseData.token || responseData.data?.tokens?.accessToken || responseData.data?.token;
          const user = responseData.user || responseData.data?.user;

          if (!token || !user) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Also set cookie for middleware
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.response?.data?.error || error.message || 'เข้าสู่ระบบไม่สำเร็จ';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>('/auth/register', {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            password: data.password,
          });

          // Handle both response structures: { token, user } or { success, data: { tokens, user } }
          const responseData = response.data as any;
          const token = responseData.token || responseData.data?.tokens?.accessToken || responseData.data?.token;
          const user = responseData.user || responseData.data?.user;

          if (!token || !user) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Also set cookie for middleware
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.response?.data?.error || error.message || 'สมัครสมาชิกไม่สำเร็จ';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clear cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            get().logout();
          }
        } else {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

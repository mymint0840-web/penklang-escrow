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
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
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
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LoginCredentials, RegisterData } from '@/types/auth';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    clearError,
    checkAuth,
  } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials) => {
    try {
      await loginAction(credentials);

      // Get user from store after login
      const currentUser = useAuthStore.getState().user;

      // Check for redirect parameter first (using window.location for SSR compatibility)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }
      }

      // Redirect based on role
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // Error is already set in the store
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await registerAction(data);
      router.push('/dashboard');
    } catch (error) {
      // Error is already set in the store
      throw error;
    }
  };

  const logout = () => {
    logoutAction();
    router.push('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};

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
      router.push('/dashboard');
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

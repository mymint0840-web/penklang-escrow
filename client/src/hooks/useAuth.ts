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

      // Debug log
      console.log('Login successful, user:', currentUser);
      console.log('User role:', currentUser?.role);

      // Check for redirect parameter first (using window.location for SSR compatibility)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        console.log('Redirect URL from params:', redirectUrl);
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      }

      // Redirect based on role (use window.location for full reload to ensure cookie is sent)
      const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
      console.log('Is admin:', isAdmin);

      if (isAdmin) {
        console.log('Redirecting to /admin');
        window.location.href = '/admin';
      } else {
        console.log('Redirecting to /dashboard');
        window.location.href = '/dashboard';
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

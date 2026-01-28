import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const showToast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    const message = description || title || '';

    switch (variant) {
      case 'destructive':
        toast.error(message);
        break;
      case 'success':
        toast.success(message);
        break;
      default:
        toast(message);
    }
  }, []);

  return {
    toast: showToast,
  };
}

export { toast };

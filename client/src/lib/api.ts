import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้');
          break;
        case 404:
          // Not found
          console.error('ไม่พบข้อมูลที่ต้องการ');
          break;
        case 500:
          // Internal server error
          console.error('เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
          break;
        default:
          console.error('เกิดข้อผิดพลาด:', error.response.data.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } else {
      // Something else happened
      console.error('เกิดข้อผิดพลาด:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

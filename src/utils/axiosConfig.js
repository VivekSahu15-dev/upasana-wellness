import axios from 'axios';

// Get base URL from environment
const baseURL = import.meta.env.VITE_API_URL || 'https://upasanaapi.tstrainingnsolutions.com';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'APIKey': API_KEY
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('upasanaToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always add API key
    config.headers['APIKey'] = API_KEY;
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      const errorData = error.response?.data;
      if (typeof errorData === 'string' && (
        errorData.includes('Api Key was not provided') || 
        errorData.includes('Invalid API Key') ||
        errorData.includes('API Key')
      )) {
        // API Key error - don't redirect
      } else {
        // Token expired or invalid
        localStorage.removeItem('upasanaToken');
        localStorage.removeItem('upasanaUser');
        localStorage.removeItem('upasanaUserID');
        
        if (!window.location.pathname.includes('/admin')) {
          window.location.href = '/admin';
        } else if (window.location.pathname !== '/admin') {
          window.location.href = '/admin';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
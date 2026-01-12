import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { } from 'react-native';

// 192.168.1.14 is your computer's current LAN IP
const DEV_API_URL = 'http://192.168.1.14:4000';

export const api = axios.create({
  baseURL: DEV_API_URL,
  timeout: 10000, // 10 seconds timeout to prevent "freezing" UI
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token', error);
  }
  return config;
});

// Interceptor to handle 401 (Logout) - Simplified for demo
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
       // Clear token if unauthorized (except for login/register endpoints)
       if (!error.config.url.includes('login')) {
           await SecureStore.deleteItemAsync('access_token');
           // In a real app, you'd trigger a global redirection to Login here
       }
    }
    return Promise.reject(error);
  }
);

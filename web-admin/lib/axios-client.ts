import axios from 'axios';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', // Use env var or default to localhost:4000
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Handle 401 Unauthorized globally
    if (error.response) {
        // console.error("Axios Error Response:", error.response.data); // Log full error details
        if (error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                document.cookie = "token=; path=/; max-age=0";
                window.location.href = '/login';
            }
        }
    }
    return Promise.reject(error);
});

// Public axios client (no auth headers) for public endpoints like /bill/:code
export const publicAxiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;

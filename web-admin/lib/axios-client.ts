import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:4000', // Backend is now running on port 4000
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
        console.error("Axios Error Response:", error.response.data); // Log full error details
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

export default axiosClient;

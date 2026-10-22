import axios from 'axios';

// Uses VITE_API_URL in production (e.g., https://nutrisync-api.onrender.com/api/v1) or falls back to localhost:8000
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach the JWT token to every request if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
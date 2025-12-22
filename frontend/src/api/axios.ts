import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const apiInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Opsional: Handle logout jika 401
    if (error.response?.status === 401) {
       // logic logout / clear storage
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
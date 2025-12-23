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
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config.url;
      if (requestUrl && requestUrl.includes("login")) {
         return Promise.reject(error);
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      window.location.href = "/signin";
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
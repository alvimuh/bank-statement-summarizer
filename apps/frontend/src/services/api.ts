import axios from "axios";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3003/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    if (error.response?.status >= 500) {
      throw new Error("Server error. Please try again later.");
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

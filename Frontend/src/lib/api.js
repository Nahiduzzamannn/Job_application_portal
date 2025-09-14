// src/lib/api.js
import axios from "axios";

const API_URL = "https://madhumatigi.com/api";
//const API_URL = "http://localhost:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API methods

// Authentication
export const auth = {
  login: async (username, password) => {
    const response = await api.post("/login/", { username, password });
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await api.post("/register/", {
      username,
      email,
      password,
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post("/token/refresh/", {
      refresh: refreshToken,
    });
    return response.data;
  },
};

// Posts/Categories
export const posts = {
  getAll: async () => {
    const response = await api.get("/posts/");
    return response.data;
  },

  getSubcategories: async (postId) => {
    const response = await api.get(`/posts/${postId}/subcategories/`);
    return response.data;
  },
};

// Applications
export const applications = {
  create: async (formData) => {
    const response = await api.post("/apply/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getUserApplications: async () => {
    const response = await api.get("/my-applications/");
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/update-application/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id, data) => {
    const response = await api.patch(`/update-application/${id}/`, data);
    return response.data;
  },
};

// Admit Cards
export const admitCards = {
  get: async (subcategoryId) => {
    const response = await api.get(`/admit-card/${subcategoryId}/`);
    return response.data;
  },
};

// Seat Plans
export const seatPlans = {
  getByRoll: async (rollNumber) => {
    const response = await api.get(`/seatplans/?roll=${rollNumber}`);
    return response.data;
  },
};

// Generic API methods
export const apiClient = {
  get: async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async (url, data, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  patch: async (url, data, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
  },
};

// Helper functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Default export for the configured axios instance
export default api;

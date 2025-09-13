// src/lib/api.js
import axios from "axios";

// Determine API base URL (fix: previous hardcoded production URL broke local login requests)
const resolveApiBase = () => {
  const envUrl = import.meta?.env?.VITE_API_BASE_URL;
  const globalUrl =
    typeof window !== "undefined" ? window.__API_BASE__ : undefined;
  let base = envUrl || globalUrl;
  if (!base) {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      base = "http://localhost:8000/api";
    } else {
      base = "https://madhumatigi.com/api";
    }
  }
  return base.replace(/\/$/, ""); // strip single trailing slash
};

const API_URL = resolveApiBase();

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
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication
export const auth = {
  login: async (username, password) => {
    // Ensure leading slash kept (axios will join correctly without duplicating)
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
  getAll: async () => (await api.get("/posts/")).data,
  getSubcategories: async (postId) =>
    (await api.get(`/posts/${postId}/subcategories/`)).data,
};

// Applications
export const applications = {
  create: async (formData) =>
    (
      await api.post("/apply/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data,
  getUserApplications: async () => (await api.get("/my-applications/")).data,
  update: async (id, data) =>
    (await api.put(`/update-application/${id}/`, data)).data,
  partialUpdate: async (id, data) =>
    (await api.patch(`/update-application/${id}/`, data)).data,
};

// Admit Cards
export const admitCards = {
  get: async (subcategoryId) =>
    (await api.get(`/admit-card/${subcategoryId}/`)).data,
};

// Seat Plans
export const seatPlans = {
  getByRoll: async (rollNumber) =>
    (await api.get(`/seatplans/?roll=${rollNumber}`)).data,
};

// Generic API methods
export const apiClient = {
  get: async (url, config = {}) => (await api.get(url, config)).data,
  post: async (url, data, config = {}) =>
    (await api.post(url, data, config)).data,
  put: async (url, data, config = {}) =>
    (await api.put(url, data, config)).data,
  patch: async (url, data, config = {}) =>
    (await api.patch(url, data, config)).data,
  delete: async (url, config = {}) => (await api.delete(url, config)).data,
};

export const setAuthToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};
export const getAuthToken = () => localStorage.getItem("token");
export const isAuthenticated = () => !!getAuthToken();

export default api;

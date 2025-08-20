// src/lib/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Adjust if using different backend URL

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login/`, { username, password });
  return response.data;
};

export const register = async (username, password, email) => {
  const response = await axios.post(`${API_URL}/register/`, { username, password, email });
  return response.data;
};

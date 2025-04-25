import axios from 'axios';

const API_BASE_URL = 'http://192.168.8.141:5000'; // Update if needed

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;

import axios from "axios";

// Базовый URL API (можно менять через env)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 минут - генерация и рендеринг занимают время
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor для логирования
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

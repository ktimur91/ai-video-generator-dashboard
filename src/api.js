import axios from "axios";

// Базовый URL API (можно менять через env)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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

// YouTube API functions
export const youtubeApi = {
  // Проверить статус авторизации
  getStatus: () => api.get("/youtube/status"),

  // Получить URL для авторизации
  getAuthUrl: () => api.get("/youtube/auth"),

  // Выход из аккаунта
  logout: () => api.post("/youtube/logout"),

  // Опубликовать видео
  publish: (videoId, options = {}) =>
    api.post(`/videos/${videoId}/publish`, options),
};

export default api;

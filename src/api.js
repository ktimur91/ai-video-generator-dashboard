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
  },
);

// YouTube API functions
export const youtubeApi = {
  // === Credentials ===
  // Получить все OAuth credentials
  getCredentials: () => api.get("/youtube/credentials"),

  // Создать новые credentials
  createCredentials: (data) => api.post("/youtube/credentials", data),

  // Обновить credentials
  updateCredentials: (id, data) => api.put(`/youtube/credentials/${id}`, data),

  // Удалить credentials
  deleteCredentials: (id) => api.delete(`/youtube/credentials/${id}`),

  // === Channels ===
  // Получить все подключенные каналы
  getChannels: () => api.get("/youtube/channels"),

  // Получить URL для авторизации нового канала
  getAuthUrl: (credentialsId) => api.get(`/youtube/auth/${credentialsId}`),

  // Удалить канал
  deleteChannel: (channelId) => api.delete(`/youtube/channels/${channelId}`),

  // Установить канал по умолчанию
  setDefaultChannel: (channelId) =>
    api.put(`/youtube/channels/${channelId}/default`),

  // Опубликовать видео на канал
  publish: (videoId, channelId, options = {}) =>
    api.post("/youtube/publish", { videoId, channelId, ...options }),
};

// Video generation control
export const generationApi = {
  // Остановить генерацию
  stop: (videoId) => api.post(`/stop/${videoId}`),
};

// Topic suggestions API
export const topicsApi = {
  // Получить рекомендации тем (category опционально)
  getSuggestions: (category = null) =>
    api.post("/topic-suggestions", { category }),
};

// Music API (Jamendo)
export const musicApi = {
  // Поиск музыки
  search: (params = {}) => api.get("/music/search", { params }),

  // Получить трек по ID
  getTrack: (id) => api.get(`/music/track/${id}`),

  // Поиск музыки для темы
  searchForTopic: (params) => api.post("/music/search-for-topic", params),

  // Популярные треки по жанру
  getPopular: (genre, limit = 10) =>
    api.get(`/music/popular/${genre}`, { params: { limit } }),

  // Рекомендуемая музыка для типа темы
  getRecommended: (theme) => api.get(`/music/recommended/${theme}`),

  // Список жанров
  getGenres: () => api.get("/music/genres"),

  // Список настроений
  getMoods: () => api.get("/music/moods"),
};

export default api;

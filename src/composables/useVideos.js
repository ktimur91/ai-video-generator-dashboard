import { ref, onMounted, onUnmounted } from "vue";
import api from "../api";

export function useVideos() {
  const videos = ref([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const error = ref(null);
  const apiStatus = ref("checking"); // 'online' | 'offline' | 'checking'

  let pollingInterval = null;

  // Получить все видео
  async function fetchVideos() {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.get("/videos");
      videos.value = response.data.videos || [];
      apiStatus.value = "online";
    } catch (err) {
      error.value = err.message;
      apiStatus.value = "offline";
      console.error("Failed to fetch videos:", err);
    } finally {
      isLoading.value = false;
    }
  }

  // Создать новое видео (генерация сценария + аудио)
  async function createVideo(topic) {
    if (!topic.trim()) {
      error.value = "Введите тему для видео";
      return null;
    }

    try {
      isCreating.value = true;
      error.value = null;

      const response = await api.post("/generate", { topic });

      // Добавляем новое видео в начало списка
      if (response.data.video) {
        videos.value.unshift(response.data.video);
      }

      return response.data.video;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error("Failed to create video:", err);
      return null;
    } finally {
      isCreating.value = false;
    }
  }

  // Запустить рендеринг
  async function startRender(videoId) {
    try {
      error.value = null;

      // Обновляем статус локально для мгновенного UI отклика
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "RENDERING";
      }

      const response = await api.post(`/render/${videoId}`);

      // Обновляем видео в списке
      if (response.data.video) {
        const index = videos.value.findIndex((v) => v.id === videoId);
        if (index !== -1) {
          videos.value[index] = response.data.video;
        }
      }

      return response.data.video;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;

      // Возвращаем статус обратно при ошибке
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "FAILED";
      }

      console.error("Failed to start render:", err);
      return null;
    }
  }

  // Удалить видео
  async function deleteVideo(videoId) {
    try {
      error.value = null;

      await api.delete(`/videos/${videoId}`);

      // Удаляем из локального списка
      videos.value = videos.value.filter((v) => v.id !== videoId);

      return true;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error("Failed to delete video:", err);
      return false;
    }
  }

  // Повторить генерацию для FAILED видео
  async function retryVideo(videoId) {
    try {
      error.value = null;

      // Обновляем статус локально для мгновенного UI отклика
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "GENERATING_ASSETS";
      }

      const response = await api.post(`/retry/${videoId}`);

      // Обновляем видео в списке
      if (response.data.video) {
        const index = videos.value.findIndex((v) => v.id === videoId);
        if (index !== -1) {
          videos.value[index] = response.data.video;
        }
      }

      return response.data.video;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;

      // Возвращаем статус обратно при ошибке
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "FAILED";
      }

      console.error("Failed to retry video:", err);
      return null;
    }
  }

  // Проверить статус API
  async function checkApiStatus() {
    try {
      await api.get("/health");
      apiStatus.value = "online";
    } catch {
      apiStatus.value = "offline";
    }
  }

  // Запустить polling для обновления статусов
  function startPolling(intervalMs = 5000) {
    stopPolling();

    pollingInterval = setInterval(async () => {
      // Проверяем, есть ли видео в процессе рендеринга
      const hasRenderingVideos = videos.value.some(
        (v) => v.status === "RENDERING" || v.status === "GENERATING_ASSETS"
      );

      if (hasRenderingVideos) {
        await fetchVideos();
      }
    }, intervalMs);
  }

  // Остановить polling
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Lifecycle
  onMounted(() => {
    fetchVideos();
    startPolling();
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    videos,
    isLoading,
    isCreating,
    error,
    apiStatus,
    fetchVideos,
    createVideo,
    startRender,
    deleteVideo,
    retryVideo,
    checkApiStatus,
    startPolling,
    stopPolling,
  };
}

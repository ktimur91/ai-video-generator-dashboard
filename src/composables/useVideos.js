import { ref, onMounted, onUnmounted } from "vue";
import api, { generationApi } from "../api";

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
  async function createVideo(topic, videoSource = "pexels") {
    // Поддержка как строки, так и объекта { topic, videoSource }
    let topicText = topic;
    let source = videoSource;

    if (typeof topic === "object" && topic !== null) {
      topicText = topic.topic;
      source = topic.videoSource || "pexels";
    }

    if (!topicText || !topicText.trim()) {
      error.value = "Введите тему для видео";
      return null;
    }

    try {
      isCreating.value = true;
      error.value = null;

      const response = await api.post("/generate", {
        topic: topicText,
        videoSource: source,
      });

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
  // fromStep: 1 = скрипт, 2 = аудио, 3 = видео, undefined = автоматически
  // videoSource: 'pexels' | 'pixabay' | 'klipy'
  async function retryVideo(videoId, fromStep, videoSource = "pexels") {
    try {
      error.value = null;

      // Обновляем статус локально для мгновенного UI отклика
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "GENERATING_ASSETS";
      }

      const response = await api.post(`/retry/${videoId}`, {
        fromStep,
        videoSource,
      });

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

  // Обновить скрипт/заголовок видео
  async function updateVideo(videoId, data) {
    try {
      error.value = null;

      const response = await api.patch(`/videos/${videoId}`, data);

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
      console.error("Failed to update video:", err);
      return null;
    }
  }

  // Обновить сегменты видео (для ручной замены видео-фонов)
  // Теперь принимает объект с segments, voiceConfigId, backgroundMusicFilename, regenerateAudio
  async function updateSegments(videoId, data) {
    try {
      error.value = null;

      // Поддержка старого формата (просто массив сегментов)
      const payload = Array.isArray(data) ? { segments: data } : data;

      const response = await api.patch(`/videos/${videoId}/segments`, payload);

      // Обновляем видео в списке
      if (response.data.video) {
        const index = videos.value.findIndex((v) => v.id === videoId);
        if (index !== -1) {
          videos.value[index] = response.data.video;
        }
      }

      return true;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error("Failed to update segments:", err);
      return false;
    }
  }

  // Перегенерация видео с новыми настройками голоса/музыки
  async function regenerateVideo(videoId, data) {
    try {
      error.value = null;

      const response = await api.post(`/videos/${videoId}/regenerate`, data);

      // Обновляем список видео
      await fetchVideos();

      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error("Failed to regenerate video:", err);
      return null;
    }
  }

  // Остановить генерацию видео
  async function stopGeneration(videoId) {
    try {
      error.value = null;

      const response = await generationApi.stop(videoId);

      // Обновляем видео в списке
      await fetchVideos();

      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error("Failed to stop generation:", err);
      return null;
    }
  }

  // Одобрить видео и продолжить генерацию аудио
  async function approveVideo(
    videoId,
    segments,
    backgroundMusicFilename,
    voiceConfigId
  ) {
    try {
      error.value = null;

      // Обновляем статус локально для мгновенного UI отклика
      const video = videos.value.find((v) => v.id === videoId);
      if (video) {
        video.status = "GENERATING_ASSETS";
        video.progress = {
          ...video.progress,
          awaitingReview: "success",
          generateAudio: "pending",
        };
      }

      const response = await api.post(`/approve/${videoId}`, {
        segments,
        backgroundMusicFilename,
        voiceConfigId,
      });

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
        video.status = "AWAITING_REVIEW";
      }

      console.error("Failed to approve video:", err);
      return null;
    }
  }

  // Получить список доступной фоновой музыки
  async function fetchBackgroundMusic() {
    try {
      const response = await api.get("/background-music");
      return response.data.music || [];
    } catch (err) {
      console.error("Failed to fetch background music:", err);
      return [];
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
    updateVideo,
    updateSegments,
    regenerateVideo,
    stopGeneration,
    approveVideo,
    fetchBackgroundMusic,
    checkApiStatus,
    startPolling,
    stopPolling,
  };
}

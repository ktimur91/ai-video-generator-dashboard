<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import api from "../api";
import {
  useModalStack,
  initModalEscapeHandler,
} from "../composables/useModalStack";

const props = defineProps({
  video: {
    type: Object,
    default: null,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "activated"]);

// Регистрация в стеке модалок для закрытия по Esc
initModalEscapeHandler();
const { register, unregister } = useModalStack(() => close());
const { register: registerPlayer, unregister: unregisterPlayer } =
  useModalStack(() => closePlayer());

const versions = ref([]);
const loading = ref(false);
const activating = ref(null);
const error = ref(null);
const playingVersion = ref(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function loadVersions() {
  if (!props.video?.id) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(`/videos/${props.video.id}/versions`);
    versions.value = response.data;
  } catch (err) {
    console.error("Failed to load versions:", err);
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
}

async function activateVersion(version) {
  activating.value = version.version;

  try {
    await api.post(
      `/videos/${props.video.id}/versions/${version.version}/activate`,
    );
    await loadVersions();
    emit("activated");
  } catch (err) {
    console.error("Failed to activate version:", err);
    alert(
      "Ошибка активации версии: " +
        (err.response?.data?.message || err.message),
    );
  } finally {
    activating.value = null;
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVideoUrl(path) {
  if (!path) return "";
  // Убираем начальный storage/ если есть (путь может быть storage/videos/... или /path/to/storage/videos/...)
  const cleanPath = path.replace(/^(.*\/)?storage\//, "");
  return `${API_BASE}/storage/${cleanPath}`;
}

function close() {
  if (playingVersion.value) {
    unregisterPlayer();
  }
  playingVersion.value = null;
  emit("close");
}

function playVersion(version) {
  playingVersion.value = version;
  registerPlayer();
}

function closePlayer() {
  unregisterPlayer();
  playingVersion.value = null;
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      register();
      loadVersions();
    } else {
      unregister();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.isOpen) {
    loadVersions();
  }
});

onUnmounted(() => {
  unregister();
  unregisterPlayer();
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    @click.self="close"
  >
    <div
      class="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-800"
      >
        <div>
          <h2 class="text-xl font-semibold text-white">Версии видео</h2>
          <p class="text-gray-400 text-sm mt-1">{{ video?.title }}</p>
        </div>
        <button
          @click="close"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div
            class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"
          ></div>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <div
          v-else-if="versions.length === 0"
          class="text-gray-400 text-center py-8"
        >
          Нет версий для этого видео
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="version in versions"
            :key="version.id"
            class="bg-gray-800 rounded-xl p-4 flex gap-4"
            :class="{ 'ring-2 ring-purple-500': version.isActive }"
          >
            <!-- Video Preview -->
            <div
              class="flex-shrink-0 w-48 relative group cursor-pointer"
              @click="playVersion(version)"
            >
              <video
                :src="getVideoUrl(version.videoPath)"
                class="w-full h-28 object-cover rounded-lg bg-black"
                preload="metadata"
              ></video>
              <!-- Play overlay -->
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <div
                  class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg
                    class="w-6 h-6 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-white font-semibold"
                  >Версия {{ version.version }}</span
                >
                <span
                  v-if="version.isActive"
                  class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full"
                >
                  Активная
                </span>
              </div>

              <div class="text-sm text-gray-400 space-y-1">
                <p>Создана: {{ formatDate(version.createdAt) }}</p>
                <p v-if="version.voiceConfig">
                  Голос: {{ version.voiceConfig.name }}
                </p>
                <p v-if="version.backgroundMusicFilename">
                  Музыка: {{ version.backgroundMusicFilename }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0 flex flex-col items-end gap-2">
              <button
                @click="playVersion(version)"
                class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Воспроизвести</span>
              </button>
              <button
                v-if="!version.isActive"
                @click="activateVersion(version)"
                :disabled="activating !== null"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
              >
                <span v-if="activating === version.version">Активация...</span>
                <span v-else>Сделать активной</span>
              </button>
              <span v-else class="text-green-400 text-sm"> ✓ Публикуется </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-800">
        <p class="text-gray-400 text-sm text-center">
          Активная версия будет использоваться для публикации на YouTube
        </p>
      </div>
    </div>

    <!-- Fullscreen Video Player -->
    <div
      v-if="playingVersion"
      class="fixed inset-0 bg-black/95 flex items-center justify-center z-60"
      @click.self="closePlayer"
    >
      <div class="relative w-full max-w-md mx-4">
        <!-- Close button -->
        <button
          @click="closePlayer"
          class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Version info -->
        <div class="absolute -top-12 left-0 text-white">
          <span class="text-lg font-semibold"
            >Версия {{ playingVersion.version }}</span
          >
          <span
            v-if="playingVersion.isActive"
            class="ml-2 px-2 py-0.5 bg-purple-600 text-xs rounded-full"
            >Активная</span
          >
        </div>

        <!-- Video player -->
        <video
          :src="getVideoUrl(playingVersion.videoPath)"
          class="w-full rounded-xl shadow-2xl"
          controls
          autoplay
        ></video>

        <!-- Version details -->
        <div class="mt-4 text-gray-400 text-sm space-y-1">
          <p>Создана: {{ formatDate(playingVersion.createdAt) }}</p>
          <p v-if="playingVersion.voiceConfig">
            Голос: {{ playingVersion.voiceConfig.name }}
          </p>
          <p v-if="playingVersion.backgroundMusicFilename">
            Музыка: {{ playingVersion.backgroundMusicFilename }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

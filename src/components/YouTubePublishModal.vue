<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    @click.self="close"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />

    <!-- Modal -->
    <div
      class="relative w-full max-w-md glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b border-gray-800"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-500/20 rounded-xl">
            <Youtube class="w-6 h-6 text-red-500" />
          </div>
          <h2 class="text-xl font-bold text-white">Публикация на YouTube</h2>
        </div>
        <button
          @click="close"
          class="p-2 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 max-h-[70vh] overflow-y-auto">
        <!-- Not connected state -->
        <div v-if="!youtubeConnected" class="text-center py-8">
          <div class="p-4 bg-red-500/10 rounded-2xl inline-block mb-4">
            <Youtube class="w-16 h-16 text-red-500" />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">
            Подключите YouTube аккаунт
          </h3>
          <p class="text-gray-400 mb-6">
            Для публикации видео необходимо авторизоваться через Google
          </p>
          <button
            @click="connectYoutube"
            :disabled="connecting"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-colors w-full disabled:opacity-50"
          >
            <Loader2 v-if="connecting" class="w-5 h-5 animate-spin" />
            <LogIn v-else class="w-5 h-5" />
            <span>{{
              connecting ? "Подключение..." : "Подключить YouTube"
            }}</span>
          </button>
        </div>

        <!-- Connected state -->
        <div v-else>
          <!-- Channel info -->
          <div
            v-if="channelInfo"
            class="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl mb-5"
          >
            <img
              v-if="channelInfo.thumbnail"
              :src="channelInfo.thumbnail"
              class="w-12 h-12 rounded-full"
            />
            <div class="flex-1">
              <p class="font-medium text-white">{{ channelInfo.title }}</p>
              <p class="text-sm text-gray-400">
                {{ formatSubscribers(channelInfo.subscriberCount) }} подписчиков
              </p>
            </div>
            <button
              @click="disconnectYoutube"
              class="p-2 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
              title="Отключить аккаунт"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>

          <!-- Video preview -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Видео
            </label>
            <div class="p-4 bg-gray-800/50 rounded-xl">
              <p class="text-white font-medium truncate">{{ video?.title }}</p>
            </div>
          </div>

          <!-- Title -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Заголовок
            </label>
            <input
              v-model="publishTitle"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              placeholder="Заголовок видео"
              maxlength="100"
            />
            <p class="text-xs text-gray-500 mt-1">
              {{ publishTitle.length }}/100
            </p>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Описание
            </label>
            <textarea
              v-model="publishDescription"
              rows="3"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              placeholder="Описание видео..."
            />
          </div>

          <!-- Tags -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Теги
              <span class="text-gray-500"
                >(автоматически сгенерированы AI)</span
              >
            </label>
            <div
              class="flex flex-wrap gap-2 p-3 bg-gray-800 border border-gray-700 rounded-xl min-h-[60px]"
            >
              <span
                v-for="(tag, index) in publishTags"
                :key="index"
                class="flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm"
              >
                {{ tag }}
                <button
                  @click="removeTag(index)"
                  class="hover:text-red-400 transition-colors"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
              <input
                v-model="newTag"
                @keydown.enter.prevent="addTag"
                class="flex-1 min-w-[100px] bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                placeholder="Добавить тег..."
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ publishTags.length }} тегов
            </p>
          </div>

          <!-- Category -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Категория
            </label>
            <select
              v-model="categoryId"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Privacy -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Приватность
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in privacyOptions"
                :key="option.value"
                @click="privacyStatus = option.value"
                :class="[
                  'flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors',
                  privacyStatus === option.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600',
                ]"
              >
                <component :is="option.icon" class="w-5 h-5" />
                <span class="text-xs font-medium">{{ option.label }}</span>
              </button>
            </div>
          </div>

          <!-- Publish button -->
          <button
            @click="publish"
            :disabled="publishing || !publishTitle.trim()"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="publishing" class="w-5 h-5 animate-spin" />
            <Upload v-else class="w-5 h-5" />
            <span>{{ publishing ? "Публикация..." : "Опубликовать" }}</span>
          </button>

          <!-- Success message -->
          <div
            v-if="publishResult"
            class="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <div class="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle class="w-5 h-5" />
              <span class="font-medium">Видео опубликовано!</span>
            </div>
            <a
              :href="publishResult.shortsUrl || publishResult.url"
              target="_blank"
              class="text-primary-400 hover:underline text-sm"
            >
              {{ publishResult.shortsUrl || publishResult.url }}
            </a>
          </div>

          <!-- Error message -->
          <div
            v-if="error"
            class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <div class="flex items-center gap-2 text-red-400">
              <AlertCircle class="w-5 h-5" />
              <span class="text-sm">{{ error }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import {
  Youtube,
  X,
  Upload,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  EyeOff,
} from "lucide-vue-next";
import { youtubeApi } from "../api";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  video: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "published"]);

const youtubeConnected = ref(false);
const channelInfo = ref(null);
const connecting = ref(false);
const publishing = ref(false);
const publishResult = ref(null);
const error = ref(null);

const publishTitle = ref("");
const publishDescription = ref("");
const publishTags = ref([]);
const newTag = ref("");
const categoryId = ref("24"); // Default: Entertainment
const privacyStatus = ref("private");

const categories = [
  { id: "24", name: "🎬 Развлечения" },
  { id: "27", name: "📚 Образование" },
  { id: "28", name: "🔬 Наука и технологии" },
  { id: "26", name: "💡 Лайфхаки и стиль" },
  { id: "22", name: "👤 Люди и блоги" },
  { id: "23", name: "😂 Юмор" },
  { id: "25", name: "📰 Новости" },
  { id: "17", name: "⚽ Спорт" },
  { id: "20", name: "🎮 Игры" },
  { id: "10", name: "🎵 Музыка" },
];

const privacyOptions = [
  { value: "public", label: "Публичное", icon: Globe },
  { value: "unlisted", label: "По ссылке", icon: EyeOff },
  { value: "private", label: "Приватное", icon: Lock },
];

// Tag management
function addTag() {
  const tag = newTag.value.trim();
  if (tag && !publishTags.value.includes(tag)) {
    publishTags.value.push(tag);
    newTag.value = "";
  }
}

function removeTag(index) {
  publishTags.value.splice(index, 1);
}

// Check YouTube connection status
async function checkYoutubeStatus() {
  try {
    const response = await youtubeApi.getStatus();
    youtubeConnected.value = response.data.authenticated;
    channelInfo.value = response.data.channel;
  } catch (err) {
    console.error("Failed to check YouTube status:", err);
    youtubeConnected.value = false;
  }
}

// Connect to YouTube
async function connectYoutube() {
  try {
    connecting.value = true;
    const response = await youtubeApi.getAuthUrl();
    window.location.href = response.data.authUrl;
  } catch (err) {
    console.error("Failed to get auth URL:", err);
    error.value = "Не удалось получить ссылку авторизации";
    connecting.value = false;
  }
}

// Disconnect YouTube
async function disconnectYoutube() {
  try {
    await youtubeApi.logout();
    youtubeConnected.value = false;
    channelInfo.value = null;
  } catch (err) {
    console.error("Failed to disconnect:", err);
  }
}

// Publish video
async function publish() {
  if (!props.video || !publishTitle.value.trim()) return;

  try {
    publishing.value = true;
    error.value = null;
    publishResult.value = null;

    const response = await youtubeApi.publish(props.video.id, {
      customTitle: publishTitle.value,
      customDescription: publishDescription.value,
      tags: publishTags.value,
      categoryId: categoryId.value,
      privacyStatus: privacyStatus.value,
    });

    publishResult.value = response.data.youtube;
    emit("published", response.data);
  } catch (err) {
    console.error("Failed to publish:", err);
    error.value =
      err.response?.data?.message || "Не удалось опубликовать видео";
  } finally {
    publishing.value = false;
  }
}

function close() {
  emit("close");
}

function formatSubscribers(count) {
  if (!count) return "0";
  const num = parseInt(count);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Reset form when video changes
watch(
  () => props.video,
  (newVideo) => {
    if (newVideo) {
      publishTitle.value = newVideo.title || "";

      // Формируем описание с хештегами
      let thematicHashtags = "";
      if (newVideo.hashtags) {
        try {
          const hashtags =
            typeof newVideo.hashtags === "string"
              ? JSON.parse(newVideo.hashtags)
              : newVideo.hashtags;
          if (Array.isArray(hashtags) && hashtags.length > 0) {
            thematicHashtags = hashtags.join(" ");
          }
        } catch {
          thematicHashtags = "";
        }
      }

      // Базовые хештеги + тематические
      const baseHashtags = "#shorts #BrainBites #факты";
      publishDescription.value =
        `${newVideo.title}\n\n${baseHashtags} ${thematicHashtags}`.trim();

      // Load tags from video if available
      if (newVideo.tags) {
        try {
          const tags =
            typeof newVideo.tags === "string"
              ? JSON.parse(newVideo.tags)
              : newVideo.tags;
          publishTags.value = Array.isArray(tags) ? tags : [];
        } catch {
          publishTags.value = ["shorts", "факты", "интересное"];
        }
      } else {
        publishTags.value = ["shorts", "факты", "интересное"];
      }
      publishResult.value = null;
      error.value = null;
    }
  }
);

// Check status when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      checkYoutubeStatus();
    }
  }
);

// Check for YouTube callback params on mount
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("youtube_connected") === "true") {
    // Clear URL params
    window.history.replaceState({}, "", window.location.pathname);
    checkYoutubeStatus();
  }
  if (urlParams.get("youtube_error")) {
    error.value = urlParams.get("youtube_error");
    window.history.replaceState({}, "", window.location.pathname);
  }
});
</script>

<style scoped>
.animate-in {
  animation: animate-in 0.2s ease-out;
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

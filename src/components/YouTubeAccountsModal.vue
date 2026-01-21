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
      class="relative w-full max-w-2xl h-[90vh] glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 grid grid-rows-[auto_1fr]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b border-gray-800"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-500/20 rounded-xl">
            <Youtube class="w-6 h-6 text-red-500" />
          </div>
          <h2 class="text-xl font-bold text-white">YouTube Аккаунты</h2>
        </div>
        <button
          @click="close"
          class="p-2 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <Loader2 class="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p class="text-gray-400">Загрузка...</p>
        </div>

        <div v-else>
          <!-- Add new credentials form -->
          <div class="mb-6 p-4 bg-gray-800/50 rounded-xl">
            <h3 class="text-sm font-medium text-gray-300 mb-3">
              Добавить OAuth Credentials
            </h3>
            <div class="space-y-3">
              <input
                v-model="newCredentials.name"
                placeholder="Название (например: Личный аккаунт)"
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
              />
              <input
                v-model="newCredentials.clientId"
                placeholder="Client ID"
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm font-mono"
              />
              <input
                v-model="newCredentials.clientSecret"
                type="password"
                placeholder="Client Secret"
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm font-mono"
              />
              <button
                @click="addCredentials"
                :disabled="
                  saving ||
                  !newCredentials.name ||
                  !newCredentials.clientId ||
                  !newCredentials.clientSecret
                "
                class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                <Plus v-else class="w-4 h-4" />
                <span>{{ saving ? "Добавление..." : "Добавить" }}</span>
              </button>
            </div>
          </div>

          <!-- Credentials list -->
          <div v-if="credentials.length === 0" class="text-center py-8">
            <p class="text-gray-400">Нет добавленных аккаунтов</p>
            <p class="text-gray-500 text-sm mt-1">
              Добавьте OAuth credentials выше
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="cred in credentials"
              :key="cred.id"
              class="p-4 bg-gray-800/50 rounded-xl"
            >
              <!-- Credentials header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Key class="w-4 h-4 text-primary-400" />
                  <span class="font-medium text-white">{{ cred.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="connectChannel(cred.id)"
                    :disabled="connecting === cred.id"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <Loader2
                      v-if="connecting === cred.id"
                      class="w-3.5 h-3.5 animate-spin"
                    />
                    <UserPlus v-else class="w-3.5 h-3.5" />
                    <span>Подключить канал</span>
                  </button>
                  <button
                    @click="deleteCredentials(cred.id)"
                    class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    title="Удалить credentials"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Client ID (masked) -->
              <p class="text-xs text-gray-500 font-mono mb-3">
                {{ cred.clientId.slice(0, 20) }}...
              </p>

              <!-- Connected channels -->
              <div v-if="cred.channels && cred.channels.length > 0">
                <p class="text-xs text-gray-400 mb-2">Подключенные каналы:</p>
                <div class="space-y-2">
                  <div
                    v-for="channel in cred.channels"
                    :key="channel.id"
                    class="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg"
                  >
                    <img
                      v-if="channel.thumbnail"
                      :src="channel.thumbnail"
                      class="w-8 h-8 rounded-full"
                    />
                    <div
                      v-else
                      class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"
                    >
                      <Youtube class="w-4 h-4 text-gray-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-white truncate">
                        {{ channel.title }}
                      </p>
                      <p class="text-xs text-gray-400">
                        {{ formatSubscribers(channel.subscriberCount) }}
                        подписчиков
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="!channel.isDefault"
                        @click="setDefaultChannel(channel.id)"
                        class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-gray-300 transition-colors"
                        title="Сделать по умолчанию"
                      >
                        По умолчанию
                      </button>
                      <span
                        v-else
                        class="px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded"
                      >
                        По умолчанию
                      </span>
                      <button
                        @click="deleteChannel(channel.id)"
                        class="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        title="Отключить канал"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-xs text-gray-500 italic">
                Нет подключенных каналов
              </div>
            </div>
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import {
  Youtube,
  X,
  Loader2,
  Plus,
  Trash2,
  Key,
  UserPlus,
  AlertCircle,
} from "lucide-vue-next";
import { youtubeApi } from "../api";
import {
  useModalStack,
  initModalEscapeHandler,
} from "../composables/useModalStack";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

// Регистрация в стеке модалок для закрытия по Esc
initModalEscapeHandler();
const { register, unregister } = useModalStack(() => emit("close"));

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      register();
    } else {
      unregister();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  unregister();
});

const loading = ref(false);
const saving = ref(false);
const connecting = ref(null);
const error = ref(null);
const credentials = ref([]);

const newCredentials = ref({
  name: "",
  clientId: "",
  clientSecret: "",
});

// Load credentials
async function loadCredentials() {
  try {
    loading.value = true;
    error.value = null;
    const response = await youtubeApi.getCredentials();
    credentials.value = response.data.credentials || [];
  } catch (err) {
    console.error("Failed to load credentials:", err);
    error.value = "Не удалось загрузить данные";
  } finally {
    loading.value = false;
  }
}

// Add new credentials
async function addCredentials() {
  if (
    !newCredentials.value.name ||
    !newCredentials.value.clientId ||
    !newCredentials.value.clientSecret
  )
    return;

  try {
    saving.value = true;
    error.value = null;
    await youtubeApi.createCredentials(newCredentials.value);
    newCredentials.value = { name: "", clientId: "", clientSecret: "" };
    await loadCredentials();
  } catch (err) {
    console.error("Failed to add credentials:", err);
    error.value = err.response?.data?.message || "Не удалось добавить";
  } finally {
    saving.value = false;
  }
}

// Delete credentials
async function deleteCredentials(id) {
  if (!confirm("Удалить эти credentials? Все связанные каналы будут удалены."))
    return;

  try {
    error.value = null;
    await youtubeApi.deleteCredentials(id);
    await loadCredentials();
  } catch (err) {
    console.error("Failed to delete credentials:", err);
    error.value = err.response?.data?.message || "Не удалось удалить";
  }
}

// Connect channel
async function connectChannel(credentialsId) {
  try {
    connecting.value = credentialsId;
    error.value = null;
    const response = await youtubeApi.getAuthUrl(credentialsId);
    window.location.href = response.data.authUrl;
  } catch (err) {
    console.error("Failed to get auth URL:", err);
    error.value = "Не удалось получить ссылку авторизации";
    connecting.value = null;
  }
}

// Delete channel
async function deleteChannel(channelId) {
  if (!confirm("Отключить этот канал?")) return;

  try {
    error.value = null;
    await youtubeApi.deleteChannel(channelId);
    await loadCredentials();
  } catch (err) {
    console.error("Failed to delete channel:", err);
    error.value = err.response?.data?.message || "Не удалось отключить канал";
  }
}

// Set default channel
async function setDefaultChannel(channelId) {
  try {
    error.value = null;
    await youtubeApi.setDefaultChannel(channelId);
    await loadCredentials();
  } catch (err) {
    console.error("Failed to set default channel:", err);
    error.value = "Не удалось установить канал по умолчанию";
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

// Load when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadCredentials();
    }
  },
);

// Check for YouTube callback params on mount
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("youtube_connected") === "true") {
    window.history.replaceState({}, "", window.location.pathname);
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

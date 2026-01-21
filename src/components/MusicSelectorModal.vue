<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        @click="close"
      />

      <!-- Modal -->
      <div
        class="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-gray-800"
        >
          <div class="flex items-center gap-3">
            <Music class="w-6 h-6 text-primary-400" />
            <h2 class="text-xl font-semibold text-white">
              Выбор фоновой музыки
            </h2>
          </div>
          <button
            @click="close"
            class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Search & Filters -->
        <div class="p-4 border-b border-gray-800 space-y-3">
          <!-- Search input -->
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск музыки..."
                class="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                @keyup.enter="search"
              />
            </div>
            <button
              @click="search"
              :disabled="isLoading"
              class="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 rounded-xl font-medium text-white transition-colors flex items-center gap-2"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>Найти</span>
            </button>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap gap-3">
            <!-- Mood -->
            <select
              v-model="selectedMood"
              class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Настроение</option>
              <option v-for="mood in moods" :key="mood" :value="mood">
                {{ moodLabels[mood] || mood }}
              </option>
            </select>

            <!-- Genre -->
            <select
              v-model="selectedGenre"
              class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Жанр</option>
              <option v-for="genre in genres" :key="genre" :value="genre">
                {{ genre }}
              </option>
            </select>

            <!-- Speed -->
            <select
              v-model="selectedSpeed"
              class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Темп</option>
              <option value="verylow">Очень медленный</option>
              <option value="low">Медленный</option>
              <option value="medium">Средний</option>
              <option value="high">Быстрый</option>
              <option value="veryhigh">Очень быстрый</option>
            </select>

            <!-- Reset filters -->
            <button
              v-if="hasActiveFilters"
              @click="resetFilters"
              class="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Сбросить
            </button>
          </div>
        </div>

        <!-- Track List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 text-primary-400 animate-spin" />
            <span class="ml-3 text-gray-400">Загрузка...</span>
          </div>

          <div
            v-else-if="tracks.length === 0"
            class="text-center py-12 text-gray-500"
          >
            <Music class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет результатов</p>
            <p class="text-sm mt-1">Попробуйте изменить параметры поиска</p>
          </div>

          <div
            v-else
            v-for="track in tracks"
            :key="track.id"
            class="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
            :class="{
              'bg-primary-600/20 border border-primary-500/50':
                selectedTrack?.id === track.id,
              'border border-transparent': selectedTrack?.id !== track.id,
            }"
            @click="selectTrack(track)"
          >
            <!-- Album art -->
            <div
              class="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0"
            >
              <img
                v-if="track.imageUrl"
                :src="track.imageUrl"
                :alt="track.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Music class="w-6 h-6 text-gray-600" />
              </div>

              <!-- Play button overlay -->
              <button
                @click.stop="togglePlay(track)"
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pause
                  v-if="currentlyPlaying?.id === track.id && !isPaused"
                  class="w-6 h-6 text-white"
                />
                <Play v-else class="w-6 h-6 text-white" />
              </button>
            </div>

            <!-- Track info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white truncate">
                {{ track.name }}
              </div>
              <div class="text-sm text-gray-400 truncate">
                {{ track.artist }}
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{{ formatDuration(track.duration) }}</span>
                <span
                  v-if="track.genres?.length"
                  class="flex items-center gap-1"
                >
                  <span class="w-1 h-1 rounded-full bg-gray-600" />
                  {{ track.genres.slice(0, 2).join(", ") }}
                </span>
              </div>
            </div>

            <!-- Select indicator -->
            <div
              v-if="selectedTrack?.id === track.id"
              class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"
            >
              <Check class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <!-- Audio Player (when playing) -->
        <div
          v-if="currentlyPlaying"
          class="p-4 border-t border-gray-800 bg-gray-800/50"
        >
          <div class="flex items-center gap-4">
            <button
              @click="togglePlay(currentlyPlaying)"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 hover:bg-primary-500 transition-colors"
            >
              <Pause v-if="!isPaused" class="w-5 h-5 text-white" />
              <Play v-else class="w-5 h-5 text-white" />
            </button>

            <div class="flex-1">
              <div class="text-sm font-medium text-white truncate">
                {{ currentlyPlaying.name }}
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-400">{{
                  formatDuration(currentTime)
                }}</span>
                <input
                  type="range"
                  :value="currentTime"
                  :max="duration"
                  @input="seek($event.target.value)"
                  class="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <span class="text-xs text-gray-400">{{
                  formatDuration(duration)
                }}</span>
              </div>
            </div>

            <button
              @click="stopPlaying"
              class="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between p-4 border-t border-gray-800"
        >
          <div class="text-sm text-gray-400">
            <span v-if="selectedTrack">
              Выбрано: <span class="text-white">{{ selectedTrack.name }}</span>
            </span>
            <span v-else>Выберите трек</span>
          </div>
          <div class="flex gap-3">
            <button
              @click="close"
              class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              @click="confirm"
              :disabled="!selectedTrack"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-colors"
            >
              Выбрать
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Hidden audio element -->
  <audio
    ref="audioRef"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="onEnded"
  />
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { Music, X, Search, Loader2, Play, Pause, Check } from "lucide-vue-next";
import { musicApi } from "../api";
import {
  useModalStack,
  initModalEscapeHandler,
} from "../composables/useModalStack";

const props = defineProps({
  isOpen: Boolean,
  currentMusic: Object,
});

const emit = defineEmits(["close", "select"]);

// Modal Esc handler
initModalEscapeHandler();
const { register, unregister } = useModalStack(() => emit("close"));

// State
const searchQuery = ref("");
const selectedMood = ref("");
const selectedGenre = ref("");
const selectedSpeed = ref("");
const tracks = ref([]);
const isLoading = ref(false);
const selectedTrack = ref(null);

// Audio player state
const audioRef = ref(null);
const currentlyPlaying = ref(null);
const isPaused = ref(true);
const currentTime = ref(0);
const duration = ref(0);

// Available options
const moods = ref([]);
const genres = ref([]);

const moodLabels = {
  epic: "Эпичный",
  calm: "Спокойный",
  energetic: "Энергичный",
  dark: "Темный",
  happy: "Веселый",
  sad: "Грустный",
  intense: "Напряженный",
  romantic: "Романтичный",
  inspiring: "Вдохновляющий",
  mysterious: "Загадочный",
};

// Computed
const hasActiveFilters = computed(() => {
  return selectedMood.value || selectedGenre.value || selectedSpeed.value;
});

// Methods
async function loadFilters() {
  try {
    const [genresRes, moodsRes] = await Promise.all([
      musicApi.getGenres(),
      musicApi.getMoods(),
    ]);
    genres.value = genresRes.data.genres || [];
    moods.value = moodsRes.data.moods || [];
  } catch (error) {
    console.error("Failed to load filters:", error);
  }
}

async function search() {
  isLoading.value = true;
  try {
    const params = {
      q: searchQuery.value,
      mood: selectedMood.value,
      genres: selectedGenre.value,
      speed: selectedSpeed.value,
      limit: 30,
    };

    const response = await musicApi.search(params);
    tracks.value = response.data.tracks || [];
  } catch (error) {
    console.error("Search failed:", error);
    tracks.value = [];
  } finally {
    isLoading.value = false;
  }
}

function resetFilters() {
  selectedMood.value = "";
  selectedGenre.value = "";
  selectedSpeed.value = "";
  searchQuery.value = "";
}

function selectTrack(track) {
  selectedTrack.value = track;
}

function togglePlay(track) {
  if (!audioRef.value) return;

  if (currentlyPlaying.value?.id === track.id) {
    // Toggle pause
    if (isPaused.value) {
      audioRef.value.play();
      isPaused.value = false;
    } else {
      audioRef.value.pause();
      isPaused.value = true;
    }
  } else {
    // Play new track
    audioRef.value.src = track.audioUrl;
    audioRef.value.play();
    currentlyPlaying.value = track;
    isPaused.value = false;
  }
}

function stopPlaying() {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.src = "";
  }
  currentlyPlaying.value = null;
  isPaused.value = true;
  currentTime.value = 0;
  duration.value = 0;
}

function seek(time) {
  if (audioRef.value) {
    audioRef.value.currentTime = parseFloat(time);
  }
}

function onTimeUpdate() {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
}

function onLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
}

function onEnded() {
  isPaused.value = true;
  currentTime.value = 0;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function close() {
  stopPlaying();
  emit("close");
}

function confirm() {
  if (selectedTrack.value) {
    stopPlaying();
    emit("select", selectedTrack.value);
    emit("close");
  }
}

// Watch for modal open
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      register();
      await loadFilters();
      await search();

      // Pre-select current music if exists
      if (props.currentMusic?.id) {
        selectedTrack.value =
          tracks.value.find((t) => t.id === props.currentMusic.id) || null;
      }
    } else {
      unregister();
      stopPlaying();
    }
  },
  { immediate: true },
);

// Cleanup on unmount
onUnmounted(() => {
  unregister();
  stopPlaying();
});
</script>

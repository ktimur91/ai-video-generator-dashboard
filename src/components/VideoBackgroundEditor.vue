<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />

    <!-- Modal -->
    <div
      class="relative bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-800"
      >
        <h2 class="text-xl font-bold text-white">Редактирование видео-фонов</h2>
        <button
          @click="close"
          class="p-2 hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Segments List -->
        <div class="w-1/3 border-r border-gray-800 overflow-y-auto p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-3">Сегменты</h3>
          <div class="space-y-2">
            <button
              v-for="(segment, index) in localSegments"
              :key="index"
              @click="selectSegment(index)"
              :class="[
                'w-full text-left p-3 rounded-xl transition-all',
                selectedSegmentIndex === index
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
              ]"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">
                  {{ getSegmentIcon(segment.type) }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">
                    {{ getSegmentLabel(segment, index) }}
                  </p>
                  <p class="text-xs opacity-70 truncate">
                    {{ segment.text?.substring(0, 40) }}...
                  </p>
                </div>
                <span
                  v-if="segment.stockVideo?.url"
                  class="text-green-400 text-xs"
                >
                  ✓
                </span>
                <span v-else class="text-red-400 text-xs">✗</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Video Search -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="selectedSegmentIndex !== null">
            <!-- Current Video Preview -->
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-400 mb-2">
                Текущий фон для:
                {{
                  getSegmentLabel(
                    localSegments[selectedSegmentIndex],
                    selectedSegmentIndex
                  )
                }}
              </h3>
              <div
                v-if="localSegments[selectedSegmentIndex]?.stockVideo?.url"
                class="relative rounded-xl overflow-hidden bg-gray-800 aspect-[9/16] max-w-[200px]"
              >
                <video
                  :src="localSegments[selectedSegmentIndex].stockVideo.url"
                  class="w-full h-full object-cover"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <button
                  @click="removeVideo(selectedSegmentIndex)"
                  class="absolute top-2 right-2 p-1 bg-red-600 rounded-lg hover:bg-red-500"
                >
                  <Trash2 class="w-4 h-4 text-white" />
                </button>
              </div>
              <div
                v-else
                class="rounded-xl bg-gray-800 aspect-[9/16] max-w-[200px] flex items-center justify-center text-gray-500"
              >
                Нет видео
              </div>
            </div>

            <!-- Search -->
            <div class="space-y-3">
              <div class="flex gap-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Поиск видео..."
                  class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @keyup.enter="searchVideos"
                />
                <select
                  v-model="searchSource"
                  class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pexels">Pexels</option>
                  <option value="pixabay">Pixabay</option>
                </select>
                <button
                  @click="searchVideos"
                  :disabled="isSearching || !searchQuery"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Search v-if="!isSearching" class="w-5 h-5" />
                  <Loader2 v-else class="w-5 h-5 animate-spin" />
                </button>
              </div>

              <!-- Search Results -->
              <div
                v-if="searchResults.length > 0"
                class="grid grid-cols-3 gap-3"
              >
                <button
                  v-for="video in searchResults"
                  :key="video.id"
                  @click="selectVideo(video)"
                  class="relative rounded-xl overflow-hidden bg-gray-800 aspect-[9/16] hover:ring-2 hover:ring-primary-500 transition-all group"
                >
                  <video
                    :src="video.url"
                    class="w-full h-full object-cover"
                    muted
                    loop
                    playsinline
                    @mouseenter="($event.target as HTMLVideoElement).play()"
                    @mouseleave="($event.target as HTMLVideoElement).pause()"
                  />
                  <div
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Check class="w-8 h-8 text-white" />
                  </div>
                  <div
                    class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white"
                  >
                    {{ video.duration }}s
                  </div>
                </button>
              </div>

              <p
                v-else-if="hasSearched && !isSearching"
                class="text-gray-500 text-center py-8"
              >
                Видео не найдены. Попробуйте другие ключевые слова.
              </p>

              <p
                v-else-if="!hasSearched"
                class="text-gray-500 text-center py-8"
              >
                Введите ключевые слова для поиска видео
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex items-center justify-center h-full text-gray-500"
          >
            Выберите сегмент слева для редактирования
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between p-4 border-t border-gray-800"
      >
        <p class="text-sm text-gray-400">
          Изменено сегментов: {{ changedCount }}
        </p>
        <div class="flex gap-3">
          <button
            @click="close"
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            @click="saveAndRender"
            :disabled="changedCount === 0"
            class="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white font-medium transition-colors"
          >
            Сохранить и перерендерить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { X, Search, Loader2, Check, Trash2 } from "lucide-vue-next";
import api from "../api";

const props = defineProps<{
  isOpen: boolean;
  video: any;
}>();

const emit = defineEmits(["close", "save"]);

const localSegments = ref<any[]>([]);
const originalSegments = ref<any[]>([]);
const selectedSegmentIndex = ref<number | null>(null);
const searchQuery = ref("");
const searchSource = ref("pexels");
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.video?.segments) {
      const segments =
        typeof props.video.segments === "string"
          ? JSON.parse(props.video.segments)
          : props.video.segments;
      localSegments.value = JSON.parse(JSON.stringify(segments));
      originalSegments.value = JSON.parse(JSON.stringify(segments));
      selectedSegmentIndex.value = null;
      searchQuery.value = "";
      searchResults.value = [];
      hasSearched.value = false;
    }
  }
);

const changedCount = computed(() => {
  let count = 0;
  for (let i = 0; i < localSegments.value.length; i++) {
    const original = originalSegments.value[i]?.stockVideo?.url;
    const current = localSegments.value[i]?.stockVideo?.url;
    if (original !== current) count++;
  }
  return count;
});

function getSegmentIcon(type: string) {
  switch (type) {
    case "intro":
      return "🎬";
    case "outro":
      return "👋";
    case "fact":
      return "💡";
    default:
      return "📹";
  }
}

function getSegmentLabel(segment: any, index: number) {
  switch (segment.type) {
    case "intro":
      return "Интро";
    case "outro":
      return "Аутро";
    case "fact":
      return `Факт ${segment.number || index}`;
    default:
      return `Сегмент ${index + 1}`;
  }
}

function selectSegment(index: number) {
  selectedSegmentIndex.value = index;
  searchResults.value = [];
  hasSearched.value = false;

  // Pre-fill search with segment keywords
  const segment = localSegments.value[index];
  if (segment.searchKeywords?.length) {
    searchQuery.value = segment.searchKeywords.slice(0, 2).join(", ");
  } else if (segment.type === "intro") {
    searchQuery.value = "energy, dynamic";
  } else if (segment.type === "outro") {
    searchQuery.value = "social media, subscribe";
  } else {
    searchQuery.value = "";
  }
}

async function searchVideos() {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  hasSearched.value = true;

  try {
    const response = await api.get("/search-videos", {
      params: {
        q: searchQuery.value,
        source: searchSource.value,
      },
    });
    searchResults.value = response.data.videos || [];
  } catch (error) {
    console.error("Search error:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function selectVideo(video: any) {
  if (selectedSegmentIndex.value === null) return;

  localSegments.value[selectedSegmentIndex.value].stockVideo = {
    id: video.id,
    url: video.url,
    width: video.width,
    height: video.height,
    duration: video.duration,
    photographer: video.photographer,
  };

  searchResults.value = [];
  hasSearched.value = false;
}

function removeVideo(index: number) {
  localSegments.value[index].stockVideo = null;
}

function close() {
  emit("close");
}

async function saveAndRender() {
  emit("save", localSegments.value);
}
</script>

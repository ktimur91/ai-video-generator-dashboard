<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />

    <!-- Modal -->
    <div
      class="relative bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-800"
      >
        <h2 class="text-xl font-bold text-white">
          {{
            isReviewMode ? "Проверка и одобрение" : "Редактирование видео-фонов"
          }}
        </h2>
        <button
          @click="close"
          class="p-2 hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden grid grid-rows-[auto_1fr]">
        <!-- Segments List -->
        <div class="flex gap-3 border-b border-gray-800 overflow-x-auto p-4">
          <button
            v-for="(segment, index) in localSegments"
            :key="index"
            @click="selectSegment(index)"
            :class="[
              'w-full text-left py-1 px-2 rounded-xl transition-all',
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
                <!-- <p class="text-xs opacity-70 truncate">
                  {{ segment.text?.substring(0, 40) }}...
                </p> -->
              </div>
              <span
                v-if="segment.stockVideo?.url"
                class="text-green-400 text-md"
              >
                ✓
              </span>
              <span v-else class="text-red-400 text-md">✗</span>
            </div>
          </button>
        </div>

        <!-- Video Search -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="selectedSegmentIndex !== null"
            class="grid grid-cols-[auto_1fr]"
          >
            <!-- Current Video Preview -->
            <div class="flex flex-col w-[240px] p-4 border-r border-gray-800">
              <div class="flex flex-col gap-5 sticky top-4">
                <!-- Text -->
                <div class="flex flex-col">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-400">Текст</h3>
                    <button
                      v-if="!isEditingText"
                      @click="startEditingText"
                      class="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                      title="Редактировать текст"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Text editing mode -->
                  <div v-if="isEditingText" class="space-y-2">
                    <textarea
                      v-model="editingTextValue"
                      class="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Введите текст сегмента..."
                    ></textarea>
                    <div class="flex gap-2">
                      <button
                        @click="saveTextEdit"
                        class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white font-medium transition-colors"
                      >
                        Сохранить
                      </button>
                      <button
                        @click="cancelTextEdit"
                        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-medium transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>

                  <!-- Text display mode -->
                  <p v-else class="text-gray-300 text-sm leading-relaxed">
                    {{ localSegments[selectedSegmentIndex]?.text }}
                  </p>
                </div>

                <!-- Video Preview -->
                <div
                  v-if="localSegments[selectedSegmentIndex]?.stockVideo?.url"
                  class="relative rounded-xl overflow-hidden bg-gray-800 aspect-[9/16] w-full"
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
                  class="rounded-xl bg-gray-800 aspect-[9/16] w-full flex items-center justify-center text-gray-500"
                >
                  Нет видео
                </div>
              </div>
            </div>

            <!-- Search -->
            <div class="space-y-3 p-4">
              <!-- Search Input -->
              <div class="flex gap-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Поиск видео..."
                  class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @keyup.enter="searchVideos(true)"
                />
                <button
                  @click="searchVideos(true)"
                  :disabled="isSearching || !searchQuery"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Search v-if="!isSearching" class="w-5 h-5" />
                  <Loader2 v-else class="w-5 h-5 animate-spin" />
                </button>
              </div>

              <!-- Vertical Only Toggle (not for Klipy) -->
              <div
                v-if="activeSource !== 'klipy'"
                class="flex items-center gap-4"
              >
                <label
                  class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    v-model="verticalOnly"
                    class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  Только вертикальные видео
                </label>
              </div>

              <!-- Klipy notice -->
              <div v-else class="text-xs text-gray-500">
                💡 Klipy — клипы из фильмов и мемы. Фильтр ориентации
                недоступен.
              </div>

              <!-- Source Tabs -->
              <div class="flex gap-2 border-b border-gray-700">
                <button
                  v-for="source in sources"
                  :key="source.id"
                  @click="switchSource(source.id)"
                  :class="[
                    'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeSource === source.id
                      ? 'text-primary-400 border-primary-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300',
                  ]"
                >
                  {{ source.name }}
                  <span
                    v-if="sourceResults[source.id]?.videos.length"
                    class="ml-1 text-xs opacity-70"
                  >
                    ({{ sourceResults[source.id].videos.length }})
                  </span>
                </button>
              </div>

              <!-- Search Results for Active Source -->
              <div
                v-if="currentSourceResults.videos.length > 0"
                class="space-y-3"
              >
                <div class="grid grid-cols-4 gap-3">
                  <button
                    v-for="video in currentSourceResults.videos"
                    :key="video.id"
                    @click="selectVideo(video)"
                    :class="[
                      'relative rounded-xl overflow-hidden bg-gray-800 aspect-[9/16] transition-all group',
                      !video.isVertical
                        ? 'ring-2 ring-yellow-500/50'
                        : 'hover:ring-2 hover:ring-primary-500',
                    ]"
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
                    <div
                      v-if="!video.isVertical"
                      class="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-600/90 rounded text-xs text-white"
                    >
                      ⬌
                    </div>
                  </button>
                </div>

                <!-- Load More Button -->
                <button
                  v-if="currentSourceResults.hasMore"
                  @click="loadMore"
                  :disabled="isSearching"
                  class="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 rounded-xl text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Loader2 v-if="isSearching" class="w-4 h-4 animate-spin" />
                  <span v-else>Загрузить ещё</span>
                </button>
              </div>

              <p
                v-else-if="hasSearchedInSource && !isSearching"
                class="text-gray-500 text-center py-8"
              >
                Видео не найдены. Попробуйте другие ключевые слова.
              </p>

              <p
                v-else-if="!hasSearchedInSource"
                class="text-gray-500 text-center py-8"
              >
                Введите ключевые слова для поиска видео
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex items-center justify-center h-full text-gray-500 p-5"
          >
            Выберите сегмент слева для редактирования
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between p-4 border-t border-gray-800"
      >
        <div class="flex items-center gap-4">
          <p class="text-sm text-gray-400">Изменено: {{ changedCount }}</p>

          <!-- Background music selector (only in review mode) -->
          <div v-if="isReviewMode" class="flex items-center gap-2">
            <Music class="w-4 h-4 text-gray-400" />
            <select
              v-model="selectedBackgroundMusic"
              :disabled="isLoadingMusic"
              class="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
            >
              <option value="">Без музыки</option>
              <option
                v-for="music in backgroundMusicList"
                :key="music.filename"
                :value="music.filename"
              >
                {{ music.name }}
              </option>
            </select>

            <!-- Play/Stop button -->
            <button
              v-if="selectedBackgroundMusic"
              @click="toggleMusicPreview"
              class="p-1.5 rounded-lg transition-colors"
              :class="
                isPlayingMusic
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              "
              :title="isPlayingMusic ? 'Остановить' : 'Прослушать'"
            >
              <component
                :is="isPlayingMusic ? StopCircle : Play"
                class="w-4 h-4"
              />
            </button>

            <!-- Divider -->
            <div class="w-px h-6 bg-gray-700 mx-2"></div>

            <!-- Voice selector -->
            <Mic class="w-4 h-4 text-purple-400" />
            <select
              v-model="selectedVoiceConfigId"
              :disabled="isLoadingVoices"
              class="px-3 py-1.5 bg-gray-800 border border-purple-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
            >
              <option value="">Голос по умолчанию</option>
              <option
                v-for="voice in voiceConfigList"
                :key="voice.id"
                :value="voice.id"
              >
                {{ voice.name }}
                <template v-if="voice.isDefault"> ⭐</template>
              </option>
            </select>

            <!-- Voice Play/Stop button -->
            <button
              v-if="selectedVoiceConfigId"
              @click="toggleVoicePreview"
              :disabled="isGeneratingVoicePreview"
              class="p-1.5 rounded-lg transition-colors"
              :class="
                isPlayingVoice
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : isGeneratingVoicePreview
                  ? 'bg-gray-600 text-gray-400 cursor-wait'
                  : 'bg-purple-700 hover:bg-purple-600 text-white'
              "
              :title="
                isPlayingVoice
                  ? 'Остановить'
                  : isGeneratingVoicePreview
                  ? 'Генерация...'
                  : 'Прослушать голос'
              "
            >
              <Loader2
                v-if="isGeneratingVoicePreview"
                class="w-4 h-4 animate-spin"
              />
              <component
                v-else
                :is="isPlayingVoice ? StopCircle : Play"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="close"
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
          >
            Отмена
          </button>

          <!-- Approve button for review mode -->
          <button
            v-if="isReviewMode"
            @click="approveAndContinue"
            class="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors"
          >
            <ThumbsUp class="w-4 h-4" />
            Готово
          </button>

          <!-- Save button for edit mode -->
          <button
            v-else
            @click="saveAndRender"
            :disabled="changedCount === 0"
            class="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white font-medium transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from "vue";
import {
  X,
  Search,
  Loader2,
  Check,
  Trash2,
  Music,
  ThumbsUp,
  Pencil,
  Play,
  StopCircle,
  Mic,
} from "lucide-vue-next";
import api from "../api";

interface VideoResult {
  id: string | number;
  url: string;
  width: number;
  height: number;
  duration: number;
  photographer: string;
  thumbnail?: string;
  isVertical: boolean;
}

interface SourceResults {
  videos: VideoResult[];
  page: number;
  hasMore: boolean;
  query: string;
  hasSearched: boolean;
  nextPos?: string | null; // Для cursor-based пагинации (Klipy)
}

interface MusicTrack {
  filename: string;
  url: string;
  name: string;
}

interface VoiceConfig {
  id: string;
  name: string;
  voice: string;
  rate: string;
  pitch: string;
  volume: string;
  isDefault: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  video: any;
  isReviewMode?: boolean;
  fetchBackgroundMusic?: () => Promise<MusicTrack[]>;
}>();

const emit = defineEmits(["close", "save", "approve"]);

const sources = [
  { id: "pexels", name: "Pexels" },
  { id: "pixabay", name: "Pixabay" },
  { id: "klipy", name: "Klipy" },
];

const localSegments = ref<any[]>([]);
const originalSegments = ref<any[]>([]);
const selectedSegmentIndex = ref<number | null>(null);
const searchQuery = ref("");
const activeSource = ref("pexels");
const verticalOnly = ref(true);
const isSearching = ref(false);
const isEditingText = ref(false);
const editingTextValue = ref("");

// Фоновая музыка
const backgroundMusicList = ref<MusicTrack[]>([]);
const selectedBackgroundMusic = ref<string>("");
const isLoadingMusic = ref(false);
const isPlayingMusic = ref(false);
const audioPlayer = ref<HTMLAudioElement | null>(null);

// Голоса озвучки
const voiceConfigList = ref<VoiceConfig[]>([]);
const selectedVoiceConfigId = ref<string>("");
const isLoadingVoices = ref(false);
const isPlayingVoice = ref(false);
const isGeneratingVoicePreview = ref(false);
const voiceAudioPlayer = ref<HTMLAudioElement | null>(null);
const voicePreviewText = "Привет! Это пример голоса для вашего видео.";

// Результаты поиска для каждого источника (сохраняются отдельно)
const sourceResults = reactive<Record<string, SourceResults>>({
  pexels: {
    videos: [],
    page: 1,
    hasMore: false,
    query: "",
    hasSearched: false,
  },
  pixabay: {
    videos: [],
    page: 1,
    hasMore: false,
    query: "",
    hasSearched: false,
  },
  klipy: {
    videos: [],
    page: 1,
    hasMore: false,
    query: "",
    hasSearched: false,
    nextPos: null,
  },
});

const currentSourceResults = computed(() => sourceResults[activeSource.value]);
const hasSearchedInSource = computed(
  () => currentSourceResults.value.hasSearched
);

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.video?.segments) {
      const segments =
        typeof props.video.segments === "string"
          ? JSON.parse(props.video.segments)
          : props.video.segments;
      localSegments.value = JSON.parse(JSON.stringify(segments));
      originalSegments.value = JSON.parse(JSON.stringify(segments));
      selectedSegmentIndex.value = null;
      searchQuery.value = "";
      isEditingText.value = false;
      editingTextValue.value = "";

      // Устанавливаем текущую фоновую музыку
      selectedBackgroundMusic.value = props.video.backgroundMusicFilename || "";

      // Сбрасываем результаты поиска при открытии модалки
      sourceResults.pexels = {
        videos: [],
        page: 1,
        hasMore: false,
        query: "",
        hasSearched: false,
      };
      sourceResults.pixabay = {
        videos: [],
        page: 1,
        hasMore: false,
        query: "",
        hasSearched: false,
      };
      sourceResults.klipy = {
        videos: [],
        page: 1,
        hasMore: false,
        query: "",
        hasSearched: false,
        nextPos: null,
      };

      // Загружаем список фоновой музыки если в режиме review
      if (props.isReviewMode && props.fetchBackgroundMusic) {
        isLoadingMusic.value = true;
        try {
          backgroundMusicList.value = await props.fetchBackgroundMusic();
        } catch (e) {
          console.error("Failed to load background music:", e);
        } finally {
          isLoadingMusic.value = false;
        }

        // Загружаем список голосов
        isLoadingVoices.value = true;
        try {
          const response = await api.get("/voices");
          voiceConfigList.value = response.data.voices || [];
          // Устанавливаем текущий голос видео или голос по умолчанию
          if (props.video?.voiceConfigId) {
            selectedVoiceConfigId.value = props.video.voiceConfigId;
          } else {
            const defaultVoice = voiceConfigList.value.find((v) => v.isDefault);
            selectedVoiceConfigId.value = defaultVoice?.id || "";
          }
        } catch (e) {
          console.error("Failed to load voices:", e);
        } finally {
          isLoadingVoices.value = false;
        }
      }
    }
  }
);

const changedCount = computed(() => {
  let count = 0;
  for (let i = 0; i < localSegments.value.length; i++) {
    const original = originalSegments.value[i]?.stockVideo?.url;
    const current = localSegments.value[i]?.stockVideo?.url;
    if (original !== current) count++;

    // Также считаем изменения текста
    const originalText = originalSegments.value[i]?.text;
    const currentText = localSegments.value[i]?.text;
    if (originalText !== currentText) count++;
  }
  return count;
});

const hasAnyChanges = computed(() => {
  if (changedCount.value > 0) return true;
  if (
    selectedBackgroundMusic.value !==
    (props.video?.backgroundMusicFilename || "")
  )
    return true;
  return false;
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
  // НЕ очищаем результаты поиска при выборе сегмента

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

function switchSource(sourceId: string) {
  activeSource.value = sourceId;
}

async function searchVideos(resetPage = true) {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  const source = activeSource.value;

  if (resetPage) {
    sourceResults[source].page = 1;
    sourceResults[source].videos = [];
    // Сбрасываем cursor для Klipy при новом поиске
    if (source === "klipy") {
      sourceResults[source].nextPos = null;
    }
  }

  sourceResults[source].hasSearched = true;
  sourceResults[source].query = searchQuery.value;

  try {
    const params: Record<string, any> = {
      q: searchQuery.value,
      source: source,
      page: sourceResults[source].page,
      verticalOnly: verticalOnly.value.toString(),
    };

    // Для Klipy используем cursor-based пагинацию
    if (source === "klipy" && sourceResults[source].nextPos) {
      params.pos = sourceResults[source].nextPos;
    }

    const response = await api.get("/search-videos", { params });

    const newVideos = response.data.videos || [];
    if (resetPage) {
      sourceResults[source].videos = newVideos;
    } else {
      sourceResults[source].videos = [
        ...sourceResults[source].videos,
        ...newVideos,
      ];
    }
    sourceResults[source].hasMore = response.data.hasMore || false;

    // Сохраняем cursor для следующей страницы (Klipy)
    if (source === "klipy" && response.data.nextPos) {
      sourceResults[source].nextPos = response.data.nextPos;
    }
  } catch (error) {
    console.error("Search error:", error);
    if (resetPage) {
      sourceResults[source].videos = [];
    }
  } finally {
    isSearching.value = false;
  }
}

async function loadMore() {
  const source = activeSource.value;
  sourceResults[source].page++;
  await searchVideos(false);
}

function selectVideo(video: VideoResult) {
  if (selectedSegmentIndex.value === null) return;

  localSegments.value[selectedSegmentIndex.value].stockVideo = {
    id: video.id,
    url: video.url,
    width: video.width,
    height: video.height,
    duration: video.duration,
    photographer: video.photographer,
    isVertical: video.isVertical,
  };

  // НЕ очищаем результаты после выбора видео
}

function removeVideo(index: number) {
  localSegments.value[index].stockVideo = null;
}

function toggleMusicPreview() {
  if (isPlayingMusic.value) {
    // Остановить
    if (audioPlayer.value) {
      audioPlayer.value.pause();
      audioPlayer.value = null;
    }
    isPlayingMusic.value = false;
  } else {
    // Найти URL выбранной музыки и воспроизвести
    const track = backgroundMusicList.value.find(
      (m) => m.filename === selectedBackgroundMusic.value
    );
    if (track) {
      audioPlayer.value = new Audio(track.url);
      audioPlayer.value.volume = 0.5;
      audioPlayer.value.play();
      audioPlayer.value.onended = () => {
        isPlayingMusic.value = false;
        audioPlayer.value = null;
      };
      isPlayingMusic.value = true;
    }
  }
}

function stopMusicPreview() {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value = null;
  }
  isPlayingMusic.value = false;
}

async function toggleVoicePreview() {
  if (isPlayingVoice.value) {
    // Остановить
    if (voiceAudioPlayer.value) {
      voiceAudioPlayer.value.pause();
      voiceAudioPlayer.value = null;
    }
    isPlayingVoice.value = false;
  } else {
    // Найти выбранный голос и сгенерировать превью
    const voice = voiceConfigList.value.find(
      (v) => v.id === selectedVoiceConfigId.value
    );
    if (!voice) return;

    isGeneratingVoicePreview.value = true;
    try {
      const response = await api.post("/voices/preview", {
        text: voicePreviewText,
        voice: voice.voice,
        rate: voice.rate,
        pitch: voice.pitch,
        volume: voice.volume,
      });

      if (response.data.url) {
        const audioUrl = `http://localhost:3001${response.data.url}`;
        voiceAudioPlayer.value = new Audio(audioUrl);
        voiceAudioPlayer.value.volume = 0.8;
        voiceAudioPlayer.value.play();
        voiceAudioPlayer.value.onended = () => {
          isPlayingVoice.value = false;
          voiceAudioPlayer.value = null;
        };
        isPlayingVoice.value = true;
      }
    } catch (error) {
      console.error("Failed to generate voice preview:", error);
    } finally {
      isGeneratingVoicePreview.value = false;
    }
  }
}

function stopVoicePreview() {
  if (voiceAudioPlayer.value) {
    voiceAudioPlayer.value.pause();
    voiceAudioPlayer.value = null;
  }
  isPlayingVoice.value = false;
}

function close() {
  isEditingText.value = false;
  stopMusicPreview();
  stopVoicePreview();
  emit("close");
}

function startEditingText() {
  if (selectedSegmentIndex.value === null) return;
  editingTextValue.value =
    localSegments.value[selectedSegmentIndex.value].text || "";
  isEditingText.value = true;
}

function saveTextEdit() {
  if (selectedSegmentIndex.value === null) return;
  localSegments.value[selectedSegmentIndex.value].text = editingTextValue.value;
  isEditingText.value = false;
}

function cancelTextEdit() {
  isEditingText.value = false;
  editingTextValue.value = "";
}

async function saveAndRender() {
  // Проверяем, изменился ли голос (нужна перегенерация аудио)
  const voiceChanged =
    selectedVoiceConfigId.value !== (props.video?.voiceConfigId || null);

  emit("save", {
    segments: localSegments.value,
    voiceConfigId: selectedVoiceConfigId.value || null,
    backgroundMusicFilename: selectedBackgroundMusic.value || null,
    regenerateAudio: voiceChanged,
  });
  close();
}

async function approveAndContinue() {
  emit("approve", {
    segments: localSegments.value,
    backgroundMusicFilename: selectedBackgroundMusic.value || null,
    voiceConfigId: selectedVoiceConfigId.value || null,
  });
  close();
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />

    <!-- Modal -->
    <div
      class="relative bg-gray-900 rounded-2xl w-[95vw] h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-800"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-white">
            {{
              isReviewMode
                ? "Проверка и одобрение"
                : "Редактирование видео-фонов"
            }}
          </h2>
          <span
            v-if="hasDraft"
            class="flex items-center gap-2 px-2 py-0.5 bg-yellow-600/20 border border-yellow-600/50 rounded-lg text-xs text-yellow-400"
            title="Есть несохранённые изменения из предыдущей сессии"
          >
            📝 Восстановлено
            <button
              @click="discardDraft"
              class="hover:text-yellow-200 underline"
              title="Сбросить и загрузить оригинал"
            >
              Сбросить
            </button>
          </span>
        </div>
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
                : !segmentVideoRequirements[index]?.isEnough
                  ? 'bg-red-900/30 border border-red-500/50 text-gray-300 hover:bg-red-900/50'
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
                <p
                  v-if="!segmentVideoRequirements[index]?.isEnough"
                  class="text-xs text-red-400"
                >
                  +{{ segmentVideoRequirements[index]?.missing }} видео
                </p>
              </div>
              <span
                v-if="segmentVideoRequirements[index]?.isEnough"
                class="text-green-400 text-md"
              >
                ✓
              </span>
              <span v-else class="text-red-400 text-md">⚠</span>
            </div>
          </button>
        </div>

        <!-- Video Search -->
        <div
          v-if="selectedSegmentIndex !== null"
          class="grid grid-cols-[auto_1fr] overflow-auto"
        >
          <!-- Current Video Preview -->
          <div
            class="flex flex-col w-[340px] h-full border-r border-gray-800 overflow-y-auto"
          >
            <!-- Text -->
            <div class="flex flex-col p-4 pb-0">
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

              <!-- Estimated Duration -->
              <p class="text-xs text-gray-500 mt-2">
                ⏱ ~{{
                  localSegments[selectedSegmentIndex]?.estimatedDuration || "?"
                }}
                сек
              </p>
            </div>

            <!-- Multiple Videos Preview -->
            <div class="flex flex-col gap-2 p-4 pb-0">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-400">Видео фоны</h3>
                <div class="flex items-center gap-2">
                  <span
                    v-if="
                      currentSegmentRequirement &&
                      !currentSegmentRequirement.isEnough
                    "
                    class="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded"
                  >
                    нужно мин.
                    {{ currentSegmentRequirement.requiredVideos }} видео
                  </span>
                  <span
                    :class="[
                      'text-xs px-2 py-0.5 rounded',
                      currentSegmentRequirement?.isEnough
                        ? 'text-green-400 bg-green-500/20'
                        : 'text-gray-500',
                    ]"
                  >
                    {{ currentSegmentVideos.length }} /
                    {{ currentSegmentRequirement?.requiredVideos || "?" }}
                  </span>
                </div>
              </div>

              <!-- Max clip duration hint -->
              <p class="text-xs text-gray-500">
                📎 Шаблон: макс. {{ maxClipDuration }} сек на клип
              </p>

              <!-- Video List with Drag & Drop -->
              <draggable
                v-if="currentSegmentVideos.length > 0"
                v-model="currentSegmentVideosList"
                item-key="id"
                handle=".drag-handle"
                ghost-class="opacity-50"
                animation="200"
                class="space-y-2"
              >
                <template #item="{ element: video, index: vIdx }">
                  <div
                    class="relative rounded-xl overflow-hidden bg-gray-800 group"
                  >
                    <div class="flex gap-2">
                      <!-- Video thumbnail -->
                      <div class="relative w-20 h-24 flex-shrink-0">
                        <video
                          :src="video.url"
                          class="w-full h-full object-cover"
                          muted
                          loop
                          playsinline
                          @mouseenter="
                            ($event.target as HTMLVideoElement)
                              .play()
                              .catch(() => {})
                          "
                          @mouseleave="
                            ($event.target as HTMLVideoElement).pause()
                          "
                        />
                      </div>

                      <!-- Video info & controls -->
                      <div
                        class="flex-1 py-1 pr-2 flex flex-col justify-between"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-gray-400">
                            Видео: {{ video.duration }} сек.
                          </span>

                          <div class="flex items-center gap-2">
                            <!-- Remove video -->
                            <button
                              @click="removeVideoFromSegment(vIdx)"
                              class="p-1.5 bg-red-600/20 hover:bg-red-600 rounded-lg transition-colors group"
                              title="Удалить видео"
                            >
                              <Trash2
                                class="w-4 h-4 text-red-400 group-hover:text-white"
                              />
                            </button>

                            <!-- Drag handle -->
                            <button
                              class="drag-handle p-1.5 bg-gray-700/20 hover:bg-gray-700 cursor-grab active:cursor-grabbing rounded-lg transition-colors group"
                              title="Переместить видео"
                            >
                              <GripVertical class="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        <!-- Percent slider -->
                        <div class="flex items-center gap-2 pr-2">
                          <input
                            type="range"
                            :value="video.percent"
                            @input="updateVideoPercent(vIdx, $event)"
                            min="10"
                            max="100"
                            class="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                          <span class="text-xs text-primary-400 w-8 text-right">
                            {{ video.percent }}%
                          </span>
                        </div>

                        <!-- Approx seconds -->
                        <span class="text-xs text-gray-500">
                          Будет показано: ~{{ getVideoSeconds(video.percent) }}
                          сек.
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>

              <!-- Empty state -->
              <div
                v-else
                class="rounded-xl bg-gray-800 aspect-[9/16] w-full flex items-center justify-center text-gray-500 text-sm"
              >
                Нет видео<br />Выберите справа →
              </div>
            </div>

            <!-- Total percent indicator -->
            <div
              v-if="currentSegmentVideos.length > 0"
              class="flex items-center justify-between text-xs sticky bottom-0 bg-gray-900 p-4"
            >
              <span class="text-gray-500">Всего:</span>
              <span
                :class="
                  totalPercent === 100 ? 'text-green-400' : 'text-yellow-400'
                "
              >
                {{ totalPercent }}%
                <span v-if="totalPercent !== 100" class="text-yellow-400"
                  >(должно быть 100%)</span
                >
              </span>
            </div>
          </div>

          <!-- Search -->
          <div class="space-y-3 p-4 overflow-y-auto">
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
              💡 Klipy — клипы из фильмов и мемы. Фильтр ориентации недоступен.
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
                    @mouseenter="
                      ($event.target as HTMLVideoElement).play().catch(() => {})
                    "
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
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between p-4 border-t border-gray-800"
      >
        <div class="flex items-center gap-4">
          <!-- <p class="text-sm text-gray-400">Изменено: {{ changedCount }}</p> -->

          <!-- Background music selector (only in review mode) -->
          <div v-if="isReviewMode" class="flex items-center gap-2">
            <Music class="w-4 h-4 text-gray-400" />

            <!-- Current selected music display -->
            <div
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg min-w-[200px] cursor-pointer"
              @click="isMusicModalOpen = true"
            >
              <span
                v-if="selectedMusicTrack"
                class="text-sm text-white truncate max-w-[180px]"
              >
                {{ selectedMusicTrack.name }}
              </span>
              <span v-else class="text-sm text-gray-500">Без музыки</span>
            </div>

            <!-- Open music library button -->
            <!-- <button
              @click="isMusicModalOpen = true"
              class="p-1.5 bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors"
              title="Открыть библиотеку музыки"
            >
              <Library class="w-4 h-4 text-white" />
            </button> -->

            <!-- Play/Stop button -->
            <button
              v-if="selectedMusicTrack"
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

            <!-- Clear music button -->
            <button
              v-if="selectedMusicTrack"
              @click="clearMusicSelection"
              class="p-1.5 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors"
              title="Убрать музыку"
            >
              <X class="w-4 h-4 text-gray-300" />
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

            <!-- Divider -->
            <div class="w-px h-6 bg-gray-700 mx-2"></div>

            <!-- Template selector -->
            <Palette class="w-4 h-4 text-pink-400" />
            <select
              v-model="selectedTemplateId"
              class="px-3 py-1.5 bg-gray-800 border border-pink-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-[180px]"
            >
              <option :value="null">Без шаблона</option>
              <option
                v-for="template in templatesList"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }} ({{ template.maxClipDuration || 3 }}с)
                <template v-if="template.isDefault"> ⭐</template>
              </option>
            </select>

            <!-- Warning if segments missing videos -->
            <span
              v-if="segmentsWithMissingVideos.length > 0"
              class="flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded"
              :title="`Сегменты с нехваткой видео: ${segmentsWithMissingVideos.map((s) => s.index + 1).join(', ')}`"
            >
              ⚠ {{ segmentsWithMissingVideos.length }} сегм. без видео
            </span>

            <!-- Divider -->
            <div class="w-px h-6 bg-gray-700 mx-2"></div>

            <!-- Loop toggle -->
            <label
              class="flex items-center gap-2 cursor-pointer select-none"
              title="Бесшовный цикл видео без паузы между концом и началом"
            >
              <Repeat class="w-4 h-4 text-cyan-400" />
              <span class="text-sm text-gray-300">Loop</span>
              <div
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="isLoopEnabled ? 'bg-cyan-600' : 'bg-gray-600'"
                @click="isLoopEnabled = !isLoopEnabled"
              >
                <div
                  class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  :class="{ 'translate-x-5': isLoopEnabled }"
                ></div>
              </div>
            </label>
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

  <!-- Music Selector Modal -->
  <MusicSelectorModal
    :is-open="isMusicModalOpen"
    :current-music="selectedMusicTrack"
    @close="isMusicModalOpen = false"
    @select="handleMusicSelect"
  />
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
  Library,
  GripVertical,
  Palette,
  Repeat,
} from "lucide-vue-next";
import draggable from "vuedraggable";
import api, { templatesApi } from "../api";
import MusicSelectorModal from "./MusicSelectorModal.vue";

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
  id: string;
  name: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number;
  audioUrl: string;
  downloadUrl: string;
  imageUrl: string;
  pageUrl: string;
  genres?: string[];
  moods?: string[];
  speed?: string;
  isInstrumental?: boolean;
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
}>();

const emit = defineEmits(["close", "save", "approve"]);

// LocalStorage key для автосохранения
const getStorageKey = (videoId: string) => `video-editor-draft-${videoId}`;

interface DraftData {
  segments: any[];
  selectedMusicTrack: MusicTrack | null;
  selectedVoiceConfigId: string;
  selectedTemplateId: string | null;
  savedAt: number;
}

function saveDraft() {
  if (!props.video?.id) return;

  const draft: DraftData = {
    segments: localSegments.value,
    selectedMusicTrack: selectedMusicTrack.value,
    selectedVoiceConfigId: selectedVoiceConfigId.value,
    selectedTemplateId: selectedTemplateId.value,
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(getStorageKey(props.video.id), JSON.stringify(draft));
    console.log("[AutoSave] Draft saved for video:", props.video.id);
  } catch (e) {
    console.error("[AutoSave] Failed to save draft:", e);
  }
}

function loadDraft(): DraftData | null {
  if (!props.video?.id) return null;

  try {
    const data = localStorage.getItem(getStorageKey(props.video.id));
    if (data) {
      const draft = JSON.parse(data) as DraftData;
      console.log(
        "[AutoSave] Draft loaded for video:",
        props.video.id,
        "saved at:",
        new Date(draft.savedAt).toLocaleString(),
      );
      return draft;
    }
  } catch (e) {
    console.error("[AutoSave] Failed to load draft:", e);
  }
  return null;
}

function clearDraft() {
  if (!props.video?.id) return;

  try {
    localStorage.removeItem(getStorageKey(props.video.id));
    console.log("[AutoSave] Draft cleared for video:", props.video.id);
  } catch (e) {
    console.error("[AutoSave] Failed to clear draft:", e);
  }
}

// Сбросить черновик и загрузить оригинальные данные
function discardDraft() {
  if (!props.video) return;

  clearDraft();
  hasDraft.value = false;

  // Восстанавливаем данные из видео
  const segments =
    typeof props.video.segments === "string"
      ? JSON.parse(props.video.segments)
      : props.video.segments;
  localSegments.value = JSON.parse(JSON.stringify(segments));

  // Восстанавливаем музыку
  if (props.video.backgroundMusicData) {
    try {
      const musicData =
        typeof props.video.backgroundMusicData === "string"
          ? JSON.parse(props.video.backgroundMusicData)
          : props.video.backgroundMusicData;
      selectedMusicTrack.value = musicData;
    } catch (e) {
      selectedMusicTrack.value = null;
    }
  } else {
    selectedMusicTrack.value = null;
  }

  // Восстанавливаем голос
  if (props.video?.voiceConfigId) {
    selectedVoiceConfigId.value = props.video.voiceConfigId;
  } else {
    const defaultVoice = voiceConfigList.value.find((v) => v.isDefault);
    selectedVoiceConfigId.value = defaultVoice?.id || "";
  }

  // Восстанавливаем шаблон
  if (props.video?.templateId) {
    selectedTemplateId.value = props.video.templateId;
  } else {
    const defaultTemplate = templatesList.value.find((t) => t.isDefault);
    selectedTemplateId.value = defaultTemplate?.id || null;
  }

  console.log("[AutoSave] Draft discarded, original data restored");
}

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
const hasDraft = ref(false); // Индикатор восстановленного черновика

// Фоновая музыка
const selectedMusicTrack = ref<MusicTrack | null>(null);
const isMusicModalOpen = ref(false);
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

// Шаблоны
interface Template {
  id: string;
  name: string;
  isDefault: boolean;
  maxClipDuration: number;
}
const templatesList = ref<Template[]>([]);
const selectedTemplateId = ref<string | null>(null);

// Loop mode (бесшовный цикл видео)
const isLoopEnabled = ref(false);

// Computed: текущий шаблон
const currentTemplate = computed(() => {
  if (!selectedTemplateId.value) return null;
  return (
    templatesList.value.find((t) => t.id === selectedTemplateId.value) || null
  );
});

// Computed: максимальная длительность клипа из шаблона
const maxClipDuration = computed(
  () => currentTemplate.value?.maxClipDuration ?? 3,
);

// Computed: требования по видео для каждого сегмента
const segmentVideoRequirements = computed(() => {
  return localSegments.value.map((segment, index) => {
    const duration = segment.estimatedDuration || segment.audioDuration || 5;
    const requiredVideos = Math.ceil(duration / maxClipDuration.value);
    const currentVideos =
      segment.stockVideos?.length || (segment.stockVideo?.url ? 1 : 0);
    const isEnough = currentVideos >= requiredVideos;
    const missing = requiredVideos - currentVideos;

    return {
      index,
      type: segment.type,
      duration,
      requiredVideos,
      currentVideos,
      isEnough,
      missing: missing > 0 ? missing : 0,
    };
  });
});

// Computed: есть ли сегменты с нехваткой видео
const segmentsWithMissingVideos = computed(() => {
  return segmentVideoRequirements.value.filter((req) => !req.isEnough);
});

// Computed: требования для текущего сегмента
const currentSegmentRequirement = computed(() => {
  if (selectedSegmentIndex.value === null) return null;
  return segmentVideoRequirements.value[selectedSegmentIndex.value] || null;
});

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
  () => currentSourceResults.value.hasSearched,
);

// Computed для работы с несколькими видео
const currentSegmentVideos = computed(() => {
  if (selectedSegmentIndex.value === null) return [];
  const segment = localSegments.value[selectedSegmentIndex.value];
  // Поддержка нового формата stockVideos и старого stockVideo
  if (segment?.stockVideos && segment.stockVideos.length > 0) {
    return segment.stockVideos;
  }
  // Обратная совместимость со старым форматом
  if (segment?.stockVideo) {
    return [{ ...segment.stockVideo, percent: 100 }];
  }
  return [];
});

// Writable computed для vuedraggable v-model
const currentSegmentVideosList = computed({
  get() {
    return currentSegmentVideos.value;
  },
  set(newList: any[]) {
    if (selectedSegmentIndex.value === null) return;
    const segment = localSegments.value[selectedSegmentIndex.value];
    segment.stockVideos = newList;
    // Обновляем stockVideo для обратной совместимости
    segment.stockVideo = newList.length > 0 ? newList[0] : null;
  },
});

const totalPercent = computed(() => {
  return currentSegmentVideos.value.reduce(
    (sum, v) => sum + (v.percent || 0),
    0,
  );
});

// Функция для получения примерных секунд по проценту
function getVideoSeconds(percent: number): string {
  if (selectedSegmentIndex.value === null) return "?";
  const segment = localSegments.value[selectedSegmentIndex.value];
  const duration = segment?.estimatedDuration || segment?.audioDuration || 5;
  return ((duration * percent) / 100).toFixed(1);
}

// Обновить процент видео
function updateVideoPercent(videoIndex: number, event: Event) {
  if (selectedSegmentIndex.value === null) return;
  const target = event.target as HTMLInputElement;
  const newPercent = parseInt(target.value);

  const segment = localSegments.value[selectedSegmentIndex.value];
  if (!segment.stockVideos) {
    // Миграция старого формата
    segment.stockVideos = segment.stockVideo
      ? [{ ...segment.stockVideo, percent: 100 }]
      : [];
  }

  if (segment.stockVideos[videoIndex]) {
    segment.stockVideos[videoIndex].percent = newPercent;

    // Автоматически перераспределяем остаток на последнее видео
    if (segment.stockVideos.length > 1) {
      const total = segment.stockVideos.reduce(
        (sum: number, v: any, i: number) =>
          i === segment.stockVideos.length - 1 ? sum : sum + v.percent,
        0,
      );
      segment.stockVideos[segment.stockVideos.length - 1].percent = Math.max(
        10,
        100 - total,
      );
    }
  }
}

// Удалить видео из сегмента
function removeVideoFromSegment(videoIndex: number) {
  if (selectedSegmentIndex.value === null) return;

  const segment = localSegments.value[selectedSegmentIndex.value];
  if (!segment.stockVideos) return;

  segment.stockVideos.splice(videoIndex, 1);

  // Если осталось одно видео, даём ему 100%
  if (segment.stockVideos.length === 1) {
    segment.stockVideos[0].percent = 100;
  }
  // Если удалили все, обнуляем и stockVideo
  if (segment.stockVideos.length === 0) {
    segment.stockVideo = null;
  } else {
    // Обновляем stockVideo для обратной совместимости
    segment.stockVideo = segment.stockVideos[0];
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.video?.segments) {
      const segments =
        typeof props.video.segments === "string"
          ? JSON.parse(props.video.segments)
          : props.video.segments;

      // Проверяем есть ли сохранённый черновик
      const draft = loadDraft();
      hasDraft.value = !!draft; // Показываем индикатор восстановления

      if (draft) {
        // Восстанавливаем данные из черновика
        localSegments.value = draft.segments;
        selectedMusicTrack.value = draft.selectedMusicTrack;
        // Голос и шаблон восстановим после загрузки списков
        console.log(
          "[AutoSave] Restored draft from",
          new Date(draft.savedAt).toLocaleString(),
        );
      } else {
        // Загружаем данные из видео
        localSegments.value = JSON.parse(JSON.stringify(segments));

        // Устанавливаем текущую фоновую музыку из backgroundMusicData
        if (props.video.backgroundMusicData) {
          try {
            const musicData =
              typeof props.video.backgroundMusicData === "string"
                ? JSON.parse(props.video.backgroundMusicData)
                : props.video.backgroundMusicData;
            selectedMusicTrack.value = musicData;
          } catch (e) {
            console.error("Failed to parse background music data:", e);
            selectedMusicTrack.value = null;
          }
        } else {
          selectedMusicTrack.value = null;
        }
      }

      originalSegments.value = JSON.parse(JSON.stringify(segments));
      selectedSegmentIndex.value = null;
      searchQuery.value = "";
      isEditingText.value = false;
      editingTextValue.value = "";

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

      // Загружаем список голосов если в режиме review
      if (props.isReviewMode) {
        isLoadingVoices.value = true;
        try {
          const response = await api.get("/voices");
          voiceConfigList.value = response.data.voices || [];

          // Восстанавливаем голос из черновика или устанавливаем из видео
          if (draft?.selectedVoiceConfigId) {
            selectedVoiceConfigId.value = draft.selectedVoiceConfigId;
          } else if (props.video?.voiceConfigId) {
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

        // Загружаем список шаблонов
        try {
          const response = await templatesApi.getAll();
          templatesList.value = response.data.templates || [];

          // Восстанавливаем шаблон из черновика или устанавливаем из видео
          if (draft?.selectedTemplateId !== undefined) {
            selectedTemplateId.value = draft.selectedTemplateId;
          } else if (props.video?.templateId) {
            selectedTemplateId.value = props.video.templateId;
          } else {
            const defaultTemplate = templatesList.value.find(
              (t) => t.isDefault,
            );
            selectedTemplateId.value = defaultTemplate?.id || null;
          }
        } catch (e) {
          console.error("Failed to load templates:", e);
        }

        // Устанавливаем режим loop из видео
        isLoopEnabled.value = props.video?.useLoopScript || false;
      }
    }
  },
);

// Автосохранение при изменении данных
watch(
  () => localSegments.value,
  () => {
    if (props.isOpen) saveDraft();
  },
  { deep: true },
);

watch(
  () => selectedMusicTrack.value,
  () => {
    if (props.isOpen) saveDraft();
  },
);

watch(
  () => selectedVoiceConfigId.value,
  () => {
    if (props.isOpen) saveDraft();
  },
);

watch(
  () => selectedTemplateId.value,
  () => {
    if (props.isOpen) saveDraft();
  },
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

  const segment = localSegments.value[selectedSegmentIndex.value];

  // Инициализируем stockVideos если нужно
  if (!segment.stockVideos) {
    segment.stockVideos = segment.stockVideo
      ? [{ ...segment.stockVideo, percent: 100 }]
      : [];
  }

  const newVideo = {
    id: video.id,
    url: video.url,
    width: video.width,
    height: video.height,
    duration: video.duration,
    photographer: video.photographer,
    isVertical: video.isVertical,
    percent: 100, // Начальный процент
  };

  // Добавляем видео в массив
  segment.stockVideos.push(newVideo);

  // Перераспределяем проценты равномерно
  const count = segment.stockVideos.length;
  const basePercent = Math.floor(100 / count);
  const remainder = 100 - basePercent * count;

  segment.stockVideos.forEach((v: any, i: number) => {
    v.percent = basePercent + (i === count - 1 ? remainder : 0);
  });

  // Обновляем stockVideo для обратной совместимости (первое видео)
  segment.stockVideo = segment.stockVideos[0];
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
    // Воспроизвести выбранный трек (поддержка старого формата url и нового audioUrl)
    const audioUrl =
      selectedMusicTrack.value?.audioUrl ||
      selectedMusicTrack.value?.url ||
      selectedMusicTrack.value?.audio;

    if (audioUrl) {
      audioPlayer.value = new Audio(audioUrl);
      audioPlayer.value.volume = 0.5;
      audioPlayer.value.play().catch((err) => {
        console.error("[Music Preview] Play error:", err);
      });
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

function handleMusicSelect(track: MusicTrack) {
  selectedMusicTrack.value = track;
  isMusicModalOpen.value = false;
  // Останавливаем воспроизведение если играло
  stopMusicPreview();
}

function clearMusicSelection() {
  selectedMusicTrack.value = null;
  stopMusicPreview();
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
      (v) => v.id === selectedVoiceConfigId.value,
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
        voiceAudioPlayer.value.play().catch(() => {});
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

  // Очищаем черновик перед сохранением
  clearDraft();

  emit("save", {
    segments: localSegments.value,
    voiceConfigId: selectedVoiceConfigId.value || null,
    backgroundMusicData: selectedMusicTrack.value || null,
    regenerateAudio: voiceChanged,
    templateId: selectedTemplateId.value || null,
    useLoopScript: isLoopEnabled.value,
  });
  close();
}

async function approveAndContinue() {
  // Очищаем черновик при одобрении
  clearDraft();

  emit("approve", {
    segments: localSegments.value,
    backgroundMusicData: selectedMusicTrack.value || null,
    voiceConfigId: selectedVoiceConfigId.value || null,
    templateId: selectedTemplateId.value || null,
    useLoopScript: isLoopEnabled.value,
  });
  close();
}

// Lifecycle hooks
onMounted(() => {
  // Очистка аудио при размонтировании компонента
  window.addEventListener("beforeunload", () => {
    stopMusicPreview();
    stopVoicePreview();
  });

  // Автоматически выбираем первый сегмент при открытии
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen && localSegments.value.length > 0) {
        selectedSegmentIndex.value = 0;
      }
    },
  );
});
</script>

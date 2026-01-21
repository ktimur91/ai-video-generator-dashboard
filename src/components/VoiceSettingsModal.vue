<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <!-- Modal -->
      <div
        class="relative w-full max-w-5xl h-[90vh] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-800"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-500/20 rounded-lg">
              <Mic class="w-5 h-5 text-purple-400" />
            </div>
            <h2 class="text-xl font-bold text-white">Настройки голосов</h2>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Left: Voice List -->
          <div class="w-80 border-r border-gray-800 flex flex-col">
            <div class="p-4 border-b border-gray-800">
              <button
                @click="createNewVoice"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
              >
                <Plus class="w-4 h-4" />
                Создать голос
              </button>
            </div>

            <!-- Voice List -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
              <div
                v-for="voice in voices"
                :key="voice.id"
                @click="selectVoice(voice)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-all border',
                  selectedVoice?.id === voice.id
                    ? 'bg-purple-600/20 border-purple-500/50'
                    : 'bg-gray-800/50 border-transparent hover:bg-gray-800',
                ]"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-white">{{ voice.name }}</span>
                  <div class="flex items-center gap-1">
                    <span
                      v-if="voice.isDefault"
                      class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full"
                    >
                      Основной
                    </span>
                  </div>
                </div>
                <div class="text-sm text-gray-400">
                  {{ getVoiceDisplayName(voice.voice) }}
                </div>
                <div class="mt-1 flex gap-2 text-xs text-gray-500">
                  <span>{{ voice.rate }}</span>
                  <span>{{ voice.pitch }}</span>
                </div>
              </div>

              <div
                v-if="voices.length === 0 && !isLoading"
                class="text-center py-8 text-gray-500"
              >
                <Mic class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет созданных голосов</p>
                <p class="text-sm">Создайте первый голос</p>
              </div>
            </div>
          </div>

          <!-- Right: Voice Editor -->
          <div class="flex-1 flex flex-col overflow-y-auto">
            <div v-if="editingVoice" class="p-6 space-y-6">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Название голоса
                </label>
                <input
                  v-model="editingVoice.name"
                  type="text"
                  placeholder="Например: Энергичный Дмитрий"
                  class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>

              <!-- Voice Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Голос TTS
                </label>
                <select
                  v-model="editingVoice.voice"
                  class="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  <optgroup label="🇷🇺 Русские">
                    <option
                      v-for="v in availableVoices.filter(
                        (v) => v.lang === 'ru-RU',
                      )"
                      :key="v.id"
                      :value="v.id"
                    >
                      {{ v.name }} ({{ v.gender === "male" ? "♂" : "♀" }})
                    </option>
                  </optgroup>
                  <optgroup label="🇺🇸 Английские (US)">
                    <option
                      v-for="v in availableVoices.filter(
                        (v) => v.lang === 'en-US',
                      )"
                      :key="v.id"
                      :value="v.id"
                    >
                      {{ v.name }} ({{ v.gender === "male" ? "♂" : "♀" }})
                    </option>
                  </optgroup>
                  <optgroup label="🇬🇧 Английские (UK)">
                    <option
                      v-for="v in availableVoices.filter(
                        (v) => v.lang === 'en-GB',
                      )"
                      :key="v.id"
                      :value="v.id"
                    >
                      {{ v.name }} ({{ v.gender === "male" ? "♂" : "♀" }})
                    </option>
                  </optgroup>
                  <optgroup label="🇺🇦 Украинские">
                    <option
                      v-for="v in availableVoices.filter(
                        (v) => v.lang === 'uk-UA',
                      )"
                      :key="v.id"
                      :value="v.id"
                    >
                      {{ v.name }} ({{ v.gender === "male" ? "♂" : "♀" }})
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Rate Slider -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-300">
                    Скорость речи
                  </label>
                  <span class="text-sm text-purple-400 font-mono">
                    {{ editingVoice.rate }}
                  </span>
                </div>
                <input
                  type="range"
                  :value="parseRate(editingVoice.rate)"
                  @input="editingVoice.rate = formatRate($event.target.value)"
                  min="-50"
                  max="100"
                  step="5"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Медленно</span>
                  <span>Нормально</span>
                  <span>Быстро</span>
                </div>
              </div>

              <!-- Pitch Slider -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-300">
                    Высота голоса
                  </label>
                  <span class="text-sm text-purple-400 font-mono">
                    {{ editingVoice.pitch }}
                  </span>
                </div>
                <input
                  type="range"
                  :value="parsePitch(editingVoice.pitch)"
                  @input="editingVoice.pitch = formatPitch($event.target.value)"
                  min="-50"
                  max="50"
                  step="5"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Низкий</span>
                  <span>Нормальный</span>
                  <span>Высокий</span>
                </div>
              </div>

              <!-- Volume Slider -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-300">
                    Громкость
                  </label>
                  <span class="text-sm text-purple-400 font-mono">
                    {{ editingVoice.volume }}
                  </span>
                </div>
                <input
                  type="range"
                  :value="parseVolume(editingVoice.volume)"
                  @input="
                    editingVoice.volume = formatVolume($event.target.value)
                  "
                  min="-50"
                  max="50"
                  step="5"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Тихо</span>
                  <span>Нормально</span>
                  <span>Громко</span>
                </div>
              </div>

              <!-- Preview Section -->
              <div class="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Превью голоса
                </label>
                <textarea
                  v-model="previewText"
                  rows="2"
                  placeholder="Введите текст для прослушивания..."
                  class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 outline-none resize-none mb-3"
                ></textarea>
                <div class="flex items-center gap-3">
                  <button
                    @click="playPreview"
                    :disabled="isGeneratingPreview || !previewText.trim()"
                    class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Loader2
                      v-if="isGeneratingPreview"
                      class="w-4 h-4 animate-spin"
                    />
                    <Play v-else class="w-4 h-4" />
                    {{ isGeneratingPreview ? "Генерация..." : "Прослушать" }}
                  </button>
                  <button
                    v-if="isPlayingPreview"
                    @click="stopPreview"
                    class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <Square class="w-4 h-4" />
                    Стоп
                  </button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div
                class="flex items-center justify-between pt-4 border-t border-gray-800"
              >
                <div class="flex items-center gap-3">
                  <button
                    v-if="!editingVoice.isNew && !editingVoice.isDefault"
                    @click="setAsDefault"
                    class="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg font-medium transition-colors"
                  >
                    <Star class="w-4 h-4" />
                    Сделать основным
                  </button>
                  <button
                    v-if="!editingVoice.isNew"
                    @click="deleteVoice"
                    class="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                    Удалить
                  </button>
                </div>
                <button
                  @click="saveVoice"
                  :disabled="!editingVoice.name?.trim() || isSaving"
                  class="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  {{ editingVoice.isNew ? "Создать" : "Сохранить" }}
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="flex-1 flex items-center justify-center text-gray-500"
            >
              <div class="text-center">
                <Settings class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Выберите голос для редактирования</p>
                <p class="text-sm">или создайте новый</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Hidden Audio Player -->
  <audio ref="audioPlayer" @ended="isPlayingPreview = false"></audio>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  X,
  Mic,
  Plus,
  Play,
  Square,
  Save,
  Trash2,
  Star,
  Settings,
  Loader2,
} from "lucide-vue-next";
import api from "../api";
import {
  useModalStack,
  initModalEscapeHandler,
} from "../composables/useModalStack";

interface VoiceConfig {
  id?: string;
  name: string;
  voice: string;
  rate: string;
  pitch: string;
  volume: string;
  isDefault: boolean;
  isNew?: boolean;
}

interface AvailableVoice {
  id: string;
  name: string;
  lang: string;
  gender: string;
}

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

// Регистрация в стеке модалок для закрытия по Esc
initModalEscapeHandler();
const { register, unregister } = useModalStack(() => emit("close"));

const voices = ref<VoiceConfig[]>([]);
const availableVoices = ref<AvailableVoice[]>([]);
const selectedVoice = ref<VoiceConfig | null>(null);
const editingVoice = ref<VoiceConfig | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isGeneratingPreview = ref(false);
const isPlayingPreview = ref(false);
const previewText = ref("Привет! Это тестовое сообщение для проверки голоса.");
const audioPlayer = ref<HTMLAudioElement | null>(null);

// Load voices when modal opens + регистрация в стеке
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      register();
      await loadVoices();
    } else {
      unregister();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  unregister();
});

async function loadVoices() {
  isLoading.value = true;
  try {
    const response = await api.get("/voices");
    voices.value = response.data.voices || [];
    availableVoices.value = response.data.availableVoices || [];
  } catch (error) {
    console.error("Failed to load voices:", error);
  } finally {
    isLoading.value = false;
  }
}

function createNewVoice() {
  editingVoice.value = {
    name: "",
    voice: "ru-RU-DmitryNeural",
    rate: "+0%",
    pitch: "+0Hz",
    volume: "+0%",
    isDefault: false,
    isNew: true,
  };
  selectedVoice.value = null;
}

function selectVoice(voice: VoiceConfig) {
  selectedVoice.value = voice;
  editingVoice.value = { ...voice };
}

async function saveVoice() {
  if (!editingVoice.value || !editingVoice.value.name?.trim()) return;

  isSaving.value = true;
  try {
    if (editingVoice.value.isNew) {
      // Create new voice
      await api.post("/voices", {
        name: editingVoice.value.name,
        voice: editingVoice.value.voice,
        rate: editingVoice.value.rate,
        pitch: editingVoice.value.pitch,
        volume: editingVoice.value.volume,
        isDefault: editingVoice.value.isDefault,
      });
    } else {
      // Update existing voice
      await api.put(`/voices/${editingVoice.value.id}`, {
        name: editingVoice.value.name,
        voice: editingVoice.value.voice,
        rate: editingVoice.value.rate,
        pitch: editingVoice.value.pitch,
        volume: editingVoice.value.volume,
      });
    }

    await loadVoices();
    editingVoice.value = null;
    selectedVoice.value = null;
  } catch (error) {
    console.error("Failed to save voice:", error);
  } finally {
    isSaving.value = false;
  }
}

async function deleteVoice() {
  if (!editingVoice.value?.id) return;

  if (!confirm(`Удалить голос "${editingVoice.value.name}"?`)) return;

  try {
    await api.delete(`/voices/${editingVoice.value.id}`);
    await loadVoices();
    editingVoice.value = null;
    selectedVoice.value = null;
  } catch (error) {
    console.error("Failed to delete voice:", error);
  }
}

async function setAsDefault() {
  if (!editingVoice.value?.id) return;

  try {
    await api.post(`/voices/${editingVoice.value.id}/set-default`);
    await loadVoices();

    // Update editing voice
    if (editingVoice.value) {
      editingVoice.value.isDefault = true;
    }
  } catch (error) {
    console.error("Failed to set default voice:", error);
  }
}

async function playPreview() {
  if (!editingVoice.value || !previewText.value.trim()) return;

  isGeneratingPreview.value = true;
  try {
    const response = await api.post("/voices/preview", {
      text: previewText.value,
      voice: editingVoice.value.voice,
      rate: editingVoice.value.rate,
      pitch: editingVoice.value.pitch,
      volume: editingVoice.value.volume,
    });

    if (response.data.url && audioPlayer.value) {
      // Add base URL
      const audioUrl = `http://localhost:3001${response.data.url}`;
      audioPlayer.value.src = audioUrl;
      audioPlayer.value.play();
      isPlayingPreview.value = true;
    }
  } catch (error) {
    console.error("Failed to generate preview:", error);
  } finally {
    isGeneratingPreview.value = false;
  }
}

function stopPreview() {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
  }
  isPlayingPreview.value = false;
}

function getVoiceDisplayName(voiceId: string): string {
  const voice = availableVoices.value.find((v) => v.id === voiceId);
  return voice ? `${voice.name} (${voice.lang})` : voiceId;
}

// Helpers for sliders
function parseRate(rate: string): number {
  return parseInt(rate.replace("%", "").replace("+", "")) || 0;
}

function formatRate(value: string | number): string {
  const num = parseInt(String(value));
  return num >= 0 ? `+${num}%` : `${num}%`;
}

function parsePitch(pitch: string): number {
  return parseInt(pitch.replace("Hz", "").replace("+", "")) || 0;
}

function formatPitch(value: string | number): string {
  const num = parseInt(String(value));
  return num >= 0 ? `+${num}Hz` : `${num}Hz`;
}

function parseVolume(volume: string): number {
  return parseInt(volume.replace("%", "").replace("+", "")) || 0;
}

function formatVolume(value: string | number): string {
  const num = parseInt(String(value));
  return num >= 0 ? `+${num}%` : `${num}%`;
}
</script>

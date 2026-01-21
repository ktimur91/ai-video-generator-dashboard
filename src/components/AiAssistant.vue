<template>
  <div class="ai-assistant relative">
    <!-- Toggle Button -->
    <button
      @click="isExpanded = !isExpanded"
      class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/25"
    >
      <Sparkles class="w-4 h-4" />
      <span>AI помощник</span>
      <ChevronDown
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isExpanded"
        class="absolute z-50 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl overflow-hidden flex flex-col"
        :class="[size === 'small' ? 'w-80' : 'w-96', dropdownPositionClasses]"
        :style="{ maxHeight: maxHeight }"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700"
        >
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-purple-400" />
            <span class="text-sm font-medium text-white">AI помощник</span>
            <span
              v-if="mode === 'segment'"
              class="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded"
            >
              Сегмент
            </span>
            <span
              v-else
              class="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded"
            >
              Видео
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="messages.length > 0"
              @click="clearChat"
              class="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
              title="Очистить чат"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button
              @click="isExpanded = false"
              class="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-3 space-y-3"
          :style="{ minHeight: '120px', maxHeight: '300px' }"
        >
          <!-- Empty state -->
          <div
            v-if="messages.length === 0"
            class="text-center py-4 text-gray-400"
          >
            <Sparkles class="w-8 h-8 mx-auto mb-2 text-purple-400/50" />
            <p class="text-sm">{{ emptyStateText }}</p>
            <div class="mt-3 space-y-1.5">
              <button
                v-for="(hint, i) in hints"
                :key="i"
                @click="sendMessage(hint)"
                class="block w-full text-left px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {{ hint }}
              </button>
            </div>
          </div>

          <!-- Messages list -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'rounded-xl px-3 py-2 text-sm',
              msg.role === 'user'
                ? 'bg-purple-600/20 text-purple-100 ml-6'
                : 'bg-gray-700/50 text-gray-200 mr-6',
            ]"
          >
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>

            <!-- Actions from AI -->
            <div
              v-if="msg.actions && msg.actions.length > 0"
              class="mt-2 pt-2 border-t border-gray-600/50 space-y-1"
            >
              <div
                v-for="(action, aIdx) in msg.actions"
                :key="aIdx"
                class="flex items-center gap-2 text-xs"
              >
                <span
                  v-if="action.type === 'updateText'"
                  class="text-green-400"
                >
                  ✓ Текст обновлён
                </span>
                <span
                  v-else-if="action.type === 'searchVideos'"
                  class="text-blue-400"
                >
                  🔍 Поиск видео...
                </span>
                <span
                  v-else-if="action.type === 'updateAllTexts'"
                  class="text-green-400"
                >
                  ✓ Все тексты обновлены
                </span>
                <span
                  v-else-if="action.type === 'searchAllVideos'"
                  class="text-blue-400"
                >
                  🔍 Поиск видео для всех сегментов...
                </span>
                <span
                  v-else-if="action.type === 'searchMusic'"
                  class="text-yellow-400"
                >
                  🎵 Поиск музыки...
                </span>
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div
            v-if="isLoading"
            class="flex items-center gap-2 text-gray-400 text-sm"
          >
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>AI думает...</span>
          </div>
        </div>

        <!-- Input -->
        <div class="p-2 border-t border-gray-700">
          <div class="flex gap-2">
            <input
              v-model="inputMessage"
              @keydown.enter="handleSend"
              :placeholder="inputPlaceholder"
              :disabled="isLoading"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              @click="handleSend"
              :disabled="!inputMessage.trim() || isLoading"
              class="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import {
  Sparkles,
  X,
  Trash2,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-vue-next";
import { aiAssistantApi } from "../api";

const props = defineProps({
  // 'segment' or 'video'
  mode: {
    type: String,
    default: "segment",
    validator: (v) => ["segment", "video"].includes(v),
  },
  // Context for segment mode
  segmentText: String,
  segmentType: String,
  segmentIndex: Number,
  currentVideos: Array,
  // Context for video mode
  videoTitle: String,
  segments: Array,
  music: Object,
  template: Object,
  // Loop script context
  useLoopScript: {
    type: Boolean,
    default: false,
  },
  introText: String,
  outroText: String,
  // UI options
  size: {
    type: String,
    default: "normal",
    validator: (v) => ["small", "normal"].includes(v),
  },
  maxHeight: {
    type: String,
    default: "400px",
  },
  startExpanded: {
    type: Boolean,
    default: false,
  },
  // Направление выпадания: left-down, left-up, right-down, right-up
  dropdownPosition: {
    type: String,
    default: "right-down",
    validator: (v) =>
      ["left-down", "left-up", "right-down", "right-up"].includes(v),
  },
});

const emit = defineEmits([
  "updateText",
  "searchVideos",
  "updateAllTexts",
  "searchAllVideos",
  "searchMusic",
]);

const isExpanded = ref(props.startExpanded);
const inputMessage = ref("");
const messages = ref([]);
const isLoading = ref(false);
const messagesContainer = ref(null);

// Computed: классы позиционирования дропдауна
const dropdownPositionClasses = computed(() => {
  const positions = {
    "left-down": "left-0 top-full mt-2",
    "left-up": "left-0 bottom-full mb-2",
    "right-down": "right-0 top-full mt-2",
    "right-up": "right-0 bottom-full mb-2",
  };
  return positions[props.dropdownPosition] || positions["right-down"];
});

// Computed
const emptyStateText = computed(() => {
  if (props.mode === "segment") {
    return "Помогу изменить текст или найти видео";
  }
  return "Помогу с массовыми изменениями видео";
});

const inputPlaceholder = computed(() => {
  if (props.mode === "segment") {
    return "Переделай текст... / Найди видео с...";
  }
  return "Переделай все тексты... / Найди музыку...";
});

const hints = computed(() => {
  if (props.mode === "segment") {
    return [
      "Сделай текст проще",
      "Сократи текст",
      "Найди видео с людьми",
      "Найди видео с природой",
    ];
  }
  return [
    "Используй простые слова везде",
    "Найди видео с лицами людей",
    "Найди более веселую музыку",
    "Переделай всё: тексты, видео, музыку",
  ];
});

// Methods
function clearChat() {
  messages.value = [];
}

async function sendMessage(text) {
  const messageText = text || inputMessage.value.trim();
  if (!messageText) return;

  inputMessage.value = "";

  // Add user message
  messages.value.push({
    role: "user",
    content: messageText,
  });

  // Scroll to bottom
  await nextTick();
  scrollToBottom();

  isLoading.value = true;

  try {
    let response;

    if (props.mode === "segment") {
      // Build context for segment
      const context = {
        segmentText: props.segmentText,
        segmentType: props.segmentType,
        segmentIndex: props.segmentIndex,
        currentVideos: props.currentVideos,
        useLoopScript: props.useLoopScript,
        introText: props.introText,
        outroText: props.outroText,
      };

      // Build chat history (last 10 messages)
      const chatHistory = messages.value.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      response = await aiAssistantApi.segment(
        messageText,
        chatHistory,
        context,
      );
    } else {
      // Build context for video
      const context = {
        title: props.videoTitle,
        segments: props.segments,
        music: props.music,
        template: props.template,
        useLoopScript: props.useLoopScript,
      };

      // Build chat history
      const chatHistory = messages.value.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      response = await aiAssistantApi.video(messageText, chatHistory, context);
    }

    // Add AI response
    messages.value.push({
      role: "assistant",
      content: response.data.message,
      actions: response.data.actions,
    });

    // Process actions
    processActions(response.data.actions);
  } catch (error) {
    console.error("AI Assistant error:", error);
    messages.value.push({
      role: "assistant",
      content: "Произошла ошибка. Попробуйте ещё раз.",
      actions: [],
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function handleSend() {
  sendMessage();
}

function processActions(actions) {
  if (!actions || actions.length === 0) return;

  for (const action of actions) {
    switch (action.type) {
      case "updateText":
        emit("updateText", action.text);
        break;

      case "searchVideos":
        emit("searchVideos", {
          keywords: action.keywords,
          requirements: action.requirements,
        });
        break;

      case "updateAllTexts":
        emit("updateAllTexts", {
          segments: action.segments,
          style: action.style,
        });
        break;

      case "searchAllVideos":
        emit("searchAllVideos", {
          segmentKeywords: action.segmentKeywords,
          globalRequirements: action.globalRequirements,
        });
        break;

      case "searchMusic":
        emit("searchMusic", {
          mood: action.mood,
          tempo: action.tempo,
          keywords: action.keywords,
          description: action.description,
        });
        break;
    }
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Watch for segment changes to add context hint
watch(
  () => props.segmentIndex,
  () => {
    // Clear chat when segment changes
    if (props.mode === "segment") {
      messages.value = [];
    }
  },
);
</script>

<template>
  <div
    class="glass rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-300 group"
  >
    <!-- Status Bar -->
    <div :class="['h-1', statusBarColor]" />

    <div class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-white truncate pr-4">
            {{ video.title }}
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            {{ formatDate(video.createdAt) }}
          </p>
        </div>

        <!-- Status Badge -->
        <div
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            statusBadgeClasses,
          ]"
        >
          <component
            :is="statusIcon"
            :class="['w-3.5 h-3.5', statusIconAnimation]"
          />
          <span>{{ statusText }}</span>
        </div>
      </div>

      <!-- Script Preview -->
      <div class="mb-4">
        <p class="text-sm text-gray-400 line-clamp-3 leading-relaxed">
          {{ video.scriptText }}
        </p>
      </div>

      <!-- Progress Steps -->
      <div v-if="video.progress" class="mb-4">
        <div class="flex items-center gap-2">
          <template v-for="(step, index) in progressSteps" :key="step.key">
            <!-- Step -->
            <div
              :class="[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center',
                getStepState(step.key).bgColor,
                getStepState(step.key).color,
              ]"
              :title="step.label"
            >
              <component
                :is="getStepState(step.key).icon"
                :class="['w-3.5 h-3.5', getStepState(step.key).animation]"
              />
              <span class="hidden sm:inline">{{ step.label }}</span>
            </div>
            <!-- Connector -->
            <div
              v-if="index < progressSteps.length - 1"
              class="w-4 h-0.5 bg-gray-700 rounded-full"
            />
          </template>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-3 border-t border-gray-800">
        <!-- Render Button -->
        <button
          v-if="video.status === 'PENDING' && video.audioPath"
          @click="$emit('render', video.id)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <Film class="w-4 h-4" />
          <span>Запустить рендер</span>
        </button>

        <!-- Rendering Progress -->
        <div
          v-else-if="video.status === 'RENDERING'"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 rounded-xl text-sm font-medium text-blue-400"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Рендеринг...</span>
        </div>

        <!-- Play Button -->
        <button
          v-else-if="video.status === 'COMPLETED' && video.videoPath"
          @click="openVideo"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <Play class="w-4 h-4" />
          <span>Воспроизвести</span>
        </button>

        <!-- Failed Status with Retry Button -->
        <button
          v-else-if="video.status === 'FAILED'"
          @click="$emit('retry', video.id)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Повторить</span>
        </button>

        <!-- Generating Assets -->
        <div
          v-else-if="video.status === 'GENERATING_ASSETS'"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-xl text-sm font-medium text-yellow-400"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Генерация...</span>
        </div>

        <!-- Waiting -->
        <div
          v-else
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl text-sm font-medium text-gray-400"
        >
          <Clock class="w-4 h-4" />
          <span>Ожидание</span>
        </div>

        <!-- Delete Button -->
        <button
          @click="$emit('delete', video.id)"
          class="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          title="Удалить"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  Film,
  Play,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Volume2,
  Video,
  RotateCcw,
} from "lucide-vue-next";

const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
});

defineEmits(["render", "delete", "retry"]);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const statusConfig = {
  PENDING: {
    color: "bg-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400",
    text: "Ожидает",
    icon: Clock,
    animation: "",
  },
  GENERATING_ASSETS: {
    color: "bg-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400",
    text: "Генерация",
    icon: Sparkles,
    animation: "animate-pulse",
  },
  RENDERING: {
    color: "bg-blue-500",
    badge: "bg-blue-500/20 text-blue-400",
    text: "Рендеринг",
    icon: Loader2,
    animation: "animate-spin",
  },
  COMPLETED: {
    color: "bg-green-500",
    badge: "bg-green-500/20 text-green-400",
    text: "Готово",
    icon: CheckCircle,
    animation: "",
  },
  FAILED: {
    color: "bg-red-500",
    badge: "bg-red-500/20 text-red-400",
    text: "Ошибка",
    icon: AlertCircle,
    animation: "",
  },
};

const currentStatus = computed(
  () => statusConfig[props.video.status] || statusConfig.PENDING
);

const statusBarColor = computed(() => currentStatus.value.color);
const statusBadgeClasses = computed(() => currentStatus.value.badge);
const statusText = computed(() => currentStatus.value.text);
const statusIcon = computed(() => currentStatus.value.icon);
const statusIconAnimation = computed(() => currentStatus.value.animation);

// Progress steps configuration
const progressSteps = [
  { key: "generateScript", label: "Скрипт", icon: FileText },
  { key: "generateAudio", label: "Аудио", icon: Volume2 },
  { key: "renderVideo", label: "Видео", icon: Video },
];

const stepStateConfig = {
  waiting: {
    color: "text-gray-500",
    bgColor: "bg-gray-700/50",
    icon: Clock,
    animation: "",
  },
  pending: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: Loader2,
    animation: "animate-spin",
  },
  success: {
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: CheckCircle,
    animation: "",
  },
  failed: {
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: AlertCircle,
    animation: "",
  },
};

function getStepState(stepKey) {
  const state = props.video.progress?.[stepKey] || "waiting";
  return stepStateConfig[state] || stepStateConfig.waiting;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function openVideo() {
  if (props.video.videoPath) {
    window.open(`${API_URL}/${props.video.videoPath}`, "_blank");
  }
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

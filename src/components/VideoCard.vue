<template>
  <div
    class="glass rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-300 group"
  >
    <div :class="['h-1', statusBarColor]" />

    <div class="p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1 min-w-0">
          <div v-if="isEditing" class="pr-4">
            <input
              v-model="editTitle"
              class="w-full text-lg font-semibold text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
              placeholder="Заголовок видео"
            />
          </div>
          <h3 v-else class="text-lg font-semibold text-white truncate pr-4">
            {{ video.title }}
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            {{ formatDate(video.createdAt) }}
          </p>
        </div>

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

      <div class="mb-4">
        <div v-if="isEditing">
          <textarea
            v-model="editScript"
            rows="5"
            class="w-full text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 resize-none"
            placeholder="Текст сценария..."
          />
        </div>
        <p v-else class="text-sm text-gray-400 line-clamp-3 leading-relaxed">
          {{ video.scriptText }}
        </p>
      </div>

      <div v-if="isEditing" class="flex gap-2 mb-4">
        <button
          @click="saveChanges"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <Check class="w-4 h-4" />
          <span>Сохранить</span>
        </button>
        <button
          @click="cancelEditing"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <X class="w-4 h-4" />
          <span>Отмена</span>
        </button>
      </div>

      <div v-if="video.progress" class="mb-4">
        <div class="flex items-center gap-2">
          <template v-for="(step, index) in progressSteps" :key="step.key">
            <button
              @click="handleStepClick(index + 1)"
              :disabled="!canRetryFromStep"
              :class="[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center transition-all',
                getStepState(step.key).bgColor,
                getStepState(step.key).color,
                canRetryFromStep
                  ? 'hover:ring-2 hover:ring-primary-500 cursor-pointer'
                  : 'cursor-default',
              ]"
              :title="
                canRetryFromStep ? 'Перезапустить с: ' + step.label : step.label
              "
            >
              <component
                :is="getStepState(step.key).icon"
                :class="['w-3.5 h-3.5', getStepState(step.key).animation]"
              />
              <span class="hidden sm:inline">{{ step.label }}</span>
            </button>
            <div
              v-if="index < progressSteps.length - 1"
              class="w-4 h-0.5 bg-gray-700 rounded-full"
            />
          </template>
        </div>
        <p
          v-if="canRetryFromStep"
          class="text-xs text-gray-500 mt-2 text-center"
        >
          Нажмите на шаг чтобы перезапустить с него
        </p>
      </div>

      <div class="flex items-center gap-2 pt-3 border-t border-gray-800">
        <button
          v-if="canEdit && !isEditing"
          @click="startEditing"
          class="p-2 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Редактировать"
        >
          <Pencil class="w-4 h-4" />
        </button>

        <button
          v-if="
            video.status === 'PENDING' &&
            (video.segments || video.audioPath) &&
            !isEditing
          "
          @click="$emit('render', video.id)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <Film class="w-4 h-4" />
          <span>Запустить рендер</span>
        </button>

        <div
          v-else-if="video.status === 'RENDERING'"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 rounded-xl text-sm font-medium text-blue-400"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Рендеринг...</span>
        </div>

        <button
          v-else-if="
            video.status === 'COMPLETED' && video.videoPath && !isEditing
          "
          @click="openVideo"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <Play class="w-4 h-4" />
          <span>Воспроизвести</span>
        </button>

        <button
          v-else-if="video.status === 'FAILED' && !isEditing"
          @click="$emit('retry', video.id)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium text-white transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Повторить</span>
        </button>

        <div
          v-else-if="video.status === 'GENERATING_ASSETS'"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-xl text-sm font-medium text-yellow-400"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Генерация...</span>
        </div>

        <div
          v-else-if="!isEditing"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl text-sm font-medium text-gray-400"
        >
          <Clock class="w-4 h-4" />
          <span>Ожидание</span>
        </div>

        <button
          v-if="!isEditing"
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
import { ref, computed } from "vue";
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
  Pencil,
  Check,
  X,
} from "lucide-vue-next";

const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "render",
  "delete",
  "retry",
  "update",
  "retryFromStep",
]);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const isEditing = ref(false);
const editTitle = ref("");
const editScript = ref("");

const canEdit = computed(() => {
  return !["GENERATING_ASSETS", "RENDERING"].includes(props.video.status);
});

const canRetryFromStep = computed(() => {
  return (
    ["FAILED", "COMPLETED", "PENDING"].includes(props.video.status) &&
    !isEditing.value
  );
});

function startEditing() {
  editTitle.value = props.video.title || "";
  editScript.value = props.video.scriptText || "";
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editTitle.value = "";
  editScript.value = "";
}

function saveChanges() {
  emit("update", props.video.id, {
    title: editTitle.value,
    scriptText: editScript.value,
  });
  isEditing.value = false;
}

function handleStepClick(stepNumber) {
  if (canRetryFromStep.value) {
    emit("retryFromStep", props.video.id, stepNumber);
  }
}

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

const progressSteps = [
  { key: "generateScript", label: "Скрипт", shortLabel: "AI", icon: FileText },
  { key: "searchVideos", label: "Видео", shortLabel: "🔍", icon: Video },
  { key: "generateAudio", label: "Аудио", shortLabel: "🔊", icon: Volume2 },
  {
    key: "processSegments",
    label: "Сегменты",
    shortLabel: "⚙️",
    icon: Sparkles,
  },
  { key: "renderVideo", label: "Рендер", shortLabel: "🎬", icon: Film },
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
    window.open(API_URL + "/" + props.video.videoPath, "_blank");
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

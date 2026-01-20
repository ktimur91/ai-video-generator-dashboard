<template>
  <div class="glass rounded-2xl p-6">
    <div class="flex items-center gap-3 mb-4">
      <div class="p-2 bg-primary-500/20 rounded-xl">
        <Sparkles class="w-5 h-5 text-primary-400" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-white">Быстрое создание</h2>
        <p class="text-sm text-gray-400">Введите тему для генерации сценария</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="relative">
        <input
          v-model="topic"
          type="text"
          placeholder="Например: Топ 5 фишек VS Code для продуктивности"
          class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          :disabled="isLoading"
        />
        <div
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
        >
          {{ topic.length }}/200
        </div>
      </div>

      <!-- Выбор источника видео -->
      <div class="flex items-center gap-4">
        <label class="text-sm text-gray-400">Источник видео:</label>
        <div class="flex gap-2">
          <button
            type="button"
            @click="videoSource = 'pexels'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              videoSource === 'pexels'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            ]"
          >
            Pexels
          </button>
          <button
            type="button"
            @click="videoSource = 'pixabay'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              videoSource === 'pixabay'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            ]"
          >
            Pixabay
          </button>
          <button
            type="button"
            @click="videoSource = 'klipy'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              videoSource === 'klipy'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            ]"
            title="Клипы из фильмов и мемы"
          >
            Klipy
          </button>
        </div>
      </div>

      <!-- AI-выбор видео -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="useAIVideoSelection"
            class="sr-only peer"
            :disabled="videoSource === 'klipy'"
          />
          <div
            class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
          ></div>
          <span
            class="ms-3 text-sm font-medium text-gray-300"
            :class="{ 'opacity-50': videoSource === 'klipy' }"
          >
            🎬 AI-выбор видео
          </span>
        </label>
        <span
          class="text-xs text-gray-500"
          :class="{ 'opacity-50': videoSource === 'klipy' }"
        >
          (GPT-4o анализирует превью и выбирает подходящее)
        </span>
      </div>

      <!-- AI-выбор музыки -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="useAIMusicSelection"
            class="sr-only peer"
          />
          <div
            class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
          ></div>
          <span class="ms-3 text-sm font-medium text-gray-300">
            🎵 AI-выбор музыки
          </span>
        </label>
        <span class="text-xs text-gray-500">
          (GPT-4o-mini анализирует метаданные треков)
        </span>
      </div>

      <!-- Loop-скрипт (закольцованное видео) -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="useLoopScript" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"
          ></div>
          <span class="ms-3 text-sm font-medium text-gray-300">
            🔁 Loop-сценарий
          </span>
        </label>
        <span class="text-xs text-gray-500">
          (конец перетекает в начало для 100%+ удержания)
        </span>
      </div>

      <!-- Выбор шаблона -->
      <div class="flex items-center gap-4">
        <label class="text-sm text-gray-400">Шаблон:</label>
        <select
          v-model="selectedTemplateId"
          class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option :value="null">Без шаблона (по умолчанию)</option>
          <option
            v-for="template in templates"
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
            <template v-if="template.isDefault"> ⭐</template>
            <template v-if="template.channel">
              ({{ template.channel.title }})</template
            >
          </option>
        </select>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="isLoading || !topic.trim()"
          class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200"
        >
          <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
          <Wand2 v-else class="w-5 h-5" />
          <span>{{
            isLoading ? "Генерация..." : "Сгенерировать сценарий"
          }}</span>
        </button>
      </div>
    </form>

    <!-- AI Рекомендации тем -->
    <div class="mt-6 pt-4 border-t border-gray-800">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Lightbulb class="w-4 h-4 text-yellow-400" />
          <span class="text-sm font-medium text-gray-300">AI Рекомендации</span>
        </div>
        <button
          v-if="!isLoadingSuggestions && suggestedTopics.length > 0"
          @click="loadSuggestions()"
          class="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
        >
          <RefreshCw class="w-3 h-3" />
          Обновить
        </button>
      </div>

      <!-- Форма запроса тем -->
      <div class="flex gap-2 mb-3">
        <input
          v-model="suggestionQuery"
          type="text"
          placeholder="Например: аниме, космос, психология..."
          class="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @keyup.enter="loadSuggestions(suggestionQuery)"
          :disabled="isLoadingSuggestions"
        />
        <button
          @click="loadSuggestions(suggestionQuery)"
          :disabled="isLoadingSuggestions"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
        >
          <Loader2 v-if="isLoadingSuggestions" class="w-4 h-4 animate-spin" />
          <Search v-else class="w-4 h-4" />
          <span class="hidden sm:inline">Найти темы</span>
        </button>
      </div>

      <!-- Список тем -->
      <div
        v-if="isLoadingSuggestions"
        class="flex items-center justify-center py-6"
      >
        <Loader2 class="w-6 h-6 text-primary-400 animate-spin" />
        <span class="ml-2 text-sm text-gray-400">Генерирую идеи...</span>
      </div>

      <div v-else-if="suggestedTopics.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="(suggestedTopic, index) in suggestedTopics"
          :key="index"
          type="button"
          @click="topic = suggestedTopic"
          class="text-xs px-3 py-1.5 bg-gray-800 hover:bg-primary-600/30 hover:border-primary-500 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          {{ suggestedTopic }}
        </button>
      </div>

      <div v-else class="text-center py-4 text-sm text-gray-500">
        Нажмите "Найти темы" чтобы получить рекомендации
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  Sparkles,
  Wand2,
  Loader2,
  Lightbulb,
  RefreshCw,
  Search,
} from "lucide-vue-next";
import { topicsApi, templatesApi } from "../api";

const props = defineProps({
  isLoading: Boolean,
});

const emit = defineEmits(["create"]);

const topic = ref("");
const videoSource = ref("pexels");
const useAIVideoSelection = ref(false);
const useAIMusicSelection = ref(false);
const useLoopScript = ref(false);
const selectedTemplateId = ref(null);
const templates = ref([]);

// Загружаем шаблоны
async function loadTemplates() {
  try {
    const response = await templatesApi.getAll();
    templates.value = response.data.templates || [];
    // Выбираем дефолтный шаблон если есть
    const defaultTemplate = templates.value.find((t) => t.isDefault);
    if (defaultTemplate) {
      selectedTemplateId.value = defaultTemplate.id;
    }
  } catch (error) {
    console.error("Failed to load templates:", error);
  }
}

// AI рекомендации
const suggestedTopics = ref([]);
const isLoadingSuggestions = ref(false);
const suggestionQuery = ref("");

async function loadSuggestions(category = null) {
  isLoadingSuggestions.value = true;
  try {
    const response = await topicsApi.getSuggestions(category || null);
    suggestedTopics.value = response.data.topics || [];
    // Очищаем поле после успешного запроса
    if (category) {
      suggestionQuery.value = "";
    }
  } catch (error) {
    console.error("Failed to load topic suggestions:", error);
    suggestedTopics.value = [];
  } finally {
    isLoadingSuggestions.value = false;
  }
}

function handleSubmit() {
  if (topic.value.trim()) {
    emit("create", {
      topic: topic.value.trim(),
      videoSource: videoSource.value,
      useAIVideoSelection:
        useAIVideoSelection.value && videoSource.value !== "klipy",
      useAIMusicSelection: useAIMusicSelection.value,
      useLoopScript: useLoopScript.value,
      templateId: selectedTemplateId.value,
    });
    topic.value = "";
  }
}

// Загружаем шаблоны при первой загрузке
onMounted(() => {
  loadTemplates();
});
</script>

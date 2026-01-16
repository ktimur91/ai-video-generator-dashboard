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

      <!-- Tips -->
      <div class="flex flex-wrap gap-2">
        <span class="text-xs text-gray-500">Примеры:</span>
        <button
          v-for="example in examples"
          :key="example"
          type="button"
          @click="topic = example"
          class="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {{ example }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Sparkles, Wand2, Loader2 } from "lucide-vue-next";

const props = defineProps({
  isLoading: Boolean,
});

const emit = defineEmits(["create"]);

const topic = ref("");
const videoSource = ref("pexels");

const examples = [
  "3 лайфхака для утра",
  "Почему Python популярен",
  "Секреты продуктивности",
];

function handleSubmit() {
  if (topic.value.trim()) {
    emit("create", {
      topic: topic.value.trim(),
      videoSource: videoSource.value,
    });
    topic.value = "";
  }
}
</script>

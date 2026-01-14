<template>
  <div class="space-y-4">
    <!-- Section Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-gray-800 rounded-xl">
          <LayoutGrid class="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-white">Мои видео</h2>
          <p class="text-sm text-gray-500">{{ videos.length }} роликов</p>
        </div>
      </div>

      <!-- Filter/Sort (future) -->
      <div class="flex items-center gap-2">
        <button
          @click="$emit('refresh')"
          :disabled="isLoading"
          class="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
          <span class="hidden sm:inline">Обновить</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && videos.length === 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div v-for="i in 3" :key="i" class="glass rounded-2xl p-5 animate-pulse">
        <div class="h-1 bg-gray-700 rounded mb-4" />
        <div class="space-y-3">
          <div class="h-5 bg-gray-700 rounded w-3/4" />
          <div class="h-3 bg-gray-800 rounded w-1/4" />
          <div class="space-y-2 mt-4">
            <div class="h-3 bg-gray-800 rounded" />
            <div class="h-3 bg-gray-800 rounded" />
            <div class="h-3 bg-gray-800 rounded w-2/3" />
          </div>
          <div class="h-10 bg-gray-700 rounded-xl mt-4" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="videos.length === 0"
      class="glass rounded-2xl p-12 text-center"
    >
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-4"
      >
        <Video class="w-8 h-8 text-gray-500" />
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">Нет видео</h3>
      <p class="text-gray-400 max-w-sm mx-auto">
        Создайте первое видео, введя тему в форму выше
      </p>
    </div>

    <!-- Video Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
        @render="$emit('render', $event)"
        @delete="$emit('delete', $event)"
        @retry="$emit('retry', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { LayoutGrid, RefreshCw, Video } from "lucide-vue-next";
import VideoCard from "./VideoCard.vue";

defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  isLoading: Boolean,
});

defineEmits(["refresh", "render", "delete", "retry"]);
</script>

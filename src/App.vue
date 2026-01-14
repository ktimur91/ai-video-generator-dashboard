<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Header -->
    <AppHeader :status="apiStatus" @refresh="fetchVideos" />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Error Alert -->
      <div
        v-if="error"
        class="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm">{{ error }}</p>
        <button
          @click="error = null"
          class="ml-auto p-1 hover:bg-red-500/20 rounded-lg"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Create Form -->
      <QuickCreate :isLoading="isCreating" @create="handleCreate" />

      <!-- Video Grid -->
      <VideoGrid
        :videos="videos"
        :isLoading="isLoading"
        @refresh="fetchVideos"
        @render="handleRender"
        @delete="handleDelete"
      />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-800 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-sm text-gray-500">
          YouTube AI Generator • Built with Vue 3 + Remotion + OpenAI
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { AlertCircle, X } from "lucide-vue-next";
import AppHeader from "./components/AppHeader.vue";
import QuickCreate from "./components/QuickCreate.vue";
import VideoGrid from "./components/VideoGrid.vue";
import { useVideos } from "./composables/useVideos";

const {
  videos,
  isLoading,
  isCreating,
  error,
  apiStatus,
  fetchVideos,
  createVideo,
  startRender,
  deleteVideo,
} = useVideos();

async function handleCreate(topic) {
  await createVideo(topic);
}

async function handleRender(videoId) {
  await startRender(videoId);
}

async function handleDelete(videoId) {
  if (confirm("Удалить это видео?")) {
    await deleteVideo(videoId);
  }
}
</script>

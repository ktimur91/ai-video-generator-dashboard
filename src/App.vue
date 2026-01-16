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
        @retry="handleRetry"
        @update="handleUpdate"
        @retryFromStep="handleRetryFromStep"
        @editBackgrounds="openBackgroundEditor"
        @publish="openPublishModal"
        @stop="handleStop"
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

    <!-- Background Editor Modal -->
    <VideoBackgroundEditor
      :isOpen="isEditorOpen"
      :video="editorVideo"
      @close="closeBackgroundEditor"
      @save="handleSaveBackgrounds"
    />

    <!-- YouTube Publish Modal -->
    <YouTubePublishModal
      :isOpen="isPublishModalOpen"
      :video="publishVideo"
      @close="closePublishModal"
      @published="handlePublished"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { AlertCircle, X } from "lucide-vue-next";
import AppHeader from "./components/AppHeader.vue";
import QuickCreate from "./components/QuickCreate.vue";
import VideoGrid from "./components/VideoGrid.vue";
import VideoBackgroundEditor from "./components/VideoBackgroundEditor.vue";
import YouTubePublishModal from "./components/YouTubePublishModal.vue";
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
  retryVideo,
  updateVideo,
  updateSegments,
  stopGeneration,
} = useVideos();

// Background editor state
const isEditorOpen = ref(false);
const editorVideo = ref(null);

// YouTube publish modal state
const isPublishModalOpen = ref(false);
const publishVideo = ref(null);

function openBackgroundEditor(video) {
  editorVideo.value = video;
  isEditorOpen.value = true;
}

function closeBackgroundEditor() {
  isEditorOpen.value = false;
  editorVideo.value = null;
}

function openPublishModal(video) {
  publishVideo.value = video;
  isPublishModalOpen.value = true;
}

function closePublishModal() {
  isPublishModalOpen.value = false;
  publishVideo.value = null;
}

function handlePublished() {
  // Refresh videos to get updated YouTube info
  fetchVideos();
}

async function handleSaveBackgrounds(segments) {
  if (!editorVideo.value) return;

  const success = await updateSegments(editorVideo.value.id, segments);
  if (success) {
    closeBackgroundEditor();
    // Автоматически запускаем рендер
    await startRender(editorVideo.value.id);
  }
}

async function handleCreate(data) {
  await createVideo(data.topic, data.videoSource);
}

async function handleRender(videoId) {
  await startRender(videoId);
}

async function handleDelete(videoId) {
  if (confirm("Удалить это видео?")) {
    await deleteVideo(videoId);
  }
}

async function handleRetry(videoId) {
  await retryVideo(videoId);
}

async function handleUpdate(videoId, data) {
  await updateVideo(videoId, data);
}

async function handleRetryFromStep(videoId, fromStep) {
  await retryVideo(videoId, fromStep);
}

async function handleStop(videoId) {
  await stopGeneration(videoId);
}
</script>

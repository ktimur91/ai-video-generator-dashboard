<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Header -->
    <AppHeader
      :status="apiStatus"
      @refresh="fetchVideos"
      @openVoiceSettings="openVoiceSettings"
      @openYouTubeAccounts="openYouTubeAccounts"
      @openTemplates="openTemplates"
    />

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
        @publish="openPublishModal"
        @stop="handleStop"
        @review="openReviewEditor"
        @versions="openVersionsModal"
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
      :isReviewMode="isReviewMode"
      @close="closeBackgroundEditor"
      @save="handleSaveBackgrounds"
      @approve="handleApproveAndContinue"
    />

    <!-- YouTube Publish Modal -->
    <YouTubePublishModal
      :isOpen="isPublishModalOpen"
      :video="publishVideo"
      @close="closePublishModal"
      @published="handlePublished"
    />

    <!-- Voice Settings Modal -->
    <VoiceSettingsModal
      :isOpen="isVoiceSettingsOpen"
      @close="closeVoiceSettings"
    />

    <!-- Video Versions Modal -->
    <VideoVersions
      :isOpen="isVersionsModalOpen"
      :video="versionsVideo"
      @close="closeVersionsModal"
      @activated="handleVersionActivated"
    />

    <!-- YouTube Accounts Modal -->
    <YouTubeAccountsModal
      :isOpen="isYouTubeAccountsOpen"
      @close="closeYouTubeAccounts"
    />

    <!-- Template Editor Modal -->
    <TemplateEditorModal :isOpen="isTemplatesOpen" @close="closeTemplates" />
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
import VoiceSettingsModal from "./components/VoiceSettingsModal.vue";
import VideoVersions from "./components/VideoVersions.vue";
import YouTubeAccountsModal from "./components/YouTubeAccountsModal.vue";
import TemplateEditorModal from "./components/TemplateEditorModal.vue";
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
  regenerateVideo,
  stopGeneration,
  approveVideo,
} = useVideos();

// Background editor state
const isEditorOpen = ref(false);
const editorVideo = ref(null);
const isReviewMode = ref(false);

// YouTube publish modal state
const isPublishModalOpen = ref(false);
const publishVideo = ref(null);

// Voice settings modal state
const isVoiceSettingsOpen = ref(false);

// Video versions modal state
const isVersionsModalOpen = ref(false);
const versionsVideo = ref(null);

// YouTube accounts modal state
const isYouTubeAccountsOpen = ref(false);

// Templates modal state
const isTemplatesOpen = ref(false);

function openYouTubeAccounts() {
  isYouTubeAccountsOpen.value = true;
}

function closeYouTubeAccounts() {
  isYouTubeAccountsOpen.value = false;
}

function openTemplates() {
  isTemplatesOpen.value = true;
}

function closeTemplates() {
  isTemplatesOpen.value = false;
}

function openVoiceSettings() {
  isVoiceSettingsOpen.value = true;
}

function closeVoiceSettings() {
  isVoiceSettingsOpen.value = false;
}

function openVersionsModal(video) {
  versionsVideo.value = video;
  isVersionsModalOpen.value = true;
}

function closeVersionsModal() {
  isVersionsModalOpen.value = false;
  versionsVideo.value = null;
}

function handleVersionActivated() {
  fetchVideos();
}

function openBackgroundEditor(video) {
  editorVideo.value = video;
  isReviewMode.value = false;
  isEditorOpen.value = true;
}

function openReviewEditor(video) {
  editorVideo.value = video;
  isReviewMode.value = true;
  isEditorOpen.value = true;
}

function closeBackgroundEditor() {
  isEditorOpen.value = false;
  editorVideo.value = null;
  isReviewMode.value = false;
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

async function handleSaveBackgrounds(data) {
  if (!editorVideo.value) return;

  // data содержит { segments, voiceConfigId, backgroundMusicData, regenerateAudio }
  closeBackgroundEditor();

  if (data.regenerateAudio) {
    // Нужна перегенерация аудио - вызываем regenerate
    await regenerateVideo(editorVideo.value.id, {
      segments: data.segments,
      voiceConfigId: data.voiceConfigId,
      backgroundMusicData: data.backgroundMusicData,
    });
  } else {
    // Только изменились сегменты/музыка - обновляем и рендерим
    const success = await updateSegments(editorVideo.value.id, {
      segments: data.segments,
      backgroundMusicData: data.backgroundMusicData,
    });
    if (success) {
      await startRender(editorVideo.value.id);
    }
  }

  // Обновляем список видео чтобы увидеть статус
  await fetchVideos();
}

async function handleApproveAndContinue({
  segments,
  backgroundMusicData,
  voiceConfigId,
}) {
  if (!editorVideo.value) return;

  // Если видео уже COMPLETED, используем regenerate вместо approve
  if (editorVideo.value.status === "COMPLETED") {
    await regenerateVideo(editorVideo.value.id, {
      segments,
      voiceConfigId,
      backgroundMusicData,
    });
    closeBackgroundEditor();
  } else {
    const result = await approveVideo(
      editorVideo.value.id,
      segments,
      backgroundMusicData,
      voiceConfigId,
    );
    if (result) {
      closeBackgroundEditor();
    }
  }
}

async function handleCreate(data) {
  await createVideo(data);
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

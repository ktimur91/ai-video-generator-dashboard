<template>
  <header class="glass sticky top-0 z-50 border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-500/20 rounded-xl">
            <Video class="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-white">YouTube AI Generator</h1>
            <p class="text-xs text-gray-400">Shorts Automation</p>
          </div>
        </div>

        <!-- API Status -->
        <div class="flex items-center gap-2">
          <!-- Voice Settings Button -->
          <button
            @click="$emit('openVoiceSettings')"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
            title="Настройки голосов"
          >
            <Mic class="w-4 h-4 text-purple-400" />
            <span class="text-sm text-purple-400 hidden sm:inline">Голоса</span>
          </button>

          <!-- YouTube Accounts Button -->
          <button
            @click="$emit('openYouTubeAccounts')"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            title="YouTube аккаунты"
          >
            <Youtube class="w-4 h-4 text-red-400" />
            <span class="text-sm text-red-400 hidden sm:inline">YouTube</span>
          </button>

          <!-- Templates Button -->
          <button
            @click="$emit('openTemplates')"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 transition-colors"
            title="Шаблоны видео"
          >
            <Palette class="w-4 h-4 text-pink-400" />
            <span class="text-sm text-pink-400 hidden sm:inline">Шаблоны</span>
          </button>

          <div
            :class="[
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              statusClasses,
            ]"
          >
            <span
              :class="[
                'w-2 h-2 rounded-full',
                status === 'online'
                  ? 'bg-green-400 animate-pulse'
                  : status === 'offline'
                    ? 'bg-red-400'
                    : 'bg-yellow-400 animate-pulse',
              ]"
            />
            <span>{{ statusText }}</span>
          </div>

          <button
            @click="$emit('refresh')"
            class="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Обновить"
          >
            <RefreshCw class="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { Video, RefreshCw, Mic, Youtube, Palette } from "lucide-vue-next";

const props = defineProps({
  status: {
    type: String,
    default: "checking",
    validator: (v) => ["online", "offline", "checking"].includes(v),
  },
});

defineEmits([
  "refresh",
  "openVoiceSettings",
  "openYouTubeAccounts",
  "openTemplates",
]);

const statusText = computed(() => {
  switch (props.status) {
    case "online":
      return "API Online";
    case "offline":
      return "API Offline";
    default:
      return "Проверка...";
  }
});

const statusClasses = computed(() => {
  switch (props.status) {
    case "online":
      return "bg-green-500/10 text-green-400 border border-green-500/20";
    case "offline":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    default:
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
  }
});
</script>

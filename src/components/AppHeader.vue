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
import { Video, RefreshCw } from "lucide-vue-next";

const props = defineProps({
  status: {
    type: String,
    default: "checking",
    validator: (v) => ["online", "offline", "checking"].includes(v),
  },
});

defineEmits(["refresh"]);

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

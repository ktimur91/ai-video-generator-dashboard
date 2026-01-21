<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :class="backdropClass"
        @click.self="closeOnBackdrop && $emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
            :class="sizeClasses"
            :style="customStyle"
          >
            <!-- Header -->
            <div
              v-if="showHeader"
              class="flex items-center justify-between px-6 py-4 border-b border-gray-800"
            >
              <slot name="header">
                <h2 class="text-xl font-bold text-white">{{ title }}</h2>
              </slot>
              <button
                v-if="showCloseButton"
                @click="$emit('close')"
                class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div
              class="flex-1 overflow-y-auto"
              :class="[bodyClass, { 'p-6': !noPadding }]"
            >
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="showFooter"
              class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800"
            >
              <slot name="footer">
                <button
                  @click="$emit('close')"
                  class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
                >
                  Закрыть
                </button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onUnmounted } from "vue";
import { X } from "lucide-vue-next";
import {
  useModalStack,
  initModalEscapeHandler,
} from "../composables/useModalStack";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "medium",
    validator: (v) => ["small", "medium", "large", "fullscreen"].includes(v),
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  closeOnEsc: {
    type: Boolean,
    default: true,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
  bodyClass: {
    type: String,
    default: "",
  },
  backdropClass: {
    type: String,
    default: "bg-black/80 backdrop-blur-sm",
  },
});

const emit = defineEmits(["close"]);

// Инициализируем глобальный обработчик Escape
initModalEscapeHandler();

// Управление стеком модалок
const { register, unregister } = useModalStack(() => {
  if (props.closeOnEsc) {
    emit("close");
  }
});

// Регистрируем/удаляем модалку при открытии/закрытии
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      register();
      // Блокируем скролл body
      document.body.style.overflow = "hidden";
    } else {
      unregister();
      // Разблокируем скролл только если нет других модалок
      setTimeout(() => {
        const hasOtherModals =
          document.querySelectorAll('[data-modal-open="true"]').length > 0;
        if (!hasOtherModals) {
          document.body.style.overflow = "";
        }
      }, 0);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  unregister();
});

// Классы размеров
const sizeClasses = computed(() => {
  switch (props.size) {
    case "small":
      return "w-full max-w-md max-h-[80vh]";
    case "medium":
      return "w-full max-w-2xl max-h-[85vh]";
    case "large":
      return "w-full max-w-5xl max-h-[90vh]";
    case "fullscreen":
      return "";
    default:
      return "w-full max-w-2xl max-h-[85vh]";
  }
});

const customStyle = computed(() => {
  if (props.size === "fullscreen") {
    return {
      width: "calc(100vw - 2rem)",
      height: "calc(100vh - 2rem)",
      maxWidth: "calc(100vw - 2rem)",
      maxHeight: "calc(100vh - 2rem)",
    };
  }
  return {};
});
</script>

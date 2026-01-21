/**
 * Composable для управления стеком модалок
 * Позволяет закрывать по Esc только самую верхнюю модалку
 */

import { ref, onMounted, onUnmounted } from "vue";

// Глобальный стек открытых модалок (ID -> close callback)
const modalStack = ref([]);
let idCounter = 0;

/**
 * Регистрирует модалку в стеке
 * @param {Function} onClose - callback для закрытия модалки
 * @returns {Object} - { modalId, unregister }
 */
export function useModalStack(onClose) {
  const modalId = ref(null);

  function register() {
    const id = ++idCounter;
    modalId.value = id;
    modalStack.value.push({ id, onClose });
    return id;
  }

  function unregister() {
    if (modalId.value !== null) {
      modalStack.value = modalStack.value.filter((m) => m.id !== modalId.value);
      modalId.value = null;
    }
  }

  return {
    modalId,
    register,
    unregister,
  };
}

/**
 * Обработчик глобального Escape - закрывает верхнюю модалку
 */
function handleGlobalEscape(event) {
  if (event.key === "Escape" && modalStack.value.length > 0) {
    event.preventDefault();
    event.stopPropagation();

    // Берем верхнюю модалку из стека
    const topModal = modalStack.value[modalStack.value.length - 1];
    if (topModal && topModal.onClose) {
      topModal.onClose();
    }
  }
}

// Инициализация глобального обработчика (вызывается один раз)
let isInitialized = false;

export function initModalEscapeHandler() {
  if (!isInitialized) {
    document.addEventListener("keydown", handleGlobalEscape);
    isInitialized = true;
  }
}

// Экспортируем стек для отладки
export function getModalStack() {
  return modalStack.value;
}

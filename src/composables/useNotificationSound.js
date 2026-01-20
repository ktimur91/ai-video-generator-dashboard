import { ref, watch } from "vue";

// Глобальное состояние для звуковых уведомлений
const soundEnabled = ref(
  localStorage.getItem("notificationSoundEnabled") !== "false",
);

// Сохраняем в localStorage при изменении
watch(soundEnabled, (value) => {
  localStorage.setItem("notificationSoundEnabled", value.toString());
});

// Аудио контекст создаётся один раз и переиспользуется
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Если контекст приостановлен (из-за политики браузера), возобновляем
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Универсальная функция для воспроизведения тонов
function playTones(frequencies, durations, volume = 0.3) {
  if (!soundEnabled.value) return;

  try {
    const ctx = getAudioContext();
    let startTime = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      const duration = durations[i] || 0.15;

      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      startTime += duration * 0.8; // Небольшое перекрытие для плавности
    });
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}

// Звук для проверки (мягкий звон) - два коротких тона вверх
function playReviewSound() {
  // C5 -> E5 (мажорная терция вверх)
  playTones([523.25, 659.25], [0.12, 0.18], 0.25);
}

// Звук для завершения рендера (победный звук) - мажорное трезвучие
function playCompleteSound() {
  // C5 -> E5 -> G5 (до-ми-соль)
  playTones([523.25, 659.25, 783.99], [0.12, 0.12, 0.25], 0.3);
}

// Звук ошибки (грустный звук) - нисходящие тона
function playErrorSound() {
  // A4 -> E4 (нисходящая кварта)
  playTones([440, 329.63], [0.15, 0.25], 0.25);
}

// Тестовый звук (для проверки что звуки работают при нажатии на кнопку)
function playTestSound() {
  playTones([880], [0.1], 0.2);
}

export function useNotificationSound() {
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value;
    // Воспроизводим тестовый звук при включении (это также "разблокирует" аудио)
    if (soundEnabled.value) {
      playTestSound();
    }
  };

  return {
    soundEnabled,
    toggleSound,
    playReviewSound,
    playCompleteSound,
    playErrorSound,
    playTestSound,
  };
}

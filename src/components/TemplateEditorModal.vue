<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    @click.self="close"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />

    <!-- Modal -->
    <div
      class="relative w-full max-w-7xl max-h-[90vh] glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b border-gray-800 shrink-0"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-500/20 rounded-xl">
            <Palette class="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Шаблоны видео</h2>
            <p class="text-sm text-gray-400">
              Настройте внешний вид для каждого канала
            </p>
          </div>
        </div>
        <button
          @click="close"
          class="p-2 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Templates List (left sidebar) -->
        <div class="w-56 border-r border-gray-800 p-3 overflow-y-auto shrink-0">
          <button
            @click="createNewTemplate"
            class="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors mb-3 text-sm"
          >
            <Plus class="w-4 h-4" />
            <span>Новый шаблон</span>
          </button>

          <div v-if="loading" class="text-center py-8">
            <Loader2 class="w-6 h-6 text-purple-500 animate-spin mx-auto" />
          </div>

          <div v-else class="space-y-1.5">
            <button
              v-for="template in templates"
              :key="template.id"
              @click="selectTemplate(template)"
              :class="[
                'w-full text-left p-2.5 rounded-xl border transition-colors',
                selectedTemplate?.id === template.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700/50 hover:border-gray-600',
              ]"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: template.primaryColor }"
                />
                <span class="font-medium text-white text-sm truncate">{{
                  template.name
                }}</span>
                <Star
                  v-if="template.isDefault"
                  class="w-3 h-3 text-yellow-500 shrink-0"
                />
              </div>
              <p
                v-if="template.channel"
                class="text-xs text-gray-400 mt-0.5 truncate ml-5"
              >
                {{ template.channel.title }}
              </p>
            </button>
          </div>
        </div>

        <!-- Editor (main area) -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Settings Panel with Tabs -->
          <div
            v-if="selectedTemplate || isCreating"
            class="flex-1 flex flex-col overflow-hidden"
          >
            <!-- Tabs -->
            <div class="flex border-b border-gray-800 shrink-0 px-4">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm',
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300',
                ]"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                <span>{{ tab.label }}</span>
              </button>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 p-5 overflow-y-auto">
              <!-- General Tab -->
              <div v-if="activeTab === 'general'" class="space-y-5">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-400 mb-1.5"
                      >Название</label
                    >
                    <input
                      v-model="editForm.name"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="Мой шаблон"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-400 mb-1.5"
                      >Канал</label
                    >
                    <select
                      v-model="editForm.channelId"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option :value="null">Универсальный</option>
                      <option
                        v-for="channel in channels"
                        :key="channel.id"
                        :value="channel.id"
                      >
                        {{ channel.title }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Colors -->
                <div>
                  <h4
                    class="text-sm font-medium text-white mb-3 flex items-center gap-2"
                  >
                    <Paintbrush class="w-4 h-4 text-purple-400" />
                    Цвета
                  </h4>
                  <div class="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Основной"
                      v-model="editForm.primaryColor"
                    />
                    <ColorPicker
                      label="Фон"
                      v-model="editForm.backgroundColor"
                    />
                  </div>
                </div>
              </div>

              <!-- Subtitles Tab -->
              <div v-if="activeTab === 'subtitles'" class="space-y-5">
                <!-- Превью режима субтитров -->
                <!-- <div
                  class="p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400"
                      >Пример отображения:</span
                    >
                    <span class="text-xs text-gray-500">{{
                      subtitleModeDescription
                    }}</span>
                  </div>
                  <div
                    class="text-center py-3 px-4 rounded-lg"
                    :style="{
                      fontFamily: `'${editForm.subtitleFontFamily}', sans-serif`,
                      fontWeight: editForm.subtitleFontWeight,
                      fontSize: '18px',
                      color: editForm.subtitleFontColor,
                      backgroundColor: editForm.subtitleBgEnabled
                        ? editForm.subtitleBgColor
                        : 'transparent',
                    }"
                  >
                    <template v-if="editForm.subtitleMode === 'word'">
                      <span :style="{ color: editForm.subtitleHighlightColor }"
                        >Слово</span
                      >
                    </template>
                    <template v-else-if="editForm.subtitleMode === 'phrase'">
                      <span>...</span
                      ><template
                        v-for="(item, idx) in phrasePreviewWords"
                        :key="idx"
                        ><span
                          :style="
                            item.highlight
                              ? { color: editForm.subtitleHighlightColor }
                              : {}
                          "
                          >{{ item.word }}</span
                        ></template
                      ><span>...</span>
                    </template>
                    <template v-else>
                      <span>Слоны — </span>
                      <span>единственные </span>
                      <span :style="{ color: editForm.subtitleHighlightColor }"
                        >животные</span
                      >
                      <span style="opacity: 0.3"> которые...</span>
                    </template>
                  </div>
                </div> -->

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Режим</label
                    >
                    <select
                      v-model="editForm.subtitleMode"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option value="karaoke">Караоке</option>
                      <option value="phrase">По фразам</option>
                      <option value="word">По словам</option>
                    </select>
                  </div>
                  <!-- Количество слов в фразе (только для режима phrase) -->
                  <div v-if="editForm.subtitleMode === 'phrase'">
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Слов в фразе</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.subtitlePhraseLength"
                      min="2"
                      max="10"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Шрифт</label
                    >
                    <select
                      v-model="editForm.subtitleFontFamily"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option
                        v-for="font in fonts"
                        :key="font.family"
                        :value="font.family"
                      >
                        {{ font.family }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Насыщенность</label
                    >
                    <select
                      v-model="editForm.subtitleFontWeight"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Размер</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.subtitleFontSize"
                      min="16"
                      max="300"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Ширина блока (%)</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.subtitleWidth"
                      min="50"
                      max="100"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Позиция</label
                    >
                    <select
                      v-model="editForm.subtitlePositionPreset"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option value="top">Сверху</option>
                      <option value="center">По центру</option>
                      <option value="bottom">Снизу</option>
                      <option :value="null">Своя позиция</option>
                    </select>
                  </div>
                </div>

                <!-- Custom Position -->
                <div
                  v-if="!editForm.subtitlePositionPreset"
                  class="grid grid-cols-2 gap-4 p-3 bg-gray-800/50 rounded-xl"
                >
                  <div>
                    <label class="block text-xs text-gray-500 mb-1"
                      >Позиция X (%)</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.subtitlePositionX"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1"
                      >Позиция Y (%)</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.subtitlePositionY"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <ColorPicker
                    label="Цвет текста"
                    v-model="editForm.subtitleFontColor"
                  />
                  <ColorPicker
                    label="Цвет подсветки"
                    v-model="editForm.subtitleHighlightColor"
                  />
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Фон</label
                    >
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          v-model="editForm.subtitleBgEnabled"
                          class="w-4 h-4 rounded"
                        />
                        <span class="text-sm text-gray-300">Вкл</span>
                      </label>
                      <input
                        v-if="editForm.subtitleBgEnabled"
                        v-model="editForm.subtitleBgColor"
                        class="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <!-- Text Stroke -->
                <div class="p-3 bg-gray-800/50 rounded-xl">
                  <label class="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      v-model="editForm.subtitleStrokeEnabled"
                      class="w-4 h-4 rounded"
                    />
                    <span class="text-gray-300">Обводка текста</span>
                    <span class="text-xs text-gray-500"
                      >(для видимости без фона)</span
                    >
                  </label>
                  <div
                    v-if="editForm.subtitleStrokeEnabled"
                    class="grid grid-cols-2 gap-4"
                  >
                    <ColorPicker
                      label="Цвет обводки"
                      v-model="editForm.subtitleStrokeColor"
                    />
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Толщина (px)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.subtitleStrokeWidth"
                        min="1"
                        max="8"
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Numbers Tab -->
              <div v-if="activeTab === 'numbers'" class="space-y-5">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="editForm.showNumbers"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-gray-300">Показывать номера сегментов</span>
                </label>

                <div v-if="editForm.showNumbers" class="space-y-4">
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Позиция</label
                      >
                      <select
                        v-model="editForm.numberPositionPreset"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      >
                        <option value="top-left">Сверху слева</option>
                        <option value="top-right">Сверху справа</option>
                        <option value="bottom-left">Снизу слева</option>
                        <option value="bottom-right">Снизу справа</option>
                        <option :value="null">Своя позиция</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Стиль</label
                      >
                      <select
                        v-model="editForm.numberStyle"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      >
                        <option value="badge">Бейдж</option>
                        <option value="square">Квадрат</option>
                        <option value="minimal">Минимальный</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Размер шрифта</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.numberFontSize"
                        min="12"
                        max="300"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <div
                    v-if="!editForm.numberPositionPreset"
                    class="grid grid-cols-3 gap-4 p-3 bg-gray-800/50 rounded-xl"
                  >
                    <div>
                      <label class="block text-xs text-gray-500 mb-1"
                        >Позиция X (%)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.numberPositionX"
                        min="0"
                        max="100"
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1"
                        >Позиция Y (%)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.numberPositionY"
                        min="0"
                        max="100"
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1"
                        >Точка опоры</label
                      >
                      <select
                        v-model="editForm.numberAnchor"
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      >
                        <option value="center">По центру</option>
                        <option value="top-left">Сверху слева</option>
                        <option value="top-center">Сверху по центру</option>
                        <option value="top-right">Сверху справа</option>
                        <option value="bottom-left">Снизу слева</option>
                        <option value="bottom-center">Снизу по центру</option>
                        <option value="bottom-right">Снизу справа</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Цвет фона"
                      v-model="editForm.numberBgColor"
                      nullable
                      placeholder="Как основной"
                    />
                    <ColorPicker
                      label="Цвет текста"
                      v-model="editForm.numberFontColor"
                    />
                  </div>

                  <!-- Шаблон текста нумерации -->
                  <div class="space-y-2">
                    <label class="block text-sm text-gray-400"
                      >Шаблон текста</label
                    >
                    <input
                      type="text"
                      v-model="editForm.numberTemplate"
                      placeholder="{num}"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    />
                    <p class="text-xs text-gray-500">
                      Используйте
                      <code class="bg-gray-700 px-1 rounded">{num}</code> для
                      номера. Примеры:
                      <span class="text-gray-400">Факт №{num}</span>,
                      <span class="text-gray-400">Топ {num}</span>,
                      <span class="text-gray-400">Часть {num}</span>
                    </p>
                  </div>

                  <!-- Направление нумерации -->
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Направление</label
                    >
                    <select
                      v-model="editForm.numberDirection"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option value="asc">По возрастанию (1, 2, 3...)</option>
                      <option value="desc">По убыванию (...3, 2, 1)</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      Убывание полезно для "Топ" роликов — лучший товар в конце
                    </p>
                  </div>
                </div>
              </div>

              <!-- Progress Tab -->
              <div v-if="activeTab === 'progress'" class="space-y-5">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="editForm.showProgressBar"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-gray-300">Показывать прогресс-бар</span>
                </label>

                <div
                  v-if="editForm.showProgressBar"
                  class="grid grid-cols-3 gap-4"
                >
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Позиция</label
                    >
                    <select
                      v-model="editForm.progressBarPosition"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    >
                      <option value="top">Сверху</option>
                      <option value="bottom">Снизу</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-1.5"
                      >Высота (px)</label
                    >
                    <input
                      type="number"
                      v-model.number="editForm.progressBarHeight"
                      min="2"
                      max="16"
                      class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                    />
                  </div>
                  <ColorPicker
                    label="Цвет"
                    v-model="editForm.progressBarColor"
                    nullable
                    placeholder="Как основной"
                  />
                </div>
              </div>

              <!-- CTA Tab -->
              <div v-if="activeTab === 'cta'" class="space-y-5">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="editForm.showCTA"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-gray-300"
                    >Показывать призыв к действию</span
                  >
                </label>

                <div v-if="editForm.showCTA" class="space-y-4">
                  <!-- Position X/Y -->
                  <div class="grid grid-cols-5 gap-4">
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Позиция X (%)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.ctaPositionX"
                        min="0"
                        max="100"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Позиция Y (%)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.ctaPositionY"
                        min="0"
                        max="100"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Якорь</label
                      >
                      <select
                        v-model="editForm.ctaAnchor"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      >
                        <option value="center">По центру</option>
                        <option value="top-left">Сверху слева</option>
                        <option value="top-center">Сверху по центру</option>
                        <option value="top-right">Сверху справа</option>
                        <option value="bottom-left">Снизу слева</option>
                        <option value="bottom-center">Снизу по центру</option>
                        <option value="bottom-right">Снизу справа</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Направление</label
                      >
                      <select
                        v-model="editForm.ctaDirection"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      >
                        <option value="horizontal">Горизонтально</option>
                        <option value="vertical">Вертикально</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-400 mb-1.5"
                        >Отступ (px)</label
                      >
                      <input
                        type="number"
                        v-model.number="editForm.ctaGap"
                        min="0"
                        max="32"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <!-- CTA Items -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <label class="text-sm font-medium text-white"
                        >Элементы CTA</label
                      >
                      <button
                        @click="addCtaItem"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                      >
                        <Plus class="w-3 h-3" />
                        Добавить
                      </button>
                    </div>

                    <div class="space-y-3">
                      <div
                        v-for="(item, index) in editForm.ctaItems"
                        :key="index"
                        class="p-3 bg-gray-800/50 rounded-xl border border-gray-700"
                      >
                        <div class="flex items-start gap-3">
                          <!-- Icon Preview -->
                          <div
                            class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 text-2xl"
                          >
                            <template v-if="item.imagePath">
                              <img
                                :src="API_URL + '/' + item.imagePath"
                                class="w-full h-full object-contain rounded-lg"
                              />
                            </template>
                            <template v-else>
                              {{ item.icon || "❓" }}
                            </template>
                          </div>

                          <div class="flex-1 space-y-2">
                            <!-- Icon Row -->
                            <div class="flex items-center gap-2">
                              <div class="flex-1">
                                <label class="block text-xs text-gray-500 mb-1"
                                  >Иконка (эмоджи)</label
                                >
                                <input
                                  v-model="item.icon"
                                  placeholder="🔔 👍 📺"
                                  class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                  :disabled="!!item.imagePath"
                                />
                              </div>
                              <div class="w-20">
                                <label class="block text-xs text-gray-500 mb-1"
                                  >Размер</label
                                >
                                <input
                                  type="number"
                                  v-model.number="item.iconSize"
                                  min="12"
                                  max="300"
                                  placeholder="24"
                                  class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                  :disabled="!!item.imagePath"
                                />
                              </div>
                              <div class="pt-4">
                                <span class="text-xs text-gray-500">или</span>
                              </div>
                              <div class="pt-4">
                                <input
                                  :ref="(el) => (ctaIconInputs[index] = el)"
                                  type="file"
                                  accept="image/png,image/jpeg,image/gif,image/webp"
                                  @change="(e) => handleCtaIconUpload(e, index)"
                                  class="hidden"
                                />
                                <button
                                  v-if="!item.imagePath"
                                  @click="ctaIconInputs[index]?.click()"
                                  class="px-2 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                                >
                                  Загрузить
                                </button>
                                <button
                                  v-else
                                  @click="removeCtaIconImage(index)"
                                  class="px-2 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                                >
                                  Удалить
                                </button>
                              </div>
                              <div v-if="item.imagePath" class="w-20">
                                <label class="block text-xs text-gray-500 mb-1"
                                  >Размер</label
                                >
                                <input
                                  type="number"
                                  v-model.number="item.imageSize"
                                  min="16"
                                  max="300"
                                  placeholder="32"
                                  class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                              </div>
                            </div>

                            <!-- Text Row -->
                            <div class="flex items-center gap-2">
                              <div class="flex-1">
                                <label class="block text-xs text-gray-500 mb-1"
                                  >Текст (опционально)</label
                                >
                                <input
                                  v-model="item.text"
                                  placeholder="Подпишись!"
                                  class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                              </div>
                              <div class="w-28">
                                <label class="block text-xs text-gray-500 mb-1"
                                  >Позиция текста</label
                                >
                                <select
                                  v-model="item.textPosition"
                                  class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs"
                                >
                                  <option value="right">Справа</option>
                                  <option value="left">Слева</option>
                                  <option value="bottom">Снизу</option>
                                  <option value="top">Сверху</option>
                                </select>
                              </div>
                            </div>

                            <!-- Colors Row -->
                            <div class="flex items-center gap-3">
                              <div class="flex items-center gap-2">
                                <label class="text-xs text-gray-500"
                                  >Фон:</label
                                >
                                <input
                                  type="color"
                                  v-model="item.bgColor"
                                  class="w-6 h-6 rounded cursor-pointer border-0"
                                />
                                <input
                                  v-model="item.bgColor"
                                  placeholder="transparent"
                                  class="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                              <div class="flex items-center gap-2">
                                <label class="text-xs text-gray-500"
                                  >Текст:</label
                                >
                                <input
                                  type="color"
                                  v-model="item.textColor"
                                  class="w-6 h-6 rounded cursor-pointer border-0"
                                />
                              </div>
                              <div class="flex items-center gap-2">
                                <label class="text-xs text-gray-500"
                                  >Размер текста:</label
                                >
                                <input
                                  type="number"
                                  v-model.number="item.textSize"
                                  min="10"
                                  max="300"
                                  class="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <!-- Delete Button -->
                          <button
                            @click="removeCtaItem(index)"
                            class="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p
                        v-if="!editForm.ctaItems?.length"
                        class="text-sm text-gray-500 italic text-center py-4"
                      >
                        Нет элементов. Нажмите "Добавить" чтобы создать CTA
                        элемент.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Overlays Tab -->
              <div v-if="activeTab === 'overlays'" class="space-y-5">
                <div
                  v-if="isCreating"
                  class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                >
                  <p class="text-sm text-yellow-400">
                    Сначала сохраните шаблон, затем можно добавить картинки
                  </p>
                </div>

                <template v-else>
                  <!-- Upload button -->
                  <div
                    class="border-2 border-dashed border-gray-700 rounded-xl p-4"
                  >
                    <input
                      ref="overlayInput"
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      @change="handleOverlayUpload"
                      class="hidden"
                    />
                    <button
                      @click="$refs.overlayInput.click()"
                      class="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <Upload class="w-5 h-5" />
                      <span>Загрузить картинку</span>
                    </button>
                  </div>

                  <!-- Overlays list with drag-drop -->
                  <draggable
                    v-if="editForm.overlays?.length"
                    v-model="editForm.overlays"
                    item-key="id"
                    handle=".overlay-drag-handle"
                    ghost-class="opacity-50"
                    animation="200"
                    class="space-y-3"
                    @end="onOverlayDragEnd"
                  >
                    <template #item="{ element: overlay, index }">
                      <div class="p-3 bg-gray-800/50 rounded-xl">
                        <div class="flex items-start gap-3">
                          <!-- Drag handle -->
                          <div
                            class="overlay-drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-700 rounded self-center"
                          >
                            <GripVertical class="w-4 h-4 text-gray-500" />
                          </div>
                          <img
                            :src="API_URL + '/' + overlay.imagePath"
                            class="w-16 h-16 object-contain rounded-lg bg-gray-700 shrink-0"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-2">
                              <span
                                class="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded"
                                >z:{{ index + 1 }}</span
                              >
                              <input
                                v-model="overlay.name"
                                @change="updateOverlay(overlay)"
                                class="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              />
                              <button
                                @click="deleteOverlay(overlay.id)"
                                class="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 class="w-4 h-4" />
                              </button>
                            </div>

                            <!-- Position & Size -->
                            <div class="grid grid-cols-5 gap-2 mb-2">
                              <div>
                                <label
                                  class="block text-xs text-gray-500 mb-0.5"
                                  >X (%)</label
                                >
                                <input
                                  type="number"
                                  v-model.number="overlay.positionX"
                                  @change="updateOverlay(overlay)"
                                  min="0"
                                  max="100"
                                  class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                              <div>
                                <label
                                  class="block text-xs text-gray-500 mb-0.5"
                                  >Y (%)</label
                                >
                                <input
                                  type="number"
                                  v-model.number="overlay.positionY"
                                  @change="updateOverlay(overlay)"
                                  min="0"
                                  max="100"
                                  class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                              <div>
                                <label
                                  class="block text-xs text-gray-500 mb-0.5"
                                  >Якорь</label
                                >
                                <select
                                  v-model="overlay.anchor"
                                  @change="updateOverlay(overlay)"
                                  class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                >
                                  <option value="center">Центр</option>
                                  <option value="top-left">↖ Лево</option>
                                  <option value="top-center">↑ Верх</option>
                                  <option value="top-right">↗ Право</option>
                                  <option value="bottom-left">↙ Лево</option>
                                  <option value="bottom-center">↓ Низ</option>
                                  <option value="bottom-right">↘ Право</option>
                                </select>
                              </div>
                              <div>
                                <label
                                  class="block text-xs text-gray-500 mb-0.5"
                                  >Ширина (%)</label
                                >
                                <input
                                  type="number"
                                  v-model.number="overlay.width"
                                  @change="updateOverlay(overlay)"
                                  min="1"
                                  max="100"
                                  class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                              <div>
                                <label
                                  class="block text-xs text-gray-500 mb-0.5"
                                  >Прозрачность</label
                                >
                                <input
                                  type="number"
                                  v-model.number="overlay.opacity"
                                  @change="updateOverlay(overlay)"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                                />
                              </div>
                            </div>

                            <!-- Appearance Config -->
                            <div class="flex items-center gap-3 text-xs">
                              <label
                                class="flex items-center gap-1 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  v-model="overlay.appearanceConfig.intro.show"
                                  @change="updateOverlay(overlay)"
                                  class="w-3 h-3 rounded"
                                />
                                <span class="text-gray-400">Интро</span>
                              </label>
                              <label
                                class="flex items-center gap-1 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  v-model="
                                    overlay.appearanceConfig.segments.show
                                  "
                                  @change="updateOverlay(overlay)"
                                  class="w-3 h-3 rounded"
                                />
                                <span class="text-gray-400">Сегменты</span>
                              </label>
                              <label
                                class="flex items-center gap-1 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  v-model="overlay.appearanceConfig.outro.show"
                                  @change="updateOverlay(overlay)"
                                  class="w-3 h-3 rounded"
                                />
                                <span class="text-gray-400">Аутро</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </template>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center gap-3 p-4 border-t border-gray-800 shrink-0"
            >
              <button
                @click="saveTemplate"
                :disabled="saving || !editForm.name"
                class="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                <span>{{ isCreating ? "Создать" : "Сохранить" }}</span>
              </button>

              <button
                v-if="selectedTemplate && !selectedTemplate.isDefault"
                @click="setAsDefault"
                class="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl text-yellow-400 text-sm transition-colors"
              >
                <Star class="w-4 h-4" />
                <span>По умолчанию</span>
              </button>

              <button
                v-if="selectedTemplate"
                @click="deleteTemplate"
                class="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 text-sm transition-colors ml-auto"
              >
                <Trash2 class="w-4 h-4" />
                <span>Удалить</span>
              </button>
            </div>
          </div>

          <!-- Preview Panel -->
          <div
            v-if="selectedTemplate || isCreating"
            class="w-72 border-l border-gray-800 p-4 overflow-y-auto shrink-0"
          >
            <h3 class="text-sm font-medium text-gray-400 mb-3">Превью</h3>
            <div
              class="aspect-[9/16] rounded-xl overflow-hidden relative"
              :style="{ backgroundColor: editForm.backgroundColor }"
            >
              <!-- Preview background -->
              <div
                class="absolute inset-0 bg-gradient-to-b from-gray-700/50 to-gray-900/50"
              />

              <!-- Progress bar - z-index: 10 -->
              <div
                v-if="editForm.showProgressBar"
                class="absolute left-0 right-0"
                :class="
                  editForm.progressBarPosition === 'top' ? 'top-0' : 'bottom-0'
                "
                :style="{
                  height:
                    Math.max(
                      1,
                      Math.round(editForm.progressBarHeight * PREVIEW_SCALE),
                    ) + 'px',
                  background: `linear-gradient(to right, ${editForm.progressBarColor || editForm.primaryColor} 60%, rgba(255,255,255,0.2) 60%)`,
                  zIndex: 10,
                }"
              />

              <!-- Number badge - z-index: 10 -->
              <div
                v-if="editForm.showNumbers"
                class="absolute"
                :class="getNumberPositionClass()"
                :style="{ ...getNumberCustomPosition(), zIndex: 10 }"
              >
                <div
                  class="flex items-center justify-center text-white font-bold whitespace-nowrap"
                  :class="getNumberStyleClass()"
                  :style="{
                    backgroundColor:
                      editForm.numberStyle === 'minimal'
                        ? 'transparent'
                        : editForm.numberBgColor || editForm.primaryColor,
                    color: editForm.numberFontColor,
                    fontSize:
                      Math.round(editForm.numberFontSize * PREVIEW_SCALE) +
                      'px',
                    padding:
                      editForm.numberTemplate === '{num}'
                        ? undefined
                        : '4px 8px',
                    minWidth:
                      editForm.numberTemplate === '{num}' ? '28px' : undefined,
                    minHeight:
                      editForm.numberTemplate === '{num}' ? '28px' : undefined,
                  }"
                >
                  {{
                    editForm.numberTemplate.replace(
                      "{num}",
                      editForm.numberDirection === "desc" ? "5" : "1",
                    )
                  }}
                </div>
              </div>

              <!-- Subtitles preview -->
              <!-- Subtitles preview - z-index: 10 -->
              <div
                class="absolute left-2 right-2"
                :style="{ ...getSubtitlePosition(), zIndex: 10 }"
              >
                <div
                  class="text-center py-1 px-2 rounded-lg"
                  :style="{
                    fontFamily: `'${editForm.subtitleFontFamily}', sans-serif`,
                    fontWeight: editForm.subtitleFontWeight,
                    fontSize:
                      Math.round(editForm.subtitleFontSize * PREVIEW_SCALE) +
                      'px',
                    color: editForm.subtitleFontColor,
                    backgroundColor: editForm.subtitleBgEnabled
                      ? editForm.subtitleBgColor
                      : 'transparent',
                    width: editForm.subtitleWidth + '%',
                    margin: '0 auto',
                    ...getSubtitleStrokeStyle(),
                  }"
                >
                  <!-- Превью в зависимости от режима субтитров -->
                  <template v-if="editForm.subtitleMode === 'word'">
                    <span :style="{ color: editForm.subtitleHighlightColor }"
                      >Слово</span
                    >
                  </template>
                  <template v-else-if="editForm.subtitleMode === 'phrase'">
                    <span>...</span
                    ><template
                      v-for="(item, idx) in phrasePreviewWords"
                      :key="idx"
                      ><span
                        :style="
                          item.highlight
                            ? { color: editForm.subtitleHighlightColor }
                            : {}
                        "
                        >{{ item.word }}</span
                      ></template
                    ><span>...</span>
                  </template>
                  <template v-else>
                    <span>Слоны — </span>
                    <span :style="{ color: editForm.subtitleHighlightColor }"
                      >единственные</span
                    >
                    <span style="opacity: 0.3"> животные...</span>
                  </template>
                </div>
              </div>

              <!-- CTA preview - z-index: 10 -->
              <div
                v-if="editForm.showCTA && editForm.ctaItems?.length"
                class="absolute"
                :style="{
                  left: editForm.ctaPositionX + '%',
                  top: editForm.ctaPositionY + '%',
                  transform: getAnchorTransform(editForm.ctaAnchor),
                  zIndex: 10,
                }"
              >
                <div
                  class="flex items-center"
                  :style="{
                    flexDirection:
                      editForm.ctaDirection === 'vertical' ? 'column' : 'row',
                    gap: Math.round(editForm.ctaGap * PREVIEW_SCALE) + 'px',
                  }"
                >
                  <div
                    v-for="(item, index) in editForm.ctaItems"
                    :key="index"
                    class="flex items-center"
                    :style="{
                      flexDirection:
                        item.textPosition === 'left'
                          ? 'row-reverse'
                          : item.textPosition === 'top'
                            ? 'column-reverse'
                            : item.textPosition === 'bottom'
                              ? 'column'
                              : 'row',
                      gap: '2px',
                      backgroundColor:
                        item.bgColor === 'transparent'
                          ? 'transparent'
                          : item.bgColor,
                      padding: item.bgColor !== 'transparent' ? '2px 4px' : '0',
                      borderRadius: '2px',
                    }"
                  >
                    <!-- Icon/Image -->
                    <span
                      v-if="item.imagePath"
                      class="flex items-center justify-center"
                    >
                      <img
                        :src="API_URL + '/' + item.imagePath"
                        :style="{
                          width:
                            Math.round(item.imageSize * PREVIEW_SCALE) + 'px',
                          height:
                            Math.round(item.imageSize * PREVIEW_SCALE) + 'px',
                          objectFit: 'contain',
                        }"
                      />
                    </span>
                    <span
                      v-else
                      :style="{
                        fontSize:
                          Math.round(item.iconSize * PREVIEW_SCALE) + 'px',
                        lineHeight: 1,
                      }"
                      >{{ item.icon || "❓" }}</span
                    >
                    <!-- Text -->
                    <span
                      v-if="item.text"
                      :style="{
                        color: item.textColor,
                        fontSize:
                          Math.round((item.textSize || 18) * PREVIEW_SCALE) +
                          'px',
                        whiteSpace: 'nowrap',
                      }"
                      >{{ item.text }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Overlays preview - z-index: 1 (над фоном, но под UI) -->
              <div
                v-for="overlay in editForm.overlays"
                :key="overlay.id"
                class="absolute"
                :style="{
                  left: overlay.positionX + '%',
                  top: overlay.positionY + '%',
                  width: overlay.width + '%',
                  opacity: overlay.opacity,
                  transform: getAnchorTransform(overlay.anchor),
                  zIndex: 1,
                }"
              >
                <img
                  :src="API_URL + '/' + overlay.imagePath"
                  class="w-full h-auto"
                />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="flex-1 flex items-center justify-center p-8">
            <div class="text-center">
              <Palette class="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-400 mb-2">
                Выберите шаблон
              </h3>
              <p class="text-sm text-gray-500 mb-4">
                или создайте новый для начала работы
              </p>
              <button
                @click="createNewTemplate"
                class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm transition-colors"
              >
                <Plus class="w-4 h-4" />
                <span>Новый шаблон</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  defineComponent,
  h,
} from "vue";
import {
  X,
  Plus,
  Loader2,
  Star,
  Palette,
  Paintbrush,
  Type,
  Hash,
  BarChart3,
  MousePointerClick,
  Image,
  Save,
  Trash2,
  Upload,
  GripVertical,
  Settings,
  Layers,
} from "lucide-vue-next";
import draggable from "vuedraggable";
import { templatesApi, youtubeApi } from "../api";

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close"]);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Preview scale: превью ~340px высотой, видео 1920px → 340/1920 ≈ 0.177
const PREVIEW_SCALE = 0.177;

// State
const loading = ref(false);

// Computed: описание режима субтитров
const subtitleModeDescription = computed(() => {
  switch (editForm.subtitleMode) {
    case "word":
      return "Показывается только текущее слово";
    case "phrase":
      return `По ${editForm.subtitlePhraseLength} слов за раз`;
    case "karaoke":
    default:
      return "Слова появляются по очереди";
  }
});

// Пример фразы для превью в зависимости от phraseLength
const PHRASE_WORDS = [
  "которые",
  "не",
  "умеют",
  "прыгать",
  "вообще",
  "никогда",
  "совсем",
  "абсолютно",
  "точно",
  "факт",
];
const phrasePreviewWords = computed(() => {
  const len = editForm.subtitlePhraseLength || 4;
  const words = PHRASE_WORDS.slice(0, len);
  // Подсвечиваем слово в середине
  const highlightIndex = Math.floor(len / 2);
  return words.map((word, i) => ({
    word: i < words.length - 1 ? word + " " : word, // Пробел после каждого слова кроме последнего
    highlight: i === highlightIndex,
  }));
});

const saving = ref(false);
const templates = ref([]);
const channels = ref([]);
const fonts = ref([]);
const animations = ref([]);
const selectedTemplate = ref(null);
const isCreating = ref(false);
const activeTab = ref("general");

// Tabs configuration
const tabs = [
  { id: "general", label: "Основное", icon: Settings },
  { id: "subtitles", label: "Субтитры", icon: Type },
  { id: "numbers", label: "Нумерация", icon: Hash },
  { id: "progress", label: "Прогресс", icon: BarChart3 },
  { id: "cta", label: "CTA", icon: MousePointerClick },
  { id: "overlays", label: "Оверлеи", icon: Layers },
];

// Edit form - matches new schema
const editForm = reactive({
  name: "",
  channelId: null,
  isDefault: false,
  primaryColor: "#8B5CF6",
  backgroundColor: "#000000",
  // Subtitles
  subtitleMode: "karaoke",
  subtitlePhraseLength: 4,
  subtitlePositionX: 50,
  subtitlePositionY: 80,
  subtitlePositionPreset: "bottom",
  subtitleWidth: 90,
  subtitleFontFamily: "Inter",
  subtitleFontWeight: "600",
  subtitleFontSize: 28,
  subtitleFontColor: "#FFFFFF",
  subtitleHighlightColor: "#FFD700",
  subtitleStrokeEnabled: false,
  subtitleStrokeColor: "#000000",
  subtitleStrokeWidth: 2,
  subtitleBgColor: "rgba(0,0,0,0.7)",
  subtitleBgEnabled: true,
  // Numbers
  showNumbers: true,
  numberPositionX: 5,
  numberPositionY: 5,
  numberPositionPreset: "top-left",
  numberStyle: "badge",
  numberBgColor: null,
  numberFontColor: "#FFFFFF",
  numberFontSize: 24,
  numberTemplate: "{num}",
  numberDirection: "asc",
  numberAnchor: "top-left",
  // Progress bar
  showProgressBar: true,
  progressBarPosition: "bottom",
  progressBarColor: null,
  progressBarHeight: 4,
  // CTA
  showCTA: true,
  ctaPositionX: 50,
  ctaPositionY: 92,
  ctaAnchor: "center",
  ctaDirection: "horizontal",
  ctaGap: 8,
  ctaItems: [],
  // Overlays
  overlays: [],
});

// ColorPicker component
const ColorPicker = defineComponent({
  props: {
    modelValue: String,
    label: String,
    nullable: Boolean,
    placeholder: String,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("div", [
        h(
          "label",
          { class: "block text-sm text-gray-400 mb-1.5" },
          props.label,
        ),
        h("div", { class: "flex items-center gap-2" }, [
          h("input", {
            type: "color",
            value: props.modelValue || "#8B5CF6",
            onInput: (e) => emit("update:modelValue", e.target.value),
            class: "w-8 h-8 rounded cursor-pointer border-0 shrink-0",
          }),
          h("input", {
            value: props.modelValue || "",
            onInput: (e) => emit("update:modelValue", e.target.value || null),
            placeholder: props.placeholder || "",
            class:
              "flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs",
          }),
        ]),
      ]);
  },
});

// Methods
async function loadData() {
  loading.value = true;
  try {
    const [templatesRes, channelsRes, fontsRes, animationsRes] =
      await Promise.all([
        templatesApi.getAll(),
        youtubeApi.getChannels(),
        templatesApi.getFonts(),
        templatesApi.getAnimations(),
      ]);
    templates.value = templatesRes.data.templates || [];
    channels.value = channelsRes.data.channels || [];
    fonts.value = fontsRes.data.fonts || [];
    animations.value = animationsRes.data.animations || [];
  } catch (error) {
    console.error("Failed to load data:", error);
  } finally {
    loading.value = false;
  }
}

function selectTemplate(template) {
  selectedTemplate.value = template;
  isCreating.value = false;
  Object.assign(editForm, {
    name: template.name,
    channelId: template.channelId,
    isDefault: template.isDefault,
    primaryColor: template.primaryColor,
    backgroundColor: template.backgroundColor,
    subtitleMode: template.subtitleMode,
    subtitlePhraseLength: template.subtitlePhraseLength ?? 4,
    subtitlePositionX: template.subtitlePositionX,
    subtitlePositionY: template.subtitlePositionY,
    subtitlePositionPreset: template.subtitlePositionPreset,
    subtitleWidth: template.subtitleWidth,
    subtitleFontFamily: template.subtitleFontFamily,
    subtitleFontWeight: template.subtitleFontWeight,
    subtitleFontSize: template.subtitleFontSize,
    subtitleFontColor: template.subtitleFontColor,
    subtitleHighlightColor: template.subtitleHighlightColor,
    subtitleStrokeEnabled: template.subtitleStrokeEnabled ?? false,
    subtitleStrokeColor: template.subtitleStrokeColor ?? "#000000",
    subtitleStrokeWidth: template.subtitleStrokeWidth ?? 2,
    subtitleBgColor: template.subtitleBgColor,
    subtitleBgEnabled: template.subtitleBgEnabled,
    showNumbers: template.showNumbers,
    numberPositionX: template.numberPositionX,
    numberPositionY: template.numberPositionY,
    numberPositionPreset: template.numberPositionPreset,
    numberStyle: template.numberStyle,
    numberBgColor: template.numberBgColor,
    numberFontColor: template.numberFontColor,
    numberFontSize: template.numberFontSize,
    numberTemplate: template.numberTemplate ?? "{num}",
    numberDirection: template.numberDirection ?? "asc",
    numberAnchor: template.numberAnchor ?? "top-left",
    showProgressBar: template.showProgressBar,
    progressBarPosition: template.progressBarPosition,
    progressBarColor: template.progressBarColor,
    progressBarHeight: template.progressBarHeight,
    showCTA: template.showCTA,
    ctaPositionX: template.ctaPositionX,
    ctaPositionY: template.ctaPositionY,
    ctaAnchor: template.ctaAnchor ?? "center",
    ctaDirection: template.ctaDirection,
    ctaGap: template.ctaGap,
    ctaItems: template.ctaItems || [],
    overlays: template.overlays || [],
  });
}

function createNewTemplate() {
  selectedTemplate.value = null;
  isCreating.value = true;
  activeTab.value = "general";
  Object.assign(editForm, {
    name: "Новый шаблон",
    channelId: null,
    isDefault: false,
    primaryColor: "#8B5CF6",
    backgroundColor: "#000000",
    subtitleMode: "karaoke",
    subtitlePhraseLength: 4,
    subtitlePositionX: 50,
    subtitlePositionY: 80,
    subtitlePositionPreset: "bottom",
    subtitleWidth: 90,
    subtitleFontFamily: "Inter",
    subtitleFontWeight: "600",
    subtitleFontSize: 28,
    subtitleFontColor: "#FFFFFF",
    subtitleHighlightColor: "#FFD700",
    subtitleStrokeEnabled: false,
    subtitleStrokeColor: "#000000",
    subtitleStrokeWidth: 2,
    subtitleBgColor: "rgba(0,0,0,0.7)",
    subtitleBgEnabled: true,
    showNumbers: true,
    numberPositionX: 5,
    numberPositionY: 5,
    numberPositionPreset: "top-left",
    numberStyle: "badge",
    numberBgColor: null,
    numberFontColor: "#FFFFFF",
    numberFontSize: 24,
    numberTemplate: "{num}",
    numberDirection: "asc",
    numberAnchor: "top-left",
    showProgressBar: true,
    progressBarPosition: "bottom",
    progressBarColor: null,
    progressBarHeight: 4,
    showCTA: true,
    ctaPositionX: 50,
    ctaPositionY: 92,
    ctaAnchor: "center",
    ctaDirection: "horizontal",
    ctaGap: 8,
    ctaItems: [],
    overlays: [],
  });
}

async function saveTemplate() {
  saving.value = true;
  try {
    const data = { ...editForm };
    delete data.overlays;

    // Сохраняем текущие overlays перед обновлением
    const currentOverlays = [...editForm.overlays];

    if (isCreating.value) {
      const res = await templatesApi.create(data);
      templates.value.unshift(res.data.template);
      selectTemplate(res.data.template);
    } else {
      const res = await templatesApi.update(selectedTemplate.value.id, data);
      const index = templates.value.findIndex(
        (t) => t.id === selectedTemplate.value.id,
      );
      if (index !== -1) {
        templates.value[index] = res.data.template;
      }
      selectTemplate(res.data.template);
      // Восстанавливаем overlays с правильным порядком (они уже были обновлены через drag-drop)
      editForm.overlays = currentOverlays;
    }
  } catch (error) {
    console.error("Failed to save template:", error);
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate() {
  if (!confirm("Удалить этот шаблон?")) return;
  try {
    await templatesApi.delete(selectedTemplate.value.id);
    templates.value = templates.value.filter(
      (t) => t.id !== selectedTemplate.value.id,
    );
    selectedTemplate.value = null;
    isCreating.value = false;
  } catch (error) {
    console.error("Failed to delete template:", error);
  }
}

async function setAsDefault() {
  try {
    await templatesApi.setDefault(selectedTemplate.value.id);
    templates.value.forEach(
      (t) => (t.isDefault = t.id === selectedTemplate.value.id),
    );
    selectedTemplate.value.isDefault = true;
  } catch (error) {
    console.error("Failed to set default:", error);
  }
}

// CTA Items
const ctaIconInputs = ref({});

function addCtaItem() {
  editForm.ctaItems.push({
    icon: "🔔",
    iconSize: 64,
    imageSize: 120,
    imagePath: null,
    text: "",
    textPosition: "right",
    textSize: 18,
    bgColor: "transparent",
    textColor: "#FFFFFF",
  });
}

function removeCtaItem(index) {
  const item = editForm.ctaItems[index];
  // If has image, delete it from server
  if (item.imagePath) {
    templatesApi.deleteCtaIcon(item.imagePath).catch(console.error);
  }
  editForm.ctaItems.splice(index, 1);
}

async function handleCtaIconUpload(event, index) {
  const file = event.target.files[0];
  console.log("[CTA] Upload triggered, file:", file, "index:", index);
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("icon", file);
    console.log("[CTA] Uploading icon...");
    const result = await templatesApi.uploadCtaIcon(formData);
    console.log("[CTA] Upload result:", result.data);

    // Update item
    editForm.ctaItems[index].imagePath = result.data.path;
    editForm.ctaItems[index].icon = ""; // Clear emoji when image is set
    console.log("[CTA] Updated item:", editForm.ctaItems[index]);
  } catch (error) {
    console.error("Failed to upload CTA icon:", error);
  }

  // Clear input
  event.target.value = "";
}

async function removeCtaIconImage(index) {
  const item = editForm.ctaItems[index];
  if (item.imagePath) {
    try {
      await templatesApi.deleteCtaIcon(item.imagePath);
      item.imagePath = null;
      item.icon = "🔔"; // Restore default emoji
    } catch (error) {
      console.error("Failed to delete CTA icon:", error);
    }
  }
}

// Overlays
const overlayInput = ref(null);

async function handleOverlayUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("name", file.name);

  try {
    const res = await templatesApi.addOverlay(
      selectedTemplate.value.id,
      formData,
    );
    editForm.overlays.push(res.data.overlay);
  } catch (error) {
    console.error("Failed to upload overlay:", error);
  }
  event.target.value = "";
}

async function updateOverlay(overlay) {
  try {
    await templatesApi.updateOverlay(
      selectedTemplate.value.id,
      overlay.id,
      overlay,
    );
  } catch (error) {
    console.error("Failed to update overlay:", error);
  }
}

// Обновление порядка оверлеев после drag-drop
async function onOverlayDragEnd() {
  // Обновляем order для каждого оверлея согласно новой позиции
  for (let i = 0; i < editForm.overlays.length; i++) {
    editForm.overlays[i].order = i;
    try {
      await templatesApi.updateOverlay(
        selectedTemplate.value.id,
        editForm.overlays[i].id,
        { order: i },
      );
    } catch (error) {
      console.error("Failed to update overlay order:", error);
    }
  }
}

async function deleteOverlay(overlayId) {
  if (!confirm("Удалить эту картинку?")) return;
  try {
    await templatesApi.deleteOverlay(selectedTemplate.value.id, overlayId);
    editForm.overlays = editForm.overlays.filter((o) => o.id !== overlayId);
  } catch (error) {
    console.error("Failed to delete overlay:", error);
  }
}

// Preview helpers
function getNumberPositionClass() {
  if (!editForm.numberPositionPreset) return "";
  const classes = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };
  return classes[editForm.numberPositionPreset] || "";
}

function getAnchorTransform(anchor) {
  const transforms = {
    center: "translate(-50%, -50%)",
    "top-left": "translate(0%, 0%)",
    "top-center": "translate(-50%, 0%)",
    "top-right": "translate(-100%, 0%)",
    "bottom-left": "translate(0%, -100%)",
    "bottom-center": "translate(-50%, -100%)",
    "bottom-right": "translate(-100%, -100%)",
  };
  return transforms[anchor] || "translate(0%, 0%)";
}

function getNumberCustomPosition() {
  if (editForm.numberPositionPreset) return {};
  return {
    left: editForm.numberPositionX + "%",
    top: editForm.numberPositionY + "%",
    transform: getAnchorTransform(editForm.numberAnchor),
  };
}

function getNumberStyleClass() {
  const styles = {
    badge: "rounded-full px-2",
    square: "rounded-md",
    minimal: "",
  };
  return styles[editForm.numberStyle] || "rounded-full px-2";
}

function getSubtitlePosition() {
  if (editForm.subtitlePositionPreset === "top") return { top: "10%" };
  if (editForm.subtitlePositionPreset === "center")
    return { top: "50%", transform: "translateY(-50%)" };
  if (editForm.subtitlePositionPreset === "bottom") return { bottom: "15%" };
  return {
    top: editForm.subtitlePositionY + "%",
    transform: "translateY(-50%)",
  };
}

function getSubtitleStrokeStyle() {
  if (!editForm.subtitleStrokeEnabled) return {};
  const w = Math.max(
    1,
    Math.round((editForm.subtitleStrokeWidth || 2) * PREVIEW_SCALE),
  );
  const c = editForm.subtitleStrokeColor || "#000000";
  // Используем text-shadow для создания обводки (работает лучше чем -webkit-text-stroke)
  return {
    textShadow: `
      -${w}px -${w}px 0 ${c},
       ${w}px -${w}px 0 ${c},
      -${w}px  ${w}px 0 ${c},
       ${w}px  ${w}px 0 ${c},
       0px -${w}px 0 ${c},
       0px  ${w}px 0 ${c},
      -${w}px  0px 0 ${c},
       ${w}px  0px 0 ${c}
    `,
  };
}

function close() {
  emit("close");
}

// Watcher для синхронизации preset с positionX/positionY для субтитров
watch(
  () => editForm.subtitlePositionPreset,
  (preset) => {
    if (preset === "top") {
      editForm.subtitlePositionX = 50;
      editForm.subtitlePositionY = 10;
    } else if (preset === "center") {
      editForm.subtitlePositionX = 50;
      editForm.subtitlePositionY = 50;
    } else if (preset === "bottom") {
      editForm.subtitlePositionX = 50;
      editForm.subtitlePositionY = 85;
    }
    // Если preset = null (своя позиция), не меняем координаты
  },
);

// Watcher для синхронизации preset с positionX/positionY для номеров
watch(
  () => editForm.numberPositionPreset,
  (preset) => {
    if (preset === "top-left") {
      editForm.numberPositionX = 8;
      editForm.numberPositionY = 8;
    } else if (preset === "top-right") {
      editForm.numberPositionX = 92;
      editForm.numberPositionY = 8;
    } else if (preset === "bottom-left") {
      editForm.numberPositionX = 8;
      editForm.numberPositionY = 92;
    } else if (preset === "bottom-right") {
      editForm.numberPositionX = 92;
      editForm.numberPositionY = 92;
    }
    // Если preset = null (своя позиция), не меняем координаты
  },
);

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      loadData();
    }
  },
);

onMounted(() => {
  if (props.isOpen) {
    loadData();
  }
});
</script>

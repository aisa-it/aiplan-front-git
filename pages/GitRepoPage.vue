<template>
  <q-page class="git-repo-page q-pa-md">
    <!-- Main Content Area: File Browser OR File Viewer -->
    <q-card flat bordered class="q-mb-md">
      <!-- Header Section with Stats and Actions -->
      <q-card-section class="q-pb-sm q-pt-sm">
        <div class="row items-center justify-between flex-wrap gap-sm">
          <div class="row items-center">
            <q-icon :name="selectedFile ? 'insert_drive_file' : 'folder_open'" class="q-mr-sm" />
            <span class="text-subtitle1">{{ selectedFile ? selectedFile.name : 'Файлы' }}</span>

            <!-- Back Button (only when viewing file) -->
            <q-btn
              v-if="selectedFile"
              flat
              dense
              no-caps
              icon="arrow_back"
              label="Назад к файлам"
              class="q-ml-md"
              @click="closeFileViewer"
            />
          </div>
          <div class="row items-center flex-wrap stats-actions">
            <div v-if="repoStore.currentRepoInfo" class="row items-center stats-row">
              <div class="stat-item">
                <span class="stat-label">Веток:</span>
                <span class="stat-value">{{ repoStore.currentRepoInfo.branches_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Комитов:</span>
                <span class="stat-value">{{ repoStore.currentRepoInfo.commits_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Размер:</span>
                <span class="stat-value">{{ formatBytes(repoStore.currentRepoInfo.size) }}</span>
              </div>
              <div
                class="stat-item"
                v-if="repoStore.currentRepoInfo.last_commit"
              >
                <span class="stat-label">Последний:</span>
                <span class="stat-value">
                  {{ shortenSha(repoStore.currentRepoInfo.last_commit.sha) }},
                  {{ formatRelativeTime(repoStore.currentRepoInfo.last_commit.author.date) }}
                </span>
              </div>
            </div>

            <q-btn
              flat
              dense
              no-caps
              class="primary-btn-sm clone-btn q-ml-sm q-mt-xs"
              :loading="loadingConfig"
              aria-haspopup="menu"
              @click="onCloneClick"
            >
              <q-icon name="content_copy" size="18px" class="q-mr-xs" />
              <span>Clone</span>
              <q-menu
                v-if="!loadingConfig"
                ref="cloneMenuRef"
                anchor="bottom right"
                self="top right"
                @show="ensureCloneReady"
              >
                <q-list :style="$q.screen.lt.sm ? 'min-width: 250px; max-width: 90vw' : 'min-width: 450px'">
                  <q-item>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">HTTP</q-item-label>
                      <q-item-label
                        caption
                        class="text-grey-7 text-body2"
                        :style="$q.screen.lt.sm
                          ? 'white-space: normal; word-break: break-all; max-width: calc(90vw - 80px); overflow-wrap: anywhere;'
                          : 'white-space: normal; word-break: break-all;'"
                    >
                      {{ httpCloneUrl }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      icon="content_copy"
                      color="primary"
                      @click.stop="handleCopyLink(httpCloneUrl)"
                    >
                      <q-tooltip>Скопировать HTTP URL</q-tooltip>
                    </q-btn>
                  </q-item-section>
                  </q-item>

                  <q-separator />

                  <q-item :disable="!gitConfigStore.sshEnabled">
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        SSH
                        <q-badge v-if="!gitConfigStore.sshEnabled" color="grey" label="Disabled" class="q-ml-sm" />
                      </q-item-label>
                      <q-item-label
                        caption
                        class="text-grey-7 text-body2"
                        :style="$q.screen.lt.sm
                          ? 'white-space: normal; word-break: break-all; max-width: calc(90vw - 80px); overflow-wrap: anywhere;'
                          : 'white-space: normal; word-break: break-all;'"
                    >
                      {{ sshCloneUrl }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      icon="content_copy"
                      color="primary"
                      :disable="!gitConfigStore.sshEnabled"
                      @click.stop="handleCopyLink(sshCloneUrl)"
                    >
                      <q-tooltip>Скопировать SSH URL</q-tooltip>
                    </q-btn>
                  </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Content Section: File Browser OR File Viewer -->
      <q-card-section class="q-pa-md">
        <transition name="fade-slide" mode="out-in">
          <!-- File Browser (default view) -->
          <GitFileBrowser
            v-if="!selectedFile"
            key="browser"
            :workspace-slug="workspaceSlug"
            :repo-name="repoName"
            :initial-branch="repoStore.currentRepoInfo?.default_branch"
            @file-selected="onFileSelected"
          />

          <!-- File Viewer (when file is selected) -->
          <GitFileViewer
            v-else
            key="viewer"
            :workspace-slug="workspaceSlug"
            :repo-name="repoName"
            :file-path="selectedFile.path"
            :git-ref="selectedFile.branch"
            @close="closeFileViewer"
          />
        </transition>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import { useGitConfigStore } from '../stores/git-config-store';
import { formatBytes, formatRelativeTime, shortenSha } from '../utils/format';
import GitFileBrowser from '../components/GitFileBrowser.vue';
import GitFileViewer from '../components/GitFileViewer.vue';

const route = useRoute();
const $q = useQuasar();
const repoStore = useGitRepositoryStore();
const gitConfigStore = useGitConfigStore();

const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);

const loadingConfig = ref(false);
const cloneMenuRef = ref<any>(null);

// Состояние для просмотра файлов (используется для условного рендеринга)
const selectedFile = ref<{ path: string; branch: string; name: string } | null>(null);

/**
 * HTTP clone URL
 */
const httpCloneUrl = computed(() => {
  const host = window.location.host;
  return `http://${host}/${workspaceSlug.value}/${repoName.value}.git`;
});

/**
 * SSH clone URL
 */
const sshCloneUrl = computed(() => {
  if (!gitConfigStore.sshEnabled) {
    return 'SSH не настроен';
  }

  const host = gitConfigStore.sshHost || window.location.hostname;
  const port = gitConfigStore.sshPort || 22222;

  return `ssh://git@${host}:${port}/${workspaceSlug.value}/${repoName.value}.git`;
});

/**
 * Копирует текст в буфер обмена
 * Использует современный Clipboard API с fallback для старых браузеров
 */
async function copyToClipboard(text: string): Promise<void> {
  // Попытка использовать современный Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      $q.notify({
        type: 'positive',
        message: 'URL скопирован в буфер обмена',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
      });
      return;
    } catch (error) {
      console.error('[GitRepoPage] Clipboard API failed, trying fallback:', error);
      // Fallback to execCommand if Clipboard API fails
      fallbackCopyTextToClipboard(text);
      return;
    }
  }

  // Fallback для старых браузеров или HTTP context
  fallbackCopyTextToClipboard(text);
}

/**
 * Копирует ссылку и закрывает меню
 */
async function handleCopyLink(url: string): Promise<void> {
  await copyToClipboard(url);
  cloneMenuRef.value?.hide();
}

/**
 * Fallback метод для копирования текста через execCommand
 * Используется для старых браузеров или когда Clipboard API недоступен
 */
function fallbackCopyTextToClipboard(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Скрываем textarea за пределами viewport
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.setAttribute('readonly', '');

  document.body.appendChild(textArea);

  try {
    // Для iOS требуется особая обработка
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }

    const successful = document.execCommand('copy');

    if (successful) {
      $q.notify({
        type: 'positive',
        message: 'URL скопирован в буфер обмена',
        icon: 'check_circle',
        position: 'top',
        timeout: 2000,
      });
    } else {
      throw new Error('execCommand("copy") returned false');
    }
  } catch (error) {
    console.error('[GitRepoPage] Fallback copy failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось скопировать в буфер обмена',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    document.body.removeChild(textArea);
  }
}

/**
 * Обработчик клика на кнопку Clone
 * Загружает SSH конфигурацию если еще не загружена
 */
async function ensureCloneReady(): Promise<void> {
  if (!gitConfigStore.sshConfigLoaded) {
    loadingConfig.value = true;
    try {
      await gitConfigStore.fetchSSHConfig();
    } catch (error) {
      console.error('Failed to fetch SSH config:', error);
    } finally {
      loadingConfig.value = false;
    }
  }
}

async function onCloneClick(): Promise<void> {
  await ensureCloneReady();
}

/**
 * Обработчик выбора файла из GitFileBrowser
 * Переключает вид с браузера на просмотр файла
 */
function onFileSelected(file: { path: string; branch: string; name: string }): void {
  selectedFile.value = file;
}

/**
 * Возврат к списку файлов (закрыть просмотр файла)
 */
function closeFileViewer(): void {
  selectedFile.value = null;
}

/**
 * Загружает информацию о репозитории при монтировании компонента
 */
onMounted(async () => {
  try {
    await repoStore.fetchRepoInfo(workspaceSlug.value, repoName.value);
  } catch (error) {
    console.error('Failed to load repository info:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить информацию о репозитории',
      icon: 'error',
      position: 'top',
    });
  }

  // Предзагружаем SSH конфиг, чтобы меню Clone открывалось с первого клика
  if (!gitConfigStore.sshConfigLoaded) {
    try {
      await gitConfigStore.fetchSSHConfig();
    } catch (error) {
      console.error('Failed to preload SSH config:', error);
    }
  }
});
</script>

<style lang="scss" scoped>
.git-repo-page {
  // Стили для страницы репозитория
}

.repo-info-card {
  .q-card__section {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .q-item {
    min-height: 38px;
  }

  .q-item__section--avatar {
    padding-right: 8px;
  }
}

.repo-info-list {
  padding-top: 4px;
  padding-bottom: 4px;
}

.stats-row {
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;

  .stat-label {
    color: #6b7280;
  }

.stat-value {
    color: #111827;
    font-weight: 600;
  }
}

.stats-actions {
  gap: 12px;
}

.clone-btn {
  border-radius: 12px;
  padding: 0 18px;
  color: #fff;
}

// Transition анимации для переключения между Browser и Viewer
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// Responsive дизайн для мобильных устройств
@media (max-width: 600px) {
  .stats-row {
    display: none; // Скрываем статистику на мобильных для экономии места
  }

  .stat-item {
    font-size: 12px;
  }
}
</style>

<template>
  <q-page class="git-repo-page q-pa-md">
    <!-- Header with Repository Name and Clone Button -->
    <div class="row items-center justify-between q-mb-md">
      <div class="col-auto">
        <div class="text-h5 q-mb-xs">
          <q-icon name="folder" size="sm" class="q-mr-sm" />
          {{ repoName }}
        </div>
        <div class="text-subtitle2 text-grey-7">
          Workspace: {{ workspaceSlug }}
        </div>
      </div>

      <div class="col-auto">
        <!-- Clone Button with Dropdown -->
        <q-btn
          color="primary"
          icon="content_copy"
          label="Clone"
          :loading="loadingConfig"
          @click="onCloneClick"
        >
          <q-menu v-if="!loadingConfig">
            <q-list :style="$q.screen.lt.sm ? 'min-width: 250px; max-width: 90vw' : 'min-width: 450px'">
              <!-- HTTP Clone URL -->
              <q-item clickable v-close-popup @click="copyToClipboard(httpCloneUrl)">
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
                  <q-icon name="content_copy" size="sm" color="primary" />
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- SSH Clone URL -->
              <q-item
                clickable
                v-close-popup
                @click="copyToClipboard(sshCloneUrl)"
                :disable="!gitConfigStore.sshEnabled"
              >
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
                  <q-icon name="content_copy" size="sm" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- Repository Information Card -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="info" class="q-mr-sm" />
          Информация о репозитории
        </div>
      </q-card-section>

      <q-separator />

      <!-- Loading State -->
      <q-card-section v-if="repoStore.loadingRepoInfo">
        <div class="row justify-center q-py-lg">
          <q-spinner color="primary" size="lg" />
        </div>
      </q-card-section>

      <!-- Error State -->
      <q-card-section v-else-if="!repoStore.currentRepoInfo">
        <q-banner class="bg-negative text-white" rounded>
          <template v-slot:avatar>
            <q-icon name="error" color="white" />
          </template>
          Не удалось загрузить информацию о репозитории
        </q-banner>
      </q-card-section>

      <!-- Repository Info -->
      <q-list v-else separator>
        <!-- Default Branch -->
        <q-item>
          <q-item-section avatar>
            <q-icon name="fork_right" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Основная ветка</q-item-label>
            <q-item-label caption class="text-body2">
              {{ repoStore.currentRepoInfo.default_branch }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Branches Count -->
        <q-item>
          <q-item-section avatar>
            <q-icon name="account_tree" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Количество веток</q-item-label>
            <q-item-label caption class="text-body2">
              {{ repoStore.currentRepoInfo.branches_count }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Commits Count -->
        <q-item>
          <q-item-section avatar>
            <q-icon name="commit" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Количество коммитов</q-item-label>
            <q-item-label caption class="text-body2">
              {{ repoStore.currentRepoInfo.commits_count }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Repository Size -->
        <q-item>
          <q-item-section avatar>
            <q-icon name="storage" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Размер репозитория</q-item-label>
            <q-item-label caption class="text-body2">
              {{ formatBytes(repoStore.currentRepoInfo.size) }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Last Commit -->
        <q-item v-if="repoStore.currentRepoInfo.last_commit">
          <q-item-section avatar>
            <q-icon name="history" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Последний коммит</q-item-label>
            <q-item-label caption class="text-body2">
              <div class="q-mb-xs">
                <q-chip
                  size="sm"
                  dense
                  color="grey-3"
                  text-color="grey-9"
                  icon="tag"
                >
                  {{ shortenSha(repoStore.currentRepoInfo.last_commit.sha) }}
                </q-chip>
              </div>
              <div class="q-mb-xs">
                {{ repoStore.currentRepoInfo.last_commit.message }}
              </div>
              <div class="text-grey-6">
                <q-icon name="person" size="xs" class="q-mr-xs" />
                {{ repoStore.currentRepoInfo.last_commit.author.name }}
                <span class="q-mx-sm">•</span>
                <q-icon name="schedule" size="xs" class="q-mr-xs" />
                {{ formatRelativeTime(repoStore.currentRepoInfo.last_commit.author.date) }}
              </div>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- File Browser -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="folder_open" class="q-mr-sm" />
          Файлы
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <GitFileBrowser
          :workspace-slug="workspaceSlug"
          :repo-name="repoName"
          :initial-branch="repoStore.currentRepoInfo?.default_branch"
          @file-selected="onFileSelected"
        />
      </q-card-section>
    </q-card>

    <!-- File Viewer -->
    <q-card v-if="selectedFile" flat bordered>
      <GitFileViewer
        :workspace-slug="workspaceSlug"
        :repo-name="repoName"
        :file-path="selectedFile.path"
        :ref="selectedFile.ref"
        @close="selectedFile = null"
      />
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
const selectedFile = ref<{ path: string; ref: string } | null>(null);

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
async function onCloneClick(): Promise<void> {
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

/**
 * Обработчик выбора файла в браузере
 */
function onFileSelected(path: string, ref: string): void {
  selectedFile.value = { path, ref };
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
});
</script>

<style lang="scss" scoped>
.git-repo-page {
  // Стили для страницы репозитория
}
</style>

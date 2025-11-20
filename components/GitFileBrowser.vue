<template>
  <div class="git-file-browser">
    <!-- Breadcrumbs and Branch Selector Header -->
    <div class="browser-header">
      <div class="header-left">
        <!-- Branch Selector Dropdown (скрыт если репозиторий пустой) -->
        <q-btn-dropdown
          v-if="!isEmptyRepository"
          v-model="branchDropdownOpen"
          :label="selectedBranch"
          :loading="loadingBranches"
          icon="fork_right"
          flat
          dense
          no-caps
          class="branch-selector"
        >
          <q-list>
            <q-item
              v-for="branch in branches"
              :key="branch.name"
              clickable
              v-close-popup
              @click="onBranchChange(branch.name)"
              :active="selectedBranch === branch.name"
            >
              <q-item-section>
                <q-item-label>{{ branch.name }}</q-item-label>
                <q-item-label v-if="branch.is_default" caption class="text-primary">
                  По умолчанию
                </q-item-label>
              </q-item-section>
              <q-item-section side v-if="selectedBranch === branch.name">
                <q-icon name="check" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <!-- Breadcrumbs Path (скрыт если репозиторий пустой) -->
        <div v-if="!isEmptyRepository" class="path-breadcrumbs">
          <span class="path-separator">/</span>
          <span class="path-part" @click="navigateToPath('')">{{ repoName }}</span>
          <template v-for="(part, index) in pathParts" :key="index">
            <span class="path-separator">/</span>
            <span
              class="path-part"
              @click="navigateToPath(pathParts.slice(0, index + 1).join('/'))"
            >
              {{ part }}
            </span>
          </template>
        </div>

        <!-- Название репозитория (показывается только для пустых репозиториев) -->
        <div v-else class="empty-repo-header">
          <q-icon name="folder_open" size="20px" color="grey-7" />
          <span class="repo-name">{{ repoName }}</span>
        </div>

        <!-- Copy Path Button (скрыт если репозиторий пустой) -->
        <q-btn
          v-if="!isEmptyRepository"
          flat
          dense
          round
          icon="content_copy"
          size="sm"
          class="copy-path-btn"
          @click="copyPath"
        >
          <q-tooltip>Скопировать путь</q-tooltip>
        </q-btn>
      </div>

      <!-- Code Button (Clone) - moved from last-commit-block -->
      <div class="header-right">
        <slot name="clone-button"></slot>
      </div>
    </div>

    <!-- Empty Repository State (новый блок) -->
    <div v-if="isEmptyRepository && !loadingBranches" class="empty-repository-container">
      <q-card flat bordered class="empty-repo-card">
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="code_off" size="80px" color="grey-5" />

          <div class="text-h5 text-weight-medium q-mt-lg q-mb-md">
            Репозиторий пустой
          </div>

          <div class="text-body1 text-grey-7 q-mb-xl">
            Этот репозиторий был только что создан. Добавьте файлы, чтобы начать работу.
          </div>

          <q-separator class="q-mb-lg" />

          <div class="instructions-section">
            <div class="text-h6 text-weight-medium q-mb-md text-left">
              Быстрый старт
            </div>

            <q-card flat bordered class="code-block q-mb-md">
              <q-card-section class="q-pa-md">
                <div class="text-caption text-grey-7 q-mb-sm">Клонируйте репозиторий:</div>
                <code class="command-line">git clone {{ cloneUrl }}</code>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="code-block q-mb-md">
              <q-card-section class="q-pa-md">
                <div class="text-caption text-grey-7 q-mb-sm">Перейдите в директорию:</div>
                <code class="command-line">cd {{ repoName }}</code>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="code-block q-mb-md">
              <q-card-section class="q-pa-md">
                <div class="text-caption text-grey-7 q-mb-sm">Создайте файлы и сделайте первый коммит:</div>
                <code class="command-line">echo "# {{ repoName }}" >> README.md</code>
                <code class="command-line">git add .</code>
                <code class="command-line">git commit -m "Initial commit"</code>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="code-block">
              <q-card-section class="q-pa-md">
                <div class="text-caption text-grey-7 q-mb-sm">Отправьте изменения на сервер:</div>
                <code class="command-line">git push origin main</code>
              </q-card-section>
            </q-card>
          </div>

          <q-separator class="q-my-lg" />

          <div class="text-caption text-grey-6">
            После первого push содержимое репозитория появится здесь автоматически.
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Loading State -->
    <div v-else-if="repoStore.loadingTree || loadingBranches" class="loading-container">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-banner class="bg-negative text-white" rounded>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
    </div>

    <!-- Content: Last Commit + File Table -->
    <div v-else-if="repoStore.currentTree" class="browser-content">
      <!-- Last Commit Info Block -->
      <div v-if="lastCommitForPath" class="last-commit-block">
        <div class="commit-left">
          <!-- Author Avatar -->
          <q-avatar size="40px" :color="getAvatarColor(lastCommitForPath.author.name)" text-color="white">
            {{ getInitials(lastCommitForPath.author.name) }}
          </q-avatar>

          <div class="commit-info">
            <!-- Commit Message -->
            <div class="commit-message">{{ lastCommitForPath.message }}</div>
            <!-- Author and Time -->
            <div class="commit-meta">
              <span class="commit-author">{{ lastCommitForPath.author.name }}</span>
              сделал коммит
              <span class="commit-time">{{ formatRelativeTime(lastCommitForPath.author.date) }}</span>
            </div>
          </div>
        </div>

        <div class="commit-right">
          <!-- Short SHA with Copy -->
          <div class="commit-sha">
            <span class="sha-text">{{ shortenSha(lastCommitForPath.sha) }}</span>
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              size="xs"
              @click="copySha(lastCommitForPath.sha)"
            >
              <q-tooltip>Скопировать SHA</q-tooltip>
            </q-btn>
          </div>

          <!-- History Button -->
          <q-btn
            flat
            dense
            label="История"
            no-caps
            icon="history"
            class="btn-only-icon-sm bordered"
            @click="showHistory"
          >
            <q-tooltip>История коммитов</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- File Table -->
      <q-table
        :rows="sortedEntries"
        :columns="columns"
        row-key="name"
        flat
        bordered
        hide-pagination
        :rows-per-page-options="[0]"
        class="file-table"
      >
        <!-- Name Column -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props" class="name-cell">
            <div class="name-content" @click="onEntryClick(props.row)">
              <!-- File/Folder Icon -->
              <q-icon
                :name="props.row.type === 'dir' ? 'folder' : getFileIcon(props.row.name)"
                :color="props.row.type === 'dir' ? 'amber-7' : 'blue-grey-6'"
                size="20px"
                class="file-icon"
              />
              <!-- Name -->
              <span class="file-name">{{ props.row.name }}</span>
            </div>
          </q-td>
        </template>

        <!-- Last Commit Column -->
        <template v-slot:body-cell-last_commit="props">
          <q-td :props="props" class="commit-cell">
            <span v-if="props.row.lastCommit" class="commit-message-short">
              {{ props.row.lastCommit.message }}
            </span>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <!-- Last Update Column -->
        <template v-slot:body-cell-last_update="props">
          <q-td :props="props" class="update-cell">
            <span v-if="props.row.lastCommit" class="update-time">
              {{ formatRelativeTime(props.row.lastCommit.author.date) }}
            </span>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
      </q-table>

      <!-- Empty State -->
      <div v-if="repoStore.currentTree.entries.length === 0" class="empty-state">
        <q-icon name="folder_open" size="64px" color="grey-5" />
        <div class="text-grey-7 q-mt-md">Директория пуста</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import type { GitTreeEntry, GitBranch, GitCommit } from '../types';
import { formatBytes, formatRelativeTime, shortenSha } from '../utils/format';

interface Props {
  workspaceSlug: string;
  repoName: string;
  initialBranch?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'directory-changed', path: string): void;
  (e: 'file-selected', file: { path: string; branch: string; name: string }): void;
}>();

const $q = useQuasar();
const repoStore = useGitRepositoryStore();

// State
const currentPath = ref('');
const selectedBranch = ref<string>(props.initialBranch || '');
const error = ref<string | null>(null);
const branches = ref<GitBranch[]>([]);
const loadingBranches = ref(false);
const branchDropdownOpen = ref(false);
const lastCommitForPath = ref<GitCommit | null>(null);

// Table columns definition
const columns = [
  {
    name: 'name',
    label: 'Название',
    field: 'name',
    align: 'left' as const,
    sortable: false,
    style: 'width: 35%',
    headerStyle: 'font-weight: 600; background-color: #fafafa;',
  },
  {
    name: 'last_commit',
    label: 'Последний коммит',
    field: 'last_commit',
    align: 'left' as const,
    style: 'width: 45%',
    headerStyle: 'font-weight: 600; background-color: #fafafa;',
  },
  {
    name: 'last_update',
    label: 'Последнее обновление',
    field: 'last_update',
    align: 'right' as const,
    style: 'width: 20%',
    headerStyle: 'font-weight: 600; background-color: #fafafa;',
  },
];

/**
 * Определяет, является ли репозиторий пустым (нет веток)
 */
const isEmptyRepository = computed(() => {
  return !loadingBranches.value && branches.value.length === 0;
});

/**
 * Clone URL для инструкций в пустом репозитории
 */
const cloneUrl = computed(() => {
  const host = window.location.host;
  return `http://${host}/${props.workspaceSlug}/${props.repoName}.git`;
});

/**
 * Части пути для breadcrumbs
 */
const pathParts = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : [];
});

/**
 * Отсортированные записи: сначала ".." (если не root), затем папки, затем файлы
 */
const sortedEntries = computed(() => {
  if (!repoStore.currentTree) return [];

  const entries = [...repoStore.currentTree.entries];

  // Разделяем на папки и файлы
  const dirs = entries.filter(e => e.type === 'dir');
  const files = entries.filter(e => e.type === 'file');

  // Объединяем: сначала папки, потом файлы (без алфавитной сортировки внутри типов)
  const sorted = [...dirs, ...files];

  // Добавляем ".." для перехода на уровень выше (если не в корне)
  const result: Array<GitTreeEntry & { lastCommit?: GitCommit }> = [];

  if (currentPath.value) {
    result.push({
      name: '..',
      type: 'dir' as const,
      mode: '040000',
      sha: '',
    });
  }

  result.push(...sorted);

  return result;
});

/**
 * Возвращает иконку для файла на основе расширения
 */
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // Code
    js: 'javascript',
    ts: 'javascript',
    vue: 'code',
    jsx: 'javascript',
    tsx: 'javascript',
    go: 'code',
    py: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    h: 'code',
    rs: 'code',
    rb: 'code',
    php: 'code',

    // Markup
    html: 'html',
    xml: 'code',
    json: 'data_object',
    yaml: 'settings',
    yml: 'settings',
    toml: 'settings',

    // Documents
    md: 'article',
    txt: 'description',
    pdf: 'picture_as_pdf',
    doc: 'description',
    docx: 'description',

    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',

    // Config
    gitignore: 'settings',
    env: 'settings',
    config: 'settings',

    // Other
    sh: 'terminal',
    bat: 'terminal',
    sql: 'storage',
    csv: 'table_chart',
  };

  return iconMap[ext || ''] || 'insert_drive_file';
}

/**
 * Генерирует инициалы из имени пользователя
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Генерирует цвет аватара на основе имени
 */
function getAvatarColor(name: string): string {
  const colors = [
    'pink-7',
    'purple-7',
    'deep-purple-7',
    'indigo-7',
    'blue-7',
    'cyan-7',
    'teal-7',
    'green-7',
    'light-green-7',
    'lime-7',
    'amber-7',
    'orange-7',
    'deep-orange-7',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Копирует путь в буфер обмена
 */
async function copyPath(): Promise<void> {
  const fullPath = currentPath.value ? `${repoName}/${currentPath.value}` : repoName;
  await copyToClipboard(fullPath);
}

/**
 * Копирует SHA коммита в буфер обмена
 */
async function copySha(sha: string): Promise<void> {
  await copyToClipboard(sha);
}

/**
 * Утилита копирования в буфер обмена
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({
      type: 'positive',
      message: 'Скопировано в буфер обмена',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось скопировать',
      icon: 'error',
      position: 'top',
      timeout: 2000,
    });
  }
}

/**
 * Загружает дерево файлов для текущего пути и ветки
 */
async function loadTree(): Promise<void> {
  error.value = null;

  // Не загружаем дерево для пустых репозиториев
  if (isEmptyRepository.value) {
    console.log('[GitFileBrowser] Skipping tree load for empty repository');
    return;
  }

  try {
    await repoStore.fetchTree(
      props.workspaceSlug,
      props.repoName,
      selectedBranch.value || undefined,
      currentPath.value || undefined,
    );

    emit('directory-changed', currentPath.value);

    // Загружаем последний коммит для текущего пути
    await loadLastCommit();
  } catch (err) {
    console.error('[GitFileBrowser] Failed to load tree:', err);
    error.value = 'Не удалось загрузить содержимое директории';
  }
}

/**
 * Загружает последний коммит для текущего пути
 */
async function loadLastCommit(): Promise<void> {
  try {
    const history = await repoStore.fetchCommits(
      props.workspaceSlug,
      props.repoName,
      selectedBranch.value || undefined,
      1, // Загружаем только последний коммит
      0,
    );

    if (history.commits.length > 0) {
      lastCommitForPath.value = history.commits[0];
    } else {
      lastCommitForPath.value = null;
    }
  } catch (err) {
    console.error('[GitFileBrowser] Failed to load last commit:', err);
    lastCommitForPath.value = null;
  }
}

/**
 * Загружает список веток
 */
async function loadBranches(): Promise<void> {
  loadingBranches.value = true;

  try {
    const result = await repoStore.fetchBranches(props.workspaceSlug, props.repoName);
    branches.value = result.branches;

    // Если текущая ветка не выбрана или отсутствует в списке — ставим дефолтную
    if (
      !selectedBranch.value ||
      !branches.value.some((b) => b.name === selectedBranch.value)
    ) {
      const preferred =
        branches.value.find((b) => b.name === props.initialBranch) ||
        branches.value.find((b) => b.is_default) ||
        branches.value[0];
      selectedBranch.value = preferred?.name || '';
    }
  } catch (err) {
    console.error('[GitFileBrowser] Failed to load branches:', err);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить список веток',
      icon: 'error',
    });
    throw err;
  } finally {
    loadingBranches.value = false;
  }
}

/**
 * Обработчик клика на запись в таблице
 */
function onEntryClick(entry: GitTreeEntry): void {
  if (entry.name === '..') {
    // Переход на уровень выше
    const parts = currentPath.value.split('/').filter(Boolean);
    parts.pop();
    navigateToPath(parts.join('/'));
    return;
  }

  if (entry.type === 'dir') {
    // Навигация в директорию
    const newPath = currentPath.value
      ? `${currentPath.value}/${entry.name}`
      : entry.name;
    navigateToPath(newPath);
  } else {
    // Открытие файла
    const filePath = currentPath.value
      ? `${currentPath.value}/${entry.name}`
      : entry.name;

    emit('file-selected', {
      path: filePath,
      branch: selectedBranch.value,
      name: entry.name,
    });
  }
}

/**
 * Навигация к указанному пути
 */
function navigateToPath(path: string): void {
  currentPath.value = path;
  loadTree();
}

/**
 * Обработчик смены ветки
 */
function onBranchChange(branchName: string): void {
  selectedBranch.value = branchName;
  currentPath.value = '';
  loadTree();
}

/**
 * Показать историю коммитов
 */
function showHistory(): void {
  $q.notify({
    type: 'info',
    message: 'История коммитов скоро будет доступна',
    icon: 'info',
    position: 'top',
  });
}

/**
 * Следим за изменением props и перезагружаем при необходимости
 */
watch(
  () => [props.workspaceSlug, props.repoName],
  () => {
    currentPath.value = '';
    selectedBranch.value = props.initialBranch || '';

    loadBranches()
      .then(() => loadTree())
      .catch(() => null);
  },
);

watch(
  () => props.initialBranch,
  (newVal) => {
    if (
      newVal &&
      (!selectedBranch.value || selectedBranch.value !== newVal) &&
      branches.value.some((b) => b.name === newVal)
    ) {
      selectedBranch.value = newVal;
      loadTree();
    }
  },
);

onMounted(() => {
  loadBranches()
    .then(() => loadTree())
    .catch(() => null);
});
</script>

<style lang="scss" scoped>
.git-file-browser {
  // Browser Header (Breadcrumbs + Branch Selector + Code Button)
  .browser-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 6px 6px 0 0;
    margin-bottom: 0;
    gap: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .branch-selector {
      font-size: 14px;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 4px 12px;
      background-color: white;
      flex-shrink: 0;

      &:hover {
        background-color: #f9fafb;
      }
    }

    .path-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .path-separator {
        color: #9ca3af;
      }

      .path-part {
        cursor: pointer;
        color: #1f2937;

        &:hover {
          color: #2563eb;
          text-decoration: underline;
        }
      }
    }

    .copy-path-btn {
      color: #6b7280;
      flex-shrink: 0;

      &:hover {
        color: #374151;
      }
    }
  }

  // Empty Repository State
  .empty-repository-container {
    padding: 24px 16px;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 6px 6px;

    .empty-repo-card {
      max-width: 800px;
      margin: 0 auto;
      background-color: #fafafa;

      .instructions-section {
        text-align: left;
        width: 100%;

        .code-block {
          background-color: #ffffff;
          border-radius: 6px;

          code.command-line {
            display: block;
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 13px;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 4px;
            overflow-x: auto;
            white-space: nowrap;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }

  // Empty repo header (показывается вместо breadcrumbs)
  .empty-repo-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;

    .repo-name {
      color: #374151;
      font-weight: 600;
    }
  }

  // Loading State
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 80px 0;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-top: none;
  }

  // Error State
  .error-container {
    padding: 24px 16px;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-top: none;
  }

  // Browser Content
  .browser-content {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 6px 6px;
  }

  // Last Commit Block
  .last-commit-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    gap: 16px;
    flex-wrap: wrap;

    .commit-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .commit-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .commit-message {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .commit-meta {
      font-size: 13px;
      color: #6b7280;

      .commit-author {
        font-weight: 500;
        color: #374151;
      }

      .commit-time {
        color: #6b7280;
      }
    }

    .commit-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .commit-sha {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background-color: #f3f4f6;
      border-radius: 6px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      color: #374151;

      .sha-text {
        font-weight: 500;
      }
    }
  }

  // File Table
  .file-table {
    :deep(.q-table__top),
    :deep(.q-table__bottom) {
      display: none;
    }

    :deep(thead tr th) {
      background-color: #fafafa;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      text-transform: none;
      border-bottom: 1px solid #e5e7eb;
    }

    :deep(tbody tr) {
      cursor: pointer;

      &:hover {
        background-color: #f9fafb;
      }

      td {
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
        color: #374151;
        padding: 12px 16px;
      }
    }

    .name-cell {
      .name-content {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .file-icon {
          flex-shrink: 0;
        }

        .file-name {
          font-weight: 500;
          color: #1f2937;

          &:hover {
            color: #2563eb;
            text-decoration: underline;
          }
        }
      }
    }

    .commit-cell {
      .commit-message-short {
        color: #6b7280;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }
    }

    .update-cell {
      .update-time {
        color: #6b7280;
        font-size: 13px;
      }
    }
  }

  // Empty State
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 16px;
    color: #9ca3af;
  }
}

// Responsive
@media (max-width: 768px) {
  .git-file-browser {
    .browser-header {
      flex-wrap: wrap;
      gap: 8px;

      .header-left {
        flex: 1 1 100%;
      }

      .header-right {
        flex: 1 1 100%;
        justify-content: flex-end;
      }

      .path-breadcrumbs {
        font-size: 12px;
      }
    }

    .empty-repository-container {
      padding: 16px 8px;

      .empty-repo-card {
        :deep(.q-card__section) {
          padding: 24px 16px !important;
        }

        .text-h5 {
          font-size: 1.25rem;
        }

        .text-h6 {
          font-size: 1.1rem;
        }

        .instructions-section {
          .code-block {
            code.command-line {
              font-size: 12px;
              padding: 6px 10px;
              white-space: pre-wrap;
              word-break: break-all;
            }
          }
        }
      }
    }

    .last-commit-block {
      flex-direction: column;
      align-items: flex-start;

      .commit-right {
        width: 100%;
        justify-content: space-between;
      }
    }

    .file-table {
      :deep(thead tr th) {
        font-size: 12px;
        padding: 8px 12px;
      }

      :deep(tbody tr td) {
        font-size: 13px;
        padding: 10px 12px;
      }
    }
  }
}

// Dark mode support
body.body--dark {
  .git-file-browser {
    .browser-header {
      background-color: #1f2937;
      border-color: #374151;

      .header-right {
        // Dark mode styles for Code button
      }

      .branch-selector {
        background-color: #374151;
        border-color: #4b5563;
        color: #f9fafb;

        &:hover {
          background-color: #4b5563;
        }
      }

      .path-breadcrumbs {
        .path-separator {
          color: #6b7280;
        }

        .path-part {
          color: #f9fafb;

          &:hover {
            color: #60a5fa;
          }
        }
      }

      .copy-path-btn {
        color: #9ca3af;

        &:hover {
          color: #d1d5db;
        }
      }

      .empty-repo-header {
        .repo-name {
          color: #f9fafb;
        }
      }
    }

    .empty-repository-container {
      background-color: #111827;
      border-color: #374151;

      .empty-repo-card {
        background-color: #1f2937;

        .instructions-section {
          .code-block {
            background-color: #111827;
            border-color: #374151;

            code.command-line {
              color: #f9fafb;
              background-color: #1f2937;
            }
          }
        }
      }
    }

    .loading-container,
    .error-container {
      background-color: #111827;
      border-color: #374151;
    }

    .browser-content {
      background-color: #111827;
      border-color: #374151;
    }

    .last-commit-block {
      border-color: #374151;

      .commit-message {
        color: #f9fafb;
      }

      .commit-meta {
        .commit-author {
          color: #d1d5db;
        }

        .commit-time {
          color: #9ca3af;
        }
      }

      .commit-sha {
        background-color: #1f2937;
        color: #d1d5db;
      }
    }

    .file-table {
      :deep(thead tr th) {
        background-color: #1f2937;
        color: #d1d5db;
        border-color: #374151;
      }

      :deep(tbody tr) {
        &:hover {
          background-color: #1f2937;
        }

        td {
          border-color: #374151;
          color: #d1d5db;
        }
      }

      .name-cell {
        .name-content {
          .file-name {
            color: #f9fafb;

            &:hover {
              color: #60a5fa;
            }
          }
        }
      }

      .commit-cell {
        .commit-message-short {
          color: #9ca3af;
        }
      }

      .update-cell {
        .update-time {
          color: #9ca3af;
        }
      }
    }
  }
}
</style>

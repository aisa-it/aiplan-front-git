<template>
  <div class="git-file-browser">
    <!-- Breadcrumbs and Branch Selector -->
    <div class="row items-center q-mb-md">
      <!-- Branch Selector -->
      <div class="col-auto q-mr-md">
        <q-select
          v-model="selectedBranch"
          :options="branchOptions"
          :loading="loadingBranches"
          label="Ветка"
          outlined
          dense
          :style="$q.screen.lt.sm ? 'min-width: 120px' : 'min-width: 200px'"
          @update:model-value="onBranchChange"
        >
          <template v-slot:prepend>
            <q-icon name="fork_right" />
          </template>
        </q-select>
      </div>

      <!-- Breadcrumbs -->
      <div class="col">
        <q-breadcrumbs>
          <q-breadcrumbs-el
            icon="home"
            :label="repoName"
            @click="navigateToPath('')"
            clickable
          />
          <q-breadcrumbs-el
            v-for="(part, index) in pathParts"
            :key="index"
            :label="part"
            @click="navigateToPath(pathParts.slice(0, index + 1).join('/'))"
            clickable
          />
        </q-breadcrumbs>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="repoStore.loadingTree" class="row justify-center q-py-lg">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="q-pa-md">
      <q-banner class="bg-negative text-white" rounded>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
    </div>

    <!-- File List -->
    <q-list v-else-if="repoStore.currentTree" bordered separator>
      <!-- Empty State -->
      <q-item v-if="repoStore.currentTree.entries.length === 0">
        <q-item-section avatar>
          <q-icon name="folder_open" color="grey-5" size="md" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-grey-7">Директория пуста</q-item-label>
        </q-item-section>
      </q-item>

      <!-- Directories First, Then Files -->
      <template v-for="entry in sortedEntries" :key="entry.name">
        <q-item
          clickable
          @click="onEntryClick(entry)"
          :class="{ 'bg-blue-1': selectedFile === entry.name }"
        >
          <q-item-section avatar>
            <q-icon
              :name="entry.type === 'dir' ? 'folder' : getFileIcon(entry.name)"
              :color="entry.type === 'dir' ? 'amber-7' : 'blue-grey-5'"
              size="md"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ entry.name }}</q-item-label>
            <q-item-label caption v-if="entry.type === 'file' && entry.size !== undefined">
              {{ formatBytes(entry.size) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side v-if="entry.type === 'dir'">
            <q-icon name="chevron_right" color="grey-5" />
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import type { GitTreeEntry, GitBranch } from '../types';
import { formatBytes } from '../utils/format';

interface Props {
  workspaceSlug: string;
  repoName: string;
  initialBranch?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'file-selected', path: string, ref: string): void;
  (e: 'directory-changed', path: string): void;
}>();

const $q = useQuasar();
const repoStore = useGitRepositoryStore();

const currentPath = ref('');
const selectedBranch = ref<string>(props.initialBranch || '');
const selectedFile = ref<string | null>(null);
const error = ref<string | null>(null);
const branches = ref<GitBranch[]>([]);
const loadingBranches = ref(false);

/**
 * Опции для селектора веток
 */
const branchOptions = computed(() => {
  return branches.value.map((b) => b.name);
});

/**
 * Части пути для breadcrumbs
 */
const pathParts = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : [];
});

/**
 * Отсортированные записи: сначала директории, потом файлы (по алфавиту)
 */
const sortedEntries = computed(() => {
  if (!repoStore.currentTree) return [];

  const entries = [...repoStore.currentTree.entries];

  return entries.sort((a, b) => {
    // Сначала по типу (dir < file)
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    // Затем по имени
    return a.name.localeCompare(b.name);
  });
});

/**
 * Возвращает иконку для файла на основе расширения
 */
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // Code
    js: 'code',
    ts: 'code',
    vue: 'code',
    jsx: 'code',
    tsx: 'code',
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
    md: 'description',
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
 * Загружает дерево файлов для текущего пути и ветки
 */
async function loadTree(): Promise<void> {
  error.value = null;

  try {
    await repoStore.fetchTree(
      props.workspaceSlug,
      props.repoName,
      selectedBranch.value || undefined,
      currentPath.value || undefined,
    );

    emit('directory-changed', currentPath.value);
  } catch (err) {
    console.error('[GitFileBrowser] Failed to load tree:', err);
    error.value = 'Не удалось загрузить содержимое директории';
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

    // Если ветка не выбрана, выбираем дефолтную
    if (!selectedBranch.value && branches.value.length > 0) {
      const defaultBranch = branches.value.find((b) => b.is_default);
      selectedBranch.value = defaultBranch?.name || branches.value[0].name;
    }
  } catch (err) {
    console.error('[GitFileBrowser] Failed to load branches:', err);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить список веток',
      icon: 'error',
    });
  } finally {
    loadingBranches.value = false;
  }
}

/**
 * Обработчик клика на запись в дереве
 */
function onEntryClick(entry: GitTreeEntry): void {
  if (entry.type === 'dir') {
    // Навигация в директорию
    const newPath = currentPath.value
      ? `${currentPath.value}/${entry.name}`
      : entry.name;
    navigateToPath(newPath);
  } else {
    // Выбор файла
    selectedFile.value = entry.name;
    const filePath = currentPath.value
      ? `${currentPath.value}/${entry.name}`
      : entry.name;
    emit('file-selected', filePath, selectedBranch.value);
  }
}

/**
 * Навигация к указанному пути
 */
function navigateToPath(path: string): void {
  currentPath.value = path;
  selectedFile.value = null;
  loadTree();
}

/**
 * Обработчик смены ветки
 */
function onBranchChange(): void {
  currentPath.value = '';
  selectedFile.value = null;
  loadTree();
}

/**
 * Следим за изменением props и перезагружаем при необходимости
 */
watch(
  () => [props.workspaceSlug, props.repoName],
  () => {
    currentPath.value = '';
    selectedFile.value = null;
    loadBranches();
    loadTree();
  },
);

onMounted(() => {
  loadBranches();
  loadTree();
});
</script>

<style lang="scss" scoped>
.git-file-browser {
  // Стили для браузера файлов
}
</style>

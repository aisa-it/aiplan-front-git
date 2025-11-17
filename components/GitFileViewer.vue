<template>
  <div class="git-file-viewer">
    <!-- File Header -->
    <q-card-section v-if="filePath" class="bg-grey-2">
      <div class="row items-center">
        <div class="col">
          <div class="text-body1 text-weight-medium">
            <q-icon :name="getFileIcon(filePath)" class="q-mr-sm" />
            {{ fileName }}
          </div>
          <div class="text-caption text-grey-7">
            {{ formatBytes(repoStore.currentBlob?.size || 0) }}
            <span v-if="repoStore.currentBlob?.sha" class="q-ml-md">
              SHA: {{ shortenSha(repoStore.currentBlob.sha) }}
            </span>
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            dense
            icon="close"
            @click="emit('close')"
            aria-label="Закрыть"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator v-if="filePath" />

    <!-- Loading State -->
    <q-card-section v-if="repoStore.loadingBlob">
      <div class="row justify-center q-py-lg">
        <q-spinner color="primary" size="lg" />
      </div>
    </q-card-section>

    <!-- Error State -->
    <q-card-section v-else-if="error">
      <q-banner class="bg-negative text-white" rounded>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
    </q-card-section>

    <!-- Empty State -->
    <q-card-section v-else-if="!filePath" class="text-center q-py-xl">
      <q-icon name="insert_drive_file" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">Выберите файл для просмотра</div>
    </q-card-section>

    <!-- File Content -->
    <q-card-section v-else-if="repoStore.currentBlob" class="q-pa-none">
      <!-- Binary File -->
      <div v-if="repoStore.currentBlob.is_binary" class="q-pa-md text-center">
        <q-icon name="file_present" size="64px" color="grey-5" />
        <div class="text-body1 text-grey-7 q-mt-md">
          Бинарный файл ({{ formatBytes(repoStore.currentBlob.size) }})
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">
          Предварительный просмотр недоступен
        </div>
      </div>

      <!-- Text File -->
      <div v-else>
        <!-- Code Viewer with Line Numbers -->
        <div v-if="showLineNumbers" class="code-viewer-container">
          <div class="line-numbers-column">
            <div
              v-for="(line, index) in codeLines"
              :key="index"
              class="line-number"
            >
              {{ index + 1 }}
            </div>
          </div>
          <pre class="code-viewer q-ma-none"><code>{{ decodedContent }}</code></pre>
        </div>

        <!-- Code Viewer without Line Numbers -->
        <pre v-else class="code-viewer q-ma-none q-pa-md"><code>{{ decodedContent }}</code></pre>
      </div>
    </q-card-section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import { formatBytes, shortenSha } from '../utils/format';

interface Props {
  workspaceSlug: string;
  repoName: string;
  filePath: string;
  ref?: string;
  showLineNumbers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLineNumbers: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const $q = useQuasar();
const repoStore = useGitRepositoryStore();

const error = ref<string | null>(null);

/**
 * Имя файла из пути
 */
const fileName = computed(() => {
  return props.filePath.split('/').pop() || props.filePath;
});

/**
 * Декодированное содержимое файла (UTF-8)
 */
const decodedContent = computed(() => {
  if (!repoStore.currentBlob || repoStore.currentBlob.is_binary) {
    return '';
  }

  try {
    // Декодируем base64
    const binaryString = atob(repoStore.currentBlob.content);
    // Преобразуем в Uint8Array
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    // Декодируем UTF-8 с помощью TextDecoder
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (err) {
    console.error('[GitFileViewer] Failed to decode content:', err);
    return '// Ошибка декодирования содержимого файла';
  }
});

/**
 * Строки кода для нумерации
 */
const codeLines = computed(() => {
  return decodedContent.value.split('\n');
});

/**
 * Возвращает иконку для файла на основе расширения
 */
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    js: 'code',
    ts: 'code',
    vue: 'code',
    go: 'code',
    py: 'code',
    md: 'description',
    txt: 'description',
    json: 'data_object',
    yaml: 'settings',
    yml: 'settings',
    html: 'html',
    css: 'style',
    scss: 'style',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    pdf: 'picture_as_pdf',
  };

  return iconMap[ext || ''] || 'insert_drive_file';
}

/**
 * Загружает содержимое файла
 */
async function loadFile(): Promise<void> {
  if (!props.filePath) {
    return;
  }

  error.value = null;

  try {
    await repoStore.fetchBlob(
      props.workspaceSlug,
      props.repoName,
      props.filePath,
      props.ref,
    );
  } catch (err) {
    console.error('[GitFileViewer] Failed to load file:', err);
    error.value = 'Не удалось загрузить содержимое файла';
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить файл',
      icon: 'error',
    });
  }
}

/**
 * Следим за изменением пути файла и перезагружаем
 */
watch(
  () => [props.workspaceSlug, props.repoName, props.filePath, props.ref],
  () => {
    if (props.filePath) {
      loadFile();
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.git-file-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-viewer-container {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 4px;
  max-height: 600px;
  overflow: auto;
}

.line-numbers-column {
  flex-shrink: 0;
  padding: 16px 8px 16px 16px;
  background-color: #e8e8e8;
  border-right: 1px solid #ddd;
  text-align: right;
  user-select: none;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #999;
}

.line-number {
  min-width: 40px;
  white-space: nowrap;
}

.code-viewer {
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre;
  flex: 1;
  padding: 16px;

  code {
    display: block;
    color: #333;
  }
}

// Dark mode support
body.body--dark {
  .code-viewer-container {
    background-color: #1e1e1e;
  }

  .line-numbers-column {
    background-color: #252526;
    border-right-color: #444;
    color: #666;
  }

  .code-viewer {
    background-color: #1e1e1e;

    code {
      color: #d4d4d4;
    }
  }
}
</style>

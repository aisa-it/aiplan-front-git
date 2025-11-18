<template>
  <q-page class="git-file-page">
    <!-- Breadcrumbs Navigation -->
    <div class="q-pa-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el
          :label="repoName"
          :to="`/${workspaceSlug}/git/${repoName}`"
          icon="folder"
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

    <!-- File Viewer Card -->
    <div class="q-pa-md">
      <q-card flat bordered>
        <GitFileViewer
          :workspace-slug="workspaceSlug"
          :repo-name="repoName"
          :file-path="filePath"
          :git-ref="refOrBranch"
          @close="goBackToRepo"
        />
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GitFileViewer from '../components/GitFileViewer.vue';

const route = useRoute();
const router = useRouter();

const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);
const refOrBranch = computed(() => (route.params.ref as string) || '');
const filePath = computed(() => {
  // РЕШЕНИЕ: Декодируем путь из base64 path parameter
  // Base64 гарантированно сохраняет все символы включая точки
  const encodedPath = route.params.encodedPath;
  if (typeof encodedPath === 'string' && encodedPath) {
    try {
      return atob(encodedPath);
    } catch (err) {
      console.error('[GitFilePage] Failed to decode base64 path:', err);
      return '';
    }
  }
  return '';
});

/**
 * Части пути для breadcrumbs
 */
const pathParts = computed(() => {
  return filePath.value ? filePath.value.split('/').filter(Boolean) : [];
});

/**
 * Навигация к указанному пути (для breadcrumbs)
 */
function navigateToPath(path: string): void {
  const pathParts = path.split('/');
  const fileName = pathParts[pathParts.length - 1];

  // Проверяем, является ли это файлом (последний элемент пути)
  if (fileName === pathParts[pathParts.length - 1] && filePath.value.endsWith(fileName)) {
    // Это файл, переходим к нему
    const newPath = `/${workspaceSlug.value}/git/${repoName.value}/blob/${refOrBranch.value || 'HEAD'}/${path}`;
    router.push(newPath);
  } else {
    // Это директория, возвращаемся к репозиторию
    goBackToRepo();
  }
}

/**
 * Возврат к странице репозитория
 */
function goBackToRepo(): void {
  router.push(`/${workspaceSlug.value}/git/${repoName.value}`);
}
</script>

<style lang="scss" scoped>
.git-file-page {
  // Стили для страницы файла
}
</style>

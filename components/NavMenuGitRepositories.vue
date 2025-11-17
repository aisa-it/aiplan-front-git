<template>
  <div class="git-repositories-container">
    <!-- Заголовок с иконками -->
    <div class="repositories-header">
      <GitIcon :width="20" :height="20" color="#424242" />
      <span class="repositories-title">Репозитории</span>
      <q-space />
      <q-btn
        flat
        dense
        style="margin-right: 5px"
        @click="showCreateDialog = true"
        class="create-repo-btn"
      >
        <q-icon name="add" dense size="18px" />
        <q-tooltip>Создать репозиторий</q-tooltip>
      </q-btn>
    </div>

    <!-- Контейнер для контента с overflow -->
    <div class="repositories-content">
      <!-- Загрузка -->
      <div v-if="gitRepoStore.loadingRepositories" class="q-pa-md text-center">
        <q-spinner color="primary" size="1.5em" />
      </div>

      <!-- Пустой список -->
      <div
        v-else-if="gitRepoStore.repositories.length === 0"
        class="q-pa-md text-center"
      >
        <q-icon
          name="mdi-source-repository"
          size="2em"
          color="grey-5"
          class="q-mb-sm"
        />
        <div class="text-caption text-grey-7">Нет репозиториев</div>
      </div>

      <!-- Список репозиториев -->
      <q-list v-else class="git-repositories-list">
        <q-item
          v-for="repo in gitRepoStore.repositories"
          :key="repo.name"
          clickable
          v-ripple
          :active="isActive(repo.name)"
          @click="goToRepository(repo.name)"
          class="git-repo-item"
        >
          <q-item-section avatar>
            <GitIcon :width="20" :height="20" color="#9e9e9e" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ repo.name }}
            </q-item-label>
            <q-item-label caption v-if="repo.description" lines="1">
              {{ repo.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side v-if="repo.private">
            <q-badge color="orange" outline dense>
              <q-icon name="mdi-lock" size="xs" />
            </q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Диалог создания репозитория -->
    <CreateGitRepoDialog
      v-model="showCreateDialog"
      @created="onRepositoryCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useGitConfigStore as useGitStore, useGitRepositoryStore } from '../stores';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import GitIcon from 'src/components/icons/GitIcon.vue';
import CreateGitRepoDialog from './CreateGitRepoDialog.vue';

// Stores
const gitStore = useGitStore(); // Для проверки gitEnabled
const gitRepoStore = useGitRepositoryStore(); // Для работы с репозиториями
const workspaceStore = useWorkspaceStore();
const router = useRouter();
const route = useRoute();

// Store refs
const { currentWorkspaceSlug } = storeToRefs(workspaceStore);

// State
const showCreateDialog = ref(false);

// Computed
/**
 * Проверяет, является ли репозиторий активным
 */
const isActive = (repoName: string): boolean => {
  // Проверяем текущий роут - активен если в URL есть имя репозитория
  const pathParts = route.path.split('/');
  return pathParts.includes(repoName);
};

// Methods
/**
 * Переход на страницу репозитория
 */
const goToRepository = (repoName: string) => {
  if (!currentWorkspaceSlug.value) {
    console.warn('[NavMenuGitRepositories] Cannot navigate: workspace not selected');
    return;
  }

  // Переход на страницу репозитория
  // Правильный роут: /{workspace-slug}/git/{repo-name}
  router.push(`/${currentWorkspaceSlug.value}/git/${repoName}`);
};

/**
 * Загружает список репозиториев для текущего workspace
 */
const loadRepositories = async () => {
  if (!currentWorkspaceSlug.value) {
    console.warn('[NavMenuGitRepositories] Cannot load: workspace not selected');
    return;
  }

  if (!gitStore.gitEnabled) {
    console.warn('[NavMenuGitRepositories] Git is disabled');
    return;
  }

  try {
    await gitRepoStore.fetchRepositories(currentWorkspaceSlug.value);
  } catch (error) {
    console.error('[NavMenuGitRepositories] Failed to load repositories:', error);
  }
};

/**
 * Обработчик создания репозитория
 */
const onRepositoryCreated = () => {
  // Закрываем диалог
  showCreateDialog.value = false;

  // Перезагружаем список репозиториев
  loadRepositories();
};

// Lifecycle hooks
onMounted(() => {
  loadRepositories();
});

// Watch workspace changes
watch(currentWorkspaceSlug, () => {
  loadRepositories();
});
</script>

<style scoped lang="scss">
// Контейнер занимает всю доступную высоту
.git-repositories-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// Заголовок секции с фиксированной высотой
.repositories-header {
  display: flex;
  align-items: center;
  padding: 8px 16px; // Совпадает с .menu-item-header в app-styles.scss
  gap: 8px;
  min-height: 40px; // Совпадает с высотой .menu-item-header
  flex-shrink: 0; // Не сжимается
}

.repositories-title {
  font-weight: 500;
  font-size: 14px;
}

// Кнопка создания репозитория
.create-repo-btn {
  color: #757575;

  &:hover {
    color: var(--q-primary);
  }
}

// Контейнер для контента с overflow
.repositories-content {
  flex: 1 1 auto; // Занимает всё оставшееся пространство
  overflow-y: auto;
  overflow-x: hidden;
}

// Список репозиториев
.git-repositories-list {
  padding: 0;
}

// Стили элементов списка
.git-repo-item {
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

// Dark mode support
.body--dark {
  .git-repo-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .create-repo-btn {
    color: #b0b0b0;

    &:hover {
      color: var(--q-primary);
    }
  }

  // В dark mode используем более светлый цвет для иконок репозиториев
  .git-repo-item {
    :deep(svg) {
      // Перезапишем fill цвет для SVG иконок в dark mode
      fill: #bdbdbd;
    }
  }
}
</style>

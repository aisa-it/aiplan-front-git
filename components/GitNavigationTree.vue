<template>
  <div class="git-navigation-tree">
    <!-- Заголовок -->
    <div class="git-navigation-tree__header">
      <div class="git-navigation-tree__title">
        <q-icon name="mdi-source-repository-multiple" size="20px" class="q-mr-xs" />
        <span>Репозитории</span>
      </div>

      <!-- Кнопка создания нового репозитория -->
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="add"
        color="primary"
        @click="showCreateRepoDialog = true"
      >
        <q-tooltip>Создать репозиторий</q-tooltip>
      </q-btn>
    </div>

    <q-separator class="q-my-sm" />

    <!-- Loading состояние -->
    <div v-if="loading" class="git-navigation-tree__loading">
      <q-spinner-dots color="primary" size="40px" />
      <p class="text-caption text-grey-7 q-mt-sm">Загрузка репозиториев...</p>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="repositories.length === 0" class="git-navigation-tree__empty">
      <q-icon name="mdi-folder-open-outline" size="48px" color="grey-5" />
      <p class="text-caption text-grey-7 q-mt-sm">
        Нет репозиториев
      </p>
      <q-btn
        outline
        color="primary"
        size="sm"
        label="Создать первый"
        icon="add"
        class="q-mt-sm"
        @click="showCreateRepoDialog = true"
      />
    </div>

    <!-- Список репозиториев -->
    <q-list v-else padding class="git-navigation-tree__list">
      <q-item
        v-for="repo in repositories"
        :key="repo.name"
        clickable
        v-ripple
        :active="repo.name === currentRepo"
        active-class="git-navigation-tree__item--active"
        class="git-navigation-tree__item"
        @click="navigateToRepo(repo.name)"
      >
        <q-item-section avatar>
          <q-icon
            :name="repo.private ? 'mdi-lock' : 'mdi-source-repository'"
            :color="repo.name === currentRepo ? 'primary' : 'grey-7'"
            size="20px"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label class="git-navigation-tree__repo-name">
            {{ repo.name }}
          </q-item-label>
          <q-item-label
            v-if="repo.description"
            caption
            lines="1"
            class="git-navigation-tree__repo-description"
          >
            {{ repo.description }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon
            name="mdi-source-branch"
            size="16px"
            color="grey-6"
          >
            <q-tooltip>{{ repo.branch }}</q-tooltip>
          </q-icon>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Кнопка обновления -->
    <div class="git-navigation-tree__footer">
      <q-btn
        flat
        dense
        size="sm"
        icon="refresh"
        label="Обновить"
        color="grey-7"
        class="full-width"
        @click="refreshRepositories"
        :loading="refreshing"
      />
    </div>

    <!-- Диалог создания репозитория -->
    <q-dialog v-model="showCreateRepoDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Создать репозиторий</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newRepoName"
            label="Название репозитория"
            hint="Только латиница, цифры, дефис и подчеркивание"
            :rules="[
              val => !!val || 'Обязательное поле',
              val => /^[a-zA-Z0-9_-]+$/.test(val) || 'Некорректное имя репозитория'
            ]"
            autofocus
            @keyup.enter="createRepository"
          />

          <q-input
            v-model="newRepoDescription"
            label="Описание (опционально)"
            type="textarea"
            rows="2"
            class="q-mt-md"
          />

          <q-toggle
            v-model="newRepoPrivate"
            label="Приватный репозиторий"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey-7" v-close-popup />
          <q-btn
            flat
            label="Создать"
            color="primary"
            @click="createRepository"
            :loading="creating"
            :disable="!newRepoName || !/^[a-zA-Z0-9_-]+$/.test(newRepoName)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
// Core
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

// Stores
import { useAiplanStore } from 'src/stores/aiplan-store';
import { useGitStore } from 'src/stores/git-store';

// Types
import type { GitRepositoryLight } from '../types';

/**
 * Props компонента
 */
interface Props {
  /** Slug текущего workspace */
  workspaceSlug?: string;
  /** Название текущего репозитория (для подсветки активного) */
  currentRepo?: string;
}

const props = defineProps<Props>();

// Composables
const router = useRouter();
const $q = useQuasar();
const aiplanStore = useAiplanStore();
const gitStore = useGitStore();

// Reactive state
const repositories = ref<GitRepositoryLight[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const showCreateRepoDialog = ref(false);
const creating = ref(false);

// Форма создания репозитория
const newRepoName = ref('');
const newRepoDescription = ref('');
const newRepoPrivate = ref(false);

/**
 * Вычисляемый workspace slug
 * Использует props или fallback на текущий из store
 */
const workspaceSlug = computed(() => {
  return props.workspaceSlug || '';
});

/**
 * Загрузка списка репозиториев
 */
const loadRepositories = async () => {
  if (!workspaceSlug.value) {
    console.warn('[GitNavigationTree] No workspace slug provided');
    return;
  }

  loading.value = true;

  try {
    const api = aiplanStore.api;
    const response = await api.get<{ repositories: GitRepositoryLight[]; total: number }>(
      `/api/auth/git/${workspaceSlug.value}/repositories/`
    );

    repositories.value = response.data.repositories || [];

    console.log('[GitNavigationTree] Loaded repositories:', repositories.value.length);
  } catch (error: any) {
    console.error('[GitNavigationTree] Failed to load repositories:', error);

    $q.notify({
      type: 'negative',
      message: 'Ошибка загрузки репозиториев',
      caption: error.response?.data?.message || error.message,
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Обновление списка репозиториев
 */
const refreshRepositories = async () => {
  refreshing.value = true;
  try {
    await loadRepositories();
    $q.notify({
      type: 'positive',
      message: 'Список репозиториев обновлен',
      icon: 'check_circle',
      timeout: 1000,
    });
  } finally {
    refreshing.value = false;
  }
};

/**
 * Навигация к репозиторию
 */
const navigateToRepo = (repoName: string) => {
  if (!workspaceSlug.value) return;

  router.push(`/${workspaceSlug.value}/git/${repoName}`);
};

/**
 * Создание нового репозитория
 */
const createRepository = async () => {
  if (!newRepoName.value || !workspaceSlug.value) return;

  // Валидация имени
  if (!/^[a-zA-Z0-9_-]+$/.test(newRepoName.value)) {
    $q.notify({
      type: 'negative',
      message: 'Некорректное имя репозитория',
      caption: 'Используйте только латиницу, цифры, дефис и подчеркивание',
      icon: 'error',
    });
    return;
  }

  creating.value = true;

  try {
    const api = aiplanStore.api;
    await api.post(
      `/api/auth/git/${workspaceSlug.value}/repositories/`,
      {
        name: newRepoName.value,
        description: newRepoDescription.value || undefined,
        private: newRepoPrivate.value,
        branch: 'main', // По умолчанию main
      }
    );

    $q.notify({
      type: 'positive',
      message: 'Репозиторий создан',
      icon: 'check_circle',
    });

    // Закрываем диалог
    showCreateRepoDialog.value = false;

    // Сбрасываем форму
    newRepoName.value = '';
    newRepoDescription.value = '';
    newRepoPrivate.value = false;

    // Перезагружаем список
    await loadRepositories();

    // Навигируем к новому репозиторию
    navigateToRepo(newRepoName.value);
  } catch (error: any) {
    console.error('[GitNavigationTree] Failed to create repository:', error);

    $q.notify({
      type: 'negative',
      message: 'Ошибка создания репозитория',
      caption: error.response?.data?.message || error.message,
      icon: 'error',
    });
  } finally {
    creating.value = false;
  }
};

// Lifecycle
onMounted(() => {
  if (gitStore.gitEnabled && workspaceSlug.value) {
    loadRepositories();
  }
});
</script>

<style lang="scss" scoped>
.git-navigation-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;

  // Header
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
  }

  &__title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--q-primary);
  }

  // Loading
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
  }

  // Empty state
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
  }

  // List
  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  // List item
  &__item {
    border-radius: 8px;
    margin-bottom: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(var(--q-primary-rgb), 0.05);
    }

    &--active {
      background-color: rgba(var(--q-primary-rgb), 0.1);
      border-left: 3px solid var(--q-primary);
    }
  }

  &__repo-name {
    font-weight: 500;
    font-size: 13px;
    color: var(--q-dark);
  }

  &__repo-description {
    font-size: 11px;
    opacity: 0.7;
  }

  // Footer
  &__footer {
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
}

// Dark mode
body.body--dark {
  .git-navigation-tree {
    &__repo-name {
      color: rgba(255, 255, 255, 0.87);
    }

    &__item:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    &__footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

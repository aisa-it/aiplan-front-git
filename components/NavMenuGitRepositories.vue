<template>
  <div class="git-repositories-container">
    <!-- Заголовок с иконкой и кнопкой -->
    <div class="row centered-horisontally justify-between full-w menu-item-header">
      <q-item-section avatar>
        <GitIcon :width="20" :height="20" :color="$q.dark.isActive ? '#fff' : '#424242'" />
      </q-item-section>
      <q-item-section>Репозитории</q-item-section>
      <q-btn
        flat
        dense
        round
        size="sm"
        @click="showCreateDialog = true"
        class="create-repo-btn"
      >
        <AddIcon :width="18" :height="18" />
        <q-tooltip>Создать репозиторий</q-tooltip>
      </q-btn>
    </div>

    <!-- Контейнер для контента с overflow -->
    <q-list
      v-if="gitRepoStore.repositories.length > 0 || gitRepoStore.loadingRepositories"
      class="scrollable-content"
      style="overflow: scroll;"
    >
      <!-- Загрузка -->
      <div v-if="gitRepoStore.loadingRepositories" class="q-pa-md text-center">
        <q-spinner color="primary" size="1.5em" />
      </div>

      <!-- Список репозиториев -->
      <GitRepositoryLink
        v-else
        v-for="repo in gitRepoStore.repositories"
        :key="repo.name"
        :repository="repo"
      />
    </q-list>

    <!-- Пустой список -->
    <div
      v-else
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

    <!-- Диалог создания репозитория -->
    <CreateGitRepoDialog
      v-model="showCreateDialog"
      @created="onRepositoryCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useGitConfigStore as useGitStore, useGitRepositoryStore } from '../stores';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import GitIcon from 'src/components/icons/GitIcon.vue';
import AddIcon from 'src/components/icons/AddIcon.vue';
import GitRepositoryLink from './GitRepositoryLink.vue';
import CreateGitRepoDialog from './CreateGitRepoDialog.vue';

// Composables
const $q = useQuasar();

// Stores
const gitStore = useGitStore(); // Для проверки gitEnabled
const gitRepoStore = useGitRepositoryStore(); // Для работы с репозиториями
const workspaceStore = useWorkspaceStore();

// Store refs
const { currentWorkspaceSlug } = storeToRefs(workspaceStore);

// State
const showCreateDialog = ref(false);

// Methods
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
// Контейнер использует такую же структуру как в NavMenuProjects
.git-repositories-container {
  // Совместимость с app-styles.scss
}

// Заголовок с иконкой и кнопкой (использует глобальные стили .menu-item-header)
.menu-item-header {
  // Стили уже определены в app-styles.scss
  // Минимальная высота 40px, padding 8px 16px
}

// Кнопка создания репозитория
.create-repo-btn {
  color: #757575;
  transition: color 0.2s ease;

  &:hover {
    color: var(--q-primary);
  }
}

// Dark mode support
.body--dark {
  .create-repo-btn {
    color: #b0b0b0;

    &:hover {
      color: var(--q-primary);
    }
  }
}
</style>

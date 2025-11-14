<template>
  <q-layout view="lHh Lpr lFf" class="git-layout">
    <!-- Header -->
    <q-header elevated class="git-layout__header">
      <q-toolbar class="git-layout__toolbar">
        <!-- Drawer toggle для мобильных -->
        <q-btn
          v-if="hasRepositories"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="q-mr-sm lt-md"
          @click="toggleDrawer"
        />

        <!-- Git иконка и заголовок -->
        <q-icon name="mdi-git" size="28px" class="q-mr-sm" />
        <q-toolbar-title class="git-layout__title">
          Git Repository Browser
        </q-toolbar-title>

        <!-- Breadcrumbs для навигации -->
        <q-breadcrumbs
          v-if="breadcrumbs.length > 0"
          class="git-layout__breadcrumbs gt-sm"
          active-color="white"
          separator-color="grey-4"
        >
          <q-breadcrumbs-el
            v-for="(crumb, index) in breadcrumbs"
            :key="index"
            :label="crumb.label"
            :icon="crumb.icon"
            :to="crumb.to"
            class="git-layout__breadcrumb"
          />
        </q-breadcrumbs>

        <q-space />

        <!-- Поиск по коду -->
        <q-input
          v-model="searchQuery"
          dense
          standout
          dark
          placeholder="Поиск по коду..."
          class="git-layout__search gt-xs"
          :style="{ width: searchFocused ? '300px' : '200px' }"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append>
            <q-icon
              v-if="searchQuery"
              name="close"
              class="cursor-pointer"
              @click="searchQuery = ''"
            />
          </template>
        </q-input>

        <!-- Кнопка возврата в основное приложение -->
        <q-btn
          flat
          dense
          round
          icon="apps"
          class="q-ml-sm"
          @click="goToMainApp"
        >
          <q-tooltip>Вернуться в основное приложение</q-tooltip>
        </q-btn>

        <!-- Профиль пользователя -->
        <ProfileButton class="q-ml-sm" />
      </q-toolbar>
    </q-header>

    <!-- Left Drawer - список репозиториев -->
    <q-drawer
      v-if="hasRepositories"
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="280"
      :breakpoint="1024"
      class="git-layout__drawer"
    >
      <q-scroll-area class="fit">
        <!-- Navigation Tree компонент -->
        <GitNavigationTree
          :workspace-slug="currentWorkspaceSlug"
          :current-repo="currentRepoName"
        />
      </q-scroll-area>
    </q-drawer>

    <!-- Page Container -->
    <q-page-container class="git-layout__page-container">
      <router-view v-slot="{ Component, route }">
        <transition
          appear
          name="fade"
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Footer - Git информация -->
    <q-footer
      v-if="showFooter"
      elevated
      class="git-layout__footer"
    >
      <q-toolbar class="git-layout__footer-toolbar">
        <!-- Текущая ветка -->
        <q-icon name="mdi-source-branch" size="18px" class="q-mr-xs" />
        <span class="git-layout__footer-text">
          {{ currentBranch || 'main' }}
        </span>

        <q-separator vertical inset spaced dark class="q-mx-md" />

        <!-- Информация о последнем коммите -->
        <template v-if="lastCommit">
          <q-icon name="mdi-source-commit" size="18px" class="q-mr-xs" />
          <span class="git-layout__footer-text git-layout__footer-commit">
            {{ lastCommit.sha.substring(0, 7) }} -
            {{ lastCommit.message.split('\n')[0].substring(0, 50) }}
            <template v-if="lastCommit.message.split('\n')[0].length > 50">...</template>
          </span>
        </template>
        <template v-else>
          <span class="git-layout__footer-text text-grey-5">
            Нет коммитов
          </span>
        </template>

        <q-space />

        <!-- Git статус индикатор -->
        <q-chip
          dense
          size="sm"
          :color="gitStore.gitEnabled ? 'positive' : 'warning'"
          text-color="white"
          icon="mdi-git"
          class="git-layout__status-chip"
        >
          {{ gitStore.gitEnabled ? 'Git активен' : 'Git отключен' }}
        </q-chip>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
// Core
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

// Stores
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useGitStore } from 'src/stores/git-store';

// Components
import ProfileButton from 'src/components/ProfileButton.vue';
import GitNavigationTree from '../components/GitNavigationTree.vue';

// Types
import type { GitCommit } from '../types';

/**
 * Breadcrumb элемент для навигации
 */
interface Breadcrumb {
  label: string;
  icon?: string;
  to?: string;
}

// Stores
const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const gitStore = useGitStore();

// Store refs
const { currentWorkspaceSlug } = storeToRefs(workspaceStore);

// Reactive state
const drawerOpen = ref(true);
const searchQuery = ref('');
const searchFocused = ref(false);
const currentBranch = ref<string>('main');
const lastCommit = ref<GitCommit | null>(null);

/**
 * Текущее имя репозитория из роута
 */
const currentRepoName = computed(() => {
  return route.params.repoName as string | undefined;
});

/**
 * Флаг наличия репозиториев (для отображения drawer)
 */
const hasRepositories = computed(() => {
  // TODO: получать из API или store
  // Пока показываем drawer всегда в Git модуле
  return route.path.includes('/git');
});

/**
 * Флаг отображения footer
 * Показываем footer только когда находимся внутри репозитория
 */
const showFooter = computed(() => {
  return !!currentRepoName.value;
});

/**
 * Генерация breadcrumbs на основе текущего роута
 */
const breadcrumbs = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = [];

  // Workspace
  if (currentWorkspaceSlug.value) {
    crumbs.push({
      label: currentWorkspaceSlug.value,
      icon: 'folder',
      to: `/${currentWorkspaceSlug.value}`,
    });
  }

  // Git Home
  crumbs.push({
    label: 'Git',
    icon: 'mdi-git',
    to: `/${currentWorkspaceSlug.value}/git`,
  });

  // Repository
  if (currentRepoName.value) {
    crumbs.push({
      label: currentRepoName.value,
      icon: 'mdi-source-repository',
      to: `/${currentWorkspaceSlug.value}/git/${currentRepoName.value}`,
    });
  }

  // File path (если находимся в file browser)
  if (route.name === 'git-file-browser') {
    const pathMatch = route.params.pathMatch as string[] | undefined;
    if (pathMatch && pathMatch.length > 0) {
      crumbs.push({
        label: pathMatch[pathMatch.length - 1],
        icon: 'folder_open',
      });
    }
  }

  return crumbs;
});

/**
 * Toggle drawer
 */
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value;
};

/**
 * Возврат в основное приложение
 */
const goToMainApp = () => {
  if (currentWorkspaceSlug.value) {
    router.push(`/${currentWorkspaceSlug.value}`);
  } else {
    router.push('/');
  }
};

/**
 * Загрузка информации о репозитории при изменении роута
 */
watch(
  () => currentRepoName.value,
  async (repoName) => {
    if (!repoName || !currentWorkspaceSlug.value) {
      currentBranch.value = 'main';
      lastCommit.value = null;
      return;
    }

    // TODO: загрузка информации о репозитории через API
    // Пример:
    // try {
    //   const repoInfo = await gitStore.fetchRepositoryInfo(
    //     currentWorkspaceSlug.value,
    //     repoName
    //   );
    //   currentBranch.value = repoInfo.default_branch;
    //   lastCommit.value = repoInfo.last_commit;
    // } catch (error) {
    //   console.error('Failed to load repository info:', error);
    // }
  },
  { immediate: true }
);

/**
 * Поиск по коду
 * TODO: реализовать поиск через API
 */
watch(searchQuery, (newQuery) => {
  if (newQuery.length >= 3) {
    console.log('Search query:', newQuery);
    // Здесь будет логика поиска через API
  }
});
</script>

<style lang="scss" scoped>
.git-layout {
  // Header стили
  &__header {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
    backdrop-filter: blur(10px);
  }

  &__toolbar {
    min-height: 56px;
    padding: 0 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  &__breadcrumbs {
    margin-left: 24px;
    flex-shrink: 0;
  }

  &__breadcrumb {
    font-size: 13px;
    opacity: 0.9;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  // Поиск
  &__search {
    transition: width 0.3s ease;

    :deep(.q-field__control) {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }

    :deep(.q-field__native) {
      color: white;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  // Drawer
  &__drawer {
    background-color: var(--q-dark);

    :deep(.q-scrollarea__content) {
      padding: 8px;
    }
  }

  // Page Container
  &__page-container {
    background-color: var(--q-page-background, #f5f5f5);
  }

  // Footer
  &__footer {
    background-color: #1e1e1e;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__footer-toolbar {
    min-height: 40px;
    padding: 0 16px;
    font-family: 'Roboto Mono', 'Courier New', monospace;
    font-size: 12px;
  }

  &__footer-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    line-height: 1.4;
  }

  &__footer-commit {
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status-chip {
    font-size: 11px;
    height: 24px;
  }
}

// Dark mode поддержка
body.body--dark {
  .git-layout {
    &__page-container {
      background-color: #121212;
    }

    &__drawer {
      background-color: #1e1e1e;
    }
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive adjustments
@media (max-width: 600px) {
  .git-layout {
    &__toolbar {
      padding: 0 8px;
    }

    &__title {
      font-size: 16px;
    }

    &__search {
      display: none;
    }

    &__footer-commit {
      max-width: 200px;
    }
  }
}

@media (max-width: 1024px) {
  .git-layout {
    &__breadcrumbs {
      display: none;
    }
  }
}
</style>

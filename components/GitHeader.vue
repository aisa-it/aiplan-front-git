<template>
  <q-header style="z-index: 1000">
    <q-toolbar class="header text-grey-9 main-toolbar">
      <q-btn flat dense round aria-label="Menu" @click="$emit('toggle')">
        <MenuIcon />
      </q-btn>

      <template v-if="workspaceInfo">
        <q-breadcrumbs
          active-color="grey-9"
          style="font-size: 14px; font-weight: 800; overflow-x: auto"
          class="q-ml-md"
        >
          <div
            v-if="Screen.width < 600 && breadCrumbsHistory.length >= 2"
            style="cursor: pointer"
            @click="navigateBack"
          >
            ... /
          </div>

          <q-breadcrumbs-el
            v-for="(crumb, index) in displayedBreadcrumbs"
            :key="index"
            :to="crumb?.url"
          >
            <!-- Workspace icon -->
            <HomeIcon
              v-if="!workspaceInfo?.logo && crumb?.type === 'workspace'"
              class="q-mr-xs"
              :width="20"
              :height="20"
            />

            <!-- Git icon -->
            <GitIcon
              v-else-if="crumb?.type === 'git'"
              class="q-mr-xs"
              :width="18"
              :height="18"
            />

            <!-- Workspace logo -->
            <q-img
              v-else-if="crumb?.icon"
              :src="crumb.icon"
              style="
                width: 18px;
                height: 18px;
                margin: 0 4px 0 0;
                border-radius: 4px;
                color: white;
              "
              spinner-size="18px"
            />

            <span
              v-show="crumb?.name"
              :style="`max-width: calc((100vw - ${
                Screen.width > 1019 ? 670 : Screen.width > 600 ? 400 : 250
              }px) / ${
                Screen.width > 600 ? breadCrumbsHistory.length : 1
              }) !important`"
              class="breadcrumbs-title"
            >
              {{ crumb?.name }}
            </span>
          </q-breadcrumbs-el>
        </q-breadcrumbs>

        <q-space />
      </template>

      <q-toolbar-title v-else>АИПлан</q-toolbar-title>
      <GitSearchPanel />
    </q-toolbar>
  </q-header>
</template>

<script lang="ts" setup>
import { Screen } from 'quasar';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useUtilsStore } from 'src/stores/utils-store';
import HomeIcon from 'src/components/icons/HomeIcon.vue';
import MenuIcon from 'src/components/icons/MenuIcon.vue';
import GitIcon from 'src/components/icons/GitIcon.vue';
import GitSearchPanel from './GitSearchPanel.vue';

defineEmits<{
  toggle: [];
}>();

// Stores
const workspaceStore = useWorkspaceStore();
const utilsStore = useUtilsStore();

// Store to refs
const { workspaceInfo } = storeToRefs(workspaceStore);

// Vars
const route = useRoute();
const router = useRouter();
const repoName = computed(() => (route.params.repoName as string) || (route.params.repository as string));

/**
 * Формирование breadcrumbs для Git модуля
 */
const breadCrumbsHistory = computed(() => {
  const existPath = [];

  // Workspace breadcrumb (всегда первый)
  existPath[0] = {
    icon: workspaceInfo.value?.logo
      ? `/api/file/${workspaceInfo.value.logo}`
      : '',
    name: workspaceInfo.value?.name,
    url: `/${workspaceInfo.value?.slug}`,
    type: 'workspace',
  };

  // В режиме списка — показываем Git; в репозитории — сразу имя репо
  if (repoName.value) {
    existPath[1] = {
      name: repoName.value,
      url: `/${workspaceInfo.value?.slug}/git/${repoName.value}`,
      type: 'repository',
    };
  } else {
    existPath[1] = {
      name: 'Git',
      url: `/${workspaceInfo.value?.slug}/git`,
      type: 'git',
    };
  }

  // File path breadcrumb (если просматриваем файл/директорию)
  const queryPath = route.query.path as string;
  const encodedPath = route.params.encodedPath as string;
  const decodedPath =
    encodedPath && typeof encodedPath === 'string'
      ? (() => {
          try {
            return atob(encodedPath);
          } catch (e) {
            return '';
          }
        })()
      : queryPath;

  if (repoName.value && decodedPath && decodedPath !== '/') {
    const pathParts = decodedPath.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    existPath[2] = {
      name: lastPart,
      type: 'file',
    };
  }

  return existPath;
});

/**
 * Breadcrumbs для отображения (урезанные на мобильных)
 */
const displayedBreadcrumbs = computed(() => {
  if (Screen.width > 600) {
    return breadCrumbsHistory.value;
  } else {
    // На мобильных показываем только последний breadcrumb
    return [breadCrumbsHistory.value[breadCrumbsHistory.value.length - 1]];
  }
});

/**
 * Навигация назад для мобильных устройств
 */
const navigateBack = () => {
  const history = breadCrumbsHistory.value;
  if (history.length >= 2) {
    const prevCrumb = history[history.length - 2];
    if (prevCrumb?.type !== 'workspace' && prevCrumb?.url) {
      router.push(prevCrumb.url);
    }
  }
};
</script>

<style lang="scss" scoped>
.header {
  background: $bg-surface;
  box-shadow:
    0 1px 0 0 $color-shadow,
    0 2px 1px 0 $color-shadow,
    0 4px 1px -1px $color-shadow,
    0 0 1px 0 $color-shadow;
}

.breadcrumbs-title {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>

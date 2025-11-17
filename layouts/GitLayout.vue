<template>
  <q-layout
    v-show="$q.loading.isActive === false"
    view="lHh Lpr lFf"
    style="max-height: 100%; max-width: 100%"
  >
    <LightsNewYear v-if="utilsStore.ny === true"></LightsNewYear>
    <SnowFall v-if="utilsStore.ny === true && isSnowEnable" />
    <div>
      <GitHeader @toggle="toggleLeftDrawer()" />
      <PrimaryLoader v-show="generalLoader === true" />

      <GitLayoutDrawer v-model:drawer-open="leftDrawerOpen" />

      <q-page-container>
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
    </div>

    <ReleaseNotePreviewDialog v-model="openReleaseNote" />
  </q-layout>
</template>

<script lang="ts" setup>
// core
import { useQuasar, useMeta } from 'quasar';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useAiplanStore } from 'src/stores/aiplan-store';
import { ref, watch, computed, onBeforeMount } from 'vue';

// stores
import { useUserStore } from 'src/stores/user-store';
import { useUtilsStore } from 'src/stores/utils-store';
import { useLoaderStore } from 'src/stores/loader-store';
import { useGitConfigStore as useGitStore } from '../stores';
import { useWorkspaceStore } from 'src/stores/workspace-store';

// components
import PrimaryLoader from 'src/components/loaders/PrimaryLoader.vue';
import LightsNewYear from 'src/components/LightsNewYear.vue';
import ReleaseNotePreviewDialog from 'src/components/dialogs/ReleaseNotePreviewDialog.vue';
import SnowFall from 'src/components/SnowFall.vue';
import GitLayoutDrawer from '../components/GitLayoutDrawer.vue';
import GitHeader from '../components/GitHeader.vue';

// stores
const api = useAiplanStore();
const userStore = useUserStore();
const utilsStore = useUtilsStore();
const loaderStore = useLoaderStore();
const gitStore = useGitStore();
const workspaceStore = useWorkspaceStore();

// store to refs
const { user } = storeToRefs(userStore);
const { generalLoader } = storeToRefs(loaderStore);
const { openReleaseNote } = storeToRefs(utilsStore);
const { workspaceInfo, currentWorkspaceSlug } = storeToRefs(workspaceStore);

// vars
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { auth } = storeToRefs(api);
const leftDrawerOpen = ref(false);

const setTheme = () => {
  if (userStore.getTheme === 'dark' || auth.value) {
    localStorage.setItem('dark', String(userStore.getTheme === 'dark'));
    $q.dark.set(userStore.getTheme === 'dark');
  } else $q.dark.set(false);
};

/**
 * GitLayout - упрощенный layout для Git модуля
 *
 * ВАЖНО: GitLayout отвечает за загрузку данных workspace и Git конфигурации.
 *
 * GitLayout выполняет:
 * 1. Проверку авторизации пользователя
 * 2. Загрузку информации о workspace из route.params
 * 3. Загрузку Git-специфичной конфигурации
 * 4. Загрузку utils конфигурации (включая isEnabledJitsi)
 * 5. Установку темы
 * 6. Гарантированный сброс loader
 */
onBeforeMount(async () => {
  try {
    // 1. Проверка авторизации
    // Если пользователь не загружен, попытаться загрузить
    if (!user.value || !user.value.id) {
      console.warn('[GitLayout] User not loaded, attempting to load...');
      try {
        await userStore.getUserInfo();
      } catch (error) {
        console.error('[GitLayout] Failed to load user info:', error);
        // Если не авторизован - редирект на страницу логина
        router.push('/signin');
        return;
      }
    }

    // 1.5. КРИТИЧЕСКИ ВАЖНО: Загрузка utils конфигурации (isEnabledJitsi и др.)
    // Без этого кнопка конференции не отобразится в GitSearchPanel
    try {
      await utilsStore.getVersion();
      console.log('[GitLayout] Utils config loaded (Jitsi, demo, etc.)');
    } catch (error) {
      console.error('[GitLayout] Failed to load utils config:', error);
      // Не блокируем UI из-за ошибки utils конфигурации
    }

    // 2. КРИТИЧЕСКИ ВАЖНО: Загрузка workspaceInfo
    // Без этого MainHeader не отобразит верхнюю панель (из-за v-if="workspaceInfo")
    const workspaceSlug = route.params.workspace as string;
    if (workspaceSlug && workspaceSlug !== 'undefined') {
      currentWorkspaceSlug.value = workspaceSlug;

      // Загружаем workspaceInfo только если еще не загружен или это другой workspace
      if (!workspaceInfo.value || workspaceInfo.value.slug !== workspaceSlug) {
        try {
          await workspaceStore.getWorkspaceInfo(workspaceSlug);
          console.log('[GitLayout] Workspace info loaded:', workspaceSlug);
        } catch (error: any) {
          console.error('[GitLayout] Failed to load workspace info:', error);

          // Обработка ошибок доступа
          if (error?.response?.status === 403) {
            router.push('/access-denied');
            return;
          }
          if (error?.response?.status === 404) {
            router.push('/not-found');
            return;
          }

          $q.notify({
            type: 'negative',
            message: 'Не удалось загрузить информацию о workspace',
            caption: error?.response?.data?.message || error.message,
          });
          return;
        }
      }
    } else {
      console.error('[GitLayout] No workspace slug in route params');
      router.push('/');
      return;
    }

    // 3. Загрузка Git конфигурации (если еще не загружена)
    if (!gitStore.configLoaded) {
      try {
        await gitStore.fetchGitConfig();
        console.log('[GitLayout] Git config loaded successfully');
      } catch (error) {
        console.error('[GitLayout] Failed to load Git config:', error);
        // Не блокируем UI из-за ошибки Git конфигурации
        // Пользователь все равно может работать с Git модулем
        $q.notify({
          type: 'warning',
          message: 'Не удалось загрузить конфигурацию Git',
          caption: 'Некоторые функции могут быть недоступны',
        });
      }
    }

    // 4. Установка темы (наследуется из user store)
    setTheme();

    console.log('[GitLayout] Initialization complete');
  } catch (error) {
    console.error('[GitLayout] Unexpected initialization error:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка инициализации Git модуля',
      caption: error instanceof Error ? error.message : String(error),
    });
  } finally {
    // КРИТИЧЕСКИ ВАЖНО: явно сбросить loader в любом случае
    // Это предотвращает бесконечную загрузку при любых ошибках
    loaderStore.stopLoading();
  }
});

// Watch для обновления темы при изменении auth
watch(
  () => auth.value,
  () => {
    setTheme();
  },
  {
    deep: true,
  },
);

// Watch для обновления темы при изменении пользователя
watch(
  () => user.value,
  () => {
    setTheme();
  },
  {
    deep: true,
  },
);

// Watch для обновления workspaceInfo при изменении workspace в route
watch(
  () => route.params.workspace,
  async (newWorkspaceSlug) => {
    if (
      newWorkspaceSlug &&
      newWorkspaceSlug !== 'undefined' &&
      newWorkspaceSlug !== workspaceInfo.value?.slug
    ) {
      currentWorkspaceSlug.value = newWorkspaceSlug as string;
      try {
        await workspaceStore.getWorkspaceInfo(newWorkspaceSlug as string);
        console.log('[GitLayout] Workspace switched to:', newWorkspaceSlug);
      } catch (error: any) {
        console.error('[GitLayout] Failed to switch workspace:', error);
        if (error?.response?.status === 403) {
          router.push('/access-denied');
        } else if (error?.response?.status === 404) {
          router.push('/not-found');
        }
      }
    }
  },
);

useMeta({
  title: 'АИПлан | Git Репозитории',
});

const isSnowEnable = computed(() => localStorage.getItem('snow') === 'enable');

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>

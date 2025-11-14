<template>
  <div class="menu">
    <!-- Верхний блок: scrollable контент (репозитории, формы, документы) -->
    <div class="menu-content-scrollable">
      <!-- Git Repositories в левом меню -->
      <NavMenuGitRepositories />

      <NavMenuForms v-if="!isAIDoc" />
      <NavMenuAIDocs
        v-if="isAIDoc && currentWorkspaceSlug"
        filterBy="favorites"
        @updateFavoriteState="updateFavoriteState"
      />
      <NavMenuAIDocs
        v-if="isAIDoc && currentWorkspaceSlug"
        ref="docsMenu"
        filterBy="docs"
      />
    </div>

    <!-- Нижний блок: фиксированный контент (конференция, помощь) -->
    <div class="bottom-menu">
      <JitsiDialog v-if="!isDemo && isEnabledJitsi" class="jitsi-menu-item"></JitsiDialog>
      <q-item v-if="isDemo" clickable class="menu-item centered-horisontally jitsi-menu-item">
        <q-item-section avatar> <UsersIcon /> </q-item-section>
        <q-item-section> Конференции </q-item-section>
        <HintTooltip>
          Функционал конференций доступен в полной версии
        </HintTooltip>
      </q-item>
      <NavMenuBottomBarHelpAndSupport />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUtilsStore } from 'src/stores/utils-store';

import UsersIcon from 'src/components/icons/UsersIcon.vue';
import HintTooltip from 'src/components/HintTooltip.vue';

import JitsiDialog from 'src/components/dialogs/JitsiDialog.vue';
import NavMenuGitRepositories from './NavMenuGitRepositories.vue';
import NavMenuForms from 'src/components/menu/NavMenuForms.vue';
import NavMenuBottomBarHelpAndSupport from 'src/components/menu/NavMenuBottomBarHelpAndSupport.vue';
import NavMenuAIDocs from 'src/components/menu/NavMenuAIDocs.vue';
import { useRoute } from 'vue-router';
import { computed, ref, onMounted } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace-store';

const route = useRoute();
const utilsStore = useUtilsStore();
const workspaceStore = useWorkspaceStore();
const { isDemo, isEnabledJitsi } = storeToRefs(utilsStore);
const { currentWorkspaceSlug } = storeToRefs(workspaceStore);
const docsMenu = ref();
const isAIDoc = computed(() => route.fullPath.includes('aidoc'));

/**
 * КРИТИЧЕСКИ ВАЖНО: Загрузка utils конфигурации при монтировании компонента.
 *
 * Проблема: При refresh страницы /demo-ws/git компонент GitExpansionGroup монтируется
 * РАНЬШЕ, чем GitLayout.vue успевает вызвать utilsStore.getVersion().
 * Это приводит к тому, что isEnabledJitsi имеет дефолтное значение false,
 * и элемент "Конференция" не отображается.
 *
 * Решение: Явно вызываем getVersion() при монтировании компонента,
 * если конфигурация еще не загружена (isEnabledJitsi === false).
 */
onMounted(async () => {
  // Если конфигурация еще не загружена (дефолтное значение)
  if (!isEnabledJitsi.value && !isDemo.value) {
    try {
      await utilsStore.getVersion();
      console.log('[GitExpansionGroup] Utils config loaded (Jitsi enabled:', isEnabledJitsi.value, ')');
    } catch (error) {
      console.error('[GitExpansionGroup] Failed to load utils config:', error);
      // Не блокируем UI, просто логируем ошибку
    }
  }
});

const updateFavoriteState = (id: string, state: boolean) => {
  docsMenu.value.setFavoriteState(id, state);
};
</script>

<style scoped lang="scss">
.menu {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  width: 300px;
  height: 100%;
}

// Верхний блок: НЕ растягивается, занимает только размер контента
// Когда репозитории схлопнуты - минимальный размер
// Когда раскрыты - растет по содержимому, но не больше доступного пространства
.menu-content-scrollable {
  flex: 0 1 auto; // flex-grow: 0 (НЕ растягиваться!), flex-shrink: 1, flex-basis: auto
  overflow-y: auto; // Скролл при переполнении
  overflow-x: hidden; // Скрываем горизонтальный скролл
  max-height: 100%; // Ограничиваем максимальную высоту
}

// Нижний блок: фиксированный, прижат к низу
.bottom-menu {
  flex: 0 0 auto; // flex-grow: 0, flex-shrink: 0, flex-basis: auto
  margin-top: auto; // Прижимаем к низу
}

// Стиль для элемента "Конференция" - добавляем бордер сверху
.jitsi-menu-item {
  border-top: 1px solid var(--darkest-border-color);
}
</style>

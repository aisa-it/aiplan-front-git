<template>
  <div class="extended-search-wrapper">
    <q-btn
      v-if="isEnabledJitsi"
      flat
      dense
      class="btn-only-icon-sm bordered"
      @click="openConference"
    >
      <ConferenceIcon />
      <q-tooltip>Конференция</q-tooltip>
    </q-btn>
    <WorkspaceNotifications />
    <GitCreateButton />
    <q-btn
      flat
      dense
      round
      icon="vpn_key"
      class="btn-only-icon-sm bordered"
      :to="`/${workspaceSlug}/git/ssh-keys`"
      data-id="ssh-keys-button"
    >
      <q-tooltip>SSH Keys</q-tooltip>
    </q-btn>
    <ProfileButton data-id="profile-button-search-panel" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUtilsStore } from 'src/stores/utils-store';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import ProfileButton from 'src/components/ProfileButton.vue';
import WorkspaceNotifications from 'src/modules/workspace-notifications/ui/WorkspaceNotifications.vue';
import ConferenceIcon from 'src/components/icons/ConferenceIcon.vue';
import GitCreateButton from './GitCreateButton.vue';
import { onMounted, computed } from 'vue';

const utilsStore = useUtilsStore();
const workspaceStore = useWorkspaceStore();
const { isEnabledJitsi } = storeToRefs(utilsStore);
const { workspaceInfo } = storeToRefs(workspaceStore);

// Workspace slug для навигации
const workspaceSlug = computed(() => workspaceInfo.value?.slug || '');

/**
 * Загрузка utils конфигурации при монтировании компонента.
 * Это гарантирует, что кнопка конференции появится после refresh страницы.
 */
onMounted(async () => {
  if (!isEnabledJitsi.value) {
    try {
      await utilsStore.getVersion();
      console.log('[GitSearchPanel] Utils config loaded (Jitsi enabled:', isEnabledJitsi.value, ')');
    } catch (error) {
      console.error('[GitSearchPanel] Failed to load utils config:', error);
    }
  }
});

function openConference() {
  window.open('/conf/');
}
</script>

<style scoped lang="scss">
.extended-search-wrapper {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
}
</style>

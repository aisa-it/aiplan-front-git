<template>
  <q-btn
    :class="Screen.width > 720 ? 'primary-btn-sm' : 'primary-btn-only-icon-sm'"
    flat
    dense
    no-caps
    :disable="isDisabled"
    @click="openCreateDialog"
  >
    <AddIcon :color="'#fff'" />
    <span v-if="Screen.width > 720"> Создать </span>
    <HintTooltip v-if="!gitEnabled">
      Git функционал отключен
    </HintTooltip>
  </q-btn>

  <CreateGitRepoDialog
    v-if="isGitRepoCreateOpen"
    v-model="isGitRepoCreateOpen"
  />
</template>

<script setup lang="ts">
import { Screen } from 'quasar';
import { ref, computed } from 'vue';
import { useGitConfigStore as useGitStore } from '../stores';
import AddIcon from 'src/components/icons/AddIcon.vue';
import HintTooltip from 'src/components/HintTooltip.vue';
import CreateGitRepoDialog from './CreateGitRepoDialog.vue';

// Stores
const gitStore = useGitStore();

// Local state
const isGitRepoCreateOpen = ref(false);

// Computed
const gitEnabled = computed(() => gitStore.gitEnabled);

const isDisabled = computed(() => {
  // Кнопка недоступна если Git отключен
  return !gitEnabled.value;
});

// Methods
const openCreateDialog = () => {
  isGitRepoCreateOpen.value = true;
};
</script>

<template>
  <div class="row git-repo-link" style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
    <q-item
      class="git-repo-link__item row items-center"
      tag="a"
      target="_self"
      :active="isActive"
      :to="repositoryUrl"
      clickable
      v-ripple
    >
      <q-item-section avatar>
        <GitIcon
          :width="20"
          :height="20"
          :color="isActive ? '#3f75ff' : '#9e9e9e'"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label class="abbriviated-text">{{ repository.name }}</q-item-label>
        <q-item-label v-if="repository.description" caption lines="1">
          {{ repository.description }}
        </q-item-label>
        <HintTooltip anchor="bottom start" self="bottom start" :offset="[0, 42]">
          {{ repository.name }}
          <template v-if="repository.description">
            <br />
            {{ repository.description }}
          </template>
        </HintTooltip>
      </q-item-section>

      <q-space />

      <!-- Private badge -->
      <q-item-section v-if="repository.private" side>
        <q-badge color="orange" outline dense>
          <q-icon name="mdi-lock" size="xs" />
        </q-badge>
      </q-item-section>

      <!-- Actions menu -->
      <div style="display: flex; align-items: center">
        <q-btn
          class="git-repo-link__btn"
          flat
          icon="more_horiz"
          style="min-height: 18px !important; min-width: 18px; font-size: 12px; padding: 0; color: gray;"
          @click.prevent
        >
          <q-menu>
            <q-list style="min-width: 225px;">
              <q-item clickable v-close-popup @click="goToSettings">
                <q-item-section avatar>
                  <SettingsIcon :width="16" :height="16" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Настройки</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="copyRepositoryLink">
                <q-item-section avatar>
                  <LinkIcon :width="16" :height="16" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Скопировать ссылку</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <HintTooltip>Действия с репозиторием</HintTooltip>
        </q-btn>
      </div>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import GitIcon from 'src/components/icons/GitIcon.vue';
import SettingsIcon from 'src/components/icons/SettingsIcon.vue';
import LinkIcon from 'src/components/icons/LinkIcon.vue';
import HintTooltip from 'src/components/HintTooltip.vue';

// Props
interface Props {
  repository: {
    name: string;
    description?: string;
    private?: boolean;
  };
}

const props = defineProps<Props>();

// Composables
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const workspaceStore = useWorkspaceStore();

// Store refs
const { currentWorkspaceSlug } = storeToRefs(workspaceStore);

// Computed
const repositoryUrl = computed(() => {
  if (!currentWorkspaceSlug.value) return '#';
  return `/${currentWorkspaceSlug.value}/git/${props.repository.name}`;
});

const isActive = computed(() => {
  // Проверяем, является ли репозиторий активным
  const pathParts = route.path.split('/');
  return pathParts.includes(props.repository.name);
});

// Methods
const goToSettings = () => {
  if (!currentWorkspaceSlug.value) {
    console.warn('[GitRepositoryLink] Cannot navigate to settings: workspace not selected');
    return;
  }

  router.push(`/${currentWorkspaceSlug.value}/git/${props.repository.name}/settings`);
};

const copyRepositoryLink = () => {
  const url = `${window.location.origin}${repositoryUrl.value}`;

  navigator.clipboard.writeText(url).then(() => {
    $q.notify({
      type: 'positive',
      message: 'Ссылка скопирована в буфер обмена',
      timeout: 2000,
    });
  }).catch((error) => {
    console.error('[GitRepositoryLink] Failed to copy link:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось скопировать ссылку',
      timeout: 2000,
    });
  });
};
</script>

<style scoped lang="scss">
.git-repo-link {
  .q-btn {
    background: none;
  }

  &__btn {
    opacity: 0;
    transition: opacity 0.2s ease;

    @media (max-width: 768px) {
      opacity: 1;
    }
  }

  &:hover &__btn {
    opacity: 1;
  }

  &__item {
    width: 100%;
  }
}

// Truncated text
.abbriviated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<template>
  <q-page v-if="loading" class="flex flex-center" style="min-height: 400px">
    <DefaultLoader />
  </q-page>
  <q-page v-else class="q-pa-md">
    <div>
      <h3 class="q-mb-none q-mt-sm word-wrap">
        Настройки репозитория {{ repositoryInfo?.name ?? '' }}
      </h3>
      <SettingsTabs
        :current-tab="settingsTab"
        :list-tabs="listTabs"
        @set="(val: number) => (settingsTab = val)"
      />

      <!-- Основная информация -->
      <div v-if="settingsTab === 0">
        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base">Название репозитория</h4>
            <p class="text-sm text-brand-secondary">Название не может быть изменено</p>
          </div>
          <div class="col q-mt-xs">
            <q-input
              disable
              dense
              label="Название репозитория"
              class="base-input"
              :model-value="repositoryInfo?.name"
            />
          </div>
        </div>

        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base">Описание</h4>
            <p class="text-sm text-brand-secondary">Краткое описание репозитория</p>
          </div>
          <div class="col q-mt-xs">
            <q-input
              v-model="description"
              dense
              label="Описание"
              type="textarea"
              rows="3"
              class="base-input"
              counter
              maxlength="500"
              disable
            />
          </div>
        </div>

        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base">Workspace</h4>
            <p class="text-sm text-brand-secondary">Рабочее пространство репозитория</p>
          </div>
          <div class="col q-mt-xs">
            <q-input
              disable
              dense
              label="Workspace"
              class="base-input"
              :model-value="workspaceSlug"
            />
          </div>
        </div>

        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base">Ветка по умолчанию</h4>
            <p class="text-sm text-brand-secondary">Основная ветка репозитория</p>
          </div>
          <div class="col q-mt-xs">
            <q-input
              disable
              dense
              label="Ветка по умолчанию"
              class="base-input"
              :model-value="repositoryInfo?.default_branch || 'main'"
            />
          </div>
        </div>

        <q-card-actions style="background-color: transparent" align="right">
          <q-btn
            flat
            no-caps
            outline
            class="secondary-btn"
            @click="saveGeneralSettings"
            :loading="savingDescription"
            disable
          >
            Сохранить
          </q-btn>
        </q-card-actions>
      </div>

      <!-- Настройки доступа -->
      <div v-if="settingsTab === 1">
        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base">Приватность</h4>
            <p class="text-sm text-brand-secondary">
              Приватные репозитории доступны только членам workspace
            </p>
          </div>
          <div class="col q-mt-xs">
            <q-toggle
              v-model="isPrivate"
              color="primary"
              :loading="savingPrivacy"
              label="Приватный репозиторий"
              @update:model-value="savePrivacy"
              disable
            />
          </div>
        </div>

        <div class="row mobile-block q-mt-md" v-if="isPrivate">
          <div class="col-12">
            <q-banner class="bg-orange-1 text-orange-9" rounded dense>
              <template v-slot:avatar>
                <q-icon name="mdi-lock" color="orange" />
              </template>
              Репозиторий доступен только членам workspace <strong>{{ workspaceSlug }}</strong>
            </q-banner>
          </div>
        </div>

        <div class="row mobile-block q-mt-md" v-else>
          <div class="col-12">
            <q-banner class="bg-positive-1 text-positive-9" rounded dense>
              <template v-slot:avatar>
                <q-icon name="mdi-lock-open" color="positive" />
              </template>
              Репозиторий доступен для чтения всем пользователям системы
            </q-banner>
          </div>
        </div>
      </div>

      <!-- Управление (Опасная зона) -->
      <div v-if="settingsTab === 2">
        <div class="row mobile-block q-mt-md">
          <div class="col">
            <h4 class="text-lg font-semibold text-brand-base text-negative">
              Удалить репозиторий
            </h4>
            <p class="text-sm text-brand-secondary">
              После удаления репозиторий будет безвозвратно утерян вместе со всей историей коммитов
            </p>
          </div>
          <div class="col">
            <q-card-actions style="background-color: transparent" align="right">
              <q-btn
                no-caps
                class="delete-btn"
                @click="confirmDelete"
                :loading="deleting"
              >
                Удалить репозиторий
              </q-btn>
            </q-card-actions>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог подтверждения удаления -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Подтверждение удаления</div>
        </q-card-section>

        <q-card-section>
          <p>
            Вы действительно хотите удалить репозиторий <strong>{{ repoName }}</strong>?
          </p>
          <p class="text-negative">
            Это действие необратимо. Вся история коммитов и файлы будут удалены безвозвратно.
          </p>

          <q-input
            outlined
            v-model="deleteConfirmation"
            :label="`Введите '${repoName}' для подтверждения`"
            dense
            autofocus
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" @click="cancelDelete" />
          <q-btn
            flat
            label="Удалить"
            color="negative"
            :disable="deleteConfirmation !== repoName"
            :loading="deleting"
            @click="deleteRepository"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
// core
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

// stores
import { useGitRepositoryStore } from '../stores';

// components
import DefaultLoader from 'src/components/loaders/DefaultLoader.vue';
import SettingsTabs from 'src/shared/components/SettingsTabs.vue';

// Router & Route
const router = useRouter();
const route = useRoute();
const $q = useQuasar();

// Stores
const repoStore = useGitRepositoryStore();

// Route params
const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);

// Tabs
const settingsTab = ref(0);

const listTabs = [
  {
    name: 0,
    label: 'Основные',
  },
  {
    name: 1,
    label: 'Доступ',
  },
  {
    name: 2,
    label: 'Управление',
  },
];

// State
const loading = ref(true);
const savingDescription = ref(false);
const savingPrivacy = ref(false);
const deleting = ref(false);
const showDeleteDialog = ref(false);
const deleteConfirmation = ref('');

// Repository data
const repositoryInfo = ref<any>(null);
const description = ref('');
const isPrivate = ref(false);

// Methods
const loadRepositoryInfo = async () => {
  try {
    loading.value = true;

    // Загружаем информацию о репозитории
    await repoStore.fetchRepoInfo(workspaceSlug.value, repoName.value);

    if (repoStore.currentRepoInfo) {
      repositoryInfo.value = repoStore.currentRepoInfo;
    }

    // Дополнительно загружаем список репозиториев для получения полей private и description
    // так как GitRepositoryInfo не содержит эти поля
    await repoStore.fetchRepositories(workspaceSlug.value);

    const repo = repoStore.repositories.find(r => r.name === repoName.value);
    if (repo) {
      description.value = repo.description || '';
      isPrivate.value = repo.private || false;
    }
  } catch (error) {
    console.error('[GitRepoSettingsPage] Failed to load repository info:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить информацию о репозитории',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const saveGeneralSettings = async () => {
  if (savingDescription.value) return;

  // TODO: Implement API call to update repository description
  savingDescription.value = true;

  try {
    // Пока просто эмулируем сохранение
    await new Promise(resolve => setTimeout(resolve, 500));

    $q.notify({
      type: 'positive',
      message: 'Настройки сохранены',
      icon: 'check',
    });
  } catch (error) {
    console.error('[GitRepoSettingsPage] Failed to save settings:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось сохранить настройки',
      icon: 'error',
    });
  } finally {
    savingDescription.value = false;
  }
};

const savePrivacy = async (value: boolean) => {
  if (savingPrivacy.value) return;

  // TODO: Implement API call to update repository privacy
  savingPrivacy.value = true;

  try {
    // Пока просто эмулируем сохранение
    await new Promise(resolve => setTimeout(resolve, 500));

    $q.notify({
      type: 'positive',
      message: `Репозиторий теперь ${value ? 'приватный' : 'публичный'}`,
      icon: 'check',
    });
  } catch (error) {
    console.error('[GitRepoSettingsPage] Failed to save privacy:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить настройки приватности',
      icon: 'error',
    });

    // Откатываем изменения
    isPrivate.value = !value;
  } finally {
    savingPrivacy.value = false;
  }
};

const confirmDelete = () => {
  deleteConfirmation.value = '';
  showDeleteDialog.value = true;
};

const cancelDelete = () => {
  showDeleteDialog.value = false;
  deleteConfirmation.value = '';
};

const deleteRepository = async () => {
  if (deleteConfirmation.value !== repoName.value) {
    return;
  }

  deleting.value = true;

  try {
    // Используем существующий метод store для удаления
    await repoStore.deleteRepository(workspaceSlug.value, repoName.value);

    $q.notify({
      type: 'positive',
      message: 'Репозиторий успешно удален',
      icon: 'check',
    });

    // Перенаправляем на главную страницу Git
    router.push(`/${workspaceSlug.value}/git`);
  } catch (error) {
    console.error('[GitRepoSettingsPage] Failed to delete repository:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить репозиторий',
      icon: 'error',
    });
  } finally {
    deleting.value = false;
    showDeleteDialog.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadRepositoryInfo();
});
</script>

<style scoped lang="scss">
h4 {
  margin-top: 0;
}
</style>

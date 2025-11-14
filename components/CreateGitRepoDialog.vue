<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Создать Git репозиторий</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <!-- Имя репозитория -->
          <q-input
            v-model="formData.name"
            label="Имя репозитория *"
            hint="Только буквы, цифры, дефисы и подчеркивания"
            lazy-rules
            :rules="nameRules"
            outlined
            autofocus
          >
            <template v-slot:prepend>
              <q-icon name="mdi-git" />
            </template>
          </q-input>

          <!-- Описание -->
          <q-input
            v-model="formData.description"
            label="Описание"
            hint="Краткое описание репозитория"
            type="textarea"
            outlined
            rows="3"
            class="q-mt-md"
          >
            <template v-slot:prepend>
              <q-icon name="description" />
            </template>
          </q-input>

          <!-- Ветка по умолчанию -->
          <q-input
            v-model="formData.branch"
            label="Ветка по умолчанию"
            hint="Название основной ветки (по умолчанию: main)"
            outlined
            class="q-mt-md"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-source-branch" />
            </template>
          </q-input>

          <!-- Приватный репозиторий -->
          <q-checkbox
            v-model="formData.private"
            label="Приватный репозиторий"
            class="q-mt-md"
          >
            <q-tooltip>
              Приватные репозитории доступны только членам workspace
            </q-tooltip>
          </q-checkbox>

          <!-- Информационный баннер -->
          <q-banner
            class="bg-info text-white q-mt-md"
            rounded
            dense
          >
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            <div class="text-caption">
              После создания репозиторий будет доступен по адресу:<br />
              <strong>ssh://git@{{ sshHost }}:{{ sshPort }}/{{ workspaceSlug }}/{{ formData.name || 'repo-name' }}.git</strong>
            </div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn
            flat
            label="Отмена"
            color="grey-7"
            v-close-popup
            :disable="loading"
          />
          <q-btn
            unelevated
            type="submit"
            label="Создать"
            color="primary"
            icon="add"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import type { CreateRepositoryRequest } from '../types';

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'created': [repositoryName: string];
}>();

// Composables
const $q = useQuasar();
const gitRepoStore = useGitRepositoryStore();
const workspaceStore = useWorkspaceStore();

// State
const showDialog = ref(props.modelValue);
const loading = ref(false);

const formData = ref<CreateRepositoryRequest>({
  name: '',
  branch: 'main',
  private: false,
  description: '',
});

// Computed
const workspaceSlug = computed(() => workspaceStore.currentWorkspaceSlug || '');
const sshHost = computed(() => {
  // Можно получить из конфигурации SSH или использовать window.location.hostname
  return window.location.hostname;
});
const sshPort = computed(() => {
  // Порт SSH по умолчанию 22222 (из документации)
  return 22222;
});

// Validation rules
const nameRules = [
  (val: string) => !!val || 'Имя репозитория обязательно',
  (val: string) =>
    val.length >= 1 || 'Имя должно содержать минимум 1 символ',
  (val: string) =>
    val.length <= 100 || 'Имя не должно превышать 100 символов',
  (val: string) =>
    /^[a-zA-Z0-9_-]+$/.test(val) ||
    'Только буквы, цифры, дефисы и подчеркивания',
];

// Watch modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    showDialog.value = newValue;
  }
);

// Watch dialog changes
watch(showDialog, (newValue) => {
  emit('update:modelValue', newValue);

  // Сбрасываем форму при закрытии диалога
  if (!newValue) {
    resetForm();
  }
});

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    branch: 'main',
    private: false,
    description: '',
  };
};

const onSubmit = async () => {
  if (!workspaceSlug.value) {
    $q.notify({
      type: 'negative',
      message: 'Workspace не выбран',
      icon: 'error',
    });
    return;
  }

  loading.value = true;

  try {
    const repository = await gitRepoStore.createRepository(
      workspaceSlug.value,
      {
        name: formData.value.name,
        branch: formData.value.branch || 'main',
        private: formData.value.private,
        description: formData.value.description || '',
      }
    );

    $q.notify({
      type: 'positive',
      message: `Репозиторий "${repository.name}" успешно создан`,
      icon: 'check_circle',
      timeout: 3000,
    });

    emit('created', repository.name);
    showDialog.value = false;
  } catch (error: any) {
    console.error('Failed to create repository:', error);

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Не удалось создать репозиторий';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      icon: 'error',
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
// Дополнительные стили при необходимости
</style>

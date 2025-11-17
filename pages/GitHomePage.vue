<template>
  <q-page class="q-pa-md">
    <q-card flat>

      <!-- Главная страница Git модуля -->
      <q-card-section>
        <div class="text-center q-pa-xl">
          <q-icon name="mdi-git" size="6em" color="primary" class="q-mb-md" />
          <div class="text-h4 text-weight-light q-mb-md">
            GIT репозитории
          </div>
          <div class="text-body1 text-grey-7 q-mb-lg" style="max-width: 600px; margin: 0 auto;">
            Управление Git репозиториями {{ workspaceInfo?.name || 'workspace' }}. Выберите репозиторий из левого меню или создайте новый.
          </div>

          <!-- Статус Git -->
          <q-banner
            v-if="!gitStore.gitEnabled"
            class="bg-warning text-white q-mt-lg"
            rounded
            style="max-width: 600px; margin: 0 auto;"
          >
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            <div class="text-left">
              <strong>Git функционал отключен</strong><br />
              Обратитесь к администратору для включения функционала Git.
            </div>
          </q-banner>

          <!-- Статистика -->
          <div
            v-else-if="!loadingRepositories && repositories.length > 0"
            class="row q-col-gutter-md q-mt-lg justify-center"
            style="max-width: 800px; margin: 0 auto;"
          >
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h4 text-primary">{{ totalRepositories }}</div>
                  <div class="text-caption text-grey-7">
                    {{ totalRepositories === 1 ? 'Репозиторий' : 'Репозиториев' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h4 text-orange">
                    {{ repositories.filter(r => r.private).length }}
                  </div>
                  <div class="text-caption text-grey-7">Приватных</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h4 text-positive">
                    {{ repositories.filter(r => !r.private).length }}
                  </div>
                  <div class="text-caption text-grey-7">Публичных</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Пустой список -->
          <div
            v-else-if="!loadingRepositories && repositories.length === 0 && gitStore.gitEnabled"
            class="q-mt-lg"
          >
            <q-icon name="mdi-source-repository" size="4em" color="grey-5" class="q-mb-sm" />
            <div class="text-h6 text-grey-7">Нет репозиториев</div>
            <div class="text-body2 text-grey-6 q-mt-sm">
              Создайте первый репозиторий, нажав кнопку "Создать" в верхней панели
            </div>
          </div>

          <!-- Загрузка -->
          <div v-else-if="loadingRepositories" class="q-mt-lg">
            <q-spinner color="primary" size="3em" />
            <div class="text-grey-7 q-mt-md">Загрузка репозиториев...</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useGitConfigStore as useGitStore, useGitRepositoryStore } from '../stores';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const workspaceStore = useWorkspaceStore();
const gitStore = useGitStore(); // Для проверки gitEnabled
const gitRepoStore = useGitRepositoryStore(); // Для работы с репозиториями
const $q = useQuasar();

const { currentWorkspaceSlug, workspaceInfo } = storeToRefs(workspaceStore);

// Computed
const repositories = computed(() => gitRepoStore.repositories);
const totalRepositories = computed(() => gitRepoStore.totalRepositories);
const loadingRepositories = computed(() => gitRepoStore.loadingRepositories);

// Methods
const loadRepositories = async () => {
  if (!currentWorkspaceSlug.value) {
    console.warn('[GitHomePage] Cannot load repositories: workspace not selected');
    return;
  }

  try {
    await gitRepoStore.fetchRepositories(currentWorkspaceSlug.value);
  } catch (error) {
    console.error('[GitHomePage] Failed to load repositories:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить список репозиториев',
      icon: 'error',
    });
  }
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
// Можно использовать те же стили что и в aiplan-front
ul {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}
</style>

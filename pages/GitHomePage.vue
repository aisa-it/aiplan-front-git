<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5">
          <q-icon name="mdi-git" class="q-mr-sm" />
          Git Repositories
        </div>
        <div class="text-subtitle2 text-grey-7">
          Workspace: {{ currentWorkspaceSlug || 'не выбран' }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="q-gutter-md">
          <p class="text-body1">
            <q-icon name="check_circle" color="positive" class="q-mr-sm" />
            Git расширение успешно подключено через git submodule!
          </p>

          <p class="text-body2 text-grey-7">
            Это главная страница Git расширения. Здесь будет отображаться:
          </p>

          <ul class="text-grey-7">
            <li>Список Git репозиториев текущего workspace</li>
            <li>Поиск и фильтрация репозиториев</li>
            <li>Создание новых репозиториев</li>
            <li>Управление SSH ключами</li>
          </ul>

          <q-banner v-if="gitStore.gitEnabled" class="bg-positive text-white q-mt-md" rounded>
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            <strong>Git функционал включен</strong><br />
            Репозитории хранятся в: {{ gitStore.gitRepositoriesPath || 'не указано' }}
          </q-banner>

          <q-banner v-else class="bg-warning text-white q-mt-md" rounded>
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            <strong>Git функционал отключен</strong><br />
            Обратитесь к администратору для включения функционала Git.
          </q-banner>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Назад"
          icon="arrow_back"
          @click="goBack"
        />
        <q-space />
        <q-btn
          color="primary"
          label="Создать репозиторий"
          icon="add"
          :disable="!gitStore.gitEnabled"
          @click="createRepository"
        />
      </q-card-actions>
    </q-card>

    <!-- Статистика (заглушка) -->
    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">0</div>
            <div class="text-caption text-grey-7">Репозиториев</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-accent">0</div>
            <div class="text-caption text-grey-7">Коммитов сегодня</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive">0</div>
            <div class="text-caption text-grey-7">Активных веток</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useGitStore } from 'src/stores/git-store';
import { storeToRefs } from 'pinia';

const router = useRouter();
const $q = useQuasar();
const workspaceStore = useWorkspaceStore();
const gitStore = useGitStore();

const { currentWorkspaceSlug } = storeToRefs(workspaceStore);

/**
 * Возврат на предыдущую страницу
 */
const goBack = () => {
  router.back();
};

/**
 * Создание нового репозитория (заглушка)
 */
const createRepository = () => {
  $q.notify({
    message: 'Функция создания репозитория в разработке',
    color: 'info',
    position: 'top',
    timeout: 2000,
    icon: 'info',
  });
};
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

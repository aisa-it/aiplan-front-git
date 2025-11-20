<template>
  <q-page class="git-ssh-keys-page q-pa-md">
    <!-- Заголовок -->
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <h5 class="q-ma-none q-mb-xs">SSH Keys</h5>
          <p class="text-grey-7 q-ma-none">
            Управление SSH ключами для доступа к Git репозиториям
          </p>
        </div>
        <q-btn
          color="primary"
          label="Добавить SSH ключ"
          @click="openAddKeyDialog"
          :disable="loading"
        >
          <template v-slot:prepend>
            <AddIcon :width="18" :height="18" color="white" />
          </template>
        </q-btn>
      </div>
    </div>

    <!-- SSH Configuration Info -->
    <q-banner v-if="sshConfig" dense class="bg-blue-1 text-dark q-mb-md">
      <template v-slot:avatar>
        <InfoIcon :width="24" :height="24" color="#1976D2" />
      </template>
      <div class="text-body2">
        <strong>SSH сервер:</strong> {{ sshConfig.ssh_host }}:{{
          sshConfig.ssh_port
        }}
      </div>
    </q-banner>

    <!-- Loading состояние -->
    <div v-if="loading && sshKeys.length === 0" class="q-pa-lg text-center">
      <q-spinner color="primary" size="50px" />
      <p class="q-mt-md text-grey-7">Загрузка SSH ключей...</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && sshKeys.length === 0"
      class="empty-state q-pa-xl text-center"
    >
      <q-icon name="vpn_key" size="80px" color="grey-5" />
      <h6 class="q-mt-md q-mb-sm text-grey-7">У вас пока нет SSH ключей</h6>
      <p class="text-grey-6 q-mb-md">
        Добавьте SSH ключ для безопасного доступа к Git репозиториям
      </p>
      <q-btn
        color="primary"
        label="Добавить первый ключ"
        @click="openAddKeyDialog"
      >
        <template v-slot:prepend>
          <AddIcon :width="18" :height="18" color="white" />
        </template>
      </q-btn>
    </div>

    <!-- Таблица SSH ключей (Desktop) -->
    <q-table
      v-else-if="$q.screen.gt.sm"
      :rows="sshKeys"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :loading="loading"
      class="ssh-keys-table"
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.name }}</div>
          <div class="text-caption text-grey-7">{{ props.row.key_type }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-fingerprint="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <code class="fingerprint-text">{{ props.row.fingerprint }}</code>
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              size="sm"
              color="grey-7"
              @click="copyToClipboard(props.row.fingerprint)"
            >
              <q-tooltip>Копировать fingerprint</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-created_at="props">
        <q-td :props="props">
          {{ formatDate(props.row.created_at) }}
        </q-td>
      </template>

      <template v-slot:body-cell-last_used_at="props">
        <q-td :props="props">
          {{
            props.row.last_used_at
              ? formatDate(props.row.last_used_at)
              : 'Никогда'
          }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Удалить ключ</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Карточки SSH ключей (Mobile) -->
    <div v-else class="ssh-keys-cards q-gutter-md">
      <q-card
        v-for="key in sshKeys"
        :key="key.id"
        flat
        bordered
        class="ssh-key-card"
      >
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">{{ key.name }}</div>
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              size="sm"
              @click="confirmDelete(key)"
            />
          </div>

          <div class="q-gutter-y-xs">
            <div class="row items-center">
              <q-icon name="vpn_key" size="xs" class="q-mr-xs" />
              <span class="text-caption text-grey-7">{{ key.key_type }}</span>
            </div>

            <div class="row items-center">
              <q-icon name="fingerprint" size="xs" class="q-mr-xs" />
              <code class="fingerprint-text text-caption">{{
                key.fingerprint
              }}</code>
              <q-btn
                flat
                dense
                round
                icon="content_copy"
                size="xs"
                color="grey-7"
                @click="copyToClipboard(key.fingerprint)"
              />
            </div>

            <div class="row items-center">
              <q-icon name="schedule" size="xs" class="q-mr-xs" />
              <span class="text-caption text-grey-7"
                >Создан: {{ formatDate(key.created_at) }}</span
              >
            </div>

            <div v-if="key.last_used_at" class="row items-center">
              <q-icon name="history" size="xs" class="q-mr-xs" />
              <span class="text-caption text-grey-7"
                >Использован: {{ formatDate(key.last_used_at) }}</span
              >
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Инструкции -->
    <q-card flat bordered class="q-mt-lg instructions-card">
      <q-card-section>
        <div class="text-h6 q-mb-md">Как генерировать SSH ключи?</div>

        <div class="q-gutter-y-md">
          <div>
            <div class="text-subtitle2 q-mb-xs">1. Генерация SSH ключа</div>
            <div class="text-body2 text-grey-7 q-mb-xs">
              Используйте команду ssh-keygen для генерации нового ключа:
            </div>
            <code class="code-block"
              >ssh-keygen -t ed25519 -C "your_email@example.com"</code
            >
          </div>

          <div>
            <div class="text-subtitle2 q-mb-xs">
              2. Копирование публичного ключа
            </div>
            <div class="text-body2 text-grey-7 q-mb-xs">
              Скопируйте содержимое файла с публичным ключом:
            </div>
            <code class="code-block">cat ~/.ssh/id_ed25519.pub</code>
          </div>

          <div>
            <div class="text-subtitle2 q-mb-xs">
              3. Добавление ключа в AIPlan
            </div>
            <div class="text-body2 text-grey-7">
              Нажмите кнопку "Добавить SSH ключ" и вставьте скопированный
              публичный ключ
            </div>
          </div>

          <q-banner dense class="bg-orange-1 text-dark">
            <template v-slot:avatar>
              <AlertIcon :width="24" :height="24" color="#FF9800" />
            </template>
            <strong>Внимание:</strong> Никогда не делитесь приватным ключом
            (id_ed25519 без .pub)! Добавляйте только публичный ключ.
          </q-banner>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar, QTableColumn, copyToClipboard as qCopyToClipboard } from 'quasar';
import { storeToRefs } from 'pinia';
import { useGitSshKeysStore } from '../stores/git-ssh-keys-store';
import { useGitConfigStore } from '../stores/git-config-store';
import AddSshKeyDialog from '../components/AddSshKeyDialog.vue';
import type { SSHKey } from '../types';
import AddIcon from 'src/components/icons/AddIcon.vue';
import InfoIcon from 'src/components/icons/InfoIcon.vue';
import AlertIcon from 'src/components/icons/AlertIcon.vue';

/**
 * Страница управления SSH ключами
 *
 * Отображает список SSH ключей пользователя с возможностью добавления и удаления
 */

// Composables
const $q = useQuasar();
const sshKeysStore = useGitSshKeysStore();
const gitConfigStore = useGitConfigStore();

// State (используем storeToRefs для сохранения реактивности)
const { sshKeys, loading } = storeToRefs(sshKeysStore);

// SSH Configuration
const sshConfig = computed(() => {
  if (!gitConfigStore.sshConfigLoaded) {
    return null;
  }

  return {
    ssh_enabled: gitConfigStore.sshEnabled,
    ssh_host: gitConfigStore.sshHost,
    ssh_port: gitConfigStore.sshPort,
  };
});

// Колонки таблицы (для desktop)
const columns: QTableColumn[] = [
  {
    name: 'name',
    label: 'Название',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'fingerprint',
    label: 'Fingerprint',
    field: 'fingerprint',
    align: 'left',
    sortable: false,
  },
  {
    name: 'created_at',
    label: 'Создан',
    field: 'created_at',
    align: 'left',
    sortable: true,
  },
  {
    name: 'last_used_at',
    label: 'Последнее использование',
    field: 'last_used_at',
    align: 'left',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Действия',
    field: 'id',
    align: 'center',
    sortable: false,
  },
];

/**
 * Загрузка SSH ключей при монтировании компонента
 */
onMounted(async () => {
  console.log('[GitSshKeysPage] Component mounted, starting data loading...');

  try {
    // Загружаем SSH конфигурацию если еще не загружена
    if (!gitConfigStore.sshConfigLoaded) {
      console.log('[GitSshKeysPage] SSH config not loaded, fetching...');
      await gitConfigStore.fetchSSHConfig();
      console.log('[GitSshKeysPage] SSH config loaded:', gitConfigStore.sshConfig);
    } else {
      console.log('[GitSshKeysPage] SSH config already loaded');
    }

    // Загружаем список SSH ключей
    console.log('[GitSshKeysPage] Fetching SSH keys...');
    await sshKeysStore.fetchSshKeys();
    console.log('[GitSshKeysPage] SSH keys loaded:', {
      count: sshKeysStore.sshKeys.length,
      loading: sshKeysStore.loading,
      error: sshKeysStore.error
    });
  } catch (error) {
    console.error('[GitSshKeysPage] Failed to load SSH keys:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить список SSH ключей',
      icon: 'error',
      position: 'top',
    });
  }
});

/**
 * Открытие диалога добавления SSH ключа
 */
function openAddKeyDialog(): void {
  $q.dialog({
    component: AddSshKeyDialog,
  });
}

/**
 * Подтверждение удаления SSH ключа
 */
function confirmDelete(key: SSHKey): void {
  $q.dialog({
    title: 'Удалить SSH ключ?',
    message: `Вы уверены, что хотите удалить ключ "${key.name}"? Это действие нельзя отменить.`,
    cancel: {
      label: 'Отмена',
      color: 'grey',
      flat: true,
    },
    ok: {
      label: 'Удалить',
      color: 'negative',
    },
    persistent: true,
  }).onOk(async () => {
    try {
      await sshKeysStore.deleteSshKey(key.id);

      $q.notify({
        type: 'positive',
        message: `SSH ключ "${key.name}" успешно удален`,
        icon: 'check_circle',
        position: 'top',
      });
    } catch (error) {
      console.error('Failed to delete SSH key:', error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить SSH ключ',
        icon: 'error',
        position: 'top',
      });
    }
  });
}

/**
 * Копирование fingerprint в буфер обмена
 */
function copyToClipboard(text: string): void {
  qCopyToClipboard(text)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: 'Fingerprint скопирован в буфер обмена',
        icon: 'check_circle',
        position: 'top',
        timeout: 1000,
      });
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: 'Не удалось скопировать в буфер обмена',
        icon: 'error',
        position: 'top',
      });
    });
}

/**
 * Форматирование даты
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дн. назад`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} нед. назад`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} мес. назад`;
  } else {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
</script>

<style lang="scss" scoped>
.git-ssh-keys-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  h5 {
    font-size: 24px;
    font-weight: 600;
  }
}

.empty-state {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ssh-keys-table {
  :deep(.q-table__top) {
    padding: 12px;
  }
}

.fingerprint-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-all;
}

.ssh-key-card {
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.instructions-card {
  background-color: rgba(0, 0, 0, 0.02);
}

.code-block {
  display: block;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  white-space: nowrap;
}

code {
  font-family: 'Courier New', monospace;
}

// Responsive
@media (max-width: 600px) {
  .page-header {
    h5 {
      font-size: 20px;
    }

    .row {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 16px;
    }
  }
}
</style>

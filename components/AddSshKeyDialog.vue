<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Добавить SSH ключ</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Название ключа -->
          <q-input
            v-model="keyName"
            label="Название ключа *"
            hint="Например: Мой ноутбук, Рабочий компьютер"
            :rules="[
              (val) => !!val || 'Обязательное поле',
              (val) =>
                val.length <= 100 || 'Максимальная длина 100 символов',
            ]"
            outlined
            dense
            lazy-rules
            autofocus
          />

          <!-- Публичный ключ -->
          <q-input
            v-model="publicKey"
            label="Публичный ключ *"
            hint="Вставьте содержимое файла id_rsa.pub или id_ed25519.pub"
            type="textarea"
            :rules="[
              (val) => !!val || 'Обязательное поле',
              (val) => validateSshKey(val) || 'Некорректный формат SSH ключа',
            ]"
            outlined
            rows="5"
            lazy-rules
          />

          <!-- Инструкции -->
          <q-banner dense class="bg-blue-1 text-dark">
            <template v-slot:avatar>
              <q-icon name="info" color="primary" />
            </template>
            <div class="text-caption">
              <strong>Генерация SSH ключа:</strong><br />
              <code>ssh-keygen -t ed25519 -C "your_email@example.com"</code><br />
              <code>cat ~/.ssh/id_ed25519.pub</code>
            </div>
          </q-banner>

          <!-- Сообщение об ошибке -->
          <q-banner
            v-if="errorMessage"
            dense
            class="bg-negative text-white"
            @mouseenter="errorHovered = true"
            @mouseleave="errorHovered = false"
          >
            <template v-slot:avatar>
              <q-icon name="error" color="white" />
            </template>
            {{ errorMessage }}
          </q-banner>

          <!-- Кнопки -->
          <div class="row justify-end q-gutter-sm">
            <q-btn
              label="Отмена"
              color="grey"
              flat
              v-close-popup
              :disable="submitting"
            />
            <q-btn
              type="submit"
              label="Добавить"
              color="primary"
              :loading="submitting"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useGitSshKeysStore } from '../stores/git-ssh-keys-store';

/**
 * Диалог добавления SSH ключа
 *
 * Использует useDialogPluginComponent для интеграции с Quasar Dialog Plugin
 */

// Composables
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const sshKeysStore = useGitSshKeysStore();

// State
const keyName = ref('');
const publicKey = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const errorHovered = ref(false);

/**
 * Валидация формата SSH ключа
 *
 * Проверяет, что ключ начинается с одного из поддерживаемых типов
 * и имеет правильную структуру: тип + base64 + комментарий (опционально)
 */
function validateSshKey(key: string): boolean {
  if (!key || !key.trim()) {
    return false;
  }

  const sshKeyRegex =
    /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521) [A-Za-z0-9+/]+=*( .*)?$/;

  return sshKeyRegex.test(key.trim());
}

/**
 * Обработка отправки формы
 */
async function onSubmit(): Promise<void> {
  if (!keyName.value || !publicKey.value) {
    return;
  }

  if (!validateSshKey(publicKey.value)) {
    errorMessage.value = 'Некорректный формат SSH ключа';
    return;
  }

  submitting.value = true;
  errorMessage.value = null;

  try {
    await sshKeysStore.addSshKey(keyName.value.trim(), publicKey.value.trim());

    $q.notify({
      type: 'positive',
      message: `SSH ключ "${keyName.value}" успешно добавлен`,
      icon: 'check_circle',
      position: 'top',
    });

    // Закрываем диалог с положительным результатом
    onDialogOK();
  } catch (error: any) {
    console.error('Failed to add SSH key:', error);

    // Извлекаем сообщение об ошибке
    const detail =
      error?.response?.data?.detail || error?.response?.data?.message;

    if (detail) {
      // Проверяем типичные ошибки
      if (detail.includes('already exists') || detail.includes('duplicate')) {
        errorMessage.value = 'SSH ключ с таким отпечатком уже существует';
      } else if (detail.includes('invalid') || detail.includes('parse')) {
        errorMessage.value = 'Некорректный формат SSH ключа';
      } else {
        errorMessage.value = detail;
      }
    } else {
      errorMessage.value = 'Не удалось добавить SSH ключ. Попробуйте позже.';
    }

    $q.notify({
      type: 'negative',
      message: errorMessage.value,
      icon: 'error',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.q-banner {
  border-radius: 4px;
}
</style>

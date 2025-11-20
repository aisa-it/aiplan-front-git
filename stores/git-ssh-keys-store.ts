import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  SSHKey,
  SSHKeysListResponse,
  AddSSHKeyRequest,
} from '../types';
import { useAiplanStore } from 'src/stores/aiplan-store';

/**
 * Pinia store для управления SSH ключами пользователя
 *
 * Предоставляет CRUD операции для SSH ключей через Git API
 */
export const useGitSshKeysStore = defineStore('git-ssh-keys', () => {
  // State
  /** Список SSH ключей пользователя */
  const sshKeys = ref<SSHKey[]>([]);

  /** Общее количество SSH ключей */
  const totalKeys = ref(0);

  /** Флаг загрузки списка ключей */
  const loading = ref(false);

  /** Сообщение об ошибке */
  const error = ref<string | null>(null);

  /**
   * Загружает список SSH ключей текущего пользователя
   *
   * @returns Promise<void>
   */
  async function fetchSshKeys(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      console.log('[GitSshKeysStore] Starting SSH keys fetch...');

      const response = await api.get<SSHKeysListResponse>(
        '/api/auth/git/ssh-keys/',
      );

      console.log('[GitSshKeysStore] SSH keys API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        keysCount: response.data.keys?.length || 0,
        total: response.data.total
      });

      sshKeys.value = response.data.keys || [];
      totalKeys.value = response.data.total || 0;

      console.log('[GitSshKeysStore] SSH keys loaded:', {
        count: totalKeys.value,
        keys: sshKeys.value
      });
    } catch (err: any) {
      console.error('[GitSshKeysStore] Failed to fetch SSH keys:', {
        error: err,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });
      error.value =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Не удалось загрузить список SSH ключей';
      sshKeys.value = [];
      totalKeys.value = 0;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Добавляет новый SSH ключ
   *
   * @param name - название ключа
   * @param publicKey - публичный SSH ключ
   * @returns Promise<SSHKey> - добавленный ключ
   */
  async function addSshKey(
    name: string,
    publicKey: string,
  ): Promise<SSHKey> {
    if (!name || !publicKey) {
      throw new Error('Название и публичный ключ обязательны');
    }

    loading.value = true;
    error.value = null;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const payload: AddSSHKeyRequest = {
        name,
        public_key: publicKey,
      };

      const response = await api.post<SSHKey>(
        '/api/auth/git/ssh-keys/',
        payload,
      );

      console.log('[GitSshKeysStore] SSH key added:', response.data.name);

      // Обновляем список ключей после добавления
      await fetchSshKeys();

      return response.data;
    } catch (err: any) {
      console.error('[GitSshKeysStore] Failed to add SSH key:', err);
      error.value =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Не удалось добавить SSH ключ';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Удаляет SSH ключ по ID
   *
   * @param keyId - UUID ключа
   * @returns Promise<void>
   */
  async function deleteSshKey(keyId: string): Promise<void> {
    if (!keyId) {
      throw new Error('ID ключа обязателен');
    }

    loading.value = true;
    error.value = null;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      await api.delete(`/api/auth/git/ssh-keys/${keyId}`);

      console.log('[GitSshKeysStore] SSH key deleted:', keyId);

      // Обновляем список ключей после удаления
      await fetchSshKeys();
    } catch (err: any) {
      console.error('[GitSshKeysStore] Failed to delete SSH key:', err);
      error.value =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Не удалось удалить SSH ключ';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Сбрасывает состояние store
   */
  function reset(): void {
    sshKeys.value = [];
    totalKeys.value = 0;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    sshKeys,
    totalKeys,
    loading,
    error,

    // Actions
    fetchSshKeys,
    addSshKey,
    deleteSshKey,
    reset,
  };
});

import { defineStore } from 'pinia';
import { useAiplanStore } from 'src/stores/aiplan-store';
import type { GitConfig, SSHConfig } from '../types';

/**
 * Pinia store для управления Git конфигурацией
 *
 * Загружает конфигурацию Git сервера при старте приложения
 * и предоставляет информацию о доступности Git функционала
 */
export const useGitConfigStore = defineStore('git-config', {
  state: () => ({
    /** Включена ли Git интеграция на сервере */
    gitEnabled: false,
    /** Путь к директории с Git репозиториями на сервере */
    gitRepositoriesPath: '',
    /** Флаг успешной загрузки конфигурации */
    configLoaded: false,
    /** Флаг процесса загрузки */
    loading: false,
    /** SSH конфигурация */
    sshEnabled: false,
    sshHost: '',
    sshPort: 22222,
    /** Флаг успешной загрузки SSH конфигурации */
    sshConfigLoaded: false,
  }),

  actions: {
    /**
     * Загружает конфигурацию Git с сервера
     *
     * Вызывается автоматически при старте приложения через boot/git.ts
     *
     * @returns Promise<void>
     */
    async fetchGitConfig(): Promise<void> {
      // Избегаем повторной загрузки если уже загружено
      if (this.configLoaded) {
        return;
      }

      this.loading = true;

      try {
        const aiplanStore = useAiplanStore();
        const api = aiplanStore.api;

        const response = await api.get<GitConfig>('/api/auth/git/config/');

        this.gitEnabled = response.data.git_enabled;
        this.gitRepositoriesPath = response.data.git_repositories_path;
        this.configLoaded = true;

        console.log('[GitConfigStore] Git config loaded:', {
          enabled: this.gitEnabled,
          path: this.gitRepositoriesPath,
        });
      } catch (error) {
        console.error('[GitConfigStore] Failed to fetch Git config:', error);

        // При ошибке считаем что Git отключен
        this.gitEnabled = false;
        this.gitRepositoriesPath = '';
        this.configLoaded = true;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Загружает SSH конфигурацию с сервера
     *
     * @returns Promise<void>
     */
    async fetchSSHConfig(): Promise<void> {
      // Избегаем повторной загрузки если уже загружено
      if (this.sshConfigLoaded) {
        return;
      }

      try {
        const aiplanStore = useAiplanStore();
        const api = aiplanStore.api;

        const response = await api.get<SSHConfig>('/api/auth/git/ssh-config/');

        this.sshEnabled = response.data.ssh_enabled;
        this.sshHost = response.data.ssh_host;
        this.sshPort = response.data.ssh_port;
        this.sshConfigLoaded = true;

        console.log('[GitConfigStore] SSH config loaded:', {
          enabled: this.sshEnabled,
          host: this.sshHost,
          port: this.sshPort,
        });
      } catch (error) {
        console.error('[GitConfigStore] Failed to fetch SSH config:', error);

        // При ошибке считаем что SSH отключен
        this.sshEnabled = false;
        this.sshHost = '';
        this.sshPort = 22222;
        this.sshConfigLoaded = true;
      }
    },

    /**
     * Сбрасывает состояние store (для тестов или logout)
     */
    reset(): void {
      this.gitEnabled = false;
      this.gitRepositoriesPath = '';
      this.configLoaded = false;
      this.loading = false;
      this.sshEnabled = false;
      this.sshHost = '';
      this.sshPort = 22222;
      this.sshConfigLoaded = false;
    },
  },
});

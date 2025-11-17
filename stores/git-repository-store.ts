import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  GitRepositoryLight,
  GitRepository,
  CreateRepositoryRequest,
  GitRepositoryInfo,
} from '../types';
import { useAiplanStore } from 'src/stores/aiplan-store';

/**
 * Pinia store для управления Git репозиториями в рамках Git модуля
 *
 * Этот store изолирован от основного приложения и используется
 * только внутри Git модуля для работы с репозиториями
 */
export const useGitRepositoryStore = defineStore('git-repository', () => {
  // State
  /** Список репозиториев текущего workspace */
  const repositories = ref<GitRepositoryLight[]>([]);

  /** Общее количество репозиториев */
  const totalRepositories = ref(0);

  /** Флаг загрузки списка репозиториев */
  const loadingRepositories = ref(false);

  /** Информация о текущем репозитории */
  const currentRepoInfo = ref<GitRepositoryInfo | null>(null);

  /** Флаг загрузки информации о репозитории */
  const loadingRepoInfo = ref(false);

  /**
   * Загружает список репозиториев для workspace
   *
   * @param workspaceSlug - slug workspace
   * @returns Promise<void>
   */
  async function fetchRepositories(workspaceSlug: string): Promise<void> {
    if (!workspaceSlug) {
      console.warn(
        '[GitRepositoryStore] Cannot fetch repositories: workspace slug is empty',
      );
      return;
    }

    loadingRepositories.value = true;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const response = await api.get<{
        repositories: GitRepositoryLight[];
        total: number;
      }>(`/api/auth/git/${workspaceSlug}/repositories/`);

      repositories.value = response.data.repositories;
      totalRepositories.value = response.data.total;

      console.log('[GitRepositoryStore] Repositories loaded:', {
        workspace: workspaceSlug,
        count: totalRepositories.value,
      });
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch repositories:', error);
      repositories.value = [];
      totalRepositories.value = 0;
      throw error;
    } finally {
      loadingRepositories.value = false;
    }
  }

  /**
   * Создает новый Git репозиторий
   *
   * @param workspaceSlug - slug workspace
   * @param data - данные репозитория
   * @returns Promise<GitRepository> - созданный репозиторий
   */
  async function createRepository(
    workspaceSlug: string,
    data: CreateRepositoryRequest,
  ): Promise<GitRepository> {
    if (!workspaceSlug) {
      throw new Error('Workspace slug is required');
    }

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const response = await api.post<GitRepository>(
        `/api/auth/git/${workspaceSlug}/repositories/`,
        data,
      );

      console.log('[GitRepositoryStore] Repository created:', response.data.name);

      // Обновляем список репозиториев после создания
      await fetchRepositories(workspaceSlug);

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to create repository:', error);
      throw error;
    }
  }

  /**
   * Удаляет Git репозиторий
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @returns Promise<void>
   */
  async function deleteRepository(
    workspaceSlug: string,
    repositoryName: string,
  ): Promise<void> {
    if (!workspaceSlug || !repositoryName) {
      throw new Error('Workspace slug and repository name are required');
    }

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      await api.delete(`/api/auth/git/${workspaceSlug}/repositories/`, {
        data: { name: repositoryName },
      });

      console.log('[GitRepositoryStore] Repository deleted:', repositoryName);

      // Обновляем список репозиториев после удаления
      await fetchRepositories(workspaceSlug);
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to delete repository:', error);
      throw error;
    }
  }

  /**
   * Загружает информацию о репозитории
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @returns Promise<GitRepositoryInfo>
   */
  async function fetchRepoInfo(
    workspaceSlug: string,
    repositoryName: string,
  ): Promise<GitRepositoryInfo> {
    if (!workspaceSlug || !repositoryName) {
      throw new Error('Workspace slug and repository name are required');
    }

    loadingRepoInfo.value = true;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const response = await api.get<GitRepositoryInfo>(
        `/api/auth/git/${workspaceSlug}/repositories/${repositoryName}/info`,
      );

      currentRepoInfo.value = response.data;

      console.log('[GitRepositoryStore] Repository info loaded:', {
        workspace: workspaceSlug,
        repo: repositoryName,
        branches: response.data.branches_count,
        commits: response.data.commits_count,
      });

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch repository info:', error);
      currentRepoInfo.value = null;
      throw error;
    } finally {
      loadingRepoInfo.value = false;
    }
  }

  /**
   * Сбрасывает состояние store (для тестов или смены workspace)
   */
  function reset(): void {
    repositories.value = [];
    totalRepositories.value = 0;
    loadingRepositories.value = false;
    currentRepoInfo.value = null;
    loadingRepoInfo.value = false;
  }

  return {
    // State
    repositories,
    totalRepositories,
    loadingRepositories,
    currentRepoInfo,
    loadingRepoInfo,

    // Actions
    fetchRepositories,
    createRepository,
    deleteRepository,
    fetchRepoInfo,
    reset,
  };
});

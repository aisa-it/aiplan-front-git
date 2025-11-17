import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  GitRepositoryLight,
  GitRepository,
  CreateRepositoryRequest,
  GitRepositoryInfo,
  GitTree,
  GitBlob,
  GitBranchList,
  GitCommitHistory,
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

  /** Текущее дерево файлов */
  const currentTree = ref<GitTree | null>(null);

  /** Флаг загрузки дерева файлов */
  const loadingTree = ref(false);

  /** Содержимое текущего файла */
  const currentBlob = ref<GitBlob | null>(null);

  /** Флаг загрузки содержимого файла */
  const loadingBlob = ref(false);

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
   * Загружает дерево файлов (содержимое директории)
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @param ref - ветка/тег/коммит (optional)
   * @param path - путь к директории (optional)
   * @returns Promise<GitTree>
   */
  async function fetchTree(
    workspaceSlug: string,
    repositoryName: string,
    ref?: string,
    path?: string,
  ): Promise<GitTree> {
    if (!workspaceSlug || !repositoryName) {
      throw new Error('Workspace slug and repository name are required');
    }

    loadingTree.value = true;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const params = new URLSearchParams();
      if (ref) params.append('ref', ref);
      if (path) params.append('path', path);

      const url = `/api/auth/git/${workspaceSlug}/repositories/${repositoryName}/tree${
        params.toString() ? '?' + params.toString() : ''
      }`;

      const response = await api.get<GitTree>(url);

      currentTree.value = response.data;

      console.log('[GitRepositoryStore] Tree loaded:', {
        workspace: workspaceSlug,
        repo: repositoryName,
        ref: response.data.ref,
        path: response.data.path,
        entries: response.data.entries.length,
      });

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch tree:', error);
      currentTree.value = null;
      throw error;
    } finally {
      loadingTree.value = false;
    }
  }

  /**
   * Загружает содержимое файла
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @param path - путь к файлу (required)
   * @param ref - ветка/тег/коммит (optional)
   * @returns Promise<GitBlob>
   */
  async function fetchBlob(
    workspaceSlug: string,
    repositoryName: string,
    path: string,
    ref?: string,
  ): Promise<GitBlob> {
    if (!workspaceSlug || !repositoryName || !path) {
      throw new Error('Workspace slug, repository name and path are required');
    }

    loadingBlob.value = true;

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const params = new URLSearchParams();
      params.append('path', path);
      if (ref) params.append('ref', ref);

      const url = `/api/auth/git/${workspaceSlug}/repositories/${repositoryName}/blob?${params.toString()}`;

      const response = await api.get<GitBlob>(url);

      currentBlob.value = response.data;

      console.log('[GitRepositoryStore] Blob loaded:', {
        workspace: workspaceSlug,
        repo: repositoryName,
        path: response.data.path,
        ref: response.data.ref,
        size: response.data.size,
        is_binary: response.data.is_binary,
      });

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch blob:', error);
      currentBlob.value = null;
      throw error;
    } finally {
      loadingBlob.value = false;
    }
  }

  /**
   * Загружает список веток репозитория
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @returns Promise<GitBranchList>
   */
  async function fetchBranches(
    workspaceSlug: string,
    repositoryName: string,
  ): Promise<GitBranchList> {
    if (!workspaceSlug || !repositoryName) {
      throw new Error('Workspace slug and repository name are required');
    }

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const response = await api.get<GitBranchList>(
        `/api/auth/git/${workspaceSlug}/repositories/${repositoryName}/branches`,
      );

      console.log('[GitRepositoryStore] Branches loaded:', {
        workspace: workspaceSlug,
        repo: repositoryName,
        count: response.data.branches.length,
      });

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch branches:', error);
      throw error;
    }
  }

  /**
   * Загружает историю коммитов
   *
   * @param workspaceSlug - slug workspace
   * @param repositoryName - имя репозитория
   * @param ref - ветка/тег (optional)
   * @param limit - количество коммитов (optional)
   * @param offset - смещение для пагинации (optional)
   * @returns Promise<GitCommitHistory>
   */
  async function fetchCommits(
    workspaceSlug: string,
    repositoryName: string,
    ref?: string,
    limit?: number,
    offset?: number,
  ): Promise<GitCommitHistory> {
    if (!workspaceSlug || !repositoryName) {
      throw new Error('Workspace slug and repository name are required');
    }

    try {
      const aiplanStore = useAiplanStore();
      const api = aiplanStore.api;

      const params = new URLSearchParams();
      if (ref) params.append('ref', ref);
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());

      const url = `/api/auth/git/${workspaceSlug}/repositories/${repositoryName}/commits${
        params.toString() ? '?' + params.toString() : ''
      }`;

      const response = await api.get<GitCommitHistory>(url);

      console.log('[GitRepositoryStore] Commits loaded:', {
        workspace: workspaceSlug,
        repo: repositoryName,
        ref,
        count: response.data.commits.length,
        total: response.data.total,
      });

      return response.data;
    } catch (error) {
      console.error('[GitRepositoryStore] Failed to fetch commits:', error);
      throw error;
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
    currentTree.value = null;
    loadingTree.value = false;
    currentBlob.value = null;
    loadingBlob.value = false;
  }

  return {
    // State
    repositories,
    totalRepositories,
    loadingRepositories,
    currentRepoInfo,
    loadingRepoInfo,
    currentTree,
    loadingTree,
    currentBlob,
    loadingBlob,

    // Actions
    fetchRepositories,
    createRepository,
    deleteRepository,
    fetchRepoInfo,
    fetchTree,
    fetchBlob,
    fetchBranches,
    fetchCommits,
    reset,
  };
});

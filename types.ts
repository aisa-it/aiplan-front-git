/**
 * TypeScript типы для Git расширения
 */

/**
 * Метаданные Git репозитория (из backend API)
 */
export interface GitRepository {
  workspace: string;
  name: string;
  path: string;
  branch: string;
  private: boolean;
  description: string;
  clone_url: string;
  created_at: string;
  created_by: GitUser;
}

/**
 * Облегченная версия репозитория для списков
 */
export interface GitRepositoryLight {
  workspace: string;
  name: string;
  path: string;
  branch: string;
  private: boolean;
  description: string;
  clone_url: string;
  created_at: string;
  created_by: string; // UUID
}

/**
 * Информация о пользователе Git
 */
export interface GitUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Автор/коммиттер коммита
 */
export interface GitSignature {
  name: string;
  email: string;
  date: string;
}

/**
 * Коммит в Git репозитории
 */
export interface GitCommit {
  sha: string;
  message: string;
  author: GitSignature;
  committer: GitSignature;
  parent_shas: string[];
}

/**
 * История коммитов с пагинацией
 */
export interface GitCommitHistory {
  commits: GitCommit[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Ветка Git репозитория
 */
export interface GitBranch {
  name: string;
  sha: string;
  is_default: boolean;
}

/**
 * Список веток
 */
export interface GitBranchList {
  branches: GitBranch[];
}

/**
 * Тип записи в дереве (файл/директория)
 */
export type GitEntryType = 'file' | 'dir';

/**
 * Запись в дереве Git (файл или директория)
 */
export interface GitTreeEntry {
  name: string;
  type: GitEntryType;
  mode: string;
  size?: number;
  sha: string;
}

/**
 * Дерево Git (содержимое директории)
 */
export interface GitTree {
  ref: string;
  path: string;
  entries: GitTreeEntry[];
}

/**
 * Содержимое файла из Git
 */
export interface GitBlob {
  path: string;
  ref: string;
  size: number;
  sha: string;
  content: string;      // base64 encoded
  encoding: 'base64';
  is_binary: boolean;
}

/**
 * Информация о репозитории
 */
export interface GitRepositoryInfo {
  name: string;
  workspace: string;
  default_branch: string;
  branches_count: number;
  commits_count: number;
  size: number;
  last_commit?: GitCommit;
}

/**
 * SSH ключ
 */
export interface SSHKey {
  id: string;
  name: string;
  public_key: string;
  key_type: string;
  fingerprint: string;
  created_at: string;
  last_used_at?: string;
}

/**
 * SSH конфигурация
 */
export interface SSHConfig {
  ssh_enabled: boolean;
  ssh_host: string;
  ssh_port: number;
}

/**
 * Git конфигурация
 */
export interface GitConfig {
  git_enabled: boolean;
  git_repositories_path: string;
}

/**
 * Запрос на создание репозитория
 */
export interface CreateRepositoryRequest {
  name: string;
  branch?: string;
  private?: boolean;
  description?: string;
}

/**
 * Запрос на удаление репозитория
 */
export interface DeleteRepositoryRequest {
  name: string;
}

/**
 * Запрос на добавление SSH ключа
 */
export interface AddSSHKeyRequest {
  name: string;
  public_key: string;
}

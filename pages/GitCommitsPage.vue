<template>
  <q-page class="git-commits-page">
    <div class="q-pa-md">
      <!-- Header -->
      <div class="git-commits-page__header q-mb-lg">
        <div class="row items-center q-gutter-md">
          <!-- Back button -->
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="arrow_back"
              color="primary"
              @click="handleBack"
            >
              <q-tooltip>Назад к файлам</q-tooltip>
            </q-btn>
          </div>

          <!-- Title -->
          <div class="col">
            <h5 class="text-h5 q-my-none">
              История коммитов
            </h5>
            <div class="text-caption text-grey-7">
              {{ repoName }}
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="row items-center q-gutter-md q-mt-md">
          <!-- Branch selector -->
          <div class="col-12 col-sm-auto" style="min-width: 200px">
            <q-select
              v-model="selectedBranch"
              :options="branchOptions"
              :loading="loadingBranches"
              :disable="loadingBranches"
              outlined
              dense
              emit-value
              map-options
              label="Ветка"
              @update:model-value="handleBranchChange"
            >
              <template #prepend>
                <q-icon name="source_branch" />
              </template>
            </q-select>
          </div>

          <!-- Spacer -->
          <div class="col" />

          <!-- Refresh button -->
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="refresh"
              color="primary"
              :loading="loading"
              @click="handleRefresh"
            >
              <q-tooltip>Обновить</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="commitHistory" class="q-mt-md">
          <div class="text-body2 text-grey-7">
            Показано {{ startIndex + 1 }}-{{ endIndex }} из {{ commitHistory.total }} коммитов
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <q-banner
        v-if="error"
        class="bg-negative text-white q-mb-md"
        rounded
      >
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        <div>{{ error }}</div>
        <template #action>
          <q-btn
            flat
            color="white"
            label="Повторить"
            @click="handleRefresh"
          />
        </template>
      </q-banner>

      <!-- Commits list -->
      <GitCommitList
        :commits="commits"
        :loading="loading"
      />

      <!-- Pagination -->
      <div
        v-if="commitHistory && commitHistory.total > 0"
        class="git-commits-page__pagination q-mt-lg"
      >
        <div class="row items-center justify-center q-gutter-md">
          <!-- Previous button -->
          <div class="col-auto">
            <q-btn
              flat
              icon="chevron_left"
              label="Назад"
              color="primary"
              :disable="currentPage === 1 || loading"
              @click="handlePrevPage"
            />
          </div>

          <!-- Page info -->
          <div class="col-auto">
            <div class="text-body2 text-grey-8">
              Страница {{ currentPage }} из {{ totalPages }}
            </div>
          </div>

          <!-- Next button -->
          <div class="col-auto">
            <q-btn
              flat
              icon-right="chevron_right"
              label="Вперёд"
              color="primary"
              :disable="currentPage === totalPages || loading"
              @click="handleNextPage"
            />
          </div>
        </div>

        <!-- Page size selector -->
        <div class="row items-center justify-center q-mt-md">
          <div class="col-auto">
            <q-select
              v-model="pageSize"
              :options="pageSizeOptions"
              outlined
              dense
              emit-value
              map-options
              label="Коммитов на странице"
              style="min-width: 180px"
              @update:model-value="handlePageSizeChange"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useGitRepositoryStore } from '../stores/git-repository-store';
import type { GitCommit, GitCommitHistory, GitBranch } from '../types';
import GitCommitList from '../components/GitCommitList.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const repoStore = useGitRepositoryStore();

// Routing params
const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);

// State
const loading = ref(false);
const loadingBranches = ref(false);
const error = ref<string | null>(null);

const commitHistory = ref<GitCommitHistory | null>(null);
const branches = ref<GitBranch[]>([]);
const selectedBranch = ref<string>('');

const currentPage = ref(1);
const pageSize = ref(50);

// Page size options
const pageSizeOptions = [
  { label: '25 коммитов', value: 25 },
  { label: '50 коммитов', value: 50 },
  { label: '100 коммитов', value: 100 },
];

// Computed
const commits = computed<GitCommit[]>(() => {
  return commitHistory.value?.commits || [];
});

const totalPages = computed(() => {
  if (!commitHistory.value) return 0;
  return Math.ceil(commitHistory.value.total / pageSize.value);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value;
});

const endIndex = computed(() => {
  if (!commitHistory.value) return 0;
  return Math.min(startIndex.value + pageSize.value, commitHistory.value.total);
});

const branchOptions = computed(() => {
  return branches.value.map((branch) => ({
    label: branch.name + (branch.is_default ? ' (по умолчанию)' : ''),
    value: branch.name,
    icon: branch.is_default ? 'star' : undefined,
  }));
});

// Methods
async function loadBranches(): Promise<void> {
  if (!workspaceSlug.value || !repoName.value) {
    console.warn('[GitCommitsPage] Cannot load branches: missing params');
    return;
  }

  loadingBranches.value = true;
  error.value = null;

  try {
    const branchList = await repoStore.fetchBranches(
      workspaceSlug.value,
      repoName.value,
    );

    branches.value = branchList.branches;

    // Set default branch as selected if not already set
    if (!selectedBranch.value && branches.value.length > 0) {
      const defaultBranch = branches.value.find((b) => b.is_default);
      selectedBranch.value = defaultBranch
        ? defaultBranch.name
        : branches.value[0].name;
    }

    console.log('[GitCommitsPage] Branches loaded:', branches.value.length);
  } catch (err: any) {
    console.error('[GitCommitsPage] Failed to load branches:', err);
    error.value = 'Не удалось загрузить список веток';

    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить список веток',
      caption: err?.response?.data?.detail || err?.message || 'Неизвестная ошибка',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    loadingBranches.value = false;
  }
}

async function loadCommits(): Promise<void> {
  if (!workspaceSlug.value || !repoName.value) {
    console.warn('[GitCommitsPage] Cannot load commits: missing params');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const offset = (currentPage.value - 1) * pageSize.value;

    const history = await repoStore.fetchCommits(
      workspaceSlug.value,
      repoName.value,
      selectedBranch.value || undefined,
      pageSize.value,
      offset,
    );

    commitHistory.value = history;

    console.log('[GitCommitsPage] Commits loaded:', {
      count: history.commits.length,
      total: history.total,
      page: currentPage.value,
    });
  } catch (err: any) {
    console.error('[GitCommitsPage] Failed to load commits:', err);
    error.value = 'Не удалось загрузить историю коммитов';

    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить историю коммитов',
      caption: err?.response?.data?.detail || err?.message || 'Неизвестная ошибка',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    loading.value = false;
  }
}

function handleBranchChange(): void {
  console.log('[GitCommitsPage] Branch changed to:', selectedBranch.value);

  // Reset to first page when branch changes
  currentPage.value = 1;

  // Reload commits
  loadCommits();
}

function handlePrevPage(): void {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadCommits();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function handleNextPage(): void {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadCommits();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function handlePageSizeChange(): void {
  console.log('[GitCommitsPage] Page size changed to:', pageSize.value);

  // Reset to first page when page size changes
  currentPage.value = 1;

  // Reload commits
  loadCommits();
}

function handleRefresh(): void {
  console.log('[GitCommitsPage] Refreshing commits...');
  loadCommits();
}

function handleBack(): void {
  router.push({
    name: 'git-repo',
    params: {
      workspace: workspaceSlug.value,
      repoName: repoName.value,
    },
  });
}

// Load data on mount
onMounted(async () => {
  console.log('[GitCommitsPage] Component mounted:', {
    workspace: workspaceSlug.value,
    repo: repoName.value,
  });

  // Load branches first
  await loadBranches();

  // Then load commits
  await loadCommits();
});

// Watch for route changes (e.g., when navigating between repos)
watch(
  () => [workspaceSlug.value, repoName.value],
  async ([newWorkspace, newRepo], [oldWorkspace, oldRepo]) => {
    if (newWorkspace !== oldWorkspace || newRepo !== oldRepo) {
      console.log('[GitCommitsPage] Route changed, reloading data');

      // Reset state
      currentPage.value = 1;
      selectedBranch.value = '';
      commitHistory.value = null;
      branches.value = [];

      // Reload data
      await loadBranches();
      await loadCommits();
    }
  },
);
</script>

<style lang="scss" scoped>
.git-commits-page {
  &__header {
    h5 {
      line-height: 1.2;
    }
  }

  &__pagination {
    padding-bottom: 24px;
  }
}

// Mobile responsive
@media (max-width: 600px) {
  .git-commits-page {
    &__header {
      h5 {
        font-size: 20px;
      }
    }
  }
}
</style>

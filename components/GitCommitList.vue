<template>
  <div class="git-commit-list">
    <!-- Loading state -->
    <div v-if="loading" class="git-commit-list__loading">
      <q-skeleton
        v-for="i in 5"
        :key="i"
        type="rect"
        height="120px"
        class="q-mb-md"
        bordered
      />
    </div>

    <!-- Empty state -->
    <div v-else-if="!commits || commits.length === 0" class="git-commit-list__empty">
      <div class="text-center q-pa-xl">
        <q-icon
          name="commit"
          size="80px"
          color="grey-5"
          class="q-mb-md"
        />
        <div class="text-h6 text-grey-7 q-mb-sm">
          В этой ветке пока нет коммитов
        </div>
        <div class="text-body2 text-grey-6">
          Создайте первый коммит командой <code class="git-command">git commit</code>
        </div>
      </div>
    </div>

    <!-- Commits list -->
    <q-list v-else class="git-commit-list__list" separator>
      <q-item
        v-for="(commit, index) in commits"
        :key="commit.sha"
        class="git-commit-list__item"
      >
        <q-item-section>
          <GitCommitCard :commit="commit" />
        </q-item-section>

        <!-- Separator between commits (except last) -->
        <q-separator
          v-if="index < commits.length - 1"
          class="q-my-md"
        />
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import type { GitCommit } from '../types';
import GitCommitCard from './GitCommitCard.vue';

interface Props {
  commits: GitCommit[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});
</script>

<style lang="scss" scoped>
.git-commit-list {
  width: 100%;

  &__loading {
    width: 100%;
  }

  &__empty {
    width: 100%;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;

    .git-command {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 14px;
      color: #333;
    }
  }

  &__list {
    width: 100%;
  }

  &__item {
    padding: 0;
    min-height: auto;

    // Remove default q-item padding
    :deep(.q-item__section) {
      padding: 0;
    }
  }
}

// Dark mode adjustments
body.body--dark {
  .git-commit-list {
    &__empty {
      .git-command {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ddd;
      }
    }
  }
}

// Mobile responsive
@media (max-width: 600px) {
  .git-commit-list {
    &__empty {
      min-height: 300px;
      padding: 0 16px;

      .text-h6 {
        font-size: 18px;
      }

      .text-body2 {
        font-size: 14px;
      }
    }
  }
}
</style>

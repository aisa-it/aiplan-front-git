<template>
  <q-card
    flat
    bordered
    class="git-commit-card"
    :class="{ 'git-commit-card--hover': hoverable }"
  >
    <q-card-section class="q-pa-md">
      <div class="row items-start q-gutter-sm">
        <!-- Аватар автора -->
        <div class="col-auto">
          <q-avatar
            size="40px"
            :color="avatarColor"
            text-color="white"
            class="git-commit-card__avatar"
          >
            {{ authorInitial }}
          </q-avatar>
        </div>

        <!-- Основная информация о коммите -->
        <div class="col">
          <div class="row items-center q-mb-xs">
            <!-- SHA -->
            <div class="col-auto">
              <q-chip
                dense
                square
                clickable
                class="git-commit-card__sha"
                @click="handleCopySha"
              >
                <span class="text-mono">{{ shortSha }}</span>
                <q-tooltip>Нажмите чтобы скопировать полный SHA</q-tooltip>
              </q-chip>
            </div>

            <!-- Кнопка копирования -->
            <div class="col-auto q-ml-sm">
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                color="grey-7"
                @click="handleCopySha"
              >
                <q-tooltip>Скопировать SHA</q-tooltip>
              </q-btn>
            </div>

            <!-- Spacer -->
            <div class="col" />

            <!-- Относительное время -->
            <div class="col-auto">
              <span class="text-caption text-grey-7">
                {{ relativeTime }}
              </span>
            </div>
          </div>

          <!-- Сообщение коммита -->
          <div class="git-commit-card__message q-mb-sm">
            <!-- Первая строка (title) -->
            <div class="text-subtitle1 text-weight-medium q-mb-xs">
              {{ commitTitle }}
            </div>

            <!-- Остальные строки (body) - если есть -->
            <div
              v-if="commitBody"
              class="text-body2 text-grey-8 git-commit-card__body"
              :class="{ 'git-commit-card__body--expanded': bodyExpanded }"
            >
              {{ commitBody }}
            </div>

            <!-- Кнопка Expand/Collapse для длинных сообщений -->
            <q-btn
              v-if="commitBody && commitBody.length > 200"
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              :label="bodyExpanded ? 'Свернуть' : 'Развернуть'"
              class="q-mt-xs"
              @click="bodyExpanded = !bodyExpanded"
            />
          </div>

          <!-- Автор и дата -->
          <div class="row items-center text-caption text-grey-7">
            <div class="col-auto">
              <q-icon name="person" size="16px" class="q-mr-xs" />
              <span class="text-weight-medium">{{ commit.author.name }}</span>
              <span class="q-ml-xs">&lt;{{ commit.author.email }}&gt;</span>
            </div>

            <!-- Абсолютная дата при hover -->
            <div class="col-auto q-ml-md">
              <q-icon name="schedule" size="16px" class="q-mr-xs" />
              <span>
                {{ absoluteTime }}
                <q-tooltip>{{ tooltipTime }}</q-tooltip>
              </span>
            </div>
          </div>

          <!-- Parent commits (если merge commit) -->
          <div v-if="commit.parent_shas && commit.parent_shas.length > 1" class="q-mt-sm">
            <q-chip
              v-for="(parentSha, index) in commit.parent_shas"
              :key="parentSha"
              dense
              size="sm"
              color="grey-3"
              text-color="grey-8"
              class="q-mr-xs"
            >
              <q-icon name="merge_type" size="14px" class="q-mr-xs" />
              <span class="text-mono text-caption">{{ shortenSha(parentSha) }}</span>
              <q-tooltip>
                Parent {{ index + 1 }}: {{ parentSha }}
              </q-tooltip>
            </q-chip>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar, copyToClipboard } from 'quasar';
import type { GitCommit } from '../types';
import { formatRelativeTime, formatDateTime, shortenSha } from '../utils/format';

interface Props {
  commit: GitCommit;
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: true,
});

const $q = useQuasar();
const bodyExpanded = ref(false);

// Короткий SHA (первые 7 символов)
const shortSha = computed(() => shortenSha(props.commit.sha));

// Первая буква имени автора для аватара
const authorInitial = computed(() => {
  const name = props.commit.author.name;
  return name ? name.charAt(0).toUpperCase() : '?';
});

// Цвет аватара (детерминированный на основе имени)
const avatarColor = computed(() => {
  const name = props.commit.author.name;
  const colors = [
    'primary',
    'secondary',
    'accent',
    'positive',
    'negative',
    'info',
    'warning',
    'deep-purple',
    'indigo',
    'blue',
    'teal',
    'green',
    'amber',
    'orange',
    'deep-orange',
  ];

  // Простой хеш на основе имени
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
});

// Относительное время
const relativeTime = computed(() => {
  return formatRelativeTime(props.commit.author.date);
});

// Абсолютное время (короткий формат)
const absoluteTime = computed(() => {
  const date = new Date(props.commit.author.date);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

// Полное время для tooltip
const tooltipTime = computed(() => {
  return formatDateTime(props.commit.author.date);
});

// Разбиваем сообщение коммита на title и body
const commitTitle = computed(() => {
  const lines = props.commit.message.trim().split('\n');
  return lines[0];
});

const commitBody = computed(() => {
  const lines = props.commit.message.trim().split('\n');
  if (lines.length > 1) {
    // Пропускаем пустую строку после title (Git convention)
    const bodyLines = lines.slice(1).filter((line, index) => index > 0 || line.trim() !== '');
    return bodyLines.join('\n').trim();
  }
  return '';
});

// Обработчик копирования SHA
async function handleCopySha(): Promise<void> {
  try {
    await copyToClipboard(props.commit.sha);
    $q.notify({
      type: 'positive',
      message: 'SHA скопирован в буфер обмена',
      position: 'top',
      timeout: 2000,
      icon: 'content_copy',
    });
  } catch (error) {
    console.error('[GitCommitCard] Failed to copy SHA:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось скопировать SHA',
      position: 'top',
      timeout: 2000,
    });
  }
}
</script>

<style lang="scss" scoped>
.git-commit-card {
  transition: all 0.2s ease;

  &--hover {
    &:hover {
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__sha {
    cursor: pointer;
    user-select: none;
    background-color: rgba(0, 0, 0, 0.05);

    .text-mono {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  &__message {
    word-wrap: break-word;
    word-break: break-word;
  }

  &__body {
    white-space: pre-wrap;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: max-height 0.3s ease;

    &--expanded {
      max-height: none;
      overflow: visible;
    }
  }
}

// Dark mode adjustments
body.body--dark {
  .git-commit-card {
    &__sha {
      background-color: rgba(255, 255, 255, 0.1);

      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

// Mobile responsive
@media (max-width: 600px) {
  .git-commit-card {
    &__sha {
      .text-mono {
        font-size: 12px;
      }
    }
  }
}
</style>

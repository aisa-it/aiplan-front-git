<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5">Repository: {{ repoName }}</div>
        <div class="text-subtitle2 text-grey-7">
          Workspace: {{ workspaceSlug }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p class="text-body1 text-grey-7">
          Страница репозитория в разработке...
        </p>
      </q-card-section>

      <q-card-actions>
        <q-btn
          flat
          color="primary"
          label="Назад"
          icon="arrow_back"
          @click="router.back()"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);
</script>

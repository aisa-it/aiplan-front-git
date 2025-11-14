<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5">File Browser</div>
        <div class="text-subtitle2 text-grey-7">
          {{ workspaceSlug }} / {{ repoName }} @ {{ ref || 'main' }}
        </div>
        <div v-if="filePath" class="text-caption text-grey-7">
          Path: /{{ filePath }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p class="text-body1 text-grey-7">
          Браузер файлов в разработке...
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const workspaceSlug = computed(() => route.params.workspace as string);
const repoName = computed(() => route.params.repoName as string);
const ref = computed(() => route.params.ref as string);
const filePath = computed(() => {
  const pathMatch = route.params.pathMatch;
  return Array.isArray(pathMatch) ? pathMatch.join('/') : pathMatch;
});
</script>

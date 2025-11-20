import { RouteRecordRaw } from 'vue-router';

/**
 * Роуты Git расширения
 *
 * Регистрируются динамически в aiplan-front/src/router/routes.ts
 */
const gitRoutes: RouteRecordRaw[] = [
  {
    path: '/:workspace/git',
    component: () => import('./layouts/GitLayout.vue'),
    meta: {
      requiresAuth: true,
      extension: 'git',
    },
    children: [
      {
        path: '',
        name: 'git-home',
        component: () => import('./pages/GitHomePage.vue'),
        meta: {
          title: 'Git Repositories',
          breadcrumb: 'Git',
        },
      },
      {
        path: 'ssh-keys',
        name: 'git-ssh-keys',
        component: () => import('./pages/GitSshKeysPage.vue'),
        meta: {
          title: 'SSH Keys',
          breadcrumb: 'SSH Keys',
        },
      },
      {
        path: ':repoName',
        name: 'git-repo',
        component: () => import('./pages/GitRepoPage.vue'),
        meta: {
          title: 'Repository',
          breadcrumb: 'Repository',
        },
      },
      {
        path: ':repoName/commits',
        name: 'git-commits',
        component: () => import('./pages/GitCommitsPage.vue'),
        meta: {
          title: 'Commits History',
          breadcrumb: 'Commits',
        },
      },
      {
        path: ':repoName/settings',
        name: 'git-repo-settings',
        component: () => import('./pages/GitRepoSettingsPage.vue'),
        meta: {
          title: 'Repository Settings',
          breadcrumb: 'Settings',
        },
      },
      // NOTE: Роут закомментирован - файлы теперь открываются в dialog внутри GitRepoPage
      // {
      //   path: ':repoName/blob/:ref/:encodedPath',
      //   name: 'git-file-view',
      //   component: () => import('./pages/GitFilePage.vue'),
      //   meta: {
      //     title: 'View File',
      //     breadcrumb: 'File',
      //   },
      // },
    ],
  },
];

export default gitRoutes;

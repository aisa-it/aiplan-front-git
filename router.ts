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
        path: ':repoName',
        name: 'git-repo',
        component: () => import('./pages/GitRepoPage.vue'),
        meta: {
          title: 'Repository',
          breadcrumb: 'Repository',
        },
      },
      {
        path: ':repoName/tree/:ref?/*',
        name: 'git-file-browser',
        component: () => import('./pages/GitFileBrowser.vue'),
        meta: {
          title: 'Browse Files',
          breadcrumb: 'Files',
        },
      },
    ],
  },
];

export default gitRoutes;

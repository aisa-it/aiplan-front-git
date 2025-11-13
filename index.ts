import { RouteRecordRaw } from 'vue-router';
import gitRoutes from './router';

/**
 * Git расширение для AIPlan
 *
 * Экспортирует роуты для динамической регистрации в aiplan-front
 */
export interface ExtensionMetadata {
  name: string;
  version: string;
  routes: RouteRecordRaw[];
}

export const gitExtension: ExtensionMetadata = {
  name: 'git',
  version: '0.1.0',
  routes: gitRoutes,
};

export default gitExtension;
export { gitRoutes };
